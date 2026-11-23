// Probe: Mix-Labor der neuen PWA (ab 10.0.0-vor15). Echter Browser; die Anthropic-Schnittstelle ist nachgestellt, sonst kein Netz.
//   node tests/smoke_neu_labor.mjs   Schlusszeile: „N grün · M ROT“, Rückgabewert 1 bei ROT
import { createServer } from 'node:http';
import { mitThemen, themenAuf } from './neu-hilfe.mjs';
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
const seite = async (w, h) => { const c = await b.newContext({ viewport: { width: w, height: h }, locale: 'de-DE' }); const p = mitThemen(await c.newPage()); p.on('pageerror', (e) => fehler.push(e.message)); p.on('console', (m) => { if (m.type() === 'error') fehler.push(m.text()); }); return p; };
const ruhe = (p) => p.waitForTimeout(350);
const Zs = (p, f) => p.evaluate(f);



const rezept = (titel, extra = {}) => JSON.stringify({ titel, beschreibung: 'Frisch und grün.', portionen: 1, zubereitungszeit_min: 5, schwierigkeit: 2, glastyp: 'highball', alkohol: false, zutaten: [{ menge: '4 cl', name: 'Gurkensaft' }, { menge: '2 cl', name: 'Limettensaft' }, { menge: 'etwas', name: 'Minze' }], schritte: ['Alles mit Eis shaken.', 'Ins Glas abseihen.'], tags: ['frisch'], ...extra });
const antworten = [], anfragen = [];
const KI = (p) => p.route('https://api.anthropic.com/**', async (r) => { const q = r.request(); anfragen.push({ kopf: q.headers(), body: JSON.parse(q.postData()) }); const a = antworten.shift() || { stop_reason: 'end_turn', text: rezept('Ersatz') }; if (a.warte) await new Promise((f) => setTimeout(f, a.warte));
  await r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ id: 'msg_probe', type: 'message', role: 'assistant', model: 'claude-haiku-5-5', stop_reason: a.stop_reason, content: [{ type: 'thinking', thinking: '', signature: 'probe' }, ...(a.text ? [{ type: 'text', text: a.text }] : [])] }) }); });
const zuLabor = async (p) => { await p.click('.fl-griff'); await p.click('.fl-knoepfe [data-go=labor]'); await ruhe(p); };
const bewerte = async (p, uid, wert, fb = '') => { await p.click(`[data-a=lab-bewerten][data-u="${uid}"]`); await ruhe(p); for (const d of ['taste', 'practicality', 'originality', 'description']) await p.locator(`#labrate [name=${d}]`).evaluate((e, v) => { e.value = String(v); e.dispatchEvent(new Event('input', { bubbles: true })); }, wert); if (fb) await p.fill('#labrate [name=fb]', fb); await p.click('#labrate [type=submit]'); await p.waitForTimeout(400); };
const status = (p, uid) => p.evaluate((u) => __mixarium.sammlung.getraenke.find((r) => r.uid === u)?.labStatus, uid);

console.log('Handy 390 px · Erfinden');
let p = await seite(390, 800);
await p.route(/^https?:\/\/(?!localhost|api\.anthropic\.com)/, (r) => { fehler.push('Netz nach draußen: ' + r.request().url()); r.abort(); });
await KI(p);
await p.goto(U + 'neu/?leer'); await p.waitForSelector('.mx'); await ruhe(p);
await zuLabor(p);
pruefe('Kacheln (Klaus 23.11.): jede Reihe ist gefüllt, keine Lücke rechts', await p.evaluate(() => [...document.querySelectorAll('.kachelraster')].every((r) => { const rr = r.getBoundingClientRect(), reihen = new Map(); for (const k of r.children) { const b = k.getBoundingClientRect(); const y = Math.round(b.top); reihen.set(y, Math.max(reihen.get(y) || 0, b.right)); } return [...reihen.values()].every((re) => rr.right - re < 2); })));
pruefe('Kacheln: jede Kategorie trägt ihre eigene Farbe', await p.evaluate(() => new Set([...document.querySelectorAll('[data-a=lab-kat]')].map((k) => getComputedStyle(k).backgroundImage)).size >= 8 && [...document.querySelectorAll('[data-a=lab-kat]')].every((k) => k.querySelector('.kfeld .ico'))));
pruefe('Kacheln rücken auf: höchstens so viele Reihen, wie die Breiten mindestens brauchen (keine Kachel allein, wo eine andere daneben passt)', await p.evaluate(() => { const r = document.querySelector('.kachelraster:not(.drei)'), ys = new Set([...r.children].map((k) => Math.round(k.getBoundingClientRect().top))); r.classList.add('messen'); const w = [...r.children].map((k) => k.getBoundingClientRect().width), B = r.clientWidth; r.classList.remove('messen'); const summe = w.reduce((a, x) => a + x + 7, 0); return ys.size <= Math.ceil(summe / B) + 1; }), await p.evaluate(() => [...document.querySelectorAll('.kachelraster:not(.drei) .kachel')].map((k) => Math.round(k.getBoundingClientRect().top) + ':' + k.textContent.trim()).join(' | ')));
pruefe('jeder Geschmack trägt eine eigene Farbe', await p.evaluate(() => new Set([...document.querySelectorAll('[data-a=lab-geschmack] .kfeld')].map((k) => getComputedStyle(k).backgroundColor)).size === 6));
pruefe('im Labor steht EIN „?“ (an der Überschrift), sonst reichen Hinweise; kein Erklär-Absatz', await p.locator('.haupt .frag').count() === 1 && await p.locator('.laborform .frag').count() === 0 && (await p.locator('.laborform h3').first().getAttribute('title') || '').includes('Anthropic') && !(await p.locator('.laborform').first().innerText()).includes('Braucht Internet'), String(await p.locator('.haupt .frag').count()));
pruefe('Geschmack am Handy: zwei volle Reihen zu je drei', await p.evaluate(() => { const ys = [...document.querySelectorAll('[data-a=lab-geschmack]')].map((k) => Math.round(k.getBoundingClientRect().top)); return new Set(ys).size === 2 && ys.filter((y) => y === ys[0]).length === 3; }));
pruefe('das Labor zeigt das Formular: Kategorien, sechs Geschmäcker, Zutatenfeld, Erfinden', await p.locator('[data-a=lab-kat]').count() >= 9 && await p.locator('[data-a=lab-geschmack]').count() === 6 && await p.locator('#labzutaten').count() === 1 && await p.locator('[data-a=lab-erfinden]').count() === 1);
await p.click('[data-a=lab-kat][data-k=mock]'); await p.click('[data-a=lab-geschmack][data-g=frisch]'); await p.click('[data-a=lab-geschmack][data-g=herb]'); await p.fill('#labzutaten', 'Gurke');
await p.click('[data-a=lab-erfinden]'); await ruhe(p);
pruefe('ohne Schlüssel fragt das Labor nach dem Anthropic-Schlüssel und schickt nichts', await p.locator('#akform').count() === 1 && anfragen.length === 0);
pruefe('Schlüssel-Fenster (Klaus 23.11.): die Erklärung steht hinter einem „?“, kein Absatz darüber', await p.locator('.fenster .fkopf .frag').count() === 1 && await p.locator('.fenster .ftext').count() === 0 && await p.locator('.fenster #schl-holen').getAttribute('href') === 'https://platform.claude.com/settings/keys' && await p.locator('.fenster .reihe').count() === 1 && !(await p.locator('.fenster, [role=dialog]').first().innerText().catch(() => '')).includes('Er bleibt nur auf diesem Gerät'));
antworten.push({ stop_reason: 'end_turn', text: 'Gern! ' + rezept('Gurken-Smash') + ' Prost.', warte: 1500 });
await p.fill('#akform [name=k]', 'sk-ant-probe-123'); await p.click('#akform [type=submit]'); await p.waitForTimeout(700);
pruefe('Ladebalken (Klaus 23.11.): während die KI erfindet, stehen Balken und Zeile da', await p.locator('#warten-zeile.an').isVisible().catch(() => false) && /erfunden/.test(await p.locator('#warten-zeile').innerText().catch(() => '')) && await p.locator('#warten-balken.an').count() === 1); await p.waitForSelector('.laborform.entwurf', { timeout: 8000 }).catch(() => {});
pruefe('Ladebalken: ist die Antwort da, ist er wieder weg', await p.locator('#warten-zeile.an, #warten-balken.an').count() === 0);
pruefe('nach dem Speichern des Schlüssels erfindet das Labor sofort: die Vorschau steht da', (await p.locator('.laborform.entwurf h3').innerText().catch(() => '')).includes('Gurken-Smash'));
const a0 = anfragen[0] || { kopf: {}, body: { messages: [{ content: '' }] } }, auftrag = a0.body.messages[0].content;
pruefe('der Aufruf geht wie in der alten App direkt an Anthropic (Schlüssel, Version, Browser-Freigabe)', a0.kopf['x-api-key'] === 'sk-ant-probe-123' && a0.kopf['anthropic-version'] === '2023-06-01' && a0.kopf['anthropic-dangerous-direct-browser-access'] === 'true');
pruefe('Modell Haiku 5.5 (Klaus 23.11.), Platz fürs Denken, keine temperature/top_p, kein Vorfüllen; Auftrag mit Kategorie, Geschmack, Zutat, alkoholfrei, Deutsch', a0.body.model === 'claude-haiku-5-5' && a0.body.max_tokens >= 8000 && !('temperature' in a0.body) && !('top_p' in a0.body) && a0.body.messages.at(-1).role === 'user' && /Mocktails-Rezept/.test(auftrag) && /frisch, herb/.test(auftrag) && /Gurke/.test(auftrag) && /alkoholfrei/.test(auftrag) && /Deutsch/.test(auftrag), auftrag.slice(0, 200));
pruefe('der Schlüssel steht weder in der Sammlung noch in der Sicherung', await p.evaluate(() => !JSON.stringify(__mixarium.sammlung).includes('sk-ant-probe') && !__mixarium.sicherung().includes('sk-ant-probe')));
pruefe('die Vorschau ist noch KEIN Getränk', await p.evaluate(() => !__mixarium.sammlung.getraenke.some((r) => r.name === 'Gurken-Smash')));
await p.click('[data-a=lab-sichern]'); await ruhe(p);
const g1 = await p.evaluate(() => __mixarium.sammlung.getraenke.find((r) => r.name === 'Gurken-Smash'));
pruefe('„Ins Labor übernehmen“: experimentell, im Pool, Menge und Einheit getrennt', !!g1 && g1.labStatus === 'experimentell' && g1.labGen === true && g1.ings[0].amt === '4' && g1.ings[0].unit === 'cl' && await p.locator('.laborkarte').count() === 1, JSON.stringify(g1 && g1.ings[0]));
await p.click('.fl-griff'); await p.click('.fl-knoepfe [data-go=start]'); await ruhe(p);
pruefe('im Buch trägt es die Marke „Labor“', (await p.locator('.karte', { hasText: 'Gurken-Smash' }).innerText()).includes('Labor'));

console.log('Bewerten: drei gute → angenommen');
await zuLabor(p);
await bewerte(p, g1.uid, 5); pruefe('erste Bewertung: in Bewertung', await status(p, g1.uid) === 'inReview');
await bewerte(p, g1.uid, 5); await bewerte(p, g1.uid, 4);
pruefe('nach drei guten Bewertungen: angenommen, raus aus dem Pool, ins Buch', await status(p, g1.uid) === 'accepted' && await p.locator(`.laborkarte[data-lab="${g1.uid}"]`).count() === 0);
pruefe('die Punkte sind gewichtet wie bisher (40/25/20/15)', await p.evaluate((u) => { const r = __mixarium.sammlung.getraenke.find((x) => x.uid === u); return Math.abs(r.labScore - (5 + 5 + 4) / 3) < 1e-9; }, g1.uid));

console.log('Drei schlechte → Warnung → zwei weitere → KI-Überarbeitung');
antworten.push({ stop_reason: 'end_turn', text: rezept('Zweiter Versuch', { alkohol: false }) });
await p.click('[data-a=lab-kat][data-k=limo]'); await p.click('[data-a=lab-erfinden]'); await p.waitForSelector('.laborform.entwurf'); await p.click('[data-a=lab-sichern]'); await ruhe(p);
const g2 = await p.evaluate(() => __mixarium.sammlung.getraenke.find((r) => r.name === 'Zweiter Versuch').uid);
for (const fb of ['zu sauer', '', '']) await bewerte(p, g2, 1, fb);
pruefe('nach drei schlechten: unter Beobachtung', await status(p, g2) === 'warning');
antworten.push({ stop_reason: 'end_turn', text: rezept('Zweiter Versuch, milder', { zutaten: [{ menge: '6 cl', name: 'Apfelsaft' }, { menge: '1 TL', name: 'Honig' }] }) });
await bewerte(p, g2, 1); await bewerte(p, g2, 1, 'weniger Säure'); await p.waitForSelector(`.laborkarte[data-lab="${g2}"] .entwurfbox`, { timeout: 8000 }).catch(() => {});
const a2 = anfragen.at(-1).body.messages[0].content;
pruefe('zwei weitere schlechte lösen die KI-Überarbeitung aus; der Auftrag trägt Rezept, Punkte und Rückmeldung', /Verbessere dieses Limonaden-Rezept/.test(a2) && /"Zweiter Versuch"/.test(a2) && /weniger Säure/.test(a2) && /4 cl Gurkensaft/.test(a2), a2.slice(0, 260));
pruefe('der Entwurf steht zum Annehmen oder Ablehnen da', (await p.locator(`.laborkarte[data-lab="${g2}"] .entwurfbox`).innerText().catch(() => '')).includes('milder'));
await p.click(`[data-a=lab-rev-ja][data-u="${g2}"]`); await ruhe(p);
pruefe('Annehmen: die überarbeitete Fassung gilt (Name, Zutaten, Fassung 2)', await p.evaluate((u) => { const r = __mixarium.sammlung.getraenke.find((x) => x.uid === u); return r.labStatus === 'revised' && r.name === 'Zweiter Versuch, milder' && r.ings[0].name === 'Apfelsaft' && r.ings[0].unit === 'cl' && r.labRevision === 1; }, g2));

console.log('Favorit-Schutz, Verwerfen, Wiederherstellen');
await p.click(`[data-a=lab-favorit][data-u="${g2}"]`); await ruhe(p);
await p.click(`[data-a=lab-entfernen][data-u="${g2}"]`); await ruhe(p);
pruefe('geschützt: Verwerfen geht nicht', await status(p, g2) === 'revised' && await p.locator('.fenster').count() === 0);
for (let i = 0; i < 3; i++) await bewerte(p, g2, 1);
pruefe('geschützt: auch drei schlechte Bewertungen nach der Überarbeitung werfen es nicht raus', await status(p, g2) === 'revised');
await p.click(`[data-a=lab-favorit][data-u="${g2}"]`); await ruhe(p); await p.click(`[data-a=lab-entfernen][data-u="${g2}"]`); await ruhe(p); await p.click('.fenster [data-a=fenster-ja]'); await ruhe(p);
pruefe('ohne Schutz: Verwerfen mit Rückfrage', await status(p, g2) === 'removed' && await p.locator(`.laborkarte[data-lab="${g2}"]`).count() === 0);
await p.click('[data-a=lab-entfernte]'); await ruhe(p); await p.click(`[data-a=lab-zurueck][data-u="${g2}"]`); await ruhe(p);
pruefe('Entfernte Getränke: wiederherstellen bringt es zurück ins Labor', await status(p, g2) === 'inReview' && await p.locator(`.laborkarte[data-lab="${g2}"]`).count() === 1);
pruefe('jede Änderung steht im Protokoll', await p.evaluate((u) => { const l = __mixarium.sammlung.getraenke.find((x) => x.uid === u).labLog.map((x) => x.detail).join(' | '); return /erste Bewertung/.test(l) && /warning/.test(l) && /Überarbeitung angenommen/.test(l) && /Favorit-Schutz aktiviert/.test(l) && /manuell entfernt/.test(l) && /wiederhergestellt/.test(l); }, g2));

console.log('Einzelpersonen-Modus, Überarbeiten auf Knopfdruck, Ablehnung');
await p.click('[data-a=lab-solo]'); await ruhe(p);
pruefe('die Statusplakette ist einzeilig („Bewertung“)', await p.evaluate(() => [...document.querySelectorAll('.laborkarte .status')].every((s) => s.getBoundingClientRect().height < 24)));
pruefe('Einzelpersonen-Modus: die Karte zählt „von 1“', await p.evaluate(() => __mixarium.sammlung.einstellungen.labSolo === true) && /von 1 Bewertungen/.test(await p.locator(`.laborkarte[data-lab="${g2}"]`).innerText()));
await bewerte(p, g2, 5); const dbg = await p.evaluate((u) => { const r = __mixarium.sammlung.getraenke.find((x) => x.uid === u); return r.labStatus + ' ' + r.labScore.toFixed(2) + ' n=' + r.labRatings.length; }, g2); pruefe('ein wiederhergestelltes Getränk behält seine Bewertungen (wie bisher): eine gute hebt den alten Schnitt nicht über 3,5, es kommt unter Beobachtung', /^warning/.test(dbg), dbg);
antworten.push({ stop_reason: 'end_turn', text: rezept('Solo-Test') });
await p.click('[data-a=lab-erfinden]'); await p.waitForSelector('.laborform.entwurf'); await p.click('[data-a=lab-sichern]'); await ruhe(p);
const gs = await p.evaluate(() => __mixarium.sammlung.getraenke.find((r) => r.name === 'Solo-Test').uid);
await bewerte(p, gs, 5); pruefe('Einzelpersonen-Modus: ein frisches Getränk wird nach EINER guten Bewertung angenommen', await status(p, gs) === 'accepted');
antworten.push({ stop_reason: 'end_turn', text: rezept('Dritter') });
await p.click('[data-a=lab-erfinden]'); await p.waitForSelector('.laborform.entwurf'); await p.click('[data-a=lab-sichern]'); await ruhe(p);
const g3 = await p.evaluate(() => __mixarium.sammlung.getraenke.find((r) => r.name === 'Dritter').uid);
antworten.push({ stop_reason: 'refusal', text: '' });
await p.click(`[data-a=lab-ueberarbeiten][data-u="${g3}"]`); await p.waitForTimeout(700);
pruefe('„Überarbeiten“ auf Knopfdruck; lehnt die KI ab, bleibt das Original und es steht im Protokoll', await p.evaluate((u) => { const r = __mixarium.sammlung.getraenke.find((x) => x.uid === u); return r.name === 'Dritter' && !r.labRevisionPending && !r.labRevisionDraft && r.labLog.some((l) => /abgelehnt/.test(l.detail)); }, g3));
antworten.push({ stop_reason: 'end_turn', text: 'Das kann ich nicht.' });
await p.click('[data-a=lab-erfinden]'); await p.waitForTimeout(700);
pruefe('eine Antwort ohne Rezept wird gemeldet, nichts entsteht', /kein Rezept/.test(await p.locator('.laborform [role=alert]').innerText().catch(() => '')) && await p.locator('.laborform.entwurf').count() === 0);
await p.click('.fl-griff'); await p.click('.fl-knoepfe [data-go=mehr]'); await ruhe(p); await p.click('[data-a=alk]'); await ruhe(p); await zuLabor(p);
pruefe('mit „Ohne Alkohol“ bietet das Labor keine Cocktails an', await p.locator('[data-a=lab-kat][data-k=ckt]').count() === 0);
pruefe('am Handy kein Querlaufen', await Zs(p, () => document.documentElement.scrollWidth <= innerWidth));
await p.reload(); await p.waitForSelector('.mx'); await ruhe(p); await zuLabor(p);
pruefe('nach dem Neuladen: Pool, Status und Einzelpersonen-Modus sind gespeichert', await p.locator(`.laborkarte[data-lab="${g3}"]`).count() === 1 && await status(p, gs) === 'accepted' && await status(p, g2) === 'warning' && await p.evaluate(() => __mixarium.sammlung.einstellungen.labSolo === true));
await p.context().close();

console.log('Monitor 1280 px');
p = await seite(1280, 860); await p.route(/^https?:\/\/(?!localhost)/, (r) => { fehler.push('Netz nach draußen: ' + r.request().url()); r.abort(); });
await p.goto(U + 'neu/?leer'); await p.waitForSelector('.mx'); await ruhe(p); await p.click('.nav [data-go=labor]'); await ruhe(p);
{ const w = p.locator('.nav [data-a=navzu]'); const lbl = await w.getAttribute('aria-label'); await w.hover(); await p.waitForTimeout(650);
  pruefe('Hinweis-Blase (Kern 0.16, wie in der alten App): ein Symbol-Knopf zeigt seine Beschriftung', await p.evaluate(() => { const b = document.getElementById('hinweis-blase'); return b && b.style.opacity === '1' ? b.textContent : ''; }) === lbl, lbl);
  await p.mouse.move(640, 840); await p.click('.nav [data-go=mehr]'); await ruhe(p); await p.click('[data-a=hinweise]'); await ruhe(p); await p.click('.nav [data-go=labor]'); await ruhe(p);
  await p.locator('.nav [data-a=navzu]').hover(); await p.waitForTimeout(650);
  pruefe('Hinweis-Blasen ausgeschaltet: keine Blase', await p.evaluate(() => { const b = document.getElementById('hinweis-blase'); return !b || b.style.display === 'none' || b.style.opacity !== '1'; }) && await p.evaluate(() => __mixarium.einstellungen.hinweiseAus === true)); await p.mouse.move(640, 840); }
pruefe('am Monitor: Formular links, Pool rechts', await Zs(p, () => { const f = document.querySelector('.labor-breit > div:first-child').getBoundingClientRect(), q = document.querySelector('.labor-breit > div:last-child').getBoundingClientRect(); return q.left > f.right - 1 && Math.abs(q.top - f.top) < 4; }));
await p.context().close();

pruefe('keine Fehler in der Konsole', fehler.length === 0, fehler.join(' | '));
await b.close(); server.close();
console.log(`\n${gruen} grün · ${rot} ROT`);
process.exit(rot ? 1 : 0);
