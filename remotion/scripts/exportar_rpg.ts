// Exporta la línea de tiempo COMPLETA (con los datos de cada escena) para el motor Pixel RPG.
import fs from 'node:fs';
import { construir, efectos } from '../src/timeline.ts';
const d = JSON.parse(fs.readFileSync(new URL('../src/datos.json', import.meta.url), 'utf8'));
const out = process.argv[2]; fs.mkdirSync(out, { recursive: true });
const comps: [string, 'largo' | 'short', number][] = [['Largo', 'largo', 0], ...d.guion.shorts.map((_: unknown, i: number) => [`Short${i + 1}`, 'short', i])];
for (const [id, f, s] of comps) {
  const { segs, dur } = construir(d, f, s);
  fs.writeFileSync(`${out}/${id}.json`, JSON.stringify({ id, formato: f, dur, serie: d.guion.serie, titulo: d.guion.titulo, segs, sfx: efectos(segs) }));
  console.log(id, dur.toFixed(1), segs.length);
}
fs.writeFileSync(`${out}/amp.json`, JSON.stringify(d.amp));
