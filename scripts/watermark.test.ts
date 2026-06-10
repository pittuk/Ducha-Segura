import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import sharp from 'sharp';
import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { processImage, DEFAULT_CFG } from './watermark.mjs';

let dir: string;
let wmBuffer: Buffer;

beforeAll(async () => {
  dir = await fs.mkdtemp(join(tmpdir(), 'wm-'));
  // logo sintético: cuadrado blanco con alfa (un disco opaco al centro)
  const size = 400;
  const svg = `<svg width="${size}" height="${size}"><circle cx="${size / 2}" cy="${size / 2}" r="${size / 3}" fill="white"/></svg>`;
  wmBuffer = await sharp(Buffer.from(svg)).png().toBuffer();
  // dos fondos: uno claro (blanco) y uno oscuro (casi negro)
  await sharp({ create: { width: 800, height: 600, channels: 3, background: '#ffffff' } })
    .png().toFile(join(dir, 'claro.png'));
  await sharp({ create: { width: 800, height: 600, channels: 3, background: '#101010' } })
    .png().toFile(join(dir, 'oscuro.png'));
});

afterAll(async () => {
  await fs.rm(dir, { recursive: true, force: true });
});

describe('processImage', () => {
  it('genera salida con las mismas dimensiones que el original', async () => {
    const src = join(dir, 'claro.png');
    const out = join(dir, 'out-claro.png');
    await processImage(src, out, wmBuffer, DEFAULT_CFG);
    const m = await sharp(out).metadata();
    expect(m.width).toBe(800);
    expect(m.height).toBe(600);
  });

  it('modifica los píxeles de la esquina inferior-izquierda (el sello existe)', async () => {
    const src = join(dir, 'claro.png');
    const out = join(dir, 'out-claro2.png');
    await processImage(src, out, wmBuffer, DEFAULT_CFG);
    // muestra un parche dentro del sello (esquina inf-izquierda); ya no debe ser blanco puro
    const patch = await sharp(out)
      .extract({ left: 85, top: 475, width: 30, height: 30 })
      .flatten({ background: '#ffffff' })
      .resize(1, 1)
      .raw()
      .toBuffer();
    expect(patch[0]).toBeLessThan(250); // dejó de ser 255 blanco
  });

  it('es idempotente: misma entrada => misma salida en bytes', async () => {
    const src = join(dir, 'oscuro.png');
    const a = join(dir, 'a.png');
    const b = join(dir, 'b.png');
    await processImage(src, a, wmBuffer, DEFAULT_CFG);
    await processImage(src, b, wmBuffer, DEFAULT_CFG);
    const [ba, bb] = [await fs.readFile(a), await fs.readFile(b)];
    expect(Buffer.compare(ba, bb)).toBe(0);
  });
});
