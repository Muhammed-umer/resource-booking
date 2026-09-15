/**
 * Renders every email template with sample data into docs/mail-templates/ so
 * the designs can be reviewed in a browser without sending anything.
 *
 *   npm run mail:samples
 */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import type { RequestRow } from "../lib/bookings/view";
import { cancelledEmail, decisionEmail, newRequestEmail } from "../lib/mail/templates";

const BASE_URL = "http://localhost:3000";
const OUT_DIR = path.resolve(process.cwd(), "docs/mail-templates");

const createdAt = new Date("2026-09-14T09:30:00+05:30");

const auditorium: RequestRow = {
  id: 42,
  facilityType: "AUDITORIUM",
  title: "Tech Symposium 2026",
  detail: "CSE",
  fromDate: "2026-09-25",
  toDate: "2026-09-25",
  startTime: "10:00:00",
  endTime: "13:00:00",
  status: "PENDING",
  requestedByName: "CSE",
  adminMessage: null,
  decidedBy: null,
  createdAt,
};

const seminar: RequestRow = {
  ...auditorium,
  id: 43,
  facilityType: "SEMINAR_HALL",
  title: "Guest lecture on VLSI design",
  detail: "ECE",
  requestedByName: "ECE",
  startTime: "14:00:00",
  endTime: "16:00:00",
};

const guestHouse: RequestRow = {
  id: 7,
  facilityType: "GUEST_HOUSE",
  title: "Room 2 · Dr. Meenakshi S",
  detail: "External examiner",
  fromDate: "2026-10-02",
  toDate: "2026-10-04",
  startTime: "15:00:00",
  endTime: "11:00:00",
  status: "PENDING",
  requestedByName: "CSE",
  adminMessage: null,
  decidedBy: null,
  createdAt,
};

const samples: { file: string; description: string; subject: string; html: string }[] = [];

function add(file: string, description: string, mail: { subject: string; html: string }) {
  samples.push({ file, description, ...mail });
}

add("01-new-request-auditorium.html", "Department → Resource Admin: new auditorium request",
  newRequestEmail(auditorium, `${BASE_URL}/admin/resource`));
add("02-new-request-seminar-hall.html", "Department → Seminar Admin: new seminar hall request",
  newRequestEmail(seminar, `${BASE_URL}/admin/seminar`));
add("03-new-request-guest-house.html", "Department → Resource Admin: new guest house request",
  newRequestEmail(guestHouse, `${BASE_URL}/admin/resource/guest-house`));
add("04-approved.html", "Admin → Department: request approved (with note)",
  decisionEmail({ ...auditorium, status: "APPROVED", decidedBy: "Resource Admin", adminMessage: "Approved. Collect the keys from the office by 9 AM." }, `${BASE_URL}/user/history`));
add("05-rejected.html", "Admin → Department: request rejected (with note)",
  decisionEmail({ ...seminar, status: "REJECTED", decidedBy: "Seminar Hall Admin", adminMessage: "The hall is under maintenance that week." }, `${BASE_URL}/user/history`));
add("06-approved-no-note.html", "Admin → Department: guest house approved, no note",
  decisionEmail({ ...guestHouse, status: "APPROVED", decidedBy: "Resource Admin" }, `${BASE_URL}/user/history`));
add("07-cancelled.html", "Admin → Department: approved booking cancelled (with reason)",
  cancelledEmail({ ...auditorium, status: "CANCELLED", decidedBy: "Resource Admin", adminMessage: "Hall needed for the college day function." }, `${BASE_URL}/user/history`));
add("08-cancelled-no-reason.html", "Admin → Department: cancelled, no reason given",
  cancelledEmail({ ...guestHouse, status: "CANCELLED", decidedBy: "Resource Admin" }, `${BASE_URL}/user/history`));

await mkdir(OUT_DIR, { recursive: true });
for (const sample of samples) {
  await writeFile(path.join(OUT_DIR, sample.file), sample.html, "utf8");
}

const index = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Email templates</title>
  <style>
    body { margin: 0; padding: 32px 16px; background: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #111827; }
    main { max-width: 720px; margin: 0 auto; }
    h1 { font-size: 24px; margin: 0 0 6px; }
    p { color: #6b7280; margin: 0 0 24px; }
    ol { padding: 0; margin: 0; list-style: none; display: grid; gap: 10px; }
    li { background: #fff; border-radius: 12px; padding: 14px 18px; box-shadow: 0 2px 8px rgba(15,130,140,.08); }
    a { color: #0F828C; font-weight: 700; text-decoration: none; }
    a:hover { text-decoration: underline; }
    small { display: block; color: #6b7280; margin-top: 2px; }
  </style>
</head>
<body>
  <main>
    <h1>Resource Booking — email templates</h1>
    <p>Rendered with sample data by <code>npm run mail:samples</code>. Open each to review.</p>
    <ol>
${samples.map((s) => `      <li><a href="${s.file}">${s.description}</a><small>Subject: ${s.subject}</small></li>`).join("\n")}
    </ol>
  </main>
</body>
</html>
`;
await writeFile(path.join(OUT_DIR, "index.html"), index, "utf8");

console.log(`Wrote ${samples.length} templates + index.html to ${path.relative(process.cwd(), OUT_DIR)}`);
for (const sample of samples) console.log(`  ${sample.file}  —  ${sample.subject}`);
