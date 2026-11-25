/* Motor del curso: dibuja la escena SVG isométrica, anima el flujo de datos y maneja lecciones, búsqueda y progreso. */
(function () {
  "use strict";
  const D = window.COURSE;
  const NS = "http://www.w3.org/2000/svg";
  const $ = (s, r) => (r || document).querySelector(s);
  const INK_FIXED = "#1d1b18";
  const REDUCED = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const TAGS = { SOLUCION: "SOLUCIÓN", PROBLEMA: "PROBLEMA", IDEA: "IDEA", COMPROMISO: "COMPROMISO", RESUMEN: "RESUMEN", CUIDADO: "CUIDADO", CASO: "CASO" };

  /* ---------- utilidades ---------- */
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const fmt = (s) => esc(s).replace(/`([^`]+)`/g, "<code>$1</code>").replace(/\*\*(.+?)\*\*/g, "<b>$1</b>").replace(/\*([^*]+)\*/g, "<i>$1</i>");
  const norm = (s) => String(s).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  const store = {
    get(k, d) { try { const v = localStorage.getItem("sisgdb:" + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem("sisgdb:" + k, JSON.stringify(v)); } catch (e) { /* sin almacenamiento */ } },
  };
  function svg(tag, attrs, parent) { const e = document.createElementNS(NS, tag); for (const k in attrs || {}) e.setAttribute(k, attrs[k]); if (parent) parent.appendChild(e); return e; }
  function mix(hex, to, t) {
    const p = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)), a = p(hex), b = p(to);
    return "#" + a.map((v, i) => Math.round(v + (b[i] - v) * t).toString(16).padStart(2, "0")).join("");
  }
  const ICON = {
    db: "M4 6c0-1.7 3.6-3 8-3s8 1.3 8 3-3.6 3-8 3-8-1.3-8-3zM4 6v6c0 1.7 3.6 3 8 3s8-1.3 8-3V6M4 12v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6",
    user: "M12 12a4 4 0 100-8 4 4 0 000 8zM4 21c0-4 3.6-7 8-7s8 3 8 7",
    people: "M9 11a3.5 3.5 0 100-7 3.5 3.5 0 000 7zM2 20c0-3.5 3-6 7-6s7 2.5 7 6M17 11a3 3 0 100-6M18 14c2.5.5 4 2.5 4 5",
    shield: "M12 3l7 3v5c0 5-3 8-7 10-4-2-7-5-7-10V6z",
    gear: "M12 15a3 3 0 100-6 3 3 0 000 6zM12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2",
    chart: "M4 20V10M10 20V4M16 20v-8M22 20H2",
    file: "M6 3h8l4 4v14H6zM14 3v4h4M9 12h6M9 16h6",
    clock: "M12 21a9 9 0 100-18 9 9 0 000 18zM12 7v5l3 2",
    flask: "M9 3h6M10 3v6L4 19a2 2 0 002 3h12a2 2 0 002-3l-6-10V3M7 15h10",
    heart: "M12 20s-8-5-8-11a4.5 4.5 0 018-2.7A4.5 4.5 0 0120 9c0 6-8 11-8 11z",
    window: "M3 5h18v14H3zM3 9h18M6 7h.01M9 7h.01",
    bolt: "M13 2L4 14h7l-1 8 9-12h-7z",
    eye: "M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12zM12 15a3 3 0 100-6 3 3 0 000 6z",
    list: "M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01",
    calendar: "M4 6h16v15H4zM4 10h16M8 3v4M16 3v4",
    map: "M12 21s-7-6-7-11a7 7 0 0114 0c0 5-7 11-7 11zM12 12a2.5 2.5 0 100-5 2.5 2.5 0 000 5z",
    tag: "M3 12V4h8l10 10-8 8zM7.5 8h.01",
    link: "M10 14a4 4 0 005.7 0l3-3a4 4 0 00-5.7-5.7l-1 1M14 10a4 4 0 00-5.7 0l-3 3a4 4 0 005.7 5.7l1-1",
    check: "M4 12l5 5L20 6",
  };
  const UI = {
    chev: '<svg class="chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6"/></svg>',
    doc: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4"/></svg>',
    done: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M8 12.5l3 3 5-6"/></svg>',
    bulb: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18h6M10 21h4M12 3a6 6 0 00-3 11.2V16h6v-1.8A6 6 0 0012 3z"/></svg>',
    redo: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 109-9 9 9 0 00-7 3.3L3 8M3 3v5h5"/></svg>',
    pause: '<svg viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/></svg>',
    play: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 4l13 8-13 8z"/></svg>',
    left: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M11 6l-6 6 6 6"/></svg>',
    right: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
    tick: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7"/></svg>',
    clock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
    bars: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M5 20v-6M12 20V8M19 20v-9"/></svg>',
    steps: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M9 6h12M9 12h12M9 18h12M4 6h.01M4 12h.01M4 18h.01"/></svg>',
    folder: (c) => `<svg class="fold" viewBox="0 0 22 18"><path d="M1 3a2 2 0 012-2h5l2 2h9a2 2 0 012 2v10a2 2 0 01-2 2H3a2 2 0 01-2-2z" fill="${c}" stroke="#1d1b18" stroke-width="1.6" stroke-linejoin="round"/></svg>`,
  };

  /* ---------- estado ---------- */
  const lessons = D.modules.flatMap((m) => m.lessons.map((l) => Object.assign(l, { mod: m })));
  const byId = Object.fromEntries(lessons.map((l) => [l.id, l]));
  let progress = store.get("progress", {});        // id de lección -> paso máximo visto (1..n)
  let known = store.get("known", {});               // preguntas marcadas como sabidas
  let openMods = new Set(["m1"]);
  let cur = { view: null, lesson: null, step: 0 };
  let paused = false, scene = null, flowTimer = 0, rafId = 0;

  const shell = $("#shell");

  /* ---------- tema ---------- */
  function setTheme(t) { document.documentElement.dataset.theme = t; store.set("theme", t); }
  setTheme(store.get("theme", matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"));
  $("#b-theme").addEventListener("click", () => setTheme(document.documentElement.dataset.theme === "dark" ? "light" : "dark"));

  /* =====================================================================
     ESCENA
     ===================================================================== */
  const C3 = 0.866;
  function nodeInfo(n) {
    if (n.k === "tbl") { n.hh = n.hh || 26; n.rh = n.rh || 17; n.fs = n.fs || 11; n.W = n.w || 200; n.H = n.hh + n.cols.length * n.rh + 6; n.cx = n.x + n.W / 2; n.cy = n.y + n.H / 2; }
    else { n.cx = n.x; n.cy = n.y; n.r = n.k === "cube" ? (n.s || 66) * 0.98 : n.k === "db" ? 62 : n.k === "bar" ? 40 : 34; }
    return n;
  }
  function anchor(n, tx, ty) {
    const dx = tx - n.cx, dy = ty - n.cy, d = Math.hypot(dx, dy) || 1;
    if (n.k === "tbl") { const t = Math.min((n.W / 2 + 5) / Math.abs(dx || 1e-9), (n.H / 2 + 5) / Math.abs(dy || 1e-9)); return { x: n.cx + dx * t, y: n.cy + dy * t }; }
    return { x: n.cx + (dx / d) * (n.r + 5), y: n.cy + (dy / d) * (n.r + 5) };
  }
  function lines(g, text, x, y, size, weight, fill, lh, cls) {
    String(text).split("\n").forEach((ln, i, arr) => {
      const t = svg("text", { x, y: y + (i - (arr.length - 1) / 2) * lh, "text-anchor": "middle", "dominant-baseline": "central", "font-size": size, "font-weight": weight, class: cls || "" }, g);
      t.style.fill = fill; t.textContent = ln;
    });
  }
  function drawIcon(g, name, x, y, sc) {
    const p = svg("path", { d: ICON[name] || ICON.db, fill: "none", stroke: INK_FIXED, "stroke-width": 2, "stroke-linecap": "round", "stroke-linejoin": "round", transform: `translate(${x - 12 * sc},${y - 12 * sc}) scale(${sc})` }, g);
    return p;
  }

  function buildNode(def, id, layer) {
    const n = nodeInfo(def);
    const outer = svg("g", { class: "nd off", "data-id": id }, layer);
    const g = svg("g", { transform: `translate(${n.k === "tbl" ? n.x : n.cx},${n.k === "tbl" ? n.y : n.cy})` }, outer);
    const base = D.colors[n.color] || "#ddd", light = mix(base, "#ffffff", 0.5), dark = mix(base, "#000000", 0.14);
    const halo = svg("g", { class: "halo" }, g);
    const body = svg("g", {}, g);
    if (n.k === "cube") {
      const s = n.s || 66, hx = C3 * s;
      const P = (pts) => pts.map((p) => p.join(",")).join(" ");
      const common = { stroke: "var(--ink)", "stroke-width": 2.4, "stroke-linejoin": "round" };
      svg("polygon", Object.assign({ points: P([[0, -s], [hx, -s / 2], [hx, s / 2], [0, s], [-hx, s / 2], [-hx, -s / 2]].map(([a, b]) => [a * 1.18, b * 1.18])), fill: "none", stroke: "var(--ink)", "stroke-width": 3, "stroke-dasharray": "7 5", "stroke-linejoin": "round" }), halo);
      svg("polygon", Object.assign({ points: P([[-hx, -s / 2], [0, 0], [0, s], [-hx, s / 2]]), fill: base }, common), body);
      svg("polygon", Object.assign({ points: P([[0, 0], [hx, -s / 2], [hx, s / 2], [0, s]]), fill: dark }, common), body);
      svg("polygon", Object.assign({ points: P([[0, -s], [hx, -s / 2], [0, 0], [-hx, -s / 2]]), fill: light }, common), body);
      if (n.icon) drawIcon(body, n.icon, 0, -s / 2, 0.95);
      lines(body, n.label, 0, s * 0.36, 12.5, 800, INK_FIXED, 14);
      if (n.sub) lines(body, n.sub, 0, s + 17, 11, 500, "var(--muted)", 13);
    } else if (n.k === "db") {
      const r = 56, H = 62, ry = 17;
      svg("rect", { x: -r - 9, y: -H / 2 - ry - 8, width: 2 * r + 18, height: H + 2 * ry + 16, rx: 22, fill: "none", stroke: "var(--ink)", "stroke-width": 3, "stroke-dasharray": "7 5" }, halo);
      svg("path", { d: `M${-r},${-H / 2} L${-r},${H / 2} A${r},${ry} 0 0 0 ${r},${H / 2} L${r},${-H / 2} Z`, fill: base, stroke: "var(--ink)", "stroke-width": 2.4, "stroke-linejoin": "round" }, body);
      svg("path", { d: `M${-r},${-H / 6} A${r},${ry} 0 0 0 ${r},${-H / 6}`, fill: "none", stroke: "var(--ink)", "stroke-width": 1.4, opacity: 0.4 }, body);
      svg("ellipse", { cx: 0, cy: -H / 2, rx: r, ry, fill: light, stroke: "var(--ink)", "stroke-width": 2.4 }, body);
      lines(body, n.label, 0, H * 0.22, 14, 800, INK_FIXED, 15);
      if (n.sub) lines(body, n.sub, 0, H / 2 + ry + 16, 11, 500, "var(--muted)", 13);
    } else if (n.k === "tbl") {
      svg("rect", { x: -6, y: -6, width: n.W + 12, height: n.H + 12, rx: 13, fill: "none", stroke: "var(--ink)", "stroke-width": 3, "stroke-dasharray": "7 5" }, halo);
      svg("rect", { x: 3, y: 3, width: n.W, height: n.H, rx: 9, fill: "var(--ink)" }, body);
      svg("rect", { x: 0, y: 0, width: n.W, height: n.H, rx: 9, fill: "var(--card)", stroke: "var(--ink)", "stroke-width": 2 }, body);
      svg("path", { d: `M0,${n.hh} L0,9 A9,9 0 0 1 9,0 L${n.W - 9},0 A9,9 0 0 1 ${n.W},9 L${n.W},${n.hh} Z`, fill: base, stroke: "var(--ink)", "stroke-width": 2 }, body);
      const t = svg("text", { x: 10, y: n.hh / 2 + 1, "dominant-baseline": "central", "font-size": n.fs + 1.5, "font-weight": 800 }, body); t.style.fill = INK_FIXED; t.textContent = n.title;
      n.rowEls = {};
      n.cols.forEach((c, i) => {
        const m = /^(PK|FK)\s+(.*)$/.exec(c), name = (m ? m[2] : c).split(/\s+/)[0], y = n.hh + i * n.rh, rh = n.rh;
        const row = svg("g", {}, body);
        const bg = svg("rect", { x: 3, y: y + 1, width: n.W - 6, height: rh - 1, rx: 4, fill: "transparent" }, row);
        if (m) {
          const pill = svg("rect", { x: 7, y: y + rh / 2 - 4.5, width: 18, height: 9, rx: 3, fill: m[1] === "PK" ? "#f3c24d" : "#a9c8ee", stroke: INK_FIXED, "stroke-width": 1 }, row);
          const pt = svg("text", { x: 16, y: y + rh / 2 + 0.2, "text-anchor": "middle", "dominant-baseline": "central", "font-size": 7, "font-weight": 800 }, row); pt.style.fill = INK_FIXED; pt.textContent = m[1];
        }
        const tx = svg("text", { x: m ? 31 : 10, y: y + rh / 2 + 0.5, "dominant-baseline": "central", "font-size": n.fs }, row); tx.style.fill = "var(--ink)"; tx.textContent = m ? m[2] : c;
        n.rowEls[name] = bg;
      });
    } else if (n.k === "bar") {
      const w = n.w || 100, h = n.h, d = 22;
      const P = (pts) => pts.map((p) => p.join(",")).join(" ");
      const common = { stroke: "var(--ink)", "stroke-width": 2.4, "stroke-linejoin": "round" };
      svg("polygon", Object.assign({ points: P([[-w / 2, 0], [w / 2, 0], [w / 2, -h], [-w / 2, -h]]), fill: base }, common), body);
      svg("polygon", Object.assign({ points: P([[w / 2, 0], [w / 2 + d, -d * 0.55], [w / 2 + d, -h - d * 0.55], [w / 2, -h]]), fill: dark }, common), body);
      svg("polygon", Object.assign({ points: P([[-w / 2, -h], [w / 2, -h], [w / 2 + d, -h - d * 0.55], [-w / 2 + d, -h - d * 0.55]]), fill: light }, common), body);
      lines(body, n.label, d / 2, -h - d * 0.55 - 18, 17, 800, "var(--ink)", 18);
      if (n.sub) lines(body, n.sub, d / 2, 24, 11, 500, "var(--muted)", 13);
    } else if (n.k === "text") {
      lines(body, n.text, 0, 0, n.size || 40, 800, "var(--ink)", 1);
      if (n.sub) lines(body, n.sub, 0, (n.size || 40) * 0.75, 14, 600, "var(--muted)", 16);
    }
    return Object.assign(n, { outer, halo });
  }

  function buildScene(lesson, rootEl) {
    const root = rootEl || $("#scene"); root.innerHTML = "";
    const VB = lesson.vb || [1000, 600]; root.setAttribute("viewBox", `0 0 ${VB[0]} ${VB[1]}`);
    const defs = svg("defs", {}, root);
    const pat = svg("pattern", { id: "iso", width: 80, height: 46.2, patternUnits: "userSpaceOnUse" }, defs);
    const gp = svg("path", { d: "M0 0 L80 46.2 M80 0 L0 46.2", fill: "none" }, pat); gp.style.stroke = "var(--grid)"; gp.setAttribute("stroke-width", "1");
    for (const [id, col] of [["ak", "var(--ink)"], ["ar", "#c0392b"], ["ag", "#2f8f3a"]]) {
      const m = svg("marker", { id, viewBox: "0 0 10 10", refX: 8, refY: 5, markerWidth: 8, markerHeight: 8, orient: "auto-start-reverse" }, defs);
      const p = svg("path", { d: "M1 1 L9 5 L1 9 z", "stroke-linejoin": "round" }, m); p.style.fill = col; p.style.stroke = col;
    }
    svg("rect", { x: 0, y: 0, width: VB[0], height: VB[1], fill: "url(#iso)" }, root);
    const edgeLayer = svg("g", {}, root), nodeLayer = svg("g", {}, root), packLayer = svg("g", {}, root);
    const nodes = {};
    for (const id in lesson.nodes) nodes[id] = buildNode(Object.assign({}, lesson.nodes[id]), id, nodeLayer);
    const edges = {};
    for (const e of lesson.edges) {
      const id = e.id || `${e.a}-${e.b}`, A = nodes[e.a], B = nodes[e.b];
      const via = e.via || [];
      const p0 = anchor(A, (via[0] || [B.cx, B.cy])[0], (via[0] || [B.cx, B.cy])[1]);
      const last = via.length ? via[via.length - 1] : [A.cx, A.cy];
      const p1 = anchor(B, last[0], last[1]);
      const pts = [[p0.x, p0.y], ...via, [p1.x, p1.y]];
      const d = pts.map((p, i) => (i ? "L" : "M") + p[0].toFixed(1) + " " + p[1].toFixed(1)).join(" ");
      const g = svg("g", { class: "ed off", "data-id": id }, edgeLayer);
      const arrow = e.arrow != null ? e.arrow : !(A.k === "tbl" && B.k === "tbl");
      const path = svg("path", { d, fill: "none", "stroke-width": 2.2, "stroke-linecap": "round", "stroke-linejoin": "round" }, g);
      path.style.stroke = "var(--ink)"; if (e.dash) path.setAttribute("stroke-dasharray", "6 6"); if (arrow) path.setAttribute("marker-end", "url(#ak)");
      if (A.k === "tbl" && B.k === "tbl") { for (const [pt] of [[pts[0]], [pts[pts.length - 1]]]) { const c = svg("circle", { cx: pt[0], cy: pt[1], r: 3.2 }, g); c.style.fill = "var(--ink)"; } }
      const mid = path.getPointAtLength(path.getTotalLength() / 2);
      let lab = null;
      if (e.label) {
        lab = svg("g", { transform: `translate(${mid.x},${mid.y})` }, g);
        const w = e.label.length * 6.4 + 16;
        const r = svg("rect", { x: -w / 2, y: -10, width: w, height: 20, rx: 10, "stroke-width": 1.5 }, lab); r.style.fill = "var(--card)"; r.style.stroke = "var(--ink)";
        const t = svg("text", { x: 0, y: 0, "text-anchor": "middle", "dominant-baseline": "central", "font-size": 10.5, "font-weight": 600 }, lab); t.style.fill = "var(--ink)"; t.textContent = e.label;
      }
      const badge = svg("g", { transform: `translate(${mid.x},${mid.y})`, class: "badge", opacity: 0 }, g);
      edges[id] = { id, def: e, g, path, pts, mid, lab, badge, A, B };
    }
    const S = { lesson, nodes, edges, packLayer, packs: [], root, onNode: null };
    root.addEventListener("click", (e) => { const g = e.target.closest(".nd"); if (g && S.onNode && !g.classList.contains("off")) S.onNode(g.dataset.id); });
    return S;
  }

  /* estado visible acumulado hasta el paso i */
  function stateAt(lesson, i) {
    const V = new Set(), E = new Set();
    for (let k = 0; k <= i; k++) {
      const s = lesson.steps[k];
      (s.add || []).forEach((x) => V.add(x)); (s.rm || []).forEach((x) => V.delete(x));
      (s.eadd || []).forEach((x) => E.add(x)); (s.erm || []).forEach((x) => E.delete(x));
    }
    return { V, E };
  }

  function applyStep(i, replay, SS) {
    const S = SS || scene, lesson = S.lesson, step = lesson.steps[i];
    const { V, E } = stateAt(lesson, i);
    const focus = new Set(step.focus || []);
    const hasFocus = focus.size > 0;
    const rows = step.rows || {};
    let delay = 0;
    for (const id in S.nodes) {
      const n = S.nodes[id], vis = V.has(id), el = n.outer;
      const wasOff = el.classList.contains("off");
      if (replay && vis) { el.classList.add("off"); }
      const show = () => {
        el.classList.toggle("off", !vis);
        el.classList.toggle("dim", vis && hasFocus && !focus.has(id));
        el.classList.toggle("focus", vis && focus.has(id));
      };
      if (vis && (wasOff || replay)) { setTimeout(show, 60 + delay); delay += 70; } else show();
      if (n.rowEls) for (const name in n.rowEls) n.rowEls[name].setAttribute("fill", (rows[id] || []).includes(name) ? "#f6d98a" : "transparent");
      if (n.rowEls) for (const name in n.rowEls) { const t = n.rowEls[name].parentNode.lastChild; t.style.fill = (rows[id] || []).includes(name) ? INK_FIXED : "var(--ink)"; }
    }
    const bad = new Set(step.bad || []), good = new Set(step.good || []);
    for (const id in S.edges) {
      const e = S.edges[id], vis = E.has(id) && V.has(e.def.a) && V.has(e.def.b);
      e.g.classList.toggle("off", !vis);
      e.g.classList.toggle("dim", vis && hasFocus && !(focus.has(e.def.a) && focus.has(e.def.b)));
      const isBad = bad.has(id), isGood = good.has(id);
      e.path.style.stroke = isBad ? "#c0392b" : isGood ? "#2f8f3a" : "var(--ink)";
      e.path.setAttribute("stroke-dasharray", isBad ? "7 6" : e.def.dash ? "6 6" : "none");
      e.path.setAttribute("marker-end", e.def.arrow === false || (e.A.k === "tbl" && e.B.k === "tbl") ? "" : `url(#${isBad ? "ar" : isGood ? "ag" : "ak"})`);
      e.badge.innerHTML = ""; e.badge.setAttribute("opacity", isBad || isGood ? 1 : 0);
      if (isBad || isGood) {
        const c = svg("circle", { r: 11, "stroke-width": 2 }, e.badge); c.style.fill = isBad ? "#c0392b" : "#2f8f3a"; c.style.stroke = "var(--ink)";
        svg("path", { d: isBad ? "M-4.5 -4.5 L4.5 4.5 M4.5 -4.5 L-4.5 4.5" : "M-5 0.5 L-1.5 4 L5 -3.5", fill: "none", stroke: "#fff", "stroke-width": 2.4, "stroke-linecap": "round", "stroke-linejoin": "round" }, e.badge);
        if (e.lab) e.lab.setAttribute("opacity", 0);
      } else if (e.lab) e.lab.setAttribute("opacity", 1);
    }
    // paquetes de datos
    S.packLayer.innerHTML = ""; S.packs = [];
    for (const id of step.flow || []) {
      const e = S.edges[id]; if (!e || !E.has(id) || bad.has(id) && false) continue;
      for (let k = 0; k < 3; k++) {
        const g = svg("g", {}, S.packLayer);
        const r = svg("rect", { x: -5, y: -5, width: 10, height: 10, rx: 2.5, "stroke-width": 1.8, fill: "#f3a14d" }, g); r.style.stroke = INK_FIXED;
        S.packs.push({ g, e, off: k / 3, len: e.path.getTotalLength() });
      }
    }
    S.paused = false; flowTimer = 0; movePacks(0);
  }

  function movePacks(t) {
    if (!scene) return;
    for (const p of scene.packs) {
      const u = REDUCED ? 0.5 : (t * 0.28 + p.off) % 1;
      const q = p.e.path.getPointAtLength(p.len * u);
      p.g.setAttribute("transform", `translate(${q.x},${q.y})`);
      const vis = !p.e.g.classList.contains("off");
      p.g.style.opacity = vis ? (u < 0.06 || u > 0.94 ? 0.3 : 1) : 0;
    }
  }
  let last = 0;
  function loop(ts) {
    const dt = Math.min((ts - last) / 1000, 0.05); last = ts;
    if (!paused) flowTimer += dt;
    movePacks(flowTimer);
    rafId = requestAnimationFrame(loop);
  }

  /* =====================================================================
     VISTAS
     ===================================================================== */
  function lessonIndex(id) { return lessons.findIndex((l) => l.id === id); }
  const doneCount = () => lessons.filter((l) => (progress[l.id] || 0) >= l.steps.length).length;

  function treeHTML() {
    return `<div class="tree-head">Curso <small>${lessons.length} lecciones</small></div><div class="tree-body">` +
      D.modules.map((m) => {
        const open = openMods.has(m.id), dn = m.lessons.filter((l) => (progress[l.id] || 0) >= l.steps.length).length;
        return `<div class="mod ${open ? "open" : ""}" data-m="${m.id}"><button type="button" aria-expanded="${open}">${UI.chev}${UI.folder(D.colors[m.color])}<span>${m.n}. ${esc(m.title)}</span><span class="cnt">${dn}/${m.lessons.length}</span></button><ul>` +
          m.lessons.map((l) => `<li><a class="lsn ${(progress[l.id] || 0) >= l.steps.length ? "done" : ""}" href="#/leccion/${l.id}/1" ${cur.lesson && cur.lesson.id === l.id ? 'aria-current="page"' : ""}>${(progress[l.id] || 0) >= l.steps.length ? UI.done : UI.doc}<span>${esc(l.title)}</span></a></li>`).join("") +
          `</ul></div>`;
      }).join("") + `</div>
      <div class="prog"><div class="row"><span>PROGRESO</span><span>${doneCount()} / ${lessons.length}</span></div><div class="bar"><i style="width:${(doneCount() / lessons.length) * 100}%"></i></div></div>
      <div class="credit">Diseño inspirado en <a href="https://designed-to-scale.vercel.app/" target="_blank" rel="noopener">System Design</a>. Datos sintéticos.</div>`;
  }
  function bindTree() {
    $("#tree").querySelectorAll(".mod > button").forEach((b) => b.addEventListener("click", () => {
      const id = b.parentNode.dataset.m; openMods.has(id) ? openMods.delete(id) : openMods.add(id); b.parentNode.classList.toggle("open"); b.setAttribute("aria-expanded", openMods.has(id));
    }));
    $("#tree").querySelectorAll(".lsn").forEach((a) => a.addEventListener("click", () => $("#tree").classList.remove("open")));
  }

  function renderLesson(id, step) {
    const lesson = byId[id]; if (!lesson) return route("#/leccion/que-es/1");
    cur = { view: "lesson", lesson, step };
    openMods.add(lesson.mod.id);
    const idx = lessonIndex(id), within = lesson.mod.lessons.indexOf(lesson) + 1;
    shell.innerHTML = `
      <aside id="tree" class="panel">${treeHTML()}</aside>
      <main id="main" class="panel scroll">
        <div class="crumb">${lesson.mod.n}. ${esc(lesson.mod.title)} &nbsp;/&nbsp; <b>Lección ${within} de ${lesson.mod.lessons.length}</b></div>
        <div class="title-row"><h1 class="lt">${fmt(lesson.title)}</h1><div class="chips"><span class="chip">${UI.clock} ${lesson.min} min</span><span class="chip lv">${UI.bars} ${lesson.level}</span><span class="chip st">${UI.steps} ${lesson.steps.length} pasos</span></div></div>
        <p class="sub">${fmt(lesson.sub)}</p>
        <div class="stage" id="stage">
          <div class="stats">${lesson.statLabels.map((l, i) => `<div class="stat" data-i="${i}"><small>${esc(l)}</small><b>—</b></div>`).join("")}
            <div class="ctl"><button class="btn" id="b-replay" type="button">${UI.redo} Repetir</button><button class="btn" id="b-pause" type="button">${UI.pause} <span>Pausa</span></button></div></div>
          <svg id="scene" viewBox="0 0 1000 600" role="img" aria-label="Diagrama de la lección: ${esc(lesson.title)}"></svg>
          <div class="note off" id="note"></div>
          <div class="legend"><span><i style="background:#f3a14d"></i>dato en movimiento</span><span><i style="background:transparent;border-style:dashed"></i>foco del paso</span><span style="color:#c0392b">✕ rechazado</span><span style="color:#2f8f3a">✓ aceptado</span></div>
        </div>
        <div class="stepper"><h5>En esta lección <span id="stp-n"></span></h5><div class="steps" id="steps">${lesson.steps.map((s, i) => `<button class="sp" type="button" data-i="${i}"><span class="dot">${i + 1}</span><span>${esc(s.label)}</span></button>`).join("")}</div></div>
      </main>
      <aside id="side"><section class="panel stepcard" id="stepcard"></section><section class="panel learn" id="learn"></section></aside>`;
    bindTree();
    scene = buildScene(lesson);
    $("#b-replay").addEventListener("click", () => applyStep(cur.step, true));
    $("#b-pause").addEventListener("click", togglePause);
    $("#steps").querySelectorAll(".sp").forEach((b) => b.addEventListener("click", () => goStep(+b.dataset.i + 1)));
    paused = false;
    setActive("aprender");
    showStep(step, true);
    if (!rafId) rafId = requestAnimationFrame(loop);
    $("#main").scrollTop = 0;
  }

  function togglePause() {
    paused = !paused; $("#stage").classList.toggle("paused", paused);
    $("#b-pause").innerHTML = (paused ? UI.play : UI.pause) + `<span>${paused ? "Seguir" : "Pausa"}</span>`;
  }

  function showStep(i, first) {
    const lesson = cur.lesson, step = lesson.steps[i]; cur.step = i;
    const seen = Math.max(progress[lesson.id] || 0, i + 1);
    if (seen !== progress[lesson.id]) { progress[lesson.id] = seen; store.set("progress", progress); }
    applyStep(i, false);
    // estadísticas
    $("#stage").querySelectorAll(".stat").forEach((el, k) => {
      const v = (step.stats || [])[k] ?? "—", b = el.querySelector("b");
      if (b.textContent !== v) { b.textContent = v; el.classList.remove("pulse"); void el.offsetWidth; el.classList.add("pulse"); }
    });
    // nota
    const note = $("#note"), nt = step.note;
    if (nt) {
      note.className = "note " + nt.pos + (nt.wide ? " wide" : "");
      note.innerHTML = `<h6>${UI.bulb.replace("<svg", '<svg width="14" height="14"')} ${esc(nt.title)}</h6>` + nt.lines.map((l) => (typeof l === "string" ? `<div>${fmt(l)}</div>` : `<div>${l[0] ? `<b>${esc(l[0])}</b>` : ""}<i>${fmt(l[1])}</i></div>`)).join("");
    } else note.className = "note off";
    // panel de texto
    const sg = { "+": "p", "−": "m", t: "t" }, sy = { "+": "+", "−": "−", t: "~" };
    const tag = step.tag, nextStep = lesson.steps[i + 1], nextLesson = lessons[lessonIndex(lesson.id) + 1];
    $("#stepcard").innerHTML = `
      <div class="meta"><span>Paso ${i + 1} / ${lesson.steps.length}</span><span class="tag ${tag}">${TAGS[tag] || tag}</span></div>
      <h2>${fmt(step.title)}</h2>
      ${step.body.map((p) => `<p>${fmt(p)}</p>`).join("")}
      ${step.call ? `<div class="call ${step.call.k === "idea" ? "" : step.call.k}">${UI.bulb}<div><b>${esc(step.call.t)}</b>${fmt(step.call.x)}</div></div>` : ""}
      ${step.chg ? `<div class="chg"><b class="h">Qué cambió</b><ul>${step.chg.map(([k, t]) => `<li><s class="${sg[k]}">${sy[k]}</s><span>${fmt(t)}</span></li>`).join("")}</ul></div>` : ""}
      <div class="nav"><button class="btn" id="b-prev" type="button" ${i === 0 ? "disabled" : ""}>${UI.left} Atrás</button>
        <button class="btn go" id="b-next" type="button" ${!nextStep && !nextLesson ? "disabled" : ""}><span>${nextStep ? "Siguiente: " + esc(nextStep.label) : nextLesson ? "Siguiente lección: " + esc(nextLesson.title) : "Fin del curso"}</span>${UI.right}</button></div>
      <div class="keys"><kbd class="kbd">←</kbd><kbd class="kbd">→</kbd> paso · <kbd class="kbd">R</kbd> repetir · <kbd class="kbd">Espacio</kbd> pausa</div>`;
    $("#b-prev").onclick = () => goStep(i);
    $("#b-next").onclick = () => nextStep ? goStep(i + 2) : nextLesson && route(`#/leccion/${nextLesson.id}/1`);
    $("#stepcard").scrollTop = 0;
    // pasos
    $("#stp-n").textContent = `Paso ${i + 1} de ${lesson.steps.length}`;
    $("#steps").querySelectorAll(".sp").forEach((b, k) => { b.classList.toggle("done", k < i); if (k === i) b.setAttribute("aria-current", "step"); else b.removeAttribute("aria-current"); b.querySelector(".dot").innerHTML = k < i ? UI.tick : k + 1; });
    // Aprenderás
    $("#learn").innerHTML = `<h4>Aprenderás</h4><ul>${lesson.learn.map(([t, at]) => `<li class="${seen >= at ? "on" : ""}"><span class="bx">${UI.tick}</span><span>${fmt(t)}</span></li>`).join("")}</ul>`;
    // árbol y progreso
    const tr = $("#tree"); if (tr) { tr.innerHTML = treeHTML(); bindTree(); }
    const h = `#/leccion/${lesson.id}/${i + 1}`; if (location.hash !== h) history.replaceState(null, "", h);
  }
  function goStep(n) { n = Math.max(1, Math.min(cur.lesson.steps.length, n)); showStep(n - 1); }

  function setActive(name) {
    for (const t of ["presentacion", "aprender"]) { const el = $("#t-" + t); if (!el) continue; if (t === name) el.setAttribute("aria-current", "page"); else el.removeAttribute("aria-current"); }
    if (name === "aprender" && cur.lesson) $("#t-aprender").href = `#/leccion/${cur.lesson.id}/${cur.step + 1}`;
  }

  /* ---------- rutas ---------- */
  function route(hash) { if (location.hash !== hash) location.hash = hash; else onHash(); }
  function onHash() {
    const h = location.hash || "#/p/1";
    let m;
    if ((m = /^#\/p\/(\d+)$/.exec(h))) {
      shell.hidden = true; $("#tree") && $("#tree").classList.remove("open"); cur = { view: "deck", lesson: null, step: 0 };
      setActive("presentacion"); document.body.classList.add("deck-on");
      window.DECK.show(+m[1]);
      return;
    }
    document.body.classList.remove("deck-on"); if (window.DECK) window.DECK.hide(); shell.hidden = false;
    if ((m = /^#\/leccion\/([\w-]+)\/(\d+)$/.exec(h))) {
      const l = byId[m[1]]; if (!l) return route("#/leccion/que-es/1");
      const n = Math.max(1, Math.min(l.steps.length, +m[2])) - 1;
      if (cur.view === "lesson" && cur.lesson.id === l.id) showStep(n); else renderLesson(l.id, n);
    } else location.hash = "#/p/1";
    window.scrollTo(0, 0);
  }
  addEventListener("hashchange", onHash);

  /* ---------- menú móvil ---------- */
  $("#b-menu").addEventListener("click", () => { const t = $("#tree"); if (t) t.classList.toggle("open"); else route("#/leccion/que-es/1"); });

  /* ---------- búsqueda ---------- */
  const sw = $("#sw"), sq = $("#sq"), sres = $("#sres");
  let sel = 0, hits = [];
  const index = lessons.flatMap((l) => [{ t: l.title, s: l.mod.title + " · lección", x: l.title + " " + l.sub, h: `#/leccion/${l.id}/1` }].concat(l.steps.map((s, i) => ({ t: s.title, s: `${l.title} · paso ${i + 1}`, x: s.title + " " + s.body.join(" "), h: `#/leccion/${l.id}/${i + 1}` }))))
    .concat((window.SLIDE_INDEX || []).map((sl, i) => ({ t: sl.title, s: "Presentación · diapositiva " + (i + 1), x: sl.title + " " + (sl.text || ""), h: `#/p/${i + 1}` })));
  const plain = (s) => String(s).replace(/[`*]/g, "");
  function search() {
    const q = norm(sq.value.trim());
    const idx = (window.SLIDE_INDEX && index.length < lessons.length * 8 + window.SLIDE_INDEX.length ? index : index); hits = q ? idx.filter((it) => norm(it.x).includes(q)).slice(0, 12) : idx.filter((it) => /diapositiva/.test(it.s)).slice(0, 12);
    sel = 0;
    sres.innerHTML = hits.length ? hits.map((it, i) => `<button type="button" class="${i === sel ? "sel" : ""}" data-i="${i}">${esc(plain(it.t))}<small>${esc(it.s)}</small></button>`).join("") : `<div class="sempty">No encontré nada con «${esc(sq.value)}».</div>`;
    sres.querySelectorAll("button").forEach((b) => b.addEventListener("click", () => pick(+b.dataset.i)));
  }
  function pick(i) { const it = hits[i]; if (!it) return; closeSearch(); route(it.h); }
  let opener = null;
  function openSearch() { opener = document.activeElement; sw.classList.add("on"); sq.value = ""; search(); sq.focus(); }
  function closeSearch() { sw.classList.remove("on"); if (opener && opener.focus) opener.focus(); }
  $("#b-search").addEventListener("click", openSearch);
  sq.addEventListener("input", search);
  sw.addEventListener("click", (e) => { if (e.target === sw) closeSearch(); });
  sq.addEventListener("keydown", (e) => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") { e.preventDefault(); sel = (sel + (e.key === "ArrowDown" ? 1 : -1) + hits.length) % Math.max(hits.length, 1); sres.querySelectorAll("button").forEach((b, i) => { b.classList.toggle("sel", i === sel); if (i === sel) b.scrollIntoView({ block: "nearest" }); }); }
    else if (e.key === "Enter") { e.preventDefault(); pick(sel); }
  });

  /* ---------- teclado ---------- */
  addEventListener("keydown", (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); sw.classList.contains("on") ? closeSearch() : openSearch(); return; }
    if (e.key === "Escape" && sw.classList.contains("on")) { closeSearch(); return; }
    if (sw.classList.contains("on") || e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
    if (cur.view !== "lesson") return;
    if (e.key === "ArrowRight") { const l = cur.lesson; if (cur.step < l.steps.length - 1) goStep(cur.step + 2); }
    else if (e.key === "ArrowLeft") goStep(cur.step);
    else if (e.key === "r" || e.key === "R") applyStep(cur.step, true);
    else if (e.key === " " && !(e.target instanceof HTMLButtonElement)) { e.preventDefault(); togglePause(); }
  });

  window.SISG = { buildScene, applyStep, setScene(S) { scene = S; flowTimer = 0; }, setPaused(v) { paused = v; }, fmt, esc, UI, lessons, byId, norm, route };

  /* ---------- arranque ---------- */
  const startHash = location.hash || "#/p/1";
  if (!location.hash) history.replaceState(null, "", startHash);
  (document.fonts && document.fonts.load ? Promise.race([document.fonts.load('600 12px "JetBrains Mono"'), new Promise((r) => setTimeout(r, 1500))]) : Promise.resolve()).catch(() => {}).then(onHash);
})();
