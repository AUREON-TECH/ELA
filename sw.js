const CACHE_NAME='ela-shell-v1';
const SHELL=['./','./index.html','./manifest.webmanifest','./offline.html','./icons/icon-192.png','./icons/icon-512.png','./icons/icon-maskable-512.png'];

self.addEventListener('install',event=>{
  event.waitUntil(caches.open(CACHE_NAME).then(cache=>cache.addAll(SHELL)).then(()=>self.skipWaiting()));
});

self.addEventListener('activate',event=>{
  event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE_NAME).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});

function isSensitiveRequest(request,url){
  const auth=request.headers.get('authorization');
  const cookie=request.headers.get('cookie');
  const range=request.headers.get('range');
  const ifRange=request.headers.get('if-range');
  const sensitivePath=/(auth|login|logout|session|token|password|api|supabase|graphql)/i.test(url.pathname);
  const sensitiveQuery=[...url.searchParams.keys()].some(k=>/(token|key|password|secret|code|session|auth)/i.test(k));
  return Boolean(auth||cookie||range||ifRange||sensitivePath||sensitiveQuery);
}

function isCacheableResponse(response){
  if(!response || !response.ok || response.type==='opaque') return false;
  const cc=(response.headers.get('cache-control')||'').toLowerCase();
  const vary=(response.headers.get('vary')||'').toLowerCase();
  if(cc.includes('private')||cc.includes('no-store')) return false;
  if(response.headers.has('set-cookie')||response.headers.has('content-range')) return false;
  if(/authorization|cookie|range|if-range/.test(vary)) return false;
  return true;
}

self.addEventListener('fetch',event=>{
  const request=event.request;
  if(request.method!=='GET') return;
  const url=new URL(request.url);
  if(url.origin!==self.location.origin || isSensitiveRequest(request,url)) return;

  if(request.mode==='navigate'){
    event.respondWith(fetch(request).catch(()=>caches.match('./offline.html')));
    return;
  }

  event.respondWith(caches.match(request).then(async cached=>{
    if(cached) return cached;
    const response=await fetch(request);
    if(isCacheableResponse(response)){
      const cache=await caches.open(CACHE_NAME);
      await cache.put(request,response.clone());
    }
    return response;
  }));
});
