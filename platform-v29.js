(()=>{"use strict";
window.addEventListener("DOMContentLoaded",()=>{
  const hero=document.querySelector(".hero-card");
  const actions=document.querySelector(".quick-actions");
  if(hero&&actions){hero.append(actions);actions.classList.add("hero-feature-dock")}
  if(hero&&!hero.querySelector(".v29-ticker")){
    const ticker=document.createElement("div");
    ticker.className="v29-ticker";
    ticker.setAttribute("aria-label","Market overview");
    ticker.innerHTML=`<div class="demo-market-state"><span><small>MARKET DIRECTORY</small><b>Quotes unavailable</b></span><em>Provider required</em></div>`;
    hero.after(ticker);
  }
  const mobileMarket=document.querySelector(".mobile-market-grid");
    if(mobileMarket&&!mobileMarket.querySelector(".market-name"))mobileMarket.innerHTML=`<article><small>MARKET DIRECTORY</small><b>Quotes unavailable</b><em>Provider required</em></article>`;
});
})();
