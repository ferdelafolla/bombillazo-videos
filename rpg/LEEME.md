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
