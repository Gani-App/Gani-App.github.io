(function (global) {
  "use strict";

  function api() {
    if (!global.GANIAppData) {
      throw new Error("GANI_APP_DATA_MISSING");
    }
    return global.GANIAppData;
  }

  function $(selector) {
    return document.querySelector(selector);
  }

  function $$(selector) {
    return Array.from(document.querySelectorAll(selector));
  }

  function text(el, value) {
    if (el && value !== undefined && value !== null) {
      el.textContent = String(value);
    }
  }

  function itemsOf(payload) {
    if (Array.isArray(payload)) return payload;
    if (payload && Array.isArray(payload.items)) return payload.items;
    return [];
  }

  function escapeHTML(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function notifySafe(message) {
    if (typeof global.notify === "function") {
      global.notify(message);
      return;
    }

    console.info("[GANI]", message);
  }

  async function bindMarketplace() {
    const buttons = $$(".details[data-product]");

    if (!buttons.length) {
      return "NO_DOM_TARGET";
    }

    const payload = await api().marketplace();
    const items = itemsOf(payload);

    if (!items.length) {
      return "EMPTY";
    }

    const byName = new Map();

    for (const item of items) {
      const names = [
        item.name,
        item.title,
        item.provider,
        item.company
      ]
        .filter(Boolean)
        .map(v => String(v).trim().toLowerCase());

      for (const name of names) {
        byName.set(name, item);
      }
    }

    let matched = 0;

    for (const button of buttons) {
      const product = String(
        button.dataset.product || ""
      ).trim();

      const item = byName.get(
        product.toLowerCase()
      );

      if (!item) continue;

      matched += 1;
      button.dataset.ganiBackendBound = "1";

      button.onclick = () => {
        const title =
          item.name ||
          item.title ||
          item.provider ||
          product;

        const companyTitle = $("#companyTitle");
        const companyBody = $("#companyBody");
        const modal = $("#companyModal");

        text(companyTitle, title);

        if (companyBody) {
          const fields = [
            ["Qiime", item.price],
            ["Daily loss", item.dailyLoss],
            ["Max loss", item.maxLoss],
            ["Muddada", item.duration],
            ["Xaalad", item.status],
            ["Mode", item.mode]
          ].filter(([, value]) =>
            value !== undefined &&
            value !== null &&
            value !== ""
          );

          const tiles = fields
            .map(([label, value]) => `
              <div class="info-tile">
                <span>${escapeHTML(label)}</span>
                <strong>${escapeHTML(value)}</strong>
              </div>
            `)
            .join("");

          const summary =
            item.summary ||
            item.description ||
            "";

          companyBody.innerHTML = `
            ${
              summary
                ? `<p style="color:var(--muted);line-height:1.7">${escapeHTML(summary)}</p>`
                : ""
            }
            <div class="company-modal-grid">
              ${tiles}
            </div>
          `;
        }

        if (modal) {
          modal.hidden = false;
          document.body.style.overflow = "hidden";
        }
      };
    }

    if (!matched) {
      return "NO_BACKEND_MATCH";
    }

    return `BOUND:${matched}`;
  }

  async function bindProfile() {
    const state = $("#profileState");

    if (!state) {
      return "NO_DOM_TARGET";
    }

    const user = await api().me();

    if (user) {
      text(
        state,
        user.name ||
        user.displayName ||
        user.email ||
        "Diyaar"
      );

      state.dataset.ganiBackendBound = "1";
    }

    return "BOUND";
  }

  async function bindAccounts() {
    const metric = $("#metricAccounts");
    const target =
      $("#accountRecords") ||
      $("#accountsRecords") ||
      $("#accountsList");

    if (!metric && !target) {
      return "NO_DOM_TARGET";
    }

    const payload = await api().accounts();
    const items = itemsOf(payload);

    if (metric) {
      text(metric, items.length);
      metric.dataset.ganiBackendBound = "1";
    }

    if (target) {
      target.innerHTML = items.length
        ? items.map(item => `
            <article class="record">
              <strong>${escapeHTML(
                item.name ||
                item.label ||
                item.id ||
                "Account"
              )}</strong>
              <small>${escapeHTML(
                item.status ||
                item.mode ||
                ""
              )}</small>
            </article>
          `).join("")
        : `<p class="empty-state">Account lama helin.</p>`;

      target.dataset.ganiBackendBound = "1";
    }

    return "BOUND";
  }

  async function bindNotifications() {
    const target =
      $("#notificationRecords") ||
      $("#notificationsList") ||
      $("#notificationList");

    const metric =
      $("#metricNotifications") ||
      $("#notificationCount");

    if (!target && !metric) {
      return "NO_DOM_TARGET";
    }

    const payload = await api().notifications();
    const items = itemsOf(payload);

    if (metric) {
      text(
        metric,
        items.filter(item =>
          !item.read &&
          !item.readAt
        ).length
      );

      metric.dataset.ganiBackendBound = "1";
    }

    if (target) {
      target.innerHTML = items.length
        ? items.map(item => `
            <article
              class="record gani-notification"
              data-notification-id="${escapeHTML(item.id || "")}"
            >
              <strong>${escapeHTML(
                item.title ||
                item.message ||
                "Ogeysiis"
              )}</strong>
              ${
                item.message && item.title
                  ? `<p>${escapeHTML(item.message)}</p>`
                  : ""
              }
              <button
                type="button"
                class="gani-notification-read"
                data-id="${escapeHTML(item.id || "")}"
              >
                Calaamadee la akhriyey
              </button>
            </article>
          `).join("")
        : `<p class="empty-state">Ogeysiis cusub ma jiro.</p>`;

      target.dataset.ganiBackendBound = "1";

      target
        .querySelectorAll(".gani-notification-read")
        .forEach(button => {
          button.addEventListener("click", async () => {
            const id = button.dataset.id;

            if (!id) return;

            try {
              await api().markNotificationRead(id);
              button.disabled = true;
              button.textContent = "La akhriyey";
            } catch (error) {
              console.error(
                "GANI_NOTIFICATION_READ_FAILED",
                error
              );
              notifySafe(
                "Ogeysiiska lama cusboonaysiin karin."
              );
            }
          });
        });
    }

    return "BOUND";
  }

  async function bindVerify() {
    const form =
      $("#verifyForm") ||
      document.querySelector(
        'form[data-gani-verify]'
      );

    if (!form) {
      return "NO_DOM_TARGET";
    }

    const input =
      form.querySelector(
        '[name="reference"]'
      ) ||
      form.querySelector(
        '[name="verification"]'
      ) ||
      form.querySelector(
        'input[type="text"]'
      );

    if (!input) {
      return "NO_INPUT_TARGET";
    }

    let result =
      $("#verifyResult") ||
      form.querySelector(
        "[data-gani-verify-result]"
      );

    if (!result) {
      result = document.createElement("div");
      result.setAttribute(
        "data-gani-verify-result",
        "1"
      );
      result.className = "verify-result";
      form.appendChild(result);
    }

    form.addEventListener(
      "submit",
      async event => {
        event.preventDefault();

        const reference =
          String(input.value || "").trim();

        if (!reference) return;

        result.textContent =
          "Xaqiijinta ayaa socota...";

        try {
          const response =
            await api().verify(reference);

          const status =
            response.status ||
            response.result ||
            "unknown";

          result.textContent =
            `Natiijo: ${status}`;

          result.dataset.ganiBackendBound =
            "1";
        } catch (error) {
          console.error(
            "GANI_VERIFY_FAILED",
            error
          );

          result.textContent =
            "Xaqiijinta lama dhammeystiri karin.";
        }
      }
    );

    form.dataset.ganiBackendBound = "1";

    return "BOUND";
  }

  async function bindAll() {
    const results = {};

    const tasks = {
      marketplace: bindMarketplace,
      profile: bindProfile,
      accounts: bindAccounts,
      notifications: bindNotifications,
      verify: bindVerify
    };

    for (const [name, fn] of Object.entries(tasks)) {
      try {
        results[name] = await fn();
      } catch (error) {
        results[name] = "ERROR";
        console.error(
          `GANI_BIND_${name.toUpperCase()}_FAILED`,
          error
        );
      }
    }

    global.GANICustomerBindings = {
      results,
      refresh: bindAll
    };

    global.dispatchEvent(
      new CustomEvent(
        "gani:customer-bindings-ready",
        {
          detail: results
        }
      )
    );

    return results;
  }

  let started = false;

  async function start() {
    if (started) return;
    started = true;

    try {
      await bindAll();
    } catch (error) {
      started = false;
      console.error(
        "GANI_CUSTOMER_BINDINGS_FAILED",
        error
      );
    }
  }

  if (
    document.readyState === "loading"
  ) {
    document.addEventListener(
      "DOMContentLoaded",
      start,
      { once: true }
    );
  } else {
    start();
  }

  global.addEventListener(
    "gani:data-ready",
    start,
    { once: true }
  );
})(window);
