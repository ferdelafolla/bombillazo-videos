"""Short independiente en Pixel RPG a partir de UNA sola voz (16/11/2026).
Uso: python3 herramientas/short_rpg.py guiones/<id>.json voces/<id>.mp3
El guion tiene capítulos (con lugar) y escenas; la voz es un único mp3 con una frase por escena.
1) calcula los cortes entre escenas sobre la voz entera (tiempos.py con un capítulo único);
2) trocea la voz por capítulos -> remotion/public/voces/<id>_<cap>.mp3;
3) sub_es (recordatorio) y final_es en silencio (la voz ya trae el cierre sin promesas);
4) preparar.py + exportar_rpg.ts -> rpg/page/data/<id>/Short1.json;
5) render vertical, audio chiptune, -14 LUFS y compresión final (crf 17, AAC 192k) -> videos/<id>.mp4
"""
import json, os, shutil, subprocess, sys
R = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
gp, voz = sys.argv[1], sys.argv[2]
g = json.load(open(gp)); gid = g['id']
VD = f'{R}/remotion/public/voces'; os.makedirs(VD, exist_ok=True)
run = lambda *a, **k: subprocess.check_call(list(a), **k)
dur = lambda f: float(subprocess.check_output(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f]))

# 1) cortes sobre la voz entera
tmp = f'/tmp/srpg_{gid}'; shutil.rmtree(tmp, ignore_errors=True); os.makedirs(tmp)
todas = [e for c in g['capitulos'] for e in c['escenas']]
json.dump({'id': gid, 'capitulos': [{'id': 'todo', 'escenas': todas}]}, open(f'{tmp}/g.json', 'w'))
shutil.copy(voz, f'{tmp}/{gid}_todo.mp3')
run('python3', f'{R}/remotion/scripts/tiempos.py', f'{tmp}/g.json', tmp, f'{tmp}/t.json')
cortes = json.load(open(f'{tmp}/t.json'))['todo']['cortes']; D = dur(voz)

# 2) trocear por capítulos
for f in os.listdir(VD):
    if f.startswith(gid): os.remove(f'{VD}/{f}')
i = 0; b = [0] + cortes + [D]
for c in g['capitulos']:
    a, z = b[i], b[i + len(c['escenas'])]; i += len(c['escenas'])
    run('ffmpeg', '-v', 'error', '-y', '-i', voz, '-ss', f'{a:.3f}', '-to', f'{z:.3f}', '-c:a', 'libmp3lame', '-q:a', '2', f'{VD}/{gid}_{c["id"]}.mp3')

# 3) recordatorio y final
shutil.copy(f'{R}/voces/sub_es.mp3', f'{VD}/sub_es.mp3')
run('ffmpeg', '-v', 'error', '-y', '-f', 'lavfi', '-i', 'anullsrc=r=44100:cl=mono', '-t', '0.2', '-q:a', '2', f'{VD}/final_es.mp3')

# 4) tiempos y línea de tiempo
g.setdefault('shorts', [{'capitulos': [c['id'] for c in g['capitulos']], 'titulo': g['titulo'], 'remate': g.get('remate', '¿QUIERES VER MÁS?')}])
json.dump(g, open(f'{tmp}/guion.json', 'w'), ensure_ascii=False)
run('python3', f'{R}/remotion/scripts/preparar.py', f'{tmp}/guion.json')
run('node', '--experimental-strip-types', f'{R}/remotion/scripts/exportar_rpg.ts', f'{R}/rpg/page/data/{gid}')

# 4b) sin recordatorio a mitad (19/11/2026): cortaba la respuesta y alargaba el Short ~3 s
if '--con-sub' not in sys.argv:
    jp = f'{R}/rpg/page/data/{gid}/Short1.json'; d = json.load(open(jp)); off = 0; nuevos = []
    for sg in d['segs']:
        if sg['kind'] == 'sub': off += sg['dur']; continue
        sg['start'] = round(sg['start'] - off, 4); nuevos.append(sg)
    d['segs'] = nuevos; d['dur'] = round(d['dur'] - off, 4); json.dump(d, open(jp, 'w'), ensure_ascii=False)

# 5) render
os.makedirs(f'{R}/rpg/out', exist_ok=True); o = f'{R}/rpg/out/{gid}'
if '--png' in sys.argv:
    run('node', 'render.mjs', 'Short1', f'{o}_mudo.mp4', '--d', gid, '--v', '--png', sys.argv[sys.argv.index('--png') + 1], cwd=f'{R}/rpg'); sys.exit()
DT = json.load(open(f'{R}/rpg/page/data/{gid}/Short1.json'))['dur']; NT = 4; cs = [round(DT * k / NT * 24) / 24 for k in range(NT + 1)]
ps = [subprocess.Popen(['node', 'render.mjs', 'Short1', f'{o}_p{k}.mp4', '--d', gid, '--v', '--desde', str(cs[k]), '--hasta', str(cs[k + 1])], cwd=f'{R}/rpg') for k in range(NT)]
if any(p.wait() for p in ps): sys.exit('fallo en un trozo del render')
open(f'{o}_lista.txt', 'w').write(''.join(f"file '{o}_p{k}.mp4'\n" for k in range(NT)))
run('ffmpeg', '-v', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', f'{o}_lista.txt', '-c', 'copy', f'{o}_mudo.mp4')
run('node', 'render.mjs', 'Short1', f'{o}_ev.mp4', '--d', gid, '--v', '--png', '0.1', cwd=f'{R}/rpg')   # escribe el .ev.json de la línea de tiempo entera
os.replace(f'{o}_ev.ev.json', f'{o}_mudo.ev.json')
run('python3', 'audio_rpg.py', f'page/data/{gid}/Short1.json', f'{o}_mudo.ev.json', VD, f'{o}.wav', cwd=f'{R}/rpg')
run('sh', f'{R}/remotion/audio/unir.sh', f'{o}_mudo.mp4', f'{o}.wav', f'{o}_mix.mp4')
os.makedirs(f'{R}/videos', exist_ok=True)
run('ffmpeg', '-v', 'error', '-y', '-i', f'{o}_mix.mp4', '-vf', ('fps=12,fps=24,' if '--doce' in sys.argv else '') + 'scale=1080:1920:flags=neighbor', '-c:v', 'libx264', '-preset', 'slow', '-crf', '17',
    '-profile:v', 'high', '-pix_fmt', 'yuv420p', '-c:a', 'copy', '-movflags', '+faststart', f'{R}/videos/{gid}.mp4')
print('OK', f'videos/{gid}.mp4', dur(f'{R}/videos/{gid}.mp4'))
