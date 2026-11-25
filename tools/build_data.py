#!/usr/bin/env python3
"""Regenera data/dw.js a partir de los volcados SQL de SISG (entrega_sql/).

Uso:  python3 tools/build_data.py [carpeta_entrega_sql]
Por defecto busca ../SISG/entrega_sql. Solo usa la biblioteca estándar.

Los nombres de pacientes y los DPI se enmascaran aquí, antes de escribir el archivo:
la página nunca recibe datos personales, ni siquiera de ejemplo.
"""
import collections, json, os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = sys.argv[1] if len(sys.argv) > 1 else os.path.join(ROOT, "..", "SISG", "entrega_sql")
OUT = os.path.join(ROOT, "data", "dw.js")


def parse_values(s):
    """Convierte "(1,'a'),(2,NULL)" en [[1,'a'],[2,None]]."""
    rows, i, n = [], 0, len(s)
    while i < n:
        if s[i] != "(":
            i += 1
            continue
        i += 1
        row = []
        while True:
            if s[i] == "'":
                i += 1
                buf = []
                while True:
                    ch = s[i]
                    if ch == "\\":
                        buf.append({"n": "\n", "r": "\r", "0": "\0"}.get(s[i + 1], s[i + 1])); i += 2
                    elif ch == "'":
                        if s[i + 1:i + 2] == "'": buf.append("'"); i += 2
                        else: i += 1; break
                    else:
                        buf.append(ch); i += 1
                row.append("".join(buf))
            else:
                j = i
                while s[j] not in ",)": j += 1
                tok = s[i:j].strip(); i = j
                if tok == "NULL": row.append(None)
                else:
                    try: row.append(int(tok))
                    except ValueError: row.append(float(tok))
            if s[i] == ",": i += 1; continue
            if s[i] == ")": i += 1; break
        rows.append(row)
    return rows


class Dump:
    def __init__(self, text): self.text = text
    def rows(self, name):
        out = []
        for m in re.finditer(r"INSERT INTO `%s` VALUES (.*?);\n" % name, self.text, re.S): out += parse_values(m.group(1))
        return out
    def cols(self, name):
        m = re.search(r"CREATE TABLE `%s` \((.*?)\n\) ENGINE" % name, self.text, re.S)
        return [re.match(r"\s*`(\w+)`", l).group(1) for l in m.group(1).split("\n") if re.match(r"\s*`\w+`", l)]


def read(name): return open(os.path.join(SRC, name), encoding="utf8").read()


app = Dump(read("1_sisg_aplicacion.sql"))
both = read("2_sisg_almacen_datos.sql")
cut = both.index("USE `sisg_dw`;")
fu, dw = Dump(both[both.index("USE `sisg_fuente`;"):cut]), Dump(both[cut:])

mask_name = lambda n: " ".join(p[0] + "." for p in re.split(r"\s+", n or "")[:3] if p) + " ···"
mask_digits = lambda s: "••••••••" if s else None


def pick(d, t, names, limit=None):
    c, r = d.cols(t), d.rows(t)
    ix = [c.index(n) for n in names]
    rows = [[x[i] for i in ix] for x in r]
    return {"cols": names, "rows": rows[:limit] if limit else rows, "n": len(r)}


def sample(t, names, limit, mask=None):
    c, rr = fu.cols(t), fu.rows(t)
    ix, rows = [c.index(n) for n in names], []
    for x in rr[:limit]:
        r = [x[i] for i in ix]
        for k, fn in (mask or {}).items():
            if k in names: r[names.index(k)] = fn(r[names.index(k)])
        rows.append(r)
    return {"cols": names, "rows": rows, "n": len(rr)}


APP = {  # solo columnas seguras: sin hashes, secretos, nombres ni DPI
    "entidad": pick(app, "entidad", ["id", "nombre", "tipo", "departamento"]),
    "usuario": pick(app, "usuario", ["id", "entidadId", "rol", "mfaActivo", "activo"]),
    "paciente": pick(app, "paciente", ["id", "entidadId", "sexo", "departamento", "municipio"], 12),
    "estudio": pick(app, "estudio", ["id", "entidadId", "pacienteId", "tipoEstudio", "fecha", "estado", "monto"], 12),
    "campana": pick(app, "campana", ["id", "entidadId", "nombre", "area", "departamento", "fechaInicio", "estado", "personasAtendidas", "costo"], 8),
    "referido": pick(app, "referido", ["id", "entidadOrigenId", "entidadDestinoId", "tipoEstudio", "estado"], 6),
    "atencion": pick(app, "atencion", ["id", "campanaId", "pacienteId", "atendidoEn"], 6),
    "bitacora": pick(app, "bitacora", ["id", "entidadId", "tabla", "accion", "creadoEn"], 6),
    "enlace_resultado": pick(app, "enlace_resultado", ["id", "estudioId", "expiraEn", "accesos"], 6),
}
FUENTE = {
    "departamento": sample("departamento", ["id", "nombre"], 22),
    "municipio": sample("municipio", ["id", "departamento_id", "nombre"], 8),
    "tipo_entidad": sample("tipo_entidad", ["id", "nombre"], 5),
    "entidad": sample("entidad", ["id", "nombre", "tipo_entidad_id", "departamento_id"], 14),
    "paciente": sample("paciente", ["id", "entidad_id", "nombre_completo", "dpi", "fecha_nacimiento", "sexo", "municipio_id"], 8, {"nombre_completo": mask_name, "dpi": mask_digits}),
    "tipo_estudio": sample("tipo_estudio", ["id", "nombre", "categoria", "precio_base_q", "duracion_base"], 10),
    "estudio": sample("estudio", ["id", "entidad_id", "paciente_id", "tipo_estudio_id", "fecha", "estado", "duracion_min", "costo_q"], 10),
    "area_campana": sample("area_campana", ["id", "nombre"], 4),
    "campana": sample("campana", ["id", "entidad_id", "area_id", "nombre", "fecha_inicio", "fecha_fin", "estado", "personas_atendidas", "presupuesto_q"], 8),
}
W = {t: dw.rows(t) for t in ["dim_tiempo", "dim_geografia", "dim_entidad", "dim_paciente", "dim_grupo_etario", "dim_tipo_estudio", "dim_area_campana", "fact_estudio", "fact_campana", "fact_estudio_mensual", "etl_log"]}
Wc = {t: dw.cols(t) for t in W}
ST = {"REALIZADO": 0, "PROGRAMADO": 1, "CANCELADO": 2}
ix = Wc["fact_estudio"].index
fe = [[r[0], r[1], r[2], r[3], r[4], r[5], r[6], ST[r[7]], r[ix("costo_q")], r[ix("duracion_min")]] for r in W["fact_estudio"]]
DW = {
    "tiempo": {"cols": Wc["dim_tiempo"], "rows": W["dim_tiempo"]}, "geografia": {"cols": Wc["dim_geografia"], "rows": W["dim_geografia"]},
    "entidad": {"cols": Wc["dim_entidad"], "rows": W["dim_entidad"]}, "paciente": {"cols": Wc["dim_paciente"], "rows": [[r[0], r[1], r[2]] for r in W["dim_paciente"]]},
    "grupo": {"cols": Wc["dim_grupo_etario"], "rows": W["dim_grupo_etario"]}, "tipo": {"cols": Wc["dim_tipo_estudio"], "rows": W["dim_tipo_estudio"]},
    "area": {"cols": Wc["dim_area_campana"], "rows": W["dim_area_campana"]},
    "fe": {"cols": ["estudio_id", "tiempo_key", "entidad_key", "geo_key", "paciente_key", "tipo_estudio_key", "grupo_etario_key", "estado", "costo_q", "duracion_min"], "rows": fe},
    "fc": {"cols": Wc["fact_campana"], "rows": W["fact_campana"]}, "mensual": {"cols": Wc["fact_estudio_mensual"], "rows": W["fact_estudio_mensual"]},
    "etl_log": {"cols": Wc["etl_log"], "rows": W["etl_log"]},
}
# estudios de la fuente (con paciente y hecho) para la animación del ETL
pc, ec = fu.cols("paciente"), fu.cols("estudio")
pac = {r[0]: {"nac": r[pc.index("fecha_nacimiento")], "sexo": r[pc.index("sexo")], "mun": r[pc.index("municipio_id")]} for r in fu.rows("paciente")}
fe_by = {r[0]: r for r in W["fact_estudio"]}
demo = []
for r in fu.rows("estudio"):
    if len(demo) >= 30: break
    d = dict(zip(ec, r)); f = fe_by.get(d["id"]); p = pac.get(d["paciente_id"])
    if f and p and d["estado"] == "REALIZADO":
        demo.append({"est": [d["id"], d["entidad_id"], d["paciente_id"], d["tipo_estudio_id"], d["fecha"], d["estado"], d["duracion_min"], d["costo_q"]], "pac": [p["nac"], p["sexo"], p["mun"]], "fact": list(f)})
counts = {"fuente": {t: len(fu.rows(t)) for t in ["departamento", "municipio", "tipo_entidad", "tipo_estudio", "area_campana", "entidad", "paciente", "estudio", "campana", "bitacora"]}, "dw": {k: len(v) for k, v in W.items()}}

s = json.dumps({"app": APP, "fuente": FUENTE, "dw": DW, "demo": demo, "counts": counts}, ensure_ascii=False, separators=(",", ":"))
os.makedirs(os.path.dirname(OUT), exist_ok=True)
open(OUT, "w", encoding="utf8").write("/* Datos reales (sintéticos) extraídos de entrega_sql/. Nombres y DPI enmascarados. */\nwindow.DW = " + s + ";\n")
print(f"{OUT}: {len(s):,} bytes · {counts['dw']['fact_estudio']:,} estudios · {counts['dw']['fact_campana']} campañas")
