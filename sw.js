// Offline-first: serve from cache, refresh the cache in the background when online.
// routes/routes.json (the route list) is the exception: network first (short timeout), so new routes appear straight away.
// Bump CACHE when you change index.html and want phones to pick it up promptly.
// Adding or changing .gpx files does not need a bump: the page re-fetches every listed route each time it opens online.
var CACHE='routetracker-v0.6.0';
var FILES=['./','index.html','manifest.webmanifest','routes/routes.json'];
self.addEventListener('install',function(e){
 e.waitUntil(caches.open(CACHE).then(function(c){
  return c.addAll(FILES).then(function(){
   return fetch('routes/routes.json',{cache:'reload'}).then(function(r){return r.json()}).then(function(l){
    return c.addAll(l.map(function(x){return 'routes/'+x.file}));
   });
  }).catch(function(){});
 }).then(function(){return self.skipWaiting()}));
});
self.addEventListener('activate',function(e){
 e.waitUntil(caches.keys().then(function(ks){
  return Promise.all(ks.filter(function(k){return k!==CACHE}).map(function(k){return caches.delete(k)}));
 }).then(function(){return self.clients.claim()}));
});
function put(req,r){if(r&&r.ok){var cp=r.clone();caches.open(CACHE).then(function(c){c.put(req,cp)});}return r;}
self.addEventListener('fetch',function(e){
 var req=e.request;
 if(req.method!=='GET') return;
 if(new URL(req.url).origin!==self.location.origin) return; // never cache links added from other sites
 if(/routes\.json$/.test(new URL(req.url).pathname)){
  e.respondWith(new Promise(function(res){
   var done=false;
   function fallback(){caches.match(req,{ignoreSearch:true}).then(function(h){if(!done){done=true;res(h||fetch(req));}});}
   var t=setTimeout(fallback,2500);
   fetch(req,{cache:'no-cache'}).then(function(r){
    if(r&&r.ok){clearTimeout(t);done=true;res(put(req,r));}else{clearTimeout(t);fallback();}
   }).catch(function(){clearTimeout(t);fallback();});
  }));
  return;
 }
 e.respondWith(caches.match(req,{ignoreSearch:true}).then(function(hit){
  var net=fetch(req).then(function(r){return put(req,r)}).catch(function(){return hit});
  return hit||net;
 }));
});
