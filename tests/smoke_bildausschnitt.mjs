// Probe: der Bildausschnitt-Dialog (Mixarium-Bauart: #cropOv als .fov).
//
// Übertragen aus Mein Rezeptbuch (#424/#426), Klaus 2026-10-12. Gemessen am
// Tablet quer (833×470 CSS-Pixel): „Speichern" lag hier schon OHNE Zoom unter
// dem Rand, und hineingezoomt hing `position:fixed; inset:0` am Seitenrahmen.
// ⚠ Gemessen wird gegen den SICHTBAREN Ausschnitt (visualViewport).
// ⚠ Benannte Abweichung: hier gibt es keinen Höhen-Regler, und die Karten
// stehen im Karussell — gemessen wird die Form der SICHTBAREN Karte.
//
//   node tests/smoke_bildausschnitt.mjs

import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { readdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, normalize } from 'node:path';

const WURZEL = join(dirname(fileURLToPath(import.meta.url)), '..');

let chromium;
try { ({ chromium } = await import('playwright-core')); }
catch { console.log('⊘ NICHT LAUFFÄHIG: playwright-core fehlt'); process.exit(0); }

function chromiumPfad() {
  const basis = process.env.PLAYWRIGHT_BROWSERS_PATH || '/opt/pw-browsers';
  if (!existsSync(basis)) return null;
  for (const d of readdirSync(basis).filter(n => n.startsWith('chromium')).sort().reverse())
    for (const rel of ['chrome-linux/chrome', 'chrome-linux/headless_shell']) {
      const p = join(basis, d, rel);
      if (existsSync(p)) return p;
    }
  return null;
}
const exe = chromiumPfad();
if (!exe) { console.log('⊘ NICHT LAUFFÄHIG: kein Chromium gefunden'); process.exit(0); }

let gruen = 0; const rot = [];
const ok = (name, bed, zusatz = '') => {
  if (bed) { gruen++; console.log('  ✓ ' + name); }
  else { rot.push(name); console.log('  ✗ ROT: ' + name + (zusatz ? ' — ' + zusatz : '')); }
};

// Eigener Server auf einem FREIEN Port — eine feste Nummer trifft irgendwann
// einen Server aus einem abgebrochenen Lauf, der ein anderes Verzeichnis
// ausliefert.
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
               '.json': 'application/json; charset=utf-8', '.css': 'text/css; charset=utf-8',
               '.svg': 'image/svg+xml', '.png': 'image/png', '.webmanifest': 'application/manifest+json' };
const server = createServer(async (req, res) => {
  const pfad = normalize(join(WURZEL, decodeURIComponent(req.url.split('?')[0])));
  if (!pfad.startsWith(WURZEL)) { res.writeHead(403).end(); return; }
  try {
    const buf = await readFile(pfad);
    res.writeHead(200, { 'Content-Type': MIME[pfad.slice(pfad.lastIndexOf('.'))] || 'application/octet-stream' }).end(buf);
  } catch { res.writeHead(404).end(); }
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const PORT = server.address().port;

const browser = await chromium.launch({ executablePath: exe });
const BILD = 'data:image/svg+xml;utf8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300"><rect width="400" height="300" fill="#c33"/></svg>');

try {
  for (const [b, hh, zoom, name] of [[833, 470, 1, 'Tablet quer'], [833, 470, 1.135, 'Tablet quer, Zoom 1,135'], [400, 800, 1.4, 'Handy, Zoom 1,4'], [1280, 800, 1, 'Breit']]) {
    const seite = await browser.newPage({ viewport: { width: b, height: hh } });
    const fehler = [];
    seite.on('pageerror', e => fehler.push(String(e).slice(0, 200)));
    await seite.route('**/*', r => r.request().url().startsWith(`http://127.0.0.1:${PORT}/`) ? r.continue() : r.abort());
    await seite.goto(`http://127.0.0.1:${PORT}/index.html`, { waitUntil: 'domcontentloaded' });
    await seite.waitForFunction(() => typeof openCropOv === 'function' && typeof R !== 'undefined', null, { timeout: 30000 });
    if (zoom !== 1) {
      const cdp = await seite.context().newCDPSession(seite);
      await cdp.send('Emulation.setPageScaleFactor', { pageScaleFactor: zoom });
      await seite.evaluate(() => new Promise(z => setTimeout(z, 150)));
    }
    const m = await seite.evaluate(async (bild) => {
      const r = { id: 987003, name: 'Formprobe', cat: 'ckt', img: bild, imgCrop: { x: 50, y: 50, scale: 1 }, ings: [], steps: [], rating: { stars: 0, comment: '', imps: [] } };
      R.unshift(r); CAT = 'all'; showSc('recipes'); render();
      await new Promise(z => setTimeout(z, 200));
      openCropOv(r.id);
      await new Promise(z => setTimeout(z, 200));
      const vv = visualViewport;
      const sicht = el => { const q = el.getBoundingClientRect();
        return q.width > 0 && q.left >= vv.offsetLeft - 1 && q.top >= vv.offsetTop - 1 && q.right <= vv.offsetLeft + vv.width + 1 && q.bottom <= vv.offsetTop + vv.height + 1; };
      const p = document.getElementById('cropPrevWrap').getBoundingClientRect();
      const k = [...document.querySelectorAll('#c' + r.id + ' .rcard-img-wrap')].map(e => e.getBoundingClientRect()).find(q => q.width >= 50 && q.height >= 50);
      const sl = document.getElementById('cropZoomSlider'); sl.value = 220; sl.oninput();
      return { scale: vv.scale, kopf: sicht(document.getElementById('cropHdrSave')), vorschau: p.width / p.height, karte: k ? k.width / k.height : null };
    }, BILD);
    ok(`[${name}] keine Seitenfehler`, fehler.length === 0, fehler[0]);
    if (zoom !== 1) ok(`[${name}] der Zoom greift wirklich (sonst misst der Fall nichts)`, Math.abs(m.scale - zoom) < 0.01, String(m.scale));
    ok(`[${name}] „✓ Speichern“ oben im Kopf ist zu sehen`, m.kopf);
    if (m.karte) ok(`[${name}] die Vorschau hat die Form der Karte (${m.vorschau.toFixed(3)} gegen ${m.karte.toFixed(3)})`, Math.abs(m.vorschau - m.karte) / m.karte < 0.02, JSON.stringify(m));
    // ⚠ Die Start-Animation (#boot-splash, bs-video, ~5,5 s) liegt anfangs ÜBER
    // allem. Gewartet wird auf die Bedingung — der Knopf liegt obenauf —, nicht auf die Uhr.
    await seite.waitForFunction(() => { const q = document.getElementById('cropHdrSave').getBoundingClientRect();
      return document.elementFromPoint(q.left + q.width / 2, q.top + q.height / 2)?.id === 'cropHdrSave'; }, null, { timeout: 20000 });
    await seite.click('#cropHdrSave');
    const st = await seite.evaluate(() => ({ cr: R.find(r => r.id === 987003).imgCrop, zu: document.getElementById('cropOv').style.display === 'none' && !document.getElementById('cropOv').style.width }));
    ok(`[${name}] „Speichern“ im Kopf speichert den gewählten Stand (2,2×)`, st.cr.scale === 2.2, JSON.stringify(st.cr));
    ok(`[${name}] … schließt den Dialog und räumt seine Maße auf`, st.zu);
    await seite.close();
  }
} catch (e) {
  rot.push('ABSTURZ: ' + String(e).slice(0, 300));
  console.log('  ✗ ROT: ABSTURZ — ' + String(e).slice(0, 300));
} finally {
  await browser.close();
  server.close();
}

console.log(`\n${gruen} grün · ${rot.length} ROT`);
if (rot.length) { console.log('Rote Zeilen:'); rot.forEach(r => console.log('  - ' + r)); }
process.exitCode = rot.length ? 1 : 0;
