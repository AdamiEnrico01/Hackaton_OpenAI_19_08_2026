import { isIP } from "node:net";

function isBlockedIpv4(hostname: string) {
  const octets = hostname.split(".").map(Number);
  if (octets.length !== 4 || octets.some((octet) => !Number.isInteger(octet) || octet < 0 || octet > 255)) {
    return true;
  }

  const [first, second] = octets;
  return first === 0
    || first === 10
    || first === 127
    || (first === 169 && second === 254)
    || (first === 172 && second >= 16 && second <= 31)
    || (first === 192 && second === 168)
    || first >= 224;
}

function isBlockedIpv6(hostname: string) {
  const normalized = hostname.toLowerCase();
  return normalized === "::"
    || normalized === "::1"
    || normalized.startsWith("fc")
    || normalized.startsWith("fd")
    || /^fe[89ab]/.test(normalized)
    || normalized.startsWith("::ffff:");
}

export function isSafePublicHttpUrl(value: string) {
  try {
    const url = new URL(value);
    if (url.protocol !== "http:" && url.protocol !== "https:") return false;
    if (url.username || url.password) return false;

    const hostname = url.hostname.replace(/^\[|\]$/g, "").replace(/\.+$/, "").toLowerCase();
    const blockedDnsSuffixes = [
      ".localhost",
      ".local",
      ".internal",
      ".home.arpa",
      ".nip.io",
      ".sslip.io",
      ".xip.io",
      ".localtest.me",
    ];
    if (!hostname || hostname === "localhost" || blockedDnsSuffixes.some((suffix) => hostname.endsWith(suffix))) {
      return false;
    }

    const ipVersion = isIP(hostname);
    if (ipVersion === 4 && isBlockedIpv4(hostname)) return false;
    if (ipVersion === 6 && isBlockedIpv6(hostname)) return false;

    return true;
  } catch {
    return false;
  }
}
