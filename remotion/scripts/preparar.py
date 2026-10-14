"""Prepara src/datos.json a partir de un guion: tiempos de escena, envolventes de voz y duraciones fijas.
Uso: python3 scripts/preparar.py guiones/<id>.json  (las voces deben estar en public/voces/<id>_<capitulo>.mp3)"""
import json, subprocess, sys, os
R = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
g = sys.argv[1]
dur = lambda f: float(subprocess.check_output(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f]))
subprocess.check_call(['python3', f'{R}/scripts/tiempos.py', g, f'{R}/public/voces', '/tmp/tiempos.json'])
subprocess.check_call(['python3', f'{R}/scripts/amplitud.py', f'{R}/public/voces', '/tmp/amp.json'])
guion = json.load(open(g)); amp = json.load(open('/tmp/amp.json'))
amp = {k: v for k, v in amp.items() if k.startswith(guion['id']) or k in ('sub_es', 'final_es')}
json.dump({'guion': guion, 'tiempos': json.load(open('/tmp/tiempos.json')), 'amp': amp,
           'subDur': dur(f'{R}/public/voces/sub_es.mp3'), 'finalDur': dur(f'{R}/public/voces/final_es.mp3')},
          open(f'{R}/src/datos.json', 'w'))
print('ok', guion['id'])
