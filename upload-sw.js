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

function findFile(rawPath) {
  let p = decodeURIComponent(rawPath.split("?")[0].split("#")[0]).replace(/^\/+/, "").toLowerCase();
  if (p === "" || p.endsWith("/")) p += "index.html";
  if (FILES.has(p)) return FILES.get(p);
  // 접미사 매칭: 앞 디렉토리를 하나씩 벗겨가며 폴더 내 파일과 매칭(절대경로/베이스경로 대응)
  const parts = p.split("/");
  for (let i = 1; i < parts.length; i++) { const c = parts.slice(i).join("/"); if (FILES.has(c)) return FILES.get(c); }
  return null;
}
// referrer가 우리가 서빙한 업로드 파일과 '정확히' 일치하는가(중첩 ES모듈 import 등, referrer가 스코프 밖으로 벗어난 경우 대응)
// Prism 앱 자체 요청(referrer=/prism/)과 충돌하지 않도록 접미사가 아닌 정확 매칭 사용
function refIsUploadedFile(refPath) {
  let p = decodeURIComponent((refPath || "").split("?")[0].split("#")[0]).replace(/^\/+/, "").toLowerCase();
  if (p === "") return false;
  if (p.endsWith("/")) p += "index.html";
  return FILES.has(p);
}
self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url), ref = e.request.referrer || "";
  let refPath = ""; try { refPath = ref ? new URL(ref).pathname : ""; } catch (x) {}
  const inScope = url.pathname.includes(PREFIX), refInScope = ref.includes(PREFIX);
  const refIsUploaded = !refInScope && refIsUploadedFile(refPath); // 중첩 모듈 import 등
  if (!inScope && !refInScope && !refIsUploaded) return; // 업로드 폴더와 무관 → 통과(Prism 앱 자체 요청 미간섭)
  // 경로 결정: __prismup__/ 이후 부분(직접) 또는 요청 전체 경로(referrer 기반 절대경로)
  const rel = inScope ? url.pathname.slice(url.pathname.indexOf(PREFIX) + PREFIX.length) : url.pathname;
  const f = findFile(rel);
  if (f) e.respondWith(new Response(f.buf, { headers: { "Content-Type": f.ct || "application/octet-stream", "Cache-Control": "no-store" } }));
  else if (inScope) e.respondWith(new Response("Not found in uploaded folder: " + rel, { status: 404, headers: { "Content-Type": "text/plain; charset=utf-8" } }));
  // 스코프 밖인데 못 찾으면 respondWith 안 함 → 브라우저 기본 처리(외부 CDN 등 통과)
});
