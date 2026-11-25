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

  console.log('2 · R35 Leiste mit Pfeilen verschieben (390 px)');
  { const { p, c } = await seite([D(1, 'Limo')], 390);
    await p.click('.fl-griff'); await p.waitForTimeout(150);
    ok(await p.locator('.fl-werk [data-a=fl-pos]').count() === 1, 'in der Leiste steht „Verschieben“');
    await p.click('.fl-werk [data-a=fl-pos]'); await p.waitForTimeout(150);
    ok(await p.locator('.fl-nur-pos [data-a=fl-schieb]').count() === 4 && await p.locator('.fl-knoepfe:not(.fl-nur-pos)').count() === 0, 'statt der Leiste steht nur das Pfeil-Viereck (vier Pfeile)');
    const lage = () => p.evaluate(() => { const a = document.querySelector('.fl-leiste').getBoundingClientRect(); return { y: Math.round(a.top + a.height / 2), x: Math.round(a.left + a.width / 2), fl: __mixarium.einstellungen.fl }; });
    const l0 = await lage(); await p.click('[data-r=hoch]'); await p.waitForTimeout(150); const l1 = await lage();
    ok(l1.fl.oben < l0.fl.oben && l1.y < l0.y && await p.locator('.fl-nur-pos').count() === 1, 'ein Tipp „nach oben“ bewegt die Leiste sichtbar nach oben, das Viereck bleibt offen (kein Bestätigen)', JSON.stringify([l0, l1]));
    await p.click('[data-r=links]'); await p.waitForTimeout(150); const l2 = await lage();
    ok(l2.fl.seite === 'l' && l2.x < 195, '„nach links“ legt sie an den linken Rand', JSON.stringify(l2));
    for (let i = 0; i < 6; i++) { await p.click('[data-r=runter]'); await p.waitForTimeout(80); }
    const l3 = await lage(); ok(l3.fl.seite === 'u', 'ganz unten weiter „nach unten“: an den unteren Rand', JSON.stringify(l3.fl));
    await p.mouse.click(200, 200); await p.waitForTimeout(200);
    ok(await p.locator('.fl-nur-pos').count() === 0 && await p.locator('.fl-griff').count() === 1, 'ein Tipp daneben schließt; der Griff steht am neuen Platz');
    await p.reload(); await p.waitForSelector('.mx .titel');
    ok((await p.evaluate(() => __mixarium.einstellungen.fl.seite)) === 'u', 'der neue Platz bleibt nach dem Neuladen');
    await c.close(); }

  console.log('3 · R17 Zutaten und Schritte nebeneinander nur, wenn Platz ist');
  for (const [breite, spalten] of [[1000, 1], [1100, 1], [1280, 2], [1600, 2]]) {
    const { p, c } = await seite([D(1, 'Gurken-Limetten-Spritz', { ings: ['Salatgurke', 'Holunderblütensirup aus dem eigenen Garten', 'Sprudelwasser'].map((n, i) => ({ id: i, amt: '2', unit: 'cl', name: n, note: '', ck: false })), steps: [{ id: 0, txt: 'Gurkenscheiben und Sirup ins Glas geben und mit dem Stößel andrücken.' }] })], breite);
    await p.locator('.zeile, .karte').first().click(); await p.waitForSelector('.detail-rumpf');
    const m = await p.evaluate(() => { const g = document.querySelector('.detail-rumpf'), n = getComputedStyle(g).gridTemplateColumns.split(' ').length, ab = [...g.querySelectorAll('*')].filter((e) => !e.children.length && e.textContent.trim() && e.scrollWidth > e.clientWidth + 1).map((e) => e.textContent.trim()); return { n, ab }; });
    ok(m.n === spalten && !m.ab.length, `${breite} px: ${spalten === 1 ? 'untereinander' : 'nebeneinander'}, kein Wort abgeschnitten`, JSON.stringify(m));
    await c.close();
  }

  console.log('4 · R4 Sicherung teilen (Teilen-Menü des Geräts, gestellt)');
  { const { p, c } = await seite([D(1, 'Limo')], 390);
    await p.evaluate(() => { window.__geteilt = null; navigator.canShare = (d) => !!(d && d.files); navigator.share = async (d) => { window.__geteilt = { name: d.files[0].name, typ: d.files[0].type, inhalt: await d.files[0].text() }; }; });
    await geh(p, 'mehr'); await p.waitForTimeout(300);
    for (const k of await p.locator('.einst details:not([open]) > summary, .eklapp:not([open]) > summary').all()) await k.click().catch(() => {});
    const z = p.locator('[data-a=sicherung-teilen]');
    if (!(await z.count())) { await p.evaluate(() => { const n = [...document.querySelectorAll('[data-a]')].find((e) => /sichern/.test(e.dataset.a)); if (n) n.scrollIntoView(); }); }
    ok(await z.count() === 1, 'in „Sichern“ steht „Sicherung teilen“');
    await z.click().catch(() => {}); await p.waitForFunction(() => window.__geteilt, null, { timeout: 5000 }).catch(() => {});
    const g = await p.evaluate(() => window.__geteilt);
    ok(g && /^mein-mixarium-\d{4}-\d\d-\d\d\.json$/.test(g.name) && g.typ === 'application/json' && JSON.parse(g.inhalt).recipes.length === 1, 'geteilt wird die Sicherung als Datei (mein-mixarium-Datum.json) mit dem Getränk', JSON.stringify(g && g.name));
    await c.close(); }
  ok(!fehler.length, 'keine Fehler im Browser', fehler.slice(0, 3).join(' | '));
} catch (f) { rot++; console.log('  ✗ ROT Absturz — ' + String(f && f.message || f).split('\n')[0]); }
await b.close(); server.close();
console.log(`\n${gruen} grün · ${rot} ROT`); process.exitCode = rot ? 1 : 0;
