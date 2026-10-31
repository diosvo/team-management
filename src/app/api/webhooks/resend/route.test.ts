import { createHmac } from 'node:crypto';

import type { NextRequest } from 'next/server';

import { updateDeliveryStatus } from '@/db/report';
import { EmailStatus } from '@/utils/enum';

vi.mock('@/db/report', () => ({ updateDeliveryStatus: vi.fn() }));

const SECRET_KEY = Buffer.from('test-signing-secret').toString('base64');
const WEBHOOK_SECRET = `whsec_${SECRET_KEY}`;

const sign = (id: string, timestamp: string, payload: string) =>
  createHmac('sha256', Buffer.from(SECRET_KEY, 'base64'))
    .update(`${id}.${timestamp}.${payload}`)
    .digest('base64');

const createRequest = ({
  payload,
  headers = {},
}: {
  payload: string;
  headers?: Record<string, string>;
}): NextRequest =>
  ({
    text: vi.fn().mockResolvedValue(payload),
    headers: { get: (key: string) => headers[key] ?? null },
  }) as unknown as NextRequest;

const signedHeaders = (payload: string) => {
  const id = 'msg-1';
  const timestamp = String(Math.floor(Date.now() / 1000));
  const signature = sign(id, timestamp, payload);

  return {
    'svix-id': id,
    'svix-timestamp': timestamp,
    'svix-signature': `v1,${signature}`,
  };
};

const importRoute = async (secret?: string) => {
  vi.doMock('@env', () => ({
    default: { RESEND_WEBHOOK_SECRET: secret },
  }));
  vi.resetModules();
  return import('./route');
};

describe('POST /api/webhooks/resend', () => {
  const mockUpdateDeliveryStatus = vi.mocked(updateDeliveryStatus);

  afterEach(() => {
    vi.doUnmock('@env');
    vi.resetModules();
    vi.clearAllMocks();
  });

  test('rejects when no signing secret is configured', async () => {
    const { POST } = await importRoute(undefined);
    const payload = JSON.stringify({ type: 'email.delivered' });

    const response = await POST(
      createRequest({ payload, headers: signedHeaders(payload) }),
    );

    expect(response.status).toBe(401);
  });

  test('rejects when the svix headers are missing', async () => {
    const { POST } = await importRoute(WEBHOOK_SECRET);
    const payload = JSON.stringify({ type: 'email.delivered' });

    const response = await POST(createRequest({ payload }));

    expect(response.status).toBe(401);
  });

  test('rejects a timestamp outside the replay tolerance', async () => {
    const { POST } = await importRoute(WEBHOOK_SECRET);
    const payload = JSON.stringify({ type: 'email.delivered' });
    const id = 'msg-1';
    const staleTimestamp = String(Math.floor(Date.now() / 1000) - 600);
    const signature = sign(id, staleTimestamp, payload);

    const response = await POST(
      createRequest({
        payload,
        headers: {
          'svix-id': id,
          'svix-timestamp': staleTimestamp,
          'svix-signature': `v1,${signature}`,
        },
      }),
    );

    expect(response.status).toBe(401);
  });

  test('rejects a non-numeric timestamp', async () => {
    const { POST } = await importRoute(WEBHOOK_SECRET);
    const payload = JSON.stringify({ type: 'email.delivered' });

    const response = await POST(
      createRequest({
        payload,
        headers: {
          'svix-id': 'msg-1',
          'svix-timestamp': 'not-a-number',
          'svix-signature': 'v1,anything',
        },
      }),
    );

    expect(response.status).toBe(401);
  });

  test('rejects an unversioned or malformed signature candidate', async () => {
    const { POST } = await importRoute(WEBHOOK_SECRET);
    const payload = JSON.stringify({ type: 'email.delivered' });
    const id = 'msg-1';
    const timestamp = String(Math.floor(Date.now() / 1000));

    const response = await POST(
      createRequest({
        payload,
        headers: {
          'svix-id': id,
          'svix-timestamp': timestamp,
          'svix-signature': 'v2,badversion garbage',
        },
      }),
    );

    expect(response.status).toBe(401);
  });

  test('rejects an incorrect signature', async () => {
    const { POST } = await importRoute(WEBHOOK_SECRET);
    const payload = JSON.stringify({ type: 'email.delivered' });
    const id = 'msg-1';
    const timestamp = String(Math.floor(Date.now() / 1000));

    const response = await POST(
      createRequest({
        payload,
        headers: {
          'svix-id': id,
          'svix-timestamp': timestamp,
          'svix-signature': `v1,${Buffer.from('wrong').toString('base64')}`,
        },
      }),
    );

    expect(response.status).toBe(401);
  });

  test('rejects an invalid JSON payload even with a valid signature', async () => {
    const { POST } = await importRoute(WEBHOOK_SECRET);
    const payload = 'not json';

    const response = await POST(
      createRequest({ payload, headers: signedHeaders(payload) }),
    );

    expect(response.status).toBe(400);
  });

  test('acknowledges unhandled event types without updating delivery status', async () => {
    const { POST } = await importRoute(WEBHOOK_SECRET);
    const payload = JSON.stringify({ type: 'email.unknown' });

    const response = await POST(
      createRequest({ payload, headers: signedHeaders(payload) }),
    );
    const body = await response.json();

    expect(body).toEqual({ received: true });
    expect(mockUpdateDeliveryStatus).not.toHaveBeenCalled();
  });

  test('ignores a delivery event with no email id', async () => {
    const { POST } = await importRoute(WEBHOOK_SECRET);
    const payload = JSON.stringify({ type: 'email.delivered', data: {} });

    await POST(createRequest({ payload, headers: signedHeaders(payload) }));

    expect(mockUpdateDeliveryStatus).not.toHaveBeenCalled();
  });

  test('updates the delivery status for a recognized event', async () => {
    const { POST } = await importRoute(WEBHOOK_SECRET);
    const payload = JSON.stringify({
      type: 'email.bounced',
      data: { email_id: 'email-1' },
    });

    const response = await POST(
      createRequest({ payload, headers: signedHeaders(payload) }),
    );
    const body = await response.json();

    expect(mockUpdateDeliveryStatus).toHaveBeenCalledWith(
      'email-1',
      EmailStatus.BOUNCED,
    );
    expect(body).toEqual({ received: true });
  });

  test('accepts a signature from a rotated secret candidate list', async () => {
    const { POST } = await importRoute(WEBHOOK_SECRET);
    const payload = JSON.stringify({
      type: 'email.delivered',
      data: { email_id: 'email-1' },
    });
    const headers = signedHeaders(payload);

    const response = await POST(
      createRequest({
        payload,
        headers: {
          ...headers,
          'svix-signature': `v1,${Buffer.from('decoy').toString('base64')} ${headers['svix-signature']}`,
        },
      }),
    );

    expect(response.status).toBe(200);
  });
});
