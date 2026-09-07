(function (global) {
  "use strict";

  class GANIAPIError extends Error {
    constructor(message, options = {}) {
      super(message || "GANI API request failed");
      this.name = "GANIAPIError";
      this.status = options.status || 0;
      this.code = options.code || "api_error";
      this.requestId = options.requestId || null;
      this.payload = options.payload || null;
    }
  }

  function config() {
    return global.GANI_CONFIG || {};
  }

  function configuredBaseURL() {
    const value = config().API_BASE_URL;

    if (typeof value !== "string") {
      return "";
    }

    return value.trim().replace(/\/+$/, "");
  }

  function isConfigured() {
    return configuredBaseURL().length > 0;
  }

  function makeURL(path) {
    const base = configuredBaseURL();

    if (!base) {
      throw new GANIAPIError(
        "Real backend is not configured",
        {
          code: "backend_not_configured"
        }
      );
    }

    return base + "/" + String(path || "").replace(/^\/+/, "");
  }

  async function request(path, options = {}) {
    const headers = new Headers(options.headers || {});

    if (
      options.body !== undefined &&
      options.body !== null &&
      !(options.body instanceof FormData) &&
      !headers.has("Content-Type")
    ) {
      headers.set("Content-Type", "application/json");
    }

    const init = {
      method: options.method || "GET",
      credentials: "include",
      cache: "no-store",
      headers
    };

    if (options.body !== undefined) {
      init.body =
        typeof options.body === "string"
          ? options.body
          : JSON.stringify(options.body);
    }

    let response;

    try {
      response = await fetch(makeURL(path), init);
    } catch (error) {
      throw new GANIAPIError(
        "Backend network request failed",
        {
          code: "network_error",
          payload: {
            cause:
              error && error.message
                ? error.message
                : String(error)
          }
        }
      );
    }

    let payload = null;
    const contentType =
      response.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      try {
        payload = await response.json();
      } catch (_) {
        payload = null;
      }
    }

    if (!response.ok) {
      throw new GANIAPIError(
        payload && payload.message
          ? payload.message
          : `HTTP ${response.status}`,
        {
          status: response.status,
          code:
            payload && payload.error
              ? payload.error
              : "http_error",
          requestId:
            payload && payload.request_id
              ? payload.request_id
              : null,
          payload
        }
      );
    }

    return payload;
  }

  const api = {
    isConfigured,

    health() {
      return request("health");
    },

    me() {
      return request("me");
    },

    accounts() {
      return request("accounts");
    },

    notifications() {
      return request("notifications");
    },

    markNotificationRead(id) {
      if (!id) {
        return Promise.reject(
          new GANIAPIError(
            "Notification id is required",
            {
              code: "invalid_argument"
            }
          )
        );
      }

      return request(
        "notifications/" +
          encodeURIComponent(id) +
          "/read",
        {
          method: "POST"
        }
      );
    },

    marketplace() {
      return request("marketplace");
    },

    verify(reference) {
      if (
        typeof reference !== "string" ||
        !reference.trim()
      ) {
        return Promise.reject(
          new GANIAPIError(
            "Verification reference is required",
            {
              code: "invalid_argument"
            }
          )
        );
      }

      return request("verify", {
        method: "POST",
        body: {
          reference: reference.trim()
        }
      });
    }
  };

  global.GANIRealAPI = api;
  global.GANIAPIError = GANIAPIError;
})(window);
