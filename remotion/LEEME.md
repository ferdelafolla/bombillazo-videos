# Chispazo · vídeo largo + 2 Shorts con Remotion

Formato que se produce **cada 2 días**: un vídeo largo horizontal (1920×1080, 24 fps) sobre un tema y **dos Shorts verticales (1080×1920) que son fragmentos del mismo largo**, sus puntos álgidos, y que llevan al largo.

- Motor: [Remotion](https://www.remotion.dev) (licencia gratuita para particulares y empresas de hasta 3 personas; uso comercial permitido).
- Audio: biblioteca de **lemo-opuscar** (MIT, © 2026 LemoLab, copia en `audio/lemo/` con su LICENSE):
  - música original con cuerdas pulsadas modeladas (`pluck.py`: kalimba, guitarra de nailon, contrabajo pizzicato, caja de música);
  - efectos (`sfx.py`: whoosh, pop, click, ding).
  - El sonido del rotulador es síntesis propia (`audio/pen.py`).
  - Normalización a −14 LUFS / TP −1,2 en dos pasadas (`audio/unir.sh`, mismos parámetros que lemo `core/render/mux.sh`).

## Estilo (decisión del usuario, 14/10/2026)
- **Pantalla completa**: el dibujo ocupa todo el plano (largo: zoom 1,32 sobre la caja de 1000×700; Short: caja de 880×820 a 0,985).
- **Fondo blanco** (#fffdf8) con grano suave y línea negra temblorosa (12 dibujos/s). El **amarillo resalta**:
  - las palabras clave del subtítulo, como un rotulador fosforito;
  - las píldoras de título;
  - el subrayado de las cifras.
- **Policromático**:
  - Las tarjetas rotan amarillo, azul, verde, naranja, morado y rojo.
  - Los iconos tienen rellenos de colores.
  - Gráficas: línea roja con área azul clara.
  - Comparar: azul frente a rojo.
- **Detalle cuando hace falta**: mapas, personajes conocidos, lugares y objetos reales llevan **foto real en color** (escena `foto`), con licencia libre y crédito en pantalla. Nada de dibujos minimalistas para un personaje conocido o un mapa.
- **Subtítulos en UNA sola línea**, centrada, que cambia al ritmo de la voz. Dentro de la línea, las palabras se encienden una a una.
- Plano secuencia:
  - Cada escena vive en su sitio de un mundo en zigzag.
  - La cámara viaja alternando dos movimientos: alejarse y volver, o acercarse y asentarse.
  - Apertura en macro ×2.
- Chispa abajo a la izquierda. Su boca sigue la voz.
- Pausa de suscripción a mitad, en el corte de capítulo más cercano a la mitad: "¿QUIERES SABER MÁS?" + SUSCRÍBETE → SUSCRITO ✓.
- Zona segura en los Shorts:
  - el arte entre y 330 y 1140;
  - el subtítulo en x 290–930, y 1190–1300;
  - la barra a y 1468.
- Shorts CORTOS (15–25 s, decisión del usuario 14/10/2026): `shorts[].escenas` elige 2–3 escenas álgidas de los capítulos; empiezan con un GANCHO (`shorts[].gancho`: escena tipo titulo con `texto_grande` llamativo y su propia voz `voces/<id>_short<N>_gancho.mp3`), clickbait honesto que el vídeo cumple, sin ragebait que tome partido. Sin pausa de suscripción si duran menos de 25 s.
- Shorts: terminan con la pregunta-gancho (`shorts[].remate`, p. ej. "¿Y LA IA? ¿ES OTRA BURBUJA?") + "VÍDEO COMPLETO EN EL CANAL" + SUSCRÍBETE, con la voz `voces/final_es.mp3`.
- Miniatura 1280×720 en **Inter ExtraBold** (sans sencilla, nunca Vemoly): pregunta, palabra clave resaltada en amarillo, icono y Chispa.

## Guion (`guiones/<fecha>_largo_<tema>.json`)
```json
{ "id": "2026-10-15_largo_burbuja_ia", "titulo": "…", "serie": "NEWS", "lang": "es", "voz": "s4NXWwstm4IwAI2dMQ6M",
  "fuentes": ["…"], "fotos": ["Archivo — autor, licencia, Wikimedia Commons"],
  "miniatura": { "arriba": "¿LA IA ES UNA", "abajo": "BURBUJA?", "icono": "burbuja", "grafica": true },
  "capitulos": [ { "id": "gancho", "escenas": [ { "texto": "Frase que se oye", "tipo": "titulo", "icono": "burbuja", "destacar": ["burbuja"] } ] } ],
  "shorts": [ { "capitulos": ["curiosidad"], "titulo": "¿Por qué se llama burbuja? 🫧", "remate": "¿Y LA IA? ¿ES OTRA BURBUJA?" } ] }
```

**Tipos de escena:**

| Tipo | Campos |
|---|---|
| `titulo` | `icono`, `texto_grande?` |
| `tarjetas` | `items[]` (1–4), `icono?` |
| `cifra` | `valor`, `etiqueta`, `icono?` |
| `grafica` | `forma`: `sube`, `cae`, `pico` o `suave`; `etiquetas[]`. La 2.ª etiqueta es una línea de referencia. |
| `comparar` | `izq`, `der` |
| `icono` | `icono` |
| `foto` | `foto` (nombre en `public/fotos/`), `etiqueta`, `credito`, `encuadre?` (p. ej. `"50% 18%"`) |
| `suscribete` | último del largo |

**Iconos (`src/iconos.tsx`):** burbuja, banco, personas, balanza, ciclo, barco, manzana, dinero, chip, servidor, rayo, lupa, ordenador, mundo, bombilla, grafica_baja. Añade los que hagan falta con el mismo formato:
- trazos con `f` (relleno) y `s` (color de trazo);
- colores: R, K, W, Y, B, LB, G, LG, O, PU, T, S (piel), M (marrón), GR.

**Reglas del guion:**
- Una frase por escena.
- Cifras y años en letra en el texto.
- Capítulos de 15–30 s, cada uno con su minigancho (pregunta).
- Una CURIOSIDAD como capítulo.
- Cierre sin promesas.
- Plural y neutral.
- Los Shorts son capítulos completos que funcionan solos: los puntos álgidos (el dato más fuerte, la curiosidad, el clímax).

## Producción
1. **Voces.** Una voz por capítulo con ElevenLabs:
   - `creative_generate_in_flow`, tts, `eleven_v4`, Lucía, flow `iCDihYNOXi9OepCkoz8S`, `generations_count` 1.
   - Las frases de la escena van separadas por una línea en blanco.
   - Relevo: `descargas/<id>_<capítulo>.url` → push → la Action deja `voces/<id>_<capítulo>.mp3` → pull.
   - Copia a `remotion/public/voces/` (más `sub_es.mp3` y `final_es.mp3`, que ya están en `voces/`).
2. **Fotos.**
   - Buscar: `descargas/buscar/<nombre>.q` (texto) → push → `fotos_src/buscar_<nombre>.json`, con autor, licencia y `thumburl` de 1600–1920 px. Solo PD, CC0, CC BY o CC BY-SA.
   - Descargar: `descargas/fotos/<nombre>.url` → `fotos_src/<nombre>.jpg`.
   - Preparar: `python3 scripts/foto_tinta.py fotos_src/<nombre>.jpg public/fotos/<nombre>.jpg` (en color; `--tinta` para duotono).
3. **Preparar.**
   - `python3 scripts/preparar.py guiones/<id>.json` escribe `src/datos.json`:
     - los cortes de escena por silencios (alineados con la longitud del texto);
     - la envolvente de la voz para la boca.
   - Revisa que cada capítulo tenga N−1 cortes razonables.
4. **Revisar.**
   - `npx remotion bundle --out-dir=/tmp/b`.
   - `npx remotion still /tmp/b Largo /tmp/x.png --frame=N --scale=0.5 --browser-executable=/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell`.
   - Saca un fotograma por tipo de escena, a mitad de una transición, la pausa de suscripción y el cierre de los Shorts.
5. **Producir.** `sh scripts/producir.sh <id> <salida> Short1 Short2 Largo`:
   - renderiza (crf 17);
   - mezcla con la biblioteca de lemo y normaliza;
   - saca la miniatura.
   - Tiempo: unos 2 fotogramas/s con 2 CPU, así que ~6 min por Short y ~40 min para un largo de 3,5 min.
6. **Publicar.** Recomprime con `-crf 20 -preset slow` si pesa mucho, sube a `videos/` y `miniaturas/`, y programa en Metricool (ver la tarea programada).

Remotion necesita el `headless_shell` de Playwright (`--browser-executable`); con el Chromium normal falla ("Old Headless").
