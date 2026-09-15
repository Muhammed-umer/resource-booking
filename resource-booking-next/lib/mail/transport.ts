import "server-only";

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import nodemailer, { type Transporter } from "nodemailer";

/**
 * SMTP mailer, same shape as Zinnia_2026's email_service.py: Gmail by default,
 * STARTTLS on 587 or implicit TLS on 465, credentials from the environment.
 *
 * When SMTP is not configured the message is written to `.mail-outbox/` as an
 * HTML file instead of being sent, so the flow can be exercised in development
 * without an account. A send failure is logged and reported, never thrown —
 * a booking must go through even if the mail server is down.
 */

const SMTP_HOST = process.env.SMTP_HOST?.trim() || "smtp.gmail.com";
const SMTP_PORT = Number(process.env.SMTP_PORT) || 587;
const SMTP_USER = process.env.SMTP_USER?.trim() ?? "";
const SMTP_PASS = (process.env.SMTP_PASS ?? process.env.SMTP_PASSWORD ?? "")
  .replace(/\s+/g, "")
  .trim();
const SMTP_FROM =
  process.env.SMTP_FROM?.trim() ||
  (SMTP_USER ? `Resource Booking <${SMTP_USER}>` : "Resource Booking <no-reply@localhost>");
const OUTBOX_DIR = process.env.MAIL_OUTBOX_DIR?.trim() || ".mail-outbox";

export const APP_BASE_URL = (process.env.APP_BASE_URL?.trim() || "http://localhost:3000").replace(/\/+$/, "");

export type MailMessage = {
  to: string | string[];
  subject: string;
  html: string;
  /** Plain-text alternative. Derived from the HTML when omitted. */
  text?: string;
};

export type MailResult =
  | { sent: true; messageId: string }
  | { sent: false; reason: "not-configured"; previewPath: string }
  | { sent: false; reason: "no-recipient" }
  | { sent: false; reason: "error"; error: string };

export function isMailConfigured(): boolean {
  return Boolean(SMTP_USER && SMTP_PASS && !SMTP_USER.startsWith("your_"));
}

let transporter: Transporter | null = null;

function getTransporter(): Transporter {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_PORT === 465,
      auth: { user: SMTP_USER, pass: SMTP_PASS },
      connectionTimeout: 15_000,
      greetingTimeout: 15_000,
      socketTimeout: 20_000,
    });
  }
  return transporter;
}

/** Crude HTML -> text for the plain part; our own templates only. */
export function stripTags(html: string): string {
  return html
    .replace(/<(script|style)[\s\S]*?<\/\1>/gi, "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|tr|li|h[1-6])>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, "\n\n")
    .split("\n")
    .map((line) => line.trim())
    .join("\n")
    .trim();
}

function slug(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60);
}

async function writePreview(message: MailMessage, recipients: string[]): Promise<string> {
  const dir = path.resolve(process.cwd(), OUTBOX_DIR);
  await mkdir(dir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const file = path.join(dir, `${stamp}-${slug(message.subject)}.html`);
  const banner = `<!-- To: ${recipients.join(", ")}\nSubject: ${message.subject}\nFrom: ${SMTP_FROM} -->\n`;
  await writeFile(file, banner + message.html, "utf8");
  return file;
}

export async function sendMail(message: MailMessage): Promise<MailResult> {
  const recipients = (Array.isArray(message.to) ? message.to : [message.to])
    .map((address) => address.trim())
    .filter(Boolean);

  if (recipients.length === 0) {
    console.warn(`[mail] "${message.subject}" has no recipient; skipped.`);
    return { sent: false, reason: "no-recipient" };
  }

  if (!isMailConfigured()) {
    const previewPath = await writePreview(message, recipients);
    console.info(
      `[mail] SMTP not configured — "${message.subject}" for ${recipients.join(", ")} saved to ${path.relative(process.cwd(), previewPath)}`,
    );
    return { sent: false, reason: "not-configured", previewPath };
  }

  try {
    const info = await getTransporter().sendMail({
      from: SMTP_FROM,
      to: recipients,
      subject: message.subject,
      text: message.text ?? stripTags(message.html),
      html: message.html,
    });
    console.info(`[mail] Sent "${message.subject}" to ${recipients.join(", ")} (${info.messageId})`);
    return { sent: true, messageId: info.messageId };
  } catch (error) {
    const description = error instanceof Error ? error.message : String(error);
    console.error(`[mail] Failed to send "${message.subject}" to ${recipients.join(", ")}: ${description}`);
    return { sent: false, reason: "error", error: description };
  }
}
