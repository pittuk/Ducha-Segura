import { describe, it, expect } from 'vitest';
import {
  relativeLuminance,
  pickLogoColor,
  isRasterImage,
  shouldWatermark,
  publicTarget,
} from './watermark-core.mjs';

describe('relativeLuminance', () => {
  it('es 1 para blanco y 0 para negro', () => {
    expect(relativeLuminance([255, 255, 255])).toBeCloseTo(1, 5);
    expect(relativeLuminance([0, 0, 0])).toBeCloseTo(0, 5);
  });
  it('pondera el verde más que el azul (Rec.709)', () => {
    expect(relativeLuminance([0, 255, 0])).toBeGreaterThan(relativeLuminance([0, 0, 255]));
  });
});

describe('pickLogoColor', () => {
  it('usa logo carbón sobre fondo claro', () => {
    expect(pickLogoColor(0.9)).toBe('charcoal');
  });
  it('usa logo blanco sobre fondo oscuro', () => {
    expect(pickLogoColor(0.2)).toBe('white');
  });
  it('respeta el umbral: en el límite usa carbón', () => {
    expect(pickLogoColor(0.6, 0.6)).toBe('charcoal');
    expect(pickLogoColor(0.59, 0.6)).toBe('white');
  });
});

describe('isRasterImage', () => {
  const exts = ['.png', '.webp', '.jpg', '.jpeg'];
  it('reconoce extensiones raster sin importar mayúsculas', () => {
    expect(isRasterImage('Foto.WEBP', exts)).toBe(true);
    expect(isRasterImage('a.png', exts)).toBe(true);
  });
  it('rechaza svg y txt', () => {
    expect(isRasterImage('icono.svg', exts)).toBe(false);
    expect(isRasterImage('README.txt', exts)).toBe(false);
  });
});

describe('shouldWatermark', () => {
  const exts = ['.png', '.webp', '.jpg', '.jpeg'];
  it('marca raster que no está en la lista de exclusión', () => {
    expect(shouldWatermark('tina.webp', exts, [])).toBe(true);
  });
  it('no marca no-raster', () => {
    expect(shouldWatermark('mapa.svg', exts, [])).toBe(false);
  });
  it('no marca lo que matchea un patrón de skip', () => {
    expect(shouldWatermark('placeholder.png', exts, [/placeholder/i])).toBe(false);
  });
});

describe('publicTarget', () => {
  it('reemplaza el root originales por public/images', () => {
    expect(publicTarget('originales/tinas/a.webp')).toBe('public/images/tinas/a.webp');
    expect(publicTarget('originales/productos/sub/b.png')).toBe('public/images/productos/sub/b.png');
  });
  it('normaliza separadores de Windows', () => {
    expect(publicTarget('originales\\kits\\c.webp')).toBe('public/images/kits/c.webp');
  });
  it('no confunde un prefijo falso (boundary de carpeta)', () => {
    expect(publicTarget('originales_extra/a.webp')).toBe('public/images/originales_extra/a.webp');
  });
  it('rutas fuera de originales caen bajo public/images', () => {
    expect(publicTarget('otro/a.webp')).toBe('public/images/otro/a.webp');
  });
});
