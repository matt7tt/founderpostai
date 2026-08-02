import assert from 'node:assert/strict';
import { loadEnvConfig } from '@next/env';
import type { Site } from '../../src/lib/gateway/store';

// Live integration check. It uses production-equivalent Redis configuration,
// creates only namespaced test data, and removes every key in finally.
loadEnvConfig(process.cwd());

const site: Site = {
  site_id: `feedback_store_test_${Date.now()}`,
  site_secret: 'not-used-by-this-storage-test',
  site_url: 'https://feedback-test.example.com',
  admin_email: 'feedback-test@example.com',
  callback_url: 'https://feedback-test.example.com/wp-json/aisuite/v1/callback',
  billing_mode: 'managed',
  plan: 'test',
  credits_included: 0,
  created_at: new Date().toISOString(),
};

async function main() {
  const {
    createFeedback,
    listFeedback,
    updateFeedback,
    validateFeedbackInput,
  } = await import('../../src/lib/feedback');
  const { redis } = await import('../../src/lib/gateway/redis');
  let feedbackId = '';

  try {
    const created = await createFeedback(
      site,
      validateFeedbackInput({
        category: 'feature',
        product: 'core',
        message: 'Live integration test for the durable feedback review inbox.',
        contact_email: '',
        plugin_version: 'test',
        core_version: 'test',
        wp_version: 'test',
        php_version: 'test',
      })
    );
    feedbackId = created.id;
    assert.equal(created.status, 'new');

    const listed = await listFeedback(500);
    assert.ok(listed.some((item) => item.id === feedbackId));

    const updated = await updateFeedback(feedbackId, 'resolved', 'Integration test complete.');
    assert.equal(updated?.status, 'resolved');
    assert.equal(updated?.admin_notes, 'Integration test complete.');

    console.log('PASS: feedback survives a live Redis create, list, and review update');
  } finally {
    if (feedbackId) {
      await redis('ZREM', 'feedback:index', feedbackId);
      await redis('DEL', `feedback:${feedbackId}`);
    }
    await redis('DEL', `feedback-rate:${site.site_id}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
