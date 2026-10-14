import React from 'react';
import { Composition } from 'remotion';
import { ChispazoVideo, VideoProps } from './Video';
import { construir, Datos, FPS } from './timeline';
import datosJson from './datos.json';
import { Miniatura, MiniProps } from './Miniatura';

const datos = datosJson as unknown as Datos;
const frames = (f: 'largo' | 'short', s = 0) => Math.ceil(construir(datos, f, s).dur * FPS);

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="Largo" component={ChispazoVideo as React.FC<VideoProps>} durationInFrames={frames('largo')} fps={FPS} width={1920} height={1080} defaultProps={{ datos, formato: 'largo', short: 0 } as VideoProps} />
    {datos.guion.shorts.map((_, i) => (
      <Composition key={i} id={`Short${i + 1}`} component={ChispazoVideo as React.FC<VideoProps>} durationInFrames={frames('short', i)} fps={FPS} width={1080} height={1920} defaultProps={{ datos, formato: 'short', short: i } as VideoProps} />
    ))}
    <Composition id="Miniatura" component={Miniatura as React.FC<MiniProps>} durationInFrames={1} fps={FPS} width={1280} height={720}
      defaultProps={{ ...((datos.guion as unknown as { miniatura?: Omit<MiniProps, 'serie'> }).miniatura || { arriba: '', abajo: datos.guion.titulo, icono: 'bombilla' }), serie: datos.guion.serie } as MiniProps} />
  </>
);
