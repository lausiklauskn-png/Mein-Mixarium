'use strict';
const KEY = 'mxinsttest9m';
const SITZUNG = Math.random().toString(36).slice(2, 7);
const T0 = performance.now();
const CFG = Object.assign({ app: 'Test-App', swSelbst: true, pruefen: [['./manifest.json','Test-App'],['../manifest.json','Mixarium']], verwandt: true }, window.INSTTEST || {});
let bip = null;

function lade(){ try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch(_) { return []; } }
function speichere(a){ try { localStorage.setItem(KEY, JSON.stringify(a.slice(-300))); } catch(_) {} }
function log(e, d){
  const a = lade();
  a.push({ a: CFG.app, t: new Date().toISOString().slice(5, 19), ms: Math.round(performance.now() - T0), s: SITZUNG, e, d: d === undefined ? null : d });
  speichere(a); zeige();
}
function zeige(){
  document.getElementById('proto').textContent =
    lade().map(x => `${x.t} +${x.ms}ms [${x.a || 'Test-App'}·${x.s}] ${x.e}${x.d === null ? '' : ' ' + JSON.stringify(x.d)}`).join('\n');
}
function befund(text, ok){
  const li = document.createElement('li');
  li.innerHTML = (ok === true ? '<span class="gut">✓</span> ' : ok === false ? '<span class="schlecht">✗</span> ' : '• ') + text;
  document.getElementById('befund').appendChild(li);
}
function modus(){
  const m = ['standalone','minimal-ui','fullscreen','window-controls-overlay','browser'].find(x => matchMedia(`(display-mode: ${x})`).matches) || '?';
  return navigator.standalone ? 'ios-standalone' : m;
}

// ── Ereignisse, die Chrome rund ums Installieren erzeugt ──
addEventListener('beforeinstallprompt', e => {
  // NUR BEOBACHTEN: kein preventDefault, kein eigener Knopf. Ob die SEITE das
  // Ereignis abfängt (Mixarium tut es), wird gemessen statt verändert.
  bip = e;
  log('beforeinstallprompt', { platforms: e.platforms || null });
  befund('Chrome meldet: <b>installierbar</b> (beforeinstallprompt)', true);
  setTimeout(() => log('beforeinstallprompt-von-seite-abgefangen', e.defaultPrevented), 0);
});
addEventListener('appinstalled', () => { log('appinstalled'); befund('Chrome meldet: <b>installiert</b> (appinstalled)', true); });
// ── Was rund um das Chrome-Menü passiert (das Menü selbst sieht die Seite nicht) ──
addEventListener('focus', () => log('fokus', 'zurück'));
addEventListener('blur', () => log('fokus', 'weg (z. B. Menü oder Dialog offen)'));
addEventListener('resize', () => log('fenstergroesse', innerWidth + 'x' + innerHeight));
let tipps = 0;
addEventListener('pointerdown', e => {
  if (++tipps > 40) return;
  const z = e.target.closest('button,a') || e.target;
  log('tipp', { x: Math.round(e.clientX), y: Math.round(e.clientY), auf: (z.id || z.tagName.toLowerCase()) + (z.textContent ? ' „' + z.textContent.trim().slice(0, 30) + '“' : '') });
}, { passive: true, capture: true });
for (const m of ['standalone', 'minimal-ui', 'fullscreen', 'browser'])
  matchMedia(`(display-mode: ${m})`).addEventListener('change', e => { if (e.matches) log('anzeige-jetzt', m); });
document.addEventListener('visibilitychange', () => log('sichtbarkeit', document.visibilityState));
addEventListener('pageshow', e => { if (e.persisted) log('pageshow-aus-cache'); });
addEventListener('error', e => log('fehler', String(e.message || e.error)));
addEventListener('unhandledrejection', e => log('fehler-promise', String(e.reason)));


// ── Umgebung ──
async function umgebung(){
  const d = {
    url: location.href, modus: modus(), referrer: document.referrer || null,
    ua: navigator.userAgent, sicher: isSecureContext, iframe: self !== top,
    sprache: navigator.language, schirm: `${screen.width}x${screen.height}@${devicePixelRatio}`
  };
  try {
    if (navigator.userAgentData) {
      const h = await navigator.userAgentData.getHighEntropyValues(['platformVersion','model','fullVersionList']);
      d.plattform = navigator.userAgentData.platform + ' ' + h.platformVersion;
      d.modell = h.model || null;
      d.browser = (h.fullVersionList || []).map(b => b.brand + ' ' + b.version).filter(x => !/Not/.test(x)).join(', ');
    }
  } catch(_) {}
  log('start', d);
  const m = document.getElementById('modus');
  if (d.modus === 'standalone') {
    m.innerHTML = '<span class="gut">✓ Läuft als installierte App.</span> Das Öffnen hat also geklappt.';
    log('ALS-APP-GEOEFFNET', { quelle: new URLSearchParams(location.search).get('quelle') });
  } else {
    m.innerHTML = 'Läuft im Browser-Tab' + (d.referrer ? ` (gekommen von <code>${d.referrer.replace(/</g,'&lt;')}</code>)` : '') + '.';
  }
  if (d.referrer && d.referrer.startsWith('android-app://')) befund('Geöffnet aus einer anderen App heraus (' + d.referrer + ') — dort fehlt oft „Installieren“.', false);
}

// ── Service Worker ──
async function serviceWorker(){
  if (!('serviceWorker' in navigator)) { log('sw', 'nicht unterstützt'); befund('Kein Service Worker möglich', false); return; }
  try {
    let reg;
    if (CFG.swSelbst) reg = await navigator.serviceWorker.register('./sw.js');
    else {
      reg = await Promise.race([navigator.serviceWorker.ready, new Promise((_, nein) => setTimeout(() => nein(new Error('nach 20 s kein aktiver Service Worker')), 20000))]);
    }
    await navigator.serviceWorker.ready;
    try { log('vorrat', await caches.keys()); } catch(_) {}
    log('sw', { scope: reg.scope, aktiv: !!reg.active, steuert: !!navigator.serviceWorker.controller });
    befund('Service Worker aktiv (' + new URL(reg.scope).pathname + ')', true);
  } catch (err) { log('sw-fehler', String(err)); befund('Service Worker scheitert: ' + err, false); }
  try {
    const alle = await navigator.serviceWorker.getRegistrations();
    const scopes = alle.map(r => new URL(r.scope).pathname);
    log('sw-alle-auf-dieser-adresse', scopes);
    if (scopes.includes('/')) befund('Ein Service Worker für die <b>ganze</b> Adresse ist registriert — er kann alle Apps stören', false);
  } catch(_) {}
}

// ── Manifest + Symbole + Startadresse prüfen (für diese Mini-App UND für Mixarium) ──
async function manifestPruefen(pfad, name){
  const r = { name };
  try {
    const res = await fetch(pfad, { cache: 'no-store' });
    r.status = res.status; r.typ = res.headers.get('content-type'); r.umgeleitet = res.redirected;
    const basis = res.url;
    const m = JSON.parse(await res.text());
    const start = new URL(m.start_url || '.', basis).href;
    const scope = new URL(m.scope || './', new URL(m.start_url || '.', basis)).href;
    r.id = m.id ? new URL(m.id, start).href : start;
    r.start = start; r.scope = scope; r.display = m.display; r.startImScope = start.startsWith(scope);
    r.symbole = [];
    for (const ic of (m.icons || [])) {
      const u = new URL(ic.src, basis).href, s = { src: ic.src, soll: ic.sizes, zweck: ic.purpose || 'any' };
      try {
        const ir = await fetch(u, { cache: 'no-store' });
        s.status = ir.status; s.typ = ir.headers.get('content-type');
        const blob = await ir.blob(); s.bytes = blob.size;
        if (!/svg/.test(s.typ || '')) { const b = await createImageBitmap(blob); s.ist = b.width + 'x' + b.height; b.close(); }
      } catch (err) { s.fehler = String(err); }
      r.symbole.push(s);
    }
    const png = r.symbole.filter(s => s.status === 200 && /png/.test(s.typ || '') && /any/.test(s.zweck));
    r.hat192 = png.some(s => s.ist && parseInt(s.ist) >= 192);
    r.hat512 = png.some(s => s.ist && parseInt(s.ist) >= 512);
    r.groesseFalsch = r.symbole.filter(s => s.ist && s.soll && s.soll !== 'any' && !s.soll.split(' ').includes(s.ist)).map(s => s.src);
    const sr = await fetch(start, { cache: 'no-store' });
    r.startStatus = sr.status; r.startUmgeleitet = sr.redirected; r.startTyp = sr.headers.get('content-type');
    const html = await sr.text();
    r.startHatManifest = /rel=["']?manifest/i.test(html);
  } catch (err) { r.fehler = String(err); }
  log('manifest-' + name, r);
  const ok = !r.fehler && r.status === 200 && r.startStatus === 200 && r.startImScope && r.hat192 && r.hat512 && !r.groesseFalsch.length && /standalone|fullscreen|minimal-ui/.test(r.display || '');
  befund(`${name}: Manifest ${r.status || '–'}, Start ${r.startStatus || '–'}, 192px ${r.hat192 ? 'ja' : 'NEIN'}, 512px ${r.hat512 ? 'ja' : 'NEIN'}` +
         (r.groesseFalsch && r.groesseFalsch.length ? `, falsche Größe: ${r.groesseFalsch.join(', ')}` : '') +
         (r.startUmgeleitet ? ', Start wird UMGELEITET' : '') + (r.fehler ? ', Fehler: ' + r.fehler : ''), ok);
  return r;
}

async function schonInstalliert(){
  if (!navigator.getInstalledRelatedApps) { log('installiert-abfrage', 'nicht verfügbar'); return; }
  try {
    const a = await navigator.getInstalledRelatedApps();
    log('installiert-abfrage', a.map(x => x.platform + ' ' + (x.url || x.id || '')));
    if (a.length) befund('Chrome kennt diese Test-App als <b>schon installiert</b>', null);
  } catch (err) { log('installiert-abfrage-fehler', String(err)); }
}

// ── Bericht ──
function bericht(max){
  const zeilen = lade().map(x => `${x.t} +${x.ms} [${x.a || 'Test-App'}·${x.s}] ${x.e}${x.d === null ? '' : ' ' + JSON.stringify(x.d)}`);
  let text = zeilen.join('\n');
  let gekuerzt = false;
  while (max && encodeURIComponent(text).length > max && zeilen.length > 5) { zeilen.shift(); text = zeilen.join('\n'); gekuerzt = true; }
  return (gekuerzt ? '(ältere Zeilen gekürzt — volle Fassung über „Kopieren“)\n' : '') + text;
}
function meldung(t){ document.getElementById('meldung').textContent = t; }
function anGithub(){
  log('bericht-gesendet');
  const titel = 'Installations-Test ' + CFG.app + ' ' + new Date().toISOString().slice(0, 16).replace('T', ' ') + ' (' + modus() + ')';
  const body = 'Automatischer Bericht der Test-App `installtest/`.\n\n```\n' + bericht(6000) + '\n```\n';
  const u = 'https://github.com/lausiklauskn-png/Mein-Mixarium/issues/new?labels=&title=' + encodeURIComponent(titel) + '&body=' + encodeURIComponent(body);
  window.open(u, '_blank');
  meldung('GitHub öffnet sich — dort unten nur noch auf „Create“ / „Submit new issue“ tippen.');
}
async function kopieren(){
  try { await navigator.clipboard.writeText(bericht(0)); meldung('Kopiert. Du kannst es mir einfach in den Chat einfügen.'); }
  catch (_) { meldung('Kopieren ging nicht — bitte „Teilen“ nehmen.'); }
}
async function teilen(){
  try { await navigator.share({ title: 'Installations-Test', text: bericht(0) }); }
  catch (_) { meldung('Teilen ging nicht — bitte „Kopieren“ nehmen.'); }
}
function loeschen(){ speichere([]); document.getElementById('befund').innerHTML = ''; zeige(); meldung('Protokoll gelöscht.'); }

(async () => {
  zeige();
  await umgebung();
  await serviceWorker();
  for (const [p, n] of CFG.pruefen) await manifestPruefen(p, n);
  if (CFG.verwandt) await schonInstalliert();
  setTimeout(() => { if (!bip && modus() === 'browser') { log('nach-10s-kein-beforeinstallprompt'); befund('Nach 10 s kein Installier-Signal von Chrome (kann heißen: schon installiert, oder Chrome lehnt ab)', false); } }, 10000);
})();
