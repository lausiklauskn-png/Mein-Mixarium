// Prüft jede Manifest-Datei dieses Depots: die `id` muss eine EIGENE Kennung ergeben.
//
// Warum (Klaus 2026-10-18, gemessen an chrome://webapks): Chrome rechnet `id`
// von der HAUPTADRESSE aus, nicht vom Ordner der App. Aus "./" wird für jede App
// auf lausiklauskn-png.github.io dieselbe Kennung ".../", aus "./index.html" für
// jede ".../index.html". Chrome hält solche Apps für EINE App: das Menü meldet
// „bereits installiert“ und das Öffnen scheitert („App konnte nicht geöffnet werden").
//
// Gerechnet wird wie Chrome: new URL(id, Ursprung der start_url).
// Verlangt wird: die Kennung liegt im Ordner (scope) der App.
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const WURZEL = new URL('..', import.meta.url).pathname;
const BASIS = 'https://lausiklauskn-png.github.io/Mein-Mixarium/';
let gruen = 0, rot = 0;
const ok = (n, b, d = '') => { if (b) { gruen++; console.log('  ✓ ' + n); } else { rot++; console.log('  ✗ ' + n + (d ? ' → ' + d : '')); } };

// Die Rechnung selbst — an gestellten Lagen gefragt, sonst wäre sie am Bestand nicht von ihrem Fehlen zu unterscheiden.
function kennung(manifestUrl, m) {
  const start = new URL(m.start_url || '.', manifestUrl);
  const scope = new URL(m.scope || './', start);
  const id = m.id ? new URL(m.id, start.origin) : start;   // Ursprung, nicht Ordner
  return { id: id.href.split('#')[0], scope: scope.href };
}
const lage = (id) => kennung('https://x.github.io/App/manifest.json', { start_url: './index.html', id });
ok('Rechnung: "./" ergibt die nackte Adresse (so rechnet Chrome)', lage('./').id === 'https://x.github.io/');
ok('Rechnung: "./index.html" ergibt /index.html', lage('./index.html').id === 'https://x.github.io/index.html');
ok('Rechnung: "/App/index.html" bleibt im Ordner', lage('/App/index.html').id === 'https://x.github.io/App/index.html');
ok('Rechnung: ohne id gilt die Startadresse', lage(undefined).id === 'https://x.github.io/App/index.html');

function finde(dir) {
  let aus = [];
  for (const n of readdirSync(dir)) {
    if (n === 'node_modules' || n.startsWith('.')) continue;
    const p = join(dir, n);
    if (statSync(p).isDirectory()) aus = aus.concat(finde(p));
    else if (/manifest[^/]*\.json$|\.webmanifest$/.test(n)) aus.push(p);
  }
  return aus;
}
const dateien = finde(WURZEL);
ok('Selbst-Riegel: mindestens drei Manifeste gefunden', dateien.length >= 3, String(dateien.length));
const gesehen = new Map();
for (const f of dateien) {
  const rel = relative(WURZEL, f);
  const m = JSON.parse(readFileSync(f, 'utf8'));
  if (!m.start_url && !m.id) continue;
  const k = kennung(new URL(rel, BASIS).href, m);
  ok(`${rel}: Kennung liegt im eigenen Ordner (${new URL(k.id).pathname})`, k.id.startsWith(k.scope), `scope ${new URL(k.scope).pathname}`);
  ok(`${rel}: Kennung kommt nur einmal vor`, !gesehen.has(k.id), gesehen.get(k.id));
  gesehen.set(k.id, rel);
}
console.log(`\n${gruen} grün · ${rot} ROT`);
process.exit(rot ? 1 : 0);
