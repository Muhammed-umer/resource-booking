import {
  date,
  index,
  integer,
  numeric,
  pgEnum,
  pgTable,
  serial,
  text,
  time,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";

/**
 * Enums mirror the Java entities on origin/Login-ui:
 * FacilityType, BookingStatus, Department and Role.
 */
export const facilityTypeEnum = pgEnum("facility_type", [
  "SEMINAR_HALL",
  "AUDITORIUM",
  "GUEST_HOUSE",
]);

export const bookingStatusEnum = pgEnum("booking_status", [
  "PENDING",
  "APPROVED",
  "REJECTED",
  /** An approved booking the admin later withdrew. Frees the slot. */
  "CANCELLED",
]);

export const departmentEnum = pgEnum("department", [
  "CSE",
  "MECHANICAL",
  "EEE",
  "ECE",
  "IT",
  "AUTOMOBILE",
  "CIVIL",
]);

export const roleEnum = pgEnum("role", [
  "USER",
  "ADMIN_SEMINAR",
  "ADMIN_RESOURCE",
]);

/**
 * Login accounts — the User entity from Login-ui. Accounts are provisioned
 * (created with `npm run user -- add`); there is no self-signup.
 */
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  /** `scrypt:<salt>:<hash>` — see lib/auth/password.ts */
  passwordHash: text("password_hash").notNull(),
  name: text("name").notNull(),
  role: roleEnum("role").notNull(),
  /** Only meaningful for USER accounts; admins have none. */
  department: departmentEnum("department"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/** Seminar hall / auditorium bookings — the Booking entity. */
export const bookings = pgTable(
  "bookings",
  {
    bookingId: serial("booking_id").primaryKey(),
    facilityType: facilityTypeEnum("facility_type").notNull(),
    eventName: text("event_name").notNull(),
    fromDate: date("from_date").notNull(),
    toDate: date("to_date").notNull(),
    startTime: time("start_time").notNull(),
    endTime: time("end_time").notNull(),
    department: departmentEnum("department").notNull(),
    bookingStatus: bookingStatusEnum("booking_status")
      .notNull()
      .default("PENDING"),
    /** users.id as text (kept as text so the column survived the auth swap). */
    requestedBy: text("requested_by").notNull(),
    /** Display name captured at request time, so the queue reads well. */
    requestedByName: text("requested_by_name").notNull(),
    adminMessage: varchar("admin_message", { length: 500 }),
    decidedBy: text("decided_by"),
    decidedAt: timestamp("decided_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("bookings_conflict_idx").on(
      table.facilityType,
      table.bookingStatus,
      table.fromDate,
      table.toDate,
    ),
    index("bookings_requested_by_idx").on(table.requestedBy),
  ],
);

/**
 * The days a hall booking actually occupies, one row per day with that day's
 * hours. This is the source of truth for conflicts and the calendar; the
 * from/to/start/end columns on `bookings` are a summary (first day, last day,
 * first day's hours) kept for sorting and the legacy API shape.
 */
export const bookingSlots = pgTable(
  "booking_slots",
  {
    id: serial("id").primaryKey(),
    bookingId: integer("booking_id")
      .notNull()
      .references(() => bookings.bookingId, { onDelete: "cascade" }),
    date: date("date").notNull(),
    startTime: time("start_time").notNull(),
    endTime: time("end_time").notNull(),
  },
  (table) => [
    uniqueIndex("booking_slots_booking_date_idx").on(table.bookingId, table.date),
    index("booking_slots_date_idx").on(table.date),
  ],
);

/** Guest house room stays — the GuestHouse entity. */
export const guestHouseBookings = pgTable(
  "guest_house_bookings",
  {
    bookingId: serial("booking_id").primaryKey(),
    guestName: text("guest_name").notNull(),
    phoneNumber: text("phone_number").notNull(),
    purpose: text("purpose"),
    fromDate: date("from_date").notNull(),
    toDate: date("to_date").notNull(),
    checkInTime: time("check_in_time"),
    checkOutTime: time("check_out_time"),
    roomNumber: integer("room_number").notNull(),
    status: bookingStatusEnum("status").notNull().default("PENDING"),
    requestedBy: text("requested_by").notNull(),
    requestedByName: text("requested_by_name").notNull(),
    fees: numeric("fees", { precision: 10, scale: 2 }),
    adminMessage: varchar("admin_message", { length: 500 }),
    decidedBy: text("decided_by"),
    decidedAt: timestamp("decided_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("guest_house_conflict_idx").on(
      table.roomNumber,
      table.status,
      table.fromDate,
      table.toDate,
    ),
    index("guest_house_requested_by_idx").on(table.requestedBy),
  ],
);

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Booking = typeof bookings.$inferSelect;
export type NewBooking = typeof bookings.$inferInsert;
export type BookingSlot = typeof bookingSlots.$inferSelect;
/** One day of a hall booking as carried around the app. */
export type Slot = { date: string; startTime: string; endTime: string };
/** A booking together with its days — what every list and mail works from. */
export type BookingWithSlots = Booking & { slots: Slot[] };
export type GuestHouseBooking = typeof guestHouseBookings.$inferSelect;
export type NewGuestHouseBooking = typeof guestHouseBookings.$inferInsert;

export type FacilityType = (typeof facilityTypeEnum.enumValues)[number];
export type BookingStatus = (typeof bookingStatusEnum.enumValues)[number];
export type Department = (typeof departmentEnum.enumValues)[number];
