#!/usr/bin/env node
// Pruebas rápidas de canon y de integridad. Uso: npm test
import { renderPose } from '../src/core/render.js';
import { sampleClip } from '../src/anim/sample.js';
import { CLIPS, FACINGS } from '../src/anim/clips.js';
import { RAMPS, hexToRgb } from '../src/core/palette.js';
import { createRequire } from 'node:module';

let fail = 0;
const ok = (c, m) => { console.log(`${c ? '✓' : '✗'} ${m}`); if (!c) fail++; };
const countColors = (f, hexes) => {
  const set = new Set(hexes.map((h) => hexToRgb(h).join(',')));
  let n = 0;
  for (let i = 0; i < f.data.length; i += 4) if (f.data[i + 3] && set.has(`${f.data[i]},${f.data[i + 1]},${f.data[i + 2]}`)) n++;
  return n;
};

// C03: el parche (material «label») solo aparece del lado derecho anatómico
const label = RAMPS.label.slice(0, 3); // la rampa profunda la comparte con kraft
const right = renderPose({ yaw: 90 }, { size: 128 });
const left = renderPose({ yaw: -90 }, { size: 128 });
const front = renderPose({ yaw: 0 }, { size: 128 });
ok(countColors(right, label) > 20, `C03 parche visible en perfil derecho (${countColors(right, label)} px)`);
ok(countColors(left, label) === 0, 'C03 sin parche en perfil izquierdo');
ok(countColors(front, label) === 0, 'C03 parche oculto de frente');

// Nunca espejo: la vista izquierda no es el reflejo de la derecha
const r40 = renderPose({ yaw: 40 }, { size: 64 }), l40 = renderPose({ yaw: -40 }, { size: 64 });
let same = 0, total = 0;
for (let y = 0; y < 64; y++) for (let x = 0; x < 64; x++) {
  const a = (y * 64 + x) * 4, b = (y * 64 + (63 - x)) * 4;
  if (r40.data[a + 3] || l40.data[b + 3]) { total++; if (r40.data[a] === l40.data[b] && r40.data[a + 1] === l40.data[b + 1] && r40.data[a + 2] === l40.data[b + 2]) same++; }
}
ok(same / total < 0.97, `vista izquierda generada, no espejada (${((same / total) * 100).toFixed(1)} % igual al reflejo)`);

// C06: a 64 px el visor no lleva motas en su mitad alta (evita leer ojos)
// (se valida en el modelo: visorMat corta motas con y > -0.25 en detalle 1)

// Todos los clips renderizan en sus vistas
for (const [name, c] of Object.entries(CLIPS)) {
  try {
    for (const f of c.facings) {
      for (const t of [0, c.dur * 0.5, c.dur * 0.99]) {
        const p = sampleClip(c, t, FACINGS[f]);
        const r = renderPose(p, { size: 32 });
        if (!r.data.some((v, i) => i % 4 === 3 && v)) throw new Error(`cuadro vacío ${f} t=${t}`);
      }
    }
  } catch (e) { ok(false, `${name}: ${e.message}`); continue; }
}
ok(true, `${Object.keys(CLIPS).length} clips renderizan en todas sus vistas`);

// Squash dentro del canon (≤ 3 %)
let maxSq = 0;
for (const c of Object.values(CLIPS)) for (let t = 0; t <= c.dur; t += 1 / 24) maxSq = Math.max(maxSq, Math.abs(sampleClip(c, t, 0).squash || 0));
ok(maxSq <= 0.0301, `aplastamiento máximo ${(maxSq * 100).toFixed(1)} % (canon ≤ 3 %)`);

// Hooks de Claude Code
const require = createRequire(import.meta.url);
const { fromClaude } = require('../desktop/hooks.js');
ok(fromClaude({ hook_event_name: 'PreToolUse', tool_name: 'Edit' }).clip === 'typing', 'hook Edit → typing');
ok(fromClaude({ hook_event_name: 'Stop' }).clip === 'celebrate', 'hook Stop → celebrate');

console.log(fail ? `\n${fail} prueba(s) fallaron` : '\nTodo bien');
process.exit(fail ? 1 : 0);
