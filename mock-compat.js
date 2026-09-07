(function (global) {
  "use strict";

  const legacy = global.GANI_MOCK_API;

  if (!legacy) {
    throw new Error(
      "GANI_MOCK_API legacy implementation is missing"
    );
  }

  function normalizeItems(value) {
    if (
      value &&
      typeof value === "object" &&
      Array.isArray(value.items)
    ) {
      return value;
    }

    return {
      items: Array.isArray(value)
        ? value
        : []
    };
  }

  const demoMarketplace = {
    items: [
      {
        id: "gani-demo-marketplace-001",
        title: "GANI Demo Marketplace",
        summary:
          "Sample/demo marketplace item for local and offline testing.",
        mode: "demo"
      }
    ]
  };

  global.GANIMockAPI = {
    mode() {
      return "mock";
    },

    async health() {
      return {
        status: "ok",
        service: "gani-mock",
        mode: "mock"
      };
    },

    async me() {
      return legacy.getProfile();
    },

    async accounts() {
      return normalizeItems(
        await legacy.getAccounts()
      );
    },

    async notifications() {
      return normalizeItems(
        await legacy.getNotifications()
      );
    },

    async markNotificationRead(id) {
      return legacy.markNotificationRead(id);
    },

    async marketplace() {
      return demoMarketplace;
    },

    async verify(reference) {
      const value = String(
        reference || ""
      ).trim();

      return {
        reference: value,
        status:
          value.startsWith("GANI-")
            ? "verified"
            : "not_found",
        mode: "demo"
      };
    }
  };
})(window);
