(()=>{"use strict";
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
function savedWatchlist(){try{const value=JSON.parse(localStorage.getItem('gani.watchlist')||'[]');return Array.isArray(value)?value:[]}catch{return[]}}
const state={market:[],notices:[],accounts:[],profile:null,watchlist:new Set(savedWatchlist())};
const telegramState={configured:false,url:""};
const devEnabled=new URLSearchParams(location.search).get('dev')==='1';
const researchCatalog=[
  {id:'eur-usd',title:'EUR/USD',summary:'FX instrument reference for structure and macro research.',category:'fx'},
  {id:'gbp-usd',title:'GBP/USD',summary:'FX instrument reference for comparative research.',category:'fx'},
  {id:'gold',title:'Gold',summary:'Metals instrument reference for event and volatility review.',category:'metals'},
  {id:'btc-usd',title:'BTC/USD',summary:'Digital asset reference for liquidity and risk review.',category:'digital-assets'}
];
function mode(){try{return window.GANIAppData?.mode?.()||"mock"}catch{return"mock"}}
function esc(v){return String(v??"").replace(/[&<>'"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[c]))}
function toast(m){const t=$("#toast");if(!t)return;t.textContent=m;t.classList.add("show");clearTimeout(toast.t);toast.t=setTimeout(()=>t.classList.remove("show"),1800)}
function show(id,push=true){
  const requested=String(id||'home').replace(/^#/,'');
  if(requested==='development-control'&&!devEnabled){toast('Development view is restricted');id='home'}
  else if(!$("#"+requested)){toast('That GANI destination is unavailable');id='home'}
  else id=requested;
  const activeScreen=$("#"+id);
  document.body.dataset.screen=id;
  $$('.screen').forEach(x=>{
    const active=x===activeScreen;
    x.classList.toggle('active',active);
    x.setAttribute('aria-hidden',String(!active));
    x.inert=!active;
  });
  $$('[data-screen]').forEach(x=>{
    const active=x.dataset.screen===id;
    x.classList.toggle('active',active);
    if(x.matches('button,[role="button"],a'))x.setAttribute('aria-current',active?'page':'false');
  });
  activeScreen?.setAttribute('aria-current','page');
  document.title=`${activeScreen?.dataset.title||'Home'} · GANI`;
  $('#mobileMenu')?.classList.remove('open');
  $('#menuToggle')?.setAttribute('aria-expanded','false');
  $('#noticePanel')?.classList.remove('open');
  $('#noticeToggle')?.setAttribute('aria-expanded','false');
  $('#searchPanel')?.classList.remove('open');
  $('#searchToggle')?.setAttribute('aria-expanded','false');
  if(push){const next=`#${id}`;if(location.hash!==next)history.pushState(null,"",next)}
  window.scrollTo({top:0,left:0,behavior:'auto'});
  if(activeScreen){
    activeScreen.setAttribute('tabindex','-1');
    requestAnimationFrame(()=>activeScreen.focus({preventScroll:true}));
  }
  if(id==='dashboard')loadDashboard();
  if(id==='profile')loadProfile();
  if(id==='discover'||id==='markets')loadMarket();
  if(id==='development-control')loadDevelopmentStatus();
}
async function safe(fn){try{return await fn()}catch(e){toast(e?.message||'Data request failed');return null}}
function updateMode(){const m=mode().toUpperCase(),real=m==='REAL';['#dashMode','#profileMode','#homeMode','#settingsDataMode'].forEach(s=>{const el=$(s);if(el)el.textContent=m});if($('#homeSourceState'))$('#homeSourceState').textContent=real?'REAL API':'DEMO MODE';if($('#marketMode'))$('#marketMode').textContent=real?'REAL API':'DEMO DATA';if($('#missionMarketMode'))$('#missionMarketMode').textContent=real?'REAL API':'DEMO DATA';if($('#heroMode'))$('#heroMode').textContent=real?'REAL API':'DEMO MODE';if($('#marketStripMode'))$('#marketStripMode').textContent=real?'API CONNECTED':'DEMO MODE';if($('#mobileMode'))$('#mobileMode').textContent=real?'REAL API':'DEMO MODE';if($('#mobileDataLabel'))$('#mobileDataLabel').textContent=real?'API connected':'Demo data';const overview=$('#homeOverviewMode');if(overview){overview.textContent=real?'Connected source':'Demo view';overview.classList.toggle('is-connected',real)}const note=$('#missionDataNote');if(note)note.textContent=real?'Connected provider records are shown where available. Quotes and execution remain outside this read-only workspace.':'The visible directory is a local reference set. Live quotes, account data and execution remain unavailable until a provider is connected.'}
function initPreferences(){const form=$('#preferencesForm'),open=$('[data-demo-action="Preferences"]'),close=$('#preferencesClose');if(!form||!open)return;const density=$('#preferenceDensity'),language=$('#preferenceLanguage'),summary=$('#preferencesSummary');let saved={};try{saved=JSON.parse(localStorage.getItem('gani.preferences')||'{}')}catch{};density.value=saved.density==='comfortable'?'comfortable':'compact';language.value=saved.language==='so'?'so':'en';const render=()=>{const densityLabel=density.value==='comfortable'?'Comfortable':'Compact';const languageLabel=language.value==='so'?'Soomaali':'English';summary.textContent=`${densityLabel} workspace layout · ${languageLabel}`;document.documentElement.dataset.ganiDensity=density.value;document.documentElement.lang=language.value};render();open.addEventListener('click',()=>{form.hidden=false;form.scrollIntoView({behavior:'smooth',block:'nearest'});density.focus()});close?.addEventListener('click',()=>{form.hidden=true});form.addEventListener('submit',e=>{e.preventDefault();const next={density:density.value,language:language.value};localStorage.setItem('gani.preferences',JSON.stringify(next));render();$('#preferencesNote').textContent='Preferences saved on this device.';toast('Preferences saved')})}
function initSupportRequest(){const form=$('#supportRequest');if(!form)return;const topic=$('#supportTopic'),reference=$('#supportReference'),message=$('#supportMessage'),note=$('#supportRequestNote');try{const saved=JSON.parse(localStorage.getItem('gani.supportDraft')||'{}');topic.value=saved.topic||topic.value;reference.value=saved.reference||'';message.value=saved.message||''}catch{};form.addEventListener('submit',e=>{e.preventDefault();const draft={topic:topic.value,reference:reference.value.trim(),message:message.value.trim(),savedAt:new Date().toISOString()};localStorage.setItem('gani.supportDraft',JSON.stringify(draft));note.textContent='Draft saved on this device. Connect an authenticated support service to submit it.';note.className='form-note success';toast('Support draft saved')})}
function telegramConfig(){const raw=String(window.GANI_CONFIG?.TELEGRAM_PUBLIC_URL||'').trim();try{const url=new URL(raw);return url.protocol==='https:'&&url.hostname.toLowerCase()==='t.me'?url.href:''}catch{return''}}
function updateTelegram(){const url=telegramConfig();telegramState.configured=Boolean(url);telegramState.url=url;const status=$('#telegramStatus'),detail=$('#telegramDetail'),button=$('#telegramOpen');if(!status||!detail||!button)return;status.textContent=url?'Configured':'Not configured';detail.textContent=url?'A verified public Telegram destination is configured for this deployment.':'A public Telegram URL has not been configured for this deployment.';button.disabled=!url;button.setAttribute('aria-disabled',String(!url));button.textContent=url?'Open Telegram':'Telegram unavailable'}
function openTelegram(){if(!telegramState.configured||!telegramState.url){toast('Telegram is not configured');return}const opened=window.open(telegramState.url,'_blank','noopener,noreferrer');if(!opened)toast('Allow pop-ups to open Telegram')}
function renderHomeMobileMarket(items){const el=$('#homeMobileMarketGrid');if(!el)return;const visible=items.slice(0,3);el.innerHTML=visible.length?visible.map(x=>`<article class="home-mobile-market" data-screen="markets" role="button" tabindex="0" aria-label="Open ${esc(x.title||x.name||'market')} in Markets"><div class="market-name"><span>${x.category==='metals'?'◆':x.category==='digital-assets'?'₿':'◎'}</span><b>${esc(x.title||x.name||'Market reference')}</b></div><strong>Quote unavailable</strong><em>Provider required · reference only</em></article>`).join(''):'<article class="market-loading"><div class="market-name"><span>—</span><b>No local records</b></div><strong>Directory unavailable</strong><em>Try Refresh snapshot</em></article>';}
async function loadMarket(){const d=await safe(()=>GANIAppData.marketplace());if(!d)return false;state.market=Array.isArray(d.items)?d.items:[];const directoryIds=new Set([...researchCatalog.map(item=>item.id),...state.market.map(item=>item.id||item.title||item.name).filter(Boolean)]);const directoryCount=directoryIds.size;const directoryItems=[...researchCatalog,...state.market.map(x=>({...x,id:x.id||`record-${x.title||x.name}`,category:x.category||'directory'}))];if($('#homeMarketCount'))$('#homeMarketCount').textContent=directoryCount;if($('#missionMarketCount'))$('#missionMarketCount').textContent=directoryCount;if($('#homeRailMarketCount'))$('#homeRailMarketCount').textContent=directoryCount;if($('#homePulseMarkets'))$('#homePulseMarkets').textContent=directoryCount;if($('#missionMarketCount'))$('#missionMarketCount').setAttribute('aria-label',`${directoryCount} market directory records`);if($('#mobileMarketCount'))$('#mobileMarketCount').textContent=directoryCount;renderHomeMobileMarket(directoryItems);renderMarket();renderHomePulse();return true}
function renderMarket(){const el=$('#markets.active #missionMarketGrid')||$('#discover.active #marketGrid')||$('#missionMarketGrid')||$('#marketGrid');if(!el)return;const input=$('#markets.active #missionMarketSearch')||$('#discover.active #marketSearch');const q=input?.value.trim().toLowerCase()||'';const category=$('#marketCategory')?.value||'all';const watchOnly=$('#watchlistToggle')?.getAttribute('aria-pressed')==='true';const source=[...researchCatalog,...state.market.map(x=>({...x,id:x.id||`record-${x.title||x.name}`,category:x.category||'directory'}))];const items=source.filter(x=>(category==='all'||x.category===category)&&(!watchOnly||state.watchlist.has(x.id))&&JSON.stringify(x).toLowerCase().includes(q));if($('#watchlistCount'))$('#watchlistCount').textContent=state.watchlist.size;el.innerHTML=items.length?items.map((x,i)=>`<article class="market-card"><div class="market-card-top"><span class="tag">${esc(x.category||'directory')}</span><button class="watch-button ${state.watchlist.has(x.id)?'saved':''}" type="button" data-watch="${esc(x.id)}" aria-label="${state.watchlist.has(x.id)?'Remove from':'Add to'} watchlist">${state.watchlist.has(x.id)?'★':'☆'}</button></div><h3>${esc(x.title||x.name||'GANI Marketplace')}</h3><p>${esc(x.summary||x.description||'Reference entry available through GANI.')}</p><footer><span>${esc(x.mode==='demo'?'Demo record':'Reference only')}</span><b>${esc(x.status||'No quote')}</b></footer></article>`).join(''):`<article class="market-card market-no-results"><span class="tag">EMPTY STATE</span><h3>${watchOnly?'Your watchlist is empty':'No matching instruments'}</h3><p>${watchOnly?'Save a reference card with ☆ to build a personal list.':'Try another search or category.'}</p></article>`;renderHomePulse();$$('[data-watch]',el).forEach(b=>b.onclick=()=>{const id=b.dataset.watch;if(state.watchlist.has(id))state.watchlist.delete(id);else state.watchlist.add(id);localStorage.setItem('gani.watchlist',JSON.stringify([...state.watchlist]));renderMarket()})}
function localAssistant(text){const q=text.toLowerCase();if(q.includes('risk')||q.includes('loss'))return 'A useful risk checklist names the thesis, invalidation, maximum acceptable loss, position size and liquidity. Account-specific limits are unavailable until a supported account is connected.';if(q.includes('chart')||q.includes('pattern'))return 'Start with timeframe, market structure, support or resistance, and what would invalidate the idea. A pattern alone is not a verified signal.';if(q.includes('macro')||q.includes('event'))return 'Macro context can include rates, inflation, employment, policy and scheduled events. Confirm each item with a trusted source before relying on it.';return 'I can explain market concepts and help structure a review checklist locally. A connected AI backend is not available in this build.'}
function addAIMessage(author,text,kind='user'){const box=$('#aiMessages');if(!box)return;const row=document.createElement('div');row.className=`ai-message ${kind==='gani'?'ai-message-gani':''}`;row.innerHTML=`<b>${esc(author)}</b><p>${esc(text)}</p>`;box.append(row);row.scrollIntoView({block:'nearest'});}
async function loadNotices(){const d=await safe(()=>GANIAppData.notifications());if(!d)return false;state.notices=Array.isArray(d.items)?d.items:[];renderNotices();return true}
function noticeHTML(n){return `<div class="notice-row ${n.read?'':'unread'}" data-notice="${esc(n.id)}"><div class="notice-icon">${n.read?'✓':'•'}</div><div><b>${esc(n.title||'Notification')}</b><small>${n.read?'Read':'Unread'}</small></div>${n.read?'':`<button class="status-pill read-one">Mark read</button>`}</div>`}
function renderHomePulse(){if($('#homePulseWatchlist'))$('#homePulseWatchlist').textContent=state.watchlist.size;if($('#homePulseUnread'))$('#homePulseUnread').textContent=state.notices.filter(n=>!n.read).length}
function renderNotices(){const h=state.notices.length?state.notices.map(noticeHTML).join(''):'<p class="hint">No notifications.</p>';if($('#noticeList'))$('#noticeList').innerHTML=h;if($('#dashboardNotices'))$('#dashboardNotices').innerHTML=h;const activity=$('#homeActivityList');if(activity){activity.innerHTML=state.notices.length?state.notices.slice(0,3).map(n=>`<div class="home-activity-row"><span class="home-activity-icon ${n.read?'read':''}">${n.read?'✓':'•'}</span><div><b>${esc(n.title||'Workspace update')}</b><small>${n.read?'Read locally':'Unread · available in Analytics'}</small></div></div>`).join(''):'<p class="mission-muted small">No local activity yet. New workspace notices will appear here when available.</p>'}const unread=state.notices.filter(n=>!n.read).length;if($('#unreadCount'))$('#unreadCount').textContent=unread;if($('#homeNoticeCount'))$('#homeNoticeCount').textContent=unread;if($('#mobileNoticeCount'))$('#mobileNoticeCount').textContent=unread;renderHomePulse();$('#noticeDot')?.classList.toggle('on',unread>0);$$('.read-one').forEach(b=>b.onclick=async()=>{const id=b.closest('[data-notice]').dataset.notice;await safe(()=>GANIAppData.markNotificationRead(id));await loadNotices()})}
async function loadAccounts(){const d=await safe(()=>GANIAppData.accounts());if(!d)return false;state.accounts=Array.isArray(d.items)?d.items:[];if($('#accountCount'))$('#accountCount').textContent=state.accounts.length;if($('#homeAccountCount'))$('#homeAccountCount').textContent=state.accounts.length;if($('#missionAccountCount'))$('#missionAccountCount').textContent=state.accounts.length;if($('#mobileAccountCount'))$('#mobileAccountCount').textContent=state.accounts.length;if($('#accountList'))$('#accountList').innerHTML=state.accounts.length?state.accounts.map(a=>`<div class="account-row"><div class="account-icon">◎</div><div><b>${esc(a.name||a.id||'Account')}</b><small>${esc(a.provider||a.mode||'GANI')}</small></div><span class="status-pill">${esc(a.status||'active')}</span></div>`).join(''):'<p class="hint">No accounts available.</p>';return true}
async function loadProfile(){const p=await safe(()=>GANIAppData.me());if(!p)return;state.profile=p;const name=p.name||'GANI User';[['#profileName',name],['#profileName2',name],['#profileId',p.id||'—'],['#profileVerified',p.verified?'Verified':'Not verified'],['#verifiedBadge',p.verified?'✓ Verified':'Unverified'],['#profileState',p.verified?'Customer profile verified':'Customer profile'],['#profileSource',mode().toUpperCase()]].forEach(([s,v])=>{const e=$(s);if(e)e.textContent=v})}
async function loadDashboard(){updateMode();await Promise.all([loadAccounts(),loadNotices()])}
let homeRefreshBusy=false;
async function refreshHome(){
  const button=$('#homeRefresh');
  if(homeRefreshBusy)return;
  homeRefreshBusy=true;
  if(button){button.disabled=true;button.setAttribute('aria-busy','true');button.textContent='Refreshing…'}
  try{
    const results=await Promise.all([loadMarket(),loadAccounts(),loadNotices()]);
    const complete=results.every(Boolean);
    const checked=$('#homeLastUpdated');
    if(checked)checked.textContent=complete?new Intl.DateTimeFormat(undefined,{hour:'2-digit',minute:'2-digit'}).format(new Date()):'Check incomplete';
    if(button){button.textContent=complete?'Snapshot refreshed':'Refresh incomplete';setTimeout(()=>{if(button)button.textContent='Refresh snapshot'},1800)}
    setHomeWorkspaceState(complete);
    toast(complete?'Home snapshot refreshed':'Some local data could not be refreshed');
  }finally{
    homeRefreshBusy=false;
    if(button){button.disabled=false;button.removeAttribute('aria-busy');if(button.textContent==='Refreshing…')button.textContent='Refresh snapshot'}
  }
}
function setHomeWorkspaceState(complete){
  const state=$('#homeWorkspaceState'),detail=$('#homeWorkspaceDetail'),icon=$('#homeStatusIcon');
  if(!state||!detail||!icon)return;
  state.textContent=complete?'Research workspace ready':'Research workspace partially available';
  detail.textContent=complete?'Local reference tools are available in this browser session.':'Some local data could not be checked. Provider-dependent data remains unavailable.';
  icon.textContent=complete?'✓':'!';
  icon.classList.toggle('status-muted',!complete);
}
function setHomeLastChecked(complete){
  const checked=$('#homeLastUpdated');
  if(checked)checked.textContent=complete?new Intl.DateTimeFormat(undefined,{hour:'2-digit',minute:'2-digit'}).format(new Date()):'Check incomplete';
  setHomeWorkspaceState(complete);
}
const terminalState={history:[],index:-1,sessionId:null,cwd:'Not available',connected:false,output:[],ctrlArmed:false};
function terminalStorage(){try{return JSON.parse(localStorage.getItem('gani.terminal.history')||'[]')}catch{return[]}}
function terminalSession(){try{let id=localStorage.getItem('gani.terminal.session');if(!id){id=crypto.randomUUID?crypto.randomUUID():`session-${Date.now()}-${Math.random().toString(16).slice(2)}`;localStorage.setItem('gani.terminal.session',id)}return id}catch{return'ephemeral-session'}}
function terminalWrite(text,kind=''){const box=$('#terminalOutput');if(!box)return;const line=document.createElement('div');line.className=`terminal-line ${kind?'terminal-'+kind:''}`;line.textContent=text;box.append(line);terminalState.output.push(text);box.scrollTop=box.scrollHeight}
function terminalRender(){if($('#terminalSessionId'))$('#terminalSessionId').textContent=terminalState.sessionId||'—';if($('#terminalSessionLabel'))$('#terminalSessionLabel').textContent=`Session ${String(terminalState.sessionId||'—').slice(0,8)}`;if($('#terminalHistoryCount'))$('#terminalHistoryCount').textContent=terminalState.history.length;if($('#terminalCwd'))$('#terminalCwd').textContent=terminalState.cwd;if($('#terminalConnectionState'))$('#terminalConnectionState').textContent=terminalState.connected?'Connected':'Not connected';if($('#terminalConnectionDetail'))$('#terminalConnectionDetail').textContent=terminalState.connected?'Authenticated session':'Backend not configured';$('#terminalStatusDot')?.classList.toggle('connected',terminalState.connected);const ctrl=$('[data-terminal-key="CTRL"]');if(ctrl)ctrl.setAttribute('aria-pressed',String(terminalState.ctrlArmed))}
function terminalHelp(){terminalWrite('Client commands: help, clear, history, session, pwd, reconnect');terminalWrite('Shell commands are forwarded only through the authenticated terminal session API.','muted')}
async function terminalCommand(raw){const command=raw.trim();if(!command)return;terminalWrite(`$ ${command}`,'command');terminalState.history.push(command);terminalState.history=terminalState.history.slice(-100);terminalState.index=-1;try{localStorage.setItem('gani.terminal.history',JSON.stringify(terminalState.history))}catch{};if(command==='help'){terminalHelp();terminalRender();return}if(command==='clear'){const box=$('#terminalOutput');if(box)box.innerHTML='';terminalState.output=[];terminalRender();return}if(command==='history'){terminalState.history.forEach((item,i)=>terminalWrite(`${i+1}  ${item}`,'muted'));terminalRender();return}if(command==='session'){terminalWrite(`Session ${terminalState.sessionId}; connection ${terminalState.connected?'authenticated':'not connected'}`,'muted');terminalRender();return}if(command==='pwd'){terminalWrite(terminalState.cwd==='Not available'?'Working directory is unavailable until the backend connects.':terminalState.cwd,'muted');terminalRender();return}if(command==='reconnect'){await terminalReconnect();return}if(!terminalState.connected||!GANIAppData.isReal()){terminalWrite('Not connected: command was not executed. Configure an authenticated terminal session backend to enable execution.','error');terminalRender();return}try{const result=await GANIAppData.terminalExecute(terminalState.sessionId,command);if(result?.cwd)terminalState.cwd=String(result.cwd);if(Array.isArray(result?.output))result.output.forEach(line=>terminalWrite(String(line)));else if(result?.output)terminalWrite(String(result.output));else terminalWrite('Command completed with no output.','muted')}catch(e){terminalWrite(e?.message||'Terminal command failed.','error')}terminalRender()}
async function terminalReconnect(){terminalState.connected=false;terminalState.cwd='Not available';if(!GANIAppData.isReal()){terminalWrite('Reconnect unavailable: no authenticated terminal backend is configured for this deployment.','error');terminalRender();return}terminalWrite('Connecting to the authenticated workspace session…','muted');try{const result=await GANIAppData.terminalConnect(terminalState.sessionId);terminalState.connected=result?.connected!==false;terminalState.cwd=String(result?.cwd||'Not available');if(result?.session_id)terminalState.sessionId=String(result.session_id);terminalWrite(terminalState.connected?'Authenticated terminal session connected.':'Terminal backend did not establish a session.','muted')}catch(e){terminalWrite(e?.message||'Terminal connection failed.','error')}terminalRender()}
function refreshFiles(){const state=$('#filesConnectionState');const list=$('#filesList');if(!state||!list)return;state.textContent='Not connected';list.innerHTML='<div class="files-empty"><span>▦</span><b>File service not configured</b><p>Files will appear here only after an authenticated backend establishes the user workspace. This browser cannot read local or internal infrastructure files.</p></div>';toast('Files: authenticated service is not configured')}
async function loadDevelopmentStatus(){const gate=$('#devGate'),content=$('#devControlContent');if(!gate||!content)return;if(!devEnabled){gate.hidden=false;content.hidden=true;return}gate.hidden=true;content.hidden=false;try{const r=await fetch('./gani-development-status.json',{cache:'no-store'});if(!r.ok)throw new Error('Status ledger unavailable');const data=await r.json();renderDevelopmentStatus(data);renderJobReport(data)}catch(e){$('#devOverallStatus').textContent='UNAVAILABLE';$('#devOverallDetail').textContent=e.message;$('#devJobGrid').innerHTML='<div class="mission-panel"><b>Status ledger unavailable</b><p class="mission-muted small">The control center could not load its non-sensitive status source.</p></div>';renderJobReport({jobReport:{state:'BLOCKED',reason_code:'STATUS_LEDGER_UNAVAILABLE',reason:e.message}})}}
function renderJobReport(data){const report=data.jobReport||{};const jobs=data.jobs||{};const count=key=>Array.isArray(jobs[key])?jobs[key].length:0;const values={TOTAL:report.TOTAL??0,COMPLETE:report.COMPLETE??count('completed'),WORKING:report.WORKING??count('working'),FAILED:report.FAILED??count('failed'),BLOCKED:report.BLOCKED??count('blocked'),NOT_DELIVERED:report.NOT_DELIVERED??0};const grid=$('#devReportGrid');if(grid)grid.innerHTML=Object.entries(values).map(([key,value])=>`<div><b>${key}</b><strong>${esc(String(value))}</strong></div>`).join('');const state=$('#devReportState');if(state)state.textContent=String(report.state||'NOT_DELIVERED');const reason=$('#devReportReason');if(reason)reason.textContent=`${String(report.reason_code||'UNRECORDED')}: ${String(report.reason||'No delivery reason recorded')}`}
function renderDevelopmentStatus(data){const status=String(data.phase||data.status||'UNKNOWN').toUpperCase();const current=data.currentJob||{};const jobs=data.jobs||{};const get=(key)=>Array.isArray(jobs[key])?jobs[key]:[];$('#devOverallStatus').textContent=status;$('#devOverallDetail').textContent=String(data.result||'Status ledger loaded');$('#devCurrentJob').textContent=current.title||current.id||'—';$('#devCurrentPhase').textContent=String(current.phase||status);$('#devLastUpdate').textContent=data.lastUpdate?new Date(data.lastUpdate).toLocaleString(): '—';const tests=Array.isArray(current.tests)?current.tests:[];$('#devCurrentTests').innerHTML=tests.length?tests.map(x=>`<div class="dev-list-row"><b>${esc(x.label||x.command||'Test')}</b><small>${esc(x.result||'UNRECORDED')}</small></div>`).join(''):'<p class="mission-muted small">No current tests recorded.</p>';const labels=[['queued','QUEUED'],['working','WORKING'],['testing','TESTING'],['fixing','FIXING'],['completed','COMPLETE'],['failed','FAILED'],['blocked','BLOCKED']];$('#devJobGrid').innerHTML=labels.map(([key,label])=>`<article class="mission-panel dev-job-card"><span class="dev-state">${label}</span><b>${get(key).length}</b><small>${get(key).map(x=>esc(x.title||x.id||x)).join(' · ')||'None recorded'}</small></article>`).join('');const done=[...(data.completed||get('completed'))];$('#devCompletedList').innerHTML=done.length?done.map(x=>`<div class="dev-list-row"><b>${esc(x.title||x.id||'Task')}</b><small>${esc((x.files||[]).join(', ')||'Files not listed')}<br>${esc((x.tests||[]).join(' · ')||'Tests not listed')}</small></div>`).join(''):'<p class="mission-muted small">No completed tasks recorded.</p>';const blockers=[...get('failed'),...get('blocked'),...(data.blockers||[])];$('#devBlockerList').innerHTML=blockers.length?blockers.map(x=>`<div class="dev-list-row"><b>${esc(x.title||x.id||'Blocker')}</b><small>${esc(x.detail||x.reason||'Review required')}</small></div>`).join(''):'<p class="mission-muted small">No blockers recorded.</p>';const functionality=data.functionality||{};[['#devRealFeatures',functionality.real],['#devDemoFeatures',functionality.demo],['#devProviderFeatures',functionality.providerDependent]].forEach(([selector,items])=>{const list=$(selector);if(!list)return;list.innerHTML=Array.isArray(items)&&items.length?items.map(item=>`<li>${esc(item)}</li>`).join(''):'<li>None recorded</li>'})}
function searchDestination(query){
  const q=query.trim().toLowerCase();
  if(!q)return 'home';
  const aliases={
    market:'markets',markets:'markets',trading:'markets',trade:'markets',
    ai:'gani-ai','gani ai':'gani-ai',signal:'signals',signals:'signals',
    account:'profile',profile:'profile',analytics:'dashboard',dashboard:'dashboard',
    tool:'verify',tools:'verify',verification:'verify',learn:'education',education:'education',
    help:'support',support:'support',community:'community',telegram:'community',
    terminal:'terminal',shell:'terminal',files:'files',workspace:'files',
    vps:'vps-connections',connections:'vps-connections',charts:'charts',
    news:'news',calendar:'economic-calendar',economics:'economic-calendar',
    risk:'risk-management',performance:'performance',settings:'settings',about:'about-gani',
    more:'more',home:'home'
  };
  if(aliases[q])return aliases[q];
  const screen=$$('.screen').find(item=>{
    const title=(item.dataset.title||'').toLowerCase();
    return item.id!== 'development-control' && (title===q||title.includes(q)||q.includes(title));
  });
  return screen?.id||'discover';
}
function initRiskPlanner(){
  const form=$('#riskForm');if(!form)return;
  form.addEventListener('submit',e=>{
    e.preventDefault();
    const account=Number($('#riskAccount').value),percent=Number($('#riskPercent').value),entry=Number($('#riskEntry').value),stop=Number($('#riskStop').value);
    const note=$('#riskFormNote');
    if(!(account>0&&percent>0&&percent<=100&&entry>0&&stop>0)||entry===stop){
      note.textContent='Use positive values and make entry and stop different.';note.className='form-note error';return;
    }
    const loss=account*percent/100,distance=Math.abs(entry-stop),position=loss/distance;
    $('#riskMaxLoss').textContent=loss.toFixed(2);
    $('#riskLossDetail').textContent=`${percent}% of ${account.toFixed(2)} account size`;
    $('#riskDistance').textContent=distance.toFixed(Math.min(5,Math.max(2,String(entry).split('.')[1]?.length||2)));
    $('#riskDistanceDetail').textContent=entry>stop?'Protective stop below entry':'Protective stop above entry';
    $('#riskPosition').textContent=position.toFixed(2);
    $('#riskPositionDetail').textContent='Loss ÷ price distance';
    note.textContent='Plan calculated locally. Confirm contract value and execution costs before relying on it.';note.className='form-note success';
  });
}
function initWorkspace(){
  const form=$('#readinessForm');
  if(!form)return;
  const checks=[...form.querySelectorAll('input[type="checkbox"]')];
  const badge=$('#v27ReadinessBadge'),kpi=$('#v27ReadyState');
  let note=form.querySelector('.readiness-note');
  if(!note){note=document.createElement('p');note.className='form-note readiness-note';note.setAttribute('role','status');form.append(note)}
  const render=()=>{
    const complete=checks.filter(input=>input.checked).length;
    const percent=Math.round(complete/checks.length*100);
    const saved=localStorage.getItem('gani.readiness.saved')==='true';
    if(kpi)kpi.textContent=`${percent}%`;
    if(badge){badge.textContent=complete===checks.length?'Diyaar':`${complete}/${checks.length}`;badge.classList.toggle('success',complete===checks.length)}
    note.textContent=saved?`Readiness saved locally · ${complete}/${checks.length} checks complete.`:`${complete}/${checks.length} checks complete. Save when you are ready.`;
    note.className=`form-note readiness-note ${saved?'success':''}`;
  };
  try{const saved=JSON.parse(localStorage.getItem('gani.readiness.checks')||'[]');checks.forEach((input,index)=>{input.checked=saved[index]===true})}catch{}
  checks.forEach(input=>input.addEventListener('change',()=>{localStorage.setItem('gani.readiness.saved','false');render()}));
  form.addEventListener('submit',e=>{e.preventDefault();localStorage.setItem('gani.readiness.checks',JSON.stringify(checks.map(input=>input.checked)));localStorage.setItem('gani.readiness.saved','true');render();toast('Readiness saved on this device')});
  render();
}
function initTerminal(){terminalState.sessionId=terminalSession();terminalState.history=terminalStorage();terminalRender();$('#terminalForm')?.addEventListener('submit',e=>{e.preventDefault();const input=$('#terminalInput');const value=input.value;input.value='';terminalCommand(value)});$('#terminalInput')?.addEventListener('keydown',e=>{if((e.ctrlKey||terminalState.ctrlArmed)&&e.key.toLowerCase()==='c'){e.preventDefault();terminalState.ctrlArmed=false;if(terminalState.connected&&GANIAppData.isReal())GANIAppData.terminalInterrupt(terminalState.sessionId).then(()=>terminalWrite('^C Interrupt requested.','muted')).catch(()=>terminalWrite('^C Interrupt request failed.','error')).finally(terminalRender);else terminalWrite('^C No active backend process to interrupt.','muted');terminalRender();return}if(e.key==='Escape'){e.preventDefault();terminalState.ctrlArmed=false;e.currentTarget.value='';terminalRender();return}if(e.key==='Tab'){e.preventDefault();e.currentTarget.setRangeText('\t',e.currentTarget.selectionStart,e.currentTarget.selectionEnd,'end');return}if(e.key==='ArrowUp'||e.key==='ArrowDown'){e.preventDefault();if(!terminalState.history.length)return;terminalState.index=e.key==='ArrowUp'?Math.min(terminalState.index+1,terminalState.history.length-1):Math.max(terminalState.index-1,-1);e.currentTarget.value=terminalState.index<0?'':terminalState.history[terminalState.history.length-1-terminalState.index]}});$('#terminalReconnect')?.addEventListener('click',terminalReconnect);$('#terminalClear')?.addEventListener('click',()=>terminalCommand('clear'));$('#terminalCopy')?.addEventListener('click',async()=>{try{await navigator.clipboard.writeText(terminalState.output.join('\n'));toast('Terminal output copied')}catch{toast('Clipboard unavailable')}});$$('[data-terminal-key]').forEach(b=>b.addEventListener('click',()=>{const input=$('#terminalInput');input.focus();const key=b.dataset.terminalKey;if(key==='ARROWUP'||key==='ARROWDOWN'){input.dispatchEvent(new KeyboardEvent('keydown',{key:key==='ARROWUP'?'ArrowUp':'ArrowDown'}));return}if(key==='CTRL'){terminalState.ctrlArmed=!terminalState.ctrlArmed;terminalRender();toast(terminalState.ctrlArmed?'Ctrl armed — press C to interrupt':'Ctrl released');return}if(key==='TAB'){input.dispatchEvent(new KeyboardEvent('keydown',{key:'Tab'}));return}if(key==='ESC'){input.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape'}));return}}))}
async function verify(){const ref=$('#verifyInput').value.trim(),box=$('#verifyResult');if(!ref){toast('Enter a GANI reference');return}box.className='verify-result';box.innerHTML='<div class="skeleton"></div>';const r=await safe(()=>GANIAppData.verify(ref));if(!r){box.innerHTML='<div class="verify-ring"><span>!</span></div><small>VERIFICATION</small><h3>Unable to verify</h3><p>Check the data source and try again.</p>';return}const ok=String(r.status).toLowerCase()==='verified';box.className='verify-result '+(ok?'success':'fail');box.innerHTML=`<div class="verify-ring"><span>${ok?'✓':'!'}</span></div><small>VERIFICATION</small><h3>${ok?'Verified':'Not verified'}</h3><p>${esc(r.reference||ref)}</p><span class="status-pill ${ok?'':'neutral'}">${esc(r.mode||mode())}</span>`}
function bind(){
  $('#frontFaceStart')?.addEventListener('click',()=>{
    const frontFace=$('#ganiFrontFace');
    document.body.classList.remove('front-face-pending');
    document.documentElement.style.overflow='';
    document.body.style.overflow='';
    if(frontFace){
      frontFace.setAttribute('aria-hidden','true');
      frontFace.hidden=true;
      frontFace.inert=true;
      frontFace.style.display='none';
      frontFace.style.pointerEvents='none';
    }
    show('home',true);
    $('#homePrimaryExplore')?.focus({preventScroll:true});
  });
  // Authentication is intentionally unavailable until a real provider is configured.
  // Keep this guard truthful if the button is ever re-enabled by a future integration.
  $('#frontFaceSignIn')?.addEventListener('click',e=>{
    e.preventDefault();
    toast('Sign In is unavailable until authentication is configured');
  });
  // Delegate route controls so Home remains functional after any section re-renders.
  document.addEventListener('click',e=>{
    const control=e.target.closest?.('[data-screen]');
    if(!control||control.disabled||control.getAttribute('aria-disabled')==='true')return;
    e.preventDefault();
    show(control.dataset.screen);
  });
  document.addEventListener('keydown',e=>{
    if(e.key!=='Enter'&&e.key!==' ')return;
    const control=e.target.closest?.('[role="button"][data-screen]');
    if(!control||control.disabled||control.getAttribute('aria-disabled')==='true')return;
    e.preventDefault();
    show(control.dataset.screen);
  });
  $('#menuToggle')?.addEventListener('click',()=>{
    const menu=$('#mobileMenu');
    const open=!menu?.classList.contains('open');
    menu?.classList.toggle('open',open);
    $('#menuToggle')?.setAttribute('aria-expanded',String(open));
  });
  document.addEventListener('click',e=>{
    const menu=$('#mobileMenu'),toggle=$('#menuToggle');
    if(menu?.classList.contains('open')&&!menu.contains(e.target)&&!toggle?.contains(e.target)){
      menu.classList.remove('open');
      toggle?.setAttribute('aria-expanded','false');
    }
  });
  document.addEventListener('keydown',e=>{
    if(e.key!=='Escape')return;
    $('#mobileMenu')?.classList.remove('open');
    $('#menuToggle')?.setAttribute('aria-expanded','false');
    $('#searchPanel')?.classList.remove('open');
    $('#searchToggle')?.setAttribute('aria-expanded','false');
    $('#noticePanel')?.classList.remove('open');
    $('#noticeToggle')?.setAttribute('aria-expanded','false');
  });
  $('#searchToggle')?.addEventListener('click',()=>{$('#searchPanel')?.classList.add('open');$('#searchToggle')?.setAttribute('aria-expanded','true');$('#globalSearch')?.focus()});
  $('#searchClose')?.addEventListener('click',()=>{$('#searchPanel')?.classList.remove('open');$('#searchToggle')?.setAttribute('aria-expanded','false')});
  $('#noticeToggle')?.addEventListener('click',()=>{const panel=$('#noticePanel');const open=!panel?.classList.contains('open');panel?.classList.toggle('open',open);$('#noticeToggle')?.setAttribute('aria-expanded',String(open));if(open)loadNotices()});
  $('#noticeClose')?.addEventListener('click',()=>{$('#noticePanel')?.classList.remove('open');$('#noticeToggle')?.setAttribute('aria-expanded','false')});
  $('#marketSearch')?.addEventListener('input',renderMarket);$('#missionMarketSearch')?.addEventListener('input',renderMarket);$('#verifyBtn')?.addEventListener('click',verify);$('#verifyInput')?.addEventListener('keydown',e=>{if(e.key==='Enter')verify()});
  $('#marketCategory')?.addEventListener('change',renderMarket);$('#watchlistToggle')?.addEventListener('click',e=>{const on=e.currentTarget.getAttribute('aria-pressed')!=='true';e.currentTarget.setAttribute('aria-pressed',String(on));renderMarket()});
  $('#aiCompose')?.addEventListener('submit',e=>{e.preventDefault();const input=$('#aiInput'),text=input.value.trim();if(!text)return;addAIMessage('You',text);input.value='';setTimeout(()=>addAIMessage('GANI AI',localAssistant(text),'gani'),180)});$$('[data-prompt]').forEach(b=>b.addEventListener('click',()=>{const input=$('#aiInput');input.value=b.dataset.prompt;input.focus()}));
  $('#signalFilter')?.addEventListener('change',e=>$$('[data-signal-type]').forEach(card=>{card.hidden=e.target.value!=='all'&&card.dataset.signalType!==e.target.value}));
  $$('[data-demo-action]').forEach(b=>b.addEventListener('click',()=>{
    const action=b.dataset.demoAction;
    if(action==='Notifications'){
      const enabled=localStorage.getItem('gani.notifications.enabled')!=='false';
      localStorage.setItem('gani.notifications.enabled',String(!enabled));
      b.querySelector('small').textContent=!enabled?'Local notification preference enabled':'Local notification preference disabled';
      toast(!enabled?'Notifications enabled for this browser':'Notifications disabled for this browser');
      return;
    }
    if(action==='Data mode'){show('dashboard');toast(`Data source: ${mode().toUpperCase()}`);return}
    toast(`${action}: provider is not configured for this deployment`);
  }));
  $('#refreshDashboard')?.addEventListener('click',loadDashboard);
  $('#homeRefresh')?.addEventListener('click',refreshHome);
  $('#newApplication')?.addEventListener('click',()=>toast('Applications are not configured for this deployment'));
  $('#addPayment')?.addEventListener('click',()=>toast('Payment receipts require the authorized account service'));
  $('#newTicket')?.addEventListener('click',()=>show('support'));
  $('#markAllRead')?.addEventListener('click',async()=>{for(const n of state.notices.filter(n=>!n.read))await safe(()=>GANIAppData.markNotificationRead(n.id));await loadNotices()});
  $('#globalSearch')?.addEventListener('keydown',e=>{if(e.key==='Enter'){const query=e.target.value.trim();const destination=searchDestination(query);$('#searchPanel')?.classList.remove('open');show(destination);if(destination==='markets'||destination==='discover'){const marketSearch=destination==='markets'?$('#missionMarketSearch'):$('#marketSearch');if(marketSearch&&query&&!/^(market|markets|trading|trade)$/i.test(query))marketSearch.value=query;renderMarket()}else if(!query)toast('Search GANI sections or instruments')}});
  $('#telegramOpen')?.addEventListener('click',openTelegram);
  $('#filesRefresh')?.addEventListener('click',refreshFiles);
  $$('.v27-start').forEach(button=>button.addEventListener('click',()=>{show('workspace');toast(`${button.dataset.plan} workspace selected`)}));
  $('#partnerApply')?.addEventListener('submit',e=>{
    e.preventDefault();
    let note=e.currentTarget.querySelector('.form-note');
    if(!note){note=document.createElement('p');note.className='form-note';e.currentTarget.append(note)}
    note.textContent='Application not submitted: partner review requires an authenticated GANI backend.';
    note.className='form-note error';
    toast('Partner submission is unavailable');
  });
  window.addEventListener('hashchange',()=>show(location.hash.slice(1)||'home',false));
  window.addEventListener('popstate',()=>show(location.hash.slice(1)||'home',false));
}
window.addEventListener('DOMContentLoaded',async()=>{bind();initRiskPlanner();initWorkspace();initTerminal();initPreferences();initSupportRequest();updateMode();updateTelegram();const initialRoute=location.hash.slice(1)||'home';if(initialRoute!=='home'){document.body.classList.remove('front-face-pending');const frontFace=$('#ganiFrontFace');frontFace?.setAttribute('aria-hidden','true');if(frontFace)frontFace.inert=true}show(initialRoute,false);if('serviceWorker'in navigator&&location.protocol.startsWith('http'))navigator.serviceWorker.register('./sw.js',{updateViaCache:'none'}).catch(()=>{});const results=await Promise.all([loadMarket(),loadNotices(),loadAccounts(),loadProfile()]);setHomeLastChecked(results.slice(0,3).every(Boolean))});
})();
