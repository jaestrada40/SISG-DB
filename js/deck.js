/* La presentación: 20 diapositivas de 1280×720 que se escalan a la pantalla.
   → avanza (primero los pasos internos de la diapositiva, luego la siguiente) · ← retrocede · F pantalla completa · I índice. */
(function () {
  "use strict";
  const X = window.DWX, D = window.DW, C = window.COURSE;
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => [...(r || document).querySelectorAll(s)];
  const esc = X.esc, N = X.N, Q = X.Q;
  const fmt = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c])).replace(/`([^`]+)`/g, "<code>$1</code>").replace(/\*\*(.+?)\*\*/g, "<b>$1</b>");
  const REDUCED = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const dwCount = D.counts.dw, fuCount = D.counts.fuente;

  /* =====================================================================
     UTILIDADES
     ===================================================================== */
  function sceneIn(svg, lesson, step, onNode) {
    const S = SISG.buildScene(lesson, svg); S.onNode = onNode || null;
    SISG.setScene(S); SISG.setPaused(false);
    if (step != null) SISG.applyStep(step, false, S);   // una sola vez: aplicar dos veces seguidas se pisa
    return S;
  }
  function countUp(el, to, ms, fmtFn) {
    const f = fmtFn || N; if (REDUCED) { el.textContent = f(to); return; }
    const t0 = performance.now();
    (function tick(t) { const k = Math.min(1, (t - t0) / ms), e = 1 - Math.pow(1 - k, 3); el.textContent = f(Math.round(to * e)); if (k < 1) requestAnimationFrame(tick); })(t0);
  }
  const showNote = (host, nt) => {
    let n = $(".note", host); if (!n) { n = document.createElement("div"); n.className = "note off"; host.appendChild(n); }
    if (!nt) { n.className = "note off"; return; }
    n.className = "note " + nt.pos + (nt.wide ? " wide" : "");
    n.innerHTML = `<h6>${esc(nt.title)}</h6>` + nt.lines.map((l) => (typeof l === "string" ? `<div>${fmt(l)}</div>` : `<div>${l[0] ? `<b>${esc(l[0])}</b>` : ""}<i>${fmt(l[1])}</i></div>`)).join("");
  };
  const TAGS = { SOLUCION: "SOLUCIÓN" };

  /* ---- reproductor de una lección dentro de una diapositiva ---- */
  function player(body, ctx, id, from, to, opt) {
    opt = opt || {};
    const L = SISG.byId[id];
    body.innerHTML = `<div class="pl"><div class="pl-cap"></div><div class="pl-stage"><svg class="sv" role="img" aria-label="${esc(L.title)}"></svg></div></div>`;
    const S = sceneIn($(".sv", body), L, null, null), cap = $(".pl-cap", body), stage = $(".pl-stage", body);
    const show = (k) => {
      const i = from + k, st = L.steps[i];
      SISG.applyStep(i, false, S);
      cap.innerHTML = `<span class="tag ${st.tag}">${TAGS[st.tag] || st.tag}</span><h2>${fmt(st.title)}</h2>${st.body.map((p) => `<p>${fmt(p)}</p>`).join("")}` +
        (st.call ? `<div class="call ${st.call.k === "idea" ? "" : st.call.k}"><div><b>${esc(st.call.t)}</b>${fmt(st.call.x)}</div></div>` : "") + (opt.extra ? opt.extra(k, i) : "");
      showNote(stage, st.note);
    };
    ctx.builds(to - from + 1, show);
    return S;
  }

  /* =====================================================================
     DIAGRAMAS: ER de la app, ER de la fuente y estrella
     ===================================================================== */
  const T_ = (x, y, color, title, cols, w, extra) => Object.assign({ k: "tbl", x, y, w: w || 200, color, title, cols, hh: 22, rh: 15, fs: 10.5 }, extra || {});
  const erApp = {
    id: "er-app", vb: [1180, 530], nodes: {
      usuario: T_(10, 10, "blue", "usuario", ["PK id", "FK entidadId", "nombre", "correo", "rol", "activo", "creadoEn", "ultimoAcceso", "mfaActivo", "passwordHash", "mfaSecreto", "mfaUltimoPaso", "mfaRecuperacion", "intentosFallidos", "bloqueadoHasta", "sesionesDesde", "invitacionHash", "invitacionVence"]),
      bitacora: T_(10, 350, "purple", "bitacora", ["PK id", "FK entidadId", "tabla", "FK usuarioId", "registroId", "accion", "detalle", "creadoEn"]),
      entidad: T_(250, 10, "orange", "entidad", ["PK id", "nombre", "tipo", "departamento", "telefono", "activa", "correo"]),
      paciente: T_(250, 190, "green", "paciente", ["PK id", "FK entidadId", "nombreCompleto", "dpi", "fechaNacimiento", "sexo", "departamento", "municipio", "telefono", "contactoEmergencia", "estado"]),
      estudio: T_(490, 10, "yellow", "estudio", ["PK id", "FK entidadId", "FK pacienteId", "tipoEstudio", "salaEquipo", "fecha", "hora", "especialista", "resultado", "estado", "monto"]),
      enlace_resultado: T_(490, 330, "blue", "enlace_resultado", ["PK id", "FK entidadId", "FK estudioId", "tokenHash", "expiraEn", "revocadoEn", "intentosFallidos", "accesos", "ultimoAccesoEn", "creadoEn"]),
      campana: T_(730, 10, "teal", "campana", ["PK id", "FK entidadId", "nombre", "area", "departamento", "ubicacion", "fechaInicio", "fechaFin", "personasAtendidas", "estado", "costo"]),
      atencion: T_(730, 260, "green", "atencion", ["PK id", "FK entidadId", "FK campanaId", "FK pacienteId", "claveCliente", "atendidoEn", "creadoEn"]),
      referido: T_(970, 10, "pink", "referido", ["PK id", "FK entidadOrigenId", "FK entidadDestinoId", "FK campanaId", "nombreCompleto", "sexo", "dpi", "fechaNacimiento", "telefono", "tipoEstudio", "motivo", "estado", "codigo", "consentimientoEn", "FK estudioId", "fechaCita", "creadoEn", "atendidoEn"]),
    },
    edges: [
      { a: "entidad", b: "usuario" }, { a: "entidad", b: "paciente" }, { a: "entidad", b: "estudio" }, { a: "paciente", b: "estudio" }, { a: "estudio", b: "enlace_resultado" },
      { a: "entidad", b: "campana", via: [[350, 2], [830, 2]] }, { a: "campana", b: "atencion" }, { a: "paciente", b: "atencion" },
      { a: "entidad", b: "bitacora", via: [[228, 76], [228, 424]] }, { a: "entidad", b: "referido", via: [[350, 2], [1070, 2]] }, { a: "referido", b: "campana" },
    ],
  };
  const erFuente = {
    id: "er-fuente", vb: [1180, 520], nodes: {
      departamento: T_(10, 10, "green", "departamento", ["PK id", "nombre UNIQUE"], 270),
      municipio: T_(10, 110, "green", "municipio", ["PK id", "FK departamento_id", "nombre"], 270),
      tipo_entidad: T_(10, 260, "green", "tipo_entidad", ["PK id", "nombre UNIQUE"], 270),
      entidad: T_(310, 10, "orange", "entidad", ["PK id", "nombre", "FK tipo_entidad_id", "FK departamento_id", "telefono", "correo UNIQUE", "creado_en"], 270),
      paciente: T_(310, 200, "blue", "paciente", ["PK id", "FK entidad_id", "nombre_completo", "dpi", "fecha_nacimiento", "sexo ENUM", "FK departamento_id", "FK municipio_id", "telefono", "estado ENUM"], 270),
      estudio: T_(610, 10, "yellow", "estudio", ["PK id", "FK entidad_id", "FK paciente_id", "FK tipo_estudio_id", "fecha", "hora", "especialista", "sala_equipo", "estado ENUM", "duracion_min", "costo_q", "resultado"], 270),
      tipo_estudio: T_(610, 280, "green", "tipo_estudio", ["PK id", "nombre UNIQUE", "categoria", "precio_base_q", "duracion_base"], 270),
      campana: T_(910, 10, "teal", "campana", ["PK id", "FK entidad_id", "FK area_id", "nombre", "FK departamento_id", "FK municipio_id", "ubicacion", "fecha_inicio", "fecha_fin", "estado ENUM", "personas_atendidas", "presupuesto_q"], 270),
      area_campana: T_(910, 280, "green", "area_campana", ["PK id", "nombre UNIQUE"], 270),
      bitacora: T_(910, 380, "purple", "bitacora", ["PK id", "tabla", "registro_id", "accion ENUM", "usuario_db", "fecha_hora", "detalle JSON"], 270),
    },
    edges: [
      { a: "municipio", b: "departamento" }, { a: "entidad", b: "departamento" }, { a: "entidad", b: "tipo_entidad" }, { a: "entidad", b: "paciente" }, { a: "paciente", b: "municipio" },
      { a: "entidad", b: "estudio" }, { a: "paciente", b: "estudio" }, { a: "estudio", b: "tipo_estudio" }, { a: "campana", b: "entidad", via: [[445, 2], [1045, 2]] }, { a: "campana", b: "area_campana" },
    ],
  };
  const addAll = (L) => { L.steps = [{ add: Object.keys(L.nodes), eadd: L.edges.map((e) => e.id || `${e.a}-${e.b}`), tag: "IDEA", title: "", body: [] }]; return L; };
  addAll(erApp); addAll(erFuente);

  const APP_NOTE = { entidad: "Cada centro u organismo. Es la dueña de casi todas las demás filas.", usuario: "Cuentas de cada entidad. La contraseña y el secreto del MFA se guardan con hash o cifrados; aquí no se muestran.", paciente: "Pacientes de una entidad. El nombre y el DPI no se muestran.", estudio: "Estudios que hace un centro. El tipo se escribe como texto.", campana: "Campañas de un organismo: área y departamento también son texto.", referido: "Envío de una persona de una entidad a otra.", atencion: "Persona atendida en una campaña.", bitacora: "Quién hizo qué y cuándo.", enlace_resultado: "Enlaces temporales para ver un resultado; solo se guarda el hash del token." };
  const FU_NOTE = { departamento: "Catálogo: cada departamento existe una sola vez.", municipio: "Catálogo de municipios, cada uno con su departamento.", tipo_entidad: "Centro de diagnóstico u organismo no lucrativo.", entidad: "Los 14 centros y organismos de los datos de ejemplo.", paciente: "Con llaves a su entidad y su lugar. El nombre y el DPI se muestran enmascarados.", tipo_estudio: "Catálogo con precio y duración de lista.", estudio: "Un estudio de un paciente en un centro, con costo y duración.", area_campana: "Catálogo de áreas de campaña.", campana: "Campañas con área, lugar y presupuesto.", bitacora: "Rastro de cambios, la llenan los triggers." };

  function erSlide(body, ctx, L, dataset, notes, counts) {
    body.innerHTML = `<div class="er"><svg class="sv" role="img" aria-label="Diagrama entidad-relación"></svg><div class="er-hint">Haz clic en una tabla para ver sus filas reales</div><aside class="drawer" hidden></aside></div>`;
    const dr = $(".drawer", body), root = $(".er", body);
    let S;
    const close = () => { dr.hidden = true; L.steps[0].focus = []; SISG.applyStep(0, false, S); };
    const open = (id) => {
      L.steps[0].focus = [id]; SISG.applyStep(0, false, S);
      const d = dataset[id], n = counts[id] != null ? counts[id] : d ? d.n : 0, def = L.nodes[id];
      dr.innerHTML = `<header><h3>${esc(def.title)}</h3><span class="badge">${N(n)} ${n === 1 ? "fila" : "filas"}</span><button type="button" aria-label="Cerrar">✕</button></header><p>${esc(notes[id] || "")}</p>` +
        (d && d.rows.length ? `<div class="drawer-t">${X.table(d.cols, d.rows.slice(0, 9))}</div><small>Se muestran ${Math.min(9, d.rows.length)} de ${N(n)} filas y ${d.cols.length} de ${def.cols.length} columnas.</small>` : `<div class="empty">Esta tabla no tiene filas en los datos de ejemplo.</div>`);
      dr.classList.toggle("left", def.x + (def.w || 200) / 2 > 590);   // el panel se abre del lado contrario a la tabla elegida
      dr.hidden = false; $("button", dr).onclick = close;
    };
    S = sceneIn($(".sv", body), L, 0, open);
    ctx.on(root, "click", (e) => { if (!e.target.closest(".nd") && !e.target.closest(".drawer")) close(); });
    ctx.onKey("Escape", close);
  }

  /* ---- estrella ---- */
  const dimCube = (x, y, color, icon, label, sub) => ({ k: "cube", s: 44, x, y, color, icon, label, sub });
  const starLesson = (mode) => {
    const nodes = {
      paciente: dimCube(95, 100, "pink", "user", "Paciente", "dim_paciente"), tipo: dimCube(95, 265, "orange", "tag", "Tipo de\nestudio", "dim_tipo_estudio"), edad: dimCube(95, 430, "purple", "people", "Grupo\netario", "dim_grupo_etario"),
      tiempo: dimCube(650, 100, "yellow", "calendar", "Tiempo", "dim_tiempo"), geo: dimCube(650, 265, "green", "map", "Geografía", "dim_geografia"), ent: dimCube(650, 430, "blue", "flask", "Entidad", "dim_entidad"),
    };
    const edges = [];
    if (mode === "fe") {
      nodes.fe = T_(255, 130, "yellow", "fact_estudio", ["PK estudio_id", "FK tiempo_key", "FK entidad_key", "FK geo_key", "FK paciente_key", "FK tipo_estudio_key", "FK grupo_etario_key", "estado", "cantidad", "costo_q", "duracion_min"], 230, { rh: 17, fs: 11 });
      for (const d of ["paciente", "tipo", "edad", "tiempo", "geo", "ent"]) edges.push({ a: d, b: "fe", arrow: false });
    } else {
      delete nodes.paciente; delete nodes.tipo; delete nodes.edad;
      nodes.area = dimCube(95, 265, "pink", "heart", "Área de\ncampaña", "dim_area_campana");
      nodes.fc = T_(255, 150, "teal", "fact_campana", ["PK campana_id", "FK tiempo_inicio_key", "FK tiempo_fin_key", "FK entidad_key", "FK geo_key", "FK area_key", "estado", "personas_atendidas", "presupuesto_q", "duracion_dias"], 230, { rh: 17, fs: 11 });
      edges.push({ a: "area", b: "fc", arrow: false }, { a: "tiempo", b: "fc", arrow: false, label: "inicio y fin" }, { a: "geo", b: "fc", arrow: false }, { a: "ent", b: "fc", arrow: false });
    }
    return { id: "star-" + mode, vb: [740, 530], nodes, edges, steps: [{ add: Object.keys(nodes), eadd: edges.map((e) => `${e.a}-${e.b}`), tag: "IDEA", title: "", body: [] }] };
  };
  const STAR = {
    fe: { t: "fact_estudio", d: "fe", n: dwCount.fact_estudio, role: "Tabla de hechos", txt: "Grano: **un estudio**. Medidas: `cantidad`, `costo_q` y `duracion_min`. El estado queda en la fila." },
    fc: { t: "fact_campana", d: "fc", n: dwCount.fact_campana, role: "Tabla de hechos", txt: "Grano: **una campaña**. Medidas: `personas_atendidas`, `presupuesto_q` y `duracion_dias`." },
    tiempo: { t: "dim_tiempo", d: "tiempo", n: dwCount.dim_tiempo, role: "Dimensión conformada", txt: "Una fila por día. Llave `yyyymmdd`. Jerarquía **día → mes → trimestre → año**. En la campaña se usa dos veces: inicio y fin." },
    geo: { t: "dim_geografia", d: "geografia", n: dwCount.dim_geografia, role: "Dimensión conformada", txt: "Municipio → departamento en la misma tabla. La fila `-1` es «desconocido»; hay una fila por departamento sin municipio." },
    ent: { t: "dim_entidad", d: "entidad", n: dwCount.dim_entidad, role: "Dimensión conformada", txt: "Centros y organismos. Distingue el tipo de entidad." },
    paciente: { t: "dim_paciente", d: "paciente", n: dwCount.dim_paciente, role: "Dimensión", txt: "Solo el **sexo**. Sin nombre, DPI ni teléfono." },
    tipo: { t: "dim_tipo_estudio", d: "tipo", n: dwCount.dim_tipo_estudio, role: "Dimensión", txt: "Tipo de estudio y su categoría: tipo → categoría." },
    edad: { t: "dim_grupo_etario", d: "grupo", n: dwCount.dim_grupo_etario, role: "Dimensión", txt: "La edad se calcula **al día del estudio** y se guarda como grupo. `-1` si falta la fecha de nacimiento." },
    area: { t: "dim_area_campana", d: "area", n: dwCount.dim_area_campana, role: "Dimensión", txt: "Área de la campaña." },
  };
  const CONF = new Set(["tiempo", "geo", "ent"]);

  /* =====================================================================
     DIAPOSITIVAS
     ===================================================================== */
  const KICK = { cover: ["", ""], m1: ["La aplicación", "orange"], m2: ["Orden en la fuente", "blue"], m3: ["Almacén de datos", "purple"], m4: ["Cierre", "green"] };
  const SLIDES = [];
  const add = (kick, title, text, render, o) => SLIDES.push(Object.assign({ kick, title, text, render }, o || {}));

  /* 1 · portada */
  add("cover", "SISG · Base de datos", "portada Bases de Datos II Universidad San Pablo de Guatemala Grupo 4", (b, ctx) => {
    b.innerHTML = `<div class="cv"><div class="cv-t"><span class="cv-k">Sistema Integral de Salud de Guatemala</span><h1>SISG<br><mark>Base de datos</mark></h1>
      <p>De la aplicación al almacén de datos: tablas, modelo estrella, ETL y consultas, con los datos del proyecto.</p><small>Bases de Datos II · Universidad San Pablo de Guatemala · Grupo 4</small>
      <div class="cv-hint">Presiona <kbd>→</kbd> para empezar</div></div><svg class="sv cv-s"></svg></div>`;
    sceneIn($(".cv-s", b), SISG.byId["que-es"], 5, null);
  }, { cover: true });

  /* 2 · ruta */
  add("m1", "La ruta del dato", "ruta aplicación fuente ETL estrella consultas", (b, ctx) => {
    const st = [["La aplicación", "sisg", "9 tablas", "Registra pacientes, estudios y campañas.", 5, "orange"], ["La fuente limpia", "sisg_fuente", `${Object.keys(fuCount).length} tablas`, "Catálogos, llaves y reglas.", 6, "blue"], ["El ETL", "sp_etl_completo", "4 pasos", "Extrae, transforma y carga.", 12, "yellow"], ["La estrella", "sisg_dw", "2 hechos · 7 dimensiones", "Pensada para analizar.", 9, "purple"], ["Las consultas", "06_consultas.sql", "8 consultas", "Preguntas del negocio.", 14, "green"]];
    b.innerHTML = `<div class="route">${st.map((s, i) => `<button type="button" class="rt" data-i="${i}" data-go="${s[4]}" style="--c:var(--c-${s[5]})"><span class="rt-n">${i + 1}</span><b>${s[0]}</b><code>${s[1]}</code><em>${s[2]}</em><small>${s[3]}</small></button>`).join('<span class="rt-ar" aria-hidden="true">→</span>')}</div>
      <div class="route-dot"><i></i></div><p class="route-note">Cada estación es una parte de la presentación. Haz clic en una para ir directo.</p>`;
    const dot = $(".route-dot i", b), cards = $$(".rt", b);
    ctx.builds(5, (i) => { cards.forEach((c, k) => c.classList.toggle("on", k <= i)); dot.style.width = ((i + 1) / 5) * 100 + "%"; });
    cards.forEach((c) => ctx.on(c, "click", () => DECK.show(+c.dataset.go)));
  });

  /* 3 · qué es SISG */
  add("m1", "Qué es SISG", "dos tipos de entidad interfaz api base mysql seguridad almacén", (b, ctx) => player(b, ctx, "que-es", 0, 5));

  /* 4 · dos bases */
  add("m1", "Dos bases con trabajos distintos", "aplicación oltp almacén dw registrar analizar mysql 3306 3307", (b, ctx) => {
    const fe = dwCount.fact_estudio;
    b.innerHTML = `<div class="two"><article class="tw" style="--c:var(--c-teal)"><span class="tw-t">Aplicación · OLTP</span><h2><code>sisg</code></h2><p>Registrar el día a día, rápido y sin repetir datos.</p>
      <ul><li><b data-n="9">0</b> tablas</li><li><b data-n="91">0</b> estudios de ejemplo</li><li><b data-n="65">0</b> pacientes de ejemplo</li></ul><small>La usa la API NestJS y la interfaz web · MySQL 8 · puerto 3306</small></article>
      <div class="tw-ar"><span>ETL</span>→</div>
      <article class="tw" style="--c:var(--c-purple)"><span class="tw-t">Almacén · DW</span><h2><code>sisg_dw</code></h2><p>Responder preguntas de negocio: cuánto, dónde, cuándo.</p>
      <ul><li><b data-n="${Object.keys(dwCount).length}">0</b> tablas (2 hechos, 7 dimensiones, resumen y bitácora del ETL)</li><li><b data-n="${fe}">0</b> estudios</li><li><b data-n="${dwCount.fact_campana}">0</b> campañas</li></ul><small>La usa el analista, con el rol de solo lectura · MySQL 8 · puerto 3307</small></article></div>
      <div class="why"><b>Por qué no una sola:</b> normalizada y estrella tienen formas distintas · el análisis pesado no debe competir con quien registra pacientes · el ETL necesita un origen y un destino.</div>`;
    $$("[data-n]", b).forEach((e, i) => ctx.timeout(() => countUp(e, +e.dataset.n, 900), i * 150));
  });

  /* 5 · ER app */
  add("m1", "La base de la aplicación: 9 tablas", "tablas app entidad usuario paciente estudio campana referido atencion bitacora enlace", (b, ctx) => erSlide(b, ctx, erApp, D.app, APP_NOTE, {}));

  /* 6 · ER fuente */
  add("m2", "La fuente limpia: catálogos y llaves", "sisg_fuente departamento municipio tipo_entidad entidad paciente tipo_estudio estudio area_campana campana bitacora", (b, ctx) => erSlide(b, ctx, erFuente, D.fuente, FU_NOTE, fuCount));

  /* 7 · reglas */
  add("m2", "Las reglas viven en la base", "triggers validación rechazo bitácora", (b, ctx) => player(b, ctx, "reglas", 0, 5));

  /* 8 · puente */
  add("m2", "El puente: de la app a la fuente", "puente csv staging mapeo sisg_stg", (b, ctx) => player(b, ctx, "puente", 0, 5));

  /* 9 · estrella */
  add("m3", "El modelo estrella", "estrella hechos dimensiones conformadas fact_estudio fact_campana", (b, ctx) => {
    b.innerHTML = `<div class="star"><div class="star-l"><div class="seg" role="tablist"><button type="button" data-m="fe" aria-selected="true">Estudios</button><button type="button" data-m="fc" aria-selected="false">Campañas</button><button type="button" id="tour" class="tour">▶ Recorrer</button></div><svg class="sv" role="img" aria-label="Modelo estrella"></svg>
      <p class="star-h">Haz clic en un bloque para ver su tabla real</p></div><aside class="star-r"></aside></div>`;
    let mode = "fe", sel = "fe", S, tour = null;
    const panel = $(".star-r", b), svg = $(".sv", b);
    const info = () => {
      const s = STAR[sel], d = D.dw[s.d], cols = d.cols, rows = d.rows.slice(0, sel === "tiempo" || sel === "geo" ? 6 : 7);
      const conf = CONF.has(sel) ? `<span class="badge ok">conformada</span>` : "";
      panel.innerHTML = `<header><span class="role">${s.role}</span>${conf}</header><h2>${s.t}</h2><div class="cnt"><b>${N(s.n)}</b> filas</div><p>${fmt(s.txt)}</p><div class="drawer-t">${X.table(cols, rows)}</div><small>Primeras ${rows.length} filas reales de ${s.t}.</small>`;
    };
    const build = () => { S = sceneIn(svg, starLesson(mode), 0, (id) => pick(id)); pick(sel, true); };
    const pick = (id, silent) => {
      if (!STAR[id]) return; sel = id;
      const L = S.lesson; L.steps[0].focus = [id]; if (mode === "fc" && CONF.has(id)) L.steps[0].focus = ["tiempo", "geo", "ent", "fc"].filter((x) => L.nodes[x]);
      SISG.applyStep(0, false, S); info();
    };
    $$(".seg button[data-m]", b).forEach((bt) => ctx.on(bt, "click", () => { mode = bt.dataset.m; $$(".seg button[data-m]", b).forEach((x) => x.setAttribute("aria-selected", x === bt)); sel = mode; build(); }));
    ctx.on($("#tour", b), "click", (e) => {
      if (tour) { clearInterval(tour); tour = null; e.currentTarget.textContent = "▶ Recorrer"; return; }
      e.currentTarget.textContent = "■ Detener";
      const order = () => (mode === "fe" ? ["fe", "tiempo", "geo", "ent", "paciente", "tipo", "edad"] : ["fc", "tiempo", "geo", "ent", "area"]);
      let k = 0; pick(order()[0]); tour = setInterval(() => { k = (k + 1) % order().length; pick(order()[k]); }, 2800); ctx.cleanup(() => clearInterval(tour));
    });
    build();
  });

  /* 10 · tablas del almacén (pestañas) */
  add("m3", "Las tablas del almacén, una por una", "dimensiones hechos filas reales dim_tiempo dim_geografia dim_entidad dim_paciente grupo etario tipo estudio area fact resumen", (b, ctx) => {
    const TABS = [
      ["dim_tiempo", "tiempo", "tiempo_key = yyyymmdd", "Una fila por día entre 2024 y 2027. Jerarquía día → mes → trimestre → año. Se genera con un procedimiento."],
      ["dim_geografia", "geografia", "geo_key", "Municipio → departamento en una sola tabla (desnormalizada). Fila -1 = desconocido."],
      ["dim_entidad", "entidad", "entidad_key", "Centros de diagnóstico y organismos no lucrativos."],
      ["dim_paciente", "paciente", "paciente_key", "Solo sexo. El almacén no guarda nombre ni DPI."],
      ["dim_grupo_etario", "grupo", "grupo_etario_key", "Cinco rangos más la fila -1 «Sin dato». La edad se calcula al día del estudio."],
      ["dim_tipo_estudio", "tipo", "tipo_estudio_key", "Tipo → categoría. Son 10 tipos."],
      ["dim_area_campana", "area", "area_key", "Cuatro áreas de campaña."],
      ["fact_estudio", "fe", "estudio_id", "Un estudio por fila. Las llaves apuntan a las dimensiones; las medidas son costo_q y duracion_min."],
      ["fact_campana", "fc", "campana_id", "Una campaña por fila. tiempo_inicio_key y tiempo_fin_key usan la misma dim_tiempo."],
      ["fact_estudio_mensual", "mensual", "(anio, mes, entidad, tipo)", "Tabla de sumarización: estudios, ingresos y duración promedio por mes, centro y tipo."],
    ];
    b.innerHTML = `<div class="tabs2" role="tablist">${TABS.map((t, i) => `<button type="button" role="tab" data-i="${i}" aria-selected="${i === 0}">${t[0]}</button>`).join("")}</div><div class="tabv"></div>`;
    const v = $(".tabv", b);
    const sh = (i) => {
      const [name, key, pk, note] = TABS[i], d = D.dw[key], isF = /^fact/.test(name);
      $$(".tabs2 button", b).forEach((x, k) => x.setAttribute("aria-selected", k === i));
      const rows = d.rows.slice(key === "geografia" ? 0 : 0, 9);
      v.innerHTML = `<div class="tv-h"><h2>${name}</h2><span class="badge">${isF ? "tabla de hechos" : "dimensión"}</span><span class="badge n">${N(dwCount[name] != null ? dwCount[name] : d.rows.length)} filas</span><code>${pk}</code></div><p>${esc(note)}</p><div class="drawer-t big">${X.table(d.cols, rows, { hl: [d.cols[0]] })}</div><small>Primeras ${rows.length} filas reales.</small>`;
    };
    $$(".tabs2 button", b).forEach((x) => ctx.on(x, "click", () => sh(+x.dataset.i)));
    ctx.builds(TABS.length, sh);
  });

  /* 11 · estudio descifrado */
  add("m3", "Un estudio, descifrado", "fila de hechos llaves dimensiones lookup medidas", (b, ctx) => {
    b.innerHTML = `<div class="dc"><div class="dc-top"><p>Una fila de <code>fact_estudio</code> solo guarda <b>llaves y medidas</b>. Cada llave apunta a la fila de una dimensión.</p><button type="button" class="btn">Otro estudio ↻</button></div><div class="dc-fact"></div><div class="dc-grid"></div></div>`;
    let n = 7;
    const draw = (f) => {
      const r = X.decode(f);
      $(".dc-fact", b).innerHTML = `<h3>fact_estudio · estudio ${f[0]}</h3>` + X.table(["tiempo_key", "entidad_key", "geo_key", "paciente_key", "tipo_estudio_key", "grupo_etario_key", "estado", "cantidad", "costo_q", "duracion_min"], [[f[1], f[2], f[3], f[4], f[5], f[6], "REALIZADO", 1, f[8], f[9]]], { hl: ["tiempo_key", "entidad_key", "geo_key", "paciente_key", "tipo_estudio_key", "grupo_etario_key"] });
      const days = { 0: "lunes", 1: "martes", 2: "miércoles", 3: "jueves", 4: "viernes", 5: "sábado", 6: "domingo" };
      const cards = [
        ["dim_tiempo", "tiempo_key", f[1], `${r.t[1]}`, `${r.t[7]} · ${r.t[5]} de ${r.t[2]} · trimestre ${r.t[3]}`, "var(--c-yellow)"],
        ["dim_entidad", "entidad_key", f[2], r.e ? r.e[2] : "—", r.e ? `${r.e[3]} · ${r.e[4]}` : "", "var(--c-blue)"],
        ["dim_geografia", "geo_key", f[3], r.g ? r.g[4] : "—", r.g ? `departamento de ${r.g[3]}` : "", "var(--c-green)"],
        ["dim_paciente", "paciente_key", f[4], `sexo ${r.p[2]}`, "sin nombre ni DPI", "var(--c-pink)"],
        ["dim_tipo_estudio", "tipo_estudio_key", f[5], r.tp[2], `categoría ${r.tp[3]}`, "var(--c-orange)"],
        ["dim_grupo_etario", "grupo_etario_key", f[6], r.gr[1], r.gr[1] === "Sin dato" ? "falta la fecha de nacimiento" : "edad al día del estudio", "var(--c-purple)"],
      ];
      $(".dc-grid", b).innerHTML = cards.map((c, i) => `<article class="dcc" style="--c:${c[5]};animation-delay:${i * 90}ms"><span>${c[0]}</span><div><code>${c[1]} = ${c[2]}</code><b>→ ${esc(c[3])}</b><small>${esc(c[4])}</small></div></article>`).join("");
    };
    const other = () => { n = Math.floor(Math.random() * 11000) + 1; draw(X.sampleFact(n)); };
    ctx.on($(".btn", b), "click", other); draw(X.sampleFact(n));
    ctx.timer(() => { /* cambia solo cada 7 s para que se vea vivo */ other(); }, 7000);
  });

  /* 12 · ETL de un estudio */
  add("m3", "El viaje de un estudio por el ETL", "etl extraer transformar cargar fila fuente hecho tiempo_key grupo etario resumen", (b, ctx) => {
    b.innerHTML = `<div class="etl"><div class="etl-top"><div class="etl-steps"></div><button type="button" class="btn">Otro estudio ↻</button></div><div class="etl-body"><section class="etl-src"><h3>sisg_fuente</h3><div class="kv"></div></section><section class="etl-map"></section><section class="etl-dst"><h3>sisg_dw</h3><div class="kv"></div></section></div></div>`;
    const STEPS = [["1", "Calendario", "sp_cargar_dim_tiempo"], ["2", "Dimensiones", "sp_etl_dimensiones"], ["3", "Hechos", "sp_etl_facts"], ["4", "Resumen", "sp_etl_resumen"]];
    $(".etl-steps", b).innerHTML = STEPS.map((s, i) => `<span class="es" data-i="${i}"><i>${s[0]}</i><b>${s[1]}</b><code>${s[2]}</code></span>`).join('<em>→</em>');
    let demo = D.demo[3], at = 0;
    const age = (nac, fecha) => { const a = new Date(nac), f = new Date(fecha); let y = f.getFullYear() - a.getFullYear(); if (f.getMonth() < a.getMonth() || (f.getMonth() === a.getMonth() && f.getDate() < a.getDate())) y--; return y; };
    const draw = (k) => {
      at = k; const [id, entId, pacId, tipoId, fecha, estado, dur, costo] = demo.est, f = demo.fact, [nac, sexo, mun] = demo.pac, r = X.decode(f), edad = age(nac, fecha);
      const men = D.dw.mensual.rows.find((m) => m[0] === r.t[2] && m[1] === r.t[4] && m[2] === f[2] && m[3] === f[5]);
      const maps = [
        [["fecha", fecha, "tiempo_key", f[1], `existe en dim_tiempo: ${r.t[7]}, ${r.t[5]}, trimestre ${r.t[3]}`]],
        [["entidad_id", entId, "entidad_key", f[2], r.e ? r.e[2] : ""], ["paciente_id", pacId, "paciente_key", f[4], `sexo ${sexo} · sin nombre ni DPI`], ["municipio_id", mun, "geo_key", f[3], r.g ? `${r.g[4]}, ${r.g[3]}` : ""], ["tipo_estudio_id", tipoId, "tipo_estudio_key", f[5], r.tp[2]]],
        [["fecha_nacimiento", nac, "grupo_etario_key", f[6], `edad al día del estudio: ${edad} años → ${r.gr[1]}`], ["costo_q", costo, "costo_q", f[9], "se copia"], ["duracion_min", dur, "duracion_min", f[10], "se copia"], ["estado", estado, "estado", f[7], `cantidad = ${f[8]}`]],
        [["(mes, centro, tipo)", `${r.t[2]}-${String(r.t[4]).padStart(2, "0")} · ${f[2]} · ${f[5]}`, "fact_estudio_mensual", men ? `${men[4]} estudios · ${Q(men[5])}` : "—", "este estudio suma a ese total"]],
      ];
      $$(".es", b).forEach((e, i) => { e.classList.toggle("on", i === k); e.classList.toggle("done", i < k); });
      $(".etl-src .kv", b).innerHTML = [["estudio.id", id], ["estudio.fecha", fecha], ["estudio.entidad_id", entId], ["estudio.paciente_id", pacId], ["estudio.tipo_estudio_id", tipoId], ["estudio.estado", estado], ["estudio.duracion_min", dur], ["estudio.costo_q", costo], ["paciente.fecha_nacimiento", nac], ["paciente.municipio_id", mun]].map(([a, v]) => `<div class="kvr"><span>${a}</span><b>${esc(v)}</b></div>`).join("");
      const rows = maps.slice(0, k + 1).flat();
      $(".etl-map", b).innerHTML = `<div class="mp-h">${STEPS[k][1]}</div>` + maps[k].map((m, i) => `<div class="mp" style="animation-delay:${i * 90}ms"><span>${m[0]} <b>${esc(m[1])}</b></span><i>→</i><span><b>${m[2]}</b> = ${esc(m[3])}</span><small>${esc(m[4])}</small></div>`).join("");
      $(".etl-dst .kv", b).innerHTML = maps.slice(0, k + 1).flat().map((m) => `<div class="kvr on"><span>${m[2]}</span><b>${esc(m[3])}</b></div>`).join("") || "";
    };
    ctx.on($(".btn", b), "click", () => { demo = D.demo[Math.floor(Math.random() * D.demo.length)]; draw(at); });
    ctx.builds(4, draw);
  });

  /* 13 · ETL procedimientos */
  add("m3", "El ETL: cuatro procedimientos y un control", "etl procedimientos sp_etl_completo etl_log reconciliación recarga completa", (b, ctx) => {
    const lg = D.dw.etl_log;
    player(b, ctx, "etl", 0, 6, { extra: (k) => (k >= 5 ? `<div class="mini"><b>etl_log real</b>${X.table(["inicio", "filas_estudio", "filas_campana", "filas_resumen", "resultado"], lg.rows.map((r) => [r[1], r[3], r[4], r[5], r[6]]))}</div>` : "") });
  });

  /* 14 · consultas en vivo */
  add("m3", "Las 8 consultas, calculadas en vivo", "consultas sql rank lag sum over resultados reales", (b, ctx) => {
    b.innerHTML = `<div class="qx"><nav class="qx-l"></nav><section class="qx-r"></section></div>`;
    const nav = $(".qx-l", b), main = $(".qx-r", b); let cur = 0, val = {};
    nav.innerHTML = X.queries.map((q, i) => `<button type="button" data-i="${i}"><i>${q.n}</i><span>${esc(q.short)}</span></button>`).join("");
    const run = (i) => {
      cur = i; const q = X.queries[i]; $$("button", nav).forEach((x, k) => x.setAttribute("aria-current", k === i ? "true" : "false"));
      let ctl = ""; if (q.ctl) { const o = q.ctl.options(); if (val[i] == null) val[i] = q.ctl.def(); ctl = `<label class="ctl">${q.ctl.label}<select>${o.map((x) => `<option ${x === val[i] ? "selected" : ""}>${esc(x)}</option>`).join("")}</select></label>`; }
      const t0 = performance.now(), res = q.run(val[i]), ms = performance.now() - t0;
      const ch = res.chart ? (res.chart.kind === "v" ? X.vbars(res.chart.items) : X.hbars(res.chart.items.slice(0, 8))) : "";
      main.innerHTML = `<header><h2>Consulta ${q.n}</h2><span class="badge">${esc(q.tech)}</span>${ctl}</header><p class="qq">${esc(q.q)}</p>
        <div class="qx-grid"><pre class="sql">${esc(q.sql)}</pre><div class="qx-res"><div class="qx-t">${X.table(res.cols, res.rows.slice(0, 7))}</div><small>${N(res.total)} filas en el resultado${res.rows.length > 7 ? " (se muestran 7)" : ""} · se leyeron ${N(q.scanned)} filas del almacén</small>
        ${res.check ? `<div class="chk ${res.check.same ? "ok" : "bad"}">${res.check.same ? "✓ Mismo resultado que la consulta 1 (" + N(res.check.rows) + " filas), leyendo solo " + N(q.scanned) + " filas" : "✕ Difiere de la consulta 1"}</div>` : ""}</div></div>
        <div class="qx-ch">${res.chart ? `<h4>${esc(res.chart.title)}</h4>` : ""}${ch}</div><footer>${q.dims.map((d) => `<code>${d}</code>`).join("")}<span>calculado en tu navegador en ${ms.toFixed(1)} ms</span></footer>`;
      const sel = $("select", main); if (sel) sel.onchange = () => { val[i] = sel.value; run(i); };
    };
    $$("button", nav).forEach((x) => ctx.on(x, "click", () => run(+x.dataset.i)));
    run(0);
  });

  /* 15 · normalizada vs estrella */
  add("m3", "Normalizada o estrella: la misma pregunta", "uniones joins 4 contra 2 normalizada estrella ventana cruce conformada", (b, ctx) => player(b, ctx, "consultas", 0, 4));

  /* 16 · velocidad */
  add("m3", "La tabla resumen: unas 7 veces más rápida", "velocidad consulta 1 consulta 8 1.6 ms 11 ms explain sumarización", (b, ctx) => {
    b.innerHTML = `<div class="race"><div class="rc-top"><p>Misma pregunta (consultas 1 y 8). Una lee el hecho; la otra, la tabla resumen. Tiempos medidos en MySQL: promedio de 50 ejecuciones, repetido 3 veces. Aquí la carrera va en cámara lenta.</p><button type="button" class="btn">Correr de nuevo ↻</button></div>
      <div class="lane" data-k="a"><div class="ln-h"><b>Consulta 1</b><code>fact_estudio</code><span>hecho + 2 dimensiones: 2 uniones</span></div><div class="ln-b"><i></i></div><div class="ln-f"><b data-r>0</b> filas leídas · <b data-t>0</b> ms</div></div>
      <div class="lane" data-k="b"><div class="ln-h"><b>Consulta 8</b><code>fact_estudio_mensual</code><span>resumen por mes, centro y tipo: 1 unión</span></div><div class="ln-b"><i></i></div><div class="ln-f"><b data-r>0</b> filas leídas · <b data-t>0</b> ms</div></div>
      <div class="verd"><span>≈ 7×</span> más rápida · pierde la geografía a propósito</div></div>`;
    const lanes = { a: { rows: X.counts.fe, ms: 11, t: 11 }, b: { rows: X.counts.men, ms: 1.6, t: 1.6 } }, SLOW = 140;
    const go = () => {
      $(".verd", b).classList.remove("on");
      for (const k of ["a", "b"]) {
        const L = lanes[k], ln = $(`.lane[data-k="${k}"]`, b), bar = $("i", ln), r = $("[data-r]", ln), t = $("[data-t]", ln); const dur = REDUCED ? 1 : L.ms * SLOW, t0 = performance.now();
        (function tick(now) { if (!ln.isConnected) return; const p = Math.min(1, (now - t0) / dur); bar.style.width = p * 100 + "%"; r.textContent = N(Math.round(L.rows * p)); t.textContent = (L.t * p).toFixed(1); if (p < 1) requestAnimationFrame(tick); else if (k === "a") $(".verd", b).classList.add("on"); })(t0);
      }
    };
    ctx.on($(".btn", b), "click", go); ctx.timeout(go, 500);
  });

  /* 17 · privacidad */
  add("m3", "Privacidad: qué se guarda y qué no", "privacidad dim_paciente sexo grupo edad rol analista select límites", (b, ctx) => player(b, ctx, "privacidad", 0, 5));

  /* 18 · límites */
  add("m4", "Límites y decisiones, dichos con honestidad", "límites decisiones datos sintéticos costo de lista scd tipo 1 recarga completa mysql sql server", (b, ctx) => {
    const cards = [["Datos sintéticos", "Los resultados no significan nada real. Se evalúa el diseño, el ETL y las consultas.", "var(--c-yellow)"], ["Costo y duración de lista", "Con datos de la app, el puente usa el precio y la duración de lista del catálogo. No son montos cobrados.", "var(--c-orange)"], ["SCD tipo 1", "Si cambia un nombre, se sobrescribe. No se guarda historia; para eso haría falta tipo 2.", "var(--c-blue)"], ["Recarga completa", "El ETL vacía y vuelve a cargar. Con más volumen, carga incremental con marca de agua en etl_log.", "var(--c-green)"], ["Estrella, no copo", "Jerarquías de 2 niveles y dimensiones chicas: normalizarlas no ahorra nada y añade uniones.", "var(--c-purple)"], ["MySQL, no SQL Server", "Decisión del grupo el 24 de octubre. El README del almacén trae las equivalencias.", "var(--c-pink)"]];
    b.innerHTML = `<div class="cards6">${cards.map((c, i) => `<article class="c6" style="--c:${c[2]}" data-i="${i}"><h3>${c[0]}</h3><p>${c[1]}</p></article>`).join("")}</div>`;
    const els = $$(".c6", b); ctx.builds(7, (i) => els.forEach((e, k) => e.classList.toggle("on", k < i || (i === 6))));
  });

  /* 19 · preguntas */
  add("m4", "Preguntas probables", "preguntas respuestas trampa desnormalizar estrella grano scd etl reconciliación", (b, ctx) => {
    const qs = C.practica; let cur = 0;
    b.innerHTML = `<div class="qa"><nav>${qs.map((q, i) => `<button type="button" data-i="${i}"><span>${esc(q.t)}</span>${fmt(q.q)}</button>`).join("")}</nav><article class="qa-a"></article></div>`;
    const a = $(".qa-a", b);
    const sh = (i) => { cur = i; $$(".qa nav button", b).forEach((x, k) => x.setAttribute("aria-current", k === i ? "true" : "false")); a.innerHTML = `<span class="tag IDEA">${esc(qs[i].t)}</span><h2>${fmt(qs[i].q)}</h2><p>${fmt(qs[i].a)}</p>`; };
    $$(".qa nav button", b).forEach((x) => ctx.on(x, "click", () => sh(+x.dataset.i))); sh(0);
    ctx.onKey("ArrowDown", () => sh(Math.min(qs.length - 1, cur + 1))); ctx.onKey("ArrowUp", () => sh(Math.max(0, cur - 1)));
  });

  /* 20 · cierre */
  add("m4", "En resumen", "resumen cierre gracias preguntas", (b, ctx) => {
    const big = [[dwCount.fact_estudio, "estudios en el almacén"], [dwCount.fact_estudio_mensual, "filas en la tabla resumen"], [7, "dimensiones"], [8, "consultas"], [7, "veces más rápida la consulta 8"]];
    b.innerHTML = `<div class="end"><div class="big">${big.map((x, i) => `<div class="bg" style="--c:var(--c-${["yellow", "purple", "green", "blue", "orange"][i]})"><b data-n="${x[0]}">0</b><span>${x[1]}</span></div>`).join("")}</div>
      <ol class="sum"><li><b>La app registra</b>: 9 tablas, con texto libre en algunos campos.</li><li><b>La fuente ordena</b>: catálogos, llaves y triggers.</li><li><b>El ETL carga</b> el almacén y se comprueba con diferencia 0.</li><li><b>La estrella responde</b> con menos uniones, y el resumen aún más rápido.</li></ol><div class="thx">Gracias · ¿Preguntas?</div></div>`;
    $$("[data-n]", b).forEach((e, i) => ctx.timeout(() => countUp(e, +e.dataset.n, 1000), i * 140));
  });

  window.SLIDE_INDEX = SLIDES.map((s) => ({ title: s.title, text: s.text }));

  /* =====================================================================
     LA PRESENTACIÓN
     ===================================================================== */
  const DECK = (window.DECK = {});
  const root = () => $("#deck");
  let idx = -1, ctxNow = null, build = { max: 0, i: 0, fn: null }, keys = {}, ready = false;

  function makeCtx(back) {
    const items = [];
    const c = {
      back,
      timer(fn, ms) { const t = setInterval(fn, ms); items.push(() => clearInterval(t)); return t; },
      timeout(fn, ms) { const t = setTimeout(fn, ms); items.push(() => clearTimeout(t)); return t; },
      on(el, ev, fn) { el.addEventListener(ev, fn); items.push(() => el.removeEventListener(ev, fn)); },
      onKey(k, fn) { keys[k] = fn; },
      cleanup(fn) { items.push(fn); },
      builds(n, fn) { build = { max: n, i: back ? n - 1 : 0, fn }; dots(); fn(build.i); },
      dispose() { items.forEach((f) => f()); items.length = 0; keys = {}; build = { max: 0, i: 0, fn: null }; },
    };
    return c;
  }
  function dots() { const d = $(".sl-dots", root()); if (!d) return; d.innerHTML = build.max > 1 ? Array.from({ length: build.max }, (_, k) => `<i class="${k <= build.i ? "on" : ""}"></i>`).join("") : ""; }

  function fit() {
    const v = $(".dk-view", root()), s = $("#dk-slide"); if (!v || !s) return;
    const k = Math.min(v.clientWidth / 1280, v.clientHeight / 720);
    s.style.transform = `translate(-50%, -50%) scale(${k})`;
  }

  function mount(i, back) {
    if (ctxNow) ctxNow.dispose();
    const S = SLIDES[i], host = $("#dk-slide"), k = KICK[S.kick] || KICK.m1;
    host.className = "dk-slide" + (S.cover ? " is-cover" : "");
    host.innerHTML = (S.cover ? "" : `<div class="sl-head"><span class="kick" style="--c:var(--c-${k[1]})">${String(i + 1).padStart(2, "0")} · ${k[0]}</span><h1>${esc(S.title)}</h1></div>`) + `<div class="sl-body"></div><div class="sl-dots"></div>`;
    ctxNow = makeCtx(back);
    S.render($(".sl-body", host), ctxNow);
    dots();
  }

  DECK.show = function (n) {
    const el = root(); if (!el) return;
    n = Math.max(1, Math.min(SLIDES.length, n)) - 1;
    el.hidden = false; fit();
    const back = n < idx;
    if (n !== idx) { const prev = idx; idx = n; mount(n, back && prev - n === 1); }
    $(".dk-count", el).textContent = `${String(n + 1).padStart(2, "0")} / ${SLIDES.length}`;
    $(".dk-name", el).textContent = SLIDES[n].title;
    $(".dk-bar i", el).style.width = ((n + 1) / SLIDES.length) * 100 + "%";
    $$("#dk-index button", el).forEach((b, k) => b.setAttribute("aria-current", k === n ? "true" : "false"));
    const h = `#/p/${n + 1}`; if (location.hash !== h) history.replaceState(null, "", h);
  };
  DECK.hide = function () { const el = root(); if (el && !el.hidden) { el.hidden = true; if (ctxNow) { ctxNow.dispose(); ctxNow = null; } idx = -1; } };

  const go = (n) => { location.hash = `#/p/${Math.max(1, Math.min(SLIDES.length, n))}`; };
  function next() { if (build.max > 1 && build.i < build.max - 1) { build.i++; build.fn(build.i); dots(); } else if (idx < SLIDES.length - 1) go(idx + 2); }
  function prev() { if (build.max > 1 && build.i > 0) { build.i--; build.fn(build.i); dots(); } else if (idx > 0) go(idx); }

  function init() {
    if (ready) return; ready = true;
    const el = root();
    el.innerHTML = `<div class="dk-top"><span class="dk-count"></span><span class="dk-name"></span><span class="grow"></span>
      <button type="button" id="dk-prev" title="Anterior (←)" aria-label="Anterior">←</button><button type="button" id="dk-next" title="Siguiente (→)" aria-label="Siguiente">→</button>
      <button type="button" id="dk-idx" title="Índice (I)">Índice</button><button type="button" id="dk-full" title="Pantalla completa (F)">Pantalla completa</button></div>
      <div class="dk-view"><div class="dk-slide" id="dk-slide"></div></div><div class="dk-bar"><i></i></div>
      <aside id="dk-index" hidden><h3>Diapositivas</h3>${SLIDES.map((s, i) => `<button type="button" data-i="${i}"><i>${String(i + 1).padStart(2, "0")}</i>${esc(s.title)}</button>`).join("")}</aside>`;
    $("#dk-prev", el).onclick = prev; $("#dk-next", el).onclick = next;
    $("#dk-idx", el).onclick = () => ($("#dk-index", el).hidden = !$("#dk-index", el).hidden);
    $$("#dk-index button", el).forEach((b) => (b.onclick = () => { $("#dk-index", el).hidden = true; go(+b.dataset.i + 1); }));
    $("#dk-full", el).onclick = toggleFull;
    addEventListener("resize", fit);
    new ResizeObserver(fit).observe($(".dk-view", el));
    document.addEventListener("fullscreenchange", () => { document.body.classList.toggle("dk-full", !!document.fullscreenElement); setTimeout(fit, 60); });
    addEventListener("keydown", (e) => {
      if (root().hidden || e.metaKey || e.ctrlKey || e.altKey) return;
      if ($("#sw").classList.contains("on")) return;
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement || e.target instanceof HTMLTextAreaElement) return;
      if (keys[e.key]) { keys[e.key](e); if (e.key === "Escape" && !$("#dk-index").hidden) $("#dk-index").hidden = true; return; }
      if (e.key === "ArrowRight" || e.key === "PageDown" || (e.key === " " && !(e.target instanceof HTMLButtonElement))) { e.preventDefault(); next(); }
      else if (e.key === "ArrowLeft" || e.key === "PageUp") { e.preventDefault(); prev(); }
      else if (e.key === "Home") go(1); else if (e.key === "End") go(SLIDES.length);
      else if (e.key === "f" || e.key === "F") toggleFull();
      else if (e.key === "i" || e.key === "I") $("#dk-idx").click();
      else if (e.key === "Escape" && !$("#dk-index").hidden) $("#dk-index").hidden = true;
    });
  }
  function toggleFull() { if (document.fullscreenElement) document.exitFullscreen(); else document.documentElement.requestFullscreen && document.documentElement.requestFullscreen().catch(() => {}); }
  const show0 = DECK.show; DECK.show = function (n) { init(); show0(n); };
})();
