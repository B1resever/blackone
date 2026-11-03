import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Provider-neutral HMAC helper for providers explicitly documented to use
 * HMAC-SHA256 over the raw body. NOT a Telnyx or Meta verifier.
 * Do not use until the chosen provider's signature specification is validated.
 */
export function verifyHmacSha256(rawBody: Buffer, signatureHex: string | undefined, secret: string): boolean {
  if (!signatureHex || !secret || !/^[a-f0-9]{64}$/i.test(signatureHex)) return false;
  const expected = createHmac("sha256", secret).update(rawBody).digest();
  const supplied = Buffer.from(signatureHex, "hex");
  return supplied.length === expected.length && timingSafeEqual(expected, supplied);
}
export type WebhookDecision = "rejected" | "accepted";
export type VerificationInput = Readonly<{
  rawBody: Buffer;
  headers: Readonly<Record<string, string | undefined>>;
}>;
export type ProviderVerifier = (input: VerificationInput) => boolean | Promise<boolean>;
/** Fail closed if provider verification is missing, errors or returns false. */
export async function authenticateWebhook(input: VerificationInput, verifier?: ProviderVerifier): Promise<WebhookDecision> {
  if (!verifier || input.rawBody.length === 0 || input.rawBody.length > 1024 * 1024) return "rejected";
  try { return (await verifier(input)) === true ? "accepted" : "rejected"; }
  catch { return "rejected"; }
}
