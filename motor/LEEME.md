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

## Botón final (suscribirse)
- Español: `SUSCRÍBETE` → `SUSCRITO ✓`. Inglés y chino (los vídeos chinos llevan subtítulos en inglés): `SUBSCRIBE` → `SUBSCRIBED ✓`. NUNCA en chino.
- Al copiar la escena final de otro guion, cambia SIEMPRE las dos cadenas (`label = A.txt(...)` y `label.textContent = ...`) al idioma del vídeo y compruébalo con `grep -n "label" guion.js` antes de renderizar.

## SUSCRIPCIONES (obligatorio en todo vídeo menos Peques)
La gente ve los vídeos pero no se suscribe: hay que darle una RAZÓN y un MOMENTO.
1. Recordatorio a mitad de vídeo: el motor lo pone solo (píldora roja con campana arriba a la derecha hacia el 40-50 % del vídeo, se pulsa y queda en "suscrito"). Idioma automático por el título; fuerza con `lang: 'en'` en VIDEO({...}) para vídeos en inglés o chino. Desactivar solo con `suscripcion: false`.
2. Última frase = invitación a seguir, SIN prometer nada para mañana: "Suscríbete para más noticias, y en el canal tienes muchas más historias como esta." / "Subscribe for more news, and check out the channel for more explainers like this one." (ver CIERRE DE LOS VÍDEOS).
3. Bucle abierto para los temas fuertes: si el tema da para más, hazlo en dos partes ("Parte 1" en el título; la parte 2 al día siguiente) y dilo en la última frase.
3. Temas fuertes: se pueden hacer en dos partes, pero NO se anuncia la segunda en el vídeo (nada de "mañana…").
5. Gancho en los 2 primeros segundos: la pregunta en pantalla y en la voz a la vez; nada de presentaciones.
6. Título y miniatura prometen la respuesta (pregunta clara); el vídeo la da antes del segundo 20.

## ESTILO TINTA (por defecto desde 12/10/2026; referencia del usuario)
- Dibujo de línea negra gruesa y temblorosa sobre AMARILLO plano; ROJO solo como acento; nada de degradados, paneles con marco, viñeta, sombras ni brillos.
- El motor lo aplica solo (`inkify`): cualquier relleno pasa a amarillo con contorno negro, lo oscuro a negro, lo rojo a rojo, lo pequeño a negro macizo; las decoraciones tenues se ocultan. Las líneas "hierven" (feTurbulence cambiando de semilla 8 veces/s).
- Para dibujar: piensa en contornos y formas simples (personas como tubos redondeados, objetos con 2-3 trazos), no en colores. Usa rojo (#e63b2e) solo para lo que debe destacar.
- Tarjetas de texto: negras con texto amarillo (A.th.cardFill / A.th.cardInk). El texto se reduce solo si no cabe.
- Chispa: bombilla amarilla redonda, ojos cerrados en arco, nariz "<", sonrisa roja (se abre al hablar), casquillo a rayas.
- Tipografías: TÍTULOS (tarjetas, chip, miniaturas) en Vemoly (fonts/VemolyChispazo.ttf, con tildes, ñ, ¿¡ añadidas); SUBTÍTULOS en Fredoka SemiBold (sans simple, licencia OFL).
- Trazo vivo: bordes ásperos (roughen edges) + temblor sutil (wiggle); vídeo a 24 fps con la animación posterizada a 12 dibujos/s ("a doses").
- El brazo de Chispa va detrás del cuerpo.
- `estilo: 'clasico'` en VIDEO({...}) vuelve al estilo anterior.

## TEMAS PROHIBIDOS (decisión del usuario, 12/10/2026)
- NUNCA hablar de enfermedades ni de la salud de personas (ni de famosos ni de nadie): nada de párkinson, cáncer, ictus, diagnósticos, muertes, etc., aunque sean tendencia. Si la tendencia es la enfermedad de alguien, se descarta y se elige otra.
- Excepción SOLO si el usuario lo pide expresamente (no la tarea automática): vídeo de causa benéfica sin nombrar a personas concretas (p. ej. nunca Pepe Colubi), con fuentes fiables sin ánimo de lucro donde donar (Federación Española de Párkinson esparkinson.es, Michael J. Fox Foundation michaeljfox.org…), `suscripcion:false` y SIN "suscríbete" al final ni en el primer comentario.

## PLURALIDAD Y FUENTES DE TEMAS (decisión del usuario, 12/10/2026)
- El canal es PLURAL: no toma partido. La política y la actualidad caliente están permitidas, pero contadas de forma neutral: qué pasa, qué dice cada parte, datos verificables. Nada de "cómo apoyar la causa", llamadas a movilizarse ni adjetivos valorativos. Si hay polémica, se cierra con "hay quien… y quien…" o con el dato que importa.
- Equilibrar: no encadenar varios temas que sesguen hacia un mismo lado; alternar política con ciencia, tecnología, deportes, cultura y curiosidades.
- Temas INTERNACIONALES cada día (al menos 1 de cada 3 vídeos de noticias: EE. UU., Europa, Latinoamérica, Asia…).
- DEPORTES y ENTRETENIMIENTO (cine, series, música, famosos, videojuegos) también, todos los días si son tendencia: al menos 1 de deportes y 1 de entretenimiento al día, con datos contrastados (resultados, fichajes, estrenos), nunca cotilleo ni salud.
- TODOS los vídeos llevan una CURIOSIDAD RELACIONADA CON EL TEMA ("Curiosidad: …" / "Fun fact: …"): un dato sorprendente y verificable que conecte la noticia con algo que se aprende (ej.: Alcaraz cae en Shanghái → por qué en tenis se cuenta 15-30-40; acampada en Sol → el kilómetro cero; Ceuta → única frontera terrestre de la UE en África). Va como escena propia antes del cierre, y el título o la miniatura pueden apoyarse en ella.
- Fuente principal: GOOGLE TRENDS (España, EE. UU. y, para el vídeo chino, temas globales). Elegir lo que más búsquedas tiene ese día que cumpla las reglas anteriores; las otras fuentes solo para verificar datos.

## CIERRE DE LOS VÍDEOS (decisión del usuario, 12/10/2026)
- NUNCA prometer contenido futuro ("mañana te explico…" / "tomorrow, why…"). La última frase invita a seguir para nuevas noticias o a ver lo que ya está en el canal: "Suscríbete para más noticias, y en el canal tienes muchas más historias como esta." / "Subscribe for more news, and check out the channel for more explainers like this one." (adaptar al tema: deportes, curiosidades…). Esto sustituye cualquier regla anterior de "promesa concreta".

## ZONA SEGURA DE REDES (decisión del usuario, 12/10/2026)
Los botones e textos de YouTube Shorts, TikTok e Instagram Reels tapan los bordes. Todo lo importante va dentro de x 60–930, y 240–1450 (lienzo 1080x1920):
- El motor ya lo respeta: chip arriba a 240 px, píldora de suscripción a la derecha con margen de 160 px, subtítulos en la caja x 290–930 / y 1110–1440 (la letra se reduce sola si no cabe), Chispa abajo a la izquierda (x 165, y 1290, escala 0.6) y barra de progreso a y 1448.
- En los guiones: nada de arte por encima de y 300 ni por debajo de y 1100 si choca con los subtítulos; nada clave a la derecha de x 930 (botones de like/comentar/compartir). Comprueba con --preview dibujando las guías.

## CHISPAZO PEQUES: FUERA (decisión del usuario, 12/10/2026)
La serie Peques no funciona: NO se producen ni se programan más vídeos de Peques (ni en español ni en inglés). Los huecos se rellenan con Hoy, News, Curiosidades o Chess.

## PAUSA DE SUSCRIPCIÓN A MITAD DE VÍDEO (decisión del usuario, 13/10/2026)
render.mjs la pone sola en todos los vídeos con voz (menos los que tengan `suscripcion:false`): busca el corte de escena más cercano al 45 % del vídeo, inserta la frase grabada "Si quieres saber más, ¡suscríbete!" (voces/sub_es.mp3; en inglés voces/sub_en.mp3 "Want to know more? Subscribe!"; en chino pon `subVoz: 'zh'` para usar voces/sub_zh.mp3) y el motor muestra a pantalla completa, centrado, "¿QUIERES SABER MÁS?" con el botón SUSCRÍBETE que una mano pulsa (→ SUSCRITO ✓). Después el vídeo continúa. Los --cortes se dan como siempre, sobre la voz original: render.mjs los desplaza solo. `--sin-suscripcion` la desactiva.

## DIBUJO EN DIRECTO Y SONIDO (13/10/2026, gramática de lemo-opuscar —MIT— y principios de dirección)
- En estilo tinta, cada contorno se TRAZA delante del espectador (curva lenta-rápida-lenta) en el momento en que su elemento aparece, y el relleno entra justo detrás. Automático; `dibujo:false` en VIDEO({...}) o en una escena lo desactiva.
- Efectos de sonido sintetizados (sfx.py), todos en la misma sala y por debajo de la voz: rotulador sobre papel en cada trazo, barrido en cada transición, toque y campanita al pulsar SUSCRÍBETE. `--sin-efectos` los quita.
- Principios de dirección que seguimos (de lemo-opuscar DIRECTOR.md y de la idea de "carry"): gancho en 3 s; variar el ritmo (planos cortos junto a pausas largas, al menos un respiro); algo que sobreviva de una escena a la siguiente (Chispa, una tarjeta, el objeto héroe) en vez de cambiar de diapositiva; cada acción visible tiene su sonido; el sujeto ocupa al menos un tercio del alto en los momentos clave.
- onetake NO se usa: su licencia (PolyForm Noncommercial) prohíbe el uso comercial y el canal se monetiza.
- TRANSICIONES (13/10/2026, petición del usuario): zoom de cámara alterno entre escenas. Hacia escenas impares, "zoom in" (la escena actual crece hacia la cámara y se desenfoca; la nueva llega desde lejos, pequeña). Hacia escenas pares, "zoom out" (la actual se aleja; la nueva llega grande, desde cerca). Entrada 0.5 s expo.out, salida 0.3 s power2.in, con desenfoque de movimiento. El iris sigue reservado al cierre.
- PLANO SECUENCIA (13/10/2026, petición del usuario: "imágenes macro, todo en una toma"): en estilo tinta ya no hay cortes entre escenas. Cada escena vive en su sitio de un mismo mundo (recorrido en zigzag) y la cámara viaja de una a otra: se aleja para viajar (zoom out, se ven las dos escenas), llega en macro (zoom in, ×1.35) y se asienta. El vídeo abre en macro (×2) sobre el primer dibujo y se abre al conjunto. Las escenas anteriores se quedan dibujadas en el mundo. `plano: 'cortes'` en VIDEO({...}) vuelve a las transiciones de zoom por escena. Idea inspirada en "one take"; código propio (onetake no se puede usar por su licencia no comercial).

## VÍDEO LARGO + 2 SHORTS CON REMOTION (14/10/2026, petición del usuario)
Cada 2 días: un vídeo largo horizontal y dos Shorts que son FRAGMENTOS del mismo largo (sus puntos álgidos) y llevan al largo ("¿Y LA IA? ¿ES OTRA BURBUJA?" + "VÍDEO COMPLETO EN EL CANAL"). Todo en `remotion/` (léete `remotion/LEEME.md`).
- Estilo de este formato: pantalla completa, FONDO BLANCO, el AMARILLO resalta (palabras clave, títulos), POLICROMÁTICO (tarjetas e iconos de colores), fotos reales en color cuando hay personajes conocidos, mapas o lugares, y subtítulos en UNA línea.
- Audio con la biblioteca de lemo-opuscar (MIT): música de cuerdas pulsadas modeladas, efectos y normalización a −14 LUFS.
