// Probe der Sprach-Tabellen der neuen PWA (neu/sprachen/<code>.mjs) im echten Browser.
//   Teil 1 misst die TABELLEN ohne die App: eine leere Seite lädt kern/oberflaeche/sprache.mjs und je Sprache die Tabelle über ladeTabelle().
//   Teil 2 misst die VERDRAHTUNG: die Sprache wird in der App gewählt, die App lädt ihre Tabelle selbst (tabellenLaden in neu/app.mjs).
//   Geprüft wird, ob die Schlüssel treffen, was die App zeichnet, ob die Sätze mit Zahl aus der Tabelle kommen und ob die Texte am
//   Handy (390 px) Platz haben. Die Tabellen des Kerns (kern/sprachen/) misst diese Probe nicht.
//   node tests/smoke_neu_sprachen.mjs        Schlusszeile: „N grün · M ROT“, Rückgabewert 1 bei ROT
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import { themenAuf } from './neu-hilfe.mjs';
const { chromium } = createRequire(import.meta.url)('playwright');
const WURZEL = process.env.WURZEL || process.cwd();
const { sammle, CODES } = await import(pathToFileURL(join(WURZEL, 'tools', 'sprach-schluessel.mjs')).href);
const ART = { '.html': 'text/html', '.mjs': 'text/javascript', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.png': 'image/png', '.svg': 'image/svg+xml' };
const server = createServer(async (q, a) => {
  let p = decodeURIComponent(new URL(q.url, 'http://x').pathname).replace(/^\/Mein-Mixarium/, '');
  if (p === '/leer.html') { a.writeHead(200, { 'content-type': 'text/html' }); return a.end('<!doctype html><meta charset="utf-8"><title>leer</title>'); }
  if (p.endsWith('/')) p += 'index.html';
  try { const d = await readFile(join(WURZEL, normalize(p))); a.writeHead(200, { 'content-type': ART[extname(p)] || 'application/octet-stream' }); a.end(d); } catch (e) { a.writeHead(404); a.end('fehlt'); }
});
await new Promise((r) => server.listen(0, r));
const U = `http://localhost:${server.address().port}/Mein-Mixarium/`;
let gruen = 0, rot = 0;
const pruefe = (name, ok, mehr = '') => { if (ok) { gruen++; console.log('  ✓ ' + name); } else { rot++; console.log('  ✗ ROT ' + name + (mehr ? ' — ' + mehr : '')); } };
/* Eine Probe, die stolpert, ist ROT und druckt ihre Schlusszeile – kein toter Lauf. */
let b = null;
const schluss = () => { console.log(`\n${gruen} grün · ${rot} ROT`); process.exitCode = rot ? 1 : 0; };
const stolpern = async (e) => { rot++; console.log('  ✗ ROT die Probe ist gestolpert — ' + String((e && e.message) || e).split('\n')[0]); try { if (b) await b.close(); } catch (x) { /* schon zu */ } server.close(); schluss(); };
process.on('unhandledRejection', stolpern); process.on('uncaughtException', stolpern);

const GESAMMELT = sammle(WURZEL), S = GESAMMELT.schluessel, PAARE = Object.entries(S);
/* Benannte Grenze: vorbereitete Texte (Gerätschaften) stehen in den Tabellen, die App holt sie aber noch nicht über text(). */
const VORBEREITET = new Set(GESAMMELT.vorbereitet.map((x) => x.en));
/* Zehn Texte, an denen man die Sprache sofort erkennt (genaue deutsche Schlüssel aus dem Werkzeug). */
const WICHTIG = ['Suchen', 'Einstellungen', 'Speichern', 'Getränkekarte', 'Einkauf', 'Zutaten', 'Zubereitung', 'Ohne Alkohol', 'Sichern', 'Neues Getränk'];
const SCHRIFT = { ru: /[Ѐ-ӿ]/, zh: /\p{Script=Han}/u };

b = await chromium.launch();
const fehler = [], draussen = [];
/* Das Netz ist gestellt: alles außer dem eigenen Server wird abgewiesen und gezählt. */
const seite = async (w, h) => {
  const c = await b.newContext({ viewport: { width: w, height: h }, locale: 'de-DE', serviceWorkers: 'block' });
  await c.route((u) => !u.href.startsWith(new URL(U).origin), (r) => { draussen.push(r.request().url()); return r.abort(); });
  const p = await c.newPage(); p.on('pageerror', (e) => fehler.push(e.message)); return p;
};

console.log('Teil 1 · Tabellen ohne App (leere Seite, Kern-Modul sprache.mjs)');
pruefe('die zehn wichtigen Texte sind Schlüssel im Code', WICHTIG.every((k) => k in S), WICHTIG.filter((k) => !(k in S)).join(', '));
let p = await seite(390, 800);
await p.goto(U + 'leer.html');
const T = await p.evaluate(async ({ U, CODES, PAARE }) => {
  const sp = await import(U + 'kern/oberflaeche/sprache.mjs'), aus = {};
  const fehlt = await sp.ladeTabelle('pt', [U + 'neu/sprachen/gibt-es-nicht.mjs']);
  aus.ohneDatei = { da: fehlt, englisch: PAARE.every(([de, en]) => sp.text('pt', de, en) === en) };
  for (const c of CODES) {
    const vorher = PAARE.every(([de, en]) => sp.text(c, de, en) === en);
    const da = await sp.ladeTabelle(c, [U + 'neu/sprachen/' + c + '.mjs']);
    aus[c] = { vorher, da, zahl: Object.keys(sp.tabelleVon(c)).length, texte: PAARE.map(([de, en]) => sp.text(c, de, en)) };
  }
  aus.de = PAARE.every(([de, en]) => sp.text('de', de, en) === de); aus.en = PAARE.every(([de, en]) => sp.text('en', de, en) === en);
  aus.fuelle = sp.fuelle(sp.text('fr', 'Datei {0} von {1}: {2}', 'File {0} of {1}: {2}'), 2, 5, 'karte.pdf');
  return aus;
}, { U, CODES, PAARE });
pruefe('eine Tabelle, die es nicht gibt, lässt Englisch stehen (kein Fehler, kein Schlüsselname)', T.ohneDatei.da === false && T.ohneDatei.englisch);
const von = (c, de) => T[c].texte[PAARE.findIndex(([k]) => k === de)];
for (const c of CODES) {
  const x = T[c], nicht = WICHTIG.filter((k) => { const t = von(c, k); return !t || t === k || t === S[k]; });
  const uebersetzt = PAARE.filter(([de, en], i) => x.texte[i] && x.texte[i] !== de && x.texte[i] !== en).length;
  pruefe(`${c}: ohne Tabelle steht Englisch da`, x.vorher);
  pruefe(`${c}: ladeTabelle() holt die Tabelle vom Server, mit allen Schlüsseln`, x.da === true && x.zahl === PAARE.length, `${x.zahl} von ${PAARE.length}`);
  pruefe(`${c}: die zehn wichtigen Texte sind weder Deutsch noch Englisch`, nicht.length === 0, nicht.map((k) => `${k} → ${von(c, k)}`).join(' · '));
  pruefe(`${c}: mindestens neun von zehn Texten sind übersetzt`, uebersetzt >= PAARE.length * 0.9, `${uebersetzt} von ${PAARE.length}`);
  if (SCHRIFT[c]) pruefe(`${c}: die zehn Texte stehen in der Schrift dieser Sprache`, WICHTIG.every((k) => SCHRIFT[c].test(von(c, k))), WICHTIG.filter((k) => !SCHRIFT[c].test(von(c, k))).join(', '));
}
{ const satz = (c) => WICHTIG.map((k) => von(c, k)).join('|'), l = CODES.map(satz);
  pruefe('keine zwei Sprachen tragen dieselbe Tabelle', new Set(l).size === CODES.length); }
pruefe('Deutsch und Englisch bleiben, wie sie im Code stehen', T.de && T.en);
pruefe('fuelle() setzt in den übersetzten Satz ein', T.fuelle.includes('2') && T.fuelle.includes('5') && T.fuelle.includes('karte.pdf') && !/\{\d\}/.test(T.fuelle) && !T.fuelle.startsWith('File'), T.fuelle);
await p.context().close();

console.log('\nTeil 2 · die App lädt ihre Tabelle selbst (Handy 390 px)');
/* Was in der App zu sehen ist: Texte, Beschriftungen, Platzhalter. Steht dort noch der englische Text eines Schlüssels, hat die
   Tabelle ihn nicht getroffen. Texte aus dem Kern und Vorlagen mit ${…} sind keine Schlüssel und zählen hier nicht. */
const lage = (p, tab) => p.evaluate(({ tab, PAARE }) => {
  const w = document.querySelector('.mx'), texte = [];
  const tw = document.createTreeWalker(w, NodeFilter.SHOW_TEXT);
  for (let n = tw.nextNode(); n; n = tw.nextNode()) { const t = n.textContent.trim(); if (t) texte.push(t); }
  for (const e of w.querySelectorAll('[aria-label],[title],[placeholder]')) for (const a of ['aria-label', 'title', 'placeholder']) { const t = (e.getAttribute(a) || '').trim(); if (t) texte.push(t); }
  const da = new Set(texte), werte = new Set(Object.values(tab));
  return { englisch: PAARE.filter(([de, en]) => tab[de] !== en && !werte.has(en) && da.has(en)).map(([, en]) => en), treffer: texte.filter((t) => werte.has(t)).length, quer: document.documentElement.scrollWidth > innerWidth };
}, { tab, PAARE });
const grenze = new Set(), gemessen = [];
/* Bricht ein Knopf um, der auf Deutsch in einer Zeile steht? Gezählt werden die Zeilen des TEXTES, nicht eine Höhe: ein Symbol
   neben dem Text ist keine zweite Zeile. Eine neue Zeile beginnt, wo die Mitte eines Textstücks mehr als 9 px unter der vorigen
   liegt (feste Raster-Stufen zählten zwei Schriftgrößen auf derselben Zeile manchmal doppelt). Der Name eines Knopfs ist seine
   Stelle im Blatt. */
const zeilen = (p) => p.evaluate(() => {
  const zahl = {}, aus = [];
  for (const e of document.querySelectorAll('.mx button, .mx a, .mx summary, .mx label')) {
    if (!e.offsetParent || !e.textContent.trim()) continue;
    const art = e.tagName + '.' + [...e.classList].join('.') + '|' + ['a', 'go', 't', 'm', 'f', 'lang'].map((k) => e.dataset[k] || '').join('|'), name = art + '#' + (zahl[art] = (zahl[art] || 0) + 1);
    const mitten = [], tw = document.createTreeWalker(e, NodeFilter.SHOW_TEXT);
    for (let n = tw.nextNode(); n; n = tw.nextNode()) { if (!n.textContent.trim()) continue; const r = document.createRange(); r.selectNodeContents(n); for (const x of r.getClientRects()) if (x.width > 1) mitten.push((x.top + x.bottom) / 2); }
    mitten.sort((a, b) => a - b);
    aus.push([name, mitten.filter((m, i) => i === 0 || m - mitten[i - 1] > 9).length, e.textContent.trim().replace(/\s+/g, ' ').slice(0, 60), e.scrollWidth > e.clientWidth + 1 && getComputedStyle(e).overflowX !== 'visible']);
  }
  return aus;
});
const sprachWahl = async (p, c) => { await p.click('.fl-griff'); await p.click('.fl-werk [data-m=sprache]'); await p.click(`.sprachmenue [data-lang="${c}"]`); };
const nav = async (p, v) => { await p.click('.fl-griff'); await p.click(`.fl-knoepfe [data-go=${v}]`); };
/* Die Blätter, in der Reihenfolge eines Besuchs: erst die leere App, dann mit dem Startpaket (vom eigenen Server, kein Netz).
   Jedes Blatt nennt die BEDINGUNG, ab der es fertig steht: die App wechselt die Ansicht über startViewTransition, also verzögert –
   wer gleich nach dem Tipp misst, misst noch das vorige Blatt. */
const zu = "!document.querySelector('.fl-knoepfe')", in_ = (v) => `__mixarium.zustand.view === '${v}' && ${zu}`, da = (s) => `!!document.querySelector('${s}')`;
const BLAETTER = [
  ['Start, leer', async () => {}, `${in_('start')} && ${da('.willkommen')} && !document.querySelector('.sprachmenue')`],
  ['Fliegende Leiste', async (p) => { await p.click('.fl-griff'); }, da('.fl-knoepfe')],
  ['Einstellungen', async (p) => { await p.click('.fl-knoepfe [data-go=mehr]'); await themenAuf(p); }, `${in_('mehr')} && ${da('.themen')} && !document.querySelector('.gkopf[aria-expanded="false"]')`],
  ['Fenster „Ordner“', async (p) => { await p.click('.ezeile[data-a=ordner]'); }, da('#ord-leer')],
  ['Blatt „Neues Getränk“', async (p) => { await p.keyboard.press('Escape'); await p.waitForSelector('.fenster', { state: 'detached' }); await nav(p, 'start'); await p.click('.kopf [data-a=neu]'); }, `${in_('start')} && ${da('.fenster')}`],
  ['Start mit Getränken', async (p) => { await p.keyboard.press('Escape'); await p.click('.willkommen [data-a=beispiele]'); await p.click('[data-paket=getraenke-ohne-alkohol-start]'); }, `${in_('start')} && ${da('.karte')} && !document.querySelector('.fenster')`],
  ['Getränk', async (p) => { await p.locator('.karte').first().click(); }, `__mixarium.zustand.view === 'getraenk' && ${da('.reihe [data-go=mix]')}`],
  ['Mix-Ansicht', async (p) => { await p.click('.reihe [data-go=mix]'); }, `__mixarium.zustand.view === 'mix' && ${da('.mix')}`],
  ['Menü am Getränk', async (p) => { await p.keyboard.press('Escape'); await p.waitForFunction("__mixarium.zustand.view === 'getraenk'"); await p.click('[data-a=bildwerk]'); await p.click('.rwerk [data-a=gmenue]'); }, da('#gmenue')],
  ['Einkauf', async (p) => { await p.keyboard.press('Escape'); await p.waitForSelector('.fenster', { state: 'detached' }); await p.click('[data-a=einkauf-dazu]'); await nav(p, 'einkauf'); }, `${in_('einkauf')} && ${da('.gruppe-e')}`],
  ['Karte', async (p) => { await nav(p, 'karte'); }, in_('karte')],
  ['Labor', async (p) => { await nav(p, 'labor'); }, `${in_('labor')} && ${da('.laborform')}`],
];
/* Deutsch zuerst: das Maß dafür, welche Knöpfe in einer Zeile stehen – und welche Knöpfe ein Blatt überhaupt trägt. */
const einzeilig = {}, knoepfe = {};
for (const c of ['de', ...CODES]) {
  p = await seite(390, 800);
  await p.goto(U + 'neu/?leer'); await p.waitForSelector('.mx');
  let tab = {};
  if (c !== 'de') {
    tab = (await import(pathToFileURL(join(WURZEL, 'neu', 'sprachen', c + '.mjs')).href)).default;   // was in der Datei steht; geladen hat die Probe hier nichts
    await sprachWahl(p, c);
    /* Die App lädt nach der Wahl selbst und zeichnet dann neu. Kommt die Sprache nicht, ist das EINE rote Zeile – der Rest mäße nichts. */
    const geladen = await p.waitForFunction((t) => { const h = document.querySelector('.willkommen h3'); return h && h.textContent.trim() === t; }, tab['Noch keine Getränke'], { timeout: 8000 }).then(() => true, () => false);
    pruefe(`${c}: nach der Sprachwahl lädt die App ihre Tabelle selbst und zeichnet in dieser Sprache (leere App, Kopf)`, geladen && await p.evaluate((t) => document.querySelector('.kopf [data-a=neu]').getAttribute('aria-label') === t['Neues Getränk'] && [...document.querySelectorAll('.willkommen .knopf')].map((x) => x.textContent.trim()).join('|') === t['Getränk'] + '|' + t['Beispiele'], tab), geladen ? '' : 'die App steht nach 8 s nicht in der Sprache');
    if (!geladen) { await p.context().close(); continue; }
  }
  const englisch = [], quer = [], umbruch = [], gekappt = [], anders = [], zahlsatz = []; let treffer = 0;
  for (const [name, hin, bereit] of BLAETTER) {
    await hin(p); await p.waitForFunction(bereit);
    if (name === 'Getränk' && c !== 'de') {
      /* Sätze mit Zahl: ein ganzer Satz aus der Tabelle, nicht Zahl + Wort (russisch „Напитков: 7“ statt „7 Напитки“). */
      const ist = await p.evaluate(() => ({ port: document.querySelector('.portion b').textContent.trim(), n: __mixarium.zustand.port }));
      zahlsatz.push(ist.port === (ist.n === 1 ? tab['1 Portion'] : tab['{0} Portionen'].replace('{0}', ist.n)) ? '' : `Portionen: ${ist.port}`);
    }
    if (name === 'Start mit Getränken' && c !== 'de') {
      const ist = await p.evaluate(() => ({ kopf: document.querySelector('.kopf .name small').textContent.trim(), n: document.querySelectorAll('.karte').length }));
      zahlsatz.push(ist.n > 1 && ist.kopf === tab['{0} Getränke'].replace('{0}', ist.n) ? '' : `Kopf: ${ist.kopf}`);
    }
    const z = await zeilen(p), namen = z.map((x) => x[0]).sort().join('\n');
    if (c === 'de') { einzeilig[name] = new Set(z.filter((x) => x[1] === 1 && !x[3]).map((x) => x[0])); knoepfe[name] = namen; continue; }
    if (namen !== knoepfe[name]) anders.push(name);
    const l = await lage(p, tab); treffer += l.treffer;
    for (const e of l.englisch) { if (VORBEREITET.has(e)) grenze.add(e); else englisch.push(`${name}: ${e}`); }
    if (l.quer) quer.push(name);
    for (const x of z) if (einzeilig[name].has(x[0])) { if (x[1] > 1) umbruch.push(`${name}: ${x[2]}`); if (x[3]) gekappt.push(`${name}: ${x[2]}`); }
  }
  if (c !== 'de') {
    pruefe(`${c}: jedes Blatt trägt dieselben Knöpfe wie auf Deutsch (sonst vergliche die Probe zwei verschiedene Zustände)`, anders.length === 0, anders.join(', '));
    pruefe(`${c}: kein Text eines Schlüssels steht in der App noch auf Englisch`, englisch.length === 0, [...new Set(englisch)].slice(0, process.env.ALLES ? 99 : 6).join(' · '));
    pruefe(`${c}: die Texte der Tabelle stehen wirklich auf den Blättern`, treffer >= 60, `${treffer} Treffer`); gemessen.push(`${c} ${treffer}`);
    pruefe(`${c}: Sätze mit Zahl kommen als Ganzes aus der Tabelle (Kopf, Portionen)`, zahlsatz.length === 2 && zahlsatz.every((x) => !x), zahlsatz.filter(Boolean).join(' · ') || `${zahlsatz.length} gemessen`);
    pruefe(`${c}: kein Blatt läuft am Handy quer`, quer.length === 0, quer.join(', '));
    pruefe(`${c}: kein Knopf bricht um, der auf Deutsch in einer Zeile steht`, umbruch.length === 0, [...new Set(umbruch)].slice(0, process.env.ALLES ? 99 : 6).join(' · '));
    pruefe(`${c}: kein Knopf schneidet seinen Text ab, der auf Deutsch ganz zu lesen ist`, gekappt.length === 0, [...new Set(gekappt)].slice(0, process.env.ALLES ? 99 : 6).join(' · '));
  }
  if (c !== 'de') {
    /* Die Wahl hält: nach dem Neuladen steht die App gleich in der Sprache (Tabelle vor dem ersten Zeichnen geladen). */
    await p.waitForFunction("__mixarium.einstellungen.sprache === '" + c + "'"); await p.waitForTimeout(400); await p.reload(); await p.waitForSelector('.kopf [data-a=neu]');
    pruefe(`${c}: nach dem Neuladen steht die App gleich in dieser Sprache`, await p.evaluate((t) => document.querySelector('.kopf [data-a=neu]').getAttribute('aria-label') === t, tab['Neues Getränk']), await p.evaluate(() => document.querySelector('.kopf [data-a=neu]').getAttribute('aria-label')));
  }
  await p.context().close();
}
pruefe('das Maß taugt: auf Deutsch stehen viele Knöpfe in einer Zeile', Object.values(einzeilig).reduce((n, s) => n + s.size, 0) >= 80, JSON.stringify(Object.fromEntries(Object.entries(einzeilig).map(([k, s]) => [k, s.size]))));
if (process.env.ALLES) console.log('  · einzeilig je Blatt: ' + Object.entries(einzeilig).map(([k, s]) => `${k} ${s.size}`).join(', '));
console.log(`  · gemessen: Texte aus der Tabelle auf ${BLAETTER.length} Blättern – ${gemessen.join(', ')}; auf Deutsch einzeilig: ${Object.values(einzeilig).reduce((n, s) => n + s.size, 0)} Knöpfe und Zeilen`);
if (grenze.size) console.log(`  · benannte Grenze: noch auf Englisch, weil die App sie nicht über text() holt (Tabellen tragen sie schon): ${[...grenze].join(', ')}`);
pruefe('kein Aufruf verlässt den eigenen Server', draussen.length === 0, draussen.slice(0, 3).join(' | '));
pruefe('kein Fehler auf den Seiten', fehler.length === 0, fehler.slice(0, 3).join(' | '));
await b.close(); server.close();
schluss();
