// Probe: Kategorien und Einkauf der neuen PWA laufen über den Küchen-Kern (ab 10.0.0-vor8). Echter Browser, kein Netz nach draußen.
//   node tests/smoke_neu_kategorien.mjs   Schlusszeile: „N grün · M ROT“, Rückgabewert 1 bei ROT
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('playwright');
const WURZEL = process.env.WURZEL || process.cwd();
const ART = { '.html': 'text/html', '.mjs': 'text/javascript', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.png': 'image/png', '.svg': 'image/svg+xml' };
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
// Ein Absturz ist ROT, nicht ein toter Lauf: die Schlusszeile steht trotzdem da (Lehre aus Mein Rezeptbuch).
const abbruch = async (e) => { rot++; console.log('  ✗ ROT Probe abgebrochen — ' + String(e && e.message || e).split('\n')[0]); try { await b.close(); } catch (f) { /* schon zu */ } server.close(); console.log(`\n${gruen} grün · ${rot} ROT`); process.exitCode = 1; };
process.on('unhandledRejection', abbruch); process.on('uncaughtException', abbruch);
const fehler = [];
const seite = async (w, h) => { const c = await b.newContext({ viewport: { width: w, height: h }, locale: 'de-DE' }); const p = await c.newPage(); p.on('pageerror', (e) => fehler.push(e.message)); p.on('console', (m) => { if (m.type() === 'error') fehler.push(m.text()); }); return p; };
const ruhe = (p) => p.waitForTimeout(350);
const Zs = (p, f) => p.evaluate(f);


const leiste = (p) => p.locator('.leiste .chip').evaluateAll((l) => l.map((c) => { const k = c.cloneNode(true); k.querySelectorAll('.kemoji,.zahl,svg').forEach((x) => x.remove()); return k.textContent.trim(); }));

console.log('Monitor 1280 px · alte Daten mit eigenen Kategorien, Ordner-Kennung und Rezeptbuch-Kategorie');
let p = await seite(1280, 900);
await p.goto(U + 'impressum.html');
await Zs(p, () => {
  localStorage.setItem('mix9m', JSON.stringify([
    { id: 1, name: 'Virgin Mojito', cat: 'mock', ings: [{ amt: '2', unit: 'cl', name: 'Limettensaft' }, { amt: '1', unit: 'oz', name: 'Limettensaft' }, { amt: '', unit: '', name: 'Minze' }], steps: [{ txt: 'Mixen.' }], servings: 1 },
    { id: 2, name: 'Tiki Punch', cat: 'eig_tiki', ings: [{ amt: '4', unit: 'cl', name: 'Ananassaft' }], steps: [{ txt: 'Rühren.' }], servings: 1 },
    { id: 3, name: 'Bruschetta', cat: 'vorsp', ings: [{ amt: '1', unit: '', name: 'Brot' }], steps: [{ txt: 'Rösten.' }] },
    { id: 4, name: 'Im Ordner', cat: 'fld_f1', ings: [{ amt: '1', unit: 'cl', name: 'Sirup' }], steps: [{ txt: 'X.' }] },
    { id: 5, name: 'Zitronenlimo', cat: 'limo', ings: [{ amt: '1', unit: 'l', name: 'Mineralwasser' }, { amt: '4', unit: 'cl', name: 'weißer Rum' }], steps: [{ txt: 'Y.' }] },
  ]));
  localStorage.setItem('mxcats9m', JSON.stringify({ mock: { name: 'Ohne Prozente', ico: '🧃' } }));
  localStorage.setItem('mxcatsneu9m', JSON.stringify([{ id: 'eig_tiki', de: 'Tiki', ico: '🗿' }]));
  localStorage.setItem('mxcatord9m', JSON.stringify(['limo', 'eig_tiki', 'mock']));
  localStorage.setItem('mxcatsaus9m', JSON.stringify(['knab']));
  const heute = new Date(), iso = `${heute.getFullYear()}-${String(heute.getMonth() + 1).padStart(2, '0')}-${String(heute.getDate()).padStart(2, '0')}`;
  localStorage.setItem('mxms9m', JSON.stringify([{ id: 1, date: iso, mealType: 'abend', rid: 1, courseType: 'mock' }, { id: 2, date: iso, mealType: 'abend', rid: null, customText: 'Wasser' }]));
});
await p.goto(U + 'neu/'); await p.waitForSelector('.karte'); await ruhe(p);
const k = await Zs(p, () => __mixarium.sammlung.kategorien);
pruefe('der Kategorie-Zustand steht im Format des Kerns (eigene/namen/ausgeblendet/folge)', Array.isArray(k.eigene) && k.namen && Array.isArray(k.ausgeblendet) && Array.isArray(k.folge) && !('neu' in k) && !('eigen' in k), JSON.stringify(k));
pruefe('eigener Name, eigenes Zeichen, neue Kategorie, Reihenfolge und Ausblendung sind mitgekommen', k.namen.mock?.name === 'Ohne Prozente' && k.namen.mock?.emoji === '🧃' && k.eigene.some((c) => c.id === 'eig_tiki' && c.emoji === '🗿') && k.folge.join() === 'limo,eig_tiki,mock' && k.ausgeblendet.includes('knab'), JSON.stringify(k));
const l1 = await leiste(p);
pruefe('die Leiste folgt der alten Reihenfolge und zeigt den eigenen Namen', l1.slice(0, 4).join('|') === 'Alle|Limonaden|Tiki|Ohne Prozente', l1.join('|'));
pruefe('„vorsp“ aus dem Rezeptbuch heißt „Vorspeisen“, nie roh', l1.includes('Vorspeisen') && !l1.includes('vorsp'), l1.join('|'));
pruefe('ein altes cat: "fld_…" ist ein Ordner: es zieht nach folder und erscheint sichtbar unter „Ohne Kategorie“', await Zs(p, () => { const r = __mixarium.sammlung.getraenke.find((x) => x.name === 'Im Ordner'); return r.cat === '' && r.folder === 'f1'; }) && l1.includes('Ohne Kategorie'), l1.join('|'));
pruefe('das eigene Zeichen steht in der Leiste', (await p.locator('.leiste .chip .kemoji').allInnerTexts()).join('') === '🗿🧃');
pruefe('die alten Daten sind unverändert', await Zs(p, () => JSON.parse(localStorage.getItem('mxcats9m')).mock.name === 'Ohne Prozente' && localStorage.getItem('mxcatsneu9m').includes('eig_tiki')));

console.log('Wochenplan');
await p.click('.nav [data-go=karte]'); await ruhe(p); await p.click('[data-go=plan]'); await ruhe(p);
pruefe('Karte → Wochenplan: der Plan der bisherigen App ist da (Virgin Mojito heute)', (await p.locator('.w-tag.heute').innerText()).includes('Virgin Mojito'), await p.locator('.w-tag.heute').innerText());
pruefe('die alten Daten bleiben unberührt (mxms9m und A.karten)', await Zs(p, () => JSON.parse(localStorage.getItem('mxms9m')).length === 2 && __mixarium.sammlung.karten.length === 2));
pruefe('die Leiste markiert „Karte“', await p.locator('.nav [data-go=karte][aria-current=page]').count() === 1);
const morgen = await p.evaluate(() => [...document.querySelectorAll('.w-tag')].map((x) => x.dataset.tag).find((d) => d > document.querySelector('.w-tag.heute')?.dataset.tag) || document.querySelectorAll('.w-tag')[6].dataset.tag);
await p.click(`.w-tag[data-tag="${morgen}"] [data-a=plan-waehlen]`); await ruhe(p); await p.locator('.fenster [data-a=plan-setzen]', { hasText: 'Zitronenlimo' }).click(); await ruhe(p);
pruefe('ein Getränk an einem Tag planen', (await p.locator(`.w-tag[data-tag="${morgen}"]`).innerText()).includes('Zitronenlimo'));
await p.click('[data-a=plan-einkauf]'); await ruhe(p);
pruefe('„Einkaufsliste für die Woche“ setzt die Zutaten der geplanten Getränke auf die Liste', await Zs(p, () => __mixarium.sammlung.einkauf.some((x) => x.name === 'Limettensaft') && __mixarium.sammlung.einkauf.some((x) => x.name === 'Mineralwasser')));
const nEk = await Zs(p, () => __mixarium.sammlung.einkauf.length); await p.click('[data-a=plan-einkauf]'); await ruhe(p);
pruefe('ein zweiter Tipp setzt nichts doppelt', await Zs(p, () => __mixarium.sammlung.einkauf.length) === nEk);
await p.click(`.w-tag[data-tag="${morgen}"] [data-a=plan-weg]`); await ruhe(p);
pruefe('aus dem Plan nehmen', !(await p.locator(`.w-tag[data-tag="${morgen}"]`).innerText()).includes('Zitronenlimo'));
await p.click('[data-a=plan-woche][data-tage="7"]'); await ruhe(p); pruefe('nächste Woche: leer', await p.locator('.w-slot').count() === 0, await p.locator('.w-tage').innerText() + ' / ' + JSON.stringify(await Zs(p, () => __mixarium.sammlung.plan)));
await p.click('[data-a=plan-heute]'); await ruhe(p); pruefe('„Heute“ springt zurück', await p.locator('.w-tag.heute').count() === 1);
pruefe('am Monitor stehen die sieben Tage nebeneinander', await Zs(p, () => { const t = [...document.querySelectorAll('.w-tag')].map((x) => x.getBoundingClientRect()); return t.length === 7 && t.every((r) => Math.abs(r.top - t[0].top) < 2); }));
await p.click('.w-auf'); await ruhe(p); pruefe('ein Tipp auf ein geplantes Getränk öffnet es', await Zs(p, () => __mixarium.zustand.view === 'getraenk'));
await p.click('.seite [data-a=planen], [data-a=planen]'); await ruhe(p); await p.locator('.fenster [data-a=plan-setzen]').nth(1).click(); await ruhe(p);
pruefe('am Getränk: „Planen“ trägt es an einem Tag ein', await Zs(p, () => Object.values(__mixarium.sammlung.plan).flat().filter((u) => u === __mixarium.zustand.uid).length === 2));
pruefe('die Sicherung trägt den Plan', await Zs(p, () => Object.keys(JSON.parse(__mixarium.sicherung()).plan || {}).length >= 1));

console.log('Kategorien verwalten');
await p.click('.nav [data-go=mehr]'); await ruhe(p); await p.click('[data-a=kategorien]'); await p.waitForSelector('#kat-liste');
pruefe('Einstellungen → Kategorien öffnet die Liste mit Griff, Zeichen, Name, Zahl, Löschen', await p.locator('.kat-zeile').count() >= 10 && await p.locator('.kat-zeile .griff').count() === await p.locator('.kat-zeile').count());
await p.fill('.kat-name[data-kid=limo]', 'Limos'); await p.press('.kat-name[data-kid=limo]', 'Tab'); await ruhe(p);
pruefe('Umbenennen wirkt und gilt auch auf Englisch', await Zs(p, () => __mixarium.sammlung.kategorien.namen.limo?.name === 'Limos'));
await p.click('.kat-zeichen[data-kid=limo]'); await p.click('[data-a=kat-emoji-setzen][data-em="🍋"]'); await ruhe(p);
pruefe('ein Zeichen wählen setzt das Emoji und führt zurück zur Liste', await Zs(p, () => __mixarium.sammlung.kategorien.namen.limo?.emoji === '🍋') && await p.locator('#kat-liste').count() === 1);
await p.click('[data-a=kat-neu]'); await ruhe(p);
const neuId = await Zs(p, () => __mixarium.sammlung.kategorien.eigene.at(-1).id);
pruefe('„Neue Kategorie“ legt eine an und setzt den Cursor in ihr Namensfeld', /^eig_/.test(neuId) && await p.evaluate((id) => document.activeElement?.dataset?.kid === id, neuId));
await p.keyboard.type('Heißgetränke'); await p.keyboard.press('Tab'); await ruhe(p);
pruefe('ihr Name wird gespeichert', await p.evaluate((id) => __mixarium.sammlung.kategorien.eigene.find((c) => c.id === id)?.de === 'Heißgetränke', neuId));
// Ziehen: „Tiki“ hinter „Ohne Prozente“ (mit der Maus, wie am Monitor)
const zug = async (von, nach, unten) => { const a = await p.locator(von).boundingBox(), z = await p.locator(nach).boundingBox(); await p.mouse.move(a.x + a.width / 2, a.y + a.height / 2); await p.mouse.down(); await p.mouse.move(a.x + a.width / 2, a.y + 30, { steps: 4 }); await p.mouse.move(z.x + z.width / 2, z.y + (unten ? z.height * 0.85 : z.height * 0.15), { steps: 8 }); await p.mouse.up(); await ruhe(p); };
await zug('.kat-zeile[data-kid=eig_tiki] .griff', '.kat-zeile[data-kid=mock]', true);
pruefe('eine Kategorie am Griff ziehen ändert die Reihenfolge', (await Zs(p, () => __mixarium.sammlung.kategorien.folge.slice(0, 3).join())) === 'limo,mock,eig_tiki', await Zs(p, () => __mixarium.sammlung.kategorien.folge.join()));
await p.click('[data-a=kat-weg][data-kid=eig_tiki]'); await ruhe(p);
pruefe('Löschen mit Getränken fragt, wohin', (await p.locator('.fenster').innerText()).includes('Wohin mit 1') && await p.locator('[data-a=kat-weg-ziel][data-ziel=bowle]').count() === 1);
await p.click('[data-a=kat-weg-ziel][data-ziel=bowle]'); await ruhe(p);
pruefe('der Tiki Punch hängt jetzt unter Bowlen, „Tiki“ ist weg', await Zs(p, () => __mixarium.sammlung.getraenke.find((r) => r.name === 'Tiki Punch').cat === 'bowle' && !__mixarium.sammlung.kategorien.eigene.some((c) => c.id === 'eig_tiki')));
await p.click('[data-a=kat-weg][data-kid=sirup]'); await ruhe(p);
pruefe('eine leere feste Kategorie wird ausgeblendet und lässt sich wieder zeigen', await Zs(p, () => __mixarium.sammlung.kategorien.ausgeblendet.includes('sirup')) && await p.locator('[data-a=kat-zurueck][data-kid=sirup]').count() === 1);
await p.click('[data-a=kat-zurueck][data-kid=sirup]'); await ruhe(p);
pruefe('… und ist wieder da', await Zs(p, () => !__mixarium.sammlung.kategorien.ausgeblendet.includes('sirup')) && await p.locator('.kat-zeile[data-kid=sirup]').count() === 1);
await p.keyboard.press('Escape'); await ruhe(p);
await p.click('.nav [data-go=start]'); await ruhe(p);
const l2 = await leiste(p);
pruefe('die Leiste übernimmt Name, Reihenfolge und Löschen sofort', l2.slice(0, 3).join('|') === 'Alle|Limos|Ohne Prozente' && !l2.includes('Tiki'), l2.join('|'));
await Zs(p, () => document.querySelector('[data-lang=en]') || null); await p.click('.nav [data-go=mehr]'); await ruhe(p); await p.click('.eliste [data-a=menue][data-m=sprache]'); await p.click('[data-lang=en]'); await ruhe(p); await p.click('.nav [data-go=start]'); await ruhe(p);
const l3 = await leiste(p);
pruefe('auf Englisch: eigene Namen bleiben, feste werden übersetzt', l3.includes('Limos') && l3.includes('Ohne Prozente') && l3.includes('Punches') && l3.includes('Starters'), l3.join('|'));
await p.click('.nav [data-go=mehr]'); await ruhe(p); await p.click('.eliste [data-a=menue][data-m=sprache]'); await p.click('[data-lang=de]'); await ruhe(p);

console.log('Sicherung trägt den Kern-Zustand, die alte App kann sie weiter lesen');
const sich = await Zs(p, () => JSON.parse(__mixarium.sicherung()));
pruefe('Sicherung: Fassung 10, Liste im alten Format UND der volle Zustand', sich.version === 10 && Array.isArray(sich.kategorien) && sich.kategorien.every((c) => !('emoji' in c)) && sich.kategorienZustand?.namen?.limo?.name === 'Limos', JSON.stringify(sich.kategorien));

console.log('Einkaufsliste je Laden');
await p.click('.nav [data-go=start]'); await ruhe(p);
await p.click('.karte >> text=Virgin Mojito'); await ruhe(p); await p.click('[data-a=einkauf-dazu]'); await ruhe(p);
await p.click('.nav [data-go=start]'); await ruhe(p); await p.click('.karte >> text=Zitronenlimo'); await ruhe(p); await p.click('[data-a=einkauf-dazu]'); await ruhe(p);
await p.click('.nav [data-go=einkauf]'); await ruhe(p);
const gruppen = () => p.locator('.gruppe-e').evaluateAll((l) => l.map((g) => g.dataset.g));
pruefe('Warengruppen kommen aus dem Kern mit den Getränke-Gruppen', (await gruppen()).join() === 'saft,wasser,spirituosen,obst', (await gruppen()).join());
pruefe('Rum steht unter Spirituosen, Limettensaft unter Säften', (await p.locator('.gruppe-e[data-g=spirituosen]').innerText()).includes('Rum') && (await p.locator('.gruppe-e[data-g=saft]').innerText()).includes('Limettensaft'));
pruefe('es gibt einen Laden, und man kann einen anlegen', await p.locator('[data-a=ek-laden]').count() === 1 && await p.locator('[data-a=ek-laden-neu]').count() === 1);
await zug('.gruppe-e[data-g=obst] h3', '.gruppe-e[data-g=saft]', false);
pruefe('eine Gruppe an der Überschrift ziehen ändert die Reihenfolge im Laden', (await gruppen()).join() === 'obst,saft,wasser,spirituosen', (await gruppen()).join());
await p.click('[data-a=ek-laden-neu]'); await p.fill('#ladenform [name=n]', 'Getränkemarkt'); await p.click('#ladenform [type=submit]'); await ruhe(p);
pruefe('ein neuer Laden übernimmt die Reihenfolge des gewählten und ist ausgewählt', await p.locator('[data-a=ek-laden][aria-pressed=true]').innerText() === 'Getränkemarkt' && (await gruppen()).join() === 'obst,saft,wasser,spirituosen');
await zug('.gruppe-e[data-g=spirituosen] h3', '.gruppe-e[data-g=obst]', false);
pruefe('im neuen Laden eine eigene Reihenfolge', (await gruppen()).join() === 'spirituosen,obst,saft,wasser', (await gruppen()).join());
await p.click('[data-a=ek-laden][data-l=Supermarkt]'); await ruhe(p);
pruefe('der erste Laden behält seine Reihenfolge', (await gruppen()).join() === 'obst,saft,wasser,spirituosen', (await gruppen()).join());
pruefe('kein Querlaufen', await Zs(p, () => document.documentElement.scrollWidth <= innerWidth));
await p.reload(); await p.waitForSelector('.mx'); await ruhe(p); await p.click('.nav [data-go=einkauf]'); await ruhe(p);
pruefe('nach dem Neuladen: Läden und Kategorien sind gespeichert', (await gruppen()).join() === 'obst,saft,wasser,spirituosen' && await p.locator('[data-a=ek-laden]').count() === 2 && await Zs(p, () => __mixarium.sammlung.kategorien.namen.limo?.name === 'Limos'));
await p.context().close();

console.log('Handy 390 px: Kategorien mit dem Finger ziehen');
const c = await b.newContext({ viewport: { width: 390, height: 800 }, locale: 'de-DE', hasTouch: true }); p = await c.newPage(); p.on('pageerror', (e) => fehler.push(e.message));
await p.goto(U + 'neu/'); await p.waitForSelector('.mx'); await ruhe(p);
await p.click('[data-a=beispiele]'); await p.waitForSelector('[data-paket]'); await p.click('[data-paket=getraenke-ohne-alkohol-start]'); await p.waitForSelector('.karte'); await ruhe(p);
await p.click('.fl-griff'); await p.click('.fl-knoepfe [data-go=mehr]'); await ruhe(p); await p.click('[data-a=kategorien]'); await p.waitForSelector('#kat-liste');
pruefe('am Handy: die Liste passt ohne Querlaufen', await Zs(p, () => document.documentElement.scrollWidth <= innerWidth && [...document.querySelectorAll('.kat-zeile')].every((z) => z.getBoundingClientRect().right <= innerWidth + 1)));
const ids0 = await p.locator('.kat-zeile').evaluateAll((l) => l.map((z) => z.dataset.kid));
const g0 = await p.locator('.kat-zeile').nth(0).locator('.griff').boundingBox(), z2 = await p.locator('.kat-zeile').nth(2).boundingBox();
const cdp = await c.newCDPSession(p); const t = (type, x, y) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : [{ x, y }] });
await t('touchStart', g0.x + 13, g0.y + 17); await p.waitForTimeout(450); await t('touchMove', g0.x + 13, g0.y + 40); await t('touchMove', g0.x + 13, z2.y + z2.height * 0.8); await t('touchEnd'); await ruhe(p);
const ids1 = await p.locator('.kat-zeile').evaluateAll((l) => l.map((z) => z.dataset.kid));
pruefe('lange drücken und ziehen: die erste Kategorie steht jetzt an dritter Stelle', ids1[2] === ids0[0] && ids1[0] === ids0[1], ids0.slice(0, 3).join() + ' → ' + ids1.slice(0, 3).join());
await p.keyboard.press('Escape'); await ruhe(p); await p.click('.fl-griff'); await p.click('.fl-knoepfe [data-go=start]'); await ruhe(p);
console.log('Sticker: Kategorien mit Mini-Fotos (Klaus 23.11.)');
pruefe('ohne Fotos: jede Kategorie trägt das gezeichnete Bild ihres ersten Getränks', await p.evaluate(() => [...document.querySelectorAll('.leiste .chip.stk')].filter((b) => b.dataset.kat !== 'all').every((b) => b.querySelector('.sticker.gezeichnet svg'))));
// echte Fotos stellen: zwei im ersten Getränk-Kategorie-Paar, eins in einer anderen
await p.evaluate(() => { const foto = (f) => { const c = document.createElement('canvas'); c.width = 60; c.height = 60; const x = c.getContext('2d'); x.fillStyle = f; x.fillRect(0, 0, 60, 60); return c.toDataURL('image/jpeg'); }; const g = __mixarium.sammlung.getraenke, k = g[0].cat, gl = g.filter((r) => r.cat === k); gl[0].img = foto('#c33'); if (gl[1]) gl[1].img = foto('#3c3'); const andere = g.find((r) => r.cat !== k); andere.img = foto('#33c'); });
await p.click('.fl-griff'); await p.click('.fl-knoepfe [data-go=mehr]'); await ruhe(p); await p.click('.fl-griff'); await p.click('.fl-knoepfe [data-go=start]'); await ruhe(p);
const st = await p.evaluate(() => [...document.querySelectorAll('.leiste .chip.stk')].map((b) => ({ id: b.dataset.kat, foto: !!b.querySelector('img.sticker'), name: b.querySelector('.stk-name').textContent.trim(), sicht: b.querySelector('.stk-name').getBoundingClientRect().height > 8 })));
pruefe('die Leiste zeigt runde Mini-Fotos, jede Kategorie mit Bild trägt eins', st.some((x) => x.foto && x.id !== 'all'), JSON.stringify(st.map((x) => x.id + ':' + x.foto)));
pruefe('der Name jeder Kategorie bleibt lesbar unter dem Foto', st.every((x) => x.name.length > 2 && x.sicht), JSON.stringify(st.map((x) => x.name)));
const echt = await p.evaluate(() => { const g = __mixarium.sammlung.getraenke; return [...document.querySelectorAll('.leiste .chip.stk')].filter((b) => b.dataset.kat !== 'all').every((b) => { const img = b.querySelector('img.sticker'); const mit = g.filter((r) => r.cat === b.dataset.kat && r.img); return img ? mit.some((r) => r.img === img.getAttribute('src')) : mit.length === 0; }); });
pruefe('jedes Sticker-Foto stammt aus der EIGENEN Kategorie; ohne Bild steht das Zeichen', echt);
pruefe('am Handy läuft die Sticker-Reihe nicht quer über die Seite', await Zs(p, () => document.documentElement.scrollWidth <= innerWidth));
await p.click('.fl-griff'); await p.click('.fl-knoepfe [data-go=mehr]'); await ruhe(p); await p.click('[data-a=kategorien]'); await p.waitForSelector('#kat-liste');
const mitBild = await p.evaluate(() => { const g = __mixarium.sammlung.getraenke, z = {}; for (const r of g) if (r.img) z[r.cat] = (z[r.cat] || 0) + 1; return Object.entries(z).sort((a, b) => b[1] - a[1])[0]; });
await p.click(`.kat-zeile[data-kid="${mitBild[0]}"] [data-a=kat-emoji]`); await ruhe(p);
const n = await p.locator('.sticker-raster button').count();
pruefe('der Dialog bietet die Fotos der Kategorie als Sticker an, das jetzige markiert', n === mitBild[1] && await p.locator('.sticker-raster button[aria-pressed=true]').count() === 1, n + ' / ' + mitBild[1]);
const wahl = await p.locator('.sticker-raster button').nth(n - 1).locator('img').getAttribute('src'); await p.locator('.sticker-raster button').nth(n - 1).click(); await ruhe(p);
pruefe('das gewählte Foto steht in der Liste und ist gespeichert', (await p.locator(`.kat-zeile[data-kid="${mitBild[0]}"] .kat-zeichen img`).getAttribute('src')) === wahl && await p.evaluate((id) => !!__mixarium.sammlung.kategorien.namen[id]?.bild, mitBild[0]));
await p.keyboard.press('Escape'); await ruhe(p); await p.click('.fl-griff'); await p.click('.fl-knoepfe [data-go=start]'); await ruhe(p);
pruefe('… und als Sticker in der Leiste', (await p.locator(`.leiste .chip.stk[data-kat="${mitBild[0]}"] img`).getAttribute('src')) === wahl);

console.log('Bilder-Ordner');
await p.click('.fl-griff'); await p.click('.fl-knoepfe [data-go=mehr]'); await ruhe(p); await p.click('.ezeile[data-go=bilder]'); await ruhe(p);
const nImg = await p.evaluate(() => __mixarium.sammlung.getraenke.filter((r) => r.img).length), nGes = await p.evaluate(() => __mixarium.sammlung.getraenke.length);
pruefe('Einstellungen → Bilder zeigt jedes Bild als Kachel und die Getränke ohne Bild darunter', await p.locator('.bildkachel').count() === nImg && await p.locator('.ezeile[data-a=bild-dazu]').count() === nGes - nImg, nImg + ' / ' + nGes);
pruefe('ohne Auswahl ist „Löschen“ gesperrt', await p.locator('[data-a=bilder-weg]').isDisabled());
const weg = await p.locator('.bildkachel').first().getAttribute('data-uid'); await p.click(`.bildkachel[data-uid="${weg}"]`); await ruhe(p);
pruefe('Tippen wählt ein Bild aus', await p.locator(`.bildkachel[data-uid="${weg}"][aria-pressed=true]`).count() === 1 && !(await p.locator('[data-a=bilder-weg]').isDisabled()));
await p.click('[data-a=bilder-weg]'); await ruhe(p); pruefe('Löschen fragt erst nach', await p.locator('.fenster [data-a=fenster-ja]').count() === 1);
await p.click('.fenster [data-a=fenster-ja]'); await p.waitForTimeout(700);
pruefe('nur das Bild ist weg, das Getränk mit seinem Text bleibt', await p.evaluate((u) => { const r = __mixarium.sammlung.getraenke.find((x) => x.uid === u); return !!r && !r.img && r.name && r.ings.length > 0; }, weg) && await p.locator('.bildkachel').count() === nImg - 1);
pruefe('vorher wurde der Stand automatisch im Tresor abgelegt', await p.evaluate(async () => { const d = await new Promise((g) => { const q = indexedDB.open('KuechenKern-mixarium'); q.onsuccess = () => g(q.result); }); const st = d.objectStoreNames[0]; const alle = await new Promise((g) => { const q = d.transaction(st).objectStore(st).getAllKeys(); q.onsuccess = () => g(q.result); }); return alle.some((k) => String(k).includes('tresor')); }));
await p.click(`.ezeile[data-a=bild-dazu][data-uid="${weg}"]`); await ruhe(p);
pruefe('ein Getränk ohne Bild öffnet das Bild-Blatt (einfügen, KI-Bild, Gratis-Foto)', await p.locator('.fenster [data-a=bild-datei]').count() === 1 && await p.locator('.fenster [data-a=ki-bild]').count() === 1);
await p.keyboard.press('Escape'); await ruhe(p);
pruefe('am Handy läuft der Bilder-Ordner nicht quer', await Zs(p, () => document.documentElement.scrollWidth <= innerWidth));

console.log('Getränk aus Text (ohne KI)');
await p.click('.fl-griff'); await p.click('.fl-knoepfe [data-go=mehr]'); await ruhe(p); await p.click('[data-a=text-import]'); await ruhe(p);
await p.fill('#imptext', 'Old Fashioned\nFür 1 Glas · 5 Minuten\n\nZutaten\n2 oz Bourbon Whiskey\n1 Barlöffel Zuckersirup\n2 Dashes Angostura\n1 Orangenzeste (zum Garnieren)\n\nZubereitung\n1. Sirup und Angostura ins Glas geben.\n2. Whiskey und Eis dazu, 30 Sekunden rühren.\n3. Mit der Orangenzeste garnieren.');
await p.click('[data-a=text-aufteilen]'); await ruhe(p);
const ed = await p.evaluate(() => { const f = document.querySelector('#ed'); return { name: f.name.value, ings: f.ings.value.split('\n'), steps: f.steps.value.split('\n').length, alk: f.alcohol.checked, cat: f.cat.value, titel: document.querySelector('.fenster h2').textContent, hin: document.querySelector('#ed .hinweis')?.textContent || '' }; });
pruefe('Aufteilen füllt das Formular: Name, 4 Zutaten, 3 Schritte', ed.name === 'Old Fashioned' && ed.ings.length === 4 && ed.steps === 3, JSON.stringify(ed));
pruefe('Bar-Einheiten bleiben getrennt lesbar (oz, Barlöffel, Dashes)', ed.ings[0] === '2 oz Bourbon Whiskey' && ed.ings[1] === '1 Barlöffel Zuckersirup' && ed.ings[2] === '2 Dashes Angostura', ed.ings.join(' | '));
pruefe('Whiskey wird erkannt: „enthält Alkohol“ ist angehakt, Kategorie Cocktails', ed.alk && ed.cat === 'ckt');
pruefe('es ist ein NEUES Getränk mit dem Hinweis „bitte prüfen“', /Neues Getränk/.test(ed.titel) && /prüfen/.test(ed.hin), ed.titel + ' / ' + ed.hin);
const vorN = await p.evaluate(() => __mixarium.sammlung.getraenke.length);
await p.click('#ed [type=submit]'); await ruhe(p);
const neu = await p.evaluate(() => __mixarium.sammlung.getraenke.find((r) => r.name === 'Old Fashioned'));
pruefe('erst Speichern legt es an; Einheit oz steht im Feld unit', !!neu && await p.evaluate(() => __mixarium.sammlung.getraenke.length) === vorN + 1 && neu.ings[0].unit === 'oz' && neu.ings[0].amt === '2' && neu.alcohol === true, JSON.stringify(neu && neu.ings[0]));
await p.click('.fl-griff'); await p.click('.fl-knoepfe [data-go=mehr]'); await ruhe(p); await p.click('[data-a=text-import]'); await ruhe(p);
await p.fill('#imptext', 'Zitronenwasser\n1 l Wasser\n2 Zitronen\nZitronen auspressen und mit Wasser mischen.'); await p.click('[data-a=text-aufteilen]'); await ruhe(p);
pruefe('ohne Überschriften sagt das Formular, dass geraten wurde', /geraten/.test(await p.locator('#ed .hinweis').innerText()));
await p.keyboard.press('Escape'); await ruhe(p);
pruefe('Abbrechen legt nichts an', await p.evaluate(() => !__mixarium.sammlung.getraenke.some((r) => r.name === 'Zitronenwasser')));
await c.close();

pruefe('keine Fehler in der Konsole', fehler.length === 0, fehler.join(' | '));
await b.close(); server.close();
console.log(`\n${gruen} grün · ${rot} ROT`);
process.exit(rot ? 1 : 0);
