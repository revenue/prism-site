/* Prism 업로드 폴더 서버 — 사용자가 업로드한 폴더의 모든 파일을 가상 경로(__prismup__/)에서 서빙.
   내 콘텐츠만 메모리에서 서빙(외부 요청은 통과). 멀티페이지·fetch·@import·모든 에셋을 온전히 반영. */
const FILES = new Map();
const PREFIX = "/__prismup__/";

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));

self.addEventListener("message", (e) => {
  const d = e.data || {};
  if (d.type === "PRISM_UPLOAD") {
    if (d.reset) FILES.clear();
    for (const f of d.files) FILES.set(f.path, { buf: f.buf, ct: f.ct });
    if (e.ports && e.ports[0]) e.ports[0].postMessage({ ok: true, count: FILES.size });
  }
});

self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  const i = url.pathname.indexOf(PREFIX);
  if (i === -1) return; // 우리 것 아님 → 통과
  let p = decodeURIComponent(url.pathname.slice(i + PREFIX.length)).split("?")[0].split("#")[0];
  if (p === "" || p.endsWith("/")) p += "index.html";
  p = p.toLowerCase();
  const f = FILES.get(p);
  if (f) {
    e.respondWith(new Response(f.buf, { headers: { "Content-Type": f.ct || "application/octet-stream", "Cache-Control": "no-store" } }));
  } else {
    e.respondWith(new Response("Not found in uploaded folder: " + p, { status: 404, headers: { "Content-Type": "text/plain; charset=utf-8" } }));
  }
});
