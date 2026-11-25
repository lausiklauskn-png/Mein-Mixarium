// Probe der neuen PWA: R6 Doppelungen (Klaus 25.11., wie im Rezeptbuch 0.18) – nach dem Einlesen die Liste der Paare mit Wahl je Paar,
// das Band im Formular beim einzelnen Anlegen. „Mit Alkohol“ ↔ „alkoholfrei“ ist nie ein Doppel. Echte Bilder (Verlauf als JPEG in zwei
// Qualitäten = dasselbe Bild, gespiegelter Verlauf = ein anderes), kein Netz.   node tests/smoke_neu_doppel.mjs  (WURZEL=<Pfad> misst eine Kopie)
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
const D = (n, name, mehr = {}, zutaten = ['Limettensaft', 'Minze', 'Rohrzucker', 'Sprudelwasser']) => ({ id: n, uid: 'g-' + n, name, cat: 'mock', glass: 'highball', temp: 'kalt', servings: 1, prepTime: 5, alcohol: false, folder: '', img: '', notes: '',
  ings: zutaten.map((z, i) => ({ id: i, amt: '2', unit: 'cl', name: z, note: '', ck: false })), steps: [{ id: 0, txt: 'Alles auf Eis verrühren.' }], created: 1, modified: 1, ...mehr });
async function seite(getraenke, breite = 390) {
  const c = await b.newContext({ viewport: { width: breite, height: 860 }, locale: 'de-DE', serviceWorkers: 'block' }), p = mitThemen(await c.newPage()); p.setDefaultTimeout(10000);
  p.on('pageerror', (e) => fehler.push(e.message)); p.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) fehler.push(m.text()); });
  await p.route(/^https?:\/\/(?!localhost)/, (r) => { fehler.push('Netz nach draußen: ' + r.request().url()); r.abort(); });
  await p.goto(U + 'impressum.html');
  await p.evaluate((g) => new Promise((ja, nein) => { const a = indexedDB.open('KuechenKern-mixarium', 1); a.onupgradeneeded = () => a.result.createObjectStore('zustand'); a.onerror = () => nein(a.error);
    a.onsuccess = () => { const t = a.result.transaction('zustand', 'readwrite'), l = t.objectStore('zustand'); l.put({ getraenke: g, ordner: [], karten: [], einkauf: [], anlaesse: [], einstellungen: { ohneAlkohol: false, sprache: null }, knoten: null }, 'alles'); l.put({ ton: 'hell' }, 'einst'); t.oncomplete = () => { a.result.close(); ja(); }; }; }), getraenke);
  await p.goto(ORT); await p.waitForSelector('.mx .titel'); return { p, c };
}
const sammlung = (p) => p.evaluate(() => new Promise((ja) => { const a = indexedDB.open('KuechenKern-mixarium'); a.onsuccess = () => { const q = a.result.transaction('zustand').objectStore('zustand').get('alles'); q.onsuccess = () => { a.result.close(); ja(q.result); }; }; }));
const sammlungWenn = async (p, f) => { let s = await sammlung(p); for (let i = 0; i < 40 && !f(s); i++) { await p.waitForTimeout(100); s = await sammlung(p); } return s; };
const toastMit = (p, re, zeit = 10000) => p.waitForFunction((q) => { const t = ((document.querySelector('.mxtoast') || {}).innerText || '').trim().replace(/\s+/g, ' '); return new RegExp(q).test(t) ? t : false; }, re.source, { timeout: zeit }).then((h) => h.jsonValue(), () => p.locator('.mxtoast').innerText().then((t) => 'statt dessen: ' + t.trim(), () => 'keine Meldung'));
const zuEinst = async (p) => { await p.waitForSelector('.fenster', { state: 'detached' }); if (await p.locator('.nav [data-go=mehr]').count()) return p.click('.nav [data-go=mehr]'); await p.click('.fl-griff'); await p.click('.fl-knoepfe [data-go=mehr]'); };
const einlesen = async (p, getraenke) => { await zuEinst(p); await p.click('[data-a=einspielen]'); await p.setInputFiles('#datei', { name: 'neu.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify({ version: 10, recipes: getraenke, folders: [], menu: [] })) }); await p.waitForSelector('[data-a=datei-dazu]'); await p.click('[data-a=datei-dazu]'); };

/* Bilder: ein Verlauf als JPEG 0.92 und 0.4 (dasselbe Bild, andere Bytes) und der gespiegelte Verlauf (ein anderes Bild). */
const bk = await b.newContext(), bp = await bk.newPage(); await bp.goto(U + 'impressum.html');
const [G1, G1b, G2] = await bp.evaluate(() => { const mal = (spiegel, q) => { const c = document.createElement('canvas'); c.width = 320; c.height = 240; const g = c.getContext('2d'); const v = g.createLinearGradient(0, 0, 320, 240); v.addColorStop(spiegel ? 1 : 0, '#c0392b'); v.addColorStop(0.5, '#f1c40f'); v.addColorStop(spiegel ? 0 : 1, '#2c3e50'); g.fillStyle = v; g.fillRect(0, 0, 320, 240); g.fillStyle = '#fff'; g.fillRect(spiegel ? 40 : 230, 60, 50, 120); return c.toDataURL('image/jpeg', q); }; return [mal(false, 0.92), mal(false, 0.4), mal(true, 0.92)]; });   /* wie im Rezeptbuch: Rot und Dunkelblau unterscheiden sich in der Helligkeit, sonst sähe der gespiegelte Verlauf für den Fingerabdruck gleich aus */
await bk.close();
ok(G1 !== G1b && G1 !== G2, 'Selbst-Riegel: die drei Bilder sind verschiedene Dateien');

const BESTAND = [D(1, 'Ingwer-Limo', {}, ['Ingwer', 'Zitronensaft', 'Honig', 'Sprudelwasser']), D(2, 'Beerenschorle', { img: G1 }, ['Himbeeren', 'Apfelsaft', 'Sprudelwasser']), D(3, 'Mojito', { alcohol: true, cat: 'ckt' }, ['Rum', 'Minze', 'Limettensaft', 'Rohrzucker']), D(4, 'Eistee', {}, ['Schwarztee', 'Zitrone', 'Zucker'])];
const DATEI = [D(11, 'Ingwer-Limo', {}, ['Ingwer', 'Zitronensaft', 'Honig', 'Sprudelwasser', 'Minze']),
  D(12, 'Sommerschorle', { img: G1b }, ['Erdbeeren', 'Traubensaft']),
  D(13, 'Virgin Mojito', { alcohol: false }, ['Minze', 'Limettensaft', 'Rohrzucker', 'Sprudelwasser']),
  D(14, 'Rote Schorle', { img: G2 }, ['Kirschsaft', 'Wasser']),
  D(15, 'Eistee', {}, ['Pfirsich', 'Grüntee', 'Eis'])];

try {
  for (const breite of [390, 1280]) {
    console.log(`1 · Datei „Hinzufügen“ mit Doppeln (${breite} px)`);
    const { p, c } = await seite(BESTAND, breite);
    await einlesen(p, DATEI); await p.waitForSelector('#doppel-liste', { timeout: 15000 }).catch(() => {});
    let s = await sammlungWenn(p, (x) => x.getraenke.length === 9);
    ok(s.getraenke.length === 9, 'alles kommt zuerst herein (4 + 5), nichts geht verloren, solange nicht gewählt ist', String(s.getraenke.length));
    const paare = await p.locator('.dp').evaluateAll((l) => l.map((e) => [e.dataset.neu, e.querySelector('.dp-stufe').className.split(' ')[1], (e.querySelector('[aria-pressed=true]') || {}).dataset?.w]));
    ok(JSON.stringify(paare) === JSON.stringify([['g-11', 'sicher', 'meins'], ['g-12', 'vielleicht', 'beide'], ['g-15', 'vielleicht', 'beide']]), 'genau drei Paare: Ingwer-Limo sicher (Vorgabe „Meins behalten“), Sommerschorle über das gleiche Bild und Eistee mit gleichem Namen, aber anderen Zutaten vielleicht (Vorgabe „Beide behalten“)', JSON.stringify(paare));
    ok(!paare.some(([u]) => ['g-13', 'g-14'].includes(u)), 'kein Doppel: Virgin Mojito (alkoholfrei neben dem Mojito mit Rum), Rote Schorle (anderes Bild)');
    ok(/gleiches Bild/.test(await p.locator('.dp[data-neu="g-12"] .dp-kopf').innerText()) && /Name gleich/.test(await p.locator('.dp[data-neu="g-11"] .dp-kopf').innerText()), 'je Paar steht der Grund da');
    ok(await p.locator('.dp[data-neu="g-11"] [data-w=bild]').count() === 0 && await p.locator('.dp[data-neu="g-12"] [data-w=bild]').count() === 1, '„Bild vom neuen“ nur, wenn das neue ein Bild hat');
    ok(await p.locator('.fenster').evaluate((f) => f.scrollWidth <= f.clientWidth + 1 && [...f.querySelectorAll('.dp-wahl .chip')].every((x) => { const r = x.getBoundingClientRect(), q = f.getBoundingClientRect(); return r.right <= q.right + 1 && r.height >= 32; })), 'das Fenster läuft nicht quer über, jeder Knopf ist groß genug für den Finger');
    await p.click('.dp[data-neu="g-11"] [data-w=ganz]'); await p.click('.dp[data-neu="g-12"] [data-w=bild]');
    ok(await p.locator('.dp[data-neu="g-11"] [aria-pressed=true]').count() === 1 && await p.locator('.dp[data-neu="g-11"] [aria-pressed=true]').getAttribute('data-w') === 'ganz', 'je Paar ist genau eine Wahl gedrückt');
    await p.click('[data-a=dp-fertig]'); const t = await toastMit(p, /Doppel zusammengeführt/);
    s = await sammlungWenn(p, (x) => x.getraenke.length === 7);
    const g = s.getraenke.find((r) => r.uid === 'g-1'), sc = s.getraenke.find((r) => r.uid === 'g-2');
    ok(s.getraenke.length === 7 && !s.getraenke.some((r) => r.uid === 'g-11' || r.uid === 'g-12'), 'die beiden neuen sind nach der Wahl weg, alle anderen bleiben', String(s.getraenke.length));
    ok(g && g.ings.length === 5 && g.id === 1 && g.uid === 'g-1', '„Ganz das neue“: Zutaten vom neuen, Platz und Kennung von meinem', JSON.stringify(g && [g.ings.length, g.id]));
    ok(sc && sc.img === G1b && sc.name === 'Beerenschorle' && sc.ings.length === 3, '„Bild vom neuen“: nur das Bild wechselt, Name und Zutaten bleiben');
    ok(/^2 Doppel zusammengeführt/.test(t) && /Rückgängig/.test(t), 'die Meldung sagt es und bietet Rückgängig', t);
    await p.click('.mxtoast [data-a=toast-tun]'); s = await sammlungWenn(p, (x) => x.getraenke.length === 9);
    ok(s.getraenke.length === 9 && s.getraenke.find((r) => r.uid === 'g-1').ings.length === 4, 'Rückgängig: beide wieder da, meine Ingwer-Limo wie vorher');
    await c.close();
  }

  console.log('2 · „Später“ behält beide; dieselbe Datei noch einmal fragt nicht (gleiche Kennungen)');
  { const { p, c } = await seite(BESTAND);
    await einlesen(p, DATEI); await p.waitForSelector('#doppel-liste', { timeout: 15000 });
    await p.click('.fenster [data-a=fenster-zu]'); await p.waitForTimeout(600);
    ok((await sammlung(p)).getraenke.length === 9 && await p.locator('.fenster').count() === 0, '„Später“ schließt, beide bleiben');
    await einlesen(p, DATEI); const t = await toastMit(p, /schon da/); await p.waitForTimeout(1200);
    ok(await p.locator('#doppel-liste').count() === 0 && /5 waren schon da/.test(t), 'dieselbe Datei noch einmal: „5 waren schon da“, kein Doppel-Fenster', t);
    await c.close(); }

  console.log('3 · Band im Formular beim einzelnen Anlegen');
  { const { p, c } = await seite(BESTAND);
    const neuForm = async (name, zutaten, alk = false) => { await p.waitForSelector('.fenster', { state: 'detached' }); if (!(await p.locator('.kopf [data-a=neu]').count())) { await p.click('.fl-griff'); await p.click('.fl-knoepfe [data-go=start]'); } await p.click('.kopf [data-a=neu]'); await p.click('[data-a=neu-form]'); await p.waitForSelector('#ed'); await p.fill('#ed [name=name]', name); await p.fill('#ed [name=ings]', zutaten); await p.fill('#ed [name=steps]', 'Verrühren.'); if (alk) await p.check('#ed [name=alcohol]'); await p.click('#ed [type=submit]'); };
    await neuForm('Ingwer-Limonade', '2 cl Ingwer\n2 cl Zitronensaft\n1 TL Honig\n200 ml Sprudelwasser');
    await p.waitForSelector('#ed-doppel', { timeout: 8000 }).catch(() => {});
    let s = await sammlung(p);
    ok(await p.locator('#ed-doppel').count() === 1 && s.getraenke.length === 4, 'ähnliches Getränk: ein Band im Formular statt Speichern, kein Zwischenfenster', String(s.getraenke.length));
    ok(/Ingwer-Limo/.test(await p.locator('#ed-doppel').innerText()) && await p.locator('#ed-doppel [data-w=bild]').count() === 0, 'das Band nennt das vorhandene Getränk; ohne Foto kein „Nur das Bild“');
    ok(await p.inputValue('#ed [name=name]') === 'Ingwer-Limonade', 'die Eingaben bleiben im Formular stehen');
    await p.click('#ed-doppel [data-w=text]'); const t = await toastMit(p, /übernommen/);
    s = await sammlungWenn(p, (x) => x.getraenke.find((r) => r.uid === 'g-1').name !== 'Ingwer-Limo');
    ok(s.getraenke.length === 4 && s.getraenke.find((r) => r.uid === 'g-1').name === 'Ingwer-Limonade', '„Nur den Text übernehmen“: kein neues Getränk, meine Ingwer-Limo trägt den neuen Text', JSON.stringify(s.getraenke.map((r) => r.name)));
    ok(/In „Ingwer-Limo“ übernommen/.test(t), 'die Meldung sagt es', t);
    await neuForm('Eistee', 'Schwarztee\nZitrone\nZucker'); await p.waitForSelector('#ed-doppel', { timeout: 8000 });
    await p.click('#ed-doppel [data-w=eigen]'); await toastMit(p, /Gespeichert/);
    ok((await sammlungWenn(p, (x) => x.getraenke.length === 5)).getraenke.length === 5, '„Als eigenes Getränk speichern“ legt es an');
    await neuForm('Mojito', '4 cl Rum\nMinze\n2 cl Limettensaft\n2 TL Rohrzucker', true); await p.waitForSelector('#ed-doppel', { timeout: 8000 }).catch(() => {});
    ok(await p.locator('#ed-doppel').count() === 1, 'ein zweiter Mojito mit Alkohol: Band');
    await p.click('#ed [data-a=fenster-zu]');
    await neuForm('Mojito', 'Minze\n2 cl Limettensaft\n2 TL Rohrzucker\nSoda'); await toastMit(p, /Gespeichert/);
    ok((await sammlungWenn(p, (x) => x.getraenke.length === 6)).getraenke.length === 6 && await p.locator('#ed-doppel').count() === 0, '„Mojito“ ohne Alkohol neben dem mit Rum: kein Doppel, sofort gespeichert (Klaus 25.11.)');
    await neuForm('Gurkenwasser', 'Gurke\nWasser\nMinze'); await toastMit(p, /Gespeichert/);
    ok((await sammlungWenn(p, (x) => x.getraenke.length === 7)).getraenke.length === 7, 'ohne Ähnliches wird sofort gespeichert, ohne Band');
    await c.close(); }

  ok(!fehler.length, 'keine Fehler im Browser', fehler.slice(0, 3).join(' | '));
} catch (f) { rot++; console.log('  ✗ ROT Absturz — ' + String(f && f.message || f).split('\n')[0]); }
await b.close(); server.close();
console.log(`\n${gruen} grün · ${rot} ROT`); process.exitCode = rot ? 1 : 0;
