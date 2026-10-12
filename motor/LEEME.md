# Chispazo — motor de vídeo y flujo diario

Marca: **Chispazo** · 3 canales de Shorts verticales (1080x1920, 30–60 s, español):

| canal (`canal`) | Nombre público | Presentador (`personaje`) | Contenido |
|---|---|---|---|
| `aldia` | Chispazo Hoy | `noti` (robot reportero) | El trend del día de Google Trends España explicado en 1 minuto |
| `curiosidades` | Chispazo | `chispa` (bombilla) | Curiosidades y temas virales: el porqué de las cosas |
| `peques` | Chispazo Peques | `edu` (gotita azul) | Niños de 3–5 años, temas atemporales, frases muy cortas, contar, colores. YouTube: madeForKids = true |

## Montaje del entorno (si no existe /home/claude/bombillazo)
```bash
mkdir -p /home/claude/bombillazo/{engine,videos,voces,salida,fonts} && cd /home/claude/bombillazo
# Descargar de Google Drive (carpeta "Chispazo – motor de vídeo"):
#   engine.js, characters.js, template.html -> engine/
#   render.mjs, music.py, LEEME.md          -> ./
npm init -y >/dev/null && npm i gsap --silent
cd /tmp && npm pack @fontsource/fredoka --silent && tar xzf fontsource-fredoka-*.tgz \
 && cp package/files/fredoka-latin-700-normal.woff /home/claude/bombillazo/fonts/Fredoka-Bold.woff \
 && cp package/files/fredoka-latin-600-normal.woff /home/claude/bombillazo/fonts/Fredoka-SemiBold.woff
```
Requisitos ya presentes en el entorno: Playwright + Chromium en /opt (import desde `/opt/npm-tools/node_modules/playwright/index.mjs`), ffmpeg, python3 + numpy.

## Render
```bash
node render.mjs videos/<id>.js salida/<id>.mp4 --preview          # 6 PNG de control
node render.mjs videos/<id>.js salida/<id>.mp4 --voz voces/<id>.mp3 # final sincronizado
```
Con `--voz`, las escenas se cortan en las pausas reales de la narración y la boca del presentador sigue el volumen de la voz. Cada escena del guion = una frase/párrafo de la locución (en el texto de la voz, separar escenas con una línea en blanco; escribir los años en letra).

## Cómo escribir un vídeo (videos/<id>.js)
```js
VIDEO({
  canal: 'curiosidades', personaje: 'chispa', titulo: '...',
  escenas: [
    { texto: 'Frase que se oye y se subtitula', destacar: ['palabra'],
      arte(A) {
        const { el, tl, at } = A;            // el(tag, attrs, parent?) crea SVG; tl = timeline GSAP; at(s) = tiempo dentro de la escena
        const g = el('g', { transform: 'translate(540,640)' });
        el('rect', { x: -200, y: -150, width: 400, height: 300, rx: 30, fill: A.th.accent }, g);
        A.txt('1492', 0, 30, 120, '#fff', { parent: g });   // texto SVG centrado
        A.pop(g, 0.2);                                       // aparición con rebote
        tl.to(g, { rotation: 5, duration: 1, yoyo: true, repeat: 1, svgOrigin: '540 640' }, at(0.8));
        A.charTo({ x: 540, y: 700, s: 1.4, look: 1, wave: 1 }, 0.3); // mover/gesticular al presentador
      } },
  ],
});
```
Reglas de diseño:
- Zona de ilustración: y 260–1100. Subtítulos: y 1130–1430 (automáticos). Presentador abajo a la izquierda (230,1580). No poner nada clave por debajo de y 1650 (lo tapa la interfaz de Shorts).
- **Cada escena lleva elementos ad hoc del tema que EXPLICAN** (mapas, objetos, documentos, gráficos, contadores, flechas, procesos), animados: no solo texto. Formas SVG planas, colores del tema (`A.th.accent`, `A.th.accent2`), contornos redondeados.
- Ojo: GSAP sobrescribe el atributo `transform` de un elemento al animar x/y/rotation; para mover algo colocado con translate, anima a coordenadas absolutas (p. ej. `gsap.set(doc,{x:540,y:1400})` → `tl.to(doc,{y:660})`) o envuélvelo en otro `<g>`.
- Primera escena = gancho (pregunta o dato sorprendente) en < 3 s. Última = llamada a suscribirse con el presentador en grande.
- Peques: frases de 3–7 palabras, ritmo lento, colores vivos, repetición, contar 1-2-3, nada que dé miedo.
- Revisa siempre los PNG de `--preview` antes del render final y los datos contra fuentes.
- No dibujar personajes, logos ni marcas de terceros; banderas y lugares reales sí, estilizados.

## Voz (ElevenLabs, castellano de España)
Conector ElevenLabs (`creative_generate_speech` dentro de un flow; crear el flow una vez y reutilizarlo). Voces: Hoy → Juanjo; Curiosidades → Lucía `s4NXWwstm4IwAI2dMQ6M`; Peques → Mirna `44CDRSYv1p2yot64kGmO` (modelo eleven_v4). Texto de la voz = frases del guion separadas por una línea en blanco (una por escena); años y cifras en letra; la mascota se llama CHISPA (nunca Edu ni Noti): si se presenta en la locución, "¡Hola! Soy Chispa" (Peques lo hace siempre).
La URL firmada del audio (caduca en 2 h) NO se puede descargar desde el contenedor. Relevo: crear `descargas/<id>.url` (una línea con la URL) en el repo público ferdelafolla/bombillazo-videos y hacer push; la Action `descargar.yml` guarda `voces/<id>.mp3` en el repo; hacer `git pull` y usarlo con `--voz`.

## Reglas de marca
- La mascota es SIEMPRE la bombilla y se llama CHISPA: `personaje: 'chispa'` en los tres canales, y en cualquier locución o subtítulo se llama Chispa.
- La miniatura SIEMPRE lleva la pregunta que resuelve el vídeo: `node miniatura.mjs "¿Pregunta?" aldia|curiosidades|peques miniaturas/<id>.png` (convertir a .jpg, subir al repo y pasar como `videoThumbnailUrl`).

## Publicación
Metricool `createScheduledPost` con youtubeData `{type:'short', madeForKids: (peques), isAiGeneratedContent:false, category:'EDUCATION'}` + TikTok + Instagram Reel. La media debe ser una URL pública del MP4.

## Mejora progresiva de animaciones (regla)
- `A.bgFx(s)` (dentro del `panel()` de cada escena, tras `A.pop(f, 0)`) añade haces de luz, motas flotantes, viñeta y barrido de brillo: úsalo en TODAS las escenas nuevas.
- Objetos héroe GRANDES: el elemento principal de cada escena debe ocupar al menos un tercio del panel (los props de 30-60 px se pierden). Fondo con 2-3 capas de profundidad (cielo, colinas, suelo) que se muevan a distinta velocidad.
- Cada escena: 1 elemento héroe + 2-3 secundarios animados con ritmo distinto (float, pop, draw) y un detalle de énfasis (A.ring/A.burst) al decir la palabra clave.
- Tras cada vídeo, mirar 4-6 fotogramas (ffmpeg -ss) y apuntar una mejora concreta para el siguiente.

## Estilo moderno y minimal (desde 12/10/2026)
- Usa `A.panel(id, colorPlano)` (no gradientes brillantes ni bordes blancos gruesos) + `A.bgFx(s, {})` sobrio.
- Piezas grandes de `KIT` (nube, sol, lluvia, suelo, brote, lupa, gráficos) con paleta limitada: 1 color de panel + 1 acento (amarillo marca) + blanco.
- Tarjetas planas (sin brillo). Mucho aire alrededor del héroe. Tipografía grande y sin adornos.
- Three.js: no hace falta para este estilo; solo se añadiría para escenas 3D reales.
