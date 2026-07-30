import assert from 'node:assert/strict';
import { sign, signRequest, verifyInbound } from '../../src/lib/gateway/crypto';
import { validateSiteUrls } from '../../src/lib/gateway/url';

const secret = 'whsec_test_secret';
const timestamp = Math.floor(Date.now() / 1000).toString();
const body = '{"hello":"world"}';
const path = '/v1/jobs?source=wordpress';
const signature = signRequest(secret, timestamp, 'POST', path, body);

assert.equal(
  verifyInbound(
    {
      'x-aisuite-timestamp': timestamp,
      'x-aisuite-signature': signature,
      'x-aisuite-signature-version': '2',
    },
    body,
    secret,
    'POST',
    path
  ),
  null
);
assert.equal(
  verifyInbound(
    {
      'x-aisuite-timestamp': timestamp,
      'x-aisuite-signature': signature,
      'x-aisuite-signature-version': '2',
    },
    body,
    secret,
    'POST',
    '/v1/account'
  ),
  'Bad signature'
);
assert.equal(
  verifyInbound(
    {
      'x-aisuite-timestamp': timestamp,
      'x-aisuite-signature': 'short',
      'x-aisuite-signature-version': '2',
    },
    body,
    secret,
    'POST',
    path
  ),
  'Malformed signature headers'
);

const legacy = sign(secret, timestamp, body);
assert.equal(
  verifyInbound(
    {
      'x-aisuite-timestamp': timestamp,
      'x-aisuite-signature': legacy,
    },
    body,
    secret
  ),
  null
);

async function testCallbackUrls() {
  await assert.rejects(
    validateSiteUrls('http://127.0.0.1', 'http://127.0.0.1/wp-json/aisuite/v1/callback'),
    /private or reserved/
  );
  await assert.rejects(
    validateSiteUrls(
      'http://[::ffff:7f00:1]',
      'http://[::ffff:7f00:1]/wp-json/aisuite/v1/callback'
    ),
    /private or reserved/
  );
  await assert.rejects(
    validateSiteUrls(
      'http://192.0.2.1',
      'http://192.0.2.1/wp-json/aisuite/v1/callback'
    ),
    /private or reserved/
  );
  await assert.rejects(
    validateSiteUrls(
      'https://example.com',
      'https://example.org/wp-json/aisuite/v1/callback'
    ),
    /same host/
  );
  await assert.rejects(
    validateSiteUrls('https://example.com', 'https://example.com/not-the-callback'),
    /not an AI Suite REST endpoint/
  );
}

testCallbackUrls()
  .then(() => {
    console.log('PASS: gateway signatures reject route replay and callback URLs reject SSRF targets');
  })
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
