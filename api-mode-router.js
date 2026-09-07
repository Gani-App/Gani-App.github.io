(function (global) {
  "use strict";

  function realConfigured() {
    return !!(
      global.GANIRealAPI &&
      global.GANIRealAPI.isConfigured &&
      global.GANIRealAPI.isConfigured()
    );
  }

  function mockAvailable() {
    return !!global.GANIMockAPI;
  }

  function mode() {
    return realConfigured() ? "real" : "mock";
  }

  function source() {
    if (realConfigured()) {
      return global.GANIRealAPI;
    }

    if (mockAvailable()) {
      return global.GANIMockAPI;
    }

    throw new Error(
      "No GANI data source is available"
    );
  }

  async function call(method, ...args) {
    const selected = source();

    if (typeof selected[method] !== "function") {
      throw new Error(
        `GANI data source does not implement ${method}`
      );
    }

    /*
     * Critical rule:
     * when REAL mode is configured, failures remain failures.
     * Never silently substitute mock customer data.
     */
    return selected[method](...args);
  }

  global.GANIDataSource = {
    mode,
    isReal: realConfigured,
    health: (...args) => call("health", ...args),
    me: (...args) => call("me", ...args),
    accounts: (...args) => call("accounts", ...args),
    notifications: (...args) =>
      call("notifications", ...args),
    markNotificationRead: (...args) =>
      call("markNotificationRead", ...args),
    marketplace: (...args) =>
      call("marketplace", ...args),
    verify: (...args) => call("verify", ...args)
  };
})(window);
