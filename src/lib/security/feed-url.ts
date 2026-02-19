import { isIP } from "node:net";

const BLOCKED_HOSTS = new Set([
  "localhost",
  "metadata.google.internal",
  "169.254.169.254",
  "metadata.azure.internal",
]);

function isPrivateIpv4(host: string): boolean {
  const parts = host.split(".").map((p) => Number(p));
  if (parts.length !== 4 || parts.some((n) => !Number.isInteger(n) || n < 0 || n > 255)) return false;

  const [a, b] = parts;
  if (a === 10) return true;
  if (a === 127) return true;
  if (a === 169 && b === 254) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  return false;
}

function isPrivateIpv6(host: string): boolean {
  const lower = host.toLowerCase();
  return (
    lower === "::1" ||
    lower === "::" ||
    lower.startsWith("fc") ||
    lower.startsWith("fd") ||
    lower.startsWith("fe80:")
  );
}

export function validateFeedUrl(raw: string): { ok: true; url: string } | { ok: false; reason: string } {
  const value = raw.trim();
  if (!value) return { ok: false, reason: "empty_url" };

  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    return { ok: false, reason: "invalid_url" };
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return { ok: false, reason: "invalid_scheme" };
  }
  if (parsed.username || parsed.password) {
    return { ok: false, reason: "credentials_not_allowed" };
  }

  const host = parsed.hostname.toLowerCase();
  const isE2e = process.env.E2E_TEST_MODE === "1";
  if (isE2e && (host === "localhost" || host === "127.0.0.1" || host === "::1")) {
    return { ok: true, url: parsed.toString() };
  }

  if (host === "localhost" || host.endsWith(".localhost") || BLOCKED_HOSTS.has(host)) {
    return { ok: false, reason: "blocked_host" };
  }

  const ipVersion = isIP(host);
  if (ipVersion === 4 && isPrivateIpv4(host)) {
    return { ok: false, reason: "blocked_ip" };
  }
  if (ipVersion === 6 && isPrivateIpv6(host)) {
    return { ok: false, reason: "blocked_ip" };
  }

  return { ok: true, url: parsed.toString() };
}
