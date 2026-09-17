const CACHE='ela-shell-v2';
const SHELL=[
  './',
  './index.html',
  './calendar.html',
  './signos.html',
  './offline.html',
  './manifest.webmanifest',
  './icon-192.svg',
  './icon-512.svg',
  './js/app.js',
  './js/state.js',
  './js/cycle.js',
  './js/diary.js',
  './js/agenda.js',
  './js/self-care.js',
  './js/insights.js'
];

self.addEventListener('install',event=>{
  event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(SHELL)).then(()=>self.skipWaiting()));
});

self.addEventListener('activate',event=>{
  event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim()));
});

function sensitive(request,url){
  const headers=request.headers;
  return request.method!=='GET' || headers.has('authorization') || headers.has('cookie') || headers.has('range') || headers.has('if-range') || /token|auth|session|password|senha|secret|apikey|api_key/i.test(url.pathname+url.search);
}

function safe(response){
  const cc=response.headers.get('cache-control')||'',vary=response.headers.get('vary')||'';
  return response.ok && !/private|no-store/i.test(cc) && !response.headers.has('set-cookie') && !response.headers.has('content-range') && !/authorization|cookie/i.test(vary);
}

self.addEventListener('fetch',event=>{
  const request=event.request,url=new URL(request.url);
  if(url.origin!==location.origin || sensitive(request,url)){
    event.respondWith(fetch(request));
    return;
  }

  if(request.mode==='navigate'){
    event.respondWith(fetch(request).then(response=>{
      if(safe(response)){
        const copy=response.clone();
        caches.open(CACHE).then(cache=>cache.put(request,copy));
      }
      return response;
    }).catch(async()=>{
      const direct=await caches.match(request);
      if(direct) return direct;
      const path=url.pathname.endsWith('/')?'./index.html':`./${url.pathname.split('/').pop()}`;
      return (await caches.match(path)) || (await caches.match('./offline.html'));
    }));
    return;
  }

  event.respondWith(caches.match(request).then(hit=>hit || fetch(request).then(response=>{
    if(safe(response)){
      const copy=response.clone();
      caches.open(CACHE).then(cache=>cache.put(request,copy));
    }
    return response;
  })));
});

self.addEventListener('notificationclick',event=>{
  event.notification.close();
  event.waitUntil(clients.matchAll({type:'window',includeUncontrolled:true}).then(list=>{
    for(const client of list){
      if('focus' in client) return client.focus();
    }
    if(clients.openWindow) return clients.openWindow('./index.html');
  }));
});
