/**
 * Generate a random, human-readable password with the AimHop prefix.
 * Pattern: AimHop#<4 random alphanumeric chars>
 * Uses only unambiguous characters (no 0/O/1/l/I/b/d/g/q).
 */
export function generatePassword(): string {
  const chars = "abcdefhkmnprstuvwxyz23456789";
  let rand = "";
  for (let i = 0; i < 4; i++) {
    rand += chars[Math.floor(Math.random() * chars.length)];
  }
  return `AimHop#${rand}`;
}
