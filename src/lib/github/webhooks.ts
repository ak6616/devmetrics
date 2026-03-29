import { createHmac, timingSafeEqual } from "crypto";

export function verifyWebhookSignature(
  payload: string,
  signature: string | null
): boolean {
  if (!signature) return false;

  const secret = process.env.GITHUB_WEBHOOK_SECRET;
  if (!secret) throw new Error("GITHUB_WEBHOOK_SECRET is not set");

  const expected =
    "sha256=" +
    createHmac("sha256", secret).update(payload).digest("hex");

  if (signature.length !== expected.length) return false;

  return timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expected)
  );
}
