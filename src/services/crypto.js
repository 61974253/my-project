/**
 * Secure Password Hashing Utility using Web Crypto API (SHA-256 + Salt)
 * Guarantees passwords are never stored in plain text.
 */

const SALT = "MY_MONITORING_SUPER_SALT_2026";

export async function hashPassword(plainPassword) {
  if (!plainPassword) return "";
  const salted = plainPassword + SALT;
  const encoder = new TextEncoder();
  const data = encoder.encode(salted);
  const hashBuffer = await window.crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

export async function verifyPassword(plainPassword, storedHash) {
  const computedHash = await hashPassword(plainPassword);
  return computedHash === storedHash;
}
