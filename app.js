/* Prism v2 — 테마 · 라이브러리 · 제너레이터(프리셋/스타일) · 스튜디오 · 코멘트 · 요청내역 */
"use strict";
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = (s = "") => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const fmtN = (n) => { const v = Number(n); if (!isFinite(v)) return String(n); const d = (typeof state !== "undefined" && state.style && state.style.decimals) || 0; if (d > 0) return v.toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d }); return Math.abs(v) >= 1000 ? v.toLocaleString("en-US") : (Math.round(v * 100) / 100).toString(); };
function toast(m) { const t = $("#toast"); t.textContent = m; t.classList.add("on"); clearTimeout(t._t); t._t = setTimeout(() => t.classList.remove("on"), 2100); }
const LS = { get: (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } }, set: (k, v) => localStorage.setItem(k, JSON.stringify(v)) };
const ICON = { sun: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>', moon: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>', pen: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/></svg>', close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>' };

/* ===================================================== THEME */
function initTheme() {
  const saved = LS.get("deckos-theme", "dark");
  applyTheme(saved);
  $("#themeToggle").onclick = () => applyTheme(document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark");
}
function applyTheme(t) {
  document.documentElement.setAttribute("data-theme", t);
  $("#themeToggle").innerHTML = t === "dark" ? ICON.sun : ICON.moon;
  LS.set("deckos-theme", t);
  if (typeof draw === "function" && document.getElementById("stageSvg")) draw();
}

/* ===================================================== LIBRARY */
const CAT_LABEL = { dataviz: "데이터 시각화", infographic: "인포그래픽", icon: "아이콘", illustration: "일러스트", presentation: "프레젠테이션", "ui-reference": "UI/UX 레퍼런스", "web-design": "웹·그래픽 영감" };
const TYPE_LABEL = { chart: "차트", map: "지도", infographic: "인포그래픽", icon: "아이콘", illustration: "일러스트", template: "템플릿", inspiration: "레퍼런스", article: "아티클" };
let CATALOG = { items: [], stats: {}, generated: "" };
const filter = { cat: null, type: null, source: null, q: "" };

const domainOf = (u) => { try { return new URL(u).hostname.replace(/^www\./, ""); } catch { return ""; } };
const faviconOf = (u) => { const d = domainOf(u); return d ? `https://www.google.com/s2/favicons?domain=${d}&sz=64` : ""; };

async function loadCatalog() {
  for (const url of ["./catalog.json", "../catalog/catalog.json"]) {
    try { const r = await fetch(url, { cache: "no-store" }); if (r.ok) { CATALOG = await r.json(); return; } } catch {}
  }
  toast("catalog.json 로드 실패");
}
function renderFacets() {
  const items = CATALOG.items || [];
  const count = (k, v) => items.filter((i) => i[k] === v).length;
  const srcName = Object.fromEntries(items.map((i) => [i.source, i.sourceName]));
  const mk = (arr, key, lm) => arr.map((v) => `<button class="facet-btn ${filter[key] === v ? "on" : ""}" data-facet="${key}" data-val="${esc(v)}"><span>${esc(lm ? (lm[v] || v) : v)}</span><span class="c">${count(key === "cat" ? "category" : key, v)}</span></button>`).join("");
  $("#facetCat").innerHTML = `<button class="facet-btn ${!filter.cat ? "on" : ""}" data-facet="cat" data-val=""><span>전체</span><span class="c">${items.length}</span></button>` + mk([...new Set(items.map((i) => i.category))], "cat", CAT_LABEL);
  $("#facetType").innerHTML = mk([...new Set(items.map((i) => i.type))], "type", TYPE_LABEL);
  $("#facetSource").innerHTML = mk([...new Set(items.map((i) => i.source))].sort((a, b) => count("source", b) - count("source", a)), "source", srcName);
  $$("[data-facet]").forEach((b) => b.onclick = () => { const k = b.dataset.facet, v = b.dataset.val || null; filter[k] = filter[k] === v ? null : v; renderFacets(); renderGrid(); });
}
function renderGrid() {
  const q = filter.q.toLowerCase();
  const items = (CATALOG.items || []).filter((i) => {
    if (filter.cat && i.category !== filter.cat) return false;
    if (filter.type && i.type !== filter.type) return false;
    if (filter.source && i.source !== filter.source) return false;
    if (q && !(`${i.title} ${(i.tags || []).join(" ")} ${i.sourceName}`.toLowerCase().includes(q))) return false;
    return true;
  }).slice(0, 300);
  const grid = $("#libGrid");
  if (!items.length) { grid.innerHTML = `<div class="empty">조건에 맞는 자산이 없습니다.</div>`; return; }
  grid.innerHTML = items.map((i) => {
    const isIcon = i.category === "icon";
    const fav = faviconOf(i.url) || faviconOf(i.sourceName);
    let thumb;
    if (i.thumb) thumb = `<div class="thumb ${isIcon ? "icon" : ""}"><img loading="lazy" src="${esc(i.thumb)}" onerror="this.replaceWith(logoFallback('${esc(fav)}','${esc((i.sourceName||"?")[0])}'))"/></div>`;
    else thumb = `<div class="thumb logo">${fav ? `<img loading="lazy" src="${esc(fav)}" onerror="this.replaceWith(letterPh('${esc((i.sourceName||"?")[0])}'))"/>` : `<span class="ph" style="font-family:var(--display);font-size:28px;font-weight:700;opacity:.5">${esc((i.sourceName||"?")[0])}</span>`}</div>`;
    const dl = i.asset ? `<button onclick="dlAsset('${esc(i.asset)}','${esc(i.title)}')">다운로드</button>` : "";
    return `<div class="card">${thumb}<div class="body"><div class="ttl">${esc(i.title)}</div><div class="meta"><span class="badge cat">${esc(CAT_LABEL[i.category] || i.category)}</span><span class="badge">${esc(i.sourceName)}</span></div><div class="acts"><button onclick="tryLibrary('${esc(i.id)}')">체험하기</button><a href="${esc(i.url)}" target="_blank" rel="noopener">원본</a>${dl}</div></div></div>`;
  }).join("");
  attachPeek(items);
}
window.logoFallback = (fav, letter) => { const d = document.createElement("img"); if (fav) { d.src = fav; d.style.cssText = "width:46px;height:46px;object-fit:contain"; d.onerror = () => d.replaceWith(letterPh(letter)); } else return letterPh(letter); return d; };
window.letterPh = (letter) => { const s = document.createElement("span"); s.textContent = letter; s.style.cssText = "font-family:var(--display);font-size:28px;font-weight:700;opacity:.5;color:var(--faint)"; return s; };
window.dlAsset = async (asset, title) => {
  for (const base of ["./", "../catalog/"]) { try { const r = await fetch(base + asset, { cache: "no-store" }); if (r.ok) { saveBlob(await r.blob(), (title || "asset").replace(/[^\w가-힣-]+/g, "_") + asset.slice(asset.lastIndexOf("."))); return; } } catch {} }
  toast("에셋 경로를 찾을 수 없습니다");
};

/* ===================================================== GENERATOR */
const PALETTES = [
  { name: "Editorial Blue", c: ["#4f8cff", "#2b5fd0", "#9ab8ff", "#1c3a7a", "#6ea0ff"] },
  { name: "Emerald", c: ["#10b981", "#059669", "#6ee7b7", "#065f46", "#34d399"] },
  { name: "Amber", c: ["#f59e0b", "#d97706", "#fcd34d", "#b45309", "#fbbf24"] },
  { name: "Rose", c: ["#f43f5e", "#be123c", "#fda4b5", "#9f1239", "#fb7185"] },
  { name: "Slate", c: ["#475569", "#1e293b", "#94a3b8", "#0f172a", "#64748b"] },
  { name: "Spectrum", c: ["#4f8cff", "#10b981", "#f59e0b", "#f43f5e", "#a78bfa"] },
  { name: "Pastel", c: ["#8ba4f9", "#7dd3fc", "#86efac", "#fcd34d", "#fda4af"] },
  { name: "Sunset", c: ["#fb7185", "#fb923c", "#fbbf24", "#f472b6", "#c084fc"] }
];
const BG = { white: "#ffffff", light: "#f4f6fa", dark: "#12161d", transparent: null };
function inkFor(bg) { return bg === "dark" ? { ink: "#eef2f8", ink2: "#9aa6b6", grid: "rgba(255,255,255,.12)", paper: BG.dark } : { ink: "#121722", ink2: "#5b6472", grid: "#e6e9ef", paper: BG[bg] }; }
const lighten = (hex, amt = 0.3) => { const n = parseInt(hex.slice(1), 16); let r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255; r = Math.round(r + (255 - r) * amt); g = Math.round(g + (255 - g) * amt); b = Math.round(b + (255 - b) * amt); return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1); };

const IC = { b: "#4f8cff", t: "#25c9b0", a: "#ffcf5c", r: "#ff7a8a", g: "#cbd5e3" };
const TEMPLATES = {
  bar: { name: "세로 막대", cols: [["label", "항목"], ["value", "값"]], icon: `<rect x="18" y="30" width="11" height="22" rx="2" fill="${IC.b}"/><rect x="34" y="18" width="11" height="34" rx="2" fill="${IC.t}"/><rect x="50" y="8" width="11" height="44" rx="2" fill="${IC.a}"/><rect x="66" y="24" width="11" height="28" rx="2" fill="${IC.r}"/>` },
  hbar: { name: "가로 랭킹", cols: [["label", "항목"], ["value", "값"]], icon: `<rect x="10" y="12" width="62" height="8" rx="4" fill="${IC.b}"/><rect x="10" y="26" width="46" height="8" rx="4" fill="${IC.t}"/><rect x="10" y="40" width="30" height="8" rx="4" fill="${IC.a}"/>` },
  line: { name: "라인", cols: [["label", "항목"], ["value", "값"]], icon: `<path d="M12,44 30,28 48,34 66,14 84,22 84,52 12,52Z" fill="${IC.b}" opacity=".16"/><polyline points="12,44 30,28 48,34 66,14 84,22" fill="none" stroke="${IC.b}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/><circle cx="66" cy="14" r="4" fill="${IC.a}"/>` },
  donut: { name: "도넛", cols: [["label", "항목"], ["value", "값"]], icon: `<circle cx="48" cy="30" r="17" fill="none" stroke="${IC.b}" stroke-width="9" stroke-dasharray="45 62"/><circle cx="48" cy="30" r="17" fill="none" stroke="${IC.t}" stroke-width="9" stroke-dasharray="30 77" stroke-dashoffset="-45"/><circle cx="48" cy="30" r="17" fill="none" stroke="${IC.a}" stroke-width="9" stroke-dasharray="32 75" stroke-dashoffset="-75"/>` },
  kpi: { name: "KPI 카드", cols: [["label", "지표"], ["value", "값"], ["delta", "증감%"]], icon: `<rect x="8" y="12" width="34" height="36" rx="5" fill="${IC.b}" opacity=".16"/><rect x="8" y="12" width="6" height="36" rx="3" fill="${IC.b}"/><rect x="54" y="12" width="34" height="36" rx="5" fill="${IC.t}" opacity=".16"/><rect x="54" y="12" width="6" height="36" rx="3" fill="${IC.t}"/>` },
  progress: { name: "진행률", cols: [["label", "항목"], ["value", "%"]], icon: `<rect x="12" y="16" width="72" height="8" rx="4" fill="${IC.b}" opacity=".2"/><rect x="12" y="16" width="48" height="8" rx="4" fill="${IC.b}"/><rect x="12" y="34" width="72" height="8" rx="4" fill="${IC.t}" opacity=".2"/><rect x="12" y="34" width="30" height="8" rx="4" fill="${IC.t}"/>` },
  comparison: { name: "A/B 비교", cols: [["label", "항목"], ["value", "A"], ["value2", "B"]], icon: `<rect x="16" y="20" width="11" height="32" rx="2" fill="${IC.b}"/><rect x="29" y="12" width="11" height="40" rx="2" fill="${IC.r}"/><rect x="56" y="28" width="11" height="24" rx="2" fill="${IC.b}"/><rect x="69" y="16" width="11" height="36" rx="2" fill="${IC.r}"/>` },
  timeline: { name: "타임라인", cols: [["label", "시점"], ["value", "내용"]], icon: `<line x1="12" y1="30" x2="84" y2="30" stroke="${IC.g}" stroke-width="2"/><circle cx="24" cy="30" r="5" fill="${IC.b}"/><circle cx="48" cy="30" r="5" fill="${IC.t}"/><circle cx="72" cy="30" r="5" fill="${IC.a}"/>` },
  bignum: { name: "빅 넘버", cols: [["label", "캡션"], ["value", "숫자"]], icon: `<text x="48" y="40" font-size="30" font-weight="800" text-anchor="middle" fill="${IC.b}">87%</text>` },
  area: { name: "영역", cols: [["label", "항목"], ["value", "값"]], icon: `<path d="M12,44 30,26 48,32 66,14 84,22 84,52 12,52Z" fill="${IC.t}" opacity=".3"/><polyline points="12,44 30,26 48,32 66,14 84,22" fill="none" stroke="${IC.t}" stroke-width="3" stroke-linejoin="round"/>` },
  radar: { name: "레이더", cols: [["label", "축"], ["value", "값"]], icon: `<polygon points="48,12 72,28 64,52 32,52 24,28" fill="none" stroke="${IC.g}" stroke-width="1.5"/><polygon points="48,22 62,32 56,46 40,46 34,32" fill="${IC.b}" opacity=".35" stroke="${IC.b}" stroke-width="2"/>` },
  gauge: { name: "게이지", cols: [["label", "지표"], ["value", "%"]], icon: `<path d="M18,46 A26,26 0 0 1 78,46" fill="none" stroke="${IC.b}" stroke-width="7" opacity=".18" stroke-linecap="round"/><path d="M18,46 A26,26 0 0 1 62,20" fill="none" stroke="${IC.b}" stroke-width="7" stroke-linecap="round"/>` },
  funnel: { name: "퍼널", cols: [["label", "단계"], ["value", "값"]], icon: `<path d="M14,10 82,10 66,26 30,26Z" fill="${IC.b}"/><path d="M31,28 65,28 56,42 40,42Z" fill="${IC.t}"/><path d="M41,44 55,44 50,54 46,54Z" fill="${IC.a}"/>` },
  pictograph: { name: "픽토그램", cols: [["label", "항목"], ["value", "수"]], icon: `<g fill="${IC.b}"><rect x="14" y="16" width="9" height="9" rx="2"/><rect x="27" y="16" width="9" height="9" rx="2"/><rect x="40" y="16" width="9" height="9" rx="2"/><rect x="14" y="30" width="9" height="9" rx="2"/><rect x="27" y="30" width="9" height="9" rx="2" opacity=".3"/></g>` },
  scatter: { name: "스캐터", cols: [["label", "이름"], ["value", "X"], ["value2", "Y"]], icon: `<circle cx="24" cy="42" r="4" fill="${IC.b}"/><circle cx="40" cy="30" r="6" fill="${IC.t}"/><circle cx="58" cy="34" r="4" fill="${IC.a}"/><circle cx="70" cy="18" r="7" fill="${IC.r}"/>` },
  table: { name: "표", cols: [["label", "항목"], ["value", "값"], ["value2", "비고"]], icon: `<rect x="14" y="12" width="68" height="36" rx="4" fill="none" stroke="${IC.b}" stroke-width="2"/><rect x="14" y="12" width="68" height="12" rx="4" fill="${IC.b}"/><line x1="48" y1="24" x2="48" y2="48" stroke="${IC.b}" stroke-width="1.5" opacity=".4"/><line x1="14" y1="36" x2="82" y2="36" stroke="${IC.b}" stroke-width="1.5" opacity=".4"/>` }
};
const DEFAULT_DATA = {
  bar: [["1분기", "120"], ["2분기", "185"], ["3분기", "240"], ["4분기", "312"]],
  hbar: [["서울", "418"], ["경기", "352"], ["부산", "196"], ["대구", "134"], ["인천", "121"]],
  line: [["1월", "42"], ["2월", "51"], ["3월", "48"], ["4월", "63"], ["5월", "79"], ["6월", "94"]],
  donut: [["유료 전환", "47"], ["무료 체험", "28"], ["이탈", "15"], ["기타", "10"]],
  kpi: [["월 활성 사용자", "47200", "12.4"], ["유료 전환율", "6.8%", "2.1"], ["평균 객단가", "38900", "-3.2"], ["리텐션", "82%", "5.0"]],
  progress: [["기획", "100"], ["디자인", "78"], ["개발", "45"], ["QA", "12"]],
  comparison: [["매출", "128", "196"], ["신규고객", "84", "142"], ["재방문", "56", "71"]],
  timeline: [["2026 Q1", "MVP 출시"], ["2026 Q2", "유료 플랜 도입"], ["2026 Q3", "글로벌 베타"], ["2026 Q4", "시리즈A"]],
  bignum: [["전년 대비 매출 성장", "247%"]],
  area: [["1월", "42"], ["2월", "51"], ["3월", "48"], ["4월", "63"], ["5월", "79"], ["6월", "94"]],
  radar: [["속도", "80"], ["품질", "95"], ["가격", "60"], ["지원", "88"], ["확장성", "72"]],
  gauge: [["목표 달성률", "68"]],
  funnel: [["방문", "1000"], ["가입", "620"], ["활성", "380"], ["결제", "142"]],
  pictograph: [["A안 지지", "64"], ["B안 지지", "36"]],
  scatter: [["서울", "82", "68"], ["부산", "55", "40"], ["대구", "38", "52"], ["인천", "70", "30"], ["광주", "45", "62"]],
  table: [["매출", "1,240만", "+12%"], ["신규고객", "842", "+8%"], ["재방문율", "68%", "+5%p"], ["객단가", "38,900", "-3%"]]
};
const PRESETS = [
  { name: "에디토리얼", pal: 0, bg: "white", font: "Outfit", grid: true, labels: true, rounded: true, gradient: false },
  { name: "볼드 임팩트", pal: 5, bg: "dark", font: "Outfit", grid: false, labels: true, rounded: true, gradient: true },
  { name: "미니멀", pal: 4, bg: "white", font: "Pretendard", grid: false, labels: true, rounded: false, gradient: false },
  { name: "파스텔", pal: 6, bg: "light", font: "Fraunces", grid: false, labels: true, rounded: true, gradient: true },
  { name: "코퍼레이트", pal: 0, bg: "white", font: "Pretendard", grid: true, labels: true, rounded: false, gradient: false },
  { name: "선셋", pal: 7, bg: "light", font: "Fraunces", grid: false, labels: true, rounded: true, gradient: true }
];
const state = { tpl: "bar", variant: 0, palette: 0, W: 1280, H: 720, rows: [], customPalette: ["#4f8cff", "#22c55e", "#f59e0b", "#ef4444", "#a855f7"], style: { bg: "white", font: "Outfit", grid: true, labels: true, rounded: true, gradient: false, fontScale: 1, textColor: "auto", sort: "none", decimals: 0, align: "left" } };
const VC = "#4f8cff";
const VARIANTS = {
  bar: [["막대", `<rect x="8" y="9" width="7" height="13" rx="1.5" fill="${VC}"/><rect x="19" y="5" width="7" height="17" rx="1.5" fill="${VC}"/><rect x="30" y="12" width="7" height="10" rx="1.5" fill="${VC}"/>`], ["롤리팝", `<g stroke="${VC}" stroke-width="2"><line x1="11" y1="22" x2="11" y2="10"/><line x1="22" y1="22" x2="22" y2="6"/><line x1="33" y1="22" x2="33" y2="13"/></g><g fill="${VC}"><circle cx="11" cy="9" r="3.4"/><circle cx="22" cy="5" r="3.4"/><circle cx="33" cy="12" r="3.4"/></g>`], ["외곽선", `<g fill="none" stroke="${VC}" stroke-width="2"><rect x="8" y="9" width="7" height="13" rx="1.5"/><rect x="19" y="5" width="7" height="17" rx="1.5"/><rect x="30" y="12" width="7" height="10" rx="1.5"/></g>`]],
  hbar: [["바", `<g fill="${VC}"><rect x="6" y="6" width="30" height="4" rx="2"/><rect x="6" y="15" width="20" height="4" rx="2"/></g>`], ["둥근", `<g fill="${VC}"><rect x="6" y="5" width="30" height="6" rx="3"/><rect x="6" y="15" width="20" height="6" rx="3"/></g>`], ["구분선", `<rect x="6" y="6" width="26" height="3" rx="1.5" fill="${VC}"/><line x1="6" y1="12" x2="38" y2="12" stroke="#cbd5e3"/><rect x="6" y="15" width="16" height="3" rx="1.5" fill="${VC}"/>`]],
  line: [["라인", `<polyline points="6,20 16,10 26,14 38,5" fill="none" stroke="${VC}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>`], ["영역", `<path d="M6,20 16,10 26,14 38,5 38,22 6,22Z" fill="${VC}" opacity=".3"/><polyline points="6,20 16,10 26,14 38,5" fill="none" stroke="${VC}" stroke-width="2.5"/>`], ["계단", `<polyline points="6,20 16,20 16,10 26,10 26,14 38,14 38,6" fill="none" stroke="${VC}" stroke-width="2.5" stroke-linejoin="round"/>`]],
  donut: [["도넛", `<circle cx="22" cy="13" r="8" fill="none" stroke="${VC}" stroke-width="4.5" stroke-dasharray="30 20"/>`], ["파이", `<circle cx="22" cy="13" r="9" fill="${VC}" opacity=".3"/><path d="M22,13 L22,4 A9,9 0 0 1 30,17 Z" fill="${VC}"/>`], ["반게이지", `<path d="M12,18 A10,10 0 0 1 32,18" fill="none" stroke="${VC}" stroke-width="4.5" stroke-linecap="round"/>`]],
  kpi: [["카드", `<rect x="10" y="5" width="24" height="16" rx="3" fill="${VC}" opacity=".18"/><rect x="10" y="5" width="4" height="16" rx="2" fill="${VC}"/>`], ["라인", `<rect x="10" y="7" width="16" height="4" rx="2" fill="${VC}"/><rect x="10" y="14" width="24" height="3" rx="1.5" fill="${VC}" opacity=".4"/>`]],
  progress: [["막대", `<rect x="6" y="8" width="32" height="6" rx="3" fill="${VC}" opacity=".2"/><rect x="6" y="8" width="20" height="6" rx="3" fill="${VC}"/>`], ["슬림", `<rect x="6" y="11" width="32" height="3" rx="1.5" fill="${VC}" opacity=".2"/><rect x="6" y="11" width="20" height="3" rx="1.5" fill="${VC}"/>`]],
  pictograph: [["사각", `<g fill="${VC}"><rect x="8" y="9" width="6" height="6" rx="1"/><rect x="17" y="9" width="6" height="6" rx="1"/><rect x="26" y="9" width="6" height="6" rx="1"/></g>`], ["원형", `<g fill="${VC}"><circle cx="11" cy="12" r="3.4"/><circle cx="22" cy="12" r="3.4"/><circle cx="33" cy="12" r="3.4"/></g>`]]
};
function dec(v) { const n = Number(String(v).replace(/[^0-9.\-]/g, "")); if (!isFinite(n)) return String(v); return n.toLocaleString("en-US", { minimumFractionDigits: state.style.decimals, maximumFractionDigits: state.style.decimals }); }
function palColors() { return state.palette === "custom" ? state.customPalette : PALETTES[state.palette].c; }
function palName() { return state.palette === "custom" ? "커스텀" : PALETTES[state.palette].name; }
function cols() { return TEMPLATES[state.tpl].cols; }
function seedRows() { state.rows = (DEFAULT_DATA[state.tpl] || []).map((r) => [...r]); }

function renderTemplates() {
  $("#tplGrid").innerHTML = Object.entries(TEMPLATES).map(([k, t]) => `<button class="tpl ${state.tpl === k ? "on" : ""}" data-tpl="${k}"><svg viewBox="0 0 96 60" fill="currentColor">${t.icon}</svg><span>${t.name}</span></button>`).join("");
  $$("[data-tpl]").forEach((b) => b.onclick = () => { state.tpl = b.dataset.tpl; state.variant = 0; seedRows(); renderTemplates(); renderDataTable(); draw(); });
  renderVariant();
}
function renderVariant() {
  const v = VARIANTS[state.tpl];
  if (!v) { $("#variantWrap").style.display = "none"; return; }
  $("#variantWrap").style.display = "block";
  $("#variantSeg").innerHTML = v.map(([name, icon], i) => `<button class="vtile ${state.variant === i ? "on" : ""}" data-variant="${i}"><svg viewBox="0 0 44 26">${icon}</svg><span>${name}</span></button>`).join("");
  $$("#variantSeg [data-variant]").forEach((b) => b.onclick = () => { state.variant = +b.dataset.variant; renderVariant(); draw(); });
}
function renderPresets() {
  $("#presetRow").innerHTML = PRESETS.map((p, i) => `<button class="preset ${state._preset === i ? "on" : ""}" data-preset="${i}"><div class="sw">${PALETTES[p.pal].c.slice(0, 4).map((c) => `<i style="background:${c}"></i>`).join("")}</div><span>${p.name}</span></button>`).join("");
  $$("[data-preset]").forEach((b) => b.onclick = () => { const p = PRESETS[+b.dataset.preset]; state._preset = +b.dataset.preset; state.palette = p.pal; state.style = { ...state.style, bg: p.bg, font: p.font, grid: p.grid, labels: p.labels, rounded: p.rounded, gradient: p.gradient, fontScale: 1, textColor: "auto" }; syncStyleUI(); renderPresets(); draw(); });
}
function renderDataTable() {
  const cs = cols();
  $("#dataRows").innerHTML = `<tr>${cs.map(([, h]) => `<td style="font-size:10px;color:var(--faint);padding-left:6px">${h}</td>`).join("")}<td></td></tr>` +
    state.rows.map((row, ri) => `<tr>${cs.map(([, ], ci) => `<td><input value="${esc(row[ci] ?? "")}" data-r="${ri}" data-c="${ci}"/></td>`).join("")}<td><button class="del" data-del="${ri}">×</button></td></tr>`).join("");
  $$("#dataRows input").forEach((inp) => inp.oninput = () => { state.rows[+inp.dataset.r][+inp.dataset.c] = inp.value; draw(); });
  $$("#dataRows [data-del]").forEach((b) => b.onclick = () => { state.rows.splice(+b.dataset.del, 1); renderDataTable(); draw(); });
}
function renderSwatches() {
  const preset = PALETTES.map((p, i) => `<div class="swatch ${state.palette === i ? "on" : ""}" data-pal="${i}" title="${p.name}"><div class="dots">${p.c.slice(0, 5).map((c) => `<i style="background:${c}"></i>`).join("")}</div></div>`).join("");
  const custom = `<div class="swatch ${state.palette === "custom" ? "on" : ""}" data-pal="custom" title="커스텀"><div class="dots">${state.customPalette.map((c) => `<i style="background:${c}"></i>`).join("")}</div></div>`;
  $("#swatches").innerHTML = preset + custom;
  $$("#swatches [data-pal]").forEach((s) => s.onclick = () => { state.palette = s.dataset.pal === "custom" ? "custom" : +s.dataset.pal; state._preset = -1; renderSwatches(); renderPresets(); draw(); });
  renderCustomPalette();
}
function renderCustomPalette() {
  const box = $("#customPalette"); if (!box) return;
  box.innerHTML = state.customPalette.map((c, i) => `<div style="display:flex;gap:6px;align-items:center">
    <input type="color" data-ci="${i}" value="${c}" style="width:34px;height:30px;border:1px solid var(--border);border-radius:7px;background:var(--bg-2);padding:2px" />
    <input type="text" data-hex="${i}" value="${c}" spellcheck="false" style="flex:1;background:var(--bg-2);border:1px solid var(--border);color:var(--text);padding:6px 9px;border-radius:7px;font-size:12px;font-family:ui-monospace,monospace" /></div>`).join("");
  const commit = (i, v) => { if (/^#?[0-9a-fA-F]{6}$/.test(v.trim())) { state.customPalette[i] = v.trim()[0] === "#" ? v.trim() : "#" + v.trim(); state.palette = "custom"; state._preset = -1; renderSwatches(); renderPresets(); draw(); } };
  $$("#customPalette [data-ci]").forEach((el) => el.oninput = () => commit(+el.dataset.ci, el.value));
  $$("#customPalette [data-hex]").forEach((el) => el.onchange = () => commit(+el.dataset.hex, el.value));
}
const TOGGLE_DEFS = [["grid", "그리드"], ["labels", "값 라벨"], ["rounded", "둥근 모서리"], ["gradient", "그라디언트"]];
function renderToggles() {
  $("#toggles").innerHTML = TOGGLE_DEFS.map(([k, l]) => `<button class="tg ${state.style[k] ? "on" : ""}" data-tg="${k}"><span>${l}</span><span class="dot"></span></button>`).join("");
  $$("[data-tg]").forEach((b) => b.onclick = () => { state.style[b.dataset.tg] = !state.style[b.dataset.tg]; state._preset = -1; renderToggles(); renderPresets(); draw(); });
}
function syncStyleUI() {
  $$("#bgSeg button").forEach((b) => b.classList.toggle("on", b.dataset.bg === state.style.bg));
  $$("#fontSeg button").forEach((b) => b.classList.toggle("on", b.dataset.font === state.style.font));
  const fs = state.style.fontScale || 1;
  if ($("#fontScale")) { $("#fontScale").value = fs; $("#fontScaleV").textContent = Math.round(fs * 100) + "%"; }
  const auto = !state.style.textColor || state.style.textColor === "auto";
  $$("#textColorMode button").forEach((b) => b.classList.toggle("on", auto ? b.dataset.tc === "auto" : b.dataset.tc === "custom"));
  if ($("#textColor") && !auto) $("#textColor").value = state.style.textColor;
  $$("#sortSeg button").forEach((b) => b.classList.toggle("on", b.dataset.sort === (state.style.sort || "none")));
  $$("#decSeg button").forEach((b) => b.classList.toggle("on", +b.dataset.dec === (state.style.decimals || 0)));
  $$("#alignSeg button").forEach((b) => b.classList.toggle("on", b.dataset.align === (state.style.align || "left")));
  renderSwatches(); renderToggles();
}

const num = (v) => { const n = parseFloat(String(v).replace(/[^0-9.\-]/g, "")); return isFinite(n) ? n : 0; };
function niceMax(m) { if (m <= 0) return 10; const p = Math.pow(10, Math.floor(Math.log10(m))); const r = m / p; return (r <= 1 ? 1 : r <= 2 ? 2 : r <= 5 ? 5 : 10) * p; }
function txt(x, y, s, size, fill, anchor = "start", weight = 400, family, edit = "") { return `<text ${edit} x="${x}" y="${y}" font-family="${family || state.style.font},Pretendard,sans-serif" font-size="${(size * (state.style.fontScale || 1)).toFixed(1)}" font-weight="${weight}" fill="${fill}" text-anchor="${anchor}">${esc(s)}</text>`; }

function draw() {
  const svg = $("#stageSvg"), W = state.W, H = state.H, st = state.style;
  svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
  const pal = palColors(); let { ink, ink2, grid, paper } = inkFor(st.bg);
  if (st.textColor && st.textColor !== "auto") { ink = st.textColor; ink2 = st.textColor; }
  const title = $("#gTitle").value.trim(), sub = $("#gSubtitle").value.trim(), P = Math.round(W * 0.06);
  let defs = "";
  if (st.gradient) defs = `<defs>${pal.map((c, i) => `<linearGradient id="g${i}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${lighten(c, .22)}"/><stop offset="1" stop-color="${c}"/></linearGradient>`).join("")}</defs>`;
  const fill = (i) => st.gradient ? `url(#g${i % pal.length})` : pal[i % pal.length];
  let head = defs + (paper ? `<rect width="${W}" height="${H}" fill="${paper}"/>` : "");
  const ctr = st.align === "center", tx = ctr ? W / 2 : P, ta = ctr ? "middle" : "start";
  let th = 0;
  if (title) { head += txt(tx, P + 28, title, Math.round(W * 0.032), ink, ta, 800, null, 'data-edit="title"'); th = 46; }
  if (sub) { head += txt(tx, P + th + 18, sub, Math.round(W * 0.016), ink2, ta, 500, null, 'data-edit="sub"'); th += 30; }
  const top = P + (title || sub ? th + 18 : 0), box = { x: P, y: top, w: W - P * 2, h: H - top - P };
  head += txt(W - P, H - P + 26, "Prism", 12, st.bg === "dark" ? "rgba(255,255,255,.35)" : "#b8bfc9", "end");
  // 정렬(범주형만)
  let rows = state.rows.filter((r) => (r[0] ?? "") !== "" || (r[1] ?? "") !== "");
  const CATEGORICAL = ["bar", "hbar", "donut", "funnel", "pictograph", "progress"];
  if (st.sort !== "none" && CATEGORICAL.includes(state.tpl)) { rows = [...rows].sort((a, b) => st.sort === "desc" ? num(b[1]) - num(a[1]) : num(a[1]) - num(b[1])); }
  svg.innerHTML = head + (RENDER[state.tpl] || RENDER.bar)(rows, box, pal, { ink, ink2, grid, fill, st, v: state.variant });
  $("#stageHint").textContent = `${TEMPLATES[state.tpl].name}${VARIANTS[state.tpl] && VARIANTS[state.tpl][state.variant] ? " · " + VARIANTS[state.tpl][state.variant][0] : ""} · ${rows.length}개 · ${W}×${H} · ${palName()}`;
}

const RENDER = {
  bar(rows, b, pal, o) { if (!rows.length) return ""; const max = niceMax(Math.max(...rows.map((r) => num(r[1])))); const n = rows.length, gap = b.w * .4 / n, bw = (b.w - gap * (n - 1)) / n, rad = o.st.rounded ? 5 : 0; let s = "";
    if (o.st.grid) for (let g = 0; g <= 4; g++) { const y = b.y + b.h - b.h * g / 4; s += `<line x1="${b.x}" y1="${y}" x2="${b.x + b.w}" y2="${y}" stroke="${o.grid}"/>` + txt(b.x - 10, y + 4, fmtN(max * g / 4), 13, o.ink2, "end"); }
    rows.forEach((r, i) => { const v = num(r[1]), h = b.h * (v / max), x = b.x + i * (bw + gap), y = b.y + b.h - h, cx = x + bw / 2, col = o.fill(i);
      if (o.v === 1) s += `<line x1="${cx}" y1="${b.y + b.h}" x2="${cx}" y2="${y}" stroke="${col}" stroke-width="3"/><circle cx="${cx}" cy="${y}" r="${Math.min(11, bw / 2.4)}" fill="${col}"/>`;
      else if (o.v === 2) s += `<rect x="${x}" y="${y}" width="${bw}" height="${h}" rx="${rad}" fill="none" stroke="${col}" stroke-width="2.6"/>`;
      else s += `<rect x="${x}" y="${y}" width="${bw}" height="${h}" rx="${rad}" fill="${col}"/>`;
      if (o.st.labels) s += txt(cx, y - 10, fmtN(v), 15, o.ink, "middle", 700); s += txt(cx, b.y + b.h + 24, r[0], 14, o.ink2, "middle"); }); return s; },
  hbar(rows, b, pal, o) { if (!rows.length) return ""; if (o.st.sort === "none") rows = [...rows].sort((a, c) => num(c[1]) - num(a[1])); const max = Math.max(...rows.map((r) => num(r[1]))) || 1; const n = rows.length, gap = 14, bh = Math.min(46, (b.h - gap * (n - 1)) / n), lw = 120, rad = o.v === 1 ? bh / 2 : (o.st.rounded ? 6 : 0), track = o.v !== 2; let s = "";
    rows.forEach((r, i) => { const v = num(r[1]), y = b.y + i * (bh + gap), w = (b.w - lw) * (v / max); s += txt(b.x + lw - 12, y + bh / 2 + 5, r[0], 15, o.ink, "end", 600) + (track ? `<rect x="${b.x + lw}" y="${y}" width="${b.w - lw}" height="${bh}" rx="${rad}" fill="${o.grid}"/>` : "") + `<rect x="${b.x + lw}" y="${y}" width="${Math.max(2, w)}" height="${bh}" rx="${rad}" fill="${o.fill(i)}"/>` + (o.v === 2 ? `<line x1="${b.x + lw}" y1="${y + bh + gap / 2}" x2="${b.x + b.w}" y2="${y + bh + gap / 2}" stroke="${o.grid}"/>` : ""); if (o.st.labels) s += txt(b.x + lw + w + 10, y + bh / 2 + 5, fmtN(v), 15, o.ink, "start", 700); }); return s; },
  line(rows, b, pal, o) { if (rows.length < 2) return RENDER.bar(rows, b, pal, o); const max = niceMax(Math.max(...rows.map((r) => num(r[1])))); const n = rows.length, dx = b.w / (n - 1); let s = "";
    if (o.st.grid) for (let g = 0; g <= 4; g++) { const y = b.y + b.h - b.h * g / 4; s += `<line x1="${b.x}" y1="${y}" x2="${b.x + b.w}" y2="${y}" stroke="${o.grid}"/>` + txt(b.x - 10, y + 4, fmtN(max * g / 4), 13, o.ink2, "end"); }
    const pts = rows.map((r, i) => [b.x + i * dx, b.y + b.h - b.h * (num(r[1]) / max)]);
    let path; if (o.v === 2) { path = `M${pts[0][0]} ${pts[0][1]}`; for (let i = 1; i < pts.length; i++) path += ` L${pts[i][0]} ${pts[i - 1][1]} L${pts[i][0]} ${pts[i][1]}`; } else path = pts.map((p, i) => (i ? "L" : "M") + p[0].toFixed(1) + " " + p[1].toFixed(1)).join(" ");
    const areaOp = o.v === 1 ? .32 : (o.st.gradient ? .18 : .1);
    s += `<path d="${path} L${pts[n - 1][0]} ${b.y + b.h} L${pts[0][0]} ${b.y + b.h} Z" fill="${pal[0]}" opacity="${areaOp}"/><path d="${path}" fill="none" stroke="${pal[0]}" stroke-width="3.5" stroke-linejoin="round" stroke-linecap="round"/>`;
    pts.forEach((p, i) => { if (o.v !== 2) s += `<circle cx="${p[0]}" cy="${p[1]}" r="5" fill="${o.st.bg === "dark" ? o.ink : "#fff"}" stroke="${pal[0]}" stroke-width="3"/>`; if (o.st.labels) s += txt(p[0], p[1] - 14, fmtN(num(rows[i][1])), 13, o.ink, "middle", 700); s += txt(p[0], b.y + b.h + 24, rows[i][0], 13, o.ink2, "middle"); }); return s; },
  donut(rows, b, pal, o) { if (!rows.length) return ""; const total = rows.reduce((a, r) => a + num(r[1]), 0) || 1; const semi = o.v === 2; const cx = b.x + b.h * .5 + 20, cy = semi ? b.y + b.h * .74 : b.y + b.h / 2, R = b.h * (semi ? .6 : .42), r0 = o.v === 1 ? 0 : R * (semi ? .55 : .6); let ang = semi ? Math.PI : -Math.PI / 2; const sweep = semi ? Math.PI : Math.PI * 2, pt = (rad, a) => [cx + rad * Math.cos(a), cy + rad * Math.sin(a)]; let s = "";
    rows.forEach((r, i) => { const fr = num(r[1]) / total, a2 = ang + fr * sweep, big = (a2 - ang) > Math.PI ? 1 : 0; const [x1, y1] = pt(R, ang), [x2, y2] = pt(R, a2); if (r0 > 0) { const [x3, y3] = pt(r0, a2), [x4, y4] = pt(r0, ang); s += `<path d="M${x1} ${y1} A${R} ${R} 0 ${big} 1 ${x2} ${y2} L${x3} ${y3} A${r0} ${r0} 0 ${big} 0 ${x4} ${y4} Z" fill="${o.fill(i)}"/>`; } else s += `<path d="M${cx} ${cy} L${x1} ${y1} A${R} ${R} 0 ${big} 1 ${x2} ${y2} Z" fill="${o.fill(i)}"/>`; ang = a2; });
    if (!semi && r0 > 0) s += txt(cx, cy - 4, fmtN(total), 34, o.ink, "middle", 800) + txt(cx, cy + 22, "TOTAL", 12, o.ink2, "middle", 600);
    const lx = cx + R + 46; rows.forEach((r, i) => { const ly = b.y + b.h / 2 - rows.length * 15 + i * 34; s += `<rect x="${lx}" y="${ly - 12}" width="14" height="14" rx="3" fill="${pal[i % pal.length]}"/>` + txt(lx + 22, ly, r[0], 15, o.ink, "start", 600) + txt(lx + 22, ly + 19, `${fmtN(num(r[1]))} · ${Math.round(num(r[1]) / total * 100)}%`, 13, o.ink2); }); return s; },
  kpi(rows, b, pal, o) { rows = rows.slice(0, 4); const n = rows.length || 1, gap = 24, cw = (b.w - gap * (n - 1)) / n, card = o.st.bg === "dark" ? "rgba(255,255,255,.05)" : "#f7f8fa", lineV = o.v === 1; let s = "";
    rows.forEach((r, i) => { const x = b.x + i * (cw + gap), d = parseFloat(r[2]); if (!lineV) s += `<rect x="${x}" y="${b.y}" width="${cw}" height="${b.h}" rx="${o.st.rounded ? 14 : 4}" fill="${card}" stroke="${o.grid}"/><rect x="${x}" y="${b.y}" width="6" height="${b.h}" rx="3" fill="${o.fill(i)}"/>`; else s += `<line x1="${x + 18}" y1="${b.y + 8}" x2="${x + 18}" y2="${b.y + b.h - 8}" stroke="${o.fill(i)}" stroke-width="3"/>`; const px = x + (lineV ? 32 : 26); s += txt(px, b.y + 46, r[0], 15, o.ink2, "start", 600) + txt(px, b.y + b.h * .62, fmtN(r[1]), Math.min(52, cw * .28), lineV ? o.fill(i) : o.ink, "start", 800); if (!isNaN(d)) s += txt(px, b.y + b.h - 30, `${d >= 0 ? "▲" : "▼"} ${Math.abs(d)}%`, 17, d >= 0 ? "#10b981" : "#f43f5e", "start", 700); }); return s; },
  progress(rows, b, pal, o) { if (!rows.length) return ""; const slim = o.v === 1, n = rows.length, gap = 22, bh = slim ? Math.min(10, (b.h - gap * (n - 1)) / n) : Math.min(28, (b.h - gap * (n - 1)) / n); let s = "";
    rows.forEach((r, i) => { const v = Math.max(0, Math.min(100, num(r[1]))), y = b.y + i * (bh + gap + 22); s += txt(b.x, y + 16, r[0], 15, o.ink, "start", 600) + txt(b.x + b.w, y + 16, v + "%", 15, o.ink, "end", 700) + `<rect x="${b.x}" y="${y + 26}" width="${b.w}" height="${bh}" rx="${bh / 2}" fill="${o.grid}"/><rect x="${b.x}" y="${y + 26}" width="${Math.max(bh, b.w * v / 100)}" height="${bh}" rx="${bh / 2}" fill="${o.fill(i)}"/>`; }); return s; },
  comparison(rows, b, pal, o) { if (!rows.length) return ""; const max = niceMax(Math.max(...rows.flatMap((r) => [num(r[1]), num(r[2])]))) || 1; const n = rows.length, group = b.w / n, bw = group * .28, rad = o.st.rounded ? 4 : 0; let s = txt(b.x, b.y - 8, "■ A", 13, pal[0], "start", 700) + txt(b.x + 44, b.y - 8, "■ B", 13, pal[3], "start", 700);
    rows.forEach((r, i) => { const gx = b.x + i * group + group / 2;[[num(r[1]), pal[0], -bw - 4], [num(r[2]), pal[3], 4]].forEach(([v, col, off]) => { const h = b.h * (v / max), x = gx + off, y = b.y + b.h - h; s += `<rect x="${x}" y="${y}" width="${bw}" height="${h}" rx="${rad}" fill="${col}"/>`; if (o.st.labels) s += txt(x + bw / 2, y - 8, fmtN(v), 13, o.ink, "middle", 700); }); s += txt(gx, b.y + b.h + 24, r[0], 14, o.ink2, "middle", 600); });
    return s + `<line x1="${b.x}" y1="${b.y + b.h}" x2="${b.x + b.w}" y2="${b.y + b.h}" stroke="${o.grid}"/>`; },
  timeline(rows, b, pal, o) { if (!rows.length) return ""; const n = rows.length, y = b.y + b.h / 2, dx = b.w / (n + 1); let s = `<line x1="${b.x}" y1="${y}" x2="${b.x + b.w}" y2="${y}" stroke="${o.grid}" stroke-width="3"/>`;
    rows.forEach((r, i) => { const x = b.x + dx * (i + 1), up = i % 2 === 0, col = pal[i % pal.length]; s += `<line x1="${x}" y1="${y}" x2="${x}" y2="${up ? y - 74 : y + 74}" stroke="${col}" stroke-width="2"/><circle cx="${x}" cy="${y}" r="9" fill="${col}" stroke="${o.st.bg === "dark" ? o.paper : "#fff"}" stroke-width="3"/>` + txt(x, up ? y - 92 : y + 100, r[0], 15, col, "middle", 800) + txt(x, up ? y - 70 : y + 122, r[1], 14, o.ink, "middle", 500); }); return s; },
  bignum(rows, b, pal, o) { const r = rows[0] || ["", ""], cx = b.x + b.w / 2, cy = b.y + b.h / 2; return txt(cx, cy + 20, r[1], Math.min(b.h * .7, b.w * .32), pal[0], "middle", 800) + txt(cx, cy + b.h * .28, r[0], Math.round(b.w * .02), o.ink2, "middle", 600); },
  area(rows, b, pal, o) { return RENDER.line(rows, b, pal, { ...o, v: 1 }); },
  radar(rows, b, pal, o) { const n = rows.length; if (n < 3) return RENDER.bar(rows, b, pal, o); const cx = b.x + b.w / 2, cy = b.y + b.h / 2, R = Math.min(b.w, b.h) * .38, max = niceMax(Math.max(...rows.map((r) => num(r[1])))), ang = (i) => -Math.PI / 2 + i * 2 * Math.PI / n; let s = "";
    for (let g = 1; g <= 4; g++) { const rr = R * g / 4; s += `<polygon points="${rows.map((_, i) => `${(cx + rr * Math.cos(ang(i))).toFixed(1)},${(cy + rr * Math.sin(ang(i))).toFixed(1)}`).join(" ")}" fill="none" stroke="${o.grid}"/>`; }
    rows.forEach((r, i) => { const x = cx + R * Math.cos(ang(i)), y = cy + R * Math.sin(ang(i)); s += `<line x1="${cx}" y1="${cy}" x2="${x}" y2="${y}" stroke="${o.grid}"/>` + txt(cx + (R + 20) * Math.cos(ang(i)), cy + (R + 20) * Math.sin(ang(i)) + 4, r[0], 13, o.ink2, "middle", 600); });
    s += `<polygon points="${rows.map((r, i) => { const rr = R * (num(r[1]) / max); return `${(cx + rr * Math.cos(ang(i))).toFixed(1)},${(cy + rr * Math.sin(ang(i))).toFixed(1)}`; }).join(" ")}" fill="${pal[0]}" fill-opacity="${o.st.gradient ? .35 : .25}" stroke="${pal[0]}" stroke-width="2.6"/>`;
    rows.forEach((r, i) => { const rr = R * (num(r[1]) / max), x = cx + rr * Math.cos(ang(i)), y = cy + rr * Math.sin(ang(i)); s += `<circle cx="${x}" cy="${y}" r="4" fill="${pal[0]}"/>`; if (o.st.labels) s += txt(x, y - 10, fmtN(num(r[1])), 12, o.ink, "middle", 700); }); return s; },
  gauge(rows, b, pal, o) { const r0 = rows[0] || ["", 0], v = Math.max(0, Math.min(100, num(r0[1]))), cx = b.x + b.w / 2, cy = b.y + b.h * .74, R = Math.min(b.w * .42, b.h * .72), A = (t) => Math.PI + t * Math.PI, pt = (rad, t) => [cx + rad * Math.cos(A(t)), cy + rad * Math.sin(A(t))], arc = (t1, t2, col, w) => { const [x1, y1] = pt(R, t1), [x2, y2] = pt(R, t2); return `<path d="M${x1} ${y1} A${R} ${R} 0 0 1 ${x2} ${y2}" fill="none" stroke="${col}" stroke-width="${w}" stroke-linecap="round"/>`; };
    return arc(0, 1, o.grid, 22) + arc(0, v / 100, o.fill(0), 22) + txt(cx, cy - 6, fmtN(v) + "%", 46, o.ink, "middle", 800) + txt(cx, cy + 24, r0[0], 16, o.ink2, "middle", 600); },
  funnel(rows, b, pal, o) { if (!rows.length) return ""; const max = Math.max(...rows.map((r) => num(r[1]))) || 1, n = rows.length, gap = 8, hh = (b.h - gap * (n - 1)) / n, cx = b.x + b.w / 2, top = num(rows[0][1]) || 1; let s = "";
    rows.forEach((r, i) => { const v = num(r[1]), nx = i < n - 1 ? num(rows[i + 1][1]) : v, wT = b.w * .82 * (v / max), wB = b.w * .82 * (nx / max), y = b.y + i * (hh + gap); s += `<path d="M${cx - wT / 2} ${y} L${cx + wT / 2} ${y} L${cx + wB / 2} ${y + hh} L${cx - wB / 2} ${y + hh} Z" fill="${o.fill(i)}"/>` + txt(cx, y + hh / 2 + 5, `${r[0]}  ${fmtN(v)}`, 15, "#ffffff", "middle", 700); if (o.st.labels) s += txt(b.x + b.w - 2, y + hh / 2 + 5, Math.round(v / top * 100) + "%", 14, o.ink2, "end", 700); }); return s; },
  pictograph(rows, b, pal, o) { if (!rows.length) return ""; const circ = o.v === 1, mx = Math.max(...rows.map((r) => num(r[1]))), per = Math.max(1, Math.ceil(mx / 50)), colN = 10, cell = Math.min(24, b.w * .5 / colN), rowH = cell * Math.ceil(50 / colN) + 46; let s = "";
    rows.forEach((r, i) => { const cnt = Math.round(num(r[1]) / per), y0 = b.y + i * rowH; s += txt(b.x, y0 + 14, r[0], 15, o.ink, "start", 700) + txt(b.x + b.w, y0 + 14, `${fmtN(num(r[1]))}${per > 1 ? " · 1칸=" + per : ""}`, 13, o.ink2, "end"); for (let k = 0; k < cnt; k++) { const x = b.x + (k % colN) * (cell + 4), y = y0 + 24 + Math.floor(k / colN) * (cell + 4); s += circ ? `<circle cx="${x + cell / 2}" cy="${y + cell / 2}" r="${cell / 2}" fill="${o.fill(i)}"/>` : `<rect x="${x}" y="${y}" width="${cell}" height="${cell}" rx="4" fill="${o.fill(i)}"/>`; } }); return s; },
  scatter(rows, b, pal, o) { if (!rows.length) return ""; const mx = niceMax(Math.max(...rows.map((r) => num(r[1])))), my = niceMax(Math.max(...rows.map((r) => num(r[2])))); let s = "";
    if (o.st.grid) for (let g = 0; g <= 4; g++) { const y = b.y + b.h - b.h * g / 4, x = b.x + b.w * g / 4; s += `<line x1="${b.x}" y1="${y}" x2="${b.x + b.w}" y2="${y}" stroke="${o.grid}"/>` + txt(b.x - 10, y + 4, fmtN(my * g / 4), 12, o.ink2, "end") + `<line x1="${x}" y1="${b.y}" x2="${x}" y2="${b.y + b.h}" stroke="${o.grid}"/>` + txt(x, b.y + b.h + 20, fmtN(mx * g / 4), 12, o.ink2, "middle"); }
    rows.forEach((r, i) => { const x = b.x + b.w * (num(r[1]) / mx), y = b.y + b.h - b.h * (num(r[2]) / my); s += `<circle cx="${x}" cy="${y}" r="9" fill="${o.fill(i)}" fill-opacity=".75"/>`; if (o.st.labels) s += txt(x, y - 14, r[0], 12, o.ink, "middle", 600); }); return s; },
  table(rows, b, pal, o) { if (!rows.length) return ""; const cs = cols(), nc = cs.length, n = rows.length, rh = Math.min(56, b.h / (n + 1)), cw = b.w / nc; let s = `<rect x="${b.x}" y="${b.y}" width="${b.w}" height="${rh}" rx="8" fill="${o.fill(0)}"/>`;
    cs.forEach(([, h], ci) => s += txt(b.x + cw * ci + 16, b.y + rh / 2 + 5, h, 15, "#ffffff", "start", 700));
    rows.forEach((r, ri) => { const y = b.y + (ri + 1) * rh; if (ri % 2) s += `<rect x="${b.x}" y="${y}" width="${b.w}" height="${rh}" fill="${o.grid}" opacity=".5"/>`; cs.forEach(([, ], ci) => s += txt(b.x + cw * ci + 16, y + rh / 2 + 5, r[ci] ?? "", ci === 0 ? 15 : 14, ci === 0 ? o.ink : o.ink2, "start", ci === 0 ? 600 : 400)); s += `<line x1="${b.x}" y1="${y + rh}" x2="${b.x + b.w}" y2="${y + rh}" stroke="${o.grid}"/>`; }); return s; }
};

function svgString(el) { const s = (el || $("#stageSvg")).cloneNode(true); s.setAttribute("xmlns", "http://www.w3.org/2000/svg"); return '<?xml version="1.0" encoding="UTF-8"?>\n' + s.outerHTML; }
function saveBlob(blob, name) { const u = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = u; a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(u), 1000); }
function fileBase() { return ($("#gTitle").value.trim() || TEMPLATES[state.tpl].name).replace(/[^\w가-힣-]+/g, "_"); }
function exportPng() { const scale = 2, W = state.W, H = state.H, img = new Image(); img.onload = () => { const cv = document.createElement("canvas"); cv.width = W * scale; cv.height = H * scale; const ctx = cv.getContext("2d"); ctx.scale(scale, scale); if (state.style.bg === "transparent") { } ctx.drawImage(img, 0, 0, W, H); cv.toBlob((b) => { saveBlob(b, fileBase() + ".png"); toast("PNG 저장됨"); }, "image/png"); }; img.onerror = () => toast("PNG 변환 실패"); img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svgString()); }

function onStageEdit(e) {
  const el = e.target.closest("[data-edit]"); if (!el) return;
  const field = { title: "#gTitle", sub: "#gSubtitle" }[el.getAttribute("data-edit")]; if (!field) return;
  const input = $("#inlineEdit"), r = el.getBoundingClientRect();
  input.value = $(field).value;
  input.style.left = Math.min(window.innerWidth - 270, Math.max(8, r.left)) + "px";
  input.style.top = Math.max(70, r.top - 6) + "px";
  input.style.width = Math.max(160, r.width + 40) + "px";
  input.style.display = "block"; input.focus(); input.select();
  input.oninput = () => { $(field).value = input.value; draw(); };
  const close = () => { input.style.display = "none"; input.oninput = null; input.onblur = null; input.onkeydown = null; };
  input.onkeydown = (ev) => { if (ev.key === "Enter" || ev.key === "Escape") close(); };
  input.onblur = close;
}
function initGenerator() {
  seedRows(); renderTemplates(); renderPresets(); renderDataTable(); syncStyleUI(); draw();
  $("#gTitle").value = "2026 분기별 매출 성장"; $("#gSubtitle").value = "단위 · 억원"; draw();
  $("#gTitle").oninput = draw; $("#gSubtitle").oninput = draw;
  $("#addRow").onclick = () => { state.rows.push(cols().map(() => "")); renderDataTable(); };
  $("#applyImport").onclick = () => { const r = parseImport($("#importBox").value); if (r && r.length) { state.rows = r; renderDataTable(); draw(); toast(`${r.length}개 행 import`); } };
  $("#loadFile").onclick = () => $("#fileInput").click();
  $("#fileInput").onchange = (e) => { const f = e.target.files[0]; if (!f) return; const rd = new FileReader(); rd.onload = () => { $("#importBox").value = rd.result; $("#applyImport").click(); }; rd.readAsText(f); };
  $$("#sizeToggle button").forEach((b) => b.onclick = () => { $$("#sizeToggle button").forEach((x) => x.classList.toggle("on", x === b)); state.W = +b.dataset.w; state.H = +b.dataset.h; draw(); });
  $$("#bgSeg button").forEach((b) => b.onclick = () => { state.style.bg = b.dataset.bg; state._preset = -1; syncStyleUI(); renderPresets(); draw(); });
  $$("#fontSeg button").forEach((b) => b.onclick = () => { state.style.font = b.dataset.font; state._preset = -1; syncStyleUI(); renderPresets(); draw(); });
  $("#fontScale").oninput = (e) => { state.style.fontScale = +e.target.value; $("#fontScaleV").textContent = Math.round(e.target.value * 100) + "%"; state._preset = -1; draw(); };
  $$("#textColorMode button").forEach((b) => b.onclick = () => { $$("#textColorMode button").forEach((x) => x.classList.toggle("on", x === b)); state.style.textColor = b.dataset.tc === "auto" ? "auto" : $("#textColor").value; state._preset = -1; draw(); });
  $("#textColor").oninput = (e) => { state.style.textColor = e.target.value; $$("#textColorMode button").forEach((x) => x.classList.toggle("on", x.dataset.tc === "custom")); state._preset = -1; draw(); };
  $("#useCustomPal").onclick = () => { state.palette = "custom"; state._preset = -1; renderSwatches(); renderPresets(); draw(); toast("커스텀 팔레트 적용됨"); };
  $$("#sortSeg button").forEach((b) => b.onclick = () => { state.style.sort = b.dataset.sort; state._preset = -1; syncStyleUI(); renderPresets(); draw(); });
  $$("#decSeg button").forEach((b) => b.onclick = () => { state.style.decimals = +b.dataset.dec; state._preset = -1; syncStyleUI(); renderPresets(); draw(); });
  $$("#alignSeg button").forEach((b) => b.onclick = () => { state.style.align = b.dataset.align; state._preset = -1; syncStyleUI(); renderPresets(); draw(); });
  $("#stageSvg").addEventListener("click", onStageEdit);
  $("#btnSvg").onclick = () => { saveBlob(new Blob([svgString()], { type: "image/svg+xml" }), fileBase() + ".svg"); toast("SVG 저장됨"); };
  $("#btnPng").onclick = exportPng;
  $("#btnCopy").onclick = () => navigator.clipboard.writeText(svgString()).then(() => toast("SVG 코드 복사됨"));
}
function parseImport(text) { text = text.trim(); if (!text) return null; if (text[0] === "[" || text[0] === "{") { try { let a = JSON.parse(text); if (!Array.isArray(a)) a = [a]; return a.map((o) => { if (Array.isArray(o)) return o.map(String); const k = Object.keys(o); return [o.label ?? o.name ?? o[k[0]], o.value ?? o.v ?? o[k[1]], o.value2 ?? o.delta ?? o[k[2]]].filter((x) => x !== undefined).map(String); }); } catch { toast("JSON 파싱 실패"); return null; } } const sep = text.includes("\t") ? "\t" : ","; let rows = text.split(/\r?\n/).filter((l) => l.trim()).map((l) => l.split(sep).map((c) => c.trim().replace(/^"|"$/g, ""))); if (rows[0] && rows[0].some((c) => /^(label|항목|name|시점|지표|캡션)$/i.test(c))) rows = rows.slice(1); return rows; }

/* ===================================================== STUDIO */
const studio = { icons: [], selected: null, color: "#4f8cff", stroke: 2, svgRaw: "" };
function initStudio() {
  studio.icons = (CATALOG.items || []).filter((i) => i.category === "icon");
  $("#studioCount").textContent = `(${studio.icons.length})`;
  renderStudioColors(); renderStudioGrid("");
  $("#studioSearch").oninput = (e) => renderStudioGrid(e.target.value.toLowerCase());
  $("#studioStroke").oninput = (e) => { studio.stroke = +e.target.value; renderStudioPreview(); };
  $("#studioDl").onclick = () => { if (!studio.svgRaw) return toast("아이콘 선택"); saveBlob(new Blob([recolored()], { type: "image/svg+xml" }), (studio.selected?.title || "icon").replace(/\s+/g, "-") + ".svg"); toast("SVG 저장됨"); };
  $("#studioCopy").onclick = () => { if (!studio.svgRaw) return toast("아이콘 선택"); navigator.clipboard.writeText(recolored()).then(() => toast("SVG 복사됨")); };
  $("#extractBtn").onclick = () => $("#extractFile").click();
  $("#extractFile").onchange = (e) => { const f = e.target.files[0]; if (f) extractPalette(f); };
}
function renderStudioColors() { $("#studioColors").innerHTML = palColors().map((c) => `<i data-c="${c}" class="${studio.color === c ? "on" : ""}" style="background:${c}"></i>`).join(""); $$("#studioColors i").forEach((el) => el.onclick = () => { studio.color = el.dataset.c; renderStudioColors(); renderStudioPreview(); }); }
function renderStudioGrid(q) {
  const list = studio.icons.filter((i) => !q || (`${i.title} ${(i.tags || []).join(" ")}`.toLowerCase().includes(q))).slice(0, 120);
  $("#studioGrid").innerHTML = list.map((i, idx) => `<button class="studio-ic ${studio.selected === i ? "on" : ""}" data-idx="${idx}"><img loading="lazy" src="${esc(i.thumb || "")}"/></button>`).join("") || `<div class="cmt-empty">아이콘 없음</div>`;
  $$("#studioGrid [data-idx]").forEach((b) => b.onclick = () => selectStudioIcon(list[+b.dataset.idx]));
}
async function selectStudioIcon(item) {
  studio.selected = item; renderStudioGrid($("#studioSearch").value.toLowerCase());
  studio.svgRaw = ""; $("#studioPreview").innerHTML = `<span style="color:var(--faint)">불러오는 중…</span>`;
  let raw = "";
  if (item.asset) for (const base of ["./", "../catalog/"]) { try { const r = await fetch(base + item.asset); if (r.ok) { raw = await r.text(); break; } } catch {} }
  if (!raw && item.thumb) { try { raw = await (await fetch(item.thumb)).text(); } catch {} }
  if (!raw || !raw.includes("<svg")) { $("#studioPreview").innerHTML = `<span style="color:var(--faint)">불러오기 실패 — 다른 아이콘을 선택하세요</span>`; return; }
  studio.svgRaw = raw; renderStudioPreview();
}
function recolored() {
  let s = studio.svgRaw;
  s = s.replace(/currentColor/g, studio.color);
  s = s.replace(/(fill|stroke)="(#[0-9a-fA-F]{3,8}|rgb[^"]+)"/g, (m, attr, val) => val.toLowerCase() === "none" ? m : `${attr}="${studio.color}"`);
  s = s.replace(/stroke-width="[\d.]+"/g, `stroke-width="${studio.stroke}"`);
  if (!/color=/.test(s)) s = s.replace(/<svg /, `<svg color="${studio.color}" `);
  return s;
}
function renderStudioPreview() { $("#studioPreview").innerHTML = studio.svgRaw ? recolored() : `<span style="color:var(--faint)">아이콘을 선택하세요</span>`; }
function extractPalette(file) {
  const img = new Image(); img.onload = () => {
    const cv = document.createElement("canvas"), sz = 48; cv.width = sz; cv.height = sz; const ctx = cv.getContext("2d"); ctx.drawImage(img, 0, 0, sz, sz);
    const d = ctx.getImageData(0, 0, sz, sz).data, buckets = {};
    for (let i = 0; i < d.length; i += 4) { if (d[i + 3] < 128) continue; const r = d[i] >> 5 << 5, g = d[i + 1] >> 5 << 5, b = d[i + 2] >> 5 << 5; const k = `${r},${g},${b}`; buckets[k] = (buckets[k] || 0) + 1; }
    const top = Object.entries(buckets).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([k]) => { const [r, g, b] = k.split(",").map(Number); return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1); });
    $("#extractedColors").innerHTML = top.map((c) => `<i data-c="${c}" style="background:${c}" title="클릭해 적용"></i>`).join("");
    $$("#extractedColors i").forEach((el) => el.onclick = () => { studio.color = el.dataset.c; renderStudioColors(); renderStudioPreview(); toast("추출한 색 적용됨"); });
    toast(`${top.length}색 추출 — 클릭해 아이콘에 적용`);
  }; img.onerror = () => toast("이미지 로드 실패"); img.src = URL.createObjectURL(file);
}

/* ===================================================== COMMENTS + REQUESTS */
let comments = LS.get("deckos-comments", []);   // {id,view,x,y,loc,text,status,createdAt}
let SERVER_REQ = { resolved: [] };
let cmtMode = false, pendingPin = null, pinSeq = () => (comments.reduce((m, c) => Math.max(m, c.n || 0), 0) + 1);
let currentView = "library";

async function loadRequests() { try { const r = await fetch("./requests.json", { cache: "no-store" }); if (r.ok) SERVER_REQ = await r.json(); } catch {} }

function initComments() {
  $("#cmtToggleIcon").innerHTML = ICON.pen;
  updateCmtCount();
  $("#cmtToggle").onclick = () => setCmtMode(!cmtMode);
  document.addEventListener("click", (e) => {
    if (!cmtMode) return;
    if (e.target.closest("#cmtPanel") || e.target.closest("#cmtToggle") || e.target.closest(".cmt-pin") || e.target.closest("header")) return;
    if (pendingPin) removePendingPin();
    const n = pinSeq(), el = e.target.closest("[id],section,.card,.panel,.stage,.tpl,.req") || e.target;
    pendingPin = { n, view: currentView, x: e.pageX, y: e.pageY, loc: el.id ? "#" + el.id : "." + (el.className || el.tagName).toString().split(" ")[0] };
    placePin(pendingPin, "pending-draft");
    $("#cmtDraft").focus();
  });
  $("#cmtAdd").onclick = addComment;
  $("#cmtCancel").onclick = () => { removePendingPin(); $("#cmtDraft").value = ""; toast("등록 취소됨"); };
  $("#cmtApply").onclick = applyRequest;
  $("#cmtGotoReq").onclick = () => { setCmtMode(false); goView("requests"); };
  $("#cmtDraft").addEventListener("keydown", (e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) addComment(); });
  renderCommentList();
}
function setCmtMode(on) { cmtMode = on; document.body.classList.toggle("cmt-mode", on); $("#cmtToggle").classList.toggle("on", on); $("#cmtToggleIcon").innerHTML = on ? ICON.close : ICON.pen; $("#cmtToggleLabel").textContent = on ? "닫기" : "코멘트"; $("#cmtPanel").classList.toggle("on", on); if (on) { $("#cmtViewLabel").textContent = `현재 페이지: ${viewName(currentView)}`; renderPins(); renderCommentList(); } else { if (pendingPin) removePendingPin(); clearPins(); } }
function viewName(v) { return { library: "라이브러리", builder: "웹 빌더", generator: "제너레이터", studio: "에셋 스튜디오", requests: "요청내역", docs: "Docs" }[v] || v; }
function placePin(c, extra = "") { const p = document.createElement("div"); p.className = "cmt-pin " + (c.status === "resolved" ? "resolved" : "") + " " + extra; p.dataset.pin = c.n; p.textContent = c.n; p.style.left = c.x + "px"; p.style.top = c.y + "px"; if (!extra.includes("draft")) p.onclick = (e) => { e.stopPropagation(); highlightComment(c.n); }; document.body.appendChild(p); }
function clearPins() { $$(".cmt-pin").forEach((p) => p.remove()); }
function renderPins() { clearPins(); comments.filter((c) => c.view === currentView).forEach((c) => placePin(c)); if (pendingPin && pendingPin.view === currentView) placePin(pendingPin, "pending-draft"); }
function removePendingPin() { $$(".cmt-pin.pending-draft").forEach((p) => p.remove()); pendingPin = null; }
function addComment() {
  const t = $("#cmtDraft").value.trim(); if (!t) return toast("변경 내용을 적어주세요");
  const base = pendingPin || { n: pinSeq(), view: currentView, loc: "(위치 미지정)", x: 0, y: 0 };
  comments.push({ ...base, id: "c" + Date.now(), text: t, status: "pending", createdAt: new Date().toISOString() });
  pendingPin = null; $("#cmtDraft").value = ""; persist(); renderPins(); renderCommentList(); updateCmtCount(); renderRequests();
  toast("코멘트 등록됨 — '적용 요청'으로 반영 요청");
}
function persist() { LS.set("deckos-comments", comments); }
function delComment(id) { comments = comments.filter((c) => c.id !== id); persist(); renderPins(); renderCommentList(); updateCmtCount(); renderRequests(); }
function renderCommentList() {
  const mine = comments.filter((c) => c.view === currentView);
  $("#cmtList").innerHTML = mine.length ? mine.map((c) => `<div class="cmt-item ${c.status === "resolved" ? "resolved" : ""}"><div class="top"><span class="loc">#${c.n} · ${esc(c.loc)}</span><span class="pill-tag ${c.status[0]}">${c.status === "pending" ? "대기" : c.status === "requested" ? "요청됨" : "해결"}</span></div><div class="txt">${esc(c.text)}</div><div class="row"><button data-req="${c.id}">적용 요청</button><button class="danger" data-del="${c.id}">삭제</button></div></div>`).join("") : `<div class="cmt-empty">이 페이지엔 코멘트가 없습니다.<br>화면 영역을 클릭해 핀을 찍고 요청을 남기세요.</div>`;
  $$("#cmtList [data-del]").forEach((b) => b.onclick = () => delComment(b.dataset.del));
  $$("#cmtList [data-req]").forEach((b) => b.onclick = () => applyRequest(b.dataset.req));
}
function highlightComment(n) { const el = [...$$("#cmtList .cmt-item")].find((x) => x.querySelector(".loc")?.textContent.includes("#" + n + " ")); if (el) { el.scrollIntoView({ block: "center" }); el.style.borderColor = "var(--accent)"; setTimeout(() => el.style.borderColor = "", 1200); } }
function applyRequest(oneId) {
  const targets = comments.filter((c) => c.status !== "resolved" && (oneId ? c.id === oneId : true));
  if (!targets.length) return toast("요청할 코멘트가 없습니다");
  targets.forEach((c) => c.status = "requested"); persist();
  const prompt = `# Prism 변경요청 (사이트: site/index.html, site/app.js)\n아래 코멘트를 반영해 UI/기능을 수정해줘. 반영 완료된 항목은 site/requests.json의 resolved 배열에 추가해 요청내역에서 '해결'로 표시되게 해줘.\n\n` + targets.map((c) => `- [${viewName(c.view)} · ${c.loc}] ${c.text}`).join("\n");
  navigator.clipboard.writeText(prompt).then(() => toast(`${targets.length}건 적용요청 프롬프트 복사 → Claude에 붙여넣기`)).catch(() => {});
  renderPins(); renderCommentList(); renderRequests(); updateCmtCount();
}
function updateCmtCount() { const n = comments.length; const el = $("#cmtCount"); el.textContent = n; el.style.display = n ? "inline-block" : "none"; $("#reqTabN").textContent = n ? n : ""; }

function renderRequests() {
  const resolved = (SERVER_REQ.resolved || []).map((r) => ({ ...r, status: "resolved", server: true }));
  const local = comments.map((c) => ({ n: c.n, loc: c.loc, text: c.text, status: c.status, view: c.view, date: c.createdAt, id: c.id }));
  const all = [...resolved, ...local];
  const counts = { pending: local.filter((c) => c.status === "pending").length, requested: local.filter((c) => c.status === "requested").length, resolved: resolved.length };
  $("#reqSummary").textContent = `해결 ${counts.resolved} · 요청됨 ${counts.requested} · 대기 ${counts.pending}`;
  const label = { pending: "대기", requested: "요청됨", resolved: "해결" };
  $("#reqList").innerHTML = all.length ? all.map((r, i) => `<div class="req"><div class="num">${r.n ?? (i + 1)}</div><div class="rc"><div class="rloc">${esc(r.view ? viewName(r.view) + " · " : "")}${esc(r.loc || "")}${r.server ? '<span style="color:var(--faint);font-weight:500"> · 반영됨</span>' : ""}</div><div class="rtext ${r.status === "resolved" ? "strike" : ""}">${esc(r.text)}</div>${r.note ? `<div class="rmeta">✓ ${esc(r.note)}${r.date ? " · " + r.date : ""}</div>` : (r.date ? `<div class="rmeta">${esc((r.date || "").slice(0, 16).replace("T", " "))}</div>` : "")}</div><span class="rstatus ${r.status}">${label[r.status]}</span></div>`).join("") : `<div class="empty">아직 요청이 없습니다. 코멘트 모드(우하단 버튼)로 요청을 남겨보세요.</div>`;
}
function initRequestsPage() {
  $("#reqCopyAll").onclick = () => applyRequest();
  $("#reqClearLocal").onclick = () => { if (!comments.length) return toast("비울 로컬 요청이 없습니다"); comments = []; persist(); renderPins(); renderCommentList(); renderRequests(); updateCmtCount(); toast("로컬 요청 비움"); };
}

/* ===================================================== WEB BUILDER v2 */
function hashN(s) { let h = 0; for (const c of String(s)) h = (h * 31 + c.charCodeAt(0)) >>> 0; return h; }
const FONTS = ["Outfit", "Fraunces", "Pretendard"], RADII = [6, 12, 20, 30];

// 무드: 색·폰트·둥글기 + 문구 톤/템플릿
const MOODS = {
  trust: { hue: 222, font: "Outfit", radius: 12, dark: false, tone: "명료하고 신뢰감 있는",
    heads: ["${p}, 복잡함을 명료함으로.", "결정의 속도를 바꾸는 ${p}.", "${g}—증명된 방식으로.", "일이 되게 만드는 ${p}.", "믿을 수 있는 기준, ${p}.", "${p}, 팀의 모든 결정을 한곳에서."],
    subs: ["흩어진 데이터를 한 화면에 모아 더 빠르고 정확한 결정을 돕습니다.", "도입 첫날부터 체감되는 명확함, ${p}가 팀의 기준이 됩니다.", "복잡한 과정을 걷어내고, 결과에만 집중하세요.", "수천 개의 팀이 ${p}로 더 나은 결정을 내립니다."] },
  warm: { hue: 22, font: "Fraunces", radius: 22, dark: false, tone: "따뜻하고 감성적인",
    heads: ["${p}, 하루의 가장 좋은 순간.", "오늘의 위로가 되는 ${p}.", "${g}, 정성을 담아.", "천천히, 그러나 다정하게 — ${p}.", "${p}, 마음이 머무는 자리.", "일상에 스며드는 ${p}."],
    subs: ["작은 디테일까지 정성으로, ${p}가 당신의 일상을 조금 더 다정하게 만듭니다.", "서두르지 않아도 좋아요. 여기, ${p}가 있으니까.", "좋은 것은 결국 정성에서 나옵니다. ${p}가 그 시간을 담았어요.", "매일이 조금 더 따뜻해지는 이유, ${p}."] },
  bold: { hue: 268, font: "Outfit", radius: 16, dark: true, tone: "대담하고 자신감 있는",
    heads: ["${p}. 판을 바꾼다.", "망설임은 끝, ${p} 시작.", "${g}—지금, 대담하게.", "한계는 어제까지, ${p}.", "${p}, 다음은 당신 차례.", "빠르게, 크게, ${p}."],
    subs: ["작게 시작해 크게 이깁니다. ${p}로 다음 단계로 도약하세요.", "경쟁이 아니라 기준이 되는 방법, ${p}.", "속도가 곧 경쟁력입니다. ${p}가 그 속도를 만듭니다.", "머뭇거릴 이유가 없어요. 결과가 증명합니다."] },
  calm: { hue: 158, font: "Pretendard", radius: 18, dark: false, tone: "차분하고 안정적인",
    heads: ["${p}, 차분하게 곁에서.", "건강한 변화의 시작, ${p}.", "${g}, 무리 없이.", "당신의 속도에 맞춘 ${p}.", "${p}, 오래 이어질 습관.", "조급함 없이, ${p}와 함께."],
    subs: ["과하지 않게, 꾸준하게. ${p}가 당신의 속도에 맞춥니다.", "작은 습관이 큰 변화로, ${p}와 함께 천천히.", "무리하지 않아야 오래갑니다. ${p}가 그 길을 함께해요.", "매일 조금씩, 나에게 맞는 방식으로."] },
  playful: { hue: 340, font: "Outfit", radius: 28, dark: false, tone: "발랄하고 친근한",
    heads: ["${p}, 재미가 다르다.", "오늘 뭐하지? ${p}.", "${g}, 신나게 시작.", "${p}, 지금 안 하면 손해.", "심심할 틈이 없는 ${p}.", "일단 해봐요, ${p}."],
    subs: ["복잡한 건 빼고 즐거움만, ${p}로 지금 바로 시작해요.", "친구에게 자랑하고 싶은 ${p}.", "어렵지 않아요. 몇 번의 탭이면 충분해요.", "오늘의 기분을 바꿔줄 작은 즐거움, ${p}."] },
  luxe: { hue: 38, font: "Fraunces", radius: 6, dark: true, tone: "고급스럽고 절제된",
    heads: ["${p}. 다른 격.", "절제된 아름다움, ${p}.", "${g}—당신의 기준으로.", "${p}, 시간이 증명하는 가치.", "덜어냄의 미학, ${p}.", "소수를 위한 ${p}."],
    subs: ["더할 것 없이 완성된 경험, ${p}가 제안하는 새로운 기준.", "소수를 위한 정교함, ${p}.", "화려함이 아니라 완성도로 말합니다.", "오래 곁에 둘수록 진가를 아는, ${p}."] }
};
// 원본 카피 풀 — 무드별 아이브로우·섹션 타이틀·CTA(어워드급 카피 패턴을 원본으로 생성)
const EYEBROWS = { trust: "WHY TEAMS CHOOSE US", warm: "OUR STORY", bold: "WHY NOW", calm: "HOW IT WORKS", playful: "WHY IT'S FUN", luxe: "THE DIFFERENCE" };
const SEC_TITLES = { trust: ["필요한 모든 것을,", "한 화면에서"], warm: ["작은 정성이", "큰 차이를 만듭니다"], bold: ["더 빠르게,", "더 대담하게"], calm: ["당신의 속도에", "맞춰 나아갑니다"], playful: ["복잡함은 빼고,", "즐거움만 더했어요"], luxe: ["절제된 완성도,", "디테일의 차이"] };
const SEC_SUBS = { trust: "설정부터 확장까지, 팀이 필요로 하는 모든 순간을 하나로.", warm: "손이 닿는 곳마다 담긴 정성이 경험을 다르게 만듭니다.", bold: "망설일 이유가 없습니다. 결과가 증명합니다.", calm: "무리하지 않아도 이어지는, 지속 가능한 방식.", playful: "지금 바로 시작할 수 있어요. 어렵지 않아요.", luxe: "덜어낼수록 선명해지는 완성도." };
const CTA_WORDS = { trust: ["무료로 시작하기", "데모 신청하기", "지금 시작하기"], warm: ["방문 예약하기", "메뉴 둘러보기", "이야기 시작하기"], bold: ["지금 도전하기", "무료로 체험하기", "바로 시작하기"], calm: ["천천히 시작하기", "무료로 체험하기", "함께 시작하기"], playful: ["지금 플레이하기", "무료로 시작하기", "합류하기"], luxe: ["컬렉션 보기", "상담 예약하기", "경험 시작하기"] };
const CTA2_WORDS = ["데모 보기", "더 알아보기", "둘러보기", "이야기 듣기"];
const INDUSTRIES = {
  "SaaS/소프트웨어": { mood: "trust", feats: [["빠른 온보딩", "설정 없이 5분 만에 팀 전체가 사용을 시작합니다."], ["실시간 협업", "같은 화면에서 함께 만들고 즉시 배포합니다."], ["엔터프라이즈 보안", "SSO·감사로그·권한관리를 기본 제공합니다."], ["강력한 자동화", "반복 작업을 규칙으로 자동화해 시간을 되찾습니다."], ["열린 연동", "쓰던 도구와 API·웹훅으로 매끄럽게 이어집니다."], ["실시간 인사이트", "지표를 대시보드 하나로 모아 바로 판단합니다."]], stats: [["99.9%", "가동률"], ["5분", "도입 시간"], ["4.8/5", "고객 만족"]], quote: ["도입 2주 만에 업무 시간이 절반으로 줄었습니다.", "박PM · B2B SaaS"] },
  "핀테크/금융": { mood: "trust", feats: [["안전한 자산관리", "금융권 수준의 암호화로 자산을 지킵니다."], ["한눈에 보는 흐름", "수입·지출·투자를 한 화면에 모읍니다."], ["자동 리포트", "매달 정산과 리포트를 자동으로."]], stats: [["0원", "숨은 수수료"], ["256bit", "암호화"], ["24/7", "모니터링"]], quote: ["복잡했던 자금 흐름이 명확해졌어요.", "정CFO"] },
  "AI/딥테크": { mood: "trust", feats: [["즉시 자동화", "반복 업무를 지능이 대신합니다."], ["당신의 데이터로", "맥락을 이해하는 맞춤 지능."], ["안심 운영", "프라이버시를 최우선으로 설계했습니다."]], stats: [["10배", "생산성"], ["초단위", "응답"], ["SOC2", "보안 수준"]], quote: ["팀의 속도가 완전히 달라졌습니다.", "기술 리드"] },
  "헬스케어/의료": { mood: "calm", feats: [["개인 맞춤 케어", "데이터 기반으로 나에게 맞는 관리를 제안합니다."], ["전문가 연결", "검증된 전문가와 언제든 상담하세요."], ["꾸준한 기록", "작은 변화까지 놓치지 않고 기록합니다."]], stats: [["+38%", "목표 달성률"], ["10만+", "함께한 사용자"], ["4.9★", "만족도"]], quote: ["무리하지 않고 꾸준히 이어갈 수 있었어요.", "이OO 사용자"] },
  "교육/이러닝": { mood: "calm", feats: [["나만의 커리큘럼", "수준과 목표에 맞춰 학습을 설계합니다."], ["실시간 피드백", "막히는 순간 바로 도움을 받습니다."], ["성취의 시각화", "진도와 성장을 한눈에 확인합니다."]], stats: [["2.3배", "완주율"], ["1:1", "맞춤 코칭"], ["4.8★", "수강 만족"]], quote: ["끝까지 완주한 강의는 처음이에요.", "수강생 김OO"] },
  "카페/디저트": { mood: "warm", feats: [["엄선한 원두", "매일 아침 정성껏 로스팅합니다."], ["아늑한 공간", "머무는 시간이 편안한 자리."], ["시즌 메뉴", "계절마다 새로운 즐거움을 준비합니다."], ["수제 디저트", "매일 소량으로 직접 구워 신선합니다."], ["편안한 예약", "몇 번의 탭으로 자리를 미리 잡으세요."], ["단골 혜택", "자주 오실수록 커지는 작은 선물."]], stats: [["4.9★", "방문자 평점"], ["매일", "신선 로스팅"], ["12종", "시그니처"]], quote: ["동네에서 가장 좋아하는 공간이 됐어요.", "단골 손님"] },
  "뷰티/코스메틱": { mood: "warm", feats: [["순한 성분", "피부를 먼저 생각한 배합."], ["나에게 맞게", "피부 타입별 맞춤 추천."], ["지속가능", "비건·크루얼티프리를 지향합니다."]], stats: [["98%", "재구매 의사"], ["0", "유해성분"], ["4.9★", "리뷰 평점"]], quote: ["바르는 순간 결이 달라졌어요.", "뷰티 에디터"] },
  "여행/숙박": { mood: "warm", feats: [["머무는 순간", "도착부터 특별하게."], ["믿을 수 있는 곳", "검증된 숙소만 큐레이션."], ["나만의 일정", "취향에 맞춘 여행 설계."]], stats: [["4.9★", "숙소 평점"], ["30초", "예약"], ["40+", "도시"]], quote: ["다음 여행도 여기서 예약할게요.", "여행자"] },
  "패션/의류": { mood: "luxe", feats: [["정제된 디자인", "시즌을 넘어 오래 입는 옷."], ["소재의 격", "손끝에서 느껴지는 차이."], ["한정 제작", "소수를 위한 정교한 수량."]], stats: [["100%", "프리미엄 소재"], ["한정", "시즌 컬렉션"], ["4.9★", "고객 평점"]], quote: ["옷장에서 가장 손이 자주 가요.", "고객 리뷰"] },
  "부동산/인테리어": { mood: "luxe", feats: [["공간의 완성", "비율과 빛까지 설계합니다."], ["검증된 매물", "엄선한 곳만 제안합니다."], ["처음부터 끝까지", "상담부터 시공까지 한 번에."]], stats: [["1,200+", "완성 사례"], ["5년", "A/S 보증"], ["4.9★", "시공 만족"]], quote: ["집이 완전히 달라졌습니다.", "입주 고객"] },
  "F&B/레스토랑": { mood: "playful", feats: [["오늘의 메뉴", "매일 신선한 재료로 준비합니다."], ["간편 예약", "몇 번의 탭으로 자리 예약."], ["단골 혜택", "자주 오실수록 커지는 즐거움."]], stats: [["4.8★", "맛 평점"], ["30초", "예약 완료"], ["1만+", "누적 방문"]], quote: ["분위기도 맛도 최고, 재방문 확정이에요.", "방문 고객"] },
  "게임/엔터": { mood: "playful", feats: [["바로 플레이", "설치 없이 지금 바로 즐기세요."], ["함께라서 재밌다", "친구와 함께하는 순간."], ["매주 새로움", "끊임없이 업데이트됩니다."]], stats: [["500만+", "플레이어"], ["매주", "신규 콘텐츠"], ["4.9★", "평점"]], quote: ["시간 순삭, 너무 재밌어요.", "유저 리뷰"] },
  "피트니스/웰니스": { mood: "bold", feats: [["성과가 보인다", "데이터로 확인하는 변화."], ["함께라서", "커뮤니티가 동기를 만듭니다."], ["언제 어디서나", "집에서도 이어지는 루틴."]], stats: [["+42%", "목표 달성"], ["12주", "변화 프로그램"], ["4.9★", "회원 만족"]], quote: ["처음으로 3개월을 버텼어요.", "회원 후기"] },
  "마케팅/에이전시": { mood: "bold", feats: [["성장에 집중", "숫자로 증명하는 캠페인."], ["빠른 실행", "기획부터 론칭까지 신속하게."], ["끝까지 함께", "성과가 날 때까지 파트너로."]], stats: [["3.2배", "평균 ROAS"], ["7일", "론칭까지"], ["120+", "성공 사례"]], quote: ["맡긴 뒤로 문의가 눈에 띄게 늘었어요.", "대표 클라이언트"] }
};
const PRODUCT_HINTS = ["데일리 로스터리", "핀리 가계부", "노바 CRM", "웰니스 클럽", "아틀리에 스튜디오", "브릭 부동산", "코스모 뷰티", "루멘 AI", "오르빗 애널리틱스", "베이스캠프 피트니스", "미도리 티하우스", "펄스 이벤트"];
const GOAL_HINTS = ["신규 방문 예약을 늘리고 싶어요", "무료체험 가입을 받고 싶어요", "브랜드를 알리고 싶어요", "사전예약을 모으고 싶어요", "상담 문의를 늘리고 싶어요", "제품 출시를 알리고 싶어요"];
// 디자인 어워드(Awwwards/CSSDA 등) 수상 이력이 있는 웹사이트 URL — 랜덤 레퍼런스 소스
const AWARD_SITES = [
  { n: "Lusion", u: "https://lusion.co" }, { n: "Obys Agency", u: "https://obys.agency" },
  { n: "Active Theory", u: "https://activetheory.net" }, { n: "Locomotive", u: "https://locomotive.ca" },
  { n: "Basement Studio", u: "https://basement.studio" }, { n: "14islands", u: "https://14islands.com" },
  { n: "Bruno Simon", u: "https://bruno-simon.com" }, { n: "Cuberto", u: "https://cuberto.com" },
  { n: "Phantom", u: "https://phantom.land" }, { n: "Igloo Inc", u: "https://igloo.inc" },
  { n: "Aristide Benoist", u: "https://aristidebenoist.com" }, { n: "Unseen Studio", u: "https://unseen.co" },
  { n: "Immersive Garden", u: "https://immersive-g.com" }, { n: "Hello Monday", u: "https://hellomonday.com" },
  { n: "Resn", u: "https://resn.global" }, { n: "Dogstudio", u: "https://dogstudio.co" }
];

const builder = { stack: [], theme: null, heroImage: null, refShot: null,
  features: [{ t: "빠른 시작", d: "설정 없이 바로 쓰는 워크플로우로 오늘 당장 결과를 냅니다." }, { t: "팀 협업", d: "역할과 권한을 나눠 함께 만들고 함께 배포합니다." }, { t: "안심 확장", d: "성장에 맞춰 자연스럽게 확장되는 견고한 기반." }],
  stats: [{ v: "+247%", l: "전년 대비 성장" }, { v: "47,200", l: "월 활성 사용자" }, { v: "99.9%", l: "가동률" }] };

const DEFAULT_THEME = { name: "Prism 기본", hue: 222, dark: false, font: "Outfit", radius: 16, accent: "#4f8cff", accent2: "#7aa7ff", bg: "#f5f7fb", surface: "#ffffff", ink: "#131822", muted: "#566072", border: "rgba(15,23,42,.09)", thumb: null };
function mkTheme({ name, hue, dark, font, radius, accent, accent2, thumb }) {
  return { name, hue, dark, font, radius,
    accent: accent || `hsl(${hue} 82% ${dark ? 62 : 50}%)`, accent2: accent2 || `hsl(${(hue + 40) % 360} 78% ${dark ? 58 : 52}%)`,
    bg: dark ? `hsl(${hue} 24% 8%)` : `hsl(${hue} 40% 98%)`, surface: dark ? `hsl(${hue} 18% 13%)` : "#ffffff",
    ink: dark ? "#f0f2f7" : `hsl(${hue} 32% 12%)`, muted: dark ? "hsl(220 10% 66%)" : `hsl(${hue} 14% 42%)`,
    border: dark ? "rgba(255,255,255,.1)" : "rgba(15,23,42,.09)", thumb: thumb || null };
}
function themeFromSource(item) { const h = hashN(item.source + item.id); return mkTheme({ name: item.sourceName, hue: h % 360, dark: (h >> 4) % 3 === 0, font: FONTS[h % 3], radius: RADII[(h >> 5) % 4], thumb: item.thumb && /^https?:/.test(item.thumb) ? item.thumb : null }); }
function moodTheme(moodKey) { const m = MOODS[moodKey]; const t = mkTheme({ name: m.tone, hue: m.hue, dark: m.dark, font: m.font, radius: m.radius }); t.layout = MOOD_LAYOUT[moodKey] || MOOD_LAYOUT.trust; return t; }
function activeTheme() { if (builder.theme) return { ...builder.theme, thumb: builder.heroImage || builder.theme.thumb }; if (builder.stack.length) { const t = themeFromSource(builder.stack[builder.stack.length - 1]); if (builder.stack.length > 1) t.accent2 = themeFromSource(builder.stack[builder.stack.length - 2]).accent; if (builder.heroImage) t.thumb = builder.heroImage; return t; } return { ...DEFAULT_THEME, thumb: builder.heroImage }; }

/* 이미지 색 추출 → 테마 */
function extractColors(img, n = 6) {
  const cv = document.createElement("canvas"), sz = 60; cv.width = sz; cv.height = sz;
  const ctx = cv.getContext("2d"); ctx.drawImage(img, 0, 0, sz, sz);
  const d = ctx.getImageData(0, 0, sz, sz).data, b = {};
  for (let i = 0; i < d.length; i += 4) { if (d[i + 3] < 128) continue; const k = `${d[i] >> 4 << 4},${d[i + 1] >> 4 << 4},${d[i + 2] >> 4 << 4}`; b[k] = (b[k] || 0) + 1; }
  return Object.entries(b).sort((a, c) => c[1] - a[1]).slice(0, n).map(([k]) => k.split(",").map(Number));
}
const _sat = (r, g, bl) => { const mx = Math.max(r, g, bl), mn = Math.min(r, g, bl); return mx === 0 ? 0 : (mx - mn) / mx; };
const _lum = (r, g, bl) => (0.299 * r + 0.587 * g + 0.114 * bl);
const _hex = (c) => "#" + c.map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0")).join("");
const _mix = (c, t, a) => c.map((v, i) => v + (t[i] - v) * a);
function paletteGrayness(rgbs) { return rgbs.reduce((a, c) => a + _sat(...c), 0) / (rgbs.length || 1); }
// 레퍼런스 화면의 시각적 밀도(busyness)를 측정 → 레이아웃 성격 추론(콘텐츠가 아닌 '구조 특성'만 차용)
function analyzeStructure(img) {
  const cv = document.createElement("canvas"), sz = 64; cv.width = sz; cv.height = sz;
  const ctx = cv.getContext("2d"); ctx.drawImage(img, 0, 0, sz, sz);
  const d = ctx.getImageData(0, 0, sz, sz).data, L = (i) => 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
  let diff = 0, cnt = 0;
  for (let y = 0; y < sz; y++) for (let x = 0; x < sz - 1; x++) { const i = (y * sz + x) * 4; diff += Math.abs(L(i) - L(i + 4)); cnt++; }
  return { busy: Math.min(1, (diff / cnt) / 42) };
}
function layoutFor(busy) {
  const airy = busy < 0.16, dense = busy > 0.34;
  return { archetype: airy ? "minimal" : dense ? "bold" : "editorial", space: airy ? 1.32 : dense ? 0.82 : 1, typeScale: airy ? 1.18 : dense ? 0.92 : 1, order: airy ? ["features", "quote"] : dense ? ["marquee", "stats", "features", "quote"] : ["marquee", "features", "stats", "quote"] };
}
const MOOD_LAYOUT = { trust: { archetype: "editorial", space: 1, typeScale: 1, order: ["marquee", "features", "stats", "quote"] }, warm: { archetype: "editorial", space: 1.12, typeScale: 1.06, order: ["marquee", "features", "quote", "stats"] }, bold: { archetype: "bold", space: 0.9, typeScale: 1.08, order: ["marquee", "stats", "features", "quote"] }, calm: { archetype: "minimal", space: 1.28, typeScale: 1.1, order: ["features", "quote"] }, playful: { archetype: "bold", space: 0.95, typeScale: 1.05, order: ["marquee", "stats", "features", "quote"] }, luxe: { archetype: "minimal", space: 1.34, typeScale: 1.16, order: ["features", "quote"] } };
// 레퍼런스 화면에서 전체 테마(배경·다크/라이트·주색·보조·중립)를 추출 — 색/무드만 차용(콘텐츠 복제 아님)
function themeFromRGBs(rgbs) {
  const dom = rgbs[0] || [244, 246, 250];               // 최빈색 ≈ 배경
  const dark = _lum(...dom) < 120;
  const vivid = [...rgbs].filter(c => _sat(...c) > 0.28 && _lum(...c) > 38 && _lum(...c) < 226).sort((a, c) => _sat(...c) - _sat(...a));
  const acc = vivid[0] || [79, 140, 255], acc2 = vivid[1] || _mix(acc, dark ? [255, 255, 255] : [0, 0, 0], .18);
  const bg = dark ? _mix(dom, [9, 11, 15], .45) : _mix(dom, [255, 255, 255], .55);
  const surface = dark ? _mix(bg, [255, 255, 255], .06) : [255, 255, 255];
  const ink = dark ? [237, 241, 248] : [17, 21, 30];
  const mut = dark ? [150, 160, 176] : [92, 102, 118];
  const h = hashN(_hex(acc));
  return { name: "레퍼런스 추출", hue: h % 360, dark, font: FONTS[h % 3], radius: RADII[(h >> 5) % 4], accent: _hex(acc), accent2: _hex(acc2), bg: _hex(bg), surface: _hex(surface), ink: _hex(ink), muted: _hex(mut), border: dark ? "rgba(255,255,255,.1)" : "rgba(15,23,42,.1)", thumb: null };
}

/* 브리프 → 콘텐츠 생성 (무드·문구 톤 반영) */
function fillTpl(t, p, g) { return t.replace(/\$\{p\}/g, p).replace(/\$\{g\}/g, g || p); }
function generateFromBrief() {
  const industry = $("#bIndustry").value.trim(), product = $("#bProduct").value.trim(), goal = $("#bGoal").value.trim();
  const ind = INDUSTRIES[industry];
  const moodKey = ind ? ind.mood : "trust";
  const m = MOODS[moodKey], p = product || industry || "우리 서비스", seed = hashN(p + industry + goal);
  $("#bHead").value = fillTpl(m.heads[seed % m.heads.length], p, goal);
  $("#bSub").value = fillTpl(m.subs[seed % m.subs.length], p, goal);
  $("#bBrand").value = product || $("#bBrand").value || "Acme";
  $("#bCta").value = CTA_WORDS[moodKey][seed % CTA_WORDS[moodKey].length];
  $("#bCta2").value = CTA2_WORDS[seed % CTA2_WORDS.length];
  builder.copy = { eyebrow: EYEBROWS[moodKey], secTitle: SEC_TITLES[moodKey].join("<br>"), secSub: SEC_SUBS[moodKey] };
  if (ind) {
    let fp = ind.feats;
    if (fp.length > 3) { const off = seed % fp.length; fp = [0, 1, 2].map((k) => fp[(off + k) % fp.length]); }
    builder.features = fp.map(([t, d]) => ({ t: fillTpl(t, p, goal), d: fillTpl(d, p, goal) }));
    builder.stats = ind.stats.map(([v, l]) => ({ v, l }));
    $("#bQuote").value = ind.quote[0]; $("#bAuthor").value = ind.quote[1];
    renderFeatRows(); renderStatRows();
  }
  builder.theme = moodTheme(moodKey);
  renderMoodSwatch(); renderBuilder();
  toast(`${industry || "기본"} · ${m.tone} 무드로 초안 생성`);
}

/* 레퍼런스 URL 반영 — 디자인 DNA(색·다크/라이트·무드)만 추출해 원본 템플릿에 적용
   (레퍼런스 화면은 좌측 '레퍼런스 반영' 패널에 참고용으로만 표시, 결과물엔 저작권 있는 화면/에셋을 넣지 않음) */
function pullRefColors(shot, attempt) {
  const prox = `https://images.weserv.nl/?url=${encodeURIComponent(shot.replace(/^https?:\/\//, ""))}&w=280&n=${attempt}`;
  const img = new Image(); img.crossOrigin = "anonymous";
  img.onload = () => {
    let rgbs; try { rgbs = extractColors(img); } catch (e) { return; }
    if (paletteGrayness(rgbs) < 0.12 && attempt < 3) { setTimeout(() => pullRefColors(shot, attempt + 1), 2800); return; } // 아직 생성 중(회색) → 재시도
    const t = themeFromRGBs(rgbs); try { t.layout = layoutFor(analyzeStructure(img).busy); } catch { t.layout = MOOD_LAYOUT.trust; } builder.theme = t; renderMoodSwatch(); renderBuilder();
    toast("레퍼런스 색·무드 반영 완료");
  };
  img.onerror = () => { if (attempt < 3) setTimeout(() => pullRefColors(shot, attempt + 1), 2800); };
  img.src = prox;
}
function applyReference() {
  let url = $("#bRefUrl").value.trim(); if (!url) return toast("URL을 입력하세요");
  if (!/^https?:\/\//.test(url)) url = "https://" + url;
  const shot = `https://s.wordpress.com/mshots/v1/${encodeURIComponent(url)}?w=1200&h=900`;
  builder.refShot = shot;
  $("#bRefPreview").innerHTML = `<img src="${esc(shot)}" alt="reference"><div style="font-size:11px;color:var(--faint);margin-top:5px">참고용 · 색과 무드만 추출해 원본 디자인에 반영합니다</div>`;
  toast("레퍼런스 색·무드 추출 중…");
  pullRefColors(shot, 0);
}

function bcContent() { const cp = builder.copy || {}; return { brand: $("#bBrand").value || "Acme", head: $("#bHead").value || "", sub: $("#bSub").value || "", cta: $("#bCta").value || "시작하기", cta2: $("#bCta2").value || "더 알아보기", quote: $("#bQuote").value || "", author: $("#bAuthor").value || "", features: builder.features, stats: builder.stats, eyebrow: cp.eyebrow || "FEATURES", secTitle: cp.secTitle || "필요한 모든 것을,<br>한 화면에서", secSub: cp.secSub || "" }; }

function pageHTML(t, c) {
  const disp = t.font === "Pretendard" ? "Pretendard" : t.font;
  const hero = c.head || "여기에 헤드라인", dark = t.dark;
  const feats = (c.features || []).length ? c.features : [{ t: "특징", d: "설명" }];
  const AI = builder.assetIcons || [], ic = (i) => AI.length ? AI[i % AI.length] : "";
  const arrow = `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-3px"><path d="M5 12h14M13 6l6 6-6 6"/></svg>`;
  const grain = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E";
  const L = t.layout || { space: 1, typeScale: 1, order: ["marquee", "features", "stats", "quote"] };
  const pad = Math.round(90 * L.space);
  const fx = { glow: L.archetype !== "minimal", magnetic: L.archetype === "bold" };
  const headWords = esc(hero).split(" ").map((w, i) => `<span class="word" style="--wi:${i}">${w}</span>`).join(" ");
  return `<!DOCTYPE html><html lang="ko"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.css">
<link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&display=swap" rel="stylesheet">
<style>
:root{--a:${t.accent};--a2:${t.accent2};--bg:${t.bg};--sf:${t.surface};--ink:${t.ink};--mut:${t.muted};--bd:${t.border};--r:${t.radius}px;--ts:${L.typeScale};--glass:${dark ? "rgba(255,255,255,.04)" : "rgba(255,255,255,.7)"}}
*{margin:0;box-sizing:border-box}html{scroll-behavior:smooth}
body{background:var(--bg);color:var(--ink);font-family:'Pretendard',system-ui,sans-serif;word-break:keep-all;line-height:1.6;overflow-x:hidden}
.grain{position:fixed;inset:0;background-image:url("${grain}");background-size:180px;opacity:${dark ? ".05" : ".035"};mix-blend-mode:${dark ? "screen" : "multiply"};pointer-events:none;z-index:999}
.d{font-family:'${disp}','Pretendard',sans-serif;letter-spacing:-.02em}
.wrap{max-width:1140px;margin:0 auto;padding:0 28px}
.reveal{opacity:0;transform:translateY(26px);transition:opacity .9s cubic-bezier(.2,.7,.2,1),transform .9s cubic-bezier(.2,.7,.2,1);transition-delay:var(--d,0s)}
.reveal.rl{transform:translateX(-32px)}.reveal.rr{transform:translateX(32px)}.reveal.sc{transform:scale(.93)}
.reveal.in{opacity:1;transform:none}
/* 스크롤 진행바 */
.progress{position:fixed;top:0;left:0;height:3px;width:0;background:linear-gradient(90deg,var(--a),var(--a2));z-index:100;box-shadow:0 0 12px var(--a)}
/* 커서 글로우 */
.glow{position:fixed;top:0;left:0;width:460px;height:460px;border-radius:50%;background:radial-gradient(circle,color-mix(in srgb,var(--a) 20%,transparent),transparent 62%);pointer-events:none;z-index:1;transform:translate(-50%,-50%);opacity:0;transition:opacity .5s;mix-blend-mode:${dark ? "screen" : "multiply"};will-change:transform}
/* 헤드라인 단어 스태거 */
.word{display:inline-block;opacity:0;transform:translateY(.55em) rotate(3deg);transition:opacity .7s cubic-bezier(.2,.7,.2,1),transform .7s cubic-bezier(.2,.7,.2,1);transition-delay:calc(var(--wi)*55ms)}
.word.in{opacity:1;transform:none}
.magnetic{transition:transform .2s cubic-bezier(.2,.7,.2,1)}
[data-par]{will-change:transform}
@media(prefers-reduced-motion:reduce){.reveal,.word{opacity:1!important;transform:none!important}.glow{display:none}}
/* nav */
nav{position:sticky;top:0;z-index:50;backdrop-filter:blur(16px);background:${dark ? "rgba(10,12,16,.55)" : "rgba(255,255,255,.6)"};border-bottom:1px solid var(--bd)}
.nav-in{max-width:1140px;margin:0 auto;padding:15px 28px;display:flex;align-items:center;gap:26px}
.lg{font-weight:800;font-size:20px}.lg b{color:var(--a)}.nav-sp{flex:1}
nav a{color:var(--mut);text-decoration:none;font-size:14px;font-weight:600;transition:color .2s}nav a:hover{color:var(--ink)}
.btn{display:inline-flex;align-items:center;gap:8px;background:var(--a);color:#fff;padding:12px 22px;border-radius:calc(var(--r)*.7);font-weight:700;font-size:14.5px;border:0;cursor:pointer;transition:transform .2s,box-shadow .2s;box-shadow:0 8px 24px -8px var(--a)}
.btn:hover{transform:translateY(-2px);box-shadow:0 14px 30px -8px var(--a)}
.btn.lg2{padding:15px 30px;font-size:16px}
.ghost{display:inline-flex;align-items:center;gap:8px;background:transparent;border:1px solid var(--bd);color:var(--ink);padding:14px 26px;border-radius:calc(var(--r)*.7);font-weight:700;font-size:15px;cursor:pointer;transition:border-color .2s,background .2s}
.ghost:hover{border-color:var(--a)}
/* hero */
.hero{position:relative;padding:78px 0 60px;overflow:hidden}
.blob{position:absolute;border-radius:50%;filter:blur(70px);opacity:${dark ? ".55" : ".4"};z-index:0;animation:float 14s ease-in-out infinite}
.b1{width:460px;height:460px;background:var(--a);top:-140px;right:-80px}
.b2{width:380px;height:380px;background:var(--a2);bottom:-160px;left:-100px;animation-delay:-7s}
@keyframes float{0%,100%{transform:translate(0,0)}50%{transform:translate(-24px,26px)}}
.hero-grid{position:relative;z-index:1;display:grid;grid-template-columns:1.05fr .95fr;gap:48px;align-items:center}
.badge{display:inline-flex;align-items:center;gap:8px;padding:7px 15px;border-radius:100px;border:1px solid var(--bd);background:var(--glass);backdrop-filter:blur(8px);font-size:12.5px;font-weight:700;color:var(--mut);box-shadow:inset 0 1px 0 rgba(255,255,255,.12)}
.badge .dot{width:7px;height:7px;border-radius:50%;background:var(--a);box-shadow:0 0 0 4px color-mix(in srgb,var(--a) 25%,transparent)}
h1{font-size:calc(clamp(40px,6.4vw,76px)*var(--ts));font-weight:800;letter-spacing:-.035em;line-height:1.02;margin:22px 0}
.lead{color:var(--mut);font-size:clamp(16px,1.6vw,20px);max-width:44ch;margin-bottom:32px}
.cta{display:flex;gap:12px;flex-wrap:wrap}
.proof{display:flex;align-items:center;gap:14px;margin-top:30px}
.avatars{display:flex}.avatars i{width:34px;height:34px;border-radius:50%;border:2px solid var(--bg);margin-left:-10px;background:linear-gradient(135deg,var(--a),var(--a2))}.avatars i:first-child{margin-left:0}
.proof span{font-size:13.5px;color:var(--mut);font-weight:600}.proof b{color:var(--ink)}
.visual{position:relative}
.frame{position:relative;border-radius:calc(var(--r)*1.3);overflow:hidden;border:1px solid var(--bd);background:linear-gradient(150deg,var(--a),var(--a2));box-shadow:0 50px 90px -40px color-mix(in srgb,var(--a) 60%,transparent),0 0 0 1px var(--bd);aspect-ratio:4/3;transform:perspective(1200px) rotateY(-6deg) rotateX(3deg);transition:transform .5s}
.frame:hover{transform:perspective(1200px) rotateY(0) rotateX(0)}
.frame img{width:100%;height:100%;object-fit:cover}
.illus{position:absolute;inset:0;display:grid;place-items:center}
.win{width:74%;background:#ffffff;border:1px solid rgba(15,23,42,.08);border-radius:calc(var(--r)*.7);box-shadow:0 30px 60px -20px rgba(0,0,0,.45);overflow:hidden;transform:rotate(-1.5deg)}
.win-top{display:flex;gap:6px;padding:11px 13px;border-bottom:1px solid rgba(15,23,42,.07)}
.win-top i{width:9px;height:9px;border-radius:50%;background:#e2e6ee}.win-top i:first-child{background:var(--a)}
.win-body{padding:16px 16px 18px}
.chart{display:flex;align-items:flex-end;gap:7px;height:76px;margin-bottom:14px}
.chart span{flex:1;border-radius:5px 5px 0 0;background:linear-gradient(var(--a2),var(--a))}
.rows .ln{height:8px;border-radius:4px;background:#eaedf3;margin:8px 0}
.chip{position:absolute;width:48px;height:48px;border-radius:15px;background:var(--sf);border:1px solid var(--bd);box-shadow:0 16px 32px -12px rgba(0,0,0,.35);display:grid;place-items:center;color:var(--a);animation:float 6s ease-in-out infinite}
.chip svg{width:24px;height:24px}
.chip1{top:6%;right:0;animation-delay:-2s}.chip2{bottom:8%;left:-2%;animation-delay:-4s}
.floatcard{position:absolute;top:20px;left:-22px;background:var(--sf);border:1px solid var(--bd);border-radius:14px;padding:12px 16px;box-shadow:0 20px 40px -14px rgba(0,0,0,.3);display:flex;align-items:center;gap:10px;animation:float 6s ease-in-out infinite}
.floatcard .k{width:34px;height:34px;border-radius:10px;background:linear-gradient(135deg,var(--a),var(--a2));display:grid;place-items:center;color:#fff}.floatcard .k svg{width:18px;height:18px}.floatcard b{font-family:'${disp}';font-size:18px}.floatcard span{font-size:11px;color:var(--mut);display:block}
/* marquee */
.marquee{overflow:hidden;padding:40px 0;border-top:1px solid var(--bd);border-bottom:1px solid var(--bd);margin-top:30px;-webkit-mask:linear-gradient(90deg,transparent,#000 12%,#000 88%,transparent)}
.mtrack{display:flex;gap:64px;width:max-content;animation:scroll 22s linear infinite}
.mtrack span{font-weight:800;font-size:22px;letter-spacing:.5px;color:var(--mut);opacity:.6}
@keyframes scroll{to{transform:translateX(-50%)}}
/* sections */
section.blk{padding:90px 0}
.eyebrow{display:block;text-align:center;color:var(--a);font-weight:800;font-size:13px;letter-spacing:.14em;text-transform:uppercase;margin-bottom:14px}
h2{font-family:'${disp}';font-size:calc(clamp(28px,4vw,46px)*var(--ts));font-weight:800;letter-spacing:-.03em;line-height:1.08;text-align:center}
.subsec{text-align:center;color:var(--mut);margin:16px auto 46px;max-width:52ch;font-size:16px}
.bento{display:grid;grid-template-columns:1.25fr 1fr;grid-auto-rows:1fr;gap:18px}
.card{background:var(--sf);border:1px solid var(--bd);border-radius:calc(var(--r)*1.1);padding:32px;position:relative;overflow:hidden;transition:transform .3s,border-color .3s,box-shadow .3s}
.card:hover{transform:translateY(-4px);border-color:color-mix(in srgb,var(--a) 40%,var(--bd));box-shadow:0 24px 50px -30px var(--a)}
.card.big{grid-row:span 2;background:linear-gradient(160deg,color-mix(in srgb,var(--a) 12%,var(--sf)),var(--sf))}
.card .ic{width:54px;height:54px;border-radius:15px;background:linear-gradient(135deg,var(--a),var(--a2));margin-bottom:20px;box-shadow:0 10px 24px -8px var(--a);display:grid;place-items:center;color:#fff}
.card .ic svg{width:27px;height:27px;stroke-width:2}
.card h3{font-weight:700;font-size:19px;margin-bottom:10px;letter-spacing:-.01em}.card p{color:var(--mut);font-size:15px}
.card.big h3{font-size:26px}.card.big .viz{margin-top:26px;height:120px;border-radius:14px;background:linear-gradient(135deg,var(--a),var(--a2));opacity:.9;position:relative;overflow:hidden}
.card.big .viz::after{content:"";position:absolute;inset:16px;border-radius:10px;background:var(--sf);opacity:.9}
.stats{display:grid;grid-template-columns:repeat(3,1fr);gap:20px}
.stat{text-align:center;padding:28px 12px;border-radius:calc(var(--r)*1.1);background:var(--glass);border:1px solid var(--bd);backdrop-filter:blur(8px)}
.stat b{font-family:'${disp}';display:block;font-size:clamp(38px,5vw,58px);font-weight:900;line-height:1;background:linear-gradient(135deg,var(--a),var(--a2));-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent}
.stat span{color:var(--mut);font-size:14.5px;font-weight:600;margin-top:10px;display:block}
.quote{max-width:820px;margin:0 auto;text-align:center}
.quote p{font-family:'${disp}';font-size:clamp(24px,3.2vw,36px);font-weight:600;line-height:1.35;letter-spacing:-.02em}
.quote .by{display:flex;align-items:center;justify-content:center;gap:12px;margin-top:26px}
.quote .by i{width:44px;height:44px;border-radius:50%;background:linear-gradient(135deg,var(--a),var(--a2))}.quote .by b{font-size:15px}.quote .by span{font-size:13px;color:var(--mut)}
.final{position:relative;border-radius:calc(var(--r)*1.5);overflow:hidden;background:linear-gradient(135deg,var(--a),var(--a2));color:#fff;padding:80px 32px;text-align:center;box-shadow:0 40px 80px -40px var(--a)}
.final .grain2{position:absolute;inset:0;background-image:url("${grain}");background-size:160px;opacity:.12;mix-blend-mode:overlay}
.final h2{color:#fff;position:relative}.final p{position:relative;opacity:.94;margin:16px auto 30px;max-width:46ch;font-size:17px}
.final .btn{background:#fff;color:var(--a);position:relative;box-shadow:0 14px 30px -8px rgba(0,0,0,.3)}
footer{padding:60px 0 50px;border-top:1px solid var(--bd);margin-top:90px}
.foot-grid{display:flex;justify-content:space-between;flex-wrap:wrap;gap:24px;color:var(--mut);font-size:14px}
.foot-grid .lg{margin-bottom:10px}
@media(max-width:820px){.hero-grid{grid-template-columns:1fr;gap:36px}.bento,.stats,.foot-grid{grid-template-columns:1fr}.floatcard{display:none}.frame{transform:none}}
</style></head><body>
<div class="progress" id="pg"></div>${fx.glow ? '<div class="glow" id="glow"></div>' : ""}
<div class="grain"></div>
<nav><div class="nav-in"><span class="lg d">${esc(c.brand)}</span><span class="nav-sp"></span><a>제품</a><a>가격</a><a>고객사</a><a>블로그</a><button class="btn">${esc(c.cta)}</button></div></nav>
<header class="hero"><div class="wrap"><div class="blob b1" data-par="0.16"></div><div class="blob b2" data-par="-0.12"></div>
<div class="hero-grid">
  <div><span class="badge reveal"><span class="dot"></span>${esc(t.name)} · 새로운 기준</span>
    <h1 class="d">${headWords}</h1>
    <p class="lead reveal" style="--d:.12s">${esc(c.sub)}</p>
    <div class="cta reveal" style="--d:.18s"><button class="btn lg2${fx.magnetic ? " magnetic" : ""}">${esc(c.cta)} ${arrow}</button><button class="ghost${fx.magnetic ? " magnetic" : ""}">${esc(c.cta2)}</button></div>
    <div class="proof reveal" style="--d:.24s"><div class="avatars"><i></i><i></i><i></i><i></i></div><span><b>1,200+</b> 팀이 이미 사용 중</span></div>
  </div>
  <div class="visual reveal rr" style="--d:.15s"><div class="frame" data-tilt>${t.thumb ? `<img src="${esc(t.thumb)}" alt="">` : `<div class="illus"><div class="win"><div class="win-top"><i></i><i></i><i></i></div><div class="win-body"><div class="chart"><span style="height:42%"></span><span style="height:68%"></span><span style="height:54%"></span><span style="height:88%"></span><span style="height:62%"></span><span style="height:78%"></span></div><div class="rows"><div class="ln" style="width:90%"></div><div class="ln" style="width:66%"></div></div></div></div><div class="chip chip1">${ic(0)}</div><div class="chip chip2">${ic(1)}</div></div>`}</div>
  <div class="floatcard"><div class="k">${ic(2)}</div><div><b>+247%</b><span>성장</span></div></div></div>
</div></div></header>
${(() => { const S = {
  marquee: `<section class="marquee"><div class="mtrack"><span>ACME</span><span>NOVA</span><span>ORBIT</span><span>PULSE</span><span>VERTEX</span><span>LUMEN</span><span>ACME</span><span>NOVA</span><span>ORBIT</span><span>PULSE</span><span>VERTEX</span><span>LUMEN</span></div></section>`,
  features: `<section class="blk" style="padding:${pad}px 0"><div class="wrap"><span class="eyebrow reveal">${esc(c.eyebrow || "FEATURES")}</span><h2 class="reveal">${c.secTitle || "필요한 모든 것을,<br>한 화면에서"}</h2><p class="subsec reveal">${esc(c.secSub || "")}</p><div class="bento">${feats.map((f, i) => `<div class="card ${i === 0 ? "big" : ""} reveal" style="--d:${(i * .08).toFixed(2)}s"><div class="ic">${ic(i)}</div><h3>${esc(f.t)}</h3><p>${esc(f.d)}</p>${i === 0 ? '<div class="viz"></div>' : ''}</div>`).join("")}</div></div></section>`,
  stats: `<section class="blk" style="padding:0 0 ${pad}px"><div class="wrap"><div class="stats">${(c.stats || []).map((s, i) => `<div class="stat reveal sc" style="--d:${(i * .08).toFixed(2)}s"><b data-count>${esc(s.v)}</b><span>${esc(s.l)}</span></div>`).join("")}</div></div></section>`,
  quote: c.quote ? `<section class="blk" style="padding:0 0 ${pad}px"><div class="wrap"><div class="quote reveal"><p class="d">“${esc(c.quote)}”</p><div class="by"><i></i><div style="text-align:left"><b>${esc((c.author || "").split("·")[0] || "")}</b><br><span>${esc((c.author || "").split("·")[1] || "")}</span></div></div></div></div></section>` : ""
}; return (L.order || ["marquee", "features", "stats", "quote"]).map(k => S[k] || "").join(""); })()}
<section class="blk" style="padding-top:0"><div class="wrap"><div class="final reveal"><div class="grain2"></div><h2 class="d">${esc(hero)}</h2><p>${esc(c.sub)}</p><button class="btn lg2">${esc(c.cta)} ${arrow}</button></div></div></section>
<footer><div class="wrap"><div class="foot-grid"><div><div class="lg d">${esc(c.brand)}</div><div>© ${esc(c.brand)}. Prism 웹 빌더로 제작.</div></div><div>제품 · 가격 · 고객사 · 문의</div></div></div></footer>
<script>
(function(){
var RM=matchMedia('(prefers-reduced-motion: reduce)').matches, FINE=matchMedia('(pointer:fine)').matches;
function countUp(el){if(RM)return;var raw=el.getAttribute('data-orig')||el.textContent;el.setAttribute('data-orig',raw);var m=raw.match(/([0-9][0-9,]*(?:\\.[0-9]+)?)/);if(!m)return;var target=parseFloat(m[1].replace(/,/g,''));if(!isFinite(target))return;var dec=(m[1].split('.')[1]||'').length,pre=raw.slice(0,m.index),suf=raw.slice(m.index+m[1].length),t0=null;function step(ts){if(!t0)t0=ts;var p=Math.min(1,(ts-t0)/1100),e=1-Math.pow(1-p,3),v=target*e,s=dec?v.toFixed(dec):Math.round(v).toLocaleString('en-US');el.textContent=pre+s+suf;if(p<1)requestAnimationFrame(step);else el.textContent=raw;}requestAnimationFrame(step);}
var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in');if(e.target.hasAttribute('data-count'))countUp(e.target);io.unobserve(e.target);}})},{threshold:.14});
document.querySelectorAll('.reveal,[data-count]').forEach(function(el){io.observe(el)});
var words=[].slice.call(document.querySelectorAll('.word'));
if(RM)words.forEach(function(w){w.classList.add('in')});else requestAnimationFrame(function(){setTimeout(function(){words.forEach(function(w){w.classList.add('in')})},70)});
var pg=document.getElementById('pg'),pars=[].slice.call(document.querySelectorAll('[data-par]')),tick=false;
function sc(){if(tick)return;tick=true;requestAnimationFrame(function(){var y=window.scrollY,h=document.body.scrollHeight-innerHeight;if(pg)pg.style.width=(h>0?y/h*100:0)+'%';if(!RM)pars.forEach(function(el){var s=parseFloat(el.getAttribute('data-par'))||0;el.style.transform='translate3d(0,'+(y*s)+'px,0)';});tick=false;});}
addEventListener('scroll',sc,{passive:true});sc();
var glow=document.getElementById('glow');
if(glow&&!RM){var gx=innerWidth/2,gy=innerHeight/2,cx=gx,cy=gy;addEventListener('pointermove',function(e){gx=e.clientX;gy=e.clientY;glow.style.opacity=1;});addEventListener('pointerleave',function(){glow.style.opacity=0;});(function loop(){cx+=(gx-cx)*.12;cy+=(gy-cy)*.12;glow.style.transform='translate('+cx+'px,'+cy+'px) translate(-50%,-50%)';requestAnimationFrame(loop);})();}
var frame=document.querySelector('[data-tilt]');
if(frame&&!RM&&FINE){var vis=frame.parentNode;vis.addEventListener('pointermove',function(e){var r=vis.getBoundingClientRect();frame.style.transform='perspective(1200px) rotateY('+(((e.clientX-r.left)/r.width-.5)*11)+'deg) rotateX('+(-((e.clientY-r.top)/r.height-.5)*9)+'deg)';});vis.addEventListener('pointerleave',function(){frame.style.transform='';});}
if(!RM&&FINE)document.querySelectorAll('.magnetic').forEach(function(b){b.addEventListener('pointermove',function(e){var r=b.getBoundingClientRect();b.style.transform='translate('+((e.clientX-r.left-r.width/2)*.25)+'px,'+((e.clientY-r.top-r.height/2)*.35)+'px)';});b.addEventListener('pointerleave',function(){b.style.transform='';});});
})();
</script>
</body></html>`;
}

function renderFeatRows() {
  $("#bFeats").innerHTML = builder.features.map((f, i) => `<div class="frow"><input data-ft="${i}" value="${esc(f.t)}" placeholder="제목"/><input data-fd="${i}" value="${esc(f.d)}" placeholder="설명"/><button class="del" data-fx="${i}">×</button></div>`).join("");
  $$("#bFeats [data-ft]").forEach(el => el.oninput = () => { builder.features[+el.dataset.ft].t = el.value; renderBuilder(); });
  $$("#bFeats [data-fd]").forEach(el => el.oninput = () => { builder.features[+el.dataset.fd].d = el.value; renderBuilder(); });
  $$("#bFeats [data-fx]").forEach(el => el.onclick = () => { builder.features.splice(+el.dataset.fx, 1); renderFeatRows(); renderBuilder(); });
}
function renderStatRows() {
  $("#bStats").innerHTML = builder.stats.map((s, i) => `<div class="srow"><input data-sv="${i}" value="${esc(s.v)}" placeholder="수치"/><input data-sl="${i}" value="${esc(s.l)}" placeholder="라벨"/><button class="del" data-sx="${i}">×</button></div>`).join("");
  $$("#bStats [data-sv]").forEach(el => el.oninput = () => { builder.stats[+el.dataset.sv].v = el.value; renderBuilder(); });
  $$("#bStats [data-sl]").forEach(el => el.oninput = () => { builder.stats[+el.dataset.sl].l = el.value; renderBuilder(); });
  $$("#bStats [data-sx]").forEach(el => el.onclick = () => { builder.stats.splice(+el.dataset.sx, 1); renderStatRows(); renderBuilder(); });
}
function renderMoodSwatch() {
  const cur = builder.theme;
  $("#bMoodSwatch").innerHTML = Object.entries(MOODS).map(([k, m]) => { const t = moodTheme(k); return `<div class="b-swatch ${cur && cur.name === m.tone ? "on" : ""}" data-mood="${k}" title="${m.tone}" style="background:${t.accent}"></div>`; }).join("");
  $$("#bMoodSwatch [data-mood]").forEach(el => el.onclick = () => { builder.theme = moodTheme(el.dataset.mood); renderMoodSwatch(); renderBuilder(); });
}
function renderBuilder() {
  if (builder.uploadedHtml) return; // 내 HTML 미리보기 중엔 생성 화면으로 덮지 않음
  const t = activeTheme(), c = bcContent();
  $("#builderFrame").srcdoc = pageHTML(t, c);
  const box = $("#bStack");
  box.innerHTML = builder.stack.length ? builder.stack.map((it, i) => `<div class="b-chip"><span class="sw" style="background:${themeFromSource(it).accent}"></span><span class="nm">${esc(it.sourceName)}</span><span class="x" data-rm="${i}">×</span></div>`).join("") : `<div class="empty-s">브리프·레퍼런스·라이브러리로 스타일을 적용하세요.</div>`;
  $$("#bStack [data-rm]").forEach((b) => b.onclick = () => { builder.stack.splice(+b.dataset.rm, 1); renderBuilder(); });
  const sn = $("#bStackN"); if (sn) sn.textContent = builder.stack.length ? `(${builder.stack.length})` : "";
  const bh = $("#bHint"); if (bh) bh.textContent = `${t.name} 적용 중 · 브리프/레퍼런스/라이브러리를 더해 발전시키세요.`;
}
window.tryLibrary = (id) => { const item = (CATALOG.items || []).find((x) => x.id === id); if (!item) return; builder.stack.push(item); builder.theme = null; goView("builder"); renderBuilder(); toast(`${item.sourceName} 스타일 적용 — 웹 빌더에서 확인`); };

function setHeroImage(src) { builder.heroImage = src; renderBuilder(); }
/* 오픈라이선스 아이콘을 로드해 랜딩 특징 섹션에 자동 채움(레퍼런스 색으로 리컬러됨) */
async function loadBuilderAssets() {
  const icons = (CATALOG.items || []).filter((i) => i.category === "icon" && i.asset);
  if (!icons.length) return;
  const wanted = ["rocket", "chart", "shield", "bolt", "flash", "users", "team", "clock", "time", "star", "check", "layers", "target", "globe", "lock", "trend", "cloud", "heart"];
  const seen = new Set(), pick = [];
  for (const w of wanted) { const m = icons.find((i) => !seen.has(i.id) && (`${i.title} ${(i.tags || []).join(" ")}`).toLowerCase().includes(w)); if (m) { pick.push(m); seen.add(m.id); } }
  for (const i of icons) { if (pick.length >= 8) break; if (!seen.has(i.id)) { pick.push(i); seen.add(i.id); } }
  const out = [];
  for (const it of pick.slice(0, 8)) {
    for (const base of ["./", "../catalog/"]) {
      try { const r = await fetch(base + it.asset); if (r.ok) { let svg = await r.text(); if (svg.includes("<svg")) { svg = svg.replace(/(fill|stroke)="(#[0-9a-fA-F]{3,8}|rgb[^"]+)"/g, (m, a, v) => v.toLowerCase() === "none" ? m : `${a}="currentColor"`); out.push(svg); } break; } } catch {}
    }
  }
  builder.assetIcons = out;
  if ($("#builderFrame") && currentView === "builder") renderBuilder();
}
/* 내가 준비한 폴더(사이트 패키지) 업로드 → 상대경로 에셋을 blob URL로 연결해 미리보기.
   내 콘텐츠를 로컬에서 렌더할 뿐, 외부 사이트를 가져오지 않음. */
async function previewUploadedFolder(files) {
  const paths = files.map((f) => f.webkitRelativePath || f.name);
  const root = (paths[0] || "").includes("/") ? paths[0].split("/")[0] + "/" : "";
  const map = new Map(); // relPath(lowercase) -> File
  for (const f of files) { let rel = f.webkitRelativePath || f.name; if (root && rel.startsWith(root)) rel = rel.slice(root.length); map.set(rel.toLowerCase(), f); }
  let indexKey = [...map.keys()].find((k) => k === "index.html") || [...map.keys()].find((k) => k.endsWith("/index.html")) || [...map.keys()].find((k) => k.endsWith(".html"));
  if (!indexKey) return toast("index.html을 찾을 수 없습니다");
  const indexDir = indexKey.includes("/") ? indexKey.slice(0, indexKey.lastIndexOf("/") + 1) : "";
  const blobUrls = new Map();
  const urlFor = (key) => { if (blobUrls.has(key)) return blobUrls.get(key); const f = map.get(key); if (!f) return null; const u = URL.createObjectURL(f); blobUrls.set(key, u); return u; };
  const resolve = (baseDir, ref) => {
    if (!ref || /^(https?:|data:|blob:|#|mailto:|tel:|\/\/|javascript:)/i.test(ref)) return null;
    let p = ref.split("#")[0].split("?")[0];
    p = p.startsWith("/") ? p.slice(1) : baseDir + p;
    const parts = []; for (const seg of p.split("/")) { if (seg === "..") parts.pop(); else if (seg === "." || seg === "") continue; else parts.push(seg); }
    return parts.join("/").toLowerCase();
  };
  const rewriteCss = async (css, baseDir) => {
    const refs = [...css.matchAll(/url\(\s*['"]?([^'")]+)['"]?\s*\)/g)];
    for (const m of refs) { const key = resolve(baseDir, m[1]); const u = key && urlFor(key); if (u) css = css.split(m[0]).join(`url(${u})`); }
    return css;
  };
  const cssBlob = async (key) => { const f = map.get(key); if (!f) return null; const dir = key.includes("/") ? key.slice(0, key.lastIndexOf("/") + 1) : ""; return URL.createObjectURL(new Blob([await rewriteCss(await f.text(), dir)], { type: "text/css" })); };
  const doc = new DOMParser().parseFromString(await map.get(indexKey).text(), "text/html");
  for (const el of doc.querySelectorAll("[src],[href],[poster],[data-src]")) {
    for (const attr of ["src", "href", "poster", "data-src"]) {
      const v = el.getAttribute(attr); if (!v) continue;
      const key = resolve(indexDir, v); if (!key || !map.has(key)) continue;
      if (el.tagName === "LINK" && /stylesheet/i.test(el.getAttribute("rel") || "")) { const u = await cssBlob(key); if (u) el.setAttribute(attr, u); }
      else { const u = urlFor(key); if (u) el.setAttribute(attr, u); }
    }
  }
  for (const st of doc.querySelectorAll("style")) st.textContent = await rewriteCss(st.textContent, indexDir);
  const out = "<!DOCTYPE html>" + doc.documentElement.outerHTML;
  builder.uploadedHtml = out; builder.uploadedName = indexKey;
  $("#builderFrame").srcdoc = out;
  $("#bHint").style.display = "none"; $("#bUploadHint").style.display = "";
  toast(`폴더 미리보기 · ${map.size}개 파일 · ${indexKey}`);
}
function initBuilder() {
  $("#industryList").innerHTML = Object.keys(INDUSTRIES).map(k => `<option value="${esc(k)}">`).join("");
  $("#productList").innerHTML = PRODUCT_HINTS.map(k => `<option value="${esc(k)}">`).join("");
  $("#goalList").innerHTML = GOAL_HINTS.map(k => `<option value="${esc(k)}">`).join("");
  $$(".bacc-h").forEach(h => h.onclick = () => { const p = h.closest(".bacc"); p.dataset.open = p.dataset.open === "1" ? "0" : "1"; });
  ["bBrand", "bHead", "bSub", "bCta", "bCta2", "bQuote", "bAuthor"].forEach((id) => $("#" + id).oninput = renderBuilder);
  $("#bGenerate").onclick = generateFromBrief;
  $("#bIndustry").onchange = () => { if (INDUSTRIES[$("#bIndustry").value.trim()]) generateFromBrief(); };
  $("#bRefApply").onclick = applyReference;
  $("#bRefUrl").addEventListener("keydown", (e) => { if (e.key === "Enter") applyReference(); });
  $("#bHeroUrlApply").onclick = () => { const u = $("#bHeroUrl").value.trim(); if (u) { setHeroImage(u); toast("이미지 URL 반영됨"); } };
  $("#bHeroUpload").onclick = () => $("#bHeroFile").click();
  $("#bHeroFile").onchange = (e) => { const f = e.target.files[0]; if (!f) return; const r = new FileReader(); r.onload = () => { setHeroImage(r.result); toast("이미지 업로드 반영됨"); }; r.readAsDataURL(f); };
  $("#bHeroClear").onclick = () => { setHeroImage(null); builder.refShot = null; toast("이미지 제거 — 그래픽 사용"); };
  $$("#bDevice button").forEach((b) => b.onclick = () => { $$("#bDevice button").forEach((x) => x.classList.toggle("on", x === b)); $("#builderFrameWrap").classList.toggle("mobile", b.dataset.d === "mobile"); });
  $("#bReset").onclick = () => { builder.stack = []; builder.theme = null; builder.heroImage = null; builder.refShot = null; $("#bRefPreview").innerHTML = ""; renderMoodSwatch(); renderBuilder(); toast("초기화됨"); };
  $("#bShuffle").onclick = () => { const keys = Object.keys(MOODS); builder.theme = moodTheme(keys[hashN(String(Date.now ? "" : "") + $("#bHead").value + builder.features.length) % keys.length]); renderMoodSwatch(); renderBuilder(); };
  $("#bExport").onclick = () => { saveBlob(new Blob([pageHTML(activeTheme(), bcContent())], { type: "text/html" }), (bcContent().brand || "page").replace(/\s+/g, "-") + ".html"); toast("HTML 내보내기 완료"); };
  $("#bOpenNew").onclick = () => { const w = window.open(); w.document.write(pageHTML(activeTheme(), bcContent())); w.document.close(); };
  $("#bRandom").onclick = () => randomBrief();
  // 내 HTML 업로드 → 미리보기(내 콘텐츠 렌더)
  $("#bUploadHtml").onclick = () => $("#bHtmlFile").click();
  $("#bHtmlFile").onchange = (e) => {
    const f = e.target.files[0]; if (!f) return;
    const r = new FileReader();
    r.onload = () => { builder.uploadedHtml = String(r.result); $("#builderFrame").srcdoc = builder.uploadedHtml; $("#bHint").style.display = "none"; $("#bUploadHint").style.display = ""; toast(`${f.name} 미리보기`); };
    r.readAsText(f); e.target.value = "";
  };
  $("#bBackToGen").onclick = () => { builder.uploadedHtml = null; $("#bUploadHint").style.display = "none"; $("#bHint").style.display = ""; renderBuilder(); toast("빌더로 돌아왔습니다"); };
  // 내 폴더(사이트 패키지) 업로드 → 상대경로를 blob으로 연결해 미리보기
  $("#bUploadFolder").onclick = () => $("#bFolderFile").click();
  $("#bFolderFile").onchange = async (e) => { const files = [...e.target.files]; e.target.value = ""; if (files.length) await previewUploadedFolder(files); };
  renderFeatRows(); renderStatRows(); renderMoodSwatch();
  // 초기 화면 = 완성형 사이트: 기본 브리프 + 어워드 수상 레퍼런스를 실제 적용해 출력
  $("#bIndustry").value = "SaaS/소프트웨어"; $("#bProduct").value = "Nova"; $("#bGoal").value = "무료체험 가입을 늘리고 싶어요";
  generateFromBrief();
  builder._lastAward = 0; $("#bRefUrl").value = AWARD_SITES[0].u; applyReference();
  loadBuilderAssets();
}
function randomBrief() {
  const pick = (a) => a[Math.floor(Math.random() * a.length)];
  $("#bIndustry").value = pick(Object.keys(INDUSTRIES));
  $("#bProduct").value = pick(PRODUCT_HINTS);
  $("#bGoal").value = pick(GOAL_HINTS);
  generateFromBrief();
  let i; do { i = Math.floor(Math.random() * AWARD_SITES.length); } while (i === builder._lastAward && AWARD_SITES.length > 1);
  builder._lastAward = i; const site = AWARD_SITES[i];
  $("#bRefUrl").value = site.u; applyReference();
  toast(`랜덤 적용 · 레퍼런스: ${site.n} (어워드 수상작)`);
}

/* 카드 호버 2초 → 컨셉 프리뷰 */
let peekTimer = null, peekActive = null;
function attachPeek(items) {
  $$("#libGrid .card").forEach((el, i) => {
    const it = items[i]; if (!it) return;
    el.addEventListener("mouseenter", () => { clearTimeout(peekTimer); peekTimer = setTimeout(() => showPeek(it, el), 2000); });
    el.addEventListener("mouseleave", () => { clearTimeout(peekTimer); hidePeek(); });
  });
}
function showPeek(item, el) {
  const t = themeFromSource(item);
  const c = { brand: item.sourceName.split(/[ —·]/)[0] || "Brand", head: "이 스타일로 만들면", sub: `${item.sourceName}의 무드를 적용한 예시 랜딩입니다.`, cta: "시작하기", cta2: "더 보기", quote: "", author: "", features: builder.features, stats: builder.stats };
  $("#cardPeekFrame").srcdoc = pageHTML(t, c);
  $("#cardPeekTag").textContent = `적용 시 컨셉 · ${item.sourceName}`;
  const pk = $("#cardPeek"), r = el.getBoundingClientRect(), W = 340, H = 250, pad = 12;
  let left = r.right + pad; if (left + W > window.innerWidth) left = r.left - W - pad; if (left < pad) left = pad;
  let top = r.top; if (top + H > window.innerHeight) top = window.innerHeight - H - pad; if (top < 64) top = 64;
  pk.style.left = left + "px"; pk.style.top = top + "px"; pk.classList.add("on"); peekActive = item.id;
}
function hidePeek() { $("#cardPeek").classList.remove("on"); peekActive = null; }

/* ===================================================== NAV / BOOT */
function goView(name) {
  currentView = name;
  $$("[data-view]").forEach((x) => x.classList.toggle("on", x.dataset.view === name));
  $$(".view").forEach((v) => v.classList.toggle("on", v.id === "view-" + name));
  window.scrollTo({ top: 0, behavior: "smooth" });
  if (cmtMode) { $("#cmtViewLabel").textContent = `현재 페이지: ${viewName(name)}`; renderPins(); renderCommentList(); } else clearPins();
  if (name === "requests") renderRequests();
}
function initTabs() { $$("[data-view]").forEach((b) => b.onclick = () => goView(b.dataset.view)); $$("[data-goto]").forEach((b) => b.onclick = () => goView(b.dataset.goto)); }

(async function () {
  initTheme(); initTabs(); initGenerator(); initRequestsPage();
  await Promise.all([loadCatalog(), loadRequests()]);
  $("#pillCount").textContent = (CATALOG.items || []).length;
  $("#pillDate").textContent = CATALOG.generated ? CATALOG.generated.slice(0, 10) : "—";
  renderFacets(); renderGrid(); initStudio(); initBuilder(); initComments(); renderRequests();
  $("#q").oninput = (e) => { filter.q = e.target.value; renderGrid(); };
})();
