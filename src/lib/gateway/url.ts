import dns from 'dns/promises';
import net from 'net';

function isPrivateIPv4(address: string): boolean {
  const octets = address.split('.').map(Number);
  if (octets.length !== 4 || octets.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) {
    return true;
  }

  const [a, b] = octets;
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 192 && b === 0) ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 198 && (b === 18 || b === 19 || b === 51)) ||
    (a === 203 && b === 0 && octets[2] === 113) ||
    a >= 224
  );
}

function isPrivateAddress(address: string): boolean {
  const normalized = address.toLowerCase().replace(/^\[|\]$/g, '');
  const mapped = normalized.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  if (mapped) return isPrivateIPv4(mapped[1]);
  const mappedHex = normalized.match(/^::ffff:([a-f0-9]{1,4}):([a-f0-9]{1,4})$/);
  if (mappedHex) {
    const high = parseInt(mappedHex[1], 16);
    const low = parseInt(mappedHex[2], 16);
    return isPrivateIPv4(
      `${high >> 8}.${high & 255}.${low >> 8}.${low & 255}`
    );
  }
  if (net.isIPv4(normalized)) return isPrivateIPv4(normalized);
  if (!net.isIPv6(normalized)) return true;

  // Public WordPress hosts use IPv6 global unicast (2000::/3). Rejecting every
  // other IPv6 scope also blocks loopback, link-local, unique-local, multicast,
  // documentation, and transition ranges that should never be callback targets.
  const firstGroup = parseInt(normalized.split(':')[0] || '0', 16);
  return firstGroup < 0x2000 || firstGroup > 0x3fff;
}

export async function validateSiteUrls(siteValue: unknown, callbackValue: unknown) {
  if (typeof siteValue !== 'string' || typeof callbackValue !== 'string') {
    throw new Error('Site and callback URLs are required');
  }

  const site = new URL(siteValue);
  const callback = new URL(callbackValue);

  if (!['http:', 'https:'].includes(site.protocol) || !['http:', 'https:'].includes(callback.protocol)) {
    throw new Error('Site URLs must use HTTP or HTTPS');
  }
  if (site.username || site.password || callback.username || callback.password) {
    throw new Error('Site URLs cannot contain credentials');
  }
  if (site.hostname !== callback.hostname || site.port !== callback.port) {
    throw new Error('Callback URL must use the same host as the WordPress site');
  }
  if (!callback.pathname.endsWith('/aisuite/v1/callback')) {
    throw new Error('Callback URL is not an AI Suite REST endpoint');
  }
  if (['localhost', 'localhost.localdomain'].includes(site.hostname.toLowerCase())) {
    throw new Error('Local callback hosts are not reachable');
  }

  const lookupHost = site.hostname.replace(/^\[|\]$/g, '');
  const addresses = await dns.lookup(lookupHost, { all: true, verbatim: true });
  if (!addresses.length || addresses.some(({ address }) => isPrivateAddress(address))) {
    throw new Error('Callback host resolves to a private or reserved address');
  }

  return {
    siteUrl: site.toString(),
    callbackUrl: callback.toString(),
  };
}
