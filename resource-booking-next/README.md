# Resource Booking — Next.js rewrite

A rewrite of the College Resource Booking system as a single Next.js app. It carries
over every feature on the `origin/Login-ui` branch, with the Spring Boot backend replaced
by Server Actions and Route Handlers, JPA replaced by **Drizzle** on any Postgres
(local or Supabase), and the Java JWT auth replaced by a small **email + password
login** with a signed session cookie.

## Stack

| Concern | Old (`origin/Login-ui`) | Now |
| --- | --- | --- |
| Framework | Spring Boot 3.5 + Vite/React SPA | Next.js 16 App Router (React 19) |
| Database | Local Postgres via JPA/Hibernate | Any Postgres via Drizzle ORM |
| Auth | Custom JWT, BCrypt, `JwtAuthenticationFilter` | `users` table, scrypt hashes, HMAC-signed cookie |
| Roles | `Role` enum column on `users` | Same — `users.role` |
| Styling | Tailwind 3 | Tailwind 4, same palette and animations |

No third-party auth service. Password hashing uses Node's built-in `scrypt`; the
session cookie is signed with Web Crypto so `proxy.ts` and the server share one
implementation.

## Run it

```bash
npm install
cp .env.example .env.local      # then set DATABASE_URL and AUTH_SECRET
npm run db:migrate              # creates users, bookings, guest_house_bookings
npm run user -- add admin@college.edu "Resource Admin" ADMIN_RESOURCE   # first account
npm run dev                     # http://localhost:3000
```

`.env.local` needs two values: `DATABASE_URL` (a local Postgres works, e.g.
`postgresql://postgres:postgres@localhost:5432/resource_booking_next`)
and `AUTH_SECRET` (any 32+ random characters, e.g. `openssl rand -hex 32`).

### Accounts

There is no sign-up screen and no seed data. Accounts are created from the command
line, and the password is asked for interactively:

```bash
npm run user -- add cse@college.edu CSE USER CSE                       # a department
npm run user -- add seminar@college.edu "Seminar Hall Admin" ADMIN_SEMINAR
npm run user -- add admin@college.edu "Resource Admin" ADMIN_RESOURCE   # auditorium + guest house
npm run user -- set-password cse@college.edu
npm run user -- remove cse@college.edu
npm run user -- list
```

| Role | Lands on | Notes |
| --- | --- | --- |
| `USER` | `/user` | A department. `name` is shown as the requester; `department` (required) is locked on the booking form |
| `ADMIN_SEMINAR` | `/admin/seminar` | Approves, rejects and cancels seminar hall bookings |
| `ADMIN_RESOURCE` | `/admin/resource` | Same for the auditorium and guest house |

The email on each account is where that person's notifications go (see Email
notifications below).

### Other scripts

```bash
npm run build       # production build
npm run typecheck   # tsc --noEmit
npm run verify      # 40 checks: passwords, sessions, conflicts, approvals, calendar
npm run db:studio   # Drizzle Studio
```

## How authorization works

`proxy.ts` keeps signed-out visitors out of everything except `/sign-in` and the public
calendar endpoint — pages redirect to sign-in, `/api/*` gets a `401`. Beyond that:

- **Layouts** gate whole areas — `/user/*` requires `USER`, `/admin/*` requires an admin
  role, and anyone in the wrong area is redirected to their own home.
- **Server Actions and Route Handlers** re-check on every mutation via `requireRole()`
  and `requireFacilityAdmin()`. Layout checks are for navigation; these protect data.

The cookie carries only the user id and an expiry; the role is read from the database
on every request, so changing a role takes effect immediately.

`FACILITIES_BY_ROLE` in `lib/auth/policy.ts` is the single source of truth for who
owns what, replacing the `@PreAuthorize` SpEL expressions:

| Role | May approve / reject |
| --- | --- |
| `ADMIN_SEMINAR` | Seminar Hall |
| `ADMIN_RESOURCE` | Auditorium, Guest House |

Approvals also re-check the facility in the SQL `WHERE` clause, so passing another
facility's booking id cannot slip a decision past the role check.

## Feature parity with `origin/Login-ui`

| Feature | Where it lives now |
| --- | --- |
| Seminar hall / auditorium booking | `POST /api/bookings`, `createBookingAction` |
| Guest house booking | `POST /api/guesthouse/book`, `createGuestHouseBookingAction` |
| Date + time conflict detection (approved only) | `findBookingConflicts` |
| Room date-overlap detection | `findGuestHouseConflicts` |
| Conflict message shown to the user verbatim | `BookingConflictError` → 409 / status modal |
| Calendar availability | `GET /api/calendar`, `CalendarView` |
| List all / by facility | `GET /api/bookings`, `/api/bookings/facility/{type}` |
| Pending queue | `GET /api/bookings/pending` |
| Approve / reject, scoped by role | `/api/bookings/{id}/approve`, `/reject`, `decideBookingAction` |
| Guest house approve / reject | `/api/guesthouse/approve/{id}`, `/reject/{id}` |
| Cancel an approved booking (optional reason, frees the slot) | `/api/bookings/{id}/cancel`, `/api/guesthouse/cancel/{id}`, `cancelBookingAction` |
| Per-role login endpoints | One sign-in; the account's role decides the landing route |
| Signup disabled | No signup screen; accounts are created with `npm run user -- add` |
| Home, Overall Report, History | `/user`, `/user/waiting-request`, `/user/history` |
| Admin dashboards | `/admin/seminar`, `/admin/resource`, `/admin/resource/guest-house` |
| Navbar, sidebar, resource cards, booking modal, status modal | `components/` |

Not carried over: forgot-password / reset-password email. Passwords are reset with
`npm run user -- set-password <email>`.

### Email notifications

| Event | Sent to | Template |
|---|---|---|
| Department files a request | Every admin who manages that facility (seminar admin, or resource admin for auditorium and guest house) | `newRequestEmail` |
| Admin approves or rejects | The department account that requested it (with the admin's note) | `decisionEmail` |
| Admin cancels an approved booking | The department account (with the reason) | `cancelledEmail` |

Wiring: `lib/mail/transport.ts` (Nodemailer over SMTP, Gmail by default, same
environment shape as Zinnia_2026's `email_service.py`), `lib/mail/templates.ts`
(HTML + plain text), `lib/mail/notify.ts` (recipient lookup from the `users`
table, scheduled with Next's `after()` so the response never waits on SMTP).
Both the Server Actions and the REST routes call it.

With no `SMTP_USER` / `SMTP_PASS`, mails are written to `.mail-outbox/*.html`
instead of sent, so the flow works locally without an account. A failed send is
logged and never fails the booking. Set `APP_BASE_URL` for the links in mails.

## Deliberate changes from the Java

1. **Rejected stays no longer block a room.** `GuestHouseRepository` matched on room and
   dates with no status filter, so a rejected booking locked those dates forever.
2. **The calendar reads the guest house table.** `CalendarService` looked for
   `GUEST_HOUSE` rows in the `bookings` table, which are never written there.
3. **Pending is its own calendar state.** Days read `BOOKED`, `PENDING` or `AVAILABLE`.
5. **Each day of a hall booking has its own hours.** A request is a list of day
   slots (`booking_slots`, migration `0003`, backfilled from existing rows): 10–5 on
   Friday and 9–1 on Saturday is one request. Conflicts and the calendar read the
   slots; the `bookings` row keeps first/last day and the first day's hours as a
   summary, and the old `fromDate/toDate/startTime/endTime` API shape still works
   (same hours on every day).
4. **Approved bookings can be cancelled.** A fourth status, `CANCELLED`, added in
   migration `0002`. Only the facility's admin can cancel, only from `APPROVED`, with an
   optional reason the requester sees in History. Cancelled rows never block a slot.
4. **Department is fixed by the account.** The form shows it read-only and the server
   files the request under the signed-in account's department, ignoring the body.
   Dates in the past are refused on the form (`min`) and again on the server.
5. **`requestedBy` is the real user**, not the hard-coded string `"CurrentUser"`.
6. **The pending endpoint exists.** `bookingApi.js` called `/api/bookings/pending`, but
   no such endpoint was ever written.
7. **The admin dashboards are implemented.** They were stubs commented out of the router.

## Project layout

```
app/
  actions/auth.ts            loginAction, logoutAction
  actions/bookings.ts        Server Actions (create, approve, reject, cancel)
  api/                       REST handlers mirroring the old Spring endpoints
  sign-in/                   Email + password form
  user/                      Dashboard, Overall Report, History
  admin/                     Seminar / Auditorium / Guest House queues
components/                  App shell, sign-in form, home widgets, admin cards
lib/
  auth/policy.ts             Roles, facility ownership, redirect targets (pure)
  auth/roles.ts              Session read + guards
  auth/session.ts            Signed cookie (Web Crypto)
  auth/password.ts           scrypt hash / verify
  bookings/service.ts        Conflict detection and all queries
  db/schema.ts               Drizzle schema (users, bookings, guest_house_bookings)
  validation.ts              Zod schemas for every input
drizzle/                     Generated SQL migrations
scripts/                     user.ts (accounts), verify.ts, render-mail-samples.ts
proxy.ts                     Session check on every request
```
