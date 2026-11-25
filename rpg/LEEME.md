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

## 19/11/2026 (tarea diaria): HD, escaños del 29-N y GTA 6
- Recursos nuevos en `voxel.js`: modelos `tele`, `mando`, `urna`, `escano`, `coche`, `palmera`, `caja`; escenas `salon`, `pixeles`, `mosaico` (HD), `hemiciclo`, `provincias`, `recuento` (escaños) y `tienda`, `leonida`, `vicecity` (GTA 6). En `lugares.js` solo llevan nombre (el 2D `hoy` queda para miniaturas de partidas).
- Utilidades nuevas reutilizables: `Bloques` (InstancedMesh que se recoloca en cada fotograma: muros de píxeles, pilas de papeletas, gente), `pantalla()` (plano con textura de canvas), `mira(c, p, q, sube)` (cámara con el objetivo algo por encima del centro) y `emitir()` (pinta una imagen a la resolución que se quiera, nítida o borrosa).
- `short_rpg.py` ya no mete el recordatorio «¿Quieres saber más?» a mitad del Short (cortaba la respuesta y sumaba ~3 s; `--con-sub` lo recupera) y renderiza en 4 trozos en paralelo.
- `rpg.fin`: textos de ≤ 11 caracteres por línea («MÁS CURIOSIDADES» se corta en la tarjeta final).
- En las tareas programadas no hay `add_repo`: el repo ya viene clonado con permiso de escritura (la prueba de push funciona). WebFetch de agentes falla por permisos: verifica con WebSearch (titulares y fechas) y el RSS del relevo.

## 20/11/2026 (tarea diaria): terremoto, Black Friday y Juegos del Hambre
- Recursos nuevos en `voxel.js`: modelos `movil`, `casa`, `sensor` (terremoto), `bolsa`, `agente` (policía de los 60 con 'brazo' que se mueve), `libro` (Black Friday), `cuerno`, `tren`, `pino` (Juegos); escenas `falla`, `ondas` (corte del suelo con ondas P azules y S rojas onduladas), `aviso`, `escaparate`, `cuentas`, `filadelfia`, `arena`, `distritos`, `mentor`.
- Utilidades nuevas: `persona(B, x, y, z, ropa, {s, ag, pelo, movil})` (figura de 3 bloques en un `Bloques`; `ag` = agacharse), `rotular(pantalla, líneas, color, fondo, px)` (texto en una pantalla 3D, solo se redibuja si cambia), `centra(grupo)` y `bola(color, r)`.
- Duración: el motor suma ~6 s a la voz (entrada, transiciones y tarjeta final). Con voces de 40-45 s el Short pasa de 45 s: se aceleró la voz un 8 % (`ffmpeg -af atempo=1.08` → `voces/<id>_ritmo.mp3`). Mejor: guiones de ≤ 105 palabras.
- `short_rpg.py` usa una carpeta temporal por vídeo (`/tmp/srpg_<id>`).
- Con 2 CPU el render de un Short de ~48 s tarda ~20 min (4 trozos en paralelo); lánzalos encadenados con `setsid nohup`.
- Encuadre: fachadas y objetos anchos necesitan distancia ≥ ancho / 0,48; con `mira(c, p, q, sube)` un `sube` de 0,1-0,12 deja el objeto entre el 15 y el 55 % de la altura. El texto del gancho ocupa ~27-40 %: no pongas letreros 3D ahí en la primera escena.
- Metricool: el 19/11 por la tarde se agotó el cupo («account limit»): 8 publicaciones en error.

## 21/11/2026 (tarea diaria): lluvia en Galicia, «Solo en casa» y F1 en Las Vegas
- Recursos nuevos en `voxel.js`: modelos `nube`, `faro`, `horreo`, `termometro` (con parte 'mercurio' que se escala), `casa_ladrillo`, `claqueta` (con 'palo' que se cierra), `camara_cine`, `monoplaza`, `motor`, `letrero`; escenas `costa`, `atlantico` (vista aérea con viento del oeste, evaporación y frente), `ladera` (montaña en corte: el aire sube, se enfría, nube y lluvia), `nevada`, `plato` (rodaje con grúa), `winnetka`, `strip` (recta nocturna, crono y parrilla), `garaje` (motores de la temporada) y `casinos`.
- Utilidades nuevas: `llueve(B, x0, x1, z0, z1, y0, y1, t, n, col, v, {inc, copo})` (lluvia o nieve), `nubarron(B, …)` (nube de bloques que se puede oscurecer), `f1(color, color2)` (monoplaza genérico sin marcas, morro hacia +x), `casaLad(v, x0, z0, puerta)` y `abeto(v, x, z, h)`.
- La fuente pixel no tiene «º»: en rótulos usa «P1» o «SEXTO», no «1.º».
- Encuadre: no metas la cámara dentro de un edificio (en `strip` los bloques empiezan en |x| = 22); en escenas anchas separa menos los objetos (8 unidades) en vez de alejar la cámara.
- Ritmo: con voces de 35-37 s se aceleró un 8 % / 5 % (`voces/<id>_ritmo.mp3`) para quedar en ~40 s.

## 22/11/2026 (tarea diaria, domingo): la luz de noche, las medallas y el penalti de once metros
- Recursos nuevos en `voxel.js`: modelos `placa`, `molino` (con 'aspas' que giran), `central` (ciclo combinado), `medalla`, `sello`, `carpeta`, `porteria`, `balon`, `balon_cuero`; escenas `anochecer` (ciudad que pasa de día a noche), `parque_solar` (placas + central de gas + ciudad unidas por torres), `eolico`, `vitrina`, `archivo` (libro de la ley que se abre, alegaciones, sello), `imprenta`, `estadio`, `medida` (cinta métrica, yardas contra metros, la línea de 1891 y el punto de 1902) y `milford`.
- Utilidades nuevas: `grafica(pantalla, hasta, sel, título)` (24 barras de precio por horas), `pisos(v, …)` + `ventanas(L, edificios, frac, t)` (bloques de pisos con ventanas que se encienden; el cristal está en z0 + fondo + 1), `flujo(B, ruta, n, t, v, col)` (cubos que viajan por una polilínea: energía, tráfico…), `cesped(v, …)` (campo a escala 1 m = 2 unidades con áreas) y `colLerp`.
- Cielo que cambia de día a noche: `s.background = new THREE.Color()` y cambiarlo en cada fotograma (también `s.fog.color`).
- Rótulos 3D (pantallas) que miran a cámara: tamaño ≤ 6 × 2,6 unidades a ~40 de distancia; si el `rotulo` del guion dice lo mismo, quita uno de los dos (se tapan).
- No se hizo vídeo largo de domingo: con 2 CPU cada Short tarda ~25-30 min y se prefirió cerrar los 3 Shorts.
- Las vistas previas `--png` de otro Short mientras se renderiza uno ralentizan los dos (carga 16); mejor revisar todo antes del primer render final.

## 23/11/2026 (tarea diaria, lunes): viento sur en Bilbao, veda de encuestas y Reino de León
- Recursos nuevos en `voxel.js`: modelos `veleta` (con 'flecha' que gira), `puente_ria`, `caserio`, `candado`, `periodico`, `sandia`, `naranja`, `corona`, `pergamino`, `estandarte`; escenas `ria` (Bilbao con la meseta en niebla detrás de los montes), `cordillera` (montaña en corte meseta → mar con una bola de aire que se enfría y se calienta: efecto Foehn), `caserio`, `redaccion`, `colegio` (colegio electoral en un gimnasio), `andorra`, `reino` (estadio de día con banquillo y letrero), `corte` (León amurallado hacia 910 y el reino pintado hasta Zamora) y `cortes` (sala románica de 1188).
- Utilidades nuevas: `rachas(B, …)` (viento: rayas que viajan en z o x) y `parcela(B, x, y, z, r, col)` (bola hueca de cubos que se recolorea en cada fotograma).
- ElevenLabs se quedó sin créditos en la tercera voz (quedaban 286; hacían falta 471). El Short de deportes se hizo con la voz gratis de piper (`es_ES-sharvard-medium`, speaker 1, length_scale 0,98, 0,75 s entre frases; script en el resumen de la tarea). Hay que recargar créditos o cambiar de plan para volver a Lucía.
- Render con 2 CPU: ~17-25 min por Short en 4 trozos. Si solo hay que corregir el final, se pueden volver a renderizar solo los trozos afectados (`--desde/--hasta`), concatenar con la lista existente y reutilizar el `.wav` (el audio no cambia).
- Rótulo del guion y objeto 3D importante a la misma altura se tapan: deja el objeto clave por debajo del 40 % de la altura cuando la escena lleva `rotulo`.

### Análisis semanal (lunes 23/11, Metricool 16-23/11)
- Datos disponibles solo de los vídeos del 16 y 18/11 (los posteriores aún no salen en las métricas o fallaron por el cupo del 19/11).
- TikTok: 230-290 vistas por vídeo; el mejor, la huelga de Renfe (288), luego heladas (252) y Países Bajos (239). Instagram Reels: 53-141 de alcance, tiempo medio 5-7,4 s y ~46-53 % de retención; el mejor, el de animación (141) y aviones (7,4 s de media). YouTube: 3.881 visualizaciones el 16/11 y ~1.100 diarias el 18-19/11.
- Funciona: temas españoles prácticos del día (huelga, tiempo) y curiosidades visuales. Instagram sigue con 5-7 s de media: se mantienen Shorts de 35-43 s con la primera frase de ≤ 9 palabras y el dato en el primer segundo.
- Ajuste: priorizar actualidad práctica española (qué cambia hoy/mañana para el espectador) y el tiempo con explicación científica; seguir evitando economía y temas extranjeros.

## 24/11/2026 (tarea diaria, martes): el A350 de fibra de carbono, los Mundiales femeninos de 2031-2035 y los tres 1-0 de España
- ElevenLabs sin créditos desde el principio (quedan 286; cada Short pide ~620-650). Los tres Shorts van con piper: `python3 herramientas/voz_short_piper.py guiones/<id>.json voces/<id>.mp3` (speaker 1, length_scale 0,9, 0,55 s entre frases; usa el campo `voz` de la escena si existe para la pronunciación, p. ej. «A trescientos cincuenta» con `texto` «A350»). Sale una voz de 38-40 s → Short de 44-45 s; si pasa de 45, `atempo=1.04` → `voces/<id>_ritmo.mp3`.
- Recursos nuevos en `voxel.js`: modelos `a350` y `a350c` (mismo avión en metal y en fibra de carbono, troceados en 8 rodajas 'r0'…'r7' para cambiar pieza a pieza), `avion_viejo`, `bobina` ('giro'), `pesa`, `estadio_mini`, `papel_picado`, `cohete`, `copa` (copa dorada genérica), `copa_euro` (plateada genérica) y `foco`; escenas `barajas` (T4 con techo ondulado y pilares de colores), `taller` (bobina, báscula, prensa y panel por capas), `crucero` (sobre las nubes al atardecer), `oceano` (mapa del Atlántico norte a 0,5° por cubo con polígonos de países en `MAPA`; las sedes se levantan y salen sus estadios), `cuadro` (tablero con los grupos), `mexico` (estadio de noche con fuegos), `salon_trofeos`, `finales` (estadio de noche con marcador; `final(...)` reutilizable para cualquier final) y `podio`.
- Utilidades nuevas: `rodajas(v, n, x0, x1)`, `a350v(tipo)`, `fuegos(B, t, x0, x1, y0, y1, z, cols, n, per)`, `banderaB(B, x, y, z, cols, t, s, vert)` (banderas genéricas de tres franjas), `enPol`, `mx/mz` (lon/lat → mapa).
- Ojo con `mira(c, p, q, sube)`: `sube` positivo sube el objeto en pantalla; con valores negativos el objeto baja y queda tapado por el diálogo (63-75 %). Para objetos largos (aviones de 48 cubos) la cámara debe estar a ≥ 130 de distancia; si no, se cortan.
- Este contenedor renderiza rápido (~2 min por trozo, ~5 min por Short en 4 trozos): las vistas previas `--png` (una por llamada si alguna falla) y los parches de un trozo (`--desde/--hasta` + concat + `unir.sh` con el `.wav` existente) salen a cuenta.

## 25/11/2026 (tarea diaria, miércoles): la caída mundial de Microsoft, el permiso por nacimiento de 20 semanas y Mario Kart World 1.9.0
- ElevenLabs no disponible (el conector pide volver a conectarse): los tres Shorts con piper (`voz_short_piper.py`). Voces de 36,6-38,3 s → Shorts de 41-44 s sin acelerar.
- Recursos nuevos en `voxel.js`: modelos `servidor` (armario sin LED: los LED de estado van en un `Bloques` aparte), `sobre`, `sirena` ('giro'), `cuna`, `carrito`, `balanza` ('brazo' que se inclina; los platos van en un `Bloques`), `atril`, `kart` + variantes `kart_b/_v/_a/_m/_n` (kart genérico sin personajes: `kartV(color, color2)`), `dron` ('rotor' ×4) y `carrete`; escenas `oficinas` (monitores que se apagan en ola, reloj de pared con día y noche), `pasarelas` (5 armarios, el correo entra y sale, atasco, cascada y dominó), `sala_roja` (sirena, luz roja pulsante con `PointLight` y pantalla que baja de 24 h a menos de 1 h), `cuarto_bebe`, `semanario` (dos carriles de 20 casillas), `diputacion` (escaños, mesa, atril, balanza, calendario de plazo), `pista_arena` (óvalo del desierto con semáforo de salida), `remezcla` (circuito de piezas que se levantan y se recolocan con eses y un salto) y `sala_replay` (tele con menú/repetición, estantería de carretes y parrilla de 24 karts en miniatura).
- Utilidades nuevas: `manecilla(B, cx, cy, cz, a, L, g, col)` (agujas de reloj en un plano vertical), `oval(u)`/`enOval(m, u)`/`ovD(x, z)` (circuito ovalado: posición, orientación y distancia a la línea central).
- Encuadre: con escenas de interior la cámara a ~95-110 de distancia y 40-55 de altura deja la acción en el 30-60 %; más cerca, las figuras del primer plano tapan. En una salida de karts, la cámara debe seguir la posición real del kart (si sigue una fórmula aparte, los karts se salen del cuadro). Objetos con caras (carretes) en una estantería: mirarlos de frente y con separación mayor que su diámetro.
- Una grada o pórtico entre la cámara y la pista tapa la acción: ponlos al otro lado.
