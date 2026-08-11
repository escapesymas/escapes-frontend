/**
 * Backend ops endpoints — exercises the admin endpoints that the
 * Reliability workstream shipped (P1#7 + P2#12). These endpoints have
 * no auth in CI (the X-Admin-Key middleware is bypassed when the env
 * var is unset, which is the local-dev default). In production Coolify
 * sets ADMIN_KEY so the same endpoints reject without it.
 *
 * Why these tests:
 *   - /api/stripe/webhook retry stats surface tells us the idempotency
 *     log is in place even if no event has ever been delivered
 *   - /api/email/track-open returns a 1x1 GIF, not a 404, so email
 *     clients won't spam operators with broken-image reports
 *   - /api/admin/email-stats returns valid JSON shape
 *   - These endpoints shouldn't 500 on a healthy deploy
 */

import { test, expect } from '@playwright/test';

test.describe('Backend ops endpoints', () => {
  test('Email open tracking pixel returns 1x1 GIF', async ({ request }) => {
    const r = await request.get('/api/email/track-open?m=test-message-' + Date.now());
    expect(r.status()).toBe(200);
    expect(r.headers()['content-type']).toContain('image/gif');
    const body = await r.body();
    // The pixel is 43 bytes — a 1x1 transparent GIF89a.
    expect(body.length).toBe(43);
    // First 6 bytes are "GIF89a" or "GIF87a"
    expect(body.subarray(0, 3).toString('ascii')).toBe('GIF');
  });

  test('Email open tracking pixel without messageId still returns GIF', async ({ request }) => {
    const r = await request.get('/api/email/track-open');
    expect(r.status()).toBe(200);
    expect(r.body().length).toBe(43);
  });

  test('Admin email stats responds with valid JSON', async ({ request }) => {
    const r = await request.get('/api/admin/email-stats');
    if (r.status() === 401) {
      // In production this requires admin key. CI/local: 200.
      test.skip();
    }
    expect(r.status()).toBe(200);
    const body = await r.json();
    expect(body).toHaveProperty('queueSize');
    expect(body).toHaveProperty('uniqueOpensLast24h');
    expect(typeof body.queueSize).toBe('number');
  });

  test('Admin stripe webhook stats responds with valid JSON', async ({ request }) => {
    const r = await request.get('/api/admin/stripe-webhook-stats');
    if (r.status() === 401) {
      test.skip();
    }
    expect(r.status()).toBe(200);
    const body = await r.json();
    expect(body).toHaveProperty('totalEvents');
    expect(body).toHaveProperty('processedEvents');
    expect(body).toHaveProperty('pendingEvents');
    expect(body).toHaveProperty('retryQueueSize');
    expect(typeof body.totalEvents).toBe('number');
  });
});
