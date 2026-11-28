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
      const vor = await p.evaluate(() => { const d = document.querySelector('details.frag[open]'); return d && (() => { const q = d.querySelector('summary').getBoundingClientRect(), r = d.querySelector('p').getBoundingClientRect(); return Math.round(Math.min(Math.abs(r.top - q.bottom), Math.abs(q.top - r.bottom))); })(); });
      await p.mouse.wheel(0, 60); await p.waitForTimeout(250);
      const nach = await p.evaluate(() => { const d = document.querySelector('details.frag[open]'); return d && (() => { const q = d.querySelector('summary').getBoundingClientRect(), r = d.querySelector('p').getBoundingClientRect(); return Math.round(Math.min(Math.abs(r.top - q.bottom), Math.abs(q.top - r.bottom))); })(); });
      ok(vor != null && nach != null && vor <= 8 && nach <= 8, 'die offene Blase wandert beim Rollen mit dem „?“ (bleibt direkt darüber oder darunter)', JSON.stringify([vor, nach])); }
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

  console.log('5 · P2 „Mein Mixarium Pro“: Pro-Zeile nur in der Hülle, rotes Schild „Update“ nur bei neuem Update');
  { const { p, c } = await seite([D(1, 'Limo')], 390);
    ok(await p.locator('.name .pro-zeile').count() === 0 && await p.locator('.name .ver').count() === 1, 'PWA: keine Pro-Zeile, die Versionsnummer wie bisher');
    await c.close(); }
  for (const [neuDa, name] of [['', 'ohne Update'], ['10.0.1', 'mit Update']]) {
    const c = await b.newContext({ viewport: { width: 390, height: 820 }, locale: 'de-DE', serviceWorkers: 'block' }), p = await c.newPage();
    await c.addInitScript((n) => { window.__inst = 0; window.Capacitor = { isNativePlatform: () => true, Plugins: { DoUpdates: { pruefen: async () => ({ neu: n }), installieren: async () => { window.__inst++; return {}; } } } }; }, neuDa);
    await p.route(/^https?:\/\/(?!localhost)/, (r) => r.abort()); p.on('pageerror', (e) => fehler.push(e.message));
    await p.goto(ORT + '?leer'); await p.waitForSelector('.mx .titel'); await p.waitForTimeout(4600);
    const z = await p.evaluate(() => { const n = document.querySelector('.name'), q = n && n.querySelector('.pro-zeile'); return { zeile: q ? q.innerText.replace(/\s+/g, ' ').trim() : '', zweite: !!q && q.getBoundingClientRect().top > n.firstChild.parentElement.getBoundingClientRect().top + 8, schild: !!document.querySelector('.upd-schild'), farbe: document.querySelector('.upd-schild') ? getComputedStyle(document.querySelector('.upd-schild')).backgroundColor : '' }; });
    ok(/^Pro 10\.0\.0-vor\d+/.test(z.zeile) && z.zweite, `Hülle (${name}): Zeile 2 „Pro“ + Versionsnummer`, JSON.stringify(z));
    ok(neuDa ? z.schild && z.farbe === 'rgb(198, 40, 40)' && /Update$/.test(z.zeile) : !z.schild, neuDa ? 'Hülle mit Update: rotes Schild „Update“ hinter der Versionsnummer' : 'Hülle ohne Update: kein Schild', JSON.stringify(z));
    if (neuDa) { await p.click('.upd-schild'); await p.waitForTimeout(300); ok(await p.evaluate(() => window.__inst) === 1, 'ein Tipp aufs Schild startet die Installation über die Hülle'); }
    await c.close();
  }

  console.log('6 · Bild entsteht: kreisende Punkte und geschätzte Prozent, auch nach einem Seitenwechsel (Klaus 26.11.)');
  { const PNG = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
    const { p, c } = await seite([D(1, 'Limo')], 390);
    await p.evaluate(() => new Promise((ja) => { const a = indexedDB.open('KuechenKern-mixarium'); a.onsuccess = () => { const t = a.result.transaction('zustand', 'readwrite'); t.objectStore('zustand').put('sk-probe-bild-0000000000000000', 'schluessel-openai'); t.oncomplete = () => { a.result.close(); ja(); }; }; }));
    await p.route('https://api.openai.com/**', (r) => { if (r.request().method() === 'GET') return r.fulfill({ contentType: 'application/json', body: '{"data":[]}' }); setTimeout(() => r.fulfill({ contentType: 'application/json', body: JSON.stringify({ data: [{ b64_json: PNG }] }) }).catch(() => {}), 3000); });
    await p.reload(); await p.waitForSelector('.mx .titel');
    await p.locator('.karte').first().click(); await p.waitForSelector('.held');
    if (!(await p.locator('[data-a=bildblatt]').count())) await p.click('[data-a=bildwerk]');
    await p.click('[data-a=bildblatt]'); await p.click('.fenster [data-a=ki-bild]');
    await p.waitForTimeout(1200);
    const a = await p.evaluate(() => { const e = document.getElementById('bild-arbeit'); return e && { an: e.classList.contains('an'), punkte: e.querySelectorAll('.ba-punkte i').length, zahl: parseInt(e.querySelector('.ba-zahl').textContent, 10), text: e.querySelector('.ba-text').textContent, oben: Math.round(e.getBoundingClientRect().top) }; });
    ok(a && a.an && a.punkte === 3 && a.zahl > 0 && a.zahl < 100 && /KI-Bild/.test(a.text) && a.oben >= 0, 'während das Bild entsteht: Pille oben mit drei Punkten und geschätzter Prozentzahl unter 100', JSON.stringify(a));
    await geh(p, 'mehr'); await p.waitForTimeout(800);
    const b2 = await p.evaluate(() => { const e = document.getElementById('bild-arbeit'); return e && { an: e.classList.contains('an'), zahl: parseInt(e.querySelector('.ba-zahl').textContent, 10) }; });
    ok(b2 && b2.an && b2.zahl > a.zahl, 'nach einem Wechsel in die Einstellungen steht sie weiter da, die Zahl ist gestiegen', JSON.stringify([a && a.zahl, b2]));
    const ende = await p.waitForFunction(() => { const e = document.getElementById('bild-arbeit'); return e && e.classList.contains('fertig') && e.querySelector('.ba-zahl').textContent; }, null, { timeout: 8000 }).then((h) => h.jsonValue(), () => '');
    ok(ende === '100 %', 'ist das Bild da, springt die Zahl auf 100 %', ende);
    await p.waitForTimeout(1200);
    ok(await p.evaluate(() => !document.getElementById('bild-arbeit').classList.contains('an')), 'danach verschwindet die Pille');
    await c.close(); }

  console.log('7 · Zahlen an der Navi-Leiste statt „8 Getränke“ im Kopf (Klaus 26.11.)');
  for (const breite of [390, 1280]) {
    const { p, c } = await seite([D(1, 'Limo'), D(2, 'Tee'), D(3, 'Punsch', { alcohol: true })], breite);
    await p.evaluate(() => new Promise((ja) => { const a = indexedDB.open('KuechenKern-mixarium'); a.onsuccess = () => { const t = a.result.transaction('zustand', 'readwrite'), l = t.objectStore('zustand'), q = l.get('alles'); q.onsuccess = () => { const z = q.result; z.einkauf = [{ id: 1, name: 'Zitronen', ok: false, fuer: [] }, { id: 2, name: 'Minze', ok: false, fuer: [] }, { id: 3, name: 'Eis', ok: true, fuer: [] }]; z.anlaesse = [{ id: 1, titel: 'Sommerfest', posten: [] }]; l.put(z, 'alles'); }; t.oncomplete = () => { a.result.close(); ja(); }; }; }));
    await p.reload(); await p.waitForSelector('.mx .titel');
    ok(!/Getränke/.test(await p.locator('.kopf .name').innerText()), `${breite} px: im Kopf steht keine Zahl der Getränke mehr`, await p.locator('.kopf .name').innerText());
    if (breite < 600) { await p.click('.fl-griff'); await p.waitForTimeout(200); }
    const z = await p.evaluate(() => Object.fromEntries(['start', 'karte', 'einkauf', 'labor', 'mehr'].map((v) => { const b = document.querySelector(`.nav [data-go=${v}], .fl-knoepfe [data-go=${v}]`), n = b && b.querySelector('.nzahl'); return [v, n && getComputedStyle(n).display !== 'none' ? n.textContent : '']; })));
    ok(z.start === '3' && z.karte === '1' && z.einkauf === '2' && z.labor === '' && z.mehr === '', `${breite} px: Getränke 3 · Karte 1 · Einkauf 2 (nur offene) · Labor und Einstellungen ohne Zahl`, JSON.stringify(z));
    await c.close();
  }

  console.log('8 · Vor und Zurück im Vollbild, in der gewählten Kategorie (Klaus 26.11.)');
  { const G = [D(1, 'Apfel-Limo', { cat: 'limo' }), D(2, 'Birnen-Limo', { cat: 'limo' }), D(3, 'Cola-Mocktail', { cat: 'mock' }), D(4, 'Dattel-Limo', { cat: 'limo' })];
    const titel = (p) => p.evaluate(() => __mixarium.sammlung.getraenke.find((r) => r.uid === __mixarium.zustand.uid).name);
    { const { p, c } = await seite(G, 1280);
      await p.click('.stk[data-kat=limo]'); await p.waitForTimeout(300);
      await p.locator('.karte', { hasText: 'Apfel-Limo' }).first().click(); await p.waitForSelector('.held-voll');
      ok(await p.locator('.blatt-pfeil').count() === 0, 'ohne Vollbild keine Pfeile');
      await p.click('.held-voll'); await p.waitForTimeout(300);
      ok(await p.locator('.blatt-pfeil').count() === 2 && await p.locator('.blatt-pfeil.links').isDisabled() && /^1 \/ 3$/.test(await p.locator('.blatt-stand').innerText()), 'im Vollbild zwei Pfeile im Bild, „1 / 3“ (nur Limonaden), am Anfang ist „zurück“ aus', await p.locator('.blatt-stand').innerText().catch(() => ''));
      await p.click('.blatt-pfeil.rechts'); await p.waitForTimeout(200); const t1 = await titel(p);
      await p.keyboard.press('ArrowRight'); await p.waitForTimeout(200); const t2 = await titel(p);
      ok(t1 === 'Birnen-Limo' && t2 === 'Dattel-Limo', 'Pfeil und Taste → gehen weiter, der Cola-Mocktail (andere Kategorie) wird übersprungen', t1 + ' → ' + t2);
      ok(await p.locator('.blatt-pfeil.rechts').isDisabled() && await p.locator('.md.fokus').count() === 1, 'am Ende ist „weiter“ aus; das Vollbild bleibt');
      await p.keyboard.press('ArrowLeft'); await p.waitForTimeout(200); ok(await titel(p) === 'Birnen-Limo', '← geht zurück');
      await p.evaluate(() => { __mixarium.zustand.bildVoll = true; __mixarium.zeichne(); }); await p.waitForSelector('.bildvoll'); await p.click('.bildvoll .blatt-pfeil.rechts'); await p.waitForTimeout(200);
      ok(await p.locator('.bildvoll').count() === 1 && await titel(p) === 'Dattel-Limo', 'auch im Vollbild des Bildes: weiter zum nächsten Getränk der Kategorie');
      await c.close(); }
    { const { p, c } = await seite(G, 390);
      await p.locator('.karte', { hasText: 'Apfel-Limo' }).first().click(); await p.waitForSelector('.held-voll'); await p.click('.held-voll'); await p.waitForTimeout(300);
      await p.evaluate(() => { __mixarium.zustand.bildVoll = true; __mixarium.zeichne(); }); const imBild = await p.locator('.bildvoll .blatt-pfeil').count();
      await p.evaluate(() => { __mixarium.zustand.bildVoll = false; __mixarium.zeichne(); });
      ok(await p.locator('.blatt-pfeil').count() === 0 && imBild === 0, 'am Handy keine Pfeile (Klaus: sie stören), auch nicht im Vollbild des Bildes; dafür Wischen', 'im Bild ' + imBild);
      const wisch = (von, bis) => p.evaluate(([a, z]) => { const el = document.querySelector('.innen-p') || document.querySelector('.haupt'); const t = (x) => new Touch({ identifier: 1, target: el, clientX: x, clientY: 400 }); el.dispatchEvent(new TouchEvent('touchstart', { touches: [t(a)], changedTouches: [t(a)], bubbles: true })); el.dispatchEvent(new TouchEvent('touchend', { touches: [], changedTouches: [t(z)], bubbles: true })); }, [von, bis]);
      await wisch(300, 100); await p.waitForTimeout(200); const w1 = await titel(p);
      await wisch(300, 100); await p.waitForTimeout(200); const w2 = await titel(p);
      await wisch(100, 300); await p.waitForTimeout(200); const w3 = await titel(p);
      ok(w1 === 'Birnen-Limo' && w2 === 'Cola-Mocktail' && w3 === 'Birnen-Limo', 'Wischen nach links: nächstes, nach rechts: voriges (Kategorie „Alle“: durch alle)', [w1, w2, w3].join(' · '));
      await p.click('.held-voll'); await p.waitForTimeout(200); await wisch(300, 100); await p.waitForTimeout(200);
      ok(await titel(p) === 'Birnen-Limo', 'ohne Vollbild blättert Wischen nicht');
      await c.close(); }
  }
  console.log('9 · Das Bild läuft weich aus, wie in „Ordnung auf Japanisch“ (Klaus 26.11.)');
  { const { p, c } = await seite([D(1, 'Apfel-Limo', { cat: 'limo' })], 1280);
    await p.locator('.karte', { hasText: 'Apfel-Limo' }).first().click(); await p.waitForSelector('.detail-kopf .held.ganz');
    const m = await p.evaluate(() => { const h = document.querySelector('.detail-kopf .held.ganz'), b = h.querySelector(':scope>:is(.foto,svg.platzbild)'), s = document.querySelector('.detail-kopf .seite'), cs = getComputedStyle(b), rb = b.getBoundingClientRect(), rs = s.getBoundingClientRect();
      return { maske: String(cs.maskImage || cs.webkitMaskImage || ''), randlos: getComputedStyle(h).backgroundColor, ueber: rs.left < rb.right - 20, linie: getComputedStyle(document.querySelector('.detail-kopf')).borderBottomWidth }; });
    ok((m.maske.match(/linear-gradient/g) || []).length === 2, 'alle vier Ränder des Bildes laufen weich aus (zwei Verläufe als Maske)', m.maske.slice(0, 80));
    ok(/rgba\(0, 0, 0, 0\)|transparent/.test(m.randlos) && m.linie === '0px', 'keine Fläche und keine Linie um das Bild (keine Briefmarke)', m.randlos + ' · ' + m.linie);
    ok(m.ueber, 'Name und Angaben beginnen schon im auslaufenden Bild', JSON.stringify(m));
    await c.close(); }
  { /* Klaus 28.11.: Name im Kopfbild am Handy zu groß, lange Namen aus Foto/KI-Scan liefen über viele Zeilen oder aus dem Bild */
    const lang = 'Frühlingskartoffelsuppengetränk mit Spargel und Bärlauch und noch viel mehr Text aus dem KI-Scan';
    const { p, c } = await seite([D(1, lang, { cat: 'limo' })], 412);
    await p.locator('.karte').first().click(); await p.waitForSelector('.held .ueber h2');
    const m = await p.evaluate(() => { const h = document.querySelector('.held .ueber h2'), cs = getComputedStyle(h), r = h.getBoundingClientRect(), b = document.querySelector('.held').getBoundingClientRect(); return { gr: parseFloat(cs.fontSize), zeilen: Math.round(r.height / parseFloat(cs.lineHeight)), raus: h.scrollWidth > h.clientWidth + 1 || r.right > b.right + 1 }; });
    ok(m.gr >= 17 && m.gr <= 21, 'Handy: Name im Kopfbild 17–21 px (vorher 24)', String(m.gr));
    ok(m.zeilen <= 2 && !m.raus, '… höchstens zwei Zeilen, nichts läuft aus dem Bild', JSON.stringify(m));
    await c.close(); }
  ok(!fehler.length, 'keine Fehler im Browser', fehler.slice(0, 3).join(' | '));
} catch (f) { rot++; console.log('  ✗ ROT Absturz — ' + String(f && f.message || f).split('\n')[0]); }
await b.close(); server.close();
console.log(`\n${gruen} grün · ${rot} ROT`); process.exitCode = rot ? 1 : 0;
