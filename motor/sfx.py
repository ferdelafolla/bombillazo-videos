"""Efectos de sonido sintetizados (libres de derechos) para Chispazo, todos en la misma sala.

Uso: python3 sfx.py eventos.json salida.wav duracion
Eventos (window.SFX del motor): pen (rotulador sobre papel, con su duración), whoosh (transición),
swell (transición larga), tap (pulsar el botón), ding (suscrito).
"""
import json
import sys
import wave

import numpy as np
from scipy.signal import butter, sosfilt, fftconvolve

SR = 44100
rng = np.random.default_rng(7)


def bp(x, lo, hi, order=2):
    sos = butter(order, [lo / (SR / 2), hi / (SR / 2)], btype="band", output="sos")
    return sosfilt(sos, x)


def pen(d, length):
    n = max(1, int(d * SR))
    u = np.linspace(0, 1, n)
    speed = np.sin(np.pi * u) ** 0.8  # lento-rápido-lento, como el trazo
    noise = rng.standard_normal(n)
    hiss = bp(noise, 2200, 7200) * (0.6 + 0.4 * speed)
    body = bp(rng.standard_normal(n), 500, 1500) * 0.5
    grains = (rng.random(n) < 0.004 * speed) * rng.standard_normal(n) * 0.8  # fibras del papel
    tick = np.zeros(n)
    k = min(n, int(0.006 * SR))
    tick[:k] = np.hanning(2 * k)[:k][::-1] * 0.9 * rng.standard_normal(k)
    amp = min(1.0, (length / 900) ** 0.5)
    return (hiss + body + bp(grains, 1500, 6000) + tick) * speed * 0.16 * amp


def whoosh(d=0.38, lo=500, hi=2600):
    n = int(d * SR)
    u = np.linspace(0, 1, n)
    noise = rng.standard_normal(n)
    out = np.zeros(n)
    seg = 8
    for i in range(seg):  # barrido del filtro de grave a agudo
        a, b = i * n // seg, (i + 1) * n // seg
        f = lo + (hi - lo) * (i / (seg - 1))
        out[a:b] = bp(noise, f * 0.6, min(f * 1.6, 15000))[a:b]
    env = np.sin(np.pi * u) ** 1.5
    return out * env * 0.22


def tap():
    n = int(0.12 * SR)
    t = np.arange(n) / SR
    knock = (np.sin(2 * np.pi * 820 * t) + 0.5 * np.sin(2 * np.pi * 1730 * t)) * np.exp(-t * 55)
    click = bp(rng.standard_normal(n), 2000, 8000) * np.exp(-t * 180)
    return (knock * 0.35 + click * 0.25)


def ding():
    n = int(0.9 * SR)
    t = np.arange(n) / SR
    tone = (np.sin(2 * np.pi * 1318.5 * t) + 0.6 * np.sin(2 * np.pi * 1975.5 * t) + 0.25 * np.sin(2 * np.pi * 2637 * t))
    return tone * np.exp(-t * 5.5) * np.minimum(1, t / 0.004) * 0.12


def room(x):
    # una sola sala para todo: respuesta corta de ruido con caída exponencial
    n = int(0.45 * SR)
    t = np.arange(n) / SR
    ir = rng.standard_normal(n) * np.exp(-t * 11)
    ir = bp(ir, 300, 9000)
    ir /= np.sqrt(np.sum(ir ** 2))
    wet = fftconvolve(x, ir)[: len(x)]
    return x * 0.82 + wet * 0.28


def main(events_path, out_path, dur):
    ev = json.load(open(events_path))
    n = int(float(dur) * SR) + SR
    out = np.zeros(n)
    last_pen = -1
    for e in ev:
        t0 = int(max(0, e["t"]) * SR)
        kind = e["type"]
        if kind == "pen":
            if e["t"] - last_pen < 0.025:  # trazos simultáneos: no apilar
                continue
            last_pen = e["t"]
            s = pen(e.get("d", 0.3), e.get("len", 600))
        elif kind == "whoosh":
            s = whoosh()
        elif kind == "swell":
            s = whoosh(0.7, 300, 1800) * 1.1
        elif kind == "tap":
            s = tap()
        elif kind == "ding":
            s = ding()
        else:
            continue
        end = min(n, t0 + len(s))
        out[t0:end] += s[: end - t0]
    out = room(out)
    peak = np.max(np.abs(out)) or 1
    out = out / peak * 0.25  # techo bajo: la voz manda
    pcm = (np.clip(out, -1, 1) * 32767).astype(np.int16)
    with wave.open(out_path, "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(pcm.tobytes())


if __name__ == "__main__":
    main(*sys.argv[1:4])
