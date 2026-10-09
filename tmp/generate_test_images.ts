import fs from 'fs';
import zlib from 'zlib';

function createPng(width: number, height: number, drawFn: (x: number, y: number) => [number, number, number]): Buffer {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData.writeUInt8(8, 8);
  ihdrData.writeUInt8(2, 9);
  ihdrData.writeUInt8(0, 10);
  ihdrData.writeUInt8(0, 11);
  ihdrData.writeUInt8(0, 12);

  function chunk(type: string, data: Buffer) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const typeBuf = Buffer.from(type, 'ascii');
    let c = 0xFFFFFFFF;
    const buf = Buffer.concat([typeBuf, data]);
    for (let i = 0; i < buf.length; i++) {
      c ^= buf[i];
      for (let j = 0; j < 8; j++) {
        c = (c >>> 1) ^ (c & 1 ? 0xEDB88320 : 0);
      }
    }
    c = (c ^ 0xFFFFFFFF) >>> 0;
    const crcBuf = Buffer.alloc(4);
    crcBuf.writeUInt32BE(c, 0);
    return Buffer.concat([len, typeBuf, data, crcBuf]);
  }

  const ihdr = chunk('IHDR', ihdrData);
  const rawScanlines = Buffer.alloc(height * (width * 3 + 1));
  let offset = 0;
  for (let y = 0; y < height; y++) {
    rawScanlines[offset++] = 0;
    for (let x = 0; x < width; x++) {
      const [r, g, b] = drawFn(x, y);
      rawScanlines[offset++] = r;
      rawScanlines[offset++] = g;
      rawScanlines[offset++] = b;
    }
  }

  const compressed = zlib.deflateSync(rawScanlines);
  const idat = chunk('IDAT', compressed);
  const iend = chunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdr, idat, iend]);
}

// 1. Image representing a modern Western suit (black blazer, white shirt, tie) - CASE E
const suitImage = createPng(256, 384, (x, y) => {
  // background: light grey
  if (y < 60) return [240, 240, 240]; // head
  if (x > 80 && x < 176 && y >= 60 && y < 140) {
    if (x > 118 && x < 138) return [255, 255, 255]; // white shirt & red tie
    return [20, 20, 25]; // black business suit jacket
  }
  if (x > 90 && x < 166 && y >= 140 && y < 340) {
    return [30, 30, 35]; // trousers
  }
  return [245, 245, 245];
});

// 2. Solid color or wrong color (Bright Neon Green) - CASE C
const wrongColorImage = createPng(256, 384, (x, y) => {
  return [50, 220, 50]; // Neon Green (contradicting deep red palette)
});

fs.writeFileSync('/tmp/test_suit.png', suitImage);
fs.writeFileSync('/tmp/test_wrong_color.png', wrongColorImage);
console.log('Test images generated successfully.');
