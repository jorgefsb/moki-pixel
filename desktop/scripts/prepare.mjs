// Copia del kit lo que necesita la app (runtime + sprites 64/128 + FX) a desktop/app/
import { cpSync, mkdirSync, rmSync, existsSync } from 'node:fs';
const src = new URL('../../dist/', import.meta.url).pathname;
const out = new URL('../app/dist/', import.meta.url).pathname;
if (!existsSync(`${src}runtime/moki.mjs`)) {
  console.error('Falta el kit. Desde la raíz del repo corre: npm install && npm run build');
  process.exit(1);
}
rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });
cpSync(`${src}runtime`, `${out}runtime`, { recursive: true });
cpSync(`${src}fx`, `${out}fx`, { recursive: true });
for (const s of ['64', '128']) cpSync(`${src}sprites/${s}`, `${out}sprites/${s}`, { recursive: true });
console.log('Assets listos en desktop/app/dist');
