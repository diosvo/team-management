import { createHmac, timingSafeEqual } from 'node:crypto';

import { NextRequest, NextResponse } from 'next/server';

import env from '@env';

import { updateDeliveryStatus } from '@/db/report';
import { EmailStatus } from '@/utils/enum';

/** Reject events whose timestamp drifted more than this from now (replay). */
const TOLERANCE_MS = 5 * 60 * 1000;

/** Decoded once at module load — the signing secret never changes at runtime. */
const SIGNING_SECRET = env.RESEND_WEBHOOK_SECRET
  ? Buffer.from(env.RESEND_WEBHOOK_SECRET.replace(/^whsec_/, ''), 'base64')
  : null;

/** "Sent" from the API only means accepted — these events tell the truth. */
const DELIVERY_EVENTS: Record<string, EmailStatus> = {
  'email.delivered': EmailStatus.DELIVERED,
  'email.delivery_delayed': EmailStatus.DELIVERY_DELAYED,
  'email.bounced': EmailStatus.BOUNCED,
  'email.complained': EmailStatus.COMPLAINED,
  'email.failed': EmailStatus.FAILED,
};

/**
 * Resend signs webhooks with Svix headers: the signature is an HMAC-SHA256 of
 * `{id}.{timestamp}.{payload}` keyed by the base64 part of the `whsec_`
 * signing secret, and the header may carry several space-separated
 * `v1,<base64>` candidates during secret rotation.
 */
function isVerified(req: NextRequest, payload: string): boolean {
  if (!SIGNING_SECRET) return false;

  const id = req.headers.get('svix-id');
  const timestamp = req.headers.get('svix-timestamp');
  const signatures = req.headers.get('svix-signature');
  if (!id || !timestamp || !signatures) return false;

  const sentAt = Number(timestamp) * 1000;
  if (!Number.isFinite(sentAt) || Math.abs(Date.now() - sentAt) > TOLERANCE_MS) {
    return false;
  }

  const expected = createHmac('sha256', SIGNING_SECRET)
    .update(`${id}.${timestamp}.${payload}`)
    .digest();

  return signatures.split(' ').some((versioned) => {
    const [version, signature] = versioned.split(',');
    if (version !== 'v1' || !signature) return false;

    const received = Buffer.from(signature, 'base64');
    return (
      received.length === expected.length && timingSafeEqual(received, expected)
    );
  });
}

/**
 * Delivery-status webhook: stamps `delivered` / `bounced` / `complained` (etc.)
 * onto the report run that sent the email, keyed by the Resend email id.
 */
export async function POST(req: NextRequest) {
  const payload = await req.text();

  if (!isVerified(req, payload)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  let event: { type?: string; data?: { email_id?: string } };
  try {
    event = JSON.parse(payload);
  } catch {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  const status = event.type ? DELIVERY_EVENTS[event.type] : undefined;
  const email_id = event.data?.email_id;

  if (status && email_id) {
    await updateDeliveryStatus(email_id, status);
  }

  // Unhandled event types are acknowledged so Resend stops retrying them.
  return NextResponse.json({ received: true });
}
