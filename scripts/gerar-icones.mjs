// Gera o ícone, o ícone adaptativo, o monocromático, o da notificação e os
// splashes a partir das logos FN em PNG (não há SVG da logo). Rodar com
// `npm run icons`. As logos em assets/images/brand/ não são alteradas.
//
// As logos têm fundo, borda cinza fina e cantos transparentes; aqui só as
// letras do "FN." são aproveitadas, separadas pelo contraste com o fundo.
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import sharp from 'sharp';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BRAND = path.join(ROOT, 'assets/images/brand');
const OUT = path.join(ROOT, 'assets/images');
const PREVIEW = path.join(ROOT, 'scripts/preview-icones.png');

const SIZE = 1024;

// Áreas seguras (diâmetro do círculo onde as letras precisam caber, em
// fração do quadro):
// - ícone adaptativo: o launcher só garante o círculo de 66 dp num quadro de
//   108 dp; um pouco menos, para as letras não encostarem na máscara
// - splash do Android 12+: o ícone sem fundo precisa caber num círculo de 2/3
//   do quadro
const ADAPTIVE_SAFE = 0.54;
const SPLASH_SAFE = 0.64;
// Ícone "legado" (icon.png): quadrado cheio, letras na mesma proporção da logo
const ICON_BOX = 0.74;
// Notificação: 96 px (24 dp em xxxhdpi), com 4 px de folga em cada lado
const NOTIFICATION_SIZE = 96;
const NOTIFICATION_BOX = 88;

// Fundos dos temas (--background do global.css), só para a prévia
const BG_LIGHT = { r: 0xf7, g: 0xf7, b: 0xf5 };
const BG_DARK = { r: 0x11, g: 0x11, b: 0x11 };

// ---------------------------------------------------------------------------
// Separar as letras

/**
 * Letras da logo como RGBA, com o resto transparente.
 * - `fundo`: cor do fundo da logo, para tirar a mistura das bordas
 *   antisserrilhadas e manter a cor original das letras
 * - `opacidade(L)`: 0 a 1 pela luminância; a borda cinza fina cai fora do
 *   limite e some junto com o fundo
 */
async function extractLetters(file, { fundo, opacidade }) {
  const { data, info } = await sharp(path.join(BRAND, file))
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { width, height } = info;
  const out = Buffer.alloc(width * height * 4);
  // Os cantos arredondados (transparentes) e a borda ficam nos primeiros
  // pixels; as letras começam a mais de 100 px da beirada
  const margin = 24;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      if (
        data[i + 3] < 250 ||
        x < margin ||
        y < margin ||
        x >= width - margin ||
        y >= height - margin
      ) {
        continue;
      }
      const [r, g, b] = [data[i], data[i + 1], data[i + 2]];
      const a = opacidade(0.2126 * r + 0.7152 * g + 0.0722 * b);
      if (a < 0.04) continue;
      // Pixel = a * letra + (1 - a) * fundo  →  letra
      const unmix = (c, f) =>
        Math.round(Math.min(255, Math.max(0, (c - (1 - a) * f) / a)));
      out[i] = unmix(r, fundo.r);
      out[i + 1] = unmix(g, fundo.g);
      out[i + 2] = unmix(b, fundo.b);
      out[i + 3] = Math.round(a * 255);
    }
  }
  return { data: out, width, height };
}

const ramp = (v, from, to) =>
  Math.min(1, Math.max(0, (v - from) / (to - from)));

// Clara: letras quase pretas (#111218) no branco; a borda é #ebebeb
const darkLetters = () =>
  extractLetters('logo_fn_branco.png', {
    fundo: { r: 255, g: 255, b: 255 },
    opacidade: (L) => ramp(L, 200, 40),
  });

// Escura: letras quase brancas (#f4f4f7) no #0a0b0e; a borda é #27282b
const lightLetters = () =>
  extractLetters('logo_fn_preto.png', {
    fundo: { r: 0x0a, g: 0x0b, b: 0x0e },
    opacidade: (L) => ramp(L, 60, 215),
  });

/**
 * Caixa das letras e o raio a partir do centro dela (até o pixel mais
 * distante), para encaixar o "FN." inclinado num círculo sem desperdiçar
 * espaço como a diagonal da caixa desperdiçaria.
 */
function measure({ data, width, height }) {
  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (data[(y * width + x) * 4 + 3] < 128) continue;
      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x);
      minY = Math.min(minY, y);
      maxY = Math.max(maxY, y);
    }
  }
  if (maxX < 0) throw new Error('Nenhuma letra encontrada na logo.');

  const cx = (minX + maxX + 1) / 2;
  const cy = (minY + maxY + 1) / 2;
  let radius = 0;
  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      if (data[(y * width + x) * 4 + 3] < 128) continue;
      // Canto mais distante do pixel
      const dx = Math.max(Math.abs(x - cx), Math.abs(x + 1 - cx));
      const dy = Math.max(Math.abs(y - cy), Math.abs(y + 1 - cy));
      radius = Math.max(radius, Math.hypot(dx, dy));
    }
  }
  // 2 px de folga para a borda antisserrilhada não ser cortada
  const pad = 2;
  const box = {
    left: Math.max(0, minX - pad),
    top: Math.max(0, minY - pad),
    width: Math.min(width, maxX + 1 + pad) - Math.max(0, minX - pad),
    height: Math.min(height, maxY + 1 + pad) - Math.max(0, minY - pad),
  };
  return { box, radius, cx, cy };
}

// ---------------------------------------------------------------------------
// Montar as imagens

/** Troca a cor de todos os pixels, mantendo a transparência. */
function recolor({ data, width, height }, { r, g, b }) {
  const out = Buffer.from(data);
  for (let i = 0; i < out.length; i += 4) {
    out[i] = r;
    out[i + 1] = g;
    out[i + 2] = b;
  }
  return { data: out, width, height };
}

/**
 * As letras na escala `scale`, centradas num quadro `canvas`×`canvas`, sobre
 * `background` (transparente se omitido). PNG.
 */
async function place(letters, geo, { canvas, scale, background }) {
  const w = Math.max(1, Math.round(geo.box.width * scale));
  const h = Math.max(1, Math.round(geo.box.height * scale));
  const resized = await sharp(letters.data, {
    raw: { width: letters.width, height: letters.height, channels: 4 },
  })
    .extract(geo.box)
    .resize(w, h, { kernel: 'lanczos3', fit: 'fill' })
    .png()
    .toBuffer();

  // O centro da caixa medida vai para o centro do quadro
  const boxCx = geo.cx - geo.box.left;
  const boxCy = geo.cy - geo.box.top;
  const left = Math.round(canvas / 2 - boxCx * scale);
  const top = Math.round(canvas / 2 - boxCy * scale);

  return sharp({
    create: {
      width: canvas,
      height: canvas,
      channels: 4,
      background: background ?? { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([{ input: resized, left, top }])
    .png({ compressionLevel: 9 })
    .toBuffer();
}

/** Escala para as letras caberem num círculo de `fraction` do quadro. */
const inCircle = (geo, canvas, fraction) =>
  (canvas * fraction) / 2 / geo.radius;

/** Escala para a caixa das letras caber num quadrado de `box` px. */
const inBox = (geo, box) => box / Math.max(geo.box.width, geo.box.height);

const WHITE = { r: 255, g: 255, b: 255 };

async function main() {
  const dark = await darkLetters();
  const light = await lightLetters();
  // A mesma medida para as duas versões: os splashes claro e escuro ficam
  // com as letras exatamente no mesmo lugar
  const geo = measure(dark);
  const white = recolor(dark, WHITE);

  const files = {
    'icon.png': await place(dark, geo, {
      canvas: SIZE,
      scale: inBox(geo, SIZE * ICON_BOX),
      background: { ...WHITE, alpha: 1 },
    }),
    'android-icon-foreground.png': await place(dark, geo, {
      canvas: SIZE,
      scale: inCircle(geo, SIZE, ADAPTIVE_SAFE),
    }),
    // O Android só usa a transparência; branco para conferir no fundo escuro
    'android-icon-monochrome.png': await place(white, geo, {
      canvas: SIZE,
      scale: inCircle(geo, SIZE, ADAPTIVE_SAFE),
    }),
    'notification-icon.png': await place(white, geo, {
      canvas: NOTIFICATION_SIZE,
      scale: inBox(geo, NOTIFICATION_BOX),
    }),
    'splash-icon.png': await place(dark, geo, {
      canvas: SIZE,
      scale: inCircle(geo, SIZE, SPLASH_SAFE),
    }),
    'splash-icon-dark.png': await place(light, geo, {
      canvas: SIZE,
      scale: inCircle(geo, SIZE, SPLASH_SAFE),
    }),
  };

  for (const [name, buffer] of Object.entries(files)) {
    await sharp(buffer).toFile(path.join(OUT, name));
    const meta = await sharp(buffer).metadata();
    console.log(`assets/images/${name}  ${meta.width}x${meta.height}`);
  }

  await sharp(await preview(files)).toFile(PREVIEW);
  console.log('scripts/preview-icones.png (só para conferir)');
}

// ---------------------------------------------------------------------------
// Prévia: só para conferir; não vai para o app

const TILE = 240;
const CELL = 280;
const LABEL_H = 40;

const escapeXml = (s) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const label = (text, width = CELL) =>
  Buffer.from(
    `<svg width="${width}" height="${LABEL_H}" xmlns="http://www.w3.org/2000/svg">` +
      `<text x="${width / 2}" y="26" font-family="sans-serif" font-size="15" ` +
      `text-anchor="middle" fill="#333">${escapeXml(text)}</text></svg>`,
  );

/** Recorta pela máscara (SVG com o formato em branco). */
async function mask(buffer, size, shapeSvg) {
  const m = Buffer.from(
    `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">${shapeSvg}</svg>`,
  );
  return sharp(buffer)
    .resize(size, size)
    .composite([{ input: m, blend: 'dest-in' }])
    .png()
    .toBuffer();
}

/** O que o launcher mostra: fundo + frente, só os 72 dp do meio (de 108). */
async function adaptiveViewport(foreground, background, size) {
  const full = await sharp({
    create: { width: SIZE, height: SIZE, channels: 4, background },
  })
    .composite([{ input: foreground }])
    .png()
    .toBuffer();
  const visible = Math.round((SIZE * 72) / 108);
  const offset = Math.round((SIZE - visible) / 2);
  return sharp(full)
    .extract({ left: offset, top: offset, width: visible, height: visible })
    .resize(size, size)
    .png()
    .toBuffer();
}

/** `pixelated`: ampliar sem suavizar, para ver cada pixel. */
async function onBackground(
  buffer,
  size,
  background,
  inner = size,
  pixelated = false,
) {
  const resized = await sharp(buffer)
    .resize(inner, inner, { kernel: pixelated ? 'nearest' : 'lanczos3' })
    .png()
    .toBuffer();
  const offset = Math.round((size - inner) / 2);
  return sharp({
    create: { width: size, height: size, channels: 4, background },
  })
    .composite([{ input: resized, left: offset, top: offset }])
    .png()
    .toBuffer();
}

async function preview(files) {
  const circle = `<circle cx="${TILE / 2}" cy="${TILE / 2}" r="${TILE / 2}" fill="#fff"/>`;
  const squircle = `<rect width="${TILE}" height="${TILE}" rx="${TILE * 0.22}" fill="#fff"/>`;
  const viewport = await adaptiveViewport(
    files['android-icon-foreground.png'],
    { ...WHITE, alpha: 1 },
    TILE,
  );

  // Ícone temático (Android 13+): o sistema pinta o monocromático
  const themedLetters = await sharp(files['android-icon-monochrome.png'])
    .raw()
    .toBuffer({ resolveWithObject: true })
    .then(({ data, info }) =>
      recolor(
        { data, width: info.width, height: info.height },
        { r: 0x1b, g: 0x2a, b: 0x4a },
      ),
    );
  const themed = await adaptiveViewport(
    await sharp(themedLetters.data, {
      raw: { width: SIZE, height: SIZE, channels: 4 },
    })
      .png()
      .toBuffer(),
    { r: 0xd6, g: 0xe4, b: 0xff, alpha: 1 },
    TILE,
  );

  const notification24 = await sharp(files['notification-icon.png'])
    .resize(24, 24, { kernel: 'lanczos3' })
    .png()
    .toBuffer();
  const bar = { r: 0x1c, g: 0x1c, b: 0x1c, alpha: 1 };

  const tiles = [
    ['icon.png', await sharp(files['icon.png']).resize(TILE).png().toBuffer()],
    ['adaptativo · círculo', await mask(viewport, TILE, circle)],
    ['adaptativo · quadrado arred.', await mask(viewport, TILE, squircle)],
    ['monocromático (temático)', await mask(themed, TILE, circle)],
    [
      'notificação 96 px',
      await onBackground(files['notification-icon.png'], TILE, bar, 96),
    ],
    [
      'notificação 24 px (real)',
      await onBackground(notification24, TILE, bar, 24),
    ],
    [
      '24 px ampliado 8x',
      await onBackground(notification24, TILE, bar, 192, true),
    ],
    ['', null],
    [
      'splash claro #f7f7f5',
      await onBackground(files['splash-icon.png'], TILE, {
        ...BG_LIGHT,
        alpha: 1,
      }),
    ],
    [
      'splash escuro #111111',
      await onBackground(files['splash-icon-dark.png'], TILE, {
        ...BG_DARK,
        alpha: 1,
      }),
    ],
  ];

  const cols = 4;
  const rows = Math.ceil(tiles.length / cols);
  const layers = [];
  tiles.forEach(([text, tile], i) => {
    if (!tile) return;
    const x = (i % cols) * CELL;
    const y = Math.floor(i / cols) * (CELL + LABEL_H);
    layers.push({ input: label(text), left: x, top: y });
    layers.push({
      input: tile,
      left: x + (CELL - TILE) / 2,
      top: y + LABEL_H,
    });
  });

  return sharp({
    create: {
      width: cols * CELL,
      height: rows * (CELL + LABEL_H),
      channels: 4,
      background: { r: 0xe5, g: 0xe5, b: 0xe5, alpha: 1 },
    },
  })
    .composite(layers)
    .png()
    .toBuffer();
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
