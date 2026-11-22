import crypto from "node:crypto";

export function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

export function randomToken(bytes = 32) {
  return crypto.randomBytes(bytes).toString("base64url");
}

export function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function parseCookies(header = "") {
  return Object.fromEntries(
    header
      .split(";")
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => {
        const separator = part.indexOf("=");
        return [
          decodeURIComponent(part.slice(0, separator)),
          decodeURIComponent(part.slice(separator + 1)),
        ];
      }),
  );
}

export function sessionCookie(token, secure = false) {
  const attributes = [
    `clsa_session=${encodeURIComponent(token)}`,
    "HttpOnly",
    "SameSite=Lax",
    "Path=/",
    "Max-Age=604800",
  ];
  if (secure) attributes.push("Secure");
  return attributes.join("; ");
}

export function clearedSessionCookie(secure = false) {
  const attributes = ["clsa_session=", "HttpOnly", "SameSite=Lax", "Path=/", "Max-Age=0"];
  if (secure) attributes.push("Secure");
  return attributes.join("; ");
}
