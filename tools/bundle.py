#!/usr/bin/env python3
"""Junta index.html, el CSS, los scripts y los datos en UN solo archivo: SISG-DB.html

Sirve para abrir la presentación con doble clic aunque el navegador no pueda leer los archivos
de css/, js/ y data/ (macOS suele bloquearlos cuando solo se abrió index.html).
Uso:  python3 tools/bundle.py
"""
import os, re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
read = lambda p: open(os.path.join(ROOT, p), encoding="utf8").read()

html = read("index.html")
# estilos
html = re.sub(r'<link rel="stylesheet" href="css/style\.css">', lambda m: "<style>\n" + read("css/style.css") + "\n</style>", html)
# scripts locales: se pegan dentro de la página (se evita que un "</script" interno cierre la etiqueta)
def inline(m):
    code = read(m.group(1)).replace("</script", "<\\/script")
    return "<script>\n" + code + "\n</script>"
html = re.sub(r'<script src="((?:js|data)/[^"]+)"></script>', inline, html)

left = re.findall(r'(?:src|href)="((?:css|js|data)/[^"]+)"', html)
assert not left, f"quedaron referencias locales: {left}"
out = os.path.join(ROOT, "SISG-DB.html")
open(out, "w", encoding="utf8").write(html)
print(f"{out}: {len(html):,} bytes, sin archivos externos (solo la tipografía de Google Fonts)")
