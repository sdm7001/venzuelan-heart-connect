// Shared crypto helpers for staff MFA (OTP + recovery codes).
// Keeping this in one place ensures the gate, fallback dialog, and recovery
// codes page all hash codes identically before talking to the RPCs.

export async function sha256Hex(input: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// 10-char base32-ish (Crockford alphabet, no I/L/O/U) grouped as XXXXX-XXXXX.
// ~50 bits of entropy — plenty for a one-time recovery code.
const ALPHABET = "ABCDEFGHJKMNPQRSTVWXYZ23456789";
export function generateRecoveryCode(): string {
  const bytes = new Uint8Array(10);
  crypto.getRandomValues(bytes);
  const chars = Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]);
  return `${chars.slice(0, 5).join("")}-${chars.slice(5).join("")}`;
}

// Normalize user input so "abcde-12345" and "ABCDE12345" both work.
export function normalizeRecoveryCode(input: string): string {
  const cleaned = input.toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (cleaned.length !== 10) return "";
  return `${cleaned.slice(0, 5)}-${cleaned.slice(5)}`;
}
