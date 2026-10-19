"""Monta un proyecto de HyperFrames con el motor Pixel RPG de Chispazo.
Uso: python3 hf_proyecto.py <carpeta_datos> <Largo|Short1|Short2> <carpeta_voces> <salida>
- El motor (page/*.js) se empaqueta en engine.js y dibuja cada fotograma en un <canvas> desde la línea de tiempo de GSAP
  (un "proxy" con onUpdate: así HyperFrames puede saltar a cualquier instante y el fotograma sale idéntico).
- Cada trozo de voz es su propia pista <audio> (editable en HyperFrames Studio); la música chiptune y los efectos van en otra.
"""
import json, os, shutil, subprocess, sys

R = os.path.dirname(os.path.abspath(__file__))
dat, comp, vdir, out = sys.argv[1:5]
vert = comp != 'Largo'
os.makedirs(out, exist_ok=True)
D = json.load(open(f'{R}/page/data/{dat}/{comp}.json'))
amp = json.load(open(f'{R}/page/data/{dat}/amp.json'))
dur = round(D['dur'], 3)
W, H = (1080, 1920) if vert else (1920, 1080)

# 1) motor empaquetado + datos incrustados
subprocess.check_call(['npx', '--yes', 'esbuild', f'{R}/page/main.js', '--bundle', '--format=esm', f'--outfile={out}/engine.js', '--log-level=warning'])
with open(f'{out}/data.js', 'w') as f:
    f.write('window.RPG_VERT = %s;\nwindow.RPG_DATA = %s;\n' % ('true' if vert else 'false', json.dumps({'comp': D, 'amp': amp}, ensure_ascii=False)))
shutil.copy('/home/claude/hf/prueba/gsap.min.js', out)
if os.path.isdir(f'{R}/page/fotos'):
    shutil.copytree(f'{R}/page/fotos', f'{out}/fotos', dirs_exist_ok=True)

# 2) eventos de sonido (los calcula el propio motor) y pista de música + efectos sin voz
tmp = f'{out}/.tmp'; os.makedirs(tmp, exist_ok=True)
args = ['node', f'{R}/render.mjs', comp, f'{tmp}/x.mp4', '--d', dat, '--png', '0'] + (['--v'] if vert else [])
subprocess.check_call(args, cwd=R, stdout=subprocess.DEVNULL)
os.makedirs(f'{out}/audio', exist_ok=True)
subprocess.check_call(['python3', f'{R}/audio_rpg.py', f'{R}/page/data/{dat}/{comp}.json', f'{tmp}/x.ev.json', vdir, f'{out}/audio/musica_y_efectos.wav'],
                      env={**os.environ, 'SIN_VOZ': '1'}, stdout=subprocess.DEVNULL)

# 3) pistas de voz
voces = []
for i, s in enumerate(D['segs']):
    v = s['voz']
    if not os.path.exists(f'{out}/audio/{v}.mp3'):
        shutil.copy(f'{vdir}/{v}.mp3', f'{out}/audio/{v}.mp3')
    voces.append(f'''      <audio id="voz-{i:02d}" src="audio/{v}.mp3" data-start="{s['start']:.3f}" data-duration="{s['vozDur']:.3f}" data-media-start="{s['vozDesde']:.3f}" data-track-index="{2 + i % 2}" data-volume="1"></audio>''')

html = f'''<!doctype html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width={W}, height={H}" />
    <title>Chispazo · {D.get('titulo', '')} · {comp}</title>
    <script src="gsap.min.js"></script>
    <script src="data.js"></script>
    <style>
      * {{ margin: 0; padding: 0; box-sizing: border-box; }}
      html, body {{ width: {W}px; height: {H}px; overflow: hidden; background: #16161d; }}
      #root {{ position: relative; width: 100%; height: 100%; overflow: hidden; }}
      /* el motor dibuja a 6× con vecino más cercano: píxel nítido */
      #c {{ position: absolute; inset: 0; width: 100%; height: 100%; image-rendering: pixelated; }}
    </style>
  </head>
  <body>
    <div id="root" data-composition-id="main" data-start="0" data-duration="{dur}" data-width="{W}" data-height="{H}">
      <canvas id="c" data-layout-allow-overflow width="{W}" height="{H}"></canvas>
      <audio id="musica" src="audio/musica_y_efectos.wav" data-start="0" data-duration="{dur}" data-track-index="1" data-volume="1"></audio>
{chr(10).join(voces)}
    </div>
    <script type="module">
      // El motor Pixel RPG pinta el fotograma del instante pedido; GSAP lleva el tiempo y HyperFrames lo busca fotograma a fotograma.
      import "./engine.js";
      const DUR = {dur};
      const tl = gsap.timeline({{ paused: true }});
      const reloj = {{ t: 0 }};
      tl.to(reloj, {{ t: DUR, duration: DUR, ease: "none", onUpdate: () => window.RPG_FRAME(reloj.t) }}, 0);
      window.RPG_FRAME(0);
      window.__timelines["main"] = tl;
      if (window.__hfForceTimelineRebind) window.__hfForceTimelineRebind();
    </script>
  </body>
</html>
'''
open(f'{out}/index.html', 'w').write(html)
shutil.copy('/home/claude/hf/prueba/hyperframes.json', out)
json.dump({'id': os.path.basename(out), 'name': f"Chispazo · {D.get('titulo', '')} · {comp}"}, open(f'{out}/meta.json', 'w'), ensure_ascii=False, indent=1)
json.dump({'name': os.path.basename(out), 'private': True, 'type': 'module',
           'scripts': {'dev': 'npx --yes hyperframes@0.8.172 preview', 'check': 'npx --yes hyperframes@0.8.172 check', 'render': 'npx --yes hyperframes@0.8.172 render'}},
          open(f'{out}/package.json', 'w'), indent=1)
shutil.rmtree(tmp)
print('ok', out, dur, 's,', len(voces), 'pistas de voz')
