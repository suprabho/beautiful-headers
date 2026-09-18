/**
 * Embed code generators shared by the studio's embed dialog (and the local
 * Lighthouse harness, so what gets measured is exactly what gets shipped).
 *
 * Two flavours:
 *  - iframeSnippet: a plain <iframe>. Simple, but the iframe's requests start
 *    while the host page is still rendering, so they land in the host's
 *    Lighthouse critical path.
 *  - facadeSnippet: paints the scene's palette as a CSS poster immediately and
 *    injects the iframe only after the host page has painted (or, optionally,
 *    on first interaction). The host's FCP/LCP/Speed Index stay untouched.
 */

const BLOB_POSITIONS = [[22, 28], [78, 22], [72, 74], [28, 72], [50, 48], [86, 54], [14, 52], [50, 90]]
const NEUTRAL_COLORS = ['#1f1f1f', '#2b2b2b']

export const PRODUCTION_ORIGIN = 'https://aura.promad.design'

export function escapeAttr(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

// Single-quoted JS string literal for the inline script.
function jsString(value) {
  return `'${String(value).replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/<\/script/gi, '<\\/script')}'`
}

export function buildEmbedUrl({ origin = PRODUCTION_ORIGIN, slug, hideText = false, hideIcons = false, input = 'mouse', theme = 'auto' }) {
  const params = new URLSearchParams()
  if (hideText) params.set('hideText', 'true')
  if (hideIcons) params.set('hideIcons', 'true')
  if (input !== 'mouse') params.set('input', input)
  if (theme !== 'auto') params.set('theme', theme)
  const query = params.toString()
  return `${origin}/embed/${slug}${query ? `?${query}` : ''}`
}

/** Inline CSS that mimics the scene's palette placeholder — a zero-network poster. */
export function posterStyle(colors) {
  const valid = (Array.isArray(colors) ? colors : []).filter((c) => /^#[0-9a-f]{3,8}$/i.test(c))
  const palette = valid.length ? valid : NEUTRAL_COLORS
  const layers = palette.map((color, i) => {
    const [x, y] = BLOB_POSITIONS[i % BLOB_POSITIONS.length]
    return `radial-gradient(circle at ${x}% ${y}%, ${color} 0%, transparent 55%)`
  })
  return `background-color:${palette[0]};background-image:${layers.join(',')}`
}

export function iframeSnippet({ url, title, height = 600, input = 'mouse' }) {
  const allow = input === 'mic' ? ' allow="microphone"' : ''
  return `<iframe src="${url}" title="${escapeAttr(title)}" width="100%" height="${height}" loading="lazy"${allow} style="border:0;border-radius:8px;" allowfullscreen></iframe>`
}

export function nextSnippet({ url, title, height = 600, input = 'mouse' }) {
  const allow = input === 'mic' ? ' allow="microphone"' : ''
  return `<iframe title="${escapeAttr(title)}" src="${url}" loading="lazy"${allow} style={{width:"100%", height:"${height}px", border:0}} allowFullScreen></iframe>`
}

/**
 * Poster-first embed. `trigger` is 'paint' (default: after the host page has
 * loaded and painted) or 'interaction' (first scroll / pointer move / touch).
 * `containerStyle` overrides the wrapper's box (e.g. `position:absolute;inset:0`
 * for a full-bleed hero background).
 */
export function facadeSnippet({ url, title, slug, colors, height = 600, input = 'mouse', trigger = 'paint', containerStyle }) {
  const box = containerStyle || `position:relative;width:100%;height:${height}px;border-radius:8px`
  const allow = input === 'mic' ? "\n    f.setAttribute('allow', 'microphone');" : ''
  const key = escapeAttr(slug)
  return `<!-- Aura scene: paints the palette instantly, loads the live scene once your page has rendered. -->
<div data-aura-scene="${key}" style="${box};overflow:hidden;${posterStyle(colors)}"></div>
<script>
(function () {
  var host = document.querySelector('[data-aura-scene="${key}"]');
  if (!host || host.dataset.auraMounted) return;
  host.dataset.auraMounted = '1';
  // 'paint' = once your page has loaded and painted. 'interaction' = on first scroll/pointer move.
  var trigger = ${jsString(trigger)};
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  function mount() {
    var f = document.createElement('iframe');
    f.src = ${jsString(url)};
    f.title = ${jsString(title)};
    f.loading = 'lazy';
    f.setAttribute('aria-hidden', 'true');
    f.tabIndex = -1;${allow}
    f.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;border:0;opacity:0;transition:opacity .8s ease';
    f.addEventListener('load', function () { f.style.opacity = '1'; });
    host.appendChild(f);
  }
  function afterPaint(cb) {
    // Wait until the page has both loaded and painted (first-contentful-paint
    // entry), then two frames and an idle slot, so the iframe's requests never
    // enter this page's Lighthouse critical path. A timer caps the wait.
    var painted = false, loaded = document.readyState === 'complete', done = false;
    function check() {
      if (done || !painted || !loaded) return;
      done = true;
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          (window.requestIdleCallback || function (c) { setTimeout(c, 250); })(cb, { timeout: 2000 });
        });
      });
    }
    if (!loaded) window.addEventListener('load', function () { loaded = true; check(); }, { once: true });
    try {
      new PerformanceObserver(function (list, observer) {
        if (!list.getEntries().some(function (e) { return e.name === 'first-contentful-paint'; })) return;
        painted = true; observer.disconnect(); check();
      }).observe({ type: 'paint', buffered: true });
    } catch (e) { painted = true; }
    setTimeout(function () { painted = true; loaded = true; check(); }, 4000);
    check();
  }
  if (trigger === 'interaction') {
    var events = ['pointermove', 'pointerdown', 'touchstart', 'scroll', 'keydown'];
    var once = function () { events.forEach(function (e) { window.removeEventListener(e, once); }); mount(); };
    events.forEach(function (e) { window.addEventListener(e, once, { passive: true }); });
  } else {
    afterPaint(mount);
  }
})();
</script>`
}
