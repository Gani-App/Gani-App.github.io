// Cache version is bumped whenever the public shell asset set changes.
const CACHE='gani-app-v44';
const CORE=['./','./index.html','./install.html','./download.html','./styles.css','./mission-001.css','./app-surface.css','./front-face.css','./front-face.css?v=front-face-owner-review-159','./front-face-owner-lock.css','./front-face-owner-lock.css?v=owner-front-face-10','./platform-v27.css','./platform-v28.css','./platform-v29.css','./platform-v30.css','./platform-v31.css','./platform-v32.css','./platform-v33.css','./platform-v34.css','./platform-v37.css','./platform-v38.css','./platform-v39.css','./platform-v40.css','./app.js','./platform-v27.js','./platform-v29.js','./platform-v40.js','./assets/gani-logo-transparent-v30.png','./assets/gani-front-face-crowned-emblem.png','./assets/gani-official-v34.png','./assets/gani-market-mountains-v29.png','./manifest.webmanifest','./gani-config.js','./mock-api.js','./mock-compat.js','./real-api-client.js','./api-mode-router.js','./data-adapter.js','./api-contract.json','./gani-development-status.json'];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(CORE)).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET')return;
  const url=new URL(event.request.url);
  if(url.origin!==self.location.origin||url.pathname.endsWith('.apk'))return;
  const navigation=event.request.mode==='navigate';
  const cacheable=/\.(?:css|js|png|jpg|jpeg|svg|webp|webmanifest|ico|woff2?)$/i.test(url.pathname)||url.pathname==='/'||url.pathname.endsWith('.html');
  if(!navigation&&!cacheable){
    event.respondWith(fetch(event.request,{cache:'no-store'}).catch(()=>Response.error()));
    return;
  }
  event.respondWith(
    (navigation?fetch(event.request,{cache:'no-store'}):caches.match(event.request).then(cached=>cached||fetch(event.request)))
      .then(response=>{if(response.ok&&cacheable)caches.open(CACHE).then(cache=>cache.put(event.request,response.clone()));return response})
      .catch(()=>caches.match(event.request).then(response=>response||(navigation?caches.match('./index.html'):Response.error())))
  );
});
