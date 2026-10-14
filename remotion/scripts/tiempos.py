"""Calcula cuándo empieza cada escena dentro de la voz de cada capítulo.
Uso: python3 tiempos.py guion.json carpeta_voces salida.json
Para un capítulo de N escenas toma los N-1 silencios más largos (en orden) como cortes."""
import json, re, subprocess, sys

g = json.load(open(sys.argv[1])); vdir = sys.argv[2]; out = {}
for cap in g["capitulos"]:
    f = f"{vdir}/{g['id']}_{cap['id']}.mp3"
    r = subprocess.run(["ffmpeg", "-i", f, "-af", "silencedetect=n=-35dB:d=0.12", "-f", "null", "-"], capture_output=True, text=True).stderr
    dur = float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", f]))
    st = [float(x) for x in re.findall(r"silence_start: ([\d.]+)", r)]
    en = [float(x) for x in re.findall(r"silence_end: ([\d.]+)", r)]
    sil = [(e - s, s, e) for s, e in zip(st, en) if s > 0.3 and e < dur - 0.2]
    n = len(cap["escenas"])
    # posición esperada de cada corte según la longitud del texto; se elige, en orden,
    # el silencio que mejor combina duración y cercanía (programación dinámica)
    L = [len(e["texto"]) + 5 * len(re.findall(r"[,:;…]", e["texto"])) + 4 for e in cap["escenas"]]
    exp = [dur * sum(L[: i + 1]) / sum(L) for i in range(n - 1)]
    sil.sort(key=lambda x: x[1])
    def sc(j, k):
        d, s0, e0 = sil[k]
        return d * 4 - abs((s0 + e0) / 2 - exp[j]) / dur * 14
    import functools
    @functools.lru_cache(None)
    def best(j, k):  # cortes j.. usando silencios k..
        if j == n - 1: return (0, ())
        if len(sil) - k < n - 1 - j: return (-1e9, ())
        a = best(j, k + 1)
        b = best(j + 1, k + 1); b = (b[0] + sc(j, k), (k,) + b[1])
        return max(a, b)
    ks = best(0, 0)[1]
    cuts = [sil[k][1] + sil[k][0] * 0.6 for k in ks]
    if len(cuts) < n - 1:  # reparto por longitud de texto si faltan silencios
        L = [len(e["texto"]) for e in cap["escenas"]]; acc = 0; cuts = []
        for l in L[:-1]:
            acc += l; cuts.append(dur * acc / sum(L))
    # inicio de habla y fin de habla de cada escena (para subtítulos)
    lead = en[0] if st and st[0] < 0.05 else 0.0
    out[cap["id"]] = {"dur": round(dur, 3), "lead": round(lead, 3), "cortes": [round(c, 3) for c in cuts]}
    print(cap["id"], n, round(dur, 2), [round(c, 2) for c in cuts], "sil:", len(sil))
json.dump(out, open(sys.argv[3], "w"), indent=1)
