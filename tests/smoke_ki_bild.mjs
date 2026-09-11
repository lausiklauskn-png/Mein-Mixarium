// Probe: der KI-Bild-Tab im Importieren-Fenster.
//
// Gemessen wird im ECHTEN Browser, nicht im Quelltext — ein Wächter, der eine
// Datei LIEST, misst nicht, ob sie LÄUFT.
//
// Kein einziger Aufruf geht dabei nach draußen: window.fetch wird gestellt, und
// eine eigene Prüfung besteht darauf, dass die Probe keine fremde Adresse ruft.
//
//   npm install --no-save playwright-core     (einmalig je Behälter)
//   node tests/smoke_ki_bild.mjs
//
// Fehlt playwright-core, ist die Probe NICHT LAUFFÄHIG — nicht rot.

import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join, normalize } from 'node:path';

const WURZEL = join(dirname(fileURLToPath(import.meta.url)), '..');

let chromium;
try { ({ chromium } = await import('playwright-core')); }
catch { console.log('⊘ NICHT LAUFFÄHIG: playwright-core fehlt (npm install --no-save playwright-core)'); process.exit(0); }

let gruen = 0; const rot = [];
const ok = (name, bedingung, zusatz = '') => {
  if (bedingung) { gruen++; console.log('  ✓ ' + name); }
  else { rot.push(name + (zusatz ? ' — ' + zusatz : '')); console.log('  ✗ ROT: ' + name + (zusatz ? ' — ' + zusatz : '')); }
};

// EIGENER Server auf einem FREIEN Port, statt `python3 -m http.server 8791`.
// Grund, teuer gelernt: eine feste Portnummer trifft irgendwann einen Server,
// der von einem abgebrochenen Lauf übrig ist — und der liefert ein ANDERES
// Verzeichnis aus. Die Probe misst dann nicht den Baum, in dem sie liegt.
// Genau das ist am 2026-09-11 passiert: die Gegenprobe sabotierte zwölfmal
// eine Kopie und maß zwölfmal das unberührte Original. Zwölf blinde Fälle,
// die wie zwölf blinde Wächter aussahen.
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
               '.mjs': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8',
               '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png',
               '.webmanifest': 'application/manifest+json' };
const server = createServer(async (req, res) => {
  const pfad = normalize(join(WURZEL, decodeURIComponent(req.url.split('?')[0])));
  if (!pfad.startsWith(WURZEL)) { res.writeHead(403).end(); return; }   // nie aus dem Baum heraus
  try {
    const buf = await readFile(pfad);
    const ext = pfad.slice(pfad.lastIndexOf('.'));
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' }).end(buf);
  } catch { res.writeHead(404).end(); }
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const PORT = server.address().port;

// Der Pfad ist VERSIONIERT (chromium-1194/…). Fest verdrahtet ist er beim
// nächsten Behälter falsch — also gesucht statt abgeschrieben.
const { readdirSync, existsSync } = await import('node:fs');
function chromiumPfad() {
  const basis = process.env.PLAYWRIGHT_BROWSERS_PATH || '/opt/pw-browsers';
  if (!existsSync(basis)) return null;
  for (const d of readdirSync(basis).filter(n => n.startsWith('chromium')).sort().reverse()) {
    for (const rel of ['chrome-linux/chrome', 'chrome-linux/headless_shell']) {
      const p = join(basis, d, rel);
      if (existsSync(p)) return p;
    }
  }
  return null;
}
const exe = chromiumPfad();
if (!exe) { console.log('⊘ NICHT LAUFFÄHIG: kein Chromium unter ' + (process.env.PLAYWRIGHT_BROWSERS_PATH || '/opt/pw-browsers')); process.exit(0); }
const browser = await chromium.launch({ executablePath: exe });
const seite = await browser.newPage();

// Jeder Versuch, nach draußen zu greifen, ist ein Befund — nicht ein Netz-Aufruf.
const fremd = [];
await seite.route('**/*', route => {
  const u = route.request().url();
  if (!u.startsWith(`http://127.0.0.1:${PORT}/`) && !u.startsWith('data:') && !u.startsWith('blob:')) {
    fremd.push(u); return route.abort();
  }
  return route.continue();
});

try {
  await seite.goto(`http://127.0.0.1:${PORT}/index.html`, { waitUntil: 'domcontentloaded' });
  await seite.waitForFunction(() => typeof window.initImgGenPane === 'function', null, { timeout: 20000 });

  const sichtbar = (sel) => seite.evaluate(s => {
    const el = document.querySelector(s);
    if (!el) return false;
    if (el.getClientRects().length === 0) return false;
    return el.checkVisibility ? el.checkVisibility() : true;   // content-visibility fängt nur checkVisibility
  }, sel);

  // ── 1. Der Tab steht in der oberen Leiste ──────────────────────────────────
  await seite.evaluate(() => openImport());
  ok('der Tab steht in der Leiste des Importieren-Fensters', await sichtbar('#impTabImgGen'));
  ok('er steht IN der Tab-Leiste, nicht daneben',
    await seite.evaluate(() => !!document.querySelector('.fov-tabs > #impTabImgGen')));

  // ── 2. Ohne Schlüssel: Einrichtung, nicht der Hauptbereich ────────────────
  await seite.evaluate(() => { localStorage.removeItem('mxoaiimg9m'); initImgGenPane(); });
  await seite.click('#impTabImgGen');
  ok('ein Tipp öffnet das Feld', await sichtbar('#imp-imggen'));
  ok('ohne Schlüssel steht die Einrichtung da', await sichtbar('#imggenSetup'));
  ok('ohne Schlüssel ist der Hauptbereich zu', !(await sichtbar('#imggenMain')));
  ok('der Speichern-Knopf ist gesperrt, solange nichts dasteht',
    await seite.evaluate(() => document.getElementById('imggenSaveBtn').disabled));

  // ── 3. Der Schlüssel hat seine EIGENE Schublade ────────────────────────────
  // mxkey9m ist der Anthropic-Schlüssel für KI-Scan und Labor. Würde der
  // OpenAI-Schlüssel dort landen, wären beide Funktionen kaputt.
  await seite.evaluate(() => { localStorage.setItem('mxkey9m', 'sk-ant-UNBERUEHRT'); });
  await seite.fill('#imggenKeyIn', 'sk-proj-0123456789abcdefghij');
  await seite.evaluate(() => saveAndActivateImgGen());
  await seite.waitForTimeout(80);
  ok('der OpenAI-Schlüssel liegt unter mxoaiimg9m',
    (await seite.evaluate(() => localStorage.getItem('mxoaiimg9m'))) === 'sk-proj-0123456789abcdefghij');
  ok('der Anthropic-Schlüssel bleibt unberührt',
    (await seite.evaluate(() => localStorage.getItem('mxkey9m'))) === 'sk-ant-UNBERUEHRT');
  ok('nach dem Speichern steht der Hauptbereich da', await sichtbar('#imggenMain'));
  ok('die Einrichtung tritt zurück', !(await sichtbar('#imggenSetup')));
  ok('der Schlüssel wird maskiert, nicht ausgeschrieben',
    await seite.evaluate(() => {
      const t = document.getElementById('imggenReadySub').textContent;
      return t.includes('…') && !t.includes('0123456789abcdefghij');
    }));

  // ── 4. Der Prompt — Getränk und Knabberei sind NICHT dasselbe ─────────────
  const prompts = await seite.evaluate(() => ({
    drink: _buildDallePrompt({ name: 'Mojito', cat: 'ckt', glass: 'highball',
                               ings: [{ name: 'Limette' }, { name: 'Minze' }], flavors: ['frisch'] }),
    snack: _buildDallePrompt({ name: 'Brezelknoten', cat: 'knab', ings: [{ name: 'Salz' }] }),
  }));
  ok('ein Getränk wird als Getränk beschrieben', /Beverage photography/.test(prompts.drink), prompts.drink.slice(0, 60));
  ok('das Glas steht im Prompt', /highball glass/.test(prompts.drink));
  ok('die Zutaten stehen im Prompt', /Limette, Minze/.test(prompts.drink));
  ok('eine Knabberei wird NICHT als Getränk beschrieben',
    /Food photography/.test(prompts.snack) && !/Beverage/.test(prompts.snack), prompts.snack.slice(0, 60));
  ok('und bekommt kein Glas untergeschoben', !/glass/.test(prompts.snack), prompts.snack.slice(0, 80));

  // ── 5. Ein Lauf legt das Bild wirklich ins Getränk ────────────────────────
  const lauf = await seite.evaluate(async () => {
    const rufe = [];
    const echt = window.fetch;
    // Ein winziges, gültiges PNG — resizeImage muss es wirklich laden können.
    const png = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
    window.fetch = async (url, opt) => {
      rufe.push({ url: String(url), body: JSON.parse(opt.body), auth: opt.headers.Authorization });
      return { ok: true, json: async () => ({ data: [{ b64_json: png }] }) };
    };
    // window.R ist ein LIVE-GETTER (siehe smoke_windowr.mjs) — eine Zuweisung
    // liefe ins Leere. Gefuellt wird deshalb DAS Array, das die App selbst haelt.
    window.R.length = 0;
    window.R.push(
      { id: 101, name: 'Testdrink', cat: 'ckt', img: '', ings: [], steps: [], flavors: [] },
      { id: 102, name: 'Hat schon eins', cat: 'mock', img: 'data:image/png;base64,' + png, ings: [], steps: [], flavors: [] },
    );
    document.getElementById('imggenReplaceAll').checked = false;
    updateImgGenInfo();
    const gesperrt = document.getElementById('igGenBtn').disabled;
    const info = document.getElementById('imggenInfo').textContent;
    await startImgGen();
    const erg = { rufe, gesperrt, info,
      bild101: (window.R.find(r => r.id === 101).img || '').slice(0, 22),
      bild102unveraendert: window.R.find(r => r.id === 102).img === 'data:image/png;base64,' + png,
      hinweisSichtbar: document.getElementById('igBackupHint').style.display === 'block' };
    window.fetch = echt;
    return erg;
  });
  ok('nur das Getränk OHNE Bild wird gefahren', lauf.rufe.length === 1, lauf.rufe.length + ' Aufrufe');
  ok('gerufen wird OpenAI, mit dall-e-3',
    lauf.rufe[0]?.url === 'https://api.openai.com/v1/images/generations' && lauf.rufe[0]?.body.model === 'dall-e-3');
  ok('und OHNE response_format — der Parameter wird nicht mehr angenommen',
    lauf.rufe[0] && !('response_format' in lauf.rufe[0].body), JSON.stringify(lauf.rufe[0]?.body || {}).slice(0, 110));
  ok('der Schlüssel reist im Kopf mit', lauf.rufe[0]?.auth === 'Bearer sk-proj-0123456789abcdefghij');
  ok('das Bild landet im Getränk', lauf.bild101.startsWith('data:image/'), lauf.bild101);
  ok('ein vorhandenes Bild wird ohne Haken NICHT ersetzt', lauf.bild102unveraendert);
  ok('der Knopf war nicht gesperrt, es gab ja etwas zu tun', lauf.gesperrt === false);
  ok('die Kosten stehen vorher da, mit Betrag', /0,04\s*€/.test(lauf.info), lauf.info);
  ok('nach einem bezahlten Lauf wird zum Sichern geraten', lauf.hinweisSichtbar);

  // ── 6. Nichts zu tun heißt: der Knopf ist gesperrt ────────────────────────
  const leer = await seite.evaluate(() => {
    updateImgGenInfo();
    return { gesperrt: document.getElementById('igGenBtn').disabled,
             info: document.getElementById('imggenInfo').textContent };
  });
  ok('sind alle versorgt, ist der Knopf gesperrt', leer.gesperrt === true);
  ok('und die Seite sagt warum', leer.info.trim().length > 0, leer.info);

  // ── 7. Der Notaus hält wirklich an ────────────────────────────────────────
  const gestoppt = await seite.evaluate(async () => {
    const echt = window.fetch;
    const png = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
    let n = 0;
    window.fetch = async () => { n++; stopImgGen(); return { ok: true, json: async () => ({ data: [{ b64_json: png }] }) }; };
    window.R.length = 0;
    [1, 2, 3, 4, 5].forEach(i => window.R.push({ id: 200 + i, name: 'D' + i, cat: 'ckt', img: '', ings: [], steps: [], flavors: [] }));
    updateImgGenInfo();
    await startImgGen();
    window.fetch = echt;
    return n;
  });
  ok('nach dem Notaus läuft kein weiterer bezahlter Aufruf', gestoppt === 1, gestoppt + ' Aufrufe');

  // ── 8. Der Tab spricht alle acht Sprachen ─────────────────────────────────
  const namen = await seite.evaluate(() => {
    const aus = {};
    for (const c of ['de', 'en', 'ru', 'zh', 'es', 'fr', 'it', 'pt']) {
      applyLang(c);
      aus[c] = document.getElementById('impTabImgGen').textContent;
    }
    applyLang('de');
    return aus;
  });
  const werte = Object.values(namen);
  ok('der Tab ist in allen acht Sprachen beschriftet', werte.every(v => v && v.trim().length > 1), JSON.stringify(namen));
  ok('und nicht achtmal derselbe Text', new Set(werte).size > 1, JSON.stringify(namen));

  // ── 10. Ein Fehlschlag NENNT seinen Grund ─────────────────────────────────
  // Klaus am 2026-09-11: „hat nicht funktioniert trotz API key." Der Grund ging
  // in ein console.warn; auf dem Schirm stand nur „1 Fehler". Ein Fehlschlag
  // ohne Grund ist von einem kaputten Knopf nicht zu unterscheiden.
  const FEHLERFAELLE = [
    { name: 'der Browser kam gar nicht hinaus (CORS / kein Netz)', netz: true,
      erwartet: /konnte OpenAI gar nicht erst fragen/, nichtRoh: /Failed to fetch/ },
    { name: 'OpenAI lehnt den Schlüssel ab (401)', status: 401,
      body: { error: { message: 'Incorrect API key provided' } }, erwartet: /Schlüssel abgelehnt/ },
    { name: 'kein Guthaben auf dem Konto', status: 429,
      body: { error: { message: 'You exceeded your current quota, please check your billing' } },
      erwartet: /kein Guthaben/ },
  ];
  for (const f of FEHLERFAELLE) {
    const erg = await seite.evaluate(async (f) => {
      const echt = window.fetch;
      window.fetch = async () => {
        if (f.netz) throw new TypeError('Failed to fetch');
        return { ok: false, status: f.status, json: async () => f.body };
      };
      localStorage.setItem('mxoaiimg9m', 'sk-proj-EGAL0123456789abcdef');
      window.R.length = 0;
      window.R.push({ id: 900, name: 'Fehlerfall', cat: 'ckt', img: '', ings: [], steps: [], flavors: [] });
      updateImgGenInfo();
      await startImgGen();
      const box = document.getElementById('igFehlerBox');
      window.fetch = echt;
      return { sichtbar: box && box.style.display === 'block', text: box ? box.textContent : '' };
    }, { netz: !!f.netz, status: f.status || 0, body: f.body || {} });
    ok('der Grund steht da — ' + f.name,
      erg.sichtbar && f.erwartet.test(erg.text), erg.text.slice(0, 95));
    if (f.nichtRoh) ok('…und nicht als roher Browser-Satz', !f.nichtRoh.test(erg.text), erg.text.slice(0, 95));
  }

  // ── 11. EIN Schlüssel, zwei Felder, eine Schublade ────────────────────────
  const einOrt = await seite.evaluate(async () => {
    const echt = window.fetch;
    window.fetch = async () => ({ ok: true, json: async () => ({ data: [] }) });
    localStorage.removeItem('mxoaiimg9m');
    toggleImgKeyField();                                   // das Feld in den Einstellungen
    document.getElementById('imgKeySettIn').value = 'sk-proj-AUSDENEINSTELLUNGEN99';
    await saveImgKeyFromSettings();
    const inSchublade = localStorage.getItem('mxoaiimg9m');
    openImport(); switchFovTab('importOv', 'imggen', document.getElementById('impTabImgGen'));
    const sub = document.getElementById('imggenReadySub').textContent;
    const setupZu = document.getElementById('imggenSetup').style.display === 'none';
    window.fetch = echt;
    return { inSchublade, sub, setupZu };
  });
  ok('in den Einstellungen eingegeben → DIESELBE Schublade',
    einOrt.inSchublade === 'sk-proj-AUSDENEINSTELLUNGEN99', String(einOrt.inSchublade));
  ok('das Importieren-Fenster fragt danach NICHT noch einmal', einOrt.setupZu);
  ok('…und zeigt denselben Schlüssel maskiert',
    einOrt.sub.includes('…') && !einOrt.sub.includes('AUSDENEINSTELLUNGEN99'), einOrt.sub);

  // ── 12. Der Satz, der die Verwechslung beendet ────────────────────────────
  const satz = await seite.evaluate(() => {
    const el = document.getElementById('imggenWhyOwnKey');
    localStorage.setItem('mxkey9m', 'sk-ant-api03-KLAUS');
    localStorage.removeItem('mxoaiimg9m');
    initImgGenPane();
    const nurClaude = { da: el.style.display === 'block', text: el.textContent };
    localStorage.setItem('mxoaiimg9m', 'sk-proj-XYZ0123456789abcdef');
    initImgGenPane();
    const beide = el.style.display === 'block';
    localStorage.removeItem('mxkey9m'); localStorage.removeItem('mxoaiimg9m');
    initImgGenPane();
    const keiner = el.style.display === 'block';
    return { nurClaude, beide, keiner };
  });
  ok('wer NUR den Claude-Schlüssel hat, erfährt warum der hier nicht zählt',
    satz.nurClaude.da && /Claude erzeugt keine Bilder/.test(satz.nurClaude.text),
    satz.nurClaude.text.slice(0, 75));
  ok('…der Hinweis verschwindet, sobald der Bildschlüssel da ist', satz.beide === false);
  ok('…und steht nicht da, wenn gar nichts hinterlegt ist', satz.keiner === false);

  // ── 13. Geprüft wird OHNE ein Bild zu erzeugen ────────────────────────────
  const pruef = await seite.evaluate(async () => {
    const rufe = [];
    const echt = window.fetch;
    window.fetch = async (u) => { rufe.push(String(u)); return { ok: true, json: async () => ({ data: [] }) }; };
    localStorage.removeItem('mxoaiimg9m');
    openImport(); switchFovTab('importOv', 'imggen', document.getElementById('impTabImgGen'));
    document.getElementById('imggenKeyIn').value = 'sk-proj-PRUEFMICH0123456789';
    await saveAndActivateImgGen();
    const st = document.getElementById('imggenKeyStatus');
    window.fetch = echt;
    return { rufe, status: st ? st.textContent : '' };
  });
  ok('beim Speichern wird der Schlüssel wirklich geprüft',
    pruef.rufe.some(u => u.includes('/v1/models')), pruef.rufe.join(', '));
  ok('…und dabei KEIN Bild erzeugt (das würde Geld kosten)',
    !pruef.rufe.some(u => u.includes('images/generations')), pruef.rufe.join(', '));
  ok('…das Ergebnis steht daneben', /gültig|valid/i.test(pruef.status), pruef.status);

  // ── 14. Der kleine Knopf vorne an der Karte ───────────────────────────────
  // Klaus am 2026-09-11: „wie auch das kleine den kleinen Button vorne in
  // Rezepte für das KI Bild." Im Rezeptbuch ist das der übliche Weg; hier
  // fehlte er.
  const karte = await seite.evaluate(async () => {
    const echt = window.fetch;
    const png = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
    window.fetch = async () => ({ ok: true, json: async () => ({ data: [{ b64_json: png }] }) });
    localStorage.setItem('mxoaiimg9m', 'sk-proj-KARTE0123456789abcdef');
    window.R.length = 0;
    window.R.push({ id: 777, name: 'Karten-Drink', cat: 'ckt', img: '', ings: [], steps: [], flavors: [] });
    if (typeof render === 'function') render();
    const knopf = document.querySelector('.ra-cam');
    // Gemessen wird, ob man ihn SIEHT — nicht, ob er im Markup steht. Ein
    // display:none-Knopf ist für den Nutzer keiner. (Gegenprobe 2026-09-11:
    // die erste Fassung fragte nur nach der Anwesenheit und war blind.)
    const knopfSichtbar = !!knopf && knopf.getClientRects().length > 0 &&
      (knopf.checkVisibility ? knopf.checkVisibility() : true);
    const ausgezeichnet = knopf ? (knopf.getAttribute('title') || '') : '';
    openImgGenForRecipe(777);
    const offen = document.getElementById('imp-imggen').classList.contains('on');
    const einzelDa = document.getElementById('imggenSingleWrap').style.display === 'block';
    const titel = document.getElementById('imggenSingleTitle').textContent;
    // Solange es um EIN Getränk geht, darf der Sammel-Knopf nicht danebenstehen
    const sammelWeg = document.getElementById('igGenBtn').style.display === 'none';
    await startImgGenSingle();
    const bild = (window.R.find(r => r.id === 777).img || '').slice(0, 22);
    // und nach dem Schließen ist der Sammel-Weg wieder da
    closeImport();
    const sammelZurueck = document.getElementById('igGenBtn').style.display !== 'none';
    const einzelWeg = document.getElementById('imggenSingleWrap').style.display === 'none';
    window.fetch = echt;
    return { knopfDa: knopfSichtbar, ausgezeichnet, offen, einzelDa, titel, sammelWeg, bild, sammelZurueck, einzelWeg };
  });
  ok('an der Karte steht der 📸✨-Knopf', karte.knopfDa);
  ok('…mit einer Beschriftung, die sagt was er tut', /Bild/i.test(karte.ausgezeichnet), karte.ausgezeichnet);
  ok('ein Tipp darauf öffnet das KI-Bild-Feld', karte.offen);
  ok('…im Einzel-Modus', karte.einzelDa);
  ok('…und nennt das Getränk beim Namen', /Karten-Drink/.test(karte.titel), karte.titel);
  ok('der Sammel-Knopf tritt dabei zurück', karte.sammelWeg);
  ok('das Bild landet bei GENAU diesem Getränk', karte.bild.startsWith('data:image/'), karte.bild);
  ok('nach dem Schließen ist der Sammel-Weg wieder da', karte.sammelZurueck);
  ok('…und der Einzel-Block weg', karte.einzelWeg);

  // ── 15. Der zweite Modell-Versuch — und seine Grenze ──────────────────────
  const modelle = await seite.evaluate(async () => {
    const png = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
    const echt = window.fetch;
    const lauf = async (antwort) => {
      const gerufen = [];
      window.fetch = async (u, o) => {
        const body = JSON.parse(o.body);
        gerufen.push(body.model);
        return antwort(body.model, png);
      };
      window.R.length = 0;
      window.R.push({ id: 810, name: 'M', cat: 'ckt', img: '', ings: [], steps: [], flavors: [] });
      updateImgGenInfo();
      await startImgGen();
      return { gerufen, bild: !!window.R.find(r => r.id === 810).img };
    };
    // a) dall-e-3 kennt das Konto nicht → der zweite Versuch rettet es
    const a = await lauf((m, png) => m === 'dall-e-3'
      ? { ok: false, status: 400, json: async () => ({ error: { message: "Unknown parameter: 'foo'." } }) }
      : { ok: true, json: async () => ({ data: [{ b64_json: png }] }) });
    // b) der Schlüssel ist abgelehnt → ein zweites Modell ändert daran NICHTS
    const b = await lauf(() => ({ ok: false, status: 401, json: async () => ({ error: { message: 'Incorrect API key provided' } }) }));
    // c) kein Guthaben → ebenfalls kein zweiter Versuch (wäre eine zweite Rechnung)
    const c = await lauf(() => ({ ok: false, status: 429, json: async () => ({ error: { message: 'You exceeded your current quota' } }) }));
    window.fetch = echt;
    return { a, b, c };
  });
  ok('erst wird dall-e-3 gefragt — wie im Rezeptbuch',
    modelle.a.gerufen[0] === 'dall-e-3', modelle.a.gerufen.join(' → '));
  ok('kennt das Konto es nicht, rettet der zweite Versuch den Lauf',
    modelle.a.gerufen[1] === 'gpt-image-1' && modelle.a.bild, modelle.a.gerufen.join(' → '));
  ok('ein abgelehnter Schlüssel löst KEINEN zweiten Versuch aus',
    modelle.b.gerufen.length === 1, modelle.b.gerufen.join(' → '));
  ok('fehlendes Guthaben ebenso wenig (das wäre eine zweite Rechnung)',
    modelle.c.gerufen.length === 1, modelle.c.gerufen.join(' → '));

  // ── 16. Der Befund von Klaus' Gerät, 2026-09-11 ───────────────────────────
  // „Unknown parameter: 'response_format'." — genau daran ist jeder Versuch
  // gescheitert. Der Parameter darf nicht mehr mitgehen.
  const echterFall = await seite.evaluate(async () => {
    const png = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
    const echt = window.fetch;
    const gesendet = [];
    // Ein Server, der sich genau so verhält wie OpenAI heute: response_format
    // wird abgewiesen, ohne ihn kommt ein Bild.
    window.fetch = async (u, o) => {
      const body = JSON.parse(o.body);
      gesendet.push(body);
      if ('response_format' in body) {
        return { ok: false, status: 400, json: async () => ({ error: { message: "Unknown parameter: 'response_format'." } }) };
      }
      return { ok: true, json: async () => ({ data: [{ b64_json: png }] }) };
    };
    localStorage.setItem('mxoaiimg9m', 'sk-proj-ECHT0123456789abcdef');
    window.R.length = 0;
    window.R.push({ id: 850, name: 'Bananen-Basilikum Traum', cat: 'ckt', img: '', ings: [], steps: [], flavors: [] });
    updateImgGenInfo();
    await startImgGen();
    const bild = !!window.R.find(r => r.id === 850).img;
    const box = document.getElementById('igFehlerBox');
    window.fetch = echt;
    return { gesendet, bild, fehlerSichtbar: box && box.style.display === 'block' };
  });
  ok('response_format geht NICHT mehr mit hinaus',
    echterFall.gesendet.every(b => !('response_format' in b)),
    JSON.stringify(echterFall.gesendet[0] || {}).slice(0, 110));
  ok('…und damit klappt der Lauf, der bei Klaus scheiterte', echterFall.bild);
  ok('…ohne Fehlerkasten', echterFall.fehlerSichtbar === false);

  // ── 17. Kommt nur eine Adresse zurück, wird das Bild geholt ───────────────
  // Ohne response_format ist das Antwortformat nicht mehr festgelegt.
  const perAdresse = await seite.evaluate(async () => {
    const echt = window.fetch;
    const geholt = [];
    window.fetch = async (u, o) => {
      if (o && o.method === 'POST') return { ok: true, json: async () => ({ data: [{ url: 'https://example.invalid/bild.png' }] }) };
      geholt.push(String(u));
      return { ok: true, blob: async () => new Blob([new Uint8Array([1, 2, 3])], { type: 'image/png' }) };
    };
    window.R.length = 0;
    window.R.push({ id: 860, name: 'Adress-Drink', cat: 'ckt', img: '', ings: [], steps: [], flavors: [] });
    updateImgGenInfo();
    await startImgGen();
    const img = window.R.find(r => r.id === 860).img || '';
    window.fetch = echt;
    return { geholt, alsDatenUrl: img.startsWith('data:'), fremdeAdresse: img.startsWith('http') };
  });
  ok('eine zurückgegebene Adresse wird wirklich abgerufen',
    perAdresse.geholt.some(u => u.includes('bild.png')), perAdresse.geholt.join(', '));
  ok('…und das Bild landet als data:-URL im Getränk', perAdresse.alsDatenUrl);
  ok('…nie als fremde Adresse (die verfällt und ist offline tot)', !perAdresse.fremdeAdresse);

  // ── 9. Es ging nichts nach draußen ────────────────────────────────────────
  // Die Zusicherung ist NICHT „die App greift nie ins Netz" — sie holt beim
  // Start die SBKIM-Briefkästen, das ist netzweit vereinbart (INTERFACES §11.6).
  // Die Zusicherung ist: DIESE Probe hat keinen bezahlten Bild-Aufruf ausgelöst.
  // Eine pauschale Lockerung wäre ein Scheunentor, deshalb steht daneben eine
  // NAMENTLICHE Liste dessen, was hinaus darf — alles andere ist ein Befund.
  const ERLAUBT = [
    /^https:\/\/raw\.githubusercontent\.com\/lausiklauskn-png\//,
    /^https:\/\/api\.openai\.com\/v1\/models$/,   // Schlüssel-Prüfung — erzeugt kein Bild, kostet nichts
  ];
  ok('kein BEZAHLTER Aufruf ging hinaus (images/generations)',
    !fremd.some(u => u.includes('images/generations')), fremd.filter(u => u.includes('generations')).join(', '));
  ok('und was sonst hinaus wollte, steht auf der benannten Liste',
    fremd.every(u => ERLAUBT.some(re => re.test(u))),
    fremd.filter(u => !ERLAUBT.some(re => re.test(u))).join(', '));
} finally {
  await browser.close();
  server.close();
}

console.log(`\n${gruen} grün · ${rot.length} ROT`);
if (rot.length) { rot.forEach(r => console.log('  ✗ ' + r)); process.exit(1); }
