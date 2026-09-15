import { roleEnum, type Department, type FacilityType } from "@/lib/db/schema";
import type { AppPath } from "@/lib/routes";

/**
 * Pure authorization policy — who exists, who owns which facility, where each
 * role lands. No session or database access, so this is safe to use from
 * anywhere and can be tested without a request. Session reads live in ./roles.
 */

export const ROLES = roleEnum.enumValues;
export type Role = (typeof ROLES)[number];

export const ADMIN_ROLES = ["ADMIN_SEMINAR", "ADMIN_RESOURCE"] as const;

/**
 * Which facilities each admin role may approve or reject. This is the
 * @PreAuthorize expression from BookingController, in one place:
 *   ADMIN_SEMINAR  -> SEMINAR_HALL
 *   ADMIN_RESOURCE -> AUDITORIUM, GUEST_HOUSE
 */
export const FACILITIES_BY_ROLE: Record<Role, readonly FacilityType[]> = {
  USER: [],
  ADMIN_SEMINAR: ["SEMINAR_HALL"],
  ADMIN_RESOURCE: ["AUDITORIUM", "GUEST_HOUSE"],
};

export const ROLE_LABELS: Record<Role, string> = {
  USER: "Department",
  ADMIN_SEMINAR: "Seminar Hall Admin",
  ADMIN_RESOURCE: "Auditorium & Guest House Admin",
};

export const FACILITY_LABELS: Record<FacilityType, string> = {
  SEMINAR_HALL: "Seminar Hall",
  AUDITORIUM: "Auditorium",
  GUEST_HOUSE: "Guest House",
};

/** The signed-in person, as every page and action sees them. */
export type SessionUser = {
  userId: string;
  email: string;
  role: Role;
  name: string;
  department: Department | null;
};

export function isRole(value: unknown): value is Role {
  return typeof value === "string" && (ROLES as readonly string[]).includes(value);
}

export function isAdminRole(role: Role): role is (typeof ADMIN_ROLES)[number] {
  return role === "ADMIN_SEMINAR" || role === "ADMIN_RESOURCE";
}

export function canManageFacility(role: Role, facility: FacilityType): boolean {
  return FACILITIES_BY_ROLE[role].includes(facility);
}

/** Where each role lands after signing in. */
export function homePathForRole(role: Role): AppPath {
  switch (role) {
    case "ADMIN_SEMINAR":
      return "/admin/seminar";
    case "ADMIN_RESOURCE":
      return "/admin/resource";
    default:
      return "/user";
  }
}

export class AuthorizationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthorizationError";
  }
}
