// Explicit operator action. Uses the existing Stripe account and project-local Vercel link.
// Secrets travel only through child-process stdin, never command arguments or console output.
import nextEnv from '@next/env';
import Stripe from 'stripe';
import { spawn } from 'node:child_process';
nextEnv.loadEnvConfig(process.cwd());
if (!process.argv.includes('--apply')) throw new Error('Use --apply to configure the production plugin billing integration.');
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', { apiVersion: '2023-10-16', timeout: 10000, maxNetworkRetries: 1 });
const base = 'https://founderpostai.com';

async function env(name, value, sensitive = false) {
  if (!value) throw new Error(`Missing value for ${name}`);
  await new Promise((resolve, reject) => {
    const child = spawn('vercel', ['env', 'add', name, 'production', '--yes', '--force', ...(sensitive ? ['--sensitive'] : [])], { stdio: ['pipe', 'pipe', 'pipe'] });
    child.stdin.end(value);
    child.on('error', reject);
    child.on('close', code => code === 0 ? resolve() : reject(new Error(`Could not save ${name}; Vercel exit ${code}`)));
  });
  console.log(`Configured ${name} (value hidden)`);
}

const links = await stripe.paymentLinks.list({ limit: 100 });
for (const [plan, name] of [['PRO', 'NEXT_PUBLIC_STRIPE_PAYMENT_LINK_PRO'], ['AGENCY', 'NEXT_PUBLIC_STRIPE_PAYMENT_LINK_AGENCY']]) {
  const link = links.data.find(item => item.url === process.env[name]);
  if (!link?.active || !link.livemode) throw new Error(`Active production ${plan} payment link was not verified`);
  const items = await stripe.paymentLinks.listLineItems(link.id, { limit: 10 });
  if (items.data.length !== 1 || !items.data[0].price?.recurring) throw new Error(`Unexpected ${plan} checkout product`);
  await env(`STRIPE_PRICE_${plan}`, items.data[0].price.id, true);
}

const configs = await stripe.billingPortal.configurations.list({ limit: 100 });
let portal = configs.data.find(item => item.metadata?.integration === 'founderpostai-plugins');
const portalSettings = {
  business_profile: { headline: 'Manage your FounderPostAI subscription', privacy_policy_url: `${base}/privacy`, terms_of_service_url: `${base}/terms` },
  default_return_url: `${base}/contact`, login_page: { enabled: true },
  features: { invoice_history: { enabled: true }, payment_method_update: { enabled: true }, subscription_cancel: { enabled: true, mode: 'at_period_end' } },
  metadata: { integration: 'founderpostai-plugins' },
};
portal = portal ? await stripe.billingPortal.configurations.update(portal.id, portalSettings) : await stripe.billingPortal.configurations.create(portalSettings);
await env('STRIPE_PLUGIN_PORTAL_CONFIG', portal.id);
await env('NEXT_PUBLIC_STRIPE_BILLING_PORTAL', portal.login_page.url);

const endpoints = await stripe.webhookEndpoints.list({ limit: 100 });
let endpoint = endpoints.data.find(item => item.url === `${base}/api/webhooks/stripe`);
const events = ['checkout.session.completed', 'checkout.session.async_payment_succeeded', 'customer.subscription.created', 'customer.subscription.updated', 'customer.subscription.deleted', 'invoice.paid', 'invoice.payment_failed'];
if (!endpoint) {
  endpoint = await stripe.webhookEndpoints.create({ url: `${base}/api/webhooks/stripe`, api_version: '2023-10-16', enabled_events: events, description: 'FounderPostAI plugin purchase fulfillment and subscription lifecycle' });
  await env('STRIPE_WEBHOOK_SECRET', endpoint.secret, true);
} else {
  await stripe.webhookEndpoints.update(endpoint.id, { enabled_events: events });
  console.log('Existing webhook retained; its previously saved signing secret must already be configured.');
}
console.log('Billing configured. Deploy to load these production environment variables, then verify webhook delivery.');
