# Voz gratis de un Short (piper es_ES-sharvard-medium, speaker 1) cuando ElevenLabs no tiene créditos (24/11/2026).
# Uso: python3 herramientas/voz_short_piper.py guiones/<id>.json voces/<id>.mp3
# Una frase por escena (campo "voz" si existe, si no "texto"), 0,55 s entre frases, length_scale 0,9 (Shorts de ≤ 45 s).
import json, subprocess, sys, wave, numpy as np
from piper import PiperVoice
from piper.config import SynthesisConfig
g = json.load(open(sys.argv[1])); out = sys.argv[2]
v = PiperVoice.load('/home/claude/piper/es_ES-sharvard-medium.onnx')
cfg = SynthesisConfig(speaker_id=1, length_scale=.9, noise_scale=.6, noise_w_scale=.7)
SR = v.config.sample_rate
frases = [e.get('voz', e['texto']) for c in g['capitulos'] for e in c['escenas']]
parts = [np.zeros(int(.08 * SR))]
for i, t in enumerate(frases):
    parts.append(np.concatenate([c.audio_float_array for c in v.synthesize(t, syn_config=cfg)]))
    if i < len(frases) - 1: parts.append(np.zeros(int(.55 * SR)))
parts.append(np.zeros(int(.2 * SR))); x = np.concatenate(parts)
w = f'/tmp/{g["id"]}_piper.wav'
with wave.open(w, 'wb') as f: f.setnchannels(1); f.setsampwidth(2); f.setframerate(SR); f.writeframes((np.clip(x, -1, 1) * 32767).astype(np.int16).tobytes())
subprocess.check_call(['ffmpeg', '-v', 'error', '-y', '-i', w, '-af', 'highpass=f=70,acompressor=threshold=-18dB:ratio=3,loudnorm=I=-16', '-ar', '44100', '-b:a', '160k', out])
print(g['id'], round(len(x) / SR, 1), 's')
