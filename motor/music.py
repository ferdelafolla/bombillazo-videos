"""Cama musical original sintetizada (libre de derechos) para Bombillazo."""
import wave
import numpy as np


def music(path, dur, kids):
    """Cama musical original sintetizada (libre de derechos)."""
    sr = 44100
    n = int(sr * dur)
    t = np.arange(n) / sr
    bpm = 104 if kids else 92
    beat = 60 / bpm
    prog = [[0, 4, 7], [9, 12, 16], [5, 9, 12], [7, 11, 14]]  # I vi IV V
    root = 60 if kids else 57
    out = np.zeros(n)
    bar = beat * 4
    for i, start in enumerate(np.arange(0, dur, bar)):
        ch = prog[i % 4]
        s0, s1 = int(start * sr), min(n, int((start + bar) * sr))
        tt = t[s0:s1] - start
        env = np.minimum(1, tt / 0.4) * np.minimum(1, (bar - tt) / 0.4)
        for semi in ch:
            f = 440 * 2 ** ((root + semi - 69 - 12) / 12)
            out[s0:s1] += 0.05 * env * (np.sin(2 * np.pi * f * tt) + 0.3 * np.sin(4 * np.pi * f * tt))
        # arpegio pluck
        for j in range(8):
            ps = start + j * beat / 2
            a0 = int(ps * sr)
            if a0 >= n:
                break
            a1 = min(n, a0 + int(0.35 * sr))
            tp = t[a0:a1] - ps
            note = ch[j % 3] + (12 if j >= 4 else 0)
            f = 440 * 2 ** ((root + note - 69) / 12)
            out[a0:a1] += (0.07 if kids else 0.045) * np.exp(-tp * 9) * np.sin(2 * np.pi * f * tp)
    fade = np.minimum(1, np.minimum(t / 1.0, (dur - t) / 1.5))
    out = np.clip(out * fade, -1, 1)
    pcm = (out * 32767 * 0.8).astype(np.int16)
    with wave.open(path, "wb") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(sr); w.writeframes(pcm.tobytes())
