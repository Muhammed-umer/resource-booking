import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCallback) as (
  password: string,
  salt: string,
  keylen: number,
) => Promise<Buffer>;

const KEY_LENGTH = 64;

/**
 * Password hashing with Node's built-in scrypt — no extra dependency.
 * Stored form: `scrypt:<salt hex>:<hash hex>`.
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const hash = await scrypt(password, salt, KEY_LENGTH);
  return `scrypt:${salt}:${hash.toString("hex")}`;
}

export async function verifyPassword(
  password: string,
  stored: string,
): Promise<boolean> {
  const [scheme, salt, hashHex] = stored.split(":");
  if (scheme !== "scrypt" || !salt || !hashHex) return false;

  const expected = Buffer.from(hashHex, "hex");
  const actual = await scrypt(password, salt, KEY_LENGTH);

  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
