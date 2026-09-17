const CACHE='ela-shell-v3';
const SHELL=[
  './',
  './index.html',
  './calendar.html',
  './insights.html',
  './lembretes.html',
  './privacidade.html',
  './signos.html',
  './manifest.webmanifest',
  './icon-192.svg',
  './icon-512.svg'
];

self.addEventListener('install',e=>e.waitUntil(
  caches.open(CACHE).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting())
));

self.addEventListener('activate',e=>e.waitUntil(
  caches.keys()
    .then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k))))
    .then(()=>self.clients.claim())
));

function sensitive(req,url){
  const h=req.headers;
  return req.method!=='GET'||h.has('authorization')||h.has('cookie')||h.has('range')||h.has('if-range')||/token|auth|session|password|senha|secret|apikey|api_key/i.test(url.pathname+url.search);
}

function safe(res){
  const cc=res.headers.get('cache-control')||'',vary=res.headers.get('vary')||'';
  return res.ok&&!/private|no-store/i.test(cc)&&!res.headers.has('set-cookie')&&!res.headers.has('content-range')&&!/authorization|cookie/i.test(vary);
}

self.addEventListener('fetch',e=>{
  const req=e.request,url=new URL(req.url);
  if(url.origin!==location.origin||sensitive(req,url)){
    e.respondWith(fetch(req));
    return;
  }
  if(req.mode==='navigate'){
    e.respondWith(
      fetch(req).then(res=>{
        if(safe(res)){
          const copy=res.clone();
          caches.open(CACHE).then(c=>c.put(req,copy));
        }
        return res;
      }).catch(()=>caches.match(req).then(hit=>hit||caches.match('./index.html')))
    );
    return;
  }
  e.respondWith(caches.match(req).then(hit=>hit||fetch(req).then(res=>{
    if(safe(res)){
      const copy=res.clone();
      caches.open(CACHE).then(c=>c.put(req,copy));
    }
    return res;
  })));
});