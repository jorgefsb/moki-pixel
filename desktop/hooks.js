// Servidor local para que Claude Code (u otro agente) mueva a Moki.
// Solo escucha en 127.0.0.1. Rechaza peticiones de navegador (con cabecera Origin) para que
// ninguna página web pueda controlarlo.
const http = require('node:http');

const PORT = Number(process.env.MOKI_PORT || 47820);

// Herramienta de Claude Code → animación de Moki
function forTool(tool = '') {
  if (/^(Bash|BashOutput|KillShell)$/.test(tool)) return { clip: 'building' };
  if (/^(Edit|MultiEdit|Write|NotebookEdit)$/.test(tool)) return { clip: 'typing' };
  if (/^(Read|Grep|Glob|LS)$/.test(tool)) return { clip: 'curious' };
  if (/^(WebFetch|WebSearch)$/.test(tool)) return { clip: 'idle_look' };
  if (/^(Task|Agent)$/.test(tool)) return { clip: 'juggling' };
  if (/^mcp__/.test(tool)) return { clip: 'play' };
  return { clip: 'typing' };
}

function fromClaude(e) {
  const name = e.hook_event_name || e.event || '';
  switch (name) {
    case 'SessionStart': return { clip: 'wave', say: '¡Listo para jugar!' };
    case 'UserPromptSubmit': return { clip: 'think', emote: 'dots' };
    case 'PreToolUse': return forTool(e.tool_name);
    case 'PostToolUse': return null;
    case 'Notification': return { clip: 'curious', emote: 'bang', say: (e.message || 'Te necesito').slice(0, 48) };
    case 'Stop': return { clip: 'celebrate', say: '¡Listo!' };
    case 'SubagentStop': return { clip: 'nod' };
    case 'PreCompact': return { clip: 'think', emote: 'gear' };
    case 'SessionEnd': return { clip: 'sleep' };
    default: return null;
  }
}

function startHookServer(onEvent) {
  const server = http.createServer((req, res) => {
    if (req.headers.origin && req.headers.origin !== 'null') { res.writeHead(403).end(); return; }
    const host = (req.headers.host || '').split(':')[0];
    if (!['127.0.0.1', 'localhost'].includes(host)) { res.writeHead(403).end(); return; }
    let body = '';
    req.on('data', (c) => { body += c; if (body.length > 65536) req.destroy(); });
    req.on('end', () => {
      let data = {};
      try { data = body ? JSON.parse(body) : {}; } catch { data = {}; }
      const url = new URL(req.url, `http://127.0.0.1:${PORT}`);
      for (const [k, v] of url.searchParams) data[k] = v;
      let ev = null;
      if (url.pathname === '/claude') ev = fromClaude(data);
      else if (url.pathname === '/event') ev = { clip: data.clip, say: data.say, emote: data.emote, walk: data.walk };
      else if (url.pathname === '/health') { res.writeHead(200, { 'content-type': 'application/json' }).end('{"ok":true,"moki":"aquí ando"}'); return; }
      if (ev) onEvent(ev);
      res.writeHead(204).end();
    });
  });
  server.on('error', (err) => console.error('[moki] no pude abrir el puerto', PORT, err.message));
  server.listen(PORT, '127.0.0.1');
  return server;
}

const cmd = `curl -s -m 1 --data-binary @- http://127.0.0.1:${PORT}/claude >/dev/null 2>&1 || true`;
const hook = (matcher) => [{ ...(matcher ? { matcher } : {}), hooks: [{ type: 'command', command: cmd }] }];
const CLAUDE_HOOKS_SNIPPET = JSON.stringify({
  hooks: {
    SessionStart: hook(), UserPromptSubmit: hook(), PreToolUse: hook('*'), Notification: hook(),
    Stop: hook(), SubagentStop: hook(), PreCompact: hook(), SessionEnd: hook(),
  },
}, null, 2);

module.exports = { startHookServer, PORT, CLAUDE_HOOKS_SNIPPET, fromClaude };
