// Cache version bumped for the password visibility and menu ingredient color update.
// IndexedDB (local orders/settings) is not touched when old asset caches are removed.
const CACHE='fda-dev-v2-20261104-finalizacao-v1';
const ASSETS=['./index.html','./manifest.webmanifest','./app/ui.js','./app/core.js','./app/storage.js','./app/seed.js','./app/app.css','./app/appearance.js','./app/order-intent.js'];
const scope=new URL(self.registration.scope);
const ASSET_URLS=new Map(ASSETS.map(path=>[new URL(path,scope).pathname,new URL(path,scope).href]));
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(
  caches.keys()
    .then(keys=>Promise.all(keys.filter(k=>k.startsWith('fda-dev-')&&k!==CACHE).map(k=>caches.delete(k))))
    .then(()=>self.clients.claim())
));
self.addEventListener('fetch',event=>{
  const request=event.request;
  const url=new URL(request.url);
  if(request.method!=='GET'||url.origin!==scope.origin)return;
  const isNavigation=request.mode==='navigate'&&url.pathname===new URL('./',scope).pathname;
  const cacheKey=ASSET_URLS.get(url.pathname)||(isNavigation?ASSET_URLS.get(new URL('./index.html',scope).pathname):null);
  if(!cacheKey)return;
  event.respondWith((async()=>{
    const cache=await caches.open(CACHE);
    try{
      const response=await fetch(request,{cache:'no-store'});
      if(response.ok)await cache.put(cacheKey,response.clone());
      return response;
    }catch{
      const cached=await cache.match(cacheKey);
      return cached||(isNavigation?await cache.match(ASSET_URLS.get(new URL('./index.html',scope).pathname)):null)||Response.error();
    }
  })());
});
