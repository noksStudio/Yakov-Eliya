const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 days
export const ADMIN_SESSION_COOKIE = "admin_session";

async function getKey(secret: string) {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
}

function toBase64Url(buffer: ArrayBuffer) {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function timingSafeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return result === 0;
}

export async function createSessionToken(): Promise<string> {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret) throw new Error("Missing ADMIN_SESSION_SECRET environment variable");

  const expiry = Date.now() + SESSION_TTL_MS;
  const key = await getKey(secret);
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(String(expiry))
  );
  return `${expiry}.${toBase64Url(signature)}`;
}

export async function verifySessionToken(token: string | undefined | null): Promise<boolean> {
  if (!token) return false;
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret) return false;

  const [expiryStr, signature] = token.split(".");
  if (!expiryStr || !signature) return false;

  const expiry = Number(expiryStr);
  if (!Number.isFinite(expiry) || Date.now() > expiry) return false;

  const key = await getKey(secret);
  const expectedSignature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(expiryStr)
  );
  return timingSafeEqual(toBase64Url(expectedSignature), signature);
}

export function checkCredentials(username: string, password: string): boolean {
  const validUsername = process.env.ADMIN_USERNAME;
  const validPassword = process.env.ADMIN_PASSWORD;
  if (!validUsername || !validPassword) return false;
  return username === validUsername && password === validPassword;
}
