import { isIP } from 'node:net';

/**
 * Parses TRUST_PROXY, which tells Express how many reverse proxies sit in
 * front of the API, so `req.ip` (and every rate limit keyed on it) is the
 * visitor's address rather than the proxy's. Pure, so it is unit-tested.
 *
 * - Unset, "0" or "false": trust no proxy; `req.ip` is the connecting
 *   address. Right when the API is reached directly. Behind a proxy it makes
 *   every visitor share the proxy's address, and so its rate limits.
 * - A hop count: trust that many proxies. Render puts three in front of a
 *   web service (measured: docs/deploy.md, step 7); a single proxy is 1.
 *   Too low and visitors share the proxies' rate limits; too high and a
 *   caller's own X-Forwarded-For entries are believed.
 * - Addresses, subnets or Express presets ("loopback", "linklocal",
 *   "uniquelocal"), comma-separated: trust exactly those proxies.
 *
 * "true" is refused: it trusts every X-Forwarded-For entry, so any caller
 * could choose its own address and step around the rate limits.
 */
export type TrustProxySetting = false | number | string;

const PRESETS = new Set(['loopback', 'linklocal', 'uniquelocal']);
const MAX_HOPS = 10;

function isAddressOrSubnet(entry: string): boolean {
  const [address, prefix, ...rest] = entry.split('/');
  const version = isIP(address);
  if (version === 0 || rest.length > 0) return false;
  if (prefix === undefined) return true;
  if (!/^\d{1,3}$/.test(prefix)) return false;
  return Number(prefix) <= (version === 4 ? 32 : 128);
}

export function parseTrustProxy(value: string | undefined): TrustProxySetting {
  const text = value?.trim().toLowerCase() ?? '';
  if (text === '' || text === '0' || text === 'false') return false;

  if (text === 'true') {
    throw new Error(
      'TRUST_PROXY=true would trust any X-Forwarded-For value, letting callers pick their own IP; set the number of proxies in front of the API instead (3 on Render)',
    );
  }

  if (/^\d+$/.test(text)) {
    const hops = Number(text);
    if (hops > MAX_HOPS) throw new Error(`TRUST_PROXY=${hops}: expected the number of proxies in front of the API (1 to ${MAX_HOPS})`);
    return hops;
  }

  const entries = text.split(',').map((entry) => entry.trim()).filter(Boolean);
  const invalid = entries.filter((entry) => !PRESETS.has(entry) && !isAddressOrSubnet(entry));
  if (entries.length === 0 || invalid.length > 0) {
    throw new Error(
      `TRUST_PROXY: not a hop count, address, subnet or preset (loopback, linklocal, uniquelocal): ${invalid.join(', ') || value}`,
    );
  }
  return entries.join(',');
}
