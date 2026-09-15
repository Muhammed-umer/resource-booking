/**
 * Manage accounts from the command line. There is deliberately no sign-up
 * screen, so this is how accounts are created.
 *
 *   npm run user -- add <email> <name> <role> [department]
 *   npm run user -- set-password <email>
 *   npm run user -- remove <email>
 *   npm run user -- list
 *
 * Roles: USER (a department; needs a department), ADMIN_SEMINAR, ADMIN_RESOURCE.
 * Departments: CSE, MECHANICAL, EEE, ECE, IT, AUTOMOBILE, CIVIL.
 *
 * The password is asked for interactively (or pass --password <value>).
 */
import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";

import { eq } from "drizzle-orm";

import { hashPassword } from "../lib/auth/password";
import { db } from "../lib/db";
import { departmentEnum, roleEnum, users } from "../lib/db/schema";

const ROLES = roleEnum.enumValues;
const DEPARTMENTS = departmentEnum.enumValues;

type Role = (typeof ROLES)[number];
type Department = (typeof DEPARTMENTS)[number];

function fail(message: string): never {
  console.error(`\n${message}\n`);
  console.error("Usage:");
  console.error("  npm run user -- add <email> <name> <role> [department] [--password <value>]");
  console.error("  npm run user -- set-password <email> [--password <value>]");
  console.error("  npm run user -- remove <email>");
  console.error("  npm run user -- list");
  console.error(`\nRoles: ${ROLES.join(", ")}\nDepartments: ${DEPARTMENTS.join(", ")}`);
  process.exit(1);
}

function takeOption(args: string[], name: string): string | undefined {
  const index = args.indexOf(name);
  if (index === -1) return undefined;
  const [, value] = args.splice(index, 2);
  return value;
}

async function askPassword(): Promise<string> {
  const rl = createInterface({ input: stdin, output: stdout });
  try {
    const first = await rl.question("Password (min 8 characters): ");
    const second = await rl.question("Repeat password: ");
    if (first !== second) fail("Passwords do not match.");
    return first;
  } finally {
    rl.close();
  }
}

async function resolvePassword(given: string | undefined): Promise<string> {
  const password = given ?? (await askPassword());
  if (password.length < 8) fail("Password must be at least 8 characters.");
  return password;
}

function isRole(value: string): value is Role {
  return (ROLES as readonly string[]).includes(value);
}

function isDepartment(value: string): value is Department {
  return (DEPARTMENTS as readonly string[]).includes(value);
}

async function add(args: string[]) {
  const password = takeOption(args, "--password");
  const [emailRaw, name, roleRaw, departmentRaw] = args;
  if (!emailRaw || !name || !roleRaw) fail("add needs <email> <name> <role> [department].");

  const email = emailRaw.trim().toLowerCase();
  const role = roleRaw.toUpperCase();
  if (!isRole(role)) fail(`Unknown role "${roleRaw}".`);

  const departmentInput = departmentRaw?.toUpperCase();
  if (role === "USER" && !departmentInput) fail("A USER (department) account needs a department.");
  if (departmentInput && !isDepartment(departmentInput)) fail(`Unknown department "${departmentRaw}".`);
  const department: Department | null =
    departmentInput && isDepartment(departmentInput) ? departmentInput : null;

  const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.email, email));
  if (existing) fail(`${email} already exists. Use set-password or remove.`);

  const passwordHash = await hashPassword(await resolvePassword(password));
  const [created] = await db
    .insert(users)
    .values({ email, name, role, department, passwordHash })
    .returning({ id: users.id });

  console.log(`Created #${created.id} ${email} — ${name}, ${role}${department ? ` (${department})` : ""}.`);
}

async function setPassword(args: string[]) {
  const password = takeOption(args, "--password");
  const [emailRaw] = args;
  if (!emailRaw) fail("set-password needs <email>.");
  const email = emailRaw.trim().toLowerCase();

  const passwordHash = await hashPassword(await resolvePassword(password));
  const [updated] = await db
    .update(users)
    .set({ passwordHash })
    .where(eq(users.email, email))
    .returning({ id: users.id });
  if (!updated) fail(`No account with email ${email}.`);

  console.log(`Password updated for ${email}.`);
}

async function remove(args: string[]) {
  const [emailRaw] = args;
  if (!emailRaw) fail("remove needs <email>.");
  const email = emailRaw.trim().toLowerCase();

  const [deleted] = await db.delete(users).where(eq(users.email, email)).returning({ id: users.id });
  if (!deleted) fail(`No account with email ${email}.`);

  console.log(`Removed ${email}. Bookings it filed are kept (they reference the account by id).`);
}

async function list() {
  const rows = await db
    .select({ id: users.id, email: users.email, name: users.name, role: users.role, department: users.department })
    .from(users)
    .orderBy(users.id);

  if (rows.length === 0) {
    console.log("No accounts yet. Create one with: npm run user -- add <email> <name> <role> [department]");
    return;
  }
  console.table(rows);
}

const [command, ...rest] = process.argv.slice(2);

switch (command) {
  case "add":
    await add(rest);
    break;
  case "set-password":
    await setPassword(rest);
    break;
  case "remove":
    await remove(rest);
    break;
  case "list":
    await list();
    break;
  default:
    fail(command ? `Unknown command "${command}".` : "Missing command.");
}

process.exit(0);
