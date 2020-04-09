//ws version
const version = "1.1";

//static Cash - App shel;
const appAssets = [
    'index.html',
    'main.js',
    'images/flame.png',
    'images/sync.png',
    'images/logo.png',
    'vendor/bootstrap.min.css',
    'vendor/jquery.min.js',
];

self.addEventListener("install", e => {
    e.waitUntil(
        caches.open(`static-${version}`)
            .then(cache => cache.addAll(appAssets))
    );
});

self.addEventListener("activate", e => {

    let cleaned = caches.keys().then(keys => {
        keys.forEach(key => {
            if (key !== `static-${version}` && key.match('static-')) {
                return caches.delete(key);
            }
        })
    })
})

// static cache strategy - cache with network fallback
const staticCashe = (res, cachename = `static-${version}`) => {
    return caches.match(res).then(cacheRes => {
        //return cache respons if found
        if (cacheRes) return cacheRes;
        //fall back to network
        return fetch(res).then(networkRes => {
            //update cache with new response
            caches.open(cachename)
                .then(cache => cache.put(res, networkRes))
            return networkRes.clone();
        })
    })
}

// network with cache fallback

const fallbackCashe = (res) => {

    return fetch(res).then(networkRes => {
        // check res is Ok else go to cache
        if (!networkRes.ok) throw 'Fetch Error';

        //update cache
        caches.open(`static-${version}`)
            .then(cache => cache.put(res, networkRes))

        return networkRes.clone();

    }).catch(err => caches.match(res));
};

const cleanGyphyCache = (giphys) => {

    // get gyphy cahce
    caches.open('giphy').then(cache => {

        cache.keys().then(keys => {
            keys.forEach(key => {

                if (giphys.includes(key.url)) cache.delete(key);
            })
        })
    })
}
// sw fwtch
self.addEventListener("fetch", e => {

    if (e.request.url.match(location.origin)) {
        e.respondWith(staticCashe(e.request));
    }
    else if (e.request.url.match('api.giphy.com/v1/gifs/trending')) {
        e.respondWith(fallbackCashe(e.request));
    }
    else if (e.request.url.match('giphy.com/media')) {
        e.respondWith(staticCashe(e.request, 'giphy'));
    }
})

// listen to message from main.js
self.addEventListener("message", e=>{
    if(e.data.action === 'cleanGiphyCache')cleanGyphyCache(e.data.giphys)
})