importScripts("xhr-shim.js");

const CACHE_NAME = "pyodide-cache-v1";
const urlsToCache = [
    "https://cdn.jsdelivr.net/pyodide/v0.23.4/full/pyodide.js",
    "https://cdn.jsdelivr.net/pyodide/v0.23.4/full/pyodide.asm.js",
    "https://cdn.jsdelivr.net/pyodide/v0.23.4/full/pyodide.asm.data",
    "https://cdn.jsdelivr.net/pyodide/v0.23.4/full/pyodide.asm.wasm",
    "https://cdn.jsdelivr.net/pyodide/v0.23.4/full/pyodide_py.tar",
    "https://cdn.jsdelivr.net/pyodide/v0.23.4/full/repodata.json",
];

self.addEventListener("install", (event) => {
    event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache)));
});

self.addEventListener("fetch", (event) => {
    event.respondWith(caches.match(event.request).then((response) => response || fetch(event.request)));
});

// Your service worker code here
self.addEventListener("install", (event) => {
    console.log("Service Worker installed");
});

self.addEventListener("activate", (event) => {
    console.log("Service Worker activated");
});

// Add more event listeners and functionality as needed
