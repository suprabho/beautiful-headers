// Injected (via addInitScript, before any page script runs) for video renders.
//
// Software WebGL can't hit 30fps in real time, so recording the live page gives
// janky footage. Instead we virtualize the clocks the animation loops read —
// requestAnimationFrame and performance.now — and advance them exactly one
// frame interval per captured screenshot. Every rAF-driven layer (all the
// aura backgrounds: r3f/three via THREE.Clock, plain-canvas loops) then renders
// each frame as if time ran at full speed, however long the screenshot takes.
//
// Real timers (setTimeout/fonts/network) are untouched, so page load, the
// embed's capture-ready gate, and React scheduling behave normally.
export const VCLOCK_INIT_SCRIPT = String.raw`(() => {
  let now = 0;
  let nextId = 1;
  let cbs = new Map();

  performance.now = () => now;
  const epoch = Date.now();
  Date.now = () => epoch + now;

  window.requestAnimationFrame = (cb) => {
    const id = nextId++;
    cbs.set(id, cb);
    return id;
  };
  window.cancelAnimationFrame = (id) => {
    cbs.delete(id);
  };

  const tick = (dtMs) => {
    now += dtMs;
    // Swap the queue first: callbacks re-queueing themselves (every render
    // loop does) land in the NEXT frame, not an infinite loop in this one.
    const due = cbs;
    cbs = new Map();
    for (const cb of due.values()) {
      try {
        cb(now);
      } catch (e) {
        console.error("vclock callback failed", e);
      }
    }
  };

  /** Advance one frame interval and run due rAF callbacks. */
  window.__vclockTick = (dtMs) => tick(dtMs);
  /** Advance many frames in one evaluate roundtrip (warm-up). */
  window.__vclockPump = (frames, dtMs) => {
    for (let i = 0; i < frames; i++) tick(dtMs);
  };
})();`;
