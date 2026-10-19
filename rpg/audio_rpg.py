"""Banda sonora chiptune para Chispazo Pixel RPG (todo síntesis original, sin muestras):
- música: pulso 12,5/25/50 %, triángulo de 4 bits, ruido LFSR; la "fidelidad" sigue a la época del vídeo
  (1720 = 4 tonos → mono, volumen a pasos y 11 kHz; 2000 = 8-bit mono; hoy = 16-bit estéreo con eco);
- efectos: cada transición tiene SU sonido (pasos, barrido de bits, remolino, puerta, iris, miniatura…),
  más cursor, seleccionar, fanfarria, golpes, dibujo, destellos y guardado;
- voz encima y música con ducking (~-8 dB bajo la voz).
Uso: python3 audio_rpg.py page/data/<ID>.json <render>.ev.json <carpeta_voces> salida.wav
"""
import json, subprocess, sys, wave
import numpy as np
from scipy.signal import butter, sosfilt
from scipy.ndimage import uniform_filter1d

SR = 48000
rng = np.random.default_rng(5)

def lp(x, f): return sosfilt(butter(2, f, 'low', fs=SR, output='sos'), x)
def hp(x, f): return sosfilt(butter(2, f, 'high', fs=SR, output='sos'), x)
def hz(m): return 440.0 * 2 ** ((m - 69) / 12)
NOTE = {'C': 0, 'D': 2, 'E': 4, 'F': 5, 'G': 7, 'A': 9, 'B': 11}
def mi(n): return NOTE[n[0]] + (1 if '#' in n else 0) + 12 * (int(n[-1]) + 1)

def pulse(f, d, duty=.25, vol=1.):
    n = int(d * SR); t = np.arange(n) / SR
    x = np.where((t * f) % 1 < duty, 1., -1.)
    env = np.minimum(1, t / .004) * np.exp(-t * 2.2) * .85 + .15 * np.minimum(1, t / .004)
    env[-min(n, 240):] *= np.linspace(1, 0, min(n, 240))
    return x * env * vol
def tri(f, d, vol=1.):
    n = int(d * SR); t = np.arange(n) / SR
    x = 2 * np.abs(2 * ((t * f) % 1) - 1) - 1
    x = np.round(x * 7.5) / 7.5   # 4 bits
    env = np.ones(n); env[-min(n, 240):] = np.linspace(1, 0, min(n, 240))
    return x * env * vol
_lfsr = None
def noise(d, short=False):
    global _lfsr
    n = int(d * SR)
    if _lfsr is None:
        r = 1; bits = []
        for _ in range(32767): b = ((r >> 0) ^ (r >> (6 if short else 1))) & 1; r = (r >> 1) | (b << 14); bits.append(r & 1)
        _lfsr = np.array(bits, float) * 2 - 1
    idx = (np.arange(n) * 0.35).astype(int) % len(_lfsr)
    return _lfsr[idx]
def add(buf, x, t, g=1.):
    s = int(t * SR)
    if s >= len(buf) or s + len(x) <= 0: return
    if s < 0: x = x[-s:]; s = 0
    e = min(len(buf), s + len(x)); buf[s:e] += x[:e - s] * g

# ——————————————— música ———————————————
BPM = 112; BEAT = 60 / BPM; BAR = BEAT * 4
PROG = [('C', ['C4', 'E4', 'G4']), ('A', ['A3', 'C4', 'E4']), ('F', ['F3', 'A3', 'C4']), ('G', ['G3', 'B3', 'D4'])]
# motivo original (8 corcheas por compás, -1 = silencio)
MOTIF = [['E5', 'G5', 'C6', -1, 'B5', 'G5', 'A5', -1], ['A5', -1, 'G5', 'E5', 'C5', -1, 'E5', -1],
         ['F5', 'A5', 'C6', -1, 'A5', -1, 'G5', 'F5'], ['G5', -1, 'B5', 'D6', 'B5', -1, 'G5', -1]]
def musica(dur):
    n = int(dur * SR) + SR
    lead = np.zeros(n); harm = np.zeros(n); bass = np.zeros(n); drum = np.zeros(n)
    t = 0.; b = 0
    while t < dur + BAR:
        root, ch = PROG[b % 4]; mot = MOTIF[b % 4]
        var = (b // 8) % 3
        for i, m in enumerate(mot):
            if m == -1 or (var == 1 and i % 2): continue
            add(lead, pulse(hz(mi(m) - (12 if var == 2 else 0)), BEAT * .45, .125 if var else .25, .5), t + i * BEAT / 2)
        for i in range(8):   # arpegio de acompañamiento
            add(harm, pulse(hz(mi(ch[i % 3]) + 12), BEAT * .22, .5, .22), t + i * BEAT / 2)
        for i in range(4):
            add(bass, tri(hz(mi(root + '2') if i % 2 == 0 else mi(root + '2') + 7), BEAT * .9, .55), t + i * BEAT)
        for i in range(8):
            if i % 4 == 0: k = lp(noise(.12), 900) * np.exp(-np.arange(int(.12 * SR)) / SR * 30) * .9
            elif i % 4 == 2: k = hp(noise(.1, True), 1500) * np.exp(-np.arange(int(.1 * SR)) / SR * 35) * .5
            else: k = hp(noise(.04), 6000) * np.exp(-np.arange(int(.04 * SR)) / SR * 80) * .25
            add(drum, k, t + i * BEAT / 2)
        t += BAR; b += 1
    return lead[:n], harm[:n], bass[:n], drum[:n]

def eco(x, taps=((.19, .4), (.37, .25)), fb=.35):
    y = x.copy()
    for d, g in taps:
        s = int(d * SR); z = np.zeros_like(x); z[s:] = x[:-s] * g; y += lp(z, 3500)
    s = int(.45 * SR); w = y.copy()
    for k in range(1, 4): z = np.zeros_like(y); z[s * k:] = y[:-s * k] * fb ** k; w += lp(z, 2500)
    return w

# ——————————————— efectos ———————————————
def sweep(f0, f1, d, duty=.5, vol=.5, steps=None):
    n = int(d * SR); t = np.arange(n) / SR
    f = f0 * (f1 / f0) ** (t / d)
    if steps: f = np.round(f / steps) * steps
    ph = np.cumsum(f) / SR
    return np.where(ph % 1 < duty, 1., -1.) * np.exp(-t * 2) * vol * np.minimum(1, t / .003)
def arp(notes, step, d, duty=.25, vol=.45):
    out = np.zeros(int((len(notes) * step + d) * SR))
    for i, m in enumerate(notes): add(out, pulse(hz(m), d, duty, vol), i * step)
    return out
def nburst(d, f=3000, vol=.5, dec=20):
    x = noise(d); x = lp(x, f) if f < 20000 else x
    return x * np.exp(-np.arange(len(x)) / SR * dec) * vol
SFX = {
    'cursor': lambda: pulse(1760, .035, .5, .35),
    'open': lambda: arp([72, 76, 79], .03, .05, .25, .3),
    'select': lambda: arp([84, 91], .05, .08, .5, .4),
    'fanfare': lambda: arp([72, 76, 79, 84, 79, 84, 88], .08, .14, .25, .4),
    'sparkle': lambda: arp([96, 100, 103, 108, 103], .04, .06, .125, .22),
    'draw': lambda: nburst(.5, 5000, .12, 2) * (1 + np.sin(np.arange(int(.5 * SR)) / SR * 70)),
    'battle': lambda: np.concatenate([arp([60, 63, 66, 69, 72, 75], .03, .05, .5, .35)]),
    'hit': lambda: nburst(.2, 2500, .6, 18) + sweep(300, 60, .2, .5, .35),
    'save': lambda: np.concatenate([np.concatenate([pulse(2093, .02, .5, .25), np.zeros(int(.05 * SR))]) for _ in range(8)] + [arp([84, 88, 91, 96], .06, .2, .25, .35)]),
    'step': lambda: lp(noise(.05), 1500) * np.exp(-np.arange(int(.05 * SR)) / SR * 60) * .35,
    # transiciones: cada una suena distinta
    'tr_walk': lambda: arp([67, 72], .12, .05, .5, .18),
    'tr_mosaic': lambda: sweep(1600, 200, .55, .5, .3, steps=80),
    'tr_slide': lambda: lp(noise(.45), 2500) * np.sin(np.linspace(0, np.pi, int(.45 * SR))) * .35,
    'tr_iris': lambda: sweep(220, 1400, .5, .25, .3),
    'tr_thumb': lambda: arp([79, 84, 88], .05, .1, .125, .3),
    'tr_door': lambda: np.concatenate([lp(noise(.3), 300) * .5, sweep(110, 50, .25, .5, .6)]),
    'tr_swirl': lambda: arp(list(range(60, 96, 3)), .025, .05, .5, .35) + np.pad(nburst(.3, 8000, .3, 6), (int(.3 * SR), 0))[:int((12 * .025 + .05) * SR)],
    'tr_whip': lambda: hp(noise(.3), 2000) * np.sin(np.linspace(0, np.pi, int(.3 * SR))) ** 2 * .5,
    'rise': lambda: sweep(300, 1200, .4, .25, .28, steps=16),
    'letters': lambda e=None: np.concatenate([np.concatenate([pulse(hz(84 + (i % 3) * 2), .02, .5, .22), np.zeros(int(.01 * SR))]) for i in range((e or {}).get('n', 8))]),
    'slots': lambda e=None: np.concatenate([np.concatenate([pulse(hz(88 + (i % 2) * 5), .015, .5, .2), np.zeros(int(.03 * SR))]) for i in range(max(3, int((e or {}).get('d', .5) / .045)))]),
    'whoosh': lambda: lp(noise(.25), 3500) * np.sin(np.linspace(0, np.pi, int(.25 * SR))) ** 2 * .4,
    'flash': lambda: np.concatenate([nburst(.08, 7000, .4, 40), arp([91, 96], .04, .06, .5, .2)]),
    'tr_zoomin': lambda: sweep(200, 2400, .6, .5, .3, steps=40) + np.pad(lp(noise(.2), 1200) * .3, (int(.4 * SR), 0))[:int(.6 * SR)],
    'tr_zoomout': lambda: sweep(2000, 180, .6, .25, .3, steps=40),
    'tr_minimo': lambda: sweep(180, 2600, 1.0, .5, .28, steps=60) + np.pad(arp([96, 100, 103], .05, .08, .125, .25), (int(.85 * SR), 0))[:int(1.0 * SR)],
    'tr_maximo': lambda: sweep(2400, 140, 1.0, .25, .28, steps=60) + np.pad(lp(noise(.3), 600) * .4, (int(.7 * SR), 0))[:int(1.0 * SR)],
    'tr_era': lambda: np.concatenate([pulse(hz(m), .1, .5, .35) for m in (84, 79, 76, 72)]),
}

def mp3(path):
    raw = subprocess.check_output(['ffmpeg', '-v', 'error', '-i', path, '-ac', '1', '-ar', str(SR), '-f', 'f32le', '-'])
    return np.frombuffer(raw, np.float32).astype(np.float64)

def main(tl_path, ev_path, vdir, salida):
    tl = json.load(open(tl_path)); evj = json.load(open(ev_path))
    dur = tl['dur']; n = int(dur * SR)
    # voz
    voz = np.zeros(n); cache = {}
    for s in tl['segs']:
        if s['voz'] not in cache: cache[s['voz']] = mp3(f"{vdir}/{s['voz']}.mp3")
        x = cache[s['voz']][int(s['vozDesde'] * SR): int((s['vozDesde'] + s['vozDur']) * SR)].copy()
        k = min(len(x), 480); x[:k] *= np.linspace(0, 1, k); x[-k:] *= np.linspace(1, 0, k)
        add(voz, x, s['start'])
    # música por época
    lead, harm, bass, drum = musica(dur)
    def crush(x, sr=11025, bits=4):
        hold = int(SR / sr); y = np.repeat(x[::hold], hold)[:len(x)]
        return np.round(y * (2 ** (bits - 1))) / (2 ** (bits - 1))
    mono_gb = crush(lead * .9 + bass * .8)
    mono_nes = lead + harm * .8 + bass + drum
    L = eco(lead * .9 + harm * .6 + bass + drum); R = eco(lead * .6 + harm * .9 + bass + drum, taps=((.23, .4), (.41, .25)))
    eras = {'gb': np.zeros(n + SR), 'nes': np.zeros(n + SR), 'snes': np.zeros(n + SR)}
    for e in evj['eras']:
        a, b = int(e['t0'] * SR), int(e['t1'] * SR); eras[e['era']][a:b] = 1
    for k in eras: eras[k] = uniform_filter1d(eras[k], int(.15 * SR))[:n]
    musL = (mono_gb[:n] * eras['gb'] + mono_nes[:n] * eras['nes'] + L[:n] * eras['snes']) * .22
    musR = (mono_gb[:n] * eras['gb'] + mono_nes[:n] * eras['nes'] + R[:n] * eras['snes']) * .22
    fi, fo = int(1 * SR), int(2.5 * SR); ramp = np.ones(n); ramp[:fi] = np.linspace(0, 1, fi); ramp[-fo:] = np.linspace(1, 0, fo)
    # ducking bajo la voz
    env = uniform_filter1d(np.abs(voz), int(.2 * SR)); act = np.clip(env / (np.percentile(env, 90) + 1e-9) * 2, 0, 1)
    duck = 1 - .6 * uniform_filter1d(act, int(.35 * SR))
    musL *= ramp * duck; musR *= ramp * duck
    # efectos
    fx = np.zeros(n)
    for e in evj['ev']:
        f = SFX.get(e['type'])
        if f: add(fx, f(e) if e['type'] in ('letters', 'slots') else f(), e['t'], .4)
    fx = np.tanh(fx * 1.5) / 1.5
    mix = np.stack([voz + musL + fx, voz + musR + fx], 1)
    mix = np.tanh(mix * 1.2) / 1.2
    pk = np.abs(mix).max();
    if pk > .98: mix *= .98 / pk
    pcm = (np.clip(mix, -1, 1) * 32767).astype(np.int16)
    with wave.open(salida, 'wb') as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())
    print('ok', salida, round(dur, 1))

if __name__ == '__main__':
    main(*sys.argv[1:5])
