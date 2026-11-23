// Probe der neuen PWA: Ordner (eigene Sammlungen neben den Kategorien; Kern: modell/ordner.mjs). Echter Browser, kein Netz nach draußen.
//   node tests/smoke_neu_ordner.mjs   Schlusszeile: „N grün · M ROT“, Rückgabewert 1 bei ROT. WURZEL=<Pfad> misst eine Kopie (Gegenprobe).
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
const U = `http://localhost:${server.address().port}/Mein-Mixarium/`;
let gruen = 0, rot = 0;
const pruefe = (name, ok, mehr = '') => { if (ok) { gruen++; console.log('  ✓ ' + name); } else { rot++; console.log('  ✗ ROT ' + name + (mehr ? ' — ' + mehr : '')); } };
const b = await chromium.launch();
// Ein Absturz ist ROT, nicht ein toter Lauf: die Schlusszeile steht trotzdem da.
const abbruch = async (e) => { rot++; console.log('  ✗ ROT Probe abgebrochen — ' + String(e && e.message || e).split('\n')[0]); try { await b.close(); } catch (f) { /* schon zu */ } server.close(); console.log(`\n${gruen} grün · ${rot} ROT`); process.exitCode = 1; };
process.on('unhandledRejection', abbruch); process.on('uncaughtException', abbruch);
const fehler = [];
async function seite(breite = 390, vorher = null) {
  const c = await b.newContext({ viewport: { width: breite, height: 800 }, locale: 'de-DE', serviceWorkers: 'block' }), p = mitThemen(await c.newPage()); p.setDefaultTimeout(10000);
  p.on('pageerror', (e) => fehler.push(e.message)); p.on('console', (m) => { if (m.type() === 'error') fehler.push(m.text()); });
  await p.route(/^https?:\/\/(?!localhost)/, (r) => { fehler.push('Netz nach draußen: ' + r.request().url()); r.abort(); });
  if (vorher) { await p.goto(U + 'impressum.html'); await p.evaluate(vorher); }
  await p.goto(U + 'neu/?leer'); await p.waitForSelector('.mx .titel'); return { p, c };
}
const Zs = (p, f, arg) => p.evaluate(f, arg);
const bis = (p, f, arg) => p.waitForFunction(f, arg, { timeout: 8000 }).then(() => true, () => false);   /* wartet auf die Bedingung, nicht auf die Uhr */
const zuEinst = async (p) => { await p.click('.fl-griff'); await p.click('.fl-knoepfe [data-go=mehr]'); };
const zumStart = async (p) => { await p.click('.fl-griff'); await p.click('.fl-knoepfe [data-go=start]'); await p.waitForSelector('.leiste'); };
const leiste = (p) => p.locator('.leiste .chip').evaluateAll((l) => l.map((c) => c.innerText.trim().replace(/\s+/g, ' ')));
const zahlAm = (t) => +((t || '').match(/(\d+)$/) || [0, -1])[1];
const werkzeuge = async (p) => { if (!(await p.locator('.rwerk').count())) await p.click('[data-a=bildwerk]'); await p.waitForSelector('.rwerk'); };
const ordnerWahl = async (p) => { await werkzeuge(p); await p.click('.rwerk [data-a=ordner-zuordnen]'); await p.waitForSelector('#ordneuform'); };
const oeffne = async (p, name) => { await p.locator('.karte', { hasText: name }).first().click(); await bis(p, (n) => document.querySelector('.held h2')?.innerText.trim() === n, name); };
const zurListe = async (p) => { await p.click('.wk-pf.zur'); await p.waitForSelector('.leiste'); };
const toast = (p) => p.locator('.mxtoast').innerText().then((t) => t.trim().replace(/\s+/g, ' '), () => '');
const getraenk = (p, name) => Zs(p, (n) => { const r = __mixarium.sammlung.getraenke.find((x) => x.name === n); return r ? { cat: r.cat, folder: r.folder, uid: r.uid } : null; }, name);
const imSpeicher = (p) => Zs(p, () => new Promise((ja) => { const a = indexedDB.open('KuechenKern-mixarium'); a.onsuccess = () => { const q = a.result.transaction('zustand').objectStore('zustand').get('alles'); q.onsuccess = () => { a.result.close(); ja(q.result || null); }; }; }));
const BILD = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';

console.log('1 · Ordner anlegen und benennen');
let { p, c } = await seite();
await p.click('[data-a=beispiele]'); await p.click('[data-paket=getraenke-ohne-alkohol-start]'); await p.waitForSelector('.karte');
pruefe('ohne Ordner steht in der Leiste kein Ordner', await p.locator('.leiste .ord').count() === 0);
await zuEinst(p);
pruefe('Einstellungen → Ordnung nennt die Ordner mit ihrer Zahl', (await p.locator('.ezeile[data-a=ordner] b').innerText()) === 'Ordner' && (await p.locator('.ezeile[data-a=ordner] small').innerText()).trim() === '0');
await p.click('.ezeile[data-a=ordner]'); await p.waitForSelector('#ord-leer');
pruefe('leere Ordner-Ansicht sagt „Noch kein Ordner.“; die Erklärung steht hinter „?“ in der Kopfzeile, ohne eigene Zeile', (await p.locator('#ord-leer').innerText()).trim() === 'Noch kein Ordner.' && await p.locator('.fkopf .frag').count() === 1 && await p.locator('.fenster .ftext').count() === 0);
await p.click('.fkopf .frag summary');
pruefe('die Erklärung hinter „?“ liegt ganz im Bildschirm', await Zs(p, () => { const r = document.querySelector('.fkopf .frag p').getBoundingClientRect(); return r.left >= 0 && r.right <= innerWidth && r.width > 150; }));
await p.click('.fkopf .frag summary');
await p.click('[data-a=ordner-neu]');
pruefe('ein neuer Ordner: der Zeiger steht gleich im Namensfeld', await Zs(p, () => document.activeElement?.classList.contains('ord-name')));
await p.keyboard.type('Für Gäste'); await p.keyboard.press('Tab');
await p.click('[data-a=ordner-neu]'); await p.keyboard.type('Sommer <b>'); await p.keyboard.press('Tab');
pruefe('Umbenennen wirkt: die getippten Namen stehen in der Sammlung', (await Zs(p, () => __mixarium.sammlung.ordner.map((o) => o.name).join('|'))) === 'Für Gäste|Sommer <b>', await Zs(p, () => __mixarium.sammlung.ordner.map((o) => o.name).join('|')));
pruefe('zwei Ordner, noch leer', await p.locator('.ord-zeile').count() === 2 && await p.inputValue('.ord-zeile:nth-child(1) .ord-name') === 'Für Gäste' && await p.locator('.ord-auf:disabled').count() === 2);
pruefe('das Ordner-Fenster läuft am Handy nicht quer', await Zs(p, () => { const f = document.querySelector('.fenster'); return f.scrollWidth <= f.clientWidth && document.documentElement.scrollWidth <= innerWidth; }));
await p.click('.fkopf [data-a=fenster-zu]');

console.log('2 · Getränk in einen Ordner legen: die Kategorie bleibt');
await zumStart(p);
const vorMock = (await leiste(p)).find((t) => t.startsWith('Mocktails'));
await p.click('.leiste .chip[data-kat=mock]'); await bis(p, () => document.querySelector('.leiste .chip[data-kat=mock]')?.getAttribute('aria-pressed') === 'true');
await oeffne(p, 'Virgin Mojito'); await werkzeuge(p);
pruefe('Werkzeuge am Getränk: „Ordner“ steht dabei, als kleines Symbol mit Namen', await p.locator('.rwerk [data-a=ordner-zuordnen]').count() === 1 && (await p.locator('.rwerk [data-a=ordner-zuordnen]').getAttribute('aria-label')) === 'Ordner');
await ordnerWahl(p);
pruefe('das Fenster zeigt die Ordner (Name als Text, nicht als HTML)', await p.locator('#ord-wahl .ezeile').count() === 2 && (await p.locator('#ord-wahl').innerText()).includes('Sommer <b>') && await p.locator('#ord-wahl b b').count() === 0);
await p.locator('#ord-wahl .ezeile', { hasText: 'Für Gäste' }).click(); await p.waitForSelector('.held .im-ordner');
pruefe('das Getränk liegt im Ordner; er steht am Getränk', (await toast(p)).includes('Für Gäste') && (await p.locator('.held .im-ordner').innerText()).includes('Für Gäste'), await toast(p));
pruefe('die Meldung steht in einer Zeile und ist nicht abgeschnitten', await Zs(p, () => { const t = document.querySelector('.mxtoast'); return !!t && t.getBoundingClientRect().height < 40 && t.scrollWidth <= t.clientWidth; }));
pruefe('die Kategorie steht weiter am Getränk', (await p.locator('.held .ueber p').innerText()).includes('Mocktails') && (await getraenk(p, 'Virgin Mojito')).cat === 'mock');
pruefe('die Werkzeuge bleiben nach der Wahl offen', await p.locator('.rwerk').count() === 1);
await zurListe(p);
let l = await leiste(p);
pruefe('die Kategorie zählt wie vorher (ein Ordner frisst die Kategorie nicht)', l.find((t) => t.startsWith('Mocktails')) === vorMock, vorMock + ' / ' + l.join(' | '));
pruefe('in der Leiste steht der Ordner mit Inhalt; ein leerer Ordner steht dort nicht', l.includes('Für Gäste 1') && !l.some((t) => t.startsWith('Sommer')), l.slice(-3).join(' | '));
{ const kat = await p.locator('.leiste .chip:not(.ord)').evaluateAll((x) => x.map((e) => e.innerText.trim().replace(/\s+/g, ' '))), summe = kat.slice(1).reduce((n, t) => n + zahlAm(t), 0);
  pruefe('Summe der Kategorien = Alle (Ordner zählen nicht doppelt)', summe === zahlAm(kat[0]) && summe > 0, kat.join(' | ')); }
pruefe('die Leiste mit Ordner läuft nicht quer über die Seite', await Zs(p, () => document.documentElement.scrollWidth <= innerWidth));

console.log('3 · Neuen Ordner aus dem Getränk heraus anlegen; Ordner ansehen');
await p.locator('.karte:not(:has-text("Virgin Mojito"))').first().click(); await p.waitForSelector('.held h2'); await bis(p, () => document.querySelector('.held h2').innerText.trim() !== 'Virgin Mojito');
const zweites = (await p.locator('.held h2').innerText()).trim();
pruefe('Selbst-Riegel: es ist ein anderes Getränk; es beginnt mit eingeklappten Werkzeugen', zweites !== 'Virgin Mojito' && await p.locator('.rwerk').count() === 0, zweites);
await ordnerWahl(p); await p.fill('#ordneuform input', 'Sommerfest'); await p.keyboard.press('Enter'); await p.waitForSelector('.held .im-ordner');
pruefe('neuer Ordner angelegt und das Getränk gleich hineingelegt', (await p.locator('.held .im-ordner').innerText()).includes('Sommerfest') && (await getraenk(p, zweites)).cat === 'mock');
await ordnerWahl(p);
pruefe('im Fenster ist der jetzige Ordner markiert; „aus dem Ordner nehmen“ steht da', await p.locator('#ord-wahl .ezeile[aria-pressed=true]').count() === 1 && (await p.locator('#ord-wahl .ezeile[aria-pressed=true]').innerText()).includes('Sommerfest') && await p.locator('#ord-wahl [data-oid=""]').count() === 1);
await p.keyboard.press('Escape'); await p.waitForSelector('.fenster', { state: 'detached' }); await zurListe(p);
await p.locator('.leiste .ord', { hasText: 'Sommerfest' }).click(); await bis(p, () => document.querySelectorAll('.karte').length === 1);
pruefe('Tipp auf den Ordner zeigt sein Getränk; der Ordner ist in der Leiste gewählt, keine zweite Überschrift', await p.locator('.karte').count() === 1 && (await p.locator('.karte strong').innerText()).trim() === zweites && await p.locator('.haupt h3').count() === 0 && await p.locator('.leiste .ord[aria-pressed=true]', { hasText: 'Sommerfest' }).count() === 1);
pruefe('der Kopf zählt, was zu sehen ist', (await p.locator('.kopf .name small').innerText()).trim() === '1 Getränk', await p.locator('.kopf .name small').innerText());

console.log('4 · Neues Getränk aus dem Ordner heraus; Formular mit Ordner-Wahl');
await p.click('.kopf [data-a=neu]'); await p.click('[data-a=neu-form]'); await p.waitForSelector('#ed');
pruefe('das Formular hat ein Feld „Ordner“, der offene Ordner ist vorgewählt; die Kategorie ist kein Ordner', await p.locator('#ed [name=folder]').count() === 1 && (await p.locator('#ed [name=folder] option:checked').innerText()) === 'Sommerfest' && (await p.locator('#ed [name=cat] option[selected]').evaluateAll((o) => o.map((x) => x.value).join())) === 'mock', await p.locator('#ed [name=cat] option[selected]').evaluateAll((o) => o.map((x) => x.value).join()));
await p.fill('#ed [name=name]', 'Zimtpunsch'); await p.fill('#ed [name=ings]', '2 dl Apfelsaft'); await p.fill('#ed [name=steps]', 'Erwärmen.'); await p.selectOption('#ed [name=cat]', 'bowle'); await p.click('#ed [type=submit]'); await p.waitForSelector('.held .im-ordner');
pruefe('gespeichert: im Ordner UND in der Kategorie', (await p.locator('.held .im-ordner').innerText()).includes('Sommerfest') && (await getraenk(p, 'Zimtpunsch')).cat === 'bowle' && /Bowle/.test(await p.locator('.held .ueber p').innerText()));
await werkzeuge(p); await p.click('.rwerk [data-a=bearbeiten]'); await p.waitForSelector('#ed'); await p.selectOption('#ed [name=folder]', { label: 'Für Gäste' }); await p.click('#ed [type=submit]'); await bis(p, () => document.querySelector('.held .im-ordner')?.innerText.includes('Für Gäste'));
pruefe('beim Bearbeiten lässt sich der Ordner wechseln', (await p.locator('.held .im-ordner').innerText()).includes('Für Gäste'));
await ordnerWahl(p); await p.click('#ord-wahl [data-oid=""]'); await p.waitForSelector('.held .im-ordner', { state: 'detached' });
pruefe('„aus dem Ordner nehmen“ nimmt es heraus', await p.locator('.held .im-ordner').count() === 0 && (await toast(p)).includes('Aus dem Ordner genommen') && (await getraenk(p, 'Zimtpunsch')).folder === '');

console.log('5 · Umbenennen, ordnen, Neuladen, Sicherung');
await Zs(p, (bild) => { __mixarium.sammlung.getraenke.find((r) => r.name === 'Virgin Mojito').img = bild; }, BILD);
await zuEinst(p);
pruefe('die Einstellungen zählen die Ordner', (await p.locator('.ezeile[data-a=ordner] small').innerText()).trim() === String(await Zs(p, () => __mixarium.sammlung.ordner.length)) && await Zs(p, () => __mixarium.sammlung.ordner.length) === 3);
await p.click('.ezeile[data-a=ordner]'); await p.waitForSelector('.ord-zeile');
{ const soll = await Zs(p, () => __mixarium.sammlung.ordner.map((o) => __mixarium.sammlung.getraenke.filter((r) => String(r.folder) === String(o.id)).length).join(',')), ist = (await p.locator('.ord-auf').allInnerTexts()).join(',');
  pruefe('Ordner-Ansicht: Anzahl je Ordner, Bild aus dem Ordner', ist === soll && /[1-9]/.test(ist) && await p.locator('.ord-zeile .sticker').count() === 1 && await p.locator('.ord-zeile:nth-child(1) .sticker').count() === 1, ist + ' / ' + soll); }
await p.fill('.ord-zeile:nth-child(1) .ord-name', 'Für liebe Gäste'); await p.keyboard.press('Tab');
pruefe('ein Ordner mit Inhalt lässt sich umbenennen; seine Kennung bleibt, das Getränk liegt weiter darin', await bis(p, () => __mixarium.sammlung.ordner[0].name === 'Für liebe Gäste') && (await getraenk(p, 'Virgin Mojito')).folder === await Zs(p, () => String(__mixarium.sammlung.ordner[0].id)));
{ const g = await p.locator('.ord-zeile:nth-child(3) .griff').boundingBox(), z = await p.locator('.ord-zeile:nth-child(1)').boundingBox();
  await p.mouse.move(g.x + g.width / 2, g.y + g.height / 2); await p.mouse.down(); await p.mouse.move(g.x + g.width / 2, g.y - 20, { steps: 4 }); await p.mouse.move(g.x + g.width / 2, z.y + 4, { steps: 8 }); await p.mouse.up(); }
await bis(p, () => document.querySelector('.ord-name')?.value === 'Sommerfest');
{ const folge = await p.locator('.ord-name').evaluateAll((x) => x.map((e) => e.value)); pruefe('ziehen am Griff ordnet die Ordner um', folge.join('|') === 'Sommerfest|Für liebe Gäste|Sommer <b>', folge.join('|')); }
{ let s = await imSpeicher(p); for (let i = 0; i < 40 && !(s && (s.ordner || [])[0] && s.ordner[0].name === 'Sommerfest'); i++) { await p.waitForTimeout(100); s = await imSpeicher(p); }   /* gespeichert wird mit kurzer Verzögerung */
  pruefe('Name und Reihenfolge stehen im Speicher des Geräts', !!s && s.ordner.map((o) => o.name).join('|') === 'Sommerfest|Für liebe Gäste|Sommer <b>'); }
await p.reload(); await p.waitForSelector('.karte'); l = await leiste(p);
pruefe('nach dem Neuladen: neuer Name, neue Reihenfolge in der Leiste', l.indexOf('Sommerfest 1') > 0 && l.indexOf('Sommerfest 1') < l.indexOf('Für liebe Gäste 1'), l.slice(-3).join(' | '));
pruefe('mit Bild trägt der Ordner in der Leiste das Bild und eine kleine Ordner-Marke', await p.locator('.leiste .ord:has-text("Für liebe Gäste") .stk-bild img').count() === 1 && await p.locator('.leiste .ord:has-text("Für liebe Gäste") .ord-marke').count() === 1);
{ const sich = JSON.parse(await Zs(p, () => __mixarium.sicherung()));
  pruefe('die Sicherung trägt die Ordner und die Zuordnung; die Kategorie steht daneben', sich.folders.length === 3 && sich.folders.some((o) => o.name === 'Für liebe Gäste') && sich.recipes.filter((r) => r.folder).length === 2 && sich.recipes.find((r) => r.name === 'Virgin Mojito').cat === 'mock'); }

console.log('6 · Ordner löschen: die Getränke bleiben');
await zuEinst(p); await p.click('.ezeile[data-a=ordner]'); await p.waitForSelector('.ord-zeile');
const vor = await Zs(p, () => __mixarium.sammlung.getraenke.length);
await p.locator('.ord-zeile', { has: p.locator('.ord-name[value="Sommerfest"]') }).locator('[data-a=ordner-weg]').click(); await bis(p, () => document.querySelectorAll('.ord-zeile').length === 2);
pruefe('gelöscht: der Ordner ist weg, die Meldung sagt, dass das Getränk bleibt', await p.locator('.ord-zeile').count() === 2 && (await toast(p)).includes('1 Getränk bleibt'), await toast(p));
pruefe('die Meldung mit „Rückgängig“ steht in einer Zeile, der Knopf ganz darin', await Zs(p, () => { const t = document.querySelector('.mxtoast'), k = t && t.querySelector('[data-a=toast-tun]'); if (!k) return false; const a = t.getBoundingClientRect(), r = k.getBoundingClientRect(); return a.height < 40 && r.right <= a.right && r.left >= a.left && a.right <= innerWidth && k.innerText.trim() === 'Rückgängig'; }));
pruefe('die Meldung verdeckt keinen Knopf und keine Zeile des Fensters', await Zs(p, () => { const t = document.querySelector('.mxtoast').getBoundingClientRect(); return [...document.querySelectorAll('.fenster button, .fenster input')].every((e) => { const r = e.getBoundingClientRect(); return r.bottom <= t.top || r.top >= t.bottom || r.right <= t.left || r.left >= t.right; }); }));
{ const r = await getraenk(p, zweites); pruefe('das Getränk ist noch da, mit seiner Kategorie, ohne Ordner', await Zs(p, () => __mixarium.sammlung.getraenke.length) === vor && !!r && r.folder === '' && r.cat === 'mock', JSON.stringify(r)); }
await p.click('.mxtoast [data-a=toast-tun]'); await bis(p, () => document.querySelectorAll('.ord-zeile').length === 3);
{ const r = await getraenk(p, zweites), namen = await Zs(p, () => __mixarium.sammlung.ordner.map((o) => o.name).join('|'));
  pruefe('Rückgängig holt Ordner und Zuordnung zurück, an dieselbe Stelle', namen === 'Sommerfest|Für liebe Gäste|Sommer <b>' && !!(r && r.folder) && await p.locator('.mxtoast').count() === 0, namen + ' ' + JSON.stringify(r)); }
await p.locator('.ord-zeile', { has: p.locator('.ord-name[value="Sommerfest"]') }).locator('.ord-auf').click();
pruefe('die Zahl am Ordner öffnet ihn auf der Startseite', await bis(p, () => document.querySelectorAll('.karte').length === 1 && document.querySelectorAll('.leiste .ord[aria-pressed=true]').length === 1 && !document.querySelector('.fenster')));
await c.close();

console.log('7 · Übernahme aus der bisherigen App; ein Ordner, den es nicht gibt; „Ohne Alkohol“');
({ p, c } = await seite(390, () => {
  const z = [{ amt: '2', unit: 'cl', name: 'Sirup' }], s = [{ txt: 'Rühren.' }];
  localStorage.setItem('mix9m', JSON.stringify([{ id: 1, name: 'Im Ordner', cat: 'mock', folder: 77, ings: z, steps: s }, { id: 2, name: 'Alter Weg', cat: 'fld_77', ings: z, steps: s }, { id: 3, name: 'Verwaist', cat: 'limo', folder: 99, ings: z, steps: s }, { id: 4, name: 'Frei', cat: 'limo', ings: z, steps: s }, { id: 5, name: 'Mit Rum', cat: 'ckt', alcohol: true, folder: 77, ings: [{ amt: '4', unit: 'cl', name: 'Rum' }], steps: s }]));
  localStorage.setItem('mxfd9m', JSON.stringify([{ id: 77, name: 'Omas Bar', ico: '👵' }]));
}));
await p.waitForSelector('.karte'); l = await leiste(p);
pruefe('der Ordner der bisherigen App ist da, mit seinen Getränken (auch dem über den alten Weg cat: fld_…)', l.some((t) => t.endsWith('Omas Bar 3') && t.includes('👵')) && l[0] === 'Alle 5', l.join(' | '));
pruefe('das Getränk vom alten Weg hat keine Kategorie und steht unter „Ohne Kategorie“ (nichts wird geraten)', l.some((t) => /^Ohne Kategorie 1$/.test(t)), l.join(' | '));
pruefe('die Daten der bisherigen App sind unverändert', await Zs(p, () => JSON.parse(localStorage.getItem('mxfd9m'))[0].name === 'Omas Bar' && JSON.parse(localStorage.getItem('mix9m'))[1].cat === 'fld_77'));
await p.click('.fl-griff'); await p.click('.fl-werk [data-a=alk]'); await bis(p, () => __mixarium.sammlung.einstellungen.ohneAlkohol === true && !document.querySelector('.fl-knoepfe'));
l = await leiste(p);
pruefe('„Ohne Alkohol“ gilt auch im Ordner: er zählt nur, was zu sehen ist', l.some((t) => t.endsWith('Omas Bar 2')) && l[0] === 'Alle 4', l.join(' | '));
await p.click('.fl-griff'); await p.click('.fl-werk [data-a=alk]'); await bis(p, () => __mixarium.sammlung.einstellungen.ohneAlkohol === false && !document.querySelector('.fl-knoepfe'));
await oeffne(p, 'Verwaist');
pruefe('ein Ordner, den es nicht gibt, ist kein Ordner: am Getränk steht keiner', await p.locator('.held h2').innerText() === 'Verwaist' && await p.locator('.held .im-ordner').count() === 0 && String((await getraenk(p, 'Verwaist')).folder) === '99', JSON.stringify(await getraenk(p, 'Verwaist')));
await c.close();

console.log('8 · Monitor 1280 px');
({ p, c } = await seite(1280, () => {
  localStorage.setItem('mix9m', JSON.stringify([{ id: 1, name: 'Im Ordner', cat: 'mock', folder: 77, ings: [{ amt: '2', unit: 'cl', name: 'Sirup' }], steps: [{ txt: 'Rühren.' }] }, { id: 2, name: 'Frei', cat: 'limo', ings: [], steps: [] }]));
  localStorage.setItem('mxfd9m', JSON.stringify([{ id: 77, name: 'Omas Bar' }]));
}));
await p.waitForSelector('.karte'); await p.locator('.karte', { hasText: 'Im Ordner' }).click(); await p.waitForSelector('.seite .tzeile');
pruefe('am Monitor steht der Ordner neben der Kategorie', (await p.locator('.seite .unter .im-ordner').innerText()).includes('Omas Bar') && (await p.locator('.seite .unter').innerText()).includes('Mocktails'));
await p.click('.seite [data-a=bildwerk]'); await p.waitForSelector('.seite .rwerk');
pruefe('am Monitor trägt das Werkzeug „Ordner“ sein Wort', (await p.locator('.seite .rwerk [data-a=ordner-zuordnen]').innerText()).trim() === 'Ordner');
await p.locator('.md .liste .leiste .ord').click(); await bis(p, () => document.querySelectorAll('.md .liste .zeile').length === 1);
pruefe('am Monitor filtert der Ordner die Liste neben dem Getränk', await p.locator('.md .liste .zeile').count() === 1 && (await p.locator('.md .liste .zeile strong').innerText()) === 'Im Ordner');
await c.close();

pruefe('keine Fehler in der Konsole, kein Netz nach draußen', fehler.length === 0, fehler.join(' · '));
await b.close(); server.close();
console.log(`\n${gruen} grün · ${rot} ROT`);
process.exitCode = rot ? 1 : 0;
