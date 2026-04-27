import { encrypt } from "@/server/utils/encryption";

export interface RequesterInfo {
  requesterType: "guest" | "authenticated";
  encryptedEmail: string | null;
  userId: string | null;
}

/**
 * Determine requester identity for a report request.
 *
 * - Authenticated users: resolved via userId, email comes from users table at send time
 * - Guests: email is required and encrypted with AES-256-GCM before storage
 *
 * @throws Error if guest provides no email
 */
export function resolveRequesterInfo(
  userId: string | null | undefined,
  email: string | null | undefined
): RequesterInfo {
  if (userId) {
    return { requesterType: "authenticated", encryptedEmail: null, userId };
  }
  if (!email || email.trim().length === 0) {
    throw new Error("Email is required for guest report requests");
  }
  return { requesterType: "guest", encryptedEmail: encrypt(email.trim()), userId: null };
}
