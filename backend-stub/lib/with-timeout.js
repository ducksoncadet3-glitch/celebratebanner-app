/**
 * Bound an async health probe so it always settles within `ms`.
 *
 * Dependency-free and side-effect-free: it does NOT touch the underlying client, its
 * connection, or its retry behavior — it only races the probe against a timer. If the probe
 * settles first, its result (success or its own failure object) is returned. If the timer
 * wins, a bounded timeout-failure object is returned instead of hanging; the underlying
 * promise is left to settle on its own (its later result/rejection is swallowed, so there is
 * no unhandled rejection and no leaked error).
 *
 * Resolves — never rejects — so callers can `Promise.all([...])` many probes and always get
 * a bounded, structured result per dependency.
 *
 * @param {() => Promise<any>} operation  probe factory (called once)
 * @param {number} ms                     upper bound in milliseconds
 * @param {string} name                   dependency name for the result object
 */
function withTimeout(operation, ms, name) {
  return new Promise((resolve) => {
    let settled = false;
    const finish = (value) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve(value);
    };
    const timer = setTimeout(
      () => finish({ name, ok: false, error: `health check timed out after ${ms}ms`, timedOut: true }),
      ms,
    );
    // Don't let the timer keep the event loop alive on its own.
    if (typeof timer.unref === 'function') timer.unref();

    Promise.resolve()
      .then(operation)
      .then(
        (result) => finish(result),
        (err) => finish({ name, ok: false, error: err && err.message ? err.message : String(err) }),
      );
  });
}

module.exports = { withTimeout };
