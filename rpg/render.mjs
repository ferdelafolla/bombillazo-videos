// Render del vídeo Pixel RPG: abre la página, pide cada fotograma (búfer de 320×180 o 180×320) y lo pasa a ffmpeg ×6 vecino más cercano.
// Uso: node render.mjs <Largo|Short1|Short2> <salida.mp4> [--v] [--desde s --hasta s] [--png t1,t2,...]
import { chromium } from '/opt/npm-tools/node_modules/playwright/index.mjs';
import { spawn } from 'child_process'; import fs from 'fs'; import http from 'http'; import path from 'path';
const [id, outPath, ...rest] = process.argv.slice(2);
const V = rest.includes('--v'), opt = k => { const i = rest.indexOf(k); return i >= 0 ? rest[i + 1] : null; };
const ROOT = path.resolve('page');
const MIME = { '.js': 'text/javascript', '.json': 'application/json', '.html': 'text/html', '.jpg': 'image/jpeg' };
const srv = http.createServer((q, r) => { const f = path.join(ROOT, decodeURIComponent(q.url.split('?')[0])); fs.readFile(f, (e, d) => { if (e) { r.writeHead(404); r.end(); return; } r.writeHead(200, { 'content-type': MIME[path.extname(f)] || 'application/octet-stream' }); r.end(d); }); }).listen(0);
const port = srv.address().port;
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell' });
const page = await browser.newPage();
page.on('pageerror', e => console.error('PAGE', e));
await page.goto(`http://localhost:${port}/index.html?id=${id}${V ? '&v=1' : ''}`);
await page.waitForFunction(() => window.READY || window.ERR, null, { timeout: 60000 });
const err = await page.evaluate(() => window.ERR); if (err) { console.error(err); process.exit(1); }
const [W, H] = await page.evaluate(() => window.SIZE), DUR = await page.evaluate(() => window.DUR);
fs.writeFileSync(outPath.replace(/\.mp4$/, '') + '.ev.json', JSON.stringify(await page.evaluate(() => ({ dur: window.DUR, ev: window.EV, eras: window.ERAS }))));
const png = opt('--png');
if (png) {   // fotogramas sueltos para revisar
  for (const t of png.split(',').map(Number)) {
    const b = Buffer.from(await page.evaluate(t => window.grab(t), t), 'base64');
    fs.writeFileSync(outPath.replace(/\.mp4$/, '') + `_${t.toFixed(1)}.jpg`, b);
  }
  await browser.close(); srv.close(); process.exit(0);
}
const FPS = 24, t0 = +(opt('--desde') || 0), t1 = +(opt('--hasta') || DUR), N = Math.round((t1 - t0) * FPS);
const ff = spawn('ffmpeg', ['-v', 'error', '-y', '-f', 'image2pipe', '-c:v', 'mjpeg', '-r', String(FPS), '-i', '-',
  '-c:v', 'libx264', '-preset', 'medium', '-crf', '18', '-pix_fmt', 'yuv420p', outPath], { stdio: ['pipe', 'inherit', 'inherit'] });
const t00 = Date.now();
for (let i = 0; i < N; i++) {
  const b = Buffer.from(await page.evaluate(t => window.grab(t), t0 + i / FPS), 'base64');
  if (!ff.stdin.write(b)) await new Promise(r => ff.stdin.once('drain', r));
  if (i % 240 === 0) console.log(`${i}/${N} ${((Date.now() - t00) / 1000).toFixed(0)}s`);
}
ff.stdin.end(); await new Promise(r => ff.on('close', r));
await browser.close(); srv.close(); console.log('ok', outPath, N, 'frames');
