"""Envolvente de la voz a 24 fps (0..1) para la boca de Chispa. Uso: amplitud.py carpeta salida.json"""
import json, subprocess, sys, glob, os
import numpy as np
out = {}
for f in sorted(glob.glob(sys.argv[1] + '/*.mp3')):
    raw = subprocess.check_output(['ffmpeg', '-v', 'error', '-i', f, '-ac', '1', '-ar', '24000', '-f', 's16le', '-'])
    x = np.frombuffer(raw, np.int16).astype(np.float32) / 32768
    hop = 1000
    r = np.array([np.sqrt(np.mean(x[i:i + hop] ** 2)) for i in range(0, len(x), hop)])
    r = np.clip(r / (np.percentile(r, 95) + 1e-6), 0, 1)
    out[os.path.basename(f)[:-4]] = [round(float(v), 2) for v in r]
json.dump(out, open(sys.argv[2], 'w'))
