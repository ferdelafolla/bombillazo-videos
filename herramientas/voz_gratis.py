# Voces gratis con piper (es_ES-sharvard-medium, voz F). Una frase por escena, unidas con silencios.
import json, subprocess, sys, wave, numpy as np, os
from piper import PiperVoice
from piper.config import SynthesisConfig
g = json.load(open(sys.argv[1])); out = sys.argv[2]
v = PiperVoice.load('/home/claude/piper/es_ES-sharvard-medium.onnx')
cfg = SynthesisConfig(speaker_id=1, length_scale=.92, noise_scale=.6, noise_w_scale=.7)
SR = v.config.sample_rate
def frase(t):
    return np.concatenate([c.audio_float_array for c in v.synthesize(t, syn_config=cfg)])
def guardar(nombre, frases, gap=.5):
    parts = []
    for i, t in enumerate(frases):
        a = frase(t); parts += [a] + ([np.zeros(int(gap * SR))] if i < len(frases) - 1 else [])
    x = np.concatenate([np.zeros(int(.08 * SR))] + parts + [np.zeros(int(.15 * SR))])
    w = f'/tmp/{nombre}.wav'
    with wave.open(w, 'wb') as f: f.setnchannels(1); f.setsampwidth(2); f.setframerate(SR); f.writeframes((np.clip(x, -1, 1) * 32767).astype(np.int16).tobytes())
    subprocess.check_call(['ffmpeg', '-v', 'error', '-y', '-i', w, '-af', 'highpass=f=70,acompressor=threshold=-18dB:ratio=3,loudnorm=I=-16', '-ar', '44100', '-b:a', '160k', f'{out}/{nombre}.mp3'])
    print(nombre, round(len(x) / SR, 1))
for c in g['capitulos']: guardar(f"{g['id']}_{c['id']}", [e['texto'] for e in c['escenas']])
for i, s in enumerate(g['shorts']): guardar(f"{g['id']}_short{i + 1}_gancho", [s['gancho']['texto']])
guardar('sub_es', ['¿Quieres saber más? Suscríbete a Chispazo.'])
guardar('final_es', ['El vídeo completo está en el canal. ¡Suscríbete!'])
