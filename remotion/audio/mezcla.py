"""Banda sonora de un vídeo Chispazo con la biblioteca de audio de Lemo-Opuscar (MIT, audio/lemo/):
voz (trozos de cada capítulo colocados según la línea de tiempo), música original con cuerdas pulsadas
modeladas (kalimba, guitarra de nailon y contrabajo en pizzicato), efectos (whoosh, pop, ding de lemo +
rotulador propio), ducking bajo la voz. Sale un WAV estéreo 48 kHz; la normalización a −14 LUFS la hace mux.sh.

Uso: python3 audio/mezcla.py linea_tiempo.json carpeta_voces salida.wav [semilla]
"""
import json, os, subprocess, sys
import numpy as np
from scipy.ndimage import uniform_filter1d

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from lemo import sfx as S  # noqa: E402
from lemo import pluck as PL  # noqa: E402
import pen as PEN  # noqa: E402

SR = S.SR


def mp3(path):
    raw = subprocess.check_output(['ffmpeg', '-v', 'error', '-i', path, '-ac', '1', '-ar', str(SR), '-f', 'f32le', '-'])
    return np.frombuffer(raw, np.float32).astype(np.float64)


# ---------- música: I–vi–IV–V en Do, 96 bpm, alegre y ligera
ACORDES = [('C2', ['C4', 'E4', 'G4'], ['C5', 'D5', 'E5', 'G5', 'A5']),
           ('A1', ['A3', 'C4', 'E4'], ['A4', 'C5', 'E5', 'G5', 'A5']),
           ('F1', ['F3', 'A3', 'C4'], ['F4', 'A4', 'C5', 'D5', 'F5']),
           ('G1', ['G3', 'B3', 'D4'], ['G4', 'B4', 'D5', 'E5', 'G5'])]


def musica(dur, semilla=1):
    rng = np.random.default_rng(semilla)
    beat = 60 / 96; bar = beat * 4
    n = int((dur + 3) * SR); out = np.zeros((n, 2))
    cache = {}

    def nota(inst, p, d, vel):
        vel = round(vel * 20) / 20; k = (inst, p, None if d is None else round(d, 2), vel)
        if k not in cache: cache[k] = PL.pluck(inst, p, d, vel)
        return cache[k]

    def strum(p3, d, vel):
        k = ('strum', tuple(p3), round(d, 2), round(vel, 2))
        if k not in cache: cache[k] = PL.strum('nylon_guitar', p3, d, vel)
        return cache[k]

    # motivos de kalimba (índices sobre la escala del acorde; -1 = silencio), se repiten con variaciones
    motivos = [[0, -1, 2, -1, 3, 2, -1, 1], [4, -1, 3, -1, 2, -1, 0, -1], [2, 3, -1, 4, -1, 3, 2, -1], [-1, 0, -1, 2, 1, -1, 0, -1]]
    t = 0.0; b = 0
    while t < dur + bar:
        raiz, triada, esc = ACORDES[b % 4]
        sec = (b // 8) % 3  # secciones: A (completa), B (sin melodía, más aire), A'
        S.add(out, nota('upright_bass_pizz', raiz, beat * 1.6, .8), t, .55)
        S.add(out, nota('upright_bass_pizz', raiz if b % 2 else PL.midi(raiz) + 7, beat * 1.2, .65), t + beat * 2, .45)
        for k in (1, 3):
            S.add(out, strum(triada, beat * 0.8, .55 if k == 1 else .5), t + beat * k, .32, pan=-.3)
        if sec != 1 or b % 2 == 0:
            mot = motivos[(b + sec) % 4]
            for i, m in enumerate(mot):
                if m < 0 or (sec == 2 and rng.random() < .2): continue
                S.add(out, nota('kalimba', esc[m], None, .55 + .2 * rng.random()), t + i * beat / 2 + rng.normal(0, .006), .42, pan=.35)
        if b % 8 == 7:  # adorno de caja de música al cerrar cada frase
            S.add(out, nota('music_box', esc[-1], None, .5), t + beat * 3.5, .25, pan=.5)
        t += bar; b += 1
    out = out[: int(dur * SR)]
    fi, fo = int(1.2 * SR), int(2.5 * SR)
    out[:fi] *= np.linspace(0, 1, fi)[:, None]
    out[-fo:] *= np.linspace(1, 0, fo)[:, None] ** 1.5
    return out


def main(tl_path, vdir, salida, semilla=1):
    tl = json.load(open(tl_path))
    dur = tl['dur']; n = int(dur * SR)
    voz = np.zeros(n)
    cache = {}
    for s in tl['segs']:
        if s['voz'] not in cache: cache[s['voz']] = mp3(f"{vdir}/{s['voz']}.mp3")
        x = cache[s['voz']][int(s['vozDesde'] * SR): int((s['vozDesde'] + s['vozDur']) * SR)].copy()
        k = min(len(x), int(0.01 * SR)); x[:k] *= np.linspace(0, 1, k); x[-k:] *= np.linspace(1, 0, k)
        a = int(s['start'] * SR); e = min(n, a + len(x)); voz[a:e] += x[: e - a]
    # efectos
    fx = np.zeros((n, 2))
    pens = []
    for ev in tl['sfx']:
        t = ev['t']; ty = ev['type']
        if ty == 'whoosh': S.add(fx, S.whoosh(.42, .5), t)
        elif ty == 'swell': S.add(fx, S.whoosh(.8, .6), t)
        elif ty == 'tap': S.add(fx, S.pop(.35), t); S.add(fx, S.click(1.2, .25), t)
        elif ty == 'ding': S.add(fx, S.ding(.3), t)
        elif ty == 'pen': pens.append(ev)
    for ev in pens:  # rotulador (síntesis propia, en la misma sala)
        x = PEN.pen(ev.get('d', .6), ev.get('len', 600))
        x = np.interp(np.arange(int(len(x) * SR / PEN.SR)) * PEN.SR / SR, np.arange(len(x)), x) * 2.2
        S.add(fx, x, ev['t'], 1.0)
    # música con ducking bajo la voz
    mus = musica(dur, semilla)
    env = uniform_filter1d(np.abs(voz), int(0.25 * SR))
    act = np.clip(env / (np.percentile(env, 90) + 1e-9) * 2, 0, 1)
    act = uniform_filter1d(act, int(0.4 * SR))
    g = 0.30 - 0.17 * act
    mix = np.zeros((n, 2))
    mix += voz[:, None] * 1.0
    mix += mus * g[:, None]
    mix += fx * 0.45
    pk = np.abs(mix).max()
    if pk > .98: mix *= .98 / pk
    pcm = (np.clip(mix, -1, 1) * 32767).astype(np.int16)
    import wave
    with wave.open(salida, 'wb') as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())
    print('ok', salida, round(dur, 1), 's')


if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2], sys.argv[3], int(sys.argv[4]) if len(sys.argv) > 4 else 1)
