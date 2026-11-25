/* Piezas dinámicas de la presentación: tablas reales, gráficas y las 8 consultas calculadas en el navegador
   sobre los mismos datos del almacén (data/dw.js, extraídos de entrega_sql/). */
(function () {
  "use strict";
  const D = window.DW;
  const X = (window.DWX = {});
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const N = (n) => Number(n).toLocaleString("en-US");
  const Q = (n) => "Q " + Number(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  X.N = N; X.Q = Q; X.esc = esc;

  /* ---------- índices de las dimensiones ---------- */
  const T = new Map(D.dw.tiempo.rows.map((r) => [r[0], r]));          // key, fecha, anio, trimestre, mes, nombre_mes, dia, dia_semana, fin_semana
  const G = new Map(D.dw.geografia.rows.map((r) => [r[0], r]));       // key, dep_id, mun_id, departamento, municipio
  const E = new Map(D.dw.entidad.rows.map((r) => [r[0], r]));         // key, id, nombre, tipo_entidad, departamento
  const P = new Map(D.dw.paciente.rows.map((r) => [r[0], r]));        // key, id, sexo
  const GR = new Map(D.dw.grupo.rows.map((r) => [r[0], r]));          // key, etiqueta, min, max
  const TP = new Map(D.dw.tipo.rows.map((r) => [r[0], r]));           // key, id, nombre, categoria
  const AR = new Map(D.dw.area.rows.map((r) => [r[0], r]));           // key, id, area
  const FE = D.dw.fe.rows;   // id, tiempo, entidad, geo, paciente, tipo, grupo, estado(0 REALIZADO, 2 CANCELADO), costo, dur
  const FC = D.dw.fc.rows;   // id, t_ini, t_fin, entidad, geo, area, estado, personas, presupuesto, dias
  const MEN = D.dw.mensual.rows; // anio, mes, entidad, tipo, total, ingresos, dur_prom
  X.idx = { T, G, E, P, GR, TP, AR };
  const REAL = FE.filter((f) => f[7] === 0);
  const mesTxt = (a, m) => `${a}-${String(m).padStart(2, "0")}`;
  const cmp = (a, b) => (a < b ? -1 : a > b ? 1 : 0);

  /* ---------- tabla HTML ---------- */
  X.table = function (cols, rows, o) {
    o = o || {};
    const hl = new Set(o.hl || []);
    return `<table class="dt"><thead><tr>${cols.map((c) => `<th class="${hl.has(c) ? "hl" : ""}">${esc(c)}</th>`).join("")}</tr></thead><tbody>` +
      rows.map((r, ri) => `<tr class="${o.row === ri ? "pick" : ""}">${r.map((v, i) => {
        const num = typeof v === "number", cls = (num ? "n " : "") + (hl.has(cols[i]) ? "hl " : "") + (v === null ? "nul" : "");
        return `<td class="${cls}">${v === null ? "NULL" : num ? (Number.isInteger(v) ? v : v.toFixed(2)) : esc(v)}</td>`;
      }).join("")}</tr>`).join("") + `</tbody></table>`;
  };

  /* ---------- barras ---------- */
  X.hbars = function (items, o) {
    o = o || {}; const max = Math.max(...items.map((i) => i.value), 1);
    return `<div class="hb">${items.map((i) => `<div class="hbr ${i.cls || ""}"><span class="hl">${esc(i.label)}</span><span class="hbt"><i style="width:${(i.value / max) * 100}%;${i.color ? "background:" + i.color : ""}"></i></span><b>${esc(i.text != null ? i.text : N(i.value))}</b></div>`).join("")}</div>`;
  };
  X.vbars = function (items, o) {
    o = o || {}; const max = Math.max(...items.map((i) => Math.abs(i.value)), 1), min = Math.min(0, ...items.map((i) => i.value));
    const span = max - min || 1, top = (Math.max(0, ...items.map((i) => i.value)) / span) * 100;   // % desde arriba donde está el cero
    return `<div class="vb" style="--n:${items.length}">${items.map((i) => {
      const h = (Math.abs(i.value) / span) * 100, up = i.value >= 0;
      return `<div class="vbc" title="${esc(i.label)}: ${esc(i.text != null ? i.text : N(i.value))}"><div class="vbm"><i class="${up ? "up" : "dn"}" style="height:${h}%;${up ? `bottom:${100 - top}%` : `top:${top}%`}"></i></div><small>${esc(i.short != null ? i.short : "")}</small></div>`;
    }).join("")}</div>`;
  };

  /* =====================================================================
     LAS CONSULTAS (06_consultas.sql) calculadas en el navegador
     ===================================================================== */
  const deps = [...new Set(D.dw.geografia.rows.filter((r) => r[0] !== -1).map((r) => r[3]))].sort(cmp);
  const centros = D.dw.entidad.rows.filter((r) => /centro/i.test(r[3])).map((r) => r[2]);
  const cats = [...new Set(D.dw.tipo.rows.map((r) => r[3]))];
  X.options = { deps, centros, cats };

  function q1() {
    const m = new Map();
    for (const f of REAL) {
      const t = T.get(f[1]), cat = TP.get(f[5])[3], k = t[2] * 100 + t[4] + "|" + cat;
      let o = m.get(k); if (!o) m.set(k, (o = { a: t[2], m: t[4], cat, n: 0, s: 0 }));
      o.n++; o.s += f[8];
    }
    return [...m.values()].sort((a, b) => a.a - b.a || a.m - b.m || b.s - a.s);
  }
  function monthSeries(rows) { const s = new Map(); for (const r of rows) { const k = mesTxt(r.a, r.m); s.set(k, (s.get(k) || 0) + r.s); } return [...s].map(([label, value]) => ({ label, value })); }

  X.queries = [
    { n: 1, short: "Estudios e ingresos por mes y categoría", q: "¿Cuántos estudios y cuánto ingreso hubo cada mes, por categoría de estudio?",
      sql: "SELECT t.anio, t.mes, te.categoria,\n       COUNT(*) AS estudios, SUM(f.costo_q) AS ingresos_q\nFROM fact_estudio f\nJOIN dim_tiempo t       ON t.tiempo_key = f.tiempo_key\nJOIN dim_tipo_estudio te ON te.tipo_estudio_key = f.tipo_estudio_key\nWHERE f.estado = 'REALIZADO'\nGROUP BY t.anio, t.mes, te.categoria\nORDER BY t.anio, t.mes, ingresos_q DESC;",
      dims: ["fact_estudio", "dim_tiempo", "dim_tipo_estudio"], tech: "hecho + 2 dimensiones", scanned: FE.length,
      run() { const r = q1(); const s = monthSeries(r);
        return { cols: ["anio", "mes", "categoria", "estudios", "ingresos_q"], rows: r.map((o) => [o.a, o.m, o.cat, o.n, +o.s.toFixed(2)]),
          chart: { kind: "v", title: "Ingresos por mes (Q)", items: s.map((x) => ({ label: x.label, short: x.label.endsWith("-01") || x.label.endsWith("-07") ? x.label : "", value: x.value, text: Q(x.value) })) }, total: r.length }; } },
    { n: 2, short: "Los 3 estudios más frecuentes por departamento", q: "En cada departamento, ¿cuáles son los 3 estudios que más se hacen?",
      sql: "SELECT departamento, tipo_estudio, estudios, posicion\nFROM (\n  SELECT g.departamento, te.tipo_estudio, COUNT(*) AS estudios,\n         RANK() OVER (PARTITION BY g.departamento\n                      ORDER BY COUNT(*) DESC) AS posicion\n  FROM fact_estudio f\n  JOIN dim_geografia g     ON g.geo_key = f.geo_key\n  JOIN dim_tipo_estudio te ON te.tipo_estudio_key = f.tipo_estudio_key\n  WHERE f.estado = 'REALIZADO'\n  GROUP BY g.departamento, te.tipo_estudio\n) r\nWHERE posicion <= 3;",
      dims: ["fact_estudio", "dim_geografia", "dim_tipo_estudio"], tech: "RANK() OVER", scanned: FE.length,
      ctl: { label: "Departamento", options: () => deps, def: () => (deps.includes("Guatemala") ? "Guatemala" : deps[0]) },
      run(dep) { const m = new Map();
        for (const f of REAL) { const g = G.get(f[3]); if (!g || g[3] !== dep) continue; const t = TP.get(f[5])[2]; m.set(t, (m.get(t) || 0) + 1); }
        const arr = [...m].sort((a, b) => b[1] - a[1]); let rank = 0, prev = null, pos = 0;
        const ranked = arr.map(([t, n], i) => { pos = i + 1; if (n !== prev) { rank = pos; prev = n; } return [t, n, rank]; });
        return { cols: ["departamento", "tipo_estudio", "estudios", "posicion"], rows: ranked.filter((r) => r[2] <= 3).map((r) => [dep, r[0], r[1], r[2]]),
          chart: { kind: "h", title: `Estudios por tipo en ${dep}`, items: ranked.map((r) => ({ label: r[0], value: r[1], cls: r[2] <= 3 ? "top" : "" })) }, total: ranked.length }; } },
    { n: 3, short: "Ingresos por centro y trimestre, con acumulado", q: "¿Cuánto ingresa cada centro por trimestre y cuánto lleva acumulado en el año?",
      sql: "SELECT e.nombre AS centro, t.anio, t.trimestre,\n       SUM(f.costo_q) AS ingresos_q,\n       SUM(SUM(f.costo_q)) OVER (\n         PARTITION BY e.nombre, t.anio\n         ORDER BY t.trimestre) AS acumulado_anio\nFROM fact_estudio f\nJOIN dim_entidad e ON e.entidad_key = f.entidad_key\nJOIN dim_tiempo t  ON t.tiempo_key  = f.tiempo_key\nWHERE f.estado = 'REALIZADO'\nGROUP BY e.nombre, t.anio, t.trimestre;",
      dims: ["fact_estudio", "dim_entidad", "dim_tiempo"], tech: "SUM() OVER", scanned: FE.length,
      ctl: { label: "Centro", options: () => centros, def: () => centros[0] },
      run(centro) { const m = new Map();
        for (const f of REAL) { const e = E.get(f[2]); if (!e || e[2] !== centro) continue; const t = T.get(f[1]), k = t[2] * 10 + t[3]; m.set(k, (m.get(k) || 0) + f[8]); }
        const arr = [...m].sort((a, b) => a[0] - b[0]); const acc = {}; const rows = arr.map(([k, v]) => { const a = Math.floor(k / 10), q = k % 10; acc[a] = (acc[a] || 0) + v; return [centro, a, q, +v.toFixed(2), +acc[a].toFixed(2)]; });
        return { cols: ["centro", "anio", "trimestre", "ingresos_q", "acumulado_anio"], rows,
          chart: { kind: "v", title: "Ingresos por trimestre (Q)", items: rows.map((r) => ({ label: `${r[1]} T${r[2]}`, short: `T${r[2]}`, value: r[3], text: Q(r[3]) })) }, total: rows.length }; } },
    { n: 4, short: "Perfil de pacientes por sexo y edad", q: "Para una categoría de estudio, ¿qué sexo y grupo de edad tienen los pacientes?",
      sql: "SELECT te.categoria, p.sexo, ge.etiqueta AS grupo_etario,\n       COUNT(*) AS estudios\nFROM fact_estudio f\nJOIN dim_tipo_estudio te ON te.tipo_estudio_key = f.tipo_estudio_key\nJOIN dim_paciente p      ON p.paciente_key      = f.paciente_key\nJOIN dim_grupo_etario ge ON ge.grupo_etario_key = f.grupo_etario_key\nWHERE f.estado = 'REALIZADO'\nGROUP BY te.categoria, p.sexo, ge.etiqueta;",
      dims: ["fact_estudio", "dim_tipo_estudio", "dim_paciente", "dim_grupo_etario"], tech: "4 dimensiones", scanned: FE.length,
      ctl: { label: "Categoría", options: () => cats, def: () => cats[0] },
      run(cat) { const m = new Map();
        for (const f of REAL) { if (TP.get(f[5])[3] !== cat) continue; const sx = P.get(f[4])[2], g = GR.get(f[6])[1], k = sx + "|" + g; m.set(k, (m.get(k) || 0) + 1); }
        const order = D.dw.grupo.rows.map((r) => r[1]); const rows = [...m].map(([k, n]) => { const [s, g] = k.split("|"); return [cat, s, g, n]; }).sort((a, b) => cmp(a[1], b[1]) || order.indexOf(a[2]) - order.indexOf(b[2]));
        const sexos = [...new Set(rows.map((r) => r[1]))];
        return { cols: ["categoria", "sexo", "grupo_etario", "estudios"], rows,
          chart: { kind: "h", title: `Estudios de ${cat}: sexo y grupo de edad`, items: rows.map((r) => ({ label: `${r[1]} · ${r[2]}`, value: r[3], color: r[1] === sexos[0] ? "var(--c-blue)" : "var(--c-pink)" })) }, total: rows.length }; } },
    { n: 5, short: "Campañas: personas atendidas y costo por persona", q: "¿A cuántas personas atendió cada área de campaña y a qué costo por persona?",
      sql: "SELECT a.area, COUNT(*) AS campanas,\n       SUM(c.personas_atendidas) AS personas,\n       ROUND(SUM(c.presupuesto_q) /\n             NULLIF(SUM(c.personas_atendidas), 0), 2) AS costo_por_persona_q\nFROM fact_campana c\nJOIN dim_area_campana a ON a.area_key = c.area_key\nWHERE c.personas_atendidas > 0\nGROUP BY a.area\nORDER BY personas DESC;",
      dims: ["fact_campana", "dim_area_campana"], tech: "NULLIF", scanned: FC.length,
      run() { const m = new Map();
        for (const c of FC) { if (!(c[7] > 0)) continue; const a = AR.get(c[5])[2]; let o = m.get(a); if (!o) m.set(a, (o = { n: 0, p: 0, b: 0 })); o.n++; o.p += c[7]; o.b += c[8] || 0; }
        const rows = [...m].sort((a, b) => b[1].p - a[1].p).map(([a, o]) => [a, o.n, o.p, o.p ? +(o.b / o.p).toFixed(2) : null]);
        return { cols: ["area", "campanas", "personas", "costo_por_persona_q"], rows,
          chart: { kind: "h", title: "Personas atendidas por área", items: rows.map((r) => ({ label: r[0], value: r[2], text: N(r[2]) + " · " + (r[3] != null ? Q(r[3]) + "/persona" : "") })) }, total: rows.length }; } },
    { n: 6, short: "Estudios vs campañas por departamento (cruce)", q: "¿Dónde hay más estudios y dónde más personas atendidas en campañas, por departamento?",
      sql: "SELECT g.departamento,\n       COALESCE(e.estudios, 0)  AS estudios,\n       COALESCE(c.personas, 0)  AS personas_en_campanas\nFROM (SELECT DISTINCT departamento\n      FROM dim_geografia WHERE geo_key <> -1) g\nLEFT JOIN (/* estudios REALIZADO por departamento */) e\n       ON e.departamento = g.departamento\nLEFT JOIN (/* personas de fact_campana por departamento */) c\n       ON c.departamento = g.departamento\nORDER BY estudios DESC;",
      dims: ["fact_estudio", "fact_campana", "dim_geografia"], tech: "dimensión conformada", scanned: FE.length + FC.length,
      run() { const m = new Map(deps.map((d) => [d, { e: 0, p: 0 }]));
        for (const f of REAL) { const g = G.get(f[3]); if (g && m.has(g[3])) m.get(g[3]).e++; }
        for (const c of FC) { const g = G.get(c[4]); if (g && m.has(g[3])) m.get(g[3]).p += c[7] || 0; }
        const rows = [...m].sort((a, b) => b[1].e - a[1].e).map(([d, o]) => [d, o.e, o.p]);
        return { cols: ["departamento", "estudios", "personas_en_campanas"], rows,
          chart: { kind: "h", title: "Estudios realizados por departamento", items: rows.slice(0, 12).map((r) => ({ label: r[0], value: r[1], text: `${N(r[1])} estudios · ${N(r[2])} personas` })) }, total: rows.length }; } },
    { n: 7, short: "Crecimiento mensual de estudios", q: "¿Cuánto creció o bajó cada mes la cantidad de estudios respecto al anterior?",
      sql: "SELECT anio, mes, estudios,\n       LAG(estudios) OVER (ORDER BY anio, mes) AS mes_anterior,\n       ROUND(100 * (estudios - LAG(estudios) OVER (ORDER BY anio, mes))\n             / LAG(estudios) OVER (ORDER BY anio, mes), 1) AS variacion_pct\nFROM (SELECT anio, mes, SUM(total_estudios) AS estudios\n      FROM fact_estudio_mensual\n      GROUP BY anio, mes) m\nORDER BY anio, mes;",
      dims: ["fact_estudio_mensual"], tech: "LAG()", scanned: MEN.length,
      run() { const m = new Map(); for (const r of MEN) { const k = r[0] * 100 + r[1]; m.set(k, (m.get(k) || 0) + r[4]); }
        const arr = [...m].sort((a, b) => a[0] - b[0]); const rows = arr.map(([k, n], i) => { const prev = i ? arr[i - 1][1] : null; return [Math.floor(k / 100), k % 100, n, prev, prev ? +((100 * (n - prev)) / prev).toFixed(1) : null]; });
        return { cols: ["anio", "mes", "estudios", "mes_anterior", "variacion_pct"], rows,
          chart: { kind: "v", title: "Variación mensual (%)", items: rows.filter((r) => r[4] != null).map((r) => ({ label: mesTxt(r[0], r[1]), short: r[1] === 1 || r[1] === 7 ? mesTxt(r[0], r[1]) : "", value: r[4], text: r[4] + " %" })) }, total: rows.length }; } },
    { n: 8, short: "Lo mismo que la 1, desde la tabla resumen", q: "La misma pregunta que la consulta 1, pero leyendo la tabla de sumarización.",
      sql: "SELECT m.anio, m.mes, te.categoria,\n       SUM(m.total_estudios) AS estudios,\n       SUM(m.ingresos_q)     AS ingresos_q\nFROM fact_estudio_mensual m\nJOIN dim_tipo_estudio te\n  ON te.tipo_estudio_key = m.tipo_estudio_key\nGROUP BY m.anio, m.mes, te.categoria\nORDER BY m.anio, m.mes, ingresos_q DESC;",
      dims: ["fact_estudio_mensual", "dim_tipo_estudio"], tech: "tabla de sumarización", scanned: MEN.length,
      run() { const m = new Map();
        for (const r of MEN) { const cat = TP.get(r[3])[3], k = r[0] * 100 + r[1] + "|" + cat; let o = m.get(k); if (!o) m.set(k, (o = { a: r[0], m: r[1], cat, n: 0, s: 0 })); o.n += r[4]; o.s += r[5]; }
        const rows8 = [...m.values()].sort((a, b) => a.a - b.a || a.m - b.m || b.s - a.s);
        const rows1 = q1(); let same = rows1.length === rows8.length;
        const k1 = new Map(rows1.map((o) => [o.a * 100 + o.m + "|" + o.cat, o]));
        for (const o of rows8) { const x = k1.get(o.a * 100 + o.m + "|" + o.cat); if (!x || x.n !== o.n || Math.abs(x.s - o.s) > 0.05) { same = false; break; } }
        const s = monthSeries(rows8);
        return { cols: ["anio", "mes", "categoria", "estudios", "ingresos_q"], rows: rows8.map((o) => [o.a, o.m, o.cat, o.n, +o.s.toFixed(2)]),
          chart: { kind: "v", title: "Ingresos por mes (Q)", items: s.map((x) => ({ label: x.label, short: x.label.endsWith("-01") || x.label.endsWith("-07") ? x.label : "", value: x.value, text: Q(x.value) })) }, total: rows8.length,
          check: { same, rows: rows8.length } }; } },
  ];

  /* ---------- datos para el estudio descifrado ---------- */
  X.decode = function (f) {
    const t = T.get(f[1]), e = E.get(f[2]), g = G.get(f[3]), p = P.get(f[4]), tp = TP.get(f[5]), gr = GR.get(f[6]);
    return { t, e, g, p, tp, gr };
  };
  X.randomFact = () => REAL[Math.floor(Math.random() * REAL.length)];
  X.sampleFact = (i) => REAL[i % REAL.length];
  X.counts = { fe: FE.length, fr: REAL.length, cancelados: FE.length - REAL.length, fc: FC.length, men: MEN.length };
})();
