/**
 * Signed session cookie. Uses Web Crypto only, so the same code verifies a
 * session in proxy.ts (edge-compatible) and in Server Components / Actions.
 *
 * Token shape: `<base64url payload>.<base64url HMAC-SHA256>`. The payload is
 * just the user id and an expiry — the role is looked up fresh on every
 * request, so changing someone's role in the database takes effect at once.
 */

export const SESSION_COOKIE = "rb_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7; // one week

export type SessionPayload = {
  /** users.id */
  sub: number;
  /** unix seconds */
  exp: number;
};

const encoder = new TextEncoder();

function requireSecret(): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error(
      "AUTH_SECRET is missing or shorter than 32 characters. Add one to .env.local — for example the output of `openssl rand -hex 32`.",
    );
  }
  return secret;
}

async function hmacKey(): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(requireSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

function toBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(value: string): Uint8Array<ArrayBuffer> {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(padded + "=".repeat((4 - (padded.length % 4)) % 4));
  // `new Uint8Array(n)` is ArrayBuffer-backed, which `crypto.subtle` requires;
  // `Uint8Array.from` is typed as possibly SharedArrayBuffer-backed.
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

export async function createSessionToken(
  userId: number,
  ttlSeconds: number = SESSION_TTL_SECONDS,
): Promise<string> {
  const payload: SessionPayload = {
    sub: userId,
    exp: Math.floor(Date.now() / 1000) + ttlSeconds,
  };
  const body = toBase64Url(encoder.encode(JSON.stringify(payload)));
  const signature = await crypto.subtle.sign("HMAC", await hmacKey(), encoder.encode(body));
  return `${body}.${toBase64Url(new Uint8Array(signature))}`;
}

/** Returns the payload for a valid, unexpired token; null for anything else. */
export async function verifySessionToken(
  token: string | undefined,
): Promise<SessionPayload | null> {
  if (!token) return null;

  const [body, signature] = token.split(".");
  if (!body || !signature) return null;

  let valid: boolean;
  try {
    valid = await crypto.subtle.verify(
      "HMAC",
      await hmacKey(),
      fromBase64Url(signature),
      encoder.encode(body),
    );
  } catch {
    return null;
  }
  if (!valid) return null;

  try {
    const payload = JSON.parse(
      new TextDecoder().decode(fromBase64Url(body)),
    ) as Partial<SessionPayload>;

    if (
      typeof payload.sub !== "number" ||
      typeof payload.exp !== "number" ||
      payload.exp <= Math.floor(Date.now() / 1000)
    ) {
      return null;
    }

    return { sub: payload.sub, exp: payload.exp };
  } catch {
    return null;
  }
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  };
}
