#!/bin/sh
# Une vídeo mudo + mezcla WAV con loudnorm a −14 LUFS / TP −1.2 en dos pasadas (parámetros de lemo core/render/mux.sh).
# Uso: sh audio/unir.sh video.mp4 mezcla.wav salida.mp4
set -e
V="$1"; A="$2"; O="$3"
J=$(ffmpeg -hide_banner -nostats -i "$A" -af loudnorm=I=-14:TP=-1.2:LRA=11:print_format=json -f null - 2>&1 | sed -n '/^{/,/^}/p')
g() { echo "$J" | grep "\"$1\"" | sed 's/.*: "\(.*\)".*/\1/'; }
F="loudnorm=I=-14:TP=-1.2:LRA=11:measured_I=$(g input_i):measured_TP=$(g input_tp):measured_LRA=$(g input_lra):measured_thresh=$(g input_thresh):offset=$(g target_offset):linear=true,aresample=48000"
ffmpeg -v error -y -i "$V" -i "$A" -map 0:v -map 1:a -c:v copy -af "$F" -c:a aac -b:a 192k -movflags +faststart -shortest "$O"
ffmpeg -hide_banner -nostats -i "$O" -map 0:a -af ebur128=peak=true -f null - 2>&1 | grep -E "^\s+(I|Peak):" | tr -s ' ' | tr '\n' ' '; echo " -> $O"
