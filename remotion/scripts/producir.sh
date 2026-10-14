#!/bin/sh
# Produce todas las piezas de un guion ya preparado (src/datos.json):
#   largo + shorts (vídeo mudo con Remotion) → banda sonora (audio/mezcla.py) → −14 LUFS (audio/unir.sh) → miniatura.
# Uso: sh scripts/producir.sh <id> <carpeta_salida> [Largo Short1 Short2 ...]
set -e
R=$(cd "$(dirname "$0")/.." && pwd); ID="$1"; OUT="$2"; shift 2
B=${CHROME:-/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell}
COMPS=${*:-"Largo Short1 Short2"}
mkdir -p "$OUT" "$R/tl"
cd "$R"
node --experimental-strip-types --no-warnings scripts/exportar.ts tl
npx remotion bundle --out-dir="$OUT/bundle" >/dev/null 2>&1
for C in $COMPS; do
  echo "== $C $(date +%H:%M)"
  npx remotion render "$OUT/bundle" "$C" "$OUT/${C}_mudo.mp4" --muted --crf=17 --browser-executable="$B" 2>&1 | grep -E "Encoded|Error" | tail -1
  python3 audio/mezcla.py "tl/$C.json" public/voces "$OUT/${C}.wav" $(echo "$ID$C" | cksum | cut -c1-4)
  sh audio/unir.sh "$OUT/${C}_mudo.mp4" "$OUT/${C}.wav" "$OUT/${ID}_${C}.mp4"
done
npx remotion still "$OUT/bundle" Miniatura "$OUT/${ID}_miniatura.png" --scale=1 --browser-executable="$B" >/dev/null 2>&1 || true
echo "== fin $(date +%H:%M)"
