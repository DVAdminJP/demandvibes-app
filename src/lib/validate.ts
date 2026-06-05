/**
 * Input validation helpers used across API routes.
 * All validation is done server-side; never trust client input.
 */

const ALLOWED_PLATFORMS = ["google", "meta", "linkedin"] as const;
type Platform = (typeof ALLOWED_PLATFORMS)[number];

export function isValidPlatform(value: unknown): value is Platform {
  return typeof value === "string" && ALLOWED_PLATFORMS.includes(value as Platform);
}

export function isValidUUID(value: unknown): value is string {
  return (
    typeof value === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)
  );
}

export function isValidDate(value: unknown): value is string {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) && !isNaN(Date.parse(value));
}

/** Sanitise a string: strip null bytes, limit length. */
export function sanitizeString(value: unknown, maxLength = 1000): string {
  if (typeof value !== "string") return "";
  return value.replace(/\0/g, "").slice(0, maxLength);
}

/** Validate AI message array from client body */
export interface AIMessageInput {
  role: "user" | "assistant";
  content: string;
}

const MAX_MESSAGES = 50;
const MAX_MSG_LENGTH = 4000;

export function validateMessages(raw: unknown): AIMessageInput[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .slice(0, MAX_MESSAGES)
    .filter(
      (m) =>
        m &&
        typeof m === "object" &&
        (m.role === "user" || m.role === "assistant") &&
        typeof m.content === "string"
    )
    .map((m) => ({
      role: m.role as "user" | "assistant",
      content: sanitizeString(m.content, MAX_MSG_LENGTH),
    }));
}
