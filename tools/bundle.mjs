// Empaqueta el runtime: dist/runtime/moki.mjs (ESM) y dist/runtime/moki-pet.js (IIFE pega-y-listo)
import { build } from 'esbuild';
import { mkdirSync } from 'node:fs';
mkdirSync('dist/runtime', { recursive: true });
const banner = { js: '/* Moki Pixel · github.com/jorgefsb/moki-pixel · Código MIT · Arte de Moki CC BY-NC 4.0 · Hecho con amor por JorgeSuarez.com.mx */' };
await build({ entryPoints: ['src/runtime/index.js'], bundle: true, format: 'esm', outfile: 'dist/runtime/moki.mjs', minify: true, banner, target: 'es2020' });
await build({ entryPoints: ['src/runtime/auto.js'], bundle: true, format: 'iife', outfile: 'dist/runtime/moki-pet.js', minify: true, banner, target: 'es2020', logLevel: 'error' });
console.log('Runtime → dist/runtime/');
