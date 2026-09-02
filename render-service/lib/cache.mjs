// Optional origin cache in Supabase Storage — same bucket and key scheme as the
// aura Vercel capture endpoint (api/scenes/[slug]/capture.js), so a render done
// by either side is a cache hit for the other.
//
// Talks straight to the Storage REST API (no @supabase/supabase-js dep needed
// for two calls). Best-effort throughout: cache failures log and fall through
// to a fresh render, never fail a request.

import crypto from "node:crypto";

const BASE = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "").replace(/\/+$/, "");
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const BUCKET = process.env.CAPTURES_BUCKET || "captures";
const CACHE_TTL = 60 * 60 * 24 * 30; // 30 days, matches the Vercel endpoint

export const cacheEnabled = Boolean(BASE && KEY);

const headers = { apikey: KEY, authorization: `Bearer ${KEY}` };

/**
 * Cache key for a still capture — MUST stay byte-identical to the Vercel
 * endpoint's key ([slug, w, h, dpr, hideText, hideIcons, theme].join('|'),
 * sha1 → 16 hex chars) so the two caches interoperate.
 */
export function captureObjectPath({ slug, width, height, dpr, hideText, hideIcons, theme }) {
  const keyParts = [slug, width, height, dpr, hideText, hideIcons, theme || ""].join("|");
  const hash = crypto.createHash("sha1").update(keyParts).digest("hex").slice(0, 16);
  return `${slug}/${hash}.png`;
}

/** Cache key for a video render. `v1` bumps when output-changing params move. */
export function videoObjectPath({ slug, width, height, dpr, fps, durationMs, hideText, hideIcons, theme, format }) {
  const keyParts = ["video-v1", slug, width, height, dpr, fps, durationMs, hideText, hideIcons, theme || ""].join("|");
  const hash = crypto.createHash("sha1").update(keyParts).digest("hex").slice(0, 16);
  return `${slug}/${hash}.${format}`;
}

/** @returns {Promise<Buffer|null>} */
export async function cacheGet(objectPath) {
  if (!cacheEnabled) return null;
  try {
    const res = await fetch(`${BASE}/storage/v1/object/${BUCKET}/${objectPath}`, { headers });
    if (!res.ok) return null;
    return Buffer.from(await res.arrayBuffer());
  } catch (e) {
    console.warn(`[cache] get failed for ${objectPath}:`, e?.message);
    return null;
  }
}

/** Fire-and-forget upsert. */
export function cachePut(objectPath, buf, contentType) {
  if (!cacheEnabled) return;
  fetch(`${BASE}/storage/v1/object/${BUCKET}/${objectPath}`, {
    method: "POST",
    headers: {
      ...headers,
      "content-type": contentType,
      "x-upsert": "true",
      "cache-control": `max-age=${CACHE_TTL}`,
    },
    body: buf,
  }).then(
    (res) => {
      if (!res.ok) console.warn(`[cache] put ${objectPath} → ${res.status}`);
    },
    (e) => console.warn(`[cache] put failed for ${objectPath}:`, e?.message)
  );
}
