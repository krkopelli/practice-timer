const CACHE='practice-timer-v212';
const ASSETS=['./','./index.html','./manifest.webmanifest','./icon-180.png','./icon-192.png','./icon-512.png'];
const SDK='https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';

self.addEventListener('install',event=>{
  self.skipWaiting();
  event.waitUntil((async()=>{
    const cache=await caches.open(CACHE);
    await cache.addAll(ASSETS);
    // Best effort to allow an already-authenticated PWA to start offline.
    await cache.add(SDK).catch(()=>{});
  })());
});
self.addEventListener('activate',event=>event.waitUntil(
  caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k))))
    .then(()=>self.clients.claim())
));
self.addEventListener('fetch',event=>{
  const req=event.request,u=new URL(req.url);
  if(u.hostname.includes('supabase.co'))return; // never cache authentication or private API responses
  if(u.hostname.includes('jsdelivr.net')){
    event.respondWith(fetch(req).then(async response=>{
      if(response.ok)await caches.open(CACHE).then(c=>c.put(req,response.clone())).catch(()=>{});
      return response;
    }).catch(()=>caches.match(req)));
    return;
  }
  if(req.mode==='navigate'){
    event.respondWith(fetch(req).then(async response=>{
      if(response.ok)await caches.open(CACHE).then(c=>c.put('./index.html',response.clone())).catch(()=>{});
      return response;
    }).catch(()=>caches.match('./index.html')));
    return;
  }
  if(u.origin===self.location.origin){
    event.respondWith(caches.match(req).then(cached=>cached||fetch(req)));
  }
});
