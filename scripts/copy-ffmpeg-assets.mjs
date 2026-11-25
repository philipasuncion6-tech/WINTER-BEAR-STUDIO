import { mkdir, copyFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

const files = [
  ['@ffmpeg/ffmpeg/dist/umd/814.ffmpeg.js', 'public/assets/814.ffmpeg.js'],
  ['@ffmpeg/core/dist/esm/ffmpeg-core.js', 'public/assets/ffmpeg-core-esm.js'],
  ['@ffmpeg/core/dist/esm/ffmpeg-core.wasm', 'public/assets/ffmpeg-core-esm.wasm']
];

for (const [source, destination] of files) {
  const target = resolve(destination);
  await mkdir(dirname(target), { recursive: true });
  await copyFile(resolve('node_modules', source), target);
  console.log('Prepared local FFmpeg asset:', destination);
}
