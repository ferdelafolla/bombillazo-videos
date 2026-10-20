"""Alarga las pausas entre frases de una locución (ritmo más pausado): cada pausa de final de frase (más de 0,45 s) gana +0,55 s.
Uso: python3 respirar.py entrada.mp3 salida.mp3"""
import re, subprocess, sys, numpy as np
src, dst = sys.argv[1:3]; SR = 44100
x = np.frombuffer(subprocess.check_output(['ffmpeg', '-v', 'error', '-i', src, '-ac', '1', '-ar', str(SR), '-f', 'f32le', '-']), np.float32)
r = subprocess.run(['ffmpeg', '-i', src, '-af', 'silencedetect=n=-38dB:d=0.45', '-f', 'null', '-'], capture_output=True, text=True).stderr
st = [float(v) for v in re.findall(r'silence_start: ([\d.]+)', r)]; en = [float(v) for v in re.findall(r'silence_end: ([\d.]+)', r)]
parts, last = [], 0
for s, e in zip(st, en):
    if s < .2 or e > len(x) / SR - .1: continue
    m = int((s + e) / 2 * SR); parts += [x[last:m], np.zeros(int(.55 * SR), np.float32)]; last = m
parts.append(x[last:]); y = np.concatenate(parts)
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 'f32le', '-ar', str(SR), '-ac', '1', '-i', '-', '-b:a', '192k', dst], input=y.tobytes(), check=True)
print(dst, round(len(x) / SR, 2), '->', round(len(y) / SR, 2))
