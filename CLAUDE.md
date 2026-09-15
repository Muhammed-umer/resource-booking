# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Layout

The application is the Next.js 16 app in `resource-booking-next/`. Work there; its own
`README.md` documents setup, scripts and architecture, and its `AGENTS.md` (written by
`next dev`) points at the bundled Next.js docs in `node_modules/next/dist/docs/`.

Run every command from `resource-booking-next/`:

```bash
npm run dev          # http://localhost:3000 — the owner usually has this running already; do not start or stop it
npm run typecheck    # tsc --noEmit
npm run build
npm run db:migrate   # drizzle-kit migrate (PostgreSQL, DATABASE_URL in .env.local)
npm run verify       # end-to-end checks through the service layer; empties the booking tables
npm run user -- add <email> <name> <role> [department]   # accounts; there is no sign-up screen
npm run mail:samples # renders the email templates to docs/mail-templates/
```

## Branches

- `main` — the Next.js app (this tree).
- `nextjs` — storage copy of the same app.
- `springboot-react` — the earlier Spring Boot + Vite/React implementation, kept for reference only.
  Its business rules (conflict detection, 409 with a plain-text message, per-facility admin roles)
  were ported into `resource-booking-next/lib/bookings/service.ts`.

## Conventions worth knowing

- Server-only DB access: `lib/db` imports `server-only`; scripts that touch it run with
  `tsx --conditions=react-server`.
- Auth is a signed cookie (`rb_session`) checked in `proxy.ts`; roles are `USER`,
  `ADMIN_SEMINAR`, `ADMIN_RESOURCE`. Seminar admin owns the seminar hall; resource admin owns the
  auditorium and guest house.
- Booking statuses: `PENDING`, `APPROVED`, `REJECTED`, `CANCELLED`. Only `APPROVED` blocks a hall slot;
  guest house rooms are blocked by `PENDING` and `APPROVED`.
- A hall booking's days live in `booking_slots` (one row per day with its own hours); that table is the
  truth for conflicts and the calendar. `bookings.from_date/to_date/start_time/end_time` is only a summary.
  Truncate `booking_slots` together with `bookings` (foreign key).
- After any test that creates bookings, leave the `bookings` and `guest_house_bookings` tables empty.
