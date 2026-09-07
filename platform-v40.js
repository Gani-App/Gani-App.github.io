(()=>{"use strict";
const q=(s,r=document)=>r.querySelector(s),qa=(s,r=document)=>[...r.querySelectorAll(s)];
let installPrompt=null,apkReady=false;
const ua=navigator.userAgent||"";
const android=/Android/i.test(ua);
const standalone=matchMedia('(display-mode: standalone)').matches||navigator.standalone===true;
function notice(text,offline=false){let el=q('.network-state');if(!el){el=document.createElement('div');el.className='network-state';el.setAttribute('role','status');document.body.append(el)}el.textContent=text;el.classList.toggle('offline',offline);el.classList.add('show');clearTimeout(notice.t);notice.t=setTimeout(()=>el.classList.remove('show'),2600)}
function setDownloadLinks(){qa('.gani-download-link').forEach(link=>{link.href=android&&apkReady?'download/GANI-Android.apk':'install.html';if(android&&apkReady){link.setAttribute('download','GANI-Android.apk');link.setAttribute('aria-label','Download GANI for Android')}else{link.removeAttribute('download');link.setAttribute('aria-label','Install or open GANI')}})}
function installDock(){if(standalone)return;let link=q('.install-dock');if(!link){link=document.createElement('a');link.className='install-dock';link.innerHTML='<span aria-hidden="true">↓</span> Download GANI';document.body.append(link)}link.href=android&&apkReady?'download/GANI-Android.apk':'install.html';if(android&&apkReady)link.setAttribute('download','GANI-Android.apk');else link.removeAttribute('download');link.classList.add('ready')}
async function checkApk(){if(!android){setDownloadLinks();installDock();return}try{const r=await fetch('download/GANI-Android.apk',{method:'HEAD',cache:'no-store'});apkReady=r.ok}catch{apkReady=false}setDownloadLinks();installDock()}
addEventListener('beforeinstallprompt',e=>{e.preventDefault();installPrompt=e;installDock()});
addEventListener('appinstalled',()=>{q('.install-dock')?.remove();notice('GANI waa la rakibay')});
addEventListener('online',()=>notice('Internet-ka waa soo laabtay'));
addEventListener('offline',()=>notice('Offline: qaybihii hore loo furay way shaqaynayaan',true));
addEventListener('DOMContentLoaded',()=>{checkApk();if(!navigator.onLine)notice('Offline: qaybihii hore loo furay way shaqaynayaan',true);qa('button').forEach(b=>{if(!b.getAttribute('type')&&b.closest('form'))b.type='submit'})});
})();
