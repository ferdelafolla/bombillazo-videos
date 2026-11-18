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

## Shorts diarios automáticos (17/11/2026)
Receta probada el 16/11 (Renfe, heladas, animación, Países Bajos), publicada bien en YouTube, TikTok e Instagram:
1. Guion JSON en `guiones/<fecha>_<serie>_<tema>.json` (mira `guiones/2026-11-16_*.json`): capítulos con `lugar`, escenas con `tipo`, `destacar` y `remate`; gancho → pregunta → bucles de curiosidad → respuesta → «Curiosidad: …» → cierre sin promesas.
2. UNA voz por Short (Lucía, ElevenLabs, eleven_v4), una frase por escena separadas por línea en blanco. Relevo: `descargas/<id>.url` → `voces/<id>.mp3`.
3. `python3 herramientas/short_rpg.py guiones/<id>.json voces/<id>.mp3 [--png 0.1,5,12]` → `videos/<id>.mp4` (Pixel RPG 3D, sin efectos de sonido, -14 LUFS, crf 17).
4. Miniatura: fotograma del título → `miniaturas/<id>.jpg`.
5. Push y Metricool con la URL raw fijada al commit: YouTube (short) + TikTok (+8 min) + Instagram Reel (+15 min).

Lecciones de la automatización:
- Las tareas programadas arrancan sin permiso de escritura en el repo: lo PRIMERO es `add_repo` (owner ferdelafolla, repo bombillazo-videos, access push) y clonar con el comando que devuelve. Sin esto el push da 403 y la tarea se paraba en 2 minutos sin hacer nada.
- Instagram no deja poner el primer comentario desde Metricool: en Instagram no mandes `firstCommentText` (mete la pregunta al final del texto).
- Si Metricool responde «You have reached your Metricool account limit», para, no reintentes y avisa: es el cupo mensual del plan.

## Estilo desde el 18/11/2026 (decisión del usuario, «de ahora en adelante»)
- 3D con textura de píxel: los objetos protagonistas son modelos de three.js (`page/three3d.js`) cuantizados a la paleta con trama Bayer.
- Recursos AD HOC y sin repetir: cada vídeo añade sus propios modelos 3D (`MODELOS.<nombre>`) y sus propios escenarios (`lugares.js`: función + BASE + NOMBRE). Ejemplo 18/11 (aviones): modelos `avion`, `torre`, `radar` (antena que gira y balizas que parpadean: objetos con name 'antena'/'baliza') y lugares `aeropuerto`, `radar`, `aerovias`.
- Estructura: gancho (titulo con texto_grande) → pregunta → bucles de curiosidad («Pero…») → respuesta → «Curiosidad: …» → cierre sin promesas.
- `comparar` dibuja un «¡COMBATE!» con barras de vida: úsalo solo para enfrentamientos; para dos datos paralelos, `tarjetas`.
- Datos (18/11): en Instagram ~50 % abandona en 3 s y el tiempo medio visto es 5-11 s → Shorts de 30-40 s, primera frase corta con el dato sorprendente.
- Miniatura de un Short vertical: `ffmpeg -ss 0.3 … -vf "crop=1080:608:0:510,scale=1280:720:flags=neighbor"` (avión + rótulo del gancho).

## TODO 3D en vóxeles (18/11/2026, decisión firme del usuario)
Ya no hay fondos 2D: el escenario, los objetos y Chispa son vóxeles 3D (`page/voxel.js`) con luz, sombras y niebla, renderizados a 2× (360×640 en vertical) y escalados por vecino más cercano: textura de píxel por encima, pero con calidad. La interfaz (ventanas, títulos, diálogo, HUD) sigue en pixel art 2D encima.
- Escenarios: `FABE.<lugar>` en voxel.js devuelve `{ s: escena, c: cámara, upd(t) }` (usa `t` global para que la cámara no salte entre frases). Cada vídeo crea los suyos (ejemplo 18/11: `aeropuerto`, `radar`, `aerovias`; `puerta` es el cuarto final común). Si un lugar no tiene escena de vóxeles se dibuja el 2D antiguo: no lo hagas, crea la escena.
- Objetos: `FAB.<nombre>` construye un modelo con la clase `Vox` (`box`, `ball`, `cyl`, `set`, `del`, `luz` para lo que brilla, `build({centrar:true})`). Se dibujan en una segunda pasada con cámara ortográfica y se encuadran por su esfera envolvente: nunca se cortan. Partes animables por nombre: 'antena' (gira).
- Chispa es un modelo de vóxeles (`chispaVox`): boca que habla, brazo que saluda, salto en los acentos.
- Transiciones entre escenas de vóxeles: vuelo de cámara (acercarse, destello, alejarse). El microscopio sigue siendo 2D.
- Para comparar con el estilo plano antiguo: `index.html?…&plano=1`.

## Animación narrativa (18/11/2026, decisión del usuario)
«Animaciones fluidas que cuenten lo que ocurre, no tan infográficas»: si se habla de aviones, se ven despegar, volar, aterrizar…
- Cada escena del guion lleva `"accion": "<nombre>"`; la escena de vóxeles del lugar la implementa en `acc.<nombre>(lt, dur, t)` moviendo actores (flota de modelos, `pose(m, x, y, z, yaw, pitch, roll)`) y la cámara.
- Con `accion` no salen ventanas de infografía: solo el gancho (`texto_grande`, en grande sobre la escena) y, si hace falta, un `rotulo` corto (texto o lista de líneas) cuando se dice la palabra de `destacar`.
- Ejemplo (aviones): `aterrizajes`, `cielo_lleno`, `pantalla` (el radar traza la ruta), `carriles`, `separacion` (regla de 9 km), `cruce` (300 m), `este_oeste`, `de_frente`.
- Encuadre vertical: con fov 46 el ancho visible es ~0,48 × distancia; la acción importante entre el 10 % y el 60 % de la altura (el diálogo ocupa 63-75 %).
- Render más rápido: 4 trozos en paralelo con `render.mjs … --desde a --hasta b`, concat, `audio_rpg.py`, `unir.sh` y ffmpeg final (ver short_rpg.py).

## Música más baja (18/11/2026, decisión del usuario)
En `audio_rpg.py` la música va a 0,09 (antes 0,22) y baja un 75 % cuando habla la voz: queda ~11 dB por debajo de la mezcla. Los efectos de sonido están anulados por completo.
