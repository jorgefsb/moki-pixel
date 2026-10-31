#!/usr/bin/env node
// Escribe el catálogo de clips en docs/animacion.md a partir de src/anim/clips.js
import { readFileSync, writeFileSync } from 'node:fs';
import { CLIPS, GROUPS } from '../src/anim/clips.js';

const file = 'docs/animacion.md';
const head = readFileSync(file, 'utf8').split('<!-- CATALOGO -->')[0];
let md = '<!-- CATALOGO -->\n## Catálogo de clips\n\nGenerado desde `src/anim/clips.js`.\n';
for (const [g, label] of Object.entries(GROUPS)) {
  md += `\n### ${label}\n\n| Clip | Duración | Loop | Vistas | Principios | Nota |\n|---|---|---|---|---|---|\n`;
  for (const [k, c] of Object.entries(CLIPS)) {
    if (c.group !== g) continue;
    md += `| \`${k}\` | ${c.dur} s | ${c.loop ? 'sí' : 'no'} | ${(c.facings || []).join(', ')} | ${(c.principles || []).join(', ')} | ${c.note || ''} |\n`;
  }
}
md += `\nTotal: ${Object.keys(CLIPS).length} clips.\n`;
writeFileSync(file, head + md);
console.log('Catálogo →', file);
