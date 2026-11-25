// Probe der neuen PWA: Ansicht (R13 „?“-Erklärungen ganz im Bild …). Echter Browser, kein Netz.
//   node tests/smoke_neu_ansicht.mjs   (WURZEL=<Pfad> misst eine Kopie)
import { createServer } from 'node:http';
import { mitThemen } from './neu-hilfe.mjs';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('playwright');
const WURZEL = process.env.WURZEL || process.cwd();
const ART = { '.html': 'text/html', '.mjs': 'text/javascript', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml' };
const server = createServer(async (q, a) => { let p = decodeURIComponent(new URL(q.url, 'http://x').pathname).replace(/^\/Mein-Mixarium/, ''); if (p.endsWith('/')) p += 'index.html'; try { const d = await readFile(join(WURZEL, normalize(p))); a.writeHead(200, { 'content-type': ART[extname(p)] || 'application/octet-stream' }); a.end(d); } catch (e) { a.writeHead(404); a.end('fehlt'); } });
await new Promise((r) => server.listen(0, r));
const U = `http://localhost:${server.address().port}/Mein-Mixarium/`, ORT = U + 'neu/';
let gruen = 0, rot = 0;
const ok = (b, t, mehr = '') => { if (b) { gruen++; console.log('  ✓ ' + t); } else { rot++; console.log('  ✗ ROT ' + t + (mehr ? ' — ' + mehr : '')); } };
const b = await chromium.launch();
const abbruch = async (e) => { rot++; console.log('  ✗ ROT Probe abgebrochen — ' + String(e && e.message || e).split('\n')[0]); try { await b.close(); } catch (f) { /* zu */ } server.close(); console.log(`\n${gruen} grün · ${rot} ROT`); process.exitCode = 1; };
process.on('unhandledRejection', abbruch); process.on('uncaughtException', abbruch);
const fehler = [];
const D = (n, name, mehr = {}) => ({ id: n, uid: 'g-' + n, name, cat: 'mock', glass: 'highball', temp: 'kalt', servings: 1, prepTime: 5, alcohol: false, folder: '', img: '', notes: '', ings: [{ id: 0, amt: '4', unit: 'cl', name: 'Limettensaft', note: '', ck: false }], steps: [{ id: 0, txt: 'Verrühren.' }], created: 1, modified: 1, ...mehr });
async function seite(getraenke, breite) {
  const c = await b.newContext({ viewport: { width: breite, height: 820 }, locale: 'de-DE', serviceWorkers: 'block' }), p = mitThemen(await c.newPage()); p.setDefaultTimeout(10000);
  p.on('pageerror', (e) => fehler.push(e.message)); p.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) fehler.push(m.text()); });
  await p.route(/^https?:\/\/(?!localhost)/, (r) => r.abort());
  await p.goto(U + 'impressum.html');
  await p.evaluate((g) => new Promise((ja) => { const a = indexedDB.open('KuechenKern-mixarium', 1); a.onupgradeneeded = () => a.result.createObjectStore('zustand'); a.onsuccess = () => { const t = a.result.transaction('zustand', 'readwrite'), l = t.objectStore('zustand'); l.put({ getraenke: g, ordner: [], karten: [], einkauf: [], anlaesse: [], einstellungen: { ohneAlkohol: false, sprache: null }, knoten: null }, 'alles'); l.put({ ton: 'hell' }, 'einst'); t.oncomplete = () => { a.result.close(); ja(); }; }; }), getraenke);
  await p.goto(ORT); await p.waitForSelector('.mx .titel'); return { p, c };
}
const geh = async (p, z) => { await p.keyboard.press('Escape'); if (await p.locator(`.nav [data-go=${z}]`).count()) return p.click(`.nav [data-go=${z}]`); await p.click('.fl-griff'); await p.click(`.fl-knoepfe [data-go=${z}]`); };
/* Alle sichtbaren „?“ auf dem Bildschirm öffnen und messen: die Blase steht ganz im Fenster, mit Abstand zum Rand. */
async function fragMessen(p) {
  const n = await p.locator('details.frag summary:visible').count(), aus = [];
  for (let i = 0; i < n; i++) {
    const s = p.locator('details.frag summary:visible').nth(i); await s.scrollIntoViewIfNeeded(); await s.click(); await p.waitForTimeout(80);
    aus.push(await p.evaluate(() => { const d = document.querySelector('details.frag[open]'); if (!d) return { zu: true }; const r = d.querySelector('p').getBoundingClientRect(); return { l: Math.round(r.left), r: Math.round(r.right), o: Math.round(r.top), u: Math.round(r.bottom), w: innerWidth, h: innerHeight }; }));
    await s.click(); await p.waitForTimeout(40);
  }
  return aus;
}
try {
  for (const breite of [390, 1280]) {
    console.log(`1 · „?“-Erklärungen ganz im Bild (${breite} px)`);
    const { p, c } = await seite([D(1, 'Limo')], breite);
    for (const z of ['mehr', 'labor']) {
      await geh(p, z); await p.waitForTimeout(300);
      if (z === 'mehr') for (const k of await p.locator('.einst details:not([open]) > summary, .eklapp:not([open]) > summary').all()) await k.click().catch(() => {});
      const m = await fragMessen(p);
      ok(m.length > 0, `${z}: es gibt Erklärungen zum Messen (Selbst-Riegel)`, String(m.length));
      const schlecht = m.filter((x) => x.zu || x.l < 4 || x.r > x.w - 4 || x.o < 0 || x.u > x.h);
      ok(m.length > 0 && !schlecht.length, `${z}: jede Blase (${m.length}) steht ganz im Fenster`, JSON.stringify(schlecht.slice(0, 3)));
    }
    { await geh(p, 'mehr'); await p.waitForTimeout(300); const s = p.locator('details.frag summary:visible').first(); await s.scrollIntoViewIfNeeded(); await s.click(); await p.waitForTimeout(80);
      const vor = await p.evaluate(() => { const d = document.querySelector('details.frag[open]'); return d && [d.querySelector('summary').getBoundingClientRect().bottom, d.querySelector('p').getBoundingClientRect().top]; });
      await p.mouse.wheel(0, 60); await p.waitForTimeout(250);
      const nach = await p.evaluate(() => { const d = document.querySelector('details.frag[open]'); return d && [d.querySelector('summary').getBoundingClientRect().bottom, d.querySelector('p').getBoundingClientRect().top]; });
      ok(vor && nach && Math.abs((nach[1] - nach[0]) - (vor[1] - vor[0])) <= 2, 'die offene Blase wandert beim Rollen mit dem „?“', JSON.stringify([vor, nach])); }
    await c.close();
  }
  ok(!fehler.length, 'keine Fehler im Browser', fehler.slice(0, 3).join(' | '));
} catch (f) { rot++; console.log('  ✗ ROT Absturz — ' + String(f && f.message || f).split('\n')[0]); }
await b.close(); server.close();
console.log(`\n${gruen} grün · ${rot} ROT`); process.exitCode = rot ? 1 : 0;
