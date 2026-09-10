(()=>{"use strict";
const q=(s,r=document)=>r.querySelector(s),qa=(s,r=document)=>[...r.querySelectorAll(s)];
let installPrompt=null;
const ua=navigator.userAgent||"";
const android=/Android/i.test(ua);
const standalone=matchMedia('(display-mode: standalone)').matches||navigator.standalone===true;
function notice(text,offline=false){let el=q('.network-state');if(!el){el=document.createElement('div');el.className='network-state';el.setAttribute('role','status');document.body.append(el)}el.textContent=text;el.classList.toggle('offline',offline);el.classList.add('show');clearTimeout(notice.t);notice.t=setTimeout(()=>el.classList.remove('show'),2600)}
function setDownloadLinks(){qa('.gani-download-link').forEach(link=>{link.href='install.html';link.removeAttribute('download');link.setAttribute('aria-label','Install GANI App')})}
function installDock(){if(standalone)return;let link=q('.install-dock');if(!link){link=document.createElement('a');link.className='install-dock';link.innerHTML='<span aria-hidden="true">↓</span> Install GANI App';link.addEventListener('click',requestInstall);document.body.append(link)}link.href='install.html';link.removeAttribute('download');link.setAttribute('aria-label','Install GANI App');link.classList.add('ready')}
async function requestInstall(e){if(!installPrompt)return; e.preventDefault(); installPrompt.prompt(); const choice=await installPrompt.userChoice; installPrompt=null; if(choice?.outcome==='accepted')q('.install-dock')?.remove()}
addEventListener('beforeinstallprompt',e=>{e.preventDefault();installPrompt=e;installDock()});
addEventListener('appinstalled',()=>{q('.install-dock')?.remove();notice('GANI waa la rakibay')});
addEventListener('online',()=>notice('Internet-ka waa soo laabtay'));
addEventListener('offline',()=>notice('Offline: qaybihii hore loo furay way shaqaynayaan',true));
addEventListener('DOMContentLoaded',()=>{setDownloadLinks();installDock();if(!navigator.onLine)notice('Offline: qaybihii hore loo furay way shaqaynayaan',true);qa('button').forEach(b=>{if(!b.getAttribute('type')&&b.closest('form'))b.type='submit'})});
})();
