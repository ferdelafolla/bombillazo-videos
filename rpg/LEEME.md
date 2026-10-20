# Chispazo · versión "16-bit Pixel RPG"

Motor propio sobre el estilo **pixel-rpg** de lemo-opuscar (MIT, © 2026 LemoLab). Se reutilizan su framebuffer indexado, sus paletas, su fuente y sus ventanas (`page/px.js`, `page/font.js`, `page/ui.js`, licencia en `page/LICENSE-lemo-opuscar`).

El vídeo se cuenta como un juego de rol, con las mismas voces y cortes que la versión normal:
- Cada capítulo es un lugar, y Chispa viaja entre ellos.
- La época cambia la profundidad de color: 1720 en 4 tonos, 2000 en 8-bit, hoy en 16-bit.
- Los datos salen como sistemas del juego:
  - las tarjetas son menús con cursor;
  - las cifras son objetos obtenidos;
  - las comparaciones son combates;
  - las gráficas van en ventanas;
  - las fotos van tramadas a la paleta.
- El final es la última puerta, con la pantalla de partidas guardadas que repasa el viaje.
- Las transiciones van rotando (andar, mosaico, deslizar, iris, miniatura, remolino, puertas, barrido, caída de paleta), cada una con su propio sonido chiptune.

## Uso
1. `node remotion/scripts/exportar_rpg.ts rpg/page/data` (línea de tiempo completa desde el guion de Remotion). Fotos en `rpg/page/fotos/<n>.jpg`.
2. Render:
   - largo: `node render.mjs Largo out/largo_mudo.mp4`;
   - Shorts: `node render.mjs Short1 out/s1_mudo.mp4 --v`.
   - Va muy rápido, unos 2 min el largo.
   - `--png t1,t2` saca fotogramas sueltos para revisar.
3. Audio: `python3 audio_rpg.py page/data/Largo.json out/largo_mudo.ev.json <voces> out/largo.wav` (música chiptune por época + efectos + voz con ducking).
4. Unir: `sh remotion/audio/unir.sh out/largo_mudo.mp4 out/largo.wav out/largo.mp4` (−14 LUFS).

## Receta completa de un vídeo nuevo (desde el 19/10/2026: estilo Pixel RPG, voz gratis, subida por GitHub)
Ejemplo de referencia: `guiones/2026-10-20_largo_mar_salado.json` (¿Por qué el mar es salado?).

1. **Guion** en `remotion/guiones/<fecha>_largo_<tema>.json` (formato de remotion/LEEME.md) más:
   - en cada capítulo `lugar` (un escenario de `rpg/page/lugares.js`: playa, montana, fondo, desierto, hoy, mercado, londres, datos, nasdaq, cruce, mirador, puerta; si hace falta uno nuevo, añádelo allí con su vida ambiente en `AMB` y su nombre en `NOMBRE`) y, opcional, `era` (`gb` 4 tonos, `nes` 8 bits; por defecto 16 bits);
   - `rpg.gancho_lugar` y `rpg.partidas` (3 entradas {lugar, era, nombre, nota} para la pantalla de partidas guardadas del cierre);
   - iconos que falten: añádelos a `rpg/page/iconos_data.js` (caja -200..200, rellenos de colores).
2. **Voces gratis** (sin créditos): modelos piper en `voces/modelo_sharvard_onnx.mp3` y `voces/modelo_sharvard_json.mp3` → cópialos a `/home/claude/piper/es_ES-sharvard-medium.onnx(.json)`; `pip install --break-system-packages piper-tts`; `python3 herramientas/voz_gratis.py <guion> <carpeta_voces>` (crea capítulos, ganchos de Short, sub_es y final_es).
3. **Tiempos**: copia las voces a `remotion/public/voces/`, `python3 remotion/scripts/preparar.py <guion>` y `node --experimental-strip-types remotion/scripts/exportar_rpg.ts rpg/page/data/<carpeta>`.
4. **Fotos** (relevo de GitHub) a `rpg/page/fotos/<nombre>.jpg` (800 px de ancho), con `credito` en la escena.
5. **Render**: `node render.mjs <Largo|Short1|Short2> out/x_mudo.mp4 --d <carpeta> [--v]` → `python3 audio_rpg.py page/data/<carpeta>/<Id>.json out/x_mudo.ev.json <carpeta_voces> out/x.wav` → `sh remotion/audio/unir.sh out/x_mudo.mp4 out/x.wav out/x.mp4`. Largo para GitHub: `-b:v 3300k`. Revisa fotogramas con `--png t1,t2`.
6. **Subida**: MP4 a `videos/`, miniatura a `miniaturas/`, y un JSON por vídeo en `publicar/youtube/` (formato en `.github/scripts/subir_youtube.py`). La Action sube y programa con `publicar`; si faltan las claves los deja pendientes y reintenta cada 2 horas.

### Vista de microscopio (19/10/2026)
En cualquier escena del guion, `"transicion": "micro"` (granos de sal → cristal → red de iones Na+ y Cl-) o `"micro_agua"` (iones sueltos entre moléculas de agua) hace que se entre en esa escena con un viaje al microscopio de unos 2,8 s: la cámara se mete en la ventana de la escena anterior, baja de ×100 a ×10.000.000 con el aumento en pantalla y sale por la ventana de la escena nueva. Los subtítulos siguen encima. Código en `rpg/page/micro.js`; se puede reutilizar para otros temas cambiando los granos y los iones.

## HyperFrames (19/10/2026)
`python3 rpg/hf_proyecto.py <carpeta_datos> <Largo|Short1|Short2> <carpeta_voces> <salida>` monta un proyecto de HyperFrames: el motor se empaqueta en `engine.js` y pinta cada fotograma en un `<canvas>` desde la línea de tiempo de GSAP (proxy con `onUpdate`), cada trozo de voz es una pista `<audio>` y la música + efectos otra. Render: `npx hyperframes@0.8.172 render --fps 24 --video-bitrate 4M -o renders/x.mp4 .` con `PRODUCER_HEADLESS_SHELL_PATH` y `HYPERFRAMES_BROWSER_PATH` apuntando al headless_shell de /opt/pw-browsers; después loudnorm a −14 LUFS. Proyectos de ejemplo en `hyperframes/reentrada_*`.
Ritmo pausado (decisión del usuario): 88 ppm, voz con length_scale 1,04 y 0,9 s entre frases, 1,2 s al final de cada capítulo, zooms suaves y transiciones tranquilas.
Escenas `"tipo": "microscopio"` con `modo` (aire, choque, aprieta, plasma, ablacion, ablacion2): una historia continua al microscopio que dura varias frases (cada escena sigue donde acabó la anterior).

## Voz (19/10/2026, tarde)
El usuario permite ElevenLabs: voz de Lucía (s4NXWwstm4IwAI2dMQ6M, eleven_v4, flow iCDihYNOXi9OepCkoz8S, 1 generación por capítulo). Descarga por el relevo (`descargas/el_<id>_<capítulo>.url`). Para el ritmo pausado, `python3 rpg/respirar.py entrada.mp3 salida.mp3` alarga cada pausa +0,55 s antes de calcular los tiempos. `sub_es`/`final_es` de Lucía: `remotion/public/voces_lucia/` (o `voces/sub_es.mp3`, `voces/final_es.mp3`).

## Estructura «reel explicativo» (20/10/2026)
Todos los vídeos siguen esta fórmula (campo `estructura` del guion):
1. **Lo raro, en el primer segundo**: la primera escena es un `titulo` con la pregunta rara (p. ej. «¿HIELO SIN FRÍO?»); el motor lo muestra al instante, sin animación de entrada.
2. **Cada frase, cuando se oye**: `sincroniza()` en `page/main.js` hace que cada tarjeta, cifra, lado de `comparar` o icono aparezca justo cuando la voz dice su palabra (`destacar`). Las pistas numeradas («Primera pista: …») llevan la etiqueta PISTA N desde el principio.
3. **La respuesta, al final**: capítulos gancho → pistas → microscopio → curiosidad → respuesta («Entonces, ¿por qué…?») → cierre. Los Shorts acaban con un `remate` que es la pregunta, para llevar al vídeo largo.

Temas: cosas del día a día ligadas a UNA sola tendencia de Google Trends. Iconos en 3D (three.js, `page/three3d.js`) y textos siempre centrados.
