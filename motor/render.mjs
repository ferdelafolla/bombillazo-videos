#!/usr/bin/env node
// Renderiza un vídeo Bombillazo fotograma a fotograma con Chromium headless.
// Uso: node render.mjs videos/xxx.js salida/xxx.mp4 [--voz voz.mp3] [--sin-musica] [--preview]
import { chromium } from '/opt/npm-tools/node_modules/playwright/index.mjs';
import { spawn, execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const FPS = 24; // 24 fps con animación posterizada a 12 (estilo tinta)
const args = process.argv.slice(2);
const opt = (k) => { const i = args.indexOf(k); if (i < 0) return null; const v = args[i + 1]; args.splice(i, 2); return v; };
const flag = (k) => { const i = args.indexOf(k); if (i < 0) return false; args.splice(i, 1); return true; };
let voice = opt('--voz');
const noSub = flag('--sin-suscripcion'); // no insertar la pausa de suscripción a mitad de vídeo
const noMusic = flag('--sin-musica');
const preview = flag('--preview'); // solo unos fotogramas sueltos en PNG
const at = opt('--en'); // tiempos concretos para --preview, p. ej. 1.5,6,10
const manualCuts = opt('--cortes'); // cortes de escena a mano (s), p. ej. 1.5,3.3,4.9 (n-1 valores)
const [videoJs, outMp4] = args.map((p) => path.resolve(p));

function probe(p) {
  return parseFloat(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', p]).toString());
}

// --- sincronía con la voz: amplitud por fotograma y cortes por silencios
function voiceAnalysis(p, wordCounts, manual) {
  const nScenes = wordCounts.length;
  const raw = execFileSync('ffmpeg', ['-v', 'error', '-i', p, '-ac', '1', '-ar', '16000', '-f', 's16le', '-'], { maxBuffer: 1 << 28 });
  const s = new Int16Array(raw.buffer, raw.byteOffset, raw.length / 2);
  const per = 16000 / FPS;
  const amp = [];
  for (let i = 0; i < s.length; i += per) {
    let acc = 0; const end = Math.min(s.length, i + per);
    for (let j = i; j < end; j++) acc += s[j] * s[j];
    amp.push(Math.sqrt(acc / Math.max(1, end - i)) / 32768);
  }
  const peak = [...amp].sort((a, b) => a - b)[Math.floor(amp.length * 0.97)] || 1;
  const A = amp.map((v) => Math.min(1, v / peak));
  // pausas detectadas por ffmpeg
  const det = execFileSync('sh', ['-c', `ffmpeg -v info -i "${p}" -af silencedetect=noise=-35dB:d=0.15 -f null - 2>&1 | grep silence_end || true`]).toString();
  const sil = [...det.matchAll(/silence_end: ([\d.]+) \| silence_duration: ([\d.]+)/g)].map((m) => ({ mid: +m[1] - +m[2] / 2, len: +m[2] }));
  const dur = A.length / FPS;
  // cada corte: la pausa más larga cerca de donde "debería" acabar la escena según sus palabras
  const words = wordCounts; const totW = words.reduce((a, b) => a + b, 0);
  const cuts = []; let acc = 0, last = 0;
  for (let i = 0; i < nScenes - 1; i++) {
    acc += words[i];
    const expected = (acc / totW) * dur;
    const cands = sil.filter((s) => s.mid > last + 0.6 && s.mid < dur - 0.5);
    let best = null, bestScore = -1e9;
    for (const s of cands) { const sc = s.len - 0.35 * Math.abs(s.mid - expected); if (sc > bestScore) { bestScore = sc; best = s; } }
    const c = best ? best.mid : expected;
    cuts.push(c); last = c;
  }
  const bounds = [0, ...(manual && manual.length === nScenes - 1 ? manual : cuts), dur + 0.3];
  const timing = [];
  for (let i = 0; i < nScenes; i++) timing.push({ start: bounds[i] ?? dur, dur: Math.max(0.8, (bounds[i + 1] ?? dur) - (bounds[i] ?? dur)) });
  return { amp: A, timing, dur };
}

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
page.on('pageerror', (e) => console.error('PAGE ERROR', e.message));
await page.goto('file://' + path.join(HERE, 'engine', 'template.html'));
await page.evaluate(() => document.fonts.ready);

let nScenes = 0;
if (voice) {
  // contamos escenas cargando el guion en modo "sólo contar"
  nScenes = await page.evaluate(async (src) => {
    let n = [], meta = {}; const real = window.VIDEO; window.VIDEO = (s) => { n = s.escenas.map((e) => e.texto.split(/\s+/).length); meta = { canal: s.canal, suscripcion: s.suscripcion, lang: s.lang, titulo: s.titulo, subVoz: s.subVoz }; };
    const sc = document.createElement('script'); sc.src = src; document.head.appendChild(sc);
    await new Promise((r) => (sc.onload = r)); window.VIDEO = real; return { n, meta };
  }, 'file://' + videoJs).then((r) => { globalThis.META = r.meta; return r.n; });
  let va = voiceAnalysis(voice, nScenes, manualCuts ? manualCuts.split(',').map(Number) : null);
  // ---- pausa de suscripción a mitad de vídeo: se inserta la frase "Si quieres saber más, ¡suscríbete!" en un corte de escena
  // cercano al 45 % del vídeo, la voz se alarga y el motor pinta la tarjeta central (window.SUB).
  const M = globalThis.META || {};
  const lang = M.lang || (/^[¿¡]|[áéíóúñ]/i.test(M.titulo || '') ? 'es' : 'en');
  const clip = path.join(HERE, 'voces', `sub_${M.subVoz || lang}.mp3`);
  let SUB = null;
  if (!noSub && M.canal !== 'peques' && M.suscripcion !== false && nScenes.length >= 4 && fs.existsSync(clip)) {
    const starts = va.timing.map((t) => t.start);
    let k = 2, bd = 1e9;
    for (let i = 2; i <= nScenes.length - 2; i++) { const d = Math.abs(starts[i] - va.dur * 0.45); if (d < bd) { bd = d; k = i; } }
    const cutT = starts[k];
    const tmpd = fs.mkdtempSync(path.join(path.dirname(outMp4), '.sub_'));
    const a = path.join(tmpd, 'a.wav'), m = path.join(tmpd, 'm.wav'), b = path.join(tmpd, 'b.wav'), nv = path.join(tmpd, 'voz.wav');
    execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', voice, '-t', String(cutT), '-ar', '44100', '-ac', '1', a]);
    execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', clip, '-af', 'silenceremove=start_periods=1:start_threshold=-45dB,areverse,silenceremove=start_periods=1:start_threshold=-45dB,areverse,adelay=350|350,apad=pad_dur=0.6', '-ar', '44100', '-ac', '1', m]);
    execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-ss', String(cutT), '-i', voice, '-ar', '44100', '-ac', '1', b]);
    execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', a, '-i', m, '-i', b, '-filter_complex', '[0][1][2]concat=n=3:v=0:a=1', nv]);
    const L = probe(m);
    const cuts = va.timing.slice(1).map((t) => t.start).map((c) => (c >= cutT - 0.01 ? c + L : c));
    voice = nv;
    va = voiceAnalysis(voice, nScenes, cuts);
    SUB = { start: cutT, dur: L, lang };
    process.on('exit', () => { try { fs.rmSync(tmpd, { recursive: true, force: true }); } catch (e) { /* nada */ } });
    console.log(`Suscripción a mitad: ${cutT.toFixed(2)} s (+${L.toFixed(2)} s, ${path.basename(clip)})`);
  }
  await page.reload();
  await page.evaluate(({ amp, timing, sub }) => { window.AMP = amp; window.TIMING = timing; window.SUB = sub; }, { ...va, sub: SUB });
  console.log('Escenas:', va.timing.map((t) => t.dur.toFixed(2)).join(' | '));
}
await page.addScriptTag({ path: videoJs });
await page.evaluate(() => document.fonts.ready);
const total = await page.evaluate(() => window.TOTAL);
const nframes = Math.ceil(total * FPS);
console.log(`Duración ${total.toFixed(1)} s, ${nframes} fotogramas`);

if (preview) {
  const times = at ? at.split(',').map(Number) : [0.6, total * 0.2, total * 0.4, total * 0.6, total * 0.8, total - 1];
  for (const [i, t] of times.entries()) {
    await page.evaluate(({ a, b }) => { for (let x = a; x <= b; x += 1 / 60) window.seek(x); window.seek(b); }, { a: Math.max(0, t - 0.5), b: t });
    await page.screenshot({ path: outMp4.replace(/\.mp4$/, `_p${i}.png`) });
  }
  await browser.close();
  process.exit(0);
}

const tmp = outMp4 + '.video.mp4';
const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-',
  '-c:v', 'libx264', '-preset', 'medium', '-crf', '17', '-pix_fmt', 'yuv420p', '-r', String(FPS), tmp], { stdio: ['pipe', 'inherit', 'inherit'] });
for (let f = 0; f < nframes; f++) {
  await page.evaluate((t) => window.seek(t), f / FPS);
  const buf = await page.screenshot({ type: 'jpeg', quality: 95 });
  if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once('drain', r));
  if (f % 150 === 0) console.log(`  fotograma ${f}/${nframes}`);
}
ff.stdin.end();
await new Promise((r) => ff.on('close', r));
await browser.close();

// audio: voz + música original
const canal = fs.readFileSync(videoJs, 'utf8').match(/canal:\s*'(\w+)'/)[1];
const inputs = ['-i', tmp];
let fc = null; const maps = ['-map', '0:v'];
const mus = outMp4 + '.music.wav';
if (!noMusic) {
  execFileSync('python3', ['-c', `import sys; sys.path.insert(0, ${JSON.stringify(HERE)}); from music import music; music(${JSON.stringify(mus)}, ${total}, ${canal === 'peques' ? 'True' : 'False'})`]);
  inputs.push('-i', mus);
}
if (voice) inputs.push('-i', path.resolve(voice));
if (voice && !noMusic) { fc = '[1:a]volume=0.28[m];[2:a]volume=1.0[v];[m][v]amix=inputs=2:duration=first:normalize=0[a]'; maps.push('-map', '[a]'); }
else if (voice || !noMusic) maps.push('-map', '1:a');
execFileSync('ffmpeg', ['-y', '-loglevel', 'error', ...inputs, ...(fc ? ['-filter_complex', fc] : []), ...maps,
  '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-t', String(total), '-movflags', '+faststart', outMp4]);
for (const p of [tmp, mus]) if (fs.existsSync(p)) fs.unlinkSync(p);
console.log('OK', outMp4);
