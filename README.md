# SISG-DB · Presentación de la base de datos

Una presentación interactiva, de pantalla completa, de la base de datos de SISG: la aplicación, la fuente limpia, el modelo estrella, el ETL y las consultas. Muestra **las tablas reales con sus filas**, la estrella con cada dimensión, y calcula las consultas en el navegador con los datos del proyecto. Es una página estática: no necesita servidor ni base de datos.

Todo sale de la carpeta `SISG` (`docs/`, `dw/` y `entrega_sql/`). Los datos son sintéticos. El diseño está inspirado en [System Design](https://designed-to-scale.vercel.app/).

## Cómo verla

**Lo más simple: abrir `SISG-DB.html` con doble clic.** Es un solo archivo con todo adentro (estilos, scripts y datos), así que funciona aunque el navegador no pueda leer otros archivos de la carpeta. Se regenera con `python3 tools/bundle.py` después de cambiar algo.

> Si `index.html` se ve sin estilos (un ícono gigante y texto suelto), es porque el navegador no pudo leer `css/`, `js/` y `data/` (macOS lo bloquea a veces en `Documents`). Usa `SISG-DB.html` o el servidor de abajo.

Abrir `index.html` con doble clic. Para que funcione igual que en un servidor:

```sh
cd SISG-DB
python3 -m http.server 8080      # y abrir http://localhost:8080
```

Necesita internet solo para la tipografía (JetBrains Mono, de Google Fonts). Sin internet usa una monoespaciada del sistema.

## Cómo se maneja

| Tecla | Qué hace |
|---|---|
| `→` o `Espacio` | Avanza. Primero los pasos internos de la diapositiva, luego la siguiente. |
| `←` | Retrocede. |
| `F` | Pantalla completa. |
| `I` | Índice de diapositivas. |
| `Ctrl+K` / `⌘K` | Buscar. |
| `Home` / `End` | Primera y última diapositiva. |

Hay un modo **Lecciones** (pestaña de arriba): las mismas explicaciones en formato curso, paso a paso, con progreso guardado.

## Las 20 diapositivas

| # | Diapositiva | Qué tiene de dinámico |
|---|---|---|
| 1 | Portada | |
| 2 | La ruta del dato | Las 5 estaciones se encienden en orden; cada una lleva a su parte. |
| 3 | Qué es SISG | Diagrama animado en 6 pasos. |
| 4 | Dos bases con trabajos distintos | Contadores con los números reales. |
| 5 | La base de la aplicación: 9 tablas | ER con todas las columnas. **Clic en una tabla** para ver sus filas reales. |
| 6 | La fuente limpia: catálogos y llaves | ER de las 10 tablas con sus llaves. Clic para ver filas. |
| 7 | Las reglas viven en la base | Triggers: dos rechazos, un caso válido y la bitácora. |
| 8 | El puente: de la app a la fuente | CSV, staging y las 6 reglas del mapeo. |
| 9 | El modelo estrella | Estrella de estudios y de campañas. **Clic en cada dimensión** para ver su tabla real. Botón «Recorrer». |
| 10 | Las tablas del almacén, una por una | Pestañas con las 10 tablas del almacén y sus filas. |
| 11 | Un estudio, descifrado | Una fila de hechos y las 6 dimensiones a las que apunta. **Otro estudio** al azar. |
| 12 | El viaje de un estudio por el ETL | Un estudio real recorre los 4 pasos y se vuelve fila de hechos. |
| 13 | El ETL: cuatro procedimientos y un control | Procedimientos, reconciliación y el `etl_log` real. |
| 14 | Las 8 consultas, calculadas en vivo | Cada consulta se calcula en el navegador sobre los 12,507 estudios. Filtros por departamento, centro y categoría. La consulta 8 se compara con la 1. |
| 15 | Normalizada o estrella | Cuatro uniones contra dos. |
| 16 | La tabla resumen: unas 7 veces más rápida | Carrera animada de 11 ms contra 1.6 ms. |
| 17 | Privacidad | Qué se guarda y qué no. |
| 18 | Límites y decisiones | Seis límites, dichos con honestidad. |
| 19 | Preguntas probables | 13 preguntas con respuesta. |
| 20 | En resumen | Cifras finales. |

## Qué es cada archivo

| Archivo | Para qué sirve |
|---|---|
| `index.html` | Estructura de la página y carga de los scripts. |
| `css/style.css` | Todo el diseño: colores, tema claro y oscuro, diapositivas y adaptación a celular. |
| `js/deck.js` | **Las diapositivas** y la navegación. Aquí se cambia qué dice o muestra cada una. |
| `js/widgets.js` | Tablas, gráficas y las 8 consultas calculadas con los datos reales. |
| `js/content.js` | El contenido de las 9 lecciones y las 13 preguntas. |
| `js/engine.js` | El motor que dibuja los diagramas isométricos, anima el flujo de datos y maneja rutas y búsqueda. |
| `data/dw.js` | Los datos reales del proyecto (~800 KB). **No se edita a mano**: se genera. |
| `tools/build_data.py` | Genera `data/dw.js` desde los SQL de `entrega_sql/`. |
| `Dockerfile`, `nginx.conf` | Para publicarlo con nginx. |

## Si cambian los datos del proyecto

```sh
python3 tools/build_data.py                       # busca ../SISG/entrega_sql
python3 tools/build_data.py /ruta/a/entrega_sql   # o una carpeta distinta
```

Solo usa la biblioteca estándar de Python. **Enmascara los nombres y los DPI de los pacientes antes de escribir el archivo**, y deja fuera contraseñas, hashes y secretos del MFA: la página nunca recibe datos personales, ni siquiera de ejemplo.

Los números que están escritos a mano en `js/deck.js` y `js/content.js` (por ejemplo «≈ 7×», «1.6 ms contra 11 ms» o «91 estudios de ejemplo en la app») vienen de `docs/` y no se recalculan.

## Publicarlo

Es un sitio estático: sirve cualquier hosting que entregue archivos.

**Hostinger (hosting o administrador de archivos):** subir `index.html`, `css/`, `js/` y `data/dw.js` a la carpeta pública del dominio.

**VPS con Coolify:**
1. Poner estos archivos en un repositorio.
2. En Coolify: *New Resource → Repository*, *Build Pack: Dockerfile*, *Base Directory* donde estén estos archivos.
3. *Ports Exposes:* `80`. En *Domains*, el dominio con `https://`.
4. *Deploy*.
5. En el DNS, un registro **A** del dominio hacia la IP del VPS.

La ruta `/healthz` responde `ok` para el chequeo de salud.

## Lo que no hace

- No se conecta a ninguna base de datos ni a la aplicación SISG. Las consultas de la diapositiva 14 se calculan en JavaScript sobre los datos exportados; **no son MySQL**. Los tiempos de la diapositiva 16 (11 ms y 1.6 ms) son los que midió el proyecto en MySQL, no los de tu navegador.
- Los datos son sintéticos y aleatorios: las cifras no significan nada real. Lo que se evalúa es el diseño.
