// Exporta la línea de tiempo y los efectos de cada composición a JSON (para la mezcla de audio).
// Uso: node --experimental-strip-types scripts/exportar.ts salida_dir
import fs from 'node:fs';
import { construir, efectos } from '../src/timeline.ts';
const d = JSON.parse(fs.readFileSync(new URL('../src/datos.json', import.meta.url), 'utf8'));
const out = process.argv[2];
fs.mkdirSync(out, { recursive: true });
const comps: [string, 'largo' | 'short', number][] = [['Largo', 'largo', 0], ...d.guion.shorts.map((_: unknown, i: number) => [`Short${i + 1}`, 'short', i])];
for (const [id, f, s] of comps) {
  const { segs, dur } = construir(d, f, s);
  fs.writeFileSync(`${out}/${id}.json`, JSON.stringify({ dur, segs: segs.map(({ escena, ...r }) => ({ ...r, tipo: escena?.tipo, texto: escena?.texto })), sfx: efectos(segs) }, null, 1));
  console.log(id, dur.toFixed(1), segs.length);
}
