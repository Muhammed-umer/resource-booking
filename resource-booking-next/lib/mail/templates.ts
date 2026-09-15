import type { RequestRow } from "@/lib/bookings/view";
import { formatDateRange, formatTimeRange } from "@/lib/bookings/view";
import { FACILITY_LABEL } from "@/lib/facilities";

/**
 * HTML email templates for the three booking events. Table-based layout with
 * inline styles, which is what email clients actually render; brand colours
 * match the app (teal #0F828C).
 */

const COLLEGE = "Government College of Engineering, Erode";
const PORTAL = "Resource Booking Portal";
const TEAL = "#0F828C";

export type MailTemplate = { subject: string; html: string };

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function layout({
  eyebrow,
  eyebrowColor,
  heading,
  intro,
  rows,
  note,
  button,
  footer,
}: {
  eyebrow: string;
  eyebrowColor: string;
  heading: string;
  intro: string;
  rows: [string, string][];
  note?: { label: string; text: string } | null;
  button: { label: string; url: string };
  footer: string;
}): string {
  const detailRows = rows
    .map(
      ([label, value]) => `
        <tr>
          <td style="padding:8px 0;color:#6b7280;font-size:13px;width:38%;vertical-align:top;">${escapeHtml(label)}</td>
          <td style="padding:8px 0;color:#111827;font-size:14px;font-weight:600;vertical-align:top;">${escapeHtml(value)}</td>
        </tr>`,
    )
    .join("");

  const noteBlock = note
    ? `
        <tr>
          <td style="padding:0 28px 8px;">
            <div style="background:#f9fafb;border-left:4px solid ${TEAL};border-radius:8px;padding:12px 16px;">
              <div style="font-size:11px;letter-spacing:1px;text-transform:uppercase;color:#6b7280;font-weight:700;">${escapeHtml(note.label)}</div>
              <div style="margin-top:4px;color:#111827;font-size:14px;line-height:1.5;">${escapeHtml(note.text)}</div>
            </div>
          </td>
        </tr>`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(heading)}</title>
</head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#111827;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background:#f3f4f6;padding:28px 12px;">
    <tr>
      <td align="center">
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 18px rgba(15,130,140,0.12);">
          <tr>
            <td style="background:${TEAL};padding:24px 28px;color:#ffffff;">
              <div style="font-size:11px;letter-spacing:2px;text-transform:uppercase;opacity:0.85;">${escapeHtml(COLLEGE)}</div>
              <div style="margin-top:4px;font-size:20px;font-weight:800;">${escapeHtml(PORTAL)}</div>
            </td>
          </tr>
          <tr>
            <td style="padding:28px 28px 8px;">
              <div style="display:inline-block;background:${eyebrowColor};color:#ffffff;font-size:11px;letter-spacing:1.5px;text-transform:uppercase;font-weight:800;padding:4px 10px;border-radius:999px;">${escapeHtml(eyebrow)}</div>
              <h1 style="margin:14px 0 8px;font-size:22px;line-height:1.3;color:#111827;">${escapeHtml(heading)}</h1>
              <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#374151;">${escapeHtml(intro)}</p>
            </td>
          </tr>
          <tr>
            <td style="padding:0 28px 16px;">
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="border-top:1px solid #e5e7eb;border-bottom:1px solid #e5e7eb;">
                ${detailRows}
              </table>
            </td>
          </tr>
          ${noteBlock}
          <tr>
            <td style="padding:16px 28px 28px;">
              <a href="${escapeHtml(button.url)}" style="display:inline-block;background:${TEAL};color:#ffffff;font-weight:700;font-size:14px;text-decoration:none;padding:12px 22px;border-radius:10px;">${escapeHtml(button.label)}</a>
              <p style="margin:18px 0 0;font-size:12px;line-height:1.6;color:#9ca3af;">${escapeHtml(footer)}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function detailRows(row: RequestRow): [string, string][] {
  const isGuestHouse = row.facilityType === "GUEST_HOUSE";
  const rows: [string, string][] = [
    ["Facility", FACILITY_LABEL[row.facilityType]],
    [isGuestHouse ? "Stay" : "Event", row.title],
    [isGuestHouse ? "Purpose" : "Department", row.detail],
    ["Dates", formatDateRange(row.fromDate, row.toDate)],
  ];
  if (row.startTime && row.endTime) {
    rows.push([isGuestHouse ? "Check-in / out" : "Time", formatTimeRange(row.startTime, row.endTime)]);
  }
  rows.push(["Requested by", row.requestedByName]);
  rows.push(["Reference", `#${row.id}`]);
  return rows;
}

/** To the facility's admin(s) when a department files a request. */
export function newRequestEmail(row: RequestRow, reviewUrl: string): MailTemplate {
  const facility = FACILITY_LABEL[row.facilityType];
  return {
    subject: `New ${facility} request #${row.id} from ${row.requestedByName}`,
    html: layout({
      eyebrow: "New request",
      eyebrowColor: "#d97706",
      heading: `${row.requestedByName} has requested the ${facility}`,
      intro: "A new booking request is waiting for your decision. Review the details and approve or reject it from the admin panel.",
      rows: detailRows(row),
      button: { label: "Review request", url: reviewUrl },
      footer: "You are receiving this because you manage this facility on the Resource Booking Portal.",
    }),
  };
}

/** To the requester when an admin approves or rejects. */
export function decisionEmail(row: RequestRow, historyUrl: string): MailTemplate {
  const facility = FACILITY_LABEL[row.facilityType];
  const approved = row.status === "APPROVED";
  return {
    subject: `${facility} request #${row.id} ${approved ? "approved" : "rejected"}`,
    html: layout({
      eyebrow: approved ? "Approved" : "Rejected",
      eyebrowColor: approved ? "#15803d" : "#b91c1c",
      heading: approved
        ? `Your ${facility} booking is confirmed`
        : `Your ${facility} request was not approved`,
      intro: approved
        ? `${row.decidedBy ?? "The admin"} approved your request. The slot below is now reserved for you.`
        : `${row.decidedBy ?? "The admin"} rejected this request. If you think this is a mistake, contact the office or file a new request.`,
      rows: detailRows(row),
      note: row.adminMessage ? { label: "Note from the admin", text: row.adminMessage } : null,
      button: { label: "View in History", url: historyUrl },
      footer: "You are receiving this because this request was filed from your department account.",
    }),
  };
}

/** To the requester when an admin cancels an approved booking. */
export function cancelledEmail(row: RequestRow, historyUrl: string): MailTemplate {
  const facility = FACILITY_LABEL[row.facilityType];
  return {
    subject: `${facility} booking #${row.id} cancelled`,
    html: layout({
      eyebrow: "Cancelled",
      eyebrowColor: "#4b5563",
      heading: `Your ${facility} booking has been cancelled`,
      intro: `${row.decidedBy ?? "The admin"} cancelled this previously approved booking. The slot is no longer reserved for you.`,
      rows: detailRows(row),
      note: { label: "Reason", text: row.adminMessage || "No reason was given." },
      button: { label: "View in History", url: historyUrl },
      footer: "You are receiving this because this booking was filed from your department account.",
    }),
  };
}
