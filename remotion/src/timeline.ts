// Línea de tiempo de un vídeo Chispazo: lista de segmentos (escenas, pausa de suscripción, cierre de short).
// Funciones puras, sin imports: las usan la composición de Remotion y scripts/exportar.ts (audio y efectos).

export const FPS = 24;

export type Escena = {
  texto: string;
  tipo: 'titulo' | 'tarjetas' | 'cifra' | 'grafica' | 'comparar' | 'icono' | 'suscribete' | 'foto';
  foto?: string; // public/fotos/<foto>.jpg (preparada con scripts/foto_tinta.py)
  credito?: string;
  encuadre?: string; // object-position de la foto, p. ej. '50% 20%'
  destacar?: string[];
  icono?: string;
  texto_grande?: string;
  items?: string[];
  valor?: string;
  etiqueta?: string;
  forma?: 'sube' | 'cae' | 'pico' | 'suave';
  etiquetas?: string[];
  izq?: string;
  der?: string;
};
export type Capitulo = { id: string; escenas: Escena[] };
export type Guion = {
  id: string;
  titulo: string;
  serie: string;
  capitulos: Capitulo[];
  shorts: { capitulos: string[]; titulo: string; remate?: string; escenas?: number[] }[]; // escenas: índices dentro de los capítulos elegidos (fragmento corto)
};
export type Tiempos = Record<string, { dur: number; lead: number; cortes: number[] }>;
export type Datos = { guion: Guion; tiempos: Tiempos; amp: Record<string, number[]>; subDur: number; finalDur: number };

export type Seg = {
  kind: 'escena' | 'sub' | 'final';
  start: number; // segundos en el vídeo
  dur: number;
  voz: string; // nombre del mp3 en public/voces (sin extensión)
  vozDesde: number; // segundo dentro del mp3
  vozDur: number;
  escena?: Escena;
  cap?: string;
  idx: number; // índice entre las escenas (para la posición en el mundo)
  remate?: string; // pregunta que lleva del short al vídeo largo
};

export type Formato = 'largo' | 'short';

const PAD_CAP = 0.45; // respiro al final de cada capítulo
const PAD_INI = 0.25;

export function construir(d: Datos, formato: Formato, short = 0): { segs: Seg[]; dur: number } {
  const { guion, tiempos } = d;
  const caps = formato === 'largo' ? guion.capitulos : guion.capitulos.filter((c) => guion.shorts[short].capitulos.includes(c.id));
  const escenas: Seg[] = [];
  let idx = 0;
  for (const c of caps) {
    const tm = tiempos[c.id];
    const b = [0, ...tm.cortes, tm.dur];
    c.escenas.forEach((e, i) => {
      const desde = i === 0 ? 0 : b[i];
      const hasta = b[i + 1];
      const ultima = i === c.escenas.length - 1;
      escenas.push({ kind: 'escena', start: 0, dur: hasta - desde + (ultima ? PAD_CAP : 0), voz: `${guion.id}_${c.id}`, vozDesde: desde, vozDur: hasta - desde, escena: e, cap: c.id, idx: idx++ });
    });
  }
  // Short: solo el fragmento álgido (unas pocas escenas), con respiro al final de cada escena suelta
  if (formato === 'short' && guion.shorts[short].escenas) {
    const sel = guion.shorts[short].escenas!;
    const elegidas = escenas.filter((_, i) => sel.includes(i));
    elegidas.forEach((s, i) => { s.dur = s.vozDur + (i === elegidas.length - 1 ? PAD_CAP : 0.25); s.idx = i; });
    escenas.splice(0, escenas.length, ...elegidas);
  }
  // pausa de suscripción a mitad de vídeo: en el corte de capítulo (largo) o de escena (short) más cercano a la mitad
  const total = escenas.reduce((a, s) => a + s.dur, 0);
  let acc = 0, mejor = -1, dist = 1e9;
  escenas.forEach((s, i) => {
    acc += s.dur;
    const corte = formato === 'largo' ? i < escenas.length - 1 && escenas[i + 1].cap !== s.cap : i < escenas.length - 1;
    if (corte && Math.abs(acc - total / 2) < dist) { dist = Math.abs(acc - total / 2); mejor = i; }
  });
  const segs: Seg[] = [];
  escenas.forEach((s, i) => {
    segs.push(s);
    if (i === mejor && (formato === 'largo' || total > 25)) segs.push({ kind: 'sub', start: 0, dur: d.subDur + 0.9, voz: 'sub_es', vozDesde: 0, vozDur: d.subDur, idx: -1 });
  });
  if (formato === 'short') segs.push({ kind: 'final', start: 0, dur: d.finalDur + 1.4, voz: 'final_es', vozDesde: 0, vozDur: d.finalDur, idx: -1, remate: guion.shorts[short].remate });
  let t = PAD_INI;
  for (const s of segs) { s.start = t; t += s.dur; }
  return { segs, dur: t + 0.15 };
}

// ---- tiempos internos de cada escena (los comparten el dibujo y los efectos de sonido)
export const DIBUJO = { retraso: 0.12, icono: 1.3 };
export const POP = { primero: 0.45, paso: 0.38 };

export type Sfx = { t: number; type: 'pen' | 'whoosh' | 'swell' | 'tap' | 'ding'; d?: number; len?: number };

export function efectos(segs: Seg[]): Sfx[] {
  const ev: Sfx[] = [];
  let prev: Seg | null = null;
  for (const s of segs) {
    if (s.kind !== 'escena') {
      ev.push({ t: s.start - 0.05, type: 'swell' });
      if (s.kind === 'sub') { ev.push({ t: s.start + s.dur * 0.62, type: 'tap' }); ev.push({ t: s.start + s.dur * 0.62 + 0.05, type: 'ding' }); }
      prev = s;
      continue;
    }
    if (prev) ev.push({ t: s.start - 0.35, type: 'whoosh' });
    const e = s.escena!;
    const t0 = s.start + DIBUJO.retraso;
    if (e.tipo === 'suscribete') {
      ev.push({ t: s.start + s.dur * 0.55, type: 'tap' }, { t: s.start + s.dur * 0.55 + 0.05, type: 'ding' });
    } else if (e.tipo === 'tarjetas') {
      (e.items || []).forEach((_, i) => ev.push({ t: s.start + POP.primero + i * POP.paso, type: 'tap' }));
      if (e.icono) ev.push({ t: t0, type: 'pen', d: 1.0, len: 700 });
    } else if (e.tipo === 'comparar') {
      ev.push({ t: s.start + POP.primero, type: 'tap' }, { t: s.start + POP.primero + 0.6, type: 'tap' }, { t: s.start + 0.2, type: 'pen', d: 0.5, len: 300 });
    } else if (e.tipo === 'cifra') {
      ev.push({ t: s.start + 0.3, type: 'tap' });
      if (e.icono) ev.push({ t: t0, type: 'pen', d: 1.0, len: 600 });
      ev.push({ t: s.start + 0.9, type: 'pen', d: 0.45, len: 500 });
    } else if (e.tipo === 'foto') {
      ev.push({ t: s.start + 0.1, type: 'whoosh' });
      if (e.etiqueta) ev.push({ t: s.start + 0.9, type: 'tap' });
    } else if (e.tipo === 'grafica') {
      ev.push({ t: t0, type: 'pen', d: 0.5, len: 600 }, { t: t0 + 0.5, type: 'pen', d: 1.2, len: 900 });
    } else {
      ev.push({ t: t0, type: 'pen', d: DIBUJO.icono, len: 900 });
      if (e.tipo === 'titulo') ev.push({ t: s.start + 0.75, type: 'tap' });
    }
    prev = s;
  }
  return ev;
}
