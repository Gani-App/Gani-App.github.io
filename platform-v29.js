(()=>{"use strict";
window.addEventListener("DOMContentLoaded",()=>{
  const hero=document.querySelector(".hero-card");
  const actions=document.querySelector(".quick-actions");
  if(hero&&actions){hero.append(actions);actions.classList.add("hero-feature-dock")}
  if(hero&&!hero.querySelector(".v29-ticker")){
    const ticker=document.createElement("div");
    ticker.className="v29-ticker";
    ticker.setAttribute("aria-label","Market overview");
    ticker.innerHTML=`<div><i class="asset gold">◆</i><span><small>XAUUSD</small><b>2,453.61</b></span><em>+0.82%</em></div><div><i class="asset blue">€</i><span><small>EURUSD</small><b>1.0823</b></span><em>+0.36%</em></div><div><i class="asset orange">₿</i><span><small>BTCUSD</small><b>67,248</b></span><em>+1.24%</em></div><div><i class="asset violet">Ξ</i><span><small>ETHUSD</small><b>3,421.15</b></span><em>+1.08%</em></div><div><i class="asset cyan">●</i><span><small>USOIL</small><b>78.42</b></span><em>+0.52%</em></div>`;
    hero.after(ticker);
  }
  const mobileMarket=document.querySelector(".mobile-market-grid");
  if(mobileMarket&&!mobileMarket.querySelector(".market-name"))mobileMarket.innerHTML=`<article><small>XAUUSD</small><b>2,453.61</b><em>▲ +0.82%</em></article><article><small>EURUSD</small><b>1.0823</b><em>▲ +0.36%</em></article><article><small>BTCUSD</small><b>67,248</b><em>▲ +1.24%</em></article>`;
});
})();
