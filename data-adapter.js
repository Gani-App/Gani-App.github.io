
(function(){
  function cfg(){return window.GANI_CONFIG||{}}
  async function request(path,options={}){
    const base=(cfg().API_BASE_URL||"").replace(/\/$/,"");
    if(!base) throw new Error("PRODUCTION_API_NOT_CONFIGURED");
    const r=await fetch(base+path,{credentials:"include",headers:{"Accept":"application/json",...(options.headers||{})},...options});
    if(!r.ok) throw new Error("HTTP_"+r.status);
    return r.status===204?null:r.json();
  }
  window.GANI_DATA={
    isProductionConfigured(){return !!cfg().API_BASE_URL},
    profile(){return window.GANIDataSource.me()},
    accounts(){return window.GANIDataSource.accounts()},
    notifications(){return window.GANIDataSource.notifications()}
  };
})();

/*
 * GANI unified customer data boundary.
 *
 * All new customer-data consumers use GANIAppData.
 * GANIDataSource chooses real or mock mode.
 * Existing presentation helpers remain compatible.
 */
(function (global) {
  "use strict";

  function source() {
    if (!global.GANIDataSource) {
      throw new Error(
        "GANIDataSource is not available"
      );
    }

    return global.GANIDataSource;
  }

  const appData = {
    mode() {
      return source().mode();
    },

    isReal() {
      return source().isReal();
    },

    health() {
      return source().health();
    },

    me() {
      return source().me();
    },

    accounts() {
      return source().accounts();
    },

    notifications() {
      return source().notifications();
    },

    markNotificationRead(id) {
      return source().markNotificationRead(id);
    },

    marketplace() {
      return source().marketplace();
    },

    verify(reference) {
      return source().verify(reference);
    }
  };

  global.GANIAppData = appData;

  global.dispatchEvent(
    new CustomEvent(
      "gani:data-ready",
      {
        detail: {
          mode: appData.mode()
        }
      }
    )
  );
})(window);
