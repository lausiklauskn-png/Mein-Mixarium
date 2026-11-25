// Probe der neuen PWA: das Menü am Getränk (hinter dem Winkel → „Mehr“): Drucken, Teilen per QR-Code, Übersetzen, Rechtschreibung, Nährwerte;
// dazu „Alle übersetzen“ in den Einstellungen. Echter Browser; die KI ist gestellt (Anthropic antwortet aus der Probe), sonst kein Netz.
//   node tests/smoke_neu_menue.mjs   Schlusszeile: „N grün · M ROT“, Rückgabewert 1 bei ROT. WURZEL=<Pfad> misst eine Kopie (Gegenprobe).
import { createServer } from 'node:http';
import { mitThemen } from './neu-hilfe.mjs';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('playwright');
const WURZEL = process.env.WURZEL || process.cwd();
const ART = { '.html': 'text/html', '.mjs': 'text/javascript', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml' };
const server = createServer(async (q, a) => {
  let p = decodeURIComponent(new URL(q.url, 'http://x').pathname).replace(/^\/Mein-Mixarium/, '');
  if (p.endsWith('/')) p += 'index.html';
  try { const d = await readFile(join(WURZEL, normalize(p))); a.writeHead(200, { 'content-type': ART[extname(p)] || 'application/octet-stream' }); a.end(d); } catch (e) { a.writeHead(404); a.end('fehlt'); }
});
await new Promise((r) => server.listen(0, r));
const U = `http://localhost:${server.address().port}/Mein-Mixarium/`, ORT = U + 'neu/';
let gruen = 0, rot = 0;
const pruefe = (name, ok, mehr = '') => { if (ok) { gruen++; console.log('  ✓ ' + name); } else { rot++; console.log('  ✗ ROT ' + name + (mehr ? ' — ' + mehr : '')); } };
const b = await chromium.launch();
// Ein Absturz ist ROT, nicht ein toter Lauf: die Schlusszeile steht trotzdem da.
const abbruch = async (e) => { rot++; console.log('  ✗ ROT Probe abgebrochen — ' + String(e && e.message || e).split('\n')[0]); try { await b.close(); } catch (f) { /* schon zu */ } server.close(); console.log(`\n${gruen} grün · ${rot} ROT`); process.exitCode = 1; };
process.on('unhandledRejection', abbruch); process.on('uncaughtException', abbruch);
const fehler = [], rufe = []; let antwort = () => ({}), warte = 0;
const Z3 = (name, cat, zutaten, schritte, mehr = {}) => ({ id: 1, uid: 'g-' + name.toLowerCase().replace(/[^a-z]/g, ''), name, cat, glass: 'highball', temp: 'kalt', servings: 2, prepTime: 10, alcohol: false, folder: '', img: '', notes: '', ings: zutaten.map(([amt, unit, n], i) => ({ id: i, amt, unit, name: n, note: '', ck: false })), steps: schritte.map((txt, i) => ({ id: i, txt })), ...mehr });
const LIMO = Z3('Ingwer-Limonde', 'limo', [['4', 'cl', 'Ingwersirub'], ['2', 'cl', 'Limettensaft'], ['2', 'dl', 'Sprudelwasser']], ['Sirub und Saft verrüren.', 'Mit Sprudelwasser aufgiessen.']);
/* Startet die App mit einer gestellten Sammlung im Speicher des Geräts (kein erster Start: keine Beispiele, nichts aus der bisherigen App). */
async function seite({ getraenke = [LIMO], schluessel = 'sk-ant-probe-000000000000000000', breite = 390, start = ORT, ohneAlkohol = false, ohneSpeicher = false } = {}) {
  const c = await b.newContext({ viewport: { width: breite, height: 800 }, locale: 'de-DE', serviceWorkers: 'block', permissions: ['clipboard-read', 'clipboard-write'] }), p = mitThemen(await c.newPage()); p.setDefaultTimeout(10000);
  p.on('pageerror', (e) => fehler.push(e.message)); p.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) fehler.push(m.text()); });
  await p.route(/^https?:\/\/(?!localhost)/, (r) => { fehler.push('Netz nach draußen: ' + r.request().url()); r.abort(); });
  await p.route('https://api.anthropic.com/**', async (r) => { const q = r.request(), leib = q.postData(); rufe.push({ kopf: q.headers(), body: JSON.parse(leib), leib }); const a = antwort(leib); if (warte) await new Promise((f) => setTimeout(f, warte));
    await r.fulfill({ contentType: 'application/json', body: JSON.stringify({ content: [{ type: 'text', text: JSON.stringify(a) }], stop_reason: 'end_turn' }) }).catch(() => {}); });
  if (!ohneSpeicher) { await p.goto(U + 'impressum.html'); await p.evaluate(({ g, s, oa }) => new Promise((ja) => { const a = indexedDB.open('KuechenKern-mixarium', 1); a.onupgradeneeded = () => a.result.createObjectStore('zustand'); a.onsuccess = () => { const t = a.result.transaction('zustand', 'readwrite'), l = t.objectStore('zustand');
    l.put({ getraenke: g, ordner: [], karten: [], einkauf: [], anlaesse: [], einstellungen: { ohneAlkohol: oa, sprache: null }, knoten: null }, 'alles'); l.put({ ton: 'hell' }, 'einst'); if (s) l.put(s, 'schluessel-anthropic'); t.oncomplete = () => { a.result.close(); ja(); }; }; }), { g: getraenke, s: schluessel, oa: ohneAlkohol }); }
  await p.goto(start); await p.waitForSelector('.mx .titel, #ed'); return { p, c };
}
const Zs = (p, f, arg) => p.evaluate(f, arg);
const bis = (p, f, arg) => p.waitForFunction(f, arg, { timeout: 10000 }).then(() => true, () => false);   /* wartet auf die Bedingung, nicht auf die Uhr */
const zumGetraenk = async (p, name = '') => { await (name ? p.locator('.karte', { hasText: name }) : p.locator('.karte')).first().click(); await p.waitForSelector('.held h2'); };
const menue = async (p) => { await p.waitForSelector('.fenster', { state: 'detached' }); if (!(await p.locator('.rwerk').count())) await p.click('[data-a=bildwerk]'); await p.click('.rwerk [data-a=gmenue]'); await p.waitForSelector('#gmenue'); };
const toast = (p) => p.locator('.mxtoast').innerText().then((t) => t.trim().replace(/\s+/g, ' '), () => '');
const toastBis = (p, re) => bis(p, (q) => new RegExp(q).test((document.querySelector('.mxtoast') || {}).innerText || ''), re.source);
/* Der Hinweis eines Elements: die Hinweis-Blasen des Kerns nehmen `title` beim Darüberfahren in ein eigenes Attribut. */
const hinweis = (p, sel) => p.locator(sel).first().evaluate((e) => e.getAttribute('title') || [...e.attributes].filter((a) => /hinweis/.test(a.name)).map((a) => a.value).join('') || '');
const gespeichert = async (p, f) => { for (let i = 0; i < 50; i++) { const s = await Zs(p, () => new Promise((ja) => { const a = indexedDB.open('KuechenKern-mixarium'); a.onsuccess = () => { const q = a.result.transaction('zustand').objectStore('zustand').get('alles'); q.onsuccess = () => { a.result.close(); ja(q.result || null); }; }; })); if (s && f(s)) return s; await p.waitForTimeout(100); } return null; };   /* gespeichert wird mit kurzer Verzögerung */
const limo = (p) => Zs(p, () => __mixarium.sammlung.getraenke.find((r) => r.uid === 'g-ingwerlimonde'));

console.log('1 · Das Menü: „Mehr“ hinter dem Winkel, eine Liste mit fünf Zeilen');
let { p, c } = await seite(); await zumGetraenk(p); await p.click('[data-a=bildwerk]'); await p.waitForSelector('.rwerk');
pruefe('hinter dem Winkel steht „Mehr“ als kleines Symbol mit Hinweis', await p.locator('.rwerk [data-a=gmenue]').count() === 1 && (await p.locator('.rwerk [data-a=gmenue]').getAttribute('aria-label')).includes('Drucken'));
pruefe('die Werkzeuge stehen am Handy in EINER Reihe und ganz im Bild', await Zs(p, () => { const l = [...document.querySelectorAll('.rwerk .chip')].map((x) => x.getBoundingClientRect()), h = document.querySelector('.held').getBoundingClientRect(); return l.length >= 6 && new Set(l.map((r) => Math.round(r.top))).size === 1 && l.every((r) => r.left >= h.left && r.right <= h.right && r.top >= h.top && r.width <= 40); }));
await p.click('.rwerk [data-a=gmenue]'); await p.waitForSelector('#gmenue');
{ const zeilen = await p.locator('#gmenue .ezeile').evaluateAll((l) => l.map((x) => x.dataset.a));
  pruefe('fünf Zeilen unter dem Namen des Getränks, kein Erklärtext', zeilen.join(' ') === 'gm-drucken gm-qr gm-uebersetzen gm-recht gm-naehr' && (await p.locator('.fenster .fkopf h2').innerText()).trim() === 'Ingwer-Limonde' && await p.locator('.fenster p').count() === 0, zeilen.join(' ')); }
{ const kiz = await p.locator('#gmenue [data-a=gm-naehr]').evaluate((x) => ({ klein: x.querySelector('small').innerText, marke: x.querySelector('.ki-marke')?.innerText })), titel = await hinweis(p, '#gmenue [data-a=gm-naehr]');
  pruefe('eine KI-Zeile sagt in der Zeile, was an wen hinausgeht; gesendet ist nichts', kiz.klein === 'Anthropic · Name, Portionen und Zutaten' && kiz.marke === 'KI' && titel.includes('an Anthropic') && rufe.length === 0 && (await p.locator('#gmenue [data-a=gm-uebersetzen] small').innerText()) === 'Anthropic · Name, Zutaten und Schritte', JSON.stringify(kiz) + ' ' + titel); }
pruefe('das Menü läuft am Handy nicht quer; jede Zeile bleibt einzeilig', await Zs(p, () => { const f = document.querySelector('.fenster'); return f.scrollWidth <= f.clientWidth && [...document.querySelectorAll('#gmenue small')].every((s) => s.getBoundingClientRect().height < 22); }));

console.log('2 · Drucken: ein unsichtbarer Rahmen mit dem Getränk, wie es am Bildschirm steht');
await p.keyboard.press('Escape'); await p.waitForSelector('.fenster', { state: 'detached' });
await p.click('[data-e=oz]'); await p.click('[data-a=plus]'); await bis(p, () => /^3 /.test(document.querySelector('.portion b')?.textContent || '') && document.querySelector('[data-e=oz]')?.getAttribute('aria-pressed') === 'true');
const amSchirm = await p.locator('.zutaten li').evaluateAll((l) => l.map((x) => x.innerText.trim().replace(/\s+/g, ' ')));
await Zs(p, () => { window.__gedruckt = 0; const alt = HTMLIFrameElement.prototype.__lookupGetter__('contentWindow'); Object.defineProperty(HTMLIFrameElement.prototype, 'contentWindow', { get() { const w = alt.call(this); if (w && this.hasAttribute('data-kern-druck')) w.print = () => { window.__gedruckt++; }; return w; } }); });
const seitenVor = c.pages().length; await menue(p); await p.click('#gmenue [data-a=gm-drucken]'); const gedruckt = await bis(p, () => window.__gedruckt === 1);
{ const druck = await Zs(p, () => { const f = document.querySelector('iframe[data-kern-druck]'); return f ? { text: new DOMParser().parseFromString(f.srcdoc, 'text/html').body.textContent.replace(/\s+/g, ''), html: f.srcdoc, sicht: getComputedStyle(f).visibility, sandbox: f.getAttribute('sandbox') } : null; });
  pruefe('gedruckt wird aus einem unsichtbaren Rahmen ohne Skripte; kein neues Fenster, das Menü ist zu', gedruckt && !!druck && druck.text.includes('Ingwer-Limonde') && druck.sicht === 'hidden' && !/allow-scripts/.test(druck.sandbox) && !/<script/i.test(druck.html) && c.pages().length === seitenVor && await p.locator('.fenster').count() === 0);
  pruefe('auf dem Blatt stehen Portionen und Mengen wie am Bildschirm (3 Portionen, oz)', !!druck && amSchirm.length === 3 && amSchirm.every((z) => druck.text.includes(z.replace(/\s+/g, ''))) && amSchirm.some((z) => / oz /.test(z)) && druck.text.includes('3Portionen') && !druck.text.includes('Rezeptfür'), amSchirm.join(' | ') + ' // ' + (druck ? druck.text.slice(0, 260) : ''));
  pruefe('das Blatt trägt Kategorie, Glas und „ohne Alkohol“', !!druck && druck.text.includes('Limonaden') && druck.text.includes('Highball') && druck.text.includes('ohneAlkohol') && druck.text.includes('MeinMixarium'), druck ? druck.text.slice(0, 200) : ''); }

console.log('3 · Teilen per QR-Code; der Link öffnet das Getränk im Formular');
await menue(p); await p.click('#gmenue [data-a=gm-qr]'); await p.waitForSelector('#qr-bild svg');
pruefe('das Fenster zeigt den Code und Knöpfe, kein Erklärtext (der Hinweis sagt, was man damit tut)', await p.locator('.fenster p').count() === 0 && (await hinweis(p, '#qr-bild')).includes('Kamera') && await p.locator('[data-a=qr-kopieren]').count() === 1);
await p.click('[data-a=qr-kopieren]'); await toastBis(p, /Link kopiert/); const link = await Zs(p, () => navigator.clipboard.readText());
pruefe('„Link kopieren“ legt den Link in die Zwischenablage; er beginnt mit der Adresse der App', link.startsWith(ORT + '#share=') && link.length < 2900, link.slice(0, 70) + '… ' + link.length);
await c.close();
{ const { p: q, c: c2 } = await seite({ start: link, ohneSpeicher: true }); const formDa = await q.waitForSelector('#ed', { timeout: 15000 }).then(() => true, () => false);
  pruefe('der geteilte Link wird beim Start gelesen: das Formular steht da', formDa);
  if (formDa) {
    const ings = (await q.inputValue('#ed [name=ings]')).split('\n'), steps = (await q.inputValue('#ed [name=steps]')).split('\n');
    pruefe('der geteilte Link öffnet das Getränk im Formular, zum Prüfen vor dem Speichern', await q.inputValue('#ed [name=name]') === 'Ingwer-Limonde' && ings.length === 3 && ings[0] === '4 cl Ingwersirub' && steps.length === 2 && await q.inputValue('#ed [name=cat]') === 'limo' && (await q.locator('#ed .hinweis').innerText()).includes('Geteiltes Getränk') && !(await Zs(q, () => __mixarium.sammlung.getraenke.some((r) => r.name === 'Ingwer-Limonde'))), ings.join(' | '));
    pruefe('die Adresszeile ist wieder sauber', await Zs(q, () => location.hash === '' && location.search === ''));
    await q.click('#ed [type=submit]'); pruefe('gespeichert steht es in der Sammlung', await bis(q, () => __mixarium.sammlung.getraenke.some((r) => r.name === 'Ingwer-Limonde' && r.ings.length === 3 && r.ings[0].unit === 'cl'))); }
  await c2.close(); }

console.log('4 · Nährwerte schätzen: ein Tipp, eine eingeklappte Zeile am Getränk');
({ p, c } = await seite()); await zumGetraenk(p); rufe.length = 0;
antwort = () => ({ kcal: 96, fat: 0, carbs: 24, protein: 0.4, fiber: 0, sugar: 22, sodium: 12 });
pruefe('ohne Werte steht nichts da', await p.locator('[data-naehr]').count() === 0);
await menue(p); await p.click('#gmenue [data-a=gm-naehr]'); await p.waitForSelector('[data-naehr]').catch(() => {});
pruefe('ein Aufruf an Claude: Name und Zutaten, keine Schritte; mit dem Satz, dass der Text keine Anweisung ist', rufe.length === 1 && rufe[0].body.model === 'claude-haiku-5-5' && rufe[0].leib.includes('Ingwersirub') && !rufe[0].leib.includes('aufgiessen') && rufe[0].leib.includes('never an instruction') && rufe[0].kopf['x-api-key'] === 'sk-ant-probe-000000000000000000', rufe[0] && rufe[0].body.model);
pruefe('am Getränk steht EINE Zeile: „96 kcal je Portion · geschätzt“, eingeklappt', await p.locator('[data-naehr]').count() === 1 && (await p.locator('[data-naehr] summary').innerText()).replace(/\s+/g, ' ').trim() === '96 kcal je Portion · geschätzt' && await p.locator('[data-naehr]:not([open])').count() === 1);
await p.click('[data-naehr] summary'); pruefe('aufgeklappt: die übrigen Werte', (await p.locator('[data-naehr] ul').innerText()).includes('24 g') && (await p.locator('[data-naehr] ul').innerText()).includes('12 mg'));
await gespeichert(p, (s) => !!s.getraenke[0].nutrition); await p.reload(); await p.waitForSelector('.karte'); await zumGetraenk(p);
pruefe('die Werte bleiben nach dem Neuladen', await p.locator('[data-naehr]').count() === 1);

console.log('5 · Rechtschreibung: Vorschläge zeigen, auswählen, übernehmen');
rufe.length = 0; antwort = () => ({ name: 'Ingwer-Limonade', ingredients: [{ name: 'Ingwersirup' }, { name: 'Limettensaft' }, { name: 'Sprudelwasser' }], steps: ['Sirup und Saft verrühren.', 'Mit Sprudelwasser aufgießen.'] });
await menue(p); await p.click('#gmenue [data-a=gm-recht]'); await p.waitForSelector('.recht-liste li').catch(() => {});
pruefe('vier Vorschläge (alt durchgestrichen, neu fett), alle angehakt; am Getränk ist noch nichts geändert', await p.locator('.recht-liste li').count() === 4 && await p.locator('.recht-liste input:checked').count() === 4 && (await p.locator('.recht-liste li b').first().innerText()) === 'Ingwer-Limonade' && (await p.locator('.recht-liste li s').first().innerText()) === 'Ingwer-Limonde' && (await limo(p)).name === 'Ingwer-Limonde');
await p.locator('.recht-liste input').nth(3).uncheck(); await p.click('#rechtform [type=submit]'); await bis(p, () => document.querySelector('.held h2')?.innerText === 'Ingwer-Limonade');
pruefe('übernommen ist, was angehakt war; der abgewählte Vorschlag bleibt, wie er war', (await p.locator('.held h2').innerText()) === 'Ingwer-Limonade' && (await p.locator('.zutaten').innerText()).includes('Ingwersirup') && (await p.locator('.schritte').innerText()).includes('aufgiessen') && (await p.locator('.schritte').innerText()).includes('verrühren'));
pruefe('Mengen und Einheiten bleiben unberührt', (await p.locator('.zutaten li').first().innerText()).replace(/\s+/g, ' ').startsWith('4 cl') && (await limo(p)).ings[2].amt === '2' && (await limo(p)).ings[2].unit === 'dl');
antwort = () => ({ name: 'Ingwer-Limonade', ingredients: [{ name: 'Ingwersirup' }, { name: 'Limettensaft' }, { name: 'Sprudelwasser' }], steps: ['Sirup und Saft verrühren.', 'Mit Sprudelwasser aufgiessen.'] });
await menue(p); await p.click('#gmenue [data-a=gm-recht]');
pruefe('ohne Fund: eine kurze Meldung, kein Fenster', await toastBis(p, /Keine Fehler/) && await p.locator('.fenster').count() === 0);

console.log('6 · Übersetzen (einzeln) und der Umschalter aufs Original');
rufe.length = 0; await menue(p); await p.click('#gmenue [data-a=gm-uebersetzen]'); await p.waitForSelector('#ueb-wahl');
{ const chips = await p.locator('#ueb-wahl .chip').allInnerTexts();
  pruefe('das Fenster zeigt die acht Sprachen, die der Oberfläche zuerst; kein Erklärtext, gesendet ist nichts', chips.length === 8 && chips[0].trim() === 'Deutsch' && new Set(chips.map((x) => x.trim())).size === 8 && await p.locator('.fenster p').count() === 0 && (await hinweis(p, '#ueb-wahl .chip')).includes('an Anthropic') && rufe.length === 0, chips.join(',')); }
antwort = () => ({ en: { name: 'Ginger lemonade', ingredients: ['Ginger syrup', 'Lime juice', 'Sparkling water'], steps: ['Stir syrup and juice.', 'Top up with sparkling water.'] } });
await p.click('#ueb-wahl [data-ziel=en]'); await toastBis(p, /Übersetzt: English/);
pruefe('Englisch: ein Aufruf mit Name, Zutaten und Schritten; das Ergebnis liegt in translations.en', rufe.length === 1 && rufe[0].leib.includes('Translate this recipe into English') && rufe[0].leib.includes('verrühren') && (await limo(p)).translations?.en?.name === 'Ginger lemonade' && (await limo(p)).translations.en.ingredients.length === 3 && (await limo(p)).name === 'Ingwer-Limonade');
await bis(p, () => document.querySelector('.held h2')?.innerText === 'Ginger lemonade');
pruefe('R28 (Klaus 25.11.): nach dem Übersetzen steht die neue Fassung da, Sprach-Chips Original · EN, EN gedrückt', (await p.locator('.held h2').innerText()) === 'Ginger lemonade' && await p.locator('.ueb-fass .umsch').count() === 2 && (await p.locator('.umsch[data-s=en]').getAttribute('aria-pressed')) === 'true' && (await p.locator('.umsch[data-s=orig]').getAttribute('aria-pressed')) === 'false');
antwort = () => ({ de: { name: 'Ingwerlimo', ingredients: ['Ingwersirup (hausgemacht)', 'Limettensaft', 'Sprudel'], steps: ['Sirup mit Saft verrühren.', 'Mit Sprudel auffüllen.'] } });
await menue(p); await p.click('#gmenue [data-a=gm-uebersetzen]'); await p.waitForSelector('#ueb-wahl');
pruefe('eine vorhandene Übersetzung trägt im Fenster einen Haken', await p.locator('#ueb-wahl .chip[data-da]').count() === 1 && (await p.locator('#ueb-wahl .chip[data-da]').innerText()).trim() === 'English');
await p.click('#ueb-wahl [data-ziel=de]'); await bis(p, () => document.querySelector('.held h2')?.innerText === 'Ingwerlimo');
pruefe('in der Sprache der Oberfläche zeigt die Ansicht die Übersetzung', (await p.locator('.held h2').innerText()) === 'Ingwerlimo' && (await p.locator('.zutaten').innerText()).includes('Sprudel') && (await limo(p)).name === 'Ingwer-Limonade');
pruefe('die Sprach-Chips stehen in der Zeile der Kategorie (Original · EN · DE), ohne eigene Zeile', await p.locator('.held .ueber p .ueb-fass .umsch').count() === 3 && (await p.locator('.umsch[data-s=de]').getAttribute('aria-pressed')) === 'true' && await Zs(p, () => { const u = document.querySelector('.ueb-fass').getBoundingClientRect(), z = document.querySelector('.held .ueber p').getBoundingClientRect(); return z.height < 40 && u.top >= z.top - 6 && u.bottom <= z.bottom + 6; }));
await p.click('.umsch[data-s=orig]'); await bis(p, () => document.querySelector('.held h2')?.innerText === 'Ingwer-Limonade');
pruefe('ein Tipp aufs Original zeigt es, ein Tipp auf EN die englische Fassung, auf DE wieder die deutsche', (await p.locator('.held h2').innerText()) === 'Ingwer-Limonade' && (await p.locator('.zutaten').innerText()).includes('Sprudelwasser') && (await p.locator('.umsch[data-s=orig]').getAttribute('aria-pressed')) === 'true' && await (async () => { await p.click('.umsch[data-s=en]'); if (!(await bis(p, () => document.querySelector('.held h2')?.innerText === 'Ginger lemonade'))) return false; await p.click('.umsch[data-s=de]'); return bis(p, () => document.querySelector('.held h2')?.innerText === 'Ingwerlimo'); })());
antwort = () => ({ fr: { name: 'Limonade au gingembre', ingredients: ['Sirop', 'Jus'], steps: ['Mélanger.', 'Compléter.'] } });
await menue(p); await p.click('#gmenue [data-a=gm-uebersetzen]'); await p.click('#ueb-wahl [data-ziel=fr]');
pruefe('eine Übersetzung mit falscher Zahl an Zutaten wird nicht übernommen; die Meldung sagt es', await toastBis(p, /passt nicht/) && !(await limo(p)).translations.fr, await toast(p));
await c.close();

console.log('7 · Alle übersetzen (Einstellungen): ein Fenster, Kostenhinweis, Fortschritt, Abbrechen');
const FR = { name: 'Limonade', ingredients: ['Sirop', 'Jus', 'Eau'], steps: ['Mélanger.', 'Compléter.'] }, drei = [['4', 'cl', 'Sirup'], ['2', 'cl', 'Saft'], ['2', 'dl', 'Wasser']], zwei = ['Rühren.', 'Auffüllen.'];
({ p, c } = await seite({ ohneAlkohol: true, getraenke: [Z3('Apfelschorle', 'limo', drei, zwei, { id: 1, translations: { fr: FR } }), Z3('Birnenlimo', 'limo', drei, zwei, { id: 2 }), Z3('Cassis-Spritz', 'mock', drei, zwei, { id: 3 }), Z3('Dunkler Rum-Punsch', 'ckt', [['4', 'cl', 'Rum']], zwei, { id: 4, alcohol: true })] }));
rufe.length = 0; await p.click('.fl-griff'); await p.click('.fl-knoepfe [data-go=mehr]');
pruefe('Einstellungen → KI: „Alle übersetzen“ steht bei den Schlüsseln', await p.locator('.thema[data-g=ki] .ezeile[data-a=alle-ueb]').count() === 1 && (await p.locator('.ezeile[data-a=alle-ueb] b').innerText()) === 'Alle übersetzen');
await p.click('.ezeile[data-a=alle-ueb]'); await p.waitForSelector('#alle-ziel');
{ const kosten = (await p.locator('#alle-kosten').innerText()).trim(), knopf = (await p.locator('[data-a=alle-ueb-los]').innerText()).replace(/\s+/g, ' ').trim();
  pruefe('EIN Fenster: acht Ziele (die Sprache der Oberfläche gewählt), Anzahl ohne diese Übersetzung im Knopf, was an wen geht darunter', await p.locator('#alle-ziel .chip').count() === 8 && (await p.locator('#alle-ziel .chip[aria-pressed=true]').innerText()).trim() === 'Deutsch' && knopf === '3 Getränke übersetzen Anthropic · Name, Zutaten und Schritte', knopf);
  pruefe('der Kostenhinweis ist kurz, eine Zeile; der ganze Satz des Kerns ist sein Hinweis; gesendet ist nichts', /^etwa [\d.]+ Token · (unter 0,01 \$|rund [\d,]+ \$)$/.test(kosten) && await Zs(p, () => document.querySelector('#alle-kosten').getBoundingClientRect().height < 24) && (await hinweis(p, '#alle-kosten')).includes('Abrechnung direkt bei Anthropic') && rufe.length === 0 && await p.locator('.fenster p').count() === 1, kosten); }
await p.click('#alle-ziel [data-ziel=fr]'); await bis(p, () => document.querySelector('#alle-ziel .chip[aria-pressed=true]')?.dataset.ziel === 'fr');
pruefe('schon Übersetzte zählen nicht mit; „Ohne Alkohol“ gilt auch hier', (await p.locator('[data-a=alle-ueb-los] span').innerText()).trim() === '2 Getränke übersetzen', await p.locator('[data-a=alle-ueb-los]').innerText());
antwort = (leib) => (leib.includes('Birnenlimo') ? { fr: { name: 'Limonade de poire', ingredients: ['Sirop'], steps: ['Mélanger.', 'Compléter.'] } } : { fr: { ...FR, name: 'Spritz au cassis' } });
await p.click('[data-a=alle-ueb-los]'); await toastBis(p, /übersetzt/);
pruefe('ein Fehlschlag hält den Rest nicht auf; am Ende eine kurze Meldung', (await toast(p)) === '+1 übersetzt · 1 Fehler' && rufe.length === 2 && await Zs(p, () => { const g = __mixarium.sammlung.getraenke; return g.find((r) => r.name === 'Cassis-Spritz').translations?.fr?.name === 'Spritz au cassis' && !g.find((r) => r.name === 'Birnenlimo').translations?.fr; }) && await p.locator('.fenster').count() === 0, await toast(p) + ' / ' + rufe.length);
pruefe('ein ausgeblendetes Getränk mit Alkohol ging nicht an die KI', !rufe.some((r) => r.leib.includes('Rum')));
rufe.length = 0; warte = 700; antwort = (leib) => ({ en: { name: 'X ' + (leib.match(/Name: (.+?)\\n/) || [0, ''])[1], ingredients: ['a', 'b', 'c'], steps: ['d', 'e'] } });
await p.click('.ezeile[data-a=alle-ueb]'); await p.waitForSelector('#alle-ziel'); await p.click('#alle-ziel [data-ziel=en]'); await bis(p, () => /^3 /.test(document.querySelector('[data-a=alle-ueb-los] span')?.innerText || ''));
await p.click('[data-a=alle-ueb-los]'); await p.waitForSelector('[data-a=alle-ueb-stopp]');
pruefe('der Ladebalken zeigt den Stand („1 von 3: Name“)', await bis(p, () => /^\d von 3: /.test(document.querySelector('#warten-zeile.an span')?.textContent || '')), await Zs(p, () => document.querySelector('#warten-zeile')?.innerText || ''));
pruefe('der Ladebalken verdeckt weder die Überschrift noch „Abbrechen“', await Zs(p, () => { const z = document.querySelector('#warten-zeile').getBoundingClientRect(); return z.height > 0 && [document.querySelector('.fkopf h2'), document.querySelector('[data-a=alle-ueb-stopp]'), document.querySelector('.fkopf [data-a=fenster-zu]')].every((e) => { const r = e.getBoundingClientRect(); return r.bottom <= z.top || r.top >= z.bottom || r.right <= z.left || r.left >= z.right; }); }));
await bis(p, () => /^2 von 3: /.test(document.querySelector('#warten-zeile.an span')?.textContent || '')); await p.click('[data-a=alle-ueb-stopp]');
pruefe('„Abbrechen“ hört sofort auf: Meldung, Fenster zu, der Rest ist nicht gesendet', await toastBis(p, /abgebrochen/) && (await toast(p)) === '+1 übersetzt · abgebrochen' && await p.locator('.fenster').count() === 0 && rufe.length === 2 && await Zs(p, () => __mixarium.sammlung.getraenke.filter((r) => r.translations?.en).length === 1), await toast(p) + ' / ' + rufe.length);
warte = 0; rufe.length = 0; await p.click('.ezeile[data-a=alle-ueb]'); await p.waitForSelector('#alle-ziel');
pruefe('das Ziel bleibt gewählt; der nächste Lauf nimmt nur, was fehlt', (await p.locator('#alle-ziel .chip[aria-pressed=true]').innerText()).trim() === 'English' && (await p.locator('[data-a=alle-ueb-los] span').innerText()).trim() === '2 Getränke übersetzen');
await p.click('[data-a=alle-ueb-los]'); await toastBis(p, /\+2 übersetzt/);
pruefe('danach ist alles übersetzt: zwei Aufrufe, die Meldung nennt die Zahl', (await toast(p)) === '+2 übersetzt' && rufe.length === 2 && await Zs(p, () => __mixarium.sammlung.getraenke.filter((r) => r.translations?.en).length === 3));
await p.click('.ezeile[data-a=alle-ueb]'); await p.waitForSelector('#alle-ziel');
pruefe('ist nichts mehr offen, steht „Schon alles übersetzt“ und kein Startknopf', (await p.locator('#alle-fertig').innerText()).trim() === 'Schon alles übersetzt' && await p.locator('[data-a=alle-ueb-los]').count() === 0);
await c.close();

console.log('8 · Ohne Schlüssel fragt die App danach');
({ p, c } = await seite({ schluessel: '' })); await zumGetraenk(p); rufe.length = 0; antwort = () => ({ kcal: 50, fat: 0, carbs: 12, protein: 0, fiber: 0, sugar: 11, sodium: 5 });
await menue(p); await p.click('#gmenue [data-a=gm-naehr]'); await p.waitForSelector('#akform').catch(() => {});
pruefe('ohne Anthropic-Schlüssel kommt das Schlüssel-Fenster, nichts geht hinaus', await p.locator('#akform').count() === 1 && rufe.length === 0);
await p.click('.fkopf .frag summary').catch(() => {});
pruefe('Schlüssel-Fenster: die Erklärung hinter „?“ liegt ganz im Bildschirm; Speichern, Schlüssel holen, Prüfen in EINER Reihe', await Zs(p, () => { const e = document.querySelector('.fkopf .frag p'), k = [...document.querySelectorAll('.schlform .reihe > *')]; if (!e || k.length < 3) return false; const r = e.getBoundingClientRect(); return r.left >= 0 && r.right <= innerWidth && r.width > 150 && new Set(k.map((x) => Math.round(x.getBoundingClientRect().top + x.getBoundingClientRect().height / 2))).size === 1 && k.map((x) => x.id || x.dataset.a || x.type).join(' ') === 'submit schl-holen schluessel-pruefen'; }), await Zs(p, () => [...document.querySelectorAll('.schlform .reihe > *')].map((x) => x.id || x.dataset.a || x.type).join(' ')));
await p.click('.fkopf .frag summary').catch(() => {});
await p.fill('#akform [name=k]', 'sk-ant-probe-111111111111111111').catch(() => {}); await p.click('#akform [type=submit]').catch(() => {});
pruefe('nach dem Speichern steht das Menü wieder da; die Meldung heißt wie im Rezeptbuch „Schlüssel gespeichert“', await p.waitForSelector('#gmenue').then(() => true, () => false) && (await toast(p)) === 'Schlüssel gespeichert', await toast(p));
await p.keyboard.press('Escape'); await p.click('.fl-griff'); await p.click('.fl-knoepfe [data-go=mehr]'); await p.click('.ezeile[data-a=schluessel][data-anbieter=anthropic]'); await p.waitForSelector('#akform'); await p.click('[data-a=schluessel-weg]'); await p.waitForSelector('.fenster', { state: 'detached' });
await p.click('.ezeile[data-a=alle-ueb]'); await p.waitForSelector('#alle-ziel'); await p.click('[data-a=alle-ueb-los]');
pruefe('„Alle übersetzen“ ohne Schlüssel: erst das Schlüssel-Fenster, danach wieder das Fenster zum Übersetzen', await p.waitForSelector('#akform').then(() => true, () => false) && rufe.length === 0 && await (async () => { await p.fill('#akform [name=k]', 'sk-ant-probe-222222222222222222'); await p.click('#akform [type=submit]'); return p.waitForSelector('#alle-ziel').then(() => true, () => false); })());
await c.close();

console.log('9 · Monitor 1280 px');
({ p, c } = await seite({ breite: 1280, getraenke: [{ ...LIMO, translations: { de: { name: 'Ingwerlimo', ingredients: ['Sirup', 'Saft', 'Sprudel'], steps: ['Rühren.', 'Auffüllen.'] } }, nutrition: { kcal: 96, carbs: 24, fat: 0, protein: 0, quelle: 'ki' } }] }));
await p.locator('.karte').first().click(); await p.waitForSelector('.seite .tzeile'); await p.click('.seite [data-a=bildwerk]'); await p.waitForSelector('.seite .rwerk');
pruefe('am Monitor trägt „Mehr“ sein Wort; Sprach-Chips (Original · DE) und Nährwert-Zeile stehen da', (await p.locator('.seite .rwerk [data-a=gmenue]').innerText()).trim().startsWith('Mehr') && await p.locator('.seite .unter .ueb-fass .umsch').count() === 2 && await p.locator('.detail-rumpf [data-naehr]').count() === 1 && (await p.locator('.seite .tzeile h2').innerText()) === 'Ingwerlimo');
await p.click('.seite .rwerk [data-a=gmenue]'); pruefe('am Monitor öffnet „Mehr“ dasselbe Menü', await p.waitForSelector('#gmenue').then(() => true, () => false) && await p.locator('#gmenue .ezeile').count() === 5);
await c.close();

console.log('10 · R14 eine gezeigte Übersetzung bearbeiten, R30 das Original ändern, R15 im Gerät übersetzen');
{ const UEB = { ...LIMO, sprache: 'en', name: 'Ginger lemonade', ings: [{ id: 0, amt: '4', unit: 'cl', name: 'Ginger syrup', note: '', ck: false }, { id: 1, amt: '2', unit: 'cl', name: 'Lime juice', note: '', ck: false }, { id: 2, amt: '2', unit: 'dl', name: 'Sparkling water', note: '', ck: false }], steps: [{ id: 0, txt: 'Stir syrup and juice.' }, { id: 1, txt: 'Top up.' }],
    translations: { de: { name: 'Ingwerlimo', ingredients: ['4 cl Ingwersirup', '2 cl Limettensaft', '2 dl Sprudel'], steps: ['Sirup und Saft verrühren.', 'Auffüllen.'] } } };
  ({ p, c } = await seite({ getraenke: [UEB] }));
  await p.locator('.karte').first().click(); await p.waitForSelector('.held h2');
  await p.click('[data-a=bildwerk]'); await p.click('.rwerk [data-a=bearbeiten]'); await p.waitForSelector('#ed');
  pruefe('R14: „Bearbeiten“ zeigt, was dasteht (die deutsche Fassung), nicht das englische Original', await p.inputValue('#ed [name=name]') === 'Ingwerlimo' && /Sprudel/.test(await p.inputValue('#ed [name=ings]')), await p.inputValue('#ed [name=name]'));
  await p.fill('#ed [name=name]', 'Ingwer-Limo'); await p.click('#ed [type=submit]'); await p.waitForSelector('#fassung-wahl').catch(() => {});
  pruefe('R14: geänderter Text einer Übersetzung → einmal fragen (Hauptfassung oder nur Übersetzung)', await p.locator('#fassung-wahl [data-a=fassung-haupt]').count() === 1 && await p.locator('#fassung-wahl [data-a=fassung-ueb]').count() === 1);
  await p.click('[data-a=fassung-ueb]'); await toastBis(p, /Gespeichert/);
  let g = await Zs(p, () => __mixarium.sammlung.getraenke[0]);
  pruefe('„Nein, nur die Übersetzung“: die deutsche Fassung trägt den neuen Namen, das englische Original bleibt', g.translations.de.name === 'Ingwer-Limo' && g.name === 'Ginger lemonade' && (await p.locator('.held h2').innerText()) === 'Ingwer-Limo', JSON.stringify([g.name, g.translations.de.name]));
  await p.waitForSelector('.fenster', { state: 'detached' }); if (!(await p.locator('.rwerk').count())) await p.click('[data-a=bildwerk]'); await p.click('.rwerk [data-a=bearbeiten]'); await p.waitForSelector('#ed');
  await p.fill('#ed [name=name]', 'Ingwerlimonade'); await p.click('#ed [type=submit]'); await p.waitForSelector('#fassung-wahl'); await p.click('[data-a=fassung-haupt]'); await toastBis(p, /Gespeichert/);
  g = await Zs(p, () => __mixarium.sammlung.getraenke[0]);
  pruefe('„Ja, als Hauptfassung“: der deutsche Text wird das Getränk, das englische Original liegt als Übersetzung (Sprache aus r.sprache)', g.name === 'Ingwerlimonade' && g.sprache === 'de' && g.translations.en && g.translations.en.name === 'Ginger lemonade' && !g.translations.de, JSON.stringify([g.name, g.sprache, Object.keys(g.translations || {})]));
  /* R30: das Original ändern, wenn eine Übersetzung daran hängt */
  await p.waitForSelector('.fenster', { state: 'detached' }); if (!(await p.locator('.rwerk').count())) await p.click('[data-a=bildwerk]'); await p.click('.rwerk [data-a=bearbeiten]'); await p.waitForSelector('#ed');
  pruefe('ohne gezeigte Übersetzung wird das Original bearbeitet', await p.inputValue('#ed [name=name]') === 'Ingwerlimonade');
  await p.fill('#ed [name=steps]', 'Sirup und Saft verrühren.\nMit Sprudel auffüllen.\nEis dazu.'); await p.click('#ed [type=submit]');
  const t30 = await toastBis(p, /neu zu übersetzen/) ? await toast(p) : await toast(p);
  g = await Zs(p, () => __mixarium.sammlung.getraenke[0]);
  pruefe('R30: geänderter Text → die alte Fassung fällt weg, eine Meldung „ist neu zu übersetzen · Übersetzen“ (Claude erst auf Tipp)', !g.translations && /neu zu übersetzen/.test(t30) && /Übersetzen/.test(t30), t30);
  await p.click('.mxtoast [data-a=toast-tun]').catch(() => {}); await p.waitForSelector('#ueb-wahl', { timeout: 5000 }).catch(() => {});
  pruefe('R30: „Übersetzen“ in der Meldung öffnet die Übersetzung dieses Getränks (mit Weg und Kosten)', await p.locator('#ueb-wahl').count() === 1); await p.keyboard.press('Escape'); await p.waitForTimeout(300);
  const vorRufe = rufe.length; await p.waitForSelector('.fenster', { state: 'detached' }); if (!(await p.locator('.rwerk').count())) await p.click('[data-a=bildwerk]'); await p.click('.rwerk [data-a=bearbeiten]'); await p.waitForSelector('#ed');
  await p.selectOption('#ed [name=glass]', { index: 1 }); await p.click('#ed [type=submit]'); await toastBis(p, /Gespeichert/); await p.waitForTimeout(400);
  pruefe('nur das Glas geändert: keine Frage, kein Aufruf', await p.locator('#fassung-wahl').count() === 0 && rufe.length === vorRufe);
  await c.close(); }
{ /* R15: Chromes Übersetzer im Gerät, gestellt */
  ({ p, c } = await seite({ getraenke: [{ ...LIMO, sprache: 'de' }] }));
  await c.addInitScript(() => { self.Translator = { availability: async () => 'available', create: async ({ targetLanguage }) => ({ translate: async (x) => '[' + targetLanguage + '] ' + x, destroy() {} }) }; });
  await p.reload(); await p.waitForSelector('.mx .titel');
  await p.locator('.karte').first().click(); await p.waitForSelector('.held h2');
  const vor = rufe.length; await menue(p); await p.click('#gmenue [data-a=gm-uebersetzen]'); await p.waitForSelector('#ueb-wahl');
  pruefe('R15: mit Übersetzer im Gerät zwei Wege, „Im Gerät · kostenlos“ ist gewählt', await p.locator('#ueb-weg [data-w]').count() === 2 && (await p.locator('#ueb-weg [data-w=geraet]').getAttribute('aria-checked')) === 'true' && (await p.locator('#ueb-wahl').getAttribute('data-weg')) === 'geraet');
  await p.click('#ueb-wahl [data-ziel=fr]'); await toastBis(p, /Im Gerät übersetzt/);
  const g = await Zs(p, () => __mixarium.sammlung.getraenke[0]);
  pruefe('R15: im Gerät übersetzt, nichts geht an Anthropic, die französische Fassung steht da', rufe.length === vor && g.translations && g.translations.fr && /^\[fr\]/.test(g.translations.fr.name) && /^\[fr\]/.test(await p.locator('.held h2').innerText()), JSON.stringify(g.translations && g.translations.fr && g.translations.fr.name));
  await menue(p); await p.click('#gmenue [data-a=gm-uebersetzen]'); await p.waitForSelector('#ueb-weg'); await p.click('#ueb-weg [data-w=claude]'); await p.waitForSelector('#ueb-wahl[data-weg=claude]').catch(() => {});
  pruefe('R15: „Claude“ wählbar, dann geht es an Anthropic', (await p.locator('#ueb-wahl').getAttribute('data-weg')) === 'claude');
  await p.keyboard.press('Escape'); await c.close(); }

pruefe('keine Fehler in der Konsole, kein Netz nach draußen', fehler.length === 0, fehler.join(' · '));
await b.close(); server.close();
console.log(`\n${gruen} grün · ${rot} ROT`);
process.exitCode = rot ? 1 : 0;
