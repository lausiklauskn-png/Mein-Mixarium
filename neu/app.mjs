/* Mein Mixarium – neue Fassung (PWA). Oberfläche nach docs/vorschau/mixarium-neu.html, von Klaus am 23.11.2026 abgenommen.
   Getränke-Logik: ../getraenke/ (mit Proben). Alles unter ./vorlaeufig/ und die Oberfläche hier sind VORLÄUFIG und werden
   gegen den Küchen-Kern aus Mein Rezeptbuch getauscht, sobald er sie liefert (siehe README.md).
   Die alte App (../index.html) und ihre Daten werden nur gelesen, nie geändert. */
import * as G from '../getraenke/index.mjs';
import { sym as I } from './vorlaeufig/symbole.mjs';
import { platzbild } from './vorlaeufig/platzbild.mjs';
import * as Sp from './vorlaeufig/speicher.mjs';

export const FASSUNG = '10.0.0-vor1';
const $ = (s, w = document) => w.querySelector(s);
const esc = (t) => String(t == null ? '' : t).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/* Wasserfarben des Familienbüros, wie in der Private Akte. */
const FARBEN = { blau: { n: ['Wasserblau', 'Water blue'], k: ['#a9cff2', '#c9e2f7', '#dcedf5'], schrift: '#0b3154', akz: '#2f6ea8', fl: '#e4eef7' }, gruen: { n: ['Wassergrün', 'Water green'], k: ['#aee2cc', '#cdeede', '#e4f3d6'], schrift: '#0f4a43', akz: '#087f7a', fl: '#e4f1eb' }, see: { n: ['See', 'Lake'], k: ['#a8dde0', '#c8ebec', '#e0f3f0'], schrift: '#0b3154', akz: '#0b6f7a', fl: '#e2f1f1' }, flieder: { n: ['Flieder', 'Lilac'], k: ['#cfc4f0', '#e0d8f6', '#eee9fa'], schrift: '#35215f', akz: '#6a45a8', fl: '#ece7f8' }, gelb: { n: ['Helles Gelb', 'Light yellow'], k: ['#f7e3a0', '#fbeec4', '#fdf5dc'], schrift: '#5a4310', akz: '#916612', fl: '#f5efdc' }, koralle: { n: ['Koralle', 'Coral'], k: ['#f9c9ad', '#fbdcc8', '#fdebd9'], schrift: '#6b2a12', akz: '#ad4a22', fl: '#f6e9e1' }, kraeftig: { n: ['Kräftig', 'Strong'], k: ['#0b3154', '#164f7d', '#087f7a'], schrift: '#ffffff', akz: '#0b3154', fl: '#dfeaf3' } };
const SPRACHEN = [['de', 'Deutsch'], ['en', 'English'], ['es', 'Español'], ['fr', 'Français'], ['it', 'Italiano'], ['pt', 'Português'], ['ru', 'Русский'], ['zh', '中文']];
const NAV = [['start', ['Getränke', 'Drinks'], 'drinks'], ['karte', ['Karte', 'Drinks list'], 'plan'], ['einkauf', ['Einkauf', 'Shopping'], 'cart'], ['labor', ['Labor', 'Lab'], 'lab'], ['mehr', ['Einstellungen', 'Settings'], 'settings']];
const KAT_SYM = { all: 'drinks', mock: 'drinks', afckt: 'drinks', ckt: 'wine', smooth: 'glass', limo: 'citrus', tee: 'coffee', sirup: 'drop', bowle: 'users', knab: 'box', finger: 'box' };

/* ── Zustand ── E: Einstellungen des Geräts · A: die Sammlung · Z: was gerade zu sehen ist (flüchtig) */
let E = { sprache: null, farbe: 'blau', ton: 'system', mixGr: 1, einheit: 'auto', fl: { seite: 'r', oben: 64 }, navZu: true };
let A = null;
const Z = { view: 'start', uid: null, step: 0, port: 1, einheit: null, kat: 'all', suche: '', kopfAuf: false, flAuf: false, fokus: false, mixKopf: true, menue: null, fenster: null, toast: '', anlass: null, willkommen: false, pakete: null };

const sprache = () => E.sprache || (A && A.einstellungen && A.einstellungen.sprache) || ((navigator.language || 'de').slice(0, 2));
const L = (de, en) => (sprache() === 'de' ? de : en);
const dunkel = () => E.ton === 'dunkel' || (E.ton === 'system' && matchMedia('(prefers-color-scheme: dark)').matches);
const breit = () => innerWidth >= 1000;
const ohneAlk = () => !!(A.einstellungen && A.einstellungen.ohneAlkohol);
const lage = () => ({ getraenke: G.filterOhneAlkohol(A.getraenke, ohneAlk()), ordner: A.ordner, kategorien: A.kategorien, sprache: sprache() });
const getr = (uid) => A.getraenke.find((r) => r.uid === uid) || null;
const zahl = (t) => (sprache() === 'de' ? String(t).replace('.', ',') : String(t));

let speicherUhr = 0;
function sichern() { clearTimeout(speicherUhr); speicherUhr = setTimeout(() => { Sp.schreiben('sammlung', A).catch(() => melde(L('Speichern ist fehlgeschlagen. Bitte eine Sicherung anlegen.', 'Saving failed. Please make a backup.'))); }, 150); }
function einstSichern() { Sp.schreiben('einst', E).catch(() => {}); }
function melde(t) { Z.toast = t; zeichne(); clearTimeout(melde.uhr); melde.uhr = setTimeout(() => { Z.toast = ''; const o = $('.mxtoast'); if (o) o.remove(); }, 2600); }

/* ── Auswahl ── */
function sichtbar() {
  const q = Z.suche.trim().toLowerCase();
  return G.filterOhneAlkohol(A.getraenke, ohneAlk()).filter((r) => G.istSichtbar(r)
    && (Z.kat === 'all' || G.katVonRezept(r, A.ordner) === Z.kat)
    && (!q || String(r.name).toLowerCase().includes(q) || (r.ings || []).some((z) => String(z.name).toLowerCase().includes(q)) || (r.tags || []).some((t) => String(t).toLowerCase().includes(q))));
}
function kats() { const l = lage(); return G.katsAlle(l).map((c) => ({ c, n: G.katAnzahl(c.id, l.getraenke, l.ordner) })).filter((x) => x.n > 0); }
const katText = (c) => G.katBeschriftung(c, A.kategorien && A.kategorien.eigen, sprache());
const katNameVon = (r) => { const id = G.katVonRezept(r, A.ordner); const c = G.katsAlle(lage()).find((x) => x.id === id); return c ? katText(c) : (id === G.KAT_OHNE ? L('Ohne Kategorie', 'No category') : id); };

/* ── Bausteine ── */
function bild(r, klasse = '') {
  if (r.img) { const c = r.imgCrop || {}; return `<img class="foto ${klasse}" src="${esc(r.img)}" alt="" loading="lazy" decoding="async" style="object-position:${Number(c.x) >= 0 ? Number(c.x) : 50}% ${Number(c.y) >= 0 ? Number(c.y) : 50}%">`; }
  return platzbild(r);
}
function logo() { return `<svg class="logo" viewBox="0 0 64 64" aria-hidden="true"><defs><linearGradient id="lg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#5b8cff"/><stop offset="1" stop-color="#6b3fc4"/></linearGradient></defs><path d="M25 6h14v4h-2v14l15 24a6 6 0 0 1-5 9H17a6 6 0 0 1-5-9l15-24V10h-2z" fill="rgba(91,140,255,.16)" stroke="url(#lg)" stroke-width="3" stroke-linejoin="round"/><path d="M17 44c8-6 14 4 30-2l4 6a5 5 0 0 1-4 7H17a5 5 0 0 1-4-7z" fill="url(#lg)"/><path d="M52 6l1.6 4.4L58 12l-4.4 1.6L52 18l-1.6-4.4L46 12l4.4-1.6z" fill="#5b8cff"/></svg>`; }
function suchfeld(voll) { return `<label class="suchfeld" ${voll ? 'style="width:100%;margin-top:12px"' : ''}>${I('search')}<input id="suche" type="search" value="${esc(Z.suche)}" placeholder="${L('Getränk oder Zutat suchen', 'Search drink or ingredient')}" aria-label="${L('Suchen', 'Search')}" autocomplete="off"></label>`; }
function kopf(br) {
  const auf = Z.kopfAuf, n = sichtbar().length;
  const werk = `<button class="schalter ${ohneAlk() ? '' : 'aus'}" data-a="alk" aria-pressed="${ohneAlk()}">${I('noalc')}${ohneAlk() ? L('Ohne Alkohol', 'Alcohol-free') : L('Alkohol an', 'Alcohol on')}</button><button class="rund" data-a="menue" data-m="sprache" aria-label="${L('Sprache', 'Language')}">${I('lang')}</button><button class="rund farbknopf" data-a="menue" data-m="farbe" aria-label="${L('Farbe', 'Colour')}"></button><button class="rund" data-go="mehr" aria-label="${L('Einstellungen', 'Settings')}">${I('settings')}</button>`;
  const mini = ohneAlk() ? `<button class="alkmini" data-a="alk" aria-label="${L('Ohne Alkohol ist an', 'Alcohol-free is on')}" title="${L('Ohne Alkohol', 'Alcohol-free')}">${I('noalc')}</button>` : '';
  return `<header class="kopf">${logo()}<div class="name">Mein Mixarium<small>${n} ${n === 1 ? L('Getränk', 'drink') : L('Getränke', 'drinks')}</small></div>${br ? suchfeld(false) : ''}<button class="rund neu" data-a="neu" aria-label="${L('Neues Getränk', 'New drink')}" title="${L('Neues Getränk', 'New drink')}">${I('plus')}</button>${auf ? '' : mini}<button class="klapp" data-a="kopf" aria-expanded="${auf}" aria-label="${auf ? L('Werkzeuge einklappen', 'Collapse tools') : L('Werkzeuge aufklappen', 'Expand tools')}">${I(auf ? 'right' : 'left')}</button>${auf ? `<div class="kopfwerk">${werk}</div>` : ''}</header>`;
}
function navLinks() {
  const akt = Z.view === 'getraenk' ? 'start' : Z.view, zu = E.navZu;
  return `<nav class="nav ${zu ? 'zu' : ''}" aria-label="${L('Bereiche', 'Sections')}">${NAV.map(([v, n, i]) => `<button data-go="${v}" ${akt === v ? 'aria-current="page"' : ''} ${zu ? `aria-label="${L(...n)}" title="${L(...n)}"` : ''}>${I(i)}<span>${L(...n)}</span></button>`).join('')}<button class="navgriff" data-a="navzu" aria-expanded="${!zu}" aria-label="${zu ? L('Leiste aufklappen', 'Expand bar') : L('Leiste einklappen', 'Collapse bar')}">${I(zu ? 'right' : 'left')}</button></nav>`;
}
function flLeiste() {
  const f = E.fl, akt = Z.view === 'getraenk' ? 'start' : Z.view;
  const cls = `fl-leiste ${f.seite === 'l' ? 'links' : ''} ${f.seite === 'u' ? 'unten' : ''}`;
  const ort = f.seite === 'u' ? `left:${Z.flAuf ? 50 : f.oben}%` : `top:${Z.flAuf ? Math.min(66, Math.max(34, f.oben)) : f.oben}%`;
  if (!Z.flAuf) return `<aside class="${cls}" style="${ort}"><button class="fl-griff" data-a="fl-auf" aria-label="${L('Leiste öffnen. Ziehen verschiebt sie.', 'Open bar. Drag to move it.')}"><span aria-hidden="true"></span></button></aside>`;
  const k = (attr, i, t, cur) => `<button ${attr} ${cur ? 'aria-current="page"' : ''}>${i}<span>${t}</span></button>`;
  return `<aside class="${cls}" style="${ort}"><div class="fl-knoepfe" role="menu"><button class="fl-zu" data-a="fl-zu" aria-label="${L('Schließen', 'Close')}">${I('x')}</button>${k('data-a="oben"', I('up'), L('Nach oben', 'To top'))}${Z.view !== 'start' ? k('data-a="zurueck"', I('left'), L('Zurück', 'Back')) : ''}${NAV.map(([v, n, i]) => k(`data-go="${v}"`, I(i), L(...n), akt === v)).join('')}<hr>${k('data-a="neu"', I('plus'), L('Neues Getränk', 'New drink'))}</div></aside>`;
}
function menue() {
  if (Z.menue === 'sprache') return `<div class="sprachmenue" role="menu"><h3>${L('Sprache der App', 'App language')}</h3><button role="menuitemradio" aria-checked="${!E.sprache}" data-lang="">${L('Wie das Gerät', 'Same as device')}${!E.sprache ? I('check') : ''}</button>${SPRACHEN.map(([k, n]) => `<button role="menuitemradio" aria-checked="${E.sprache === k}" data-lang="${k}">${n}${E.sprache === k ? I('check') : ''}</button>`).join('')}<p>${L('Vollständig sind Deutsch und Englisch. In den anderen Sprachen sind Kategorien und Gläser übersetzt, die übrige Oberfläche erscheint vorerst auf Englisch.', 'German and English are complete. In the other languages categories and glasses are translated; the rest of the interface is in English for now.')}</p></div>`;
  if (Z.menue === 'farbe') return `<div class="farbmenue" role="menu"><h3>${L('Farbe der App', 'App colour')}</h3>${Object.entries(FARBEN).map(([k, f]) => `<button role="menuitemradio" aria-checked="${E.farbe === k}" data-farbe="${k}"><span class="fleck" style="background:linear-gradient(135deg,${f.k[0]},${f.k[2]})"></span>${L(...f.n)}</button>`).join('')}<hr><h3>${L('Hell oder dunkel', 'Light or dark')}</h3>${[['system', L('Wie das Gerät', 'Same as device')], ['hell', L('Hell', 'Light')], ['dunkel', L('Dunkel', 'Dark')]].map(([k, n]) => `<button role="menuitemradio" aria-checked="${E.ton === k}" data-ton="${k}">${I(k === 'dunkel' ? 'moon' : 'sun')}${n}</button>`).join('')}</div>`;
  return '';
}
function leiste() {
  const l = lage(), alle = l.getraenke.filter(G.istSichtbar).length;
  return `<div class="leiste"><button class="chip" data-kat="all" aria-pressed="${Z.kat === 'all'}">${I('drinks')}${L('Alle', 'All')}<span class="zahl">${alle}</span></button>${kats().map(({ c, n }) => `<button class="chip" data-kat="${esc(c.id)}" aria-pressed="${Z.kat === c.id}">${I(KAT_SYM[c.id] || 'box')}${esc(katText(c))}<span class="zahl">${n}</span></button>`).join('')}</div>`;
}
function karte(r, i) { return `<button class="karte" style="--i:${Math.min(i || 0, 7)}" data-d="${esc(r.uid)}"><div class="bild">${bild(r)}${G.hatAlkohol(r) ? `<span class="marke">${I('wine')}${L('mit Alkohol', 'with alcohol')}</span>` : ''}${r.beispiel ? `<span class="marke rechts">${L('Beispiel', 'Example')}</span>` : ''}</div><div class="txt"><strong>${esc(r.name)}</strong><small><span class="nw">${I('glass')}${esc(r.glass ? G.glasName(r.glass, sprache()) : katNameVon(r))}</span>${r.prepTime ? `<span class="nw">${I('timer')}${Number(r.prepTime)} min</span>` : ''}</small></div></button>`; }
function kartenHtml() {
  const l = sichtbar();
  if (!l.length) return `<p class="leer">${Z.suche ? L('Nichts gefunden. Anderes Wort versuchen oder die Kategorie „Alle“ wählen.', 'Nothing found. Try another word or choose “All”.') : L('In dieser Kategorie ist noch nichts.', 'Nothing in this category yet.')}</p>`;
  return `<div class="karten">${l.map(karte).join('')}</div>`;
}
function willkommen() {
  return `<div class="willkommen"><h3>${L('Willkommen im neuen Mixarium', 'Welcome to the new Mixarium')}</h3><p>${L('Deine Sammlung ist noch leer. So kommst du zu Getränken:', 'Your collection is still empty. Here is how to get drinks:')}</p><div class="reihe"><button class="knopf" data-a="beispiele">${I('box')}${L('Beispiele laden', 'Load examples')}</button><button class="knopf hell" data-a="neu">${I('plus')}${L('Getränk anlegen', 'Add a drink')}</button><button class="knopf hell" data-a="einspielen">${I('upload')}${L('Sicherung einspielen', 'Restore a backup')}</button></div></div>`;
}
function vStart(br) {
  const leer = !A.getraenke.some(G.istSichtbar), versteckt = A.getraenke.filter((r) => G.istSichtbar(r) && G.hatAlkohol(r)).length;
  return `<div class="innen-p"><h2 class="titel">${L('Was mixen wir heute?', 'What shall we mix today?')}</h2>${br ? '' : suchfeld(true)}${leer ? willkommen() : `${leiste()}<div id="kartenort">${kartenHtml()}</div>${ohneAlk() && versteckt ? `<p class="hinweis">${I('check')}${L(`Ohne Alkohol ist an: ${versteckt} ${versteckt === 1 ? 'Getränk' : 'Getränke'} mit Alkohol ${versteckt === 1 ? 'ist' : 'sind'} ausgeblendet.`, `Alcohol-free is on: ${versteckt} drink${versteckt === 1 ? '' : 's'} with alcohol hidden.`)}</p>` : ''}`}</div>`;
}

/* ── Getränk ── */
function einheitWahl() { if (Z.einheit) return Z.einheit; if (E.einheit !== 'auto') return E.einheit; return G.systemVonLocale(navigator.language) === 'us' ? 'oz' : 'orig'; }
function zutatenVon(r) {
  let z = G.portionenSkalieren(r.ings || [], r.servings, Z.port);
  const e = einheitWahl();
  if (e !== 'orig') z = z.map((i) => G.zutatUmstellen(i, e));
  return z;
}
const mengeText = (z) => [zahl(z.amt || ''), z.unit || ''].filter(Boolean).join(' ');
function zutatenListe(r) { return `<ul class="zutaten">${zutatenVon(r).map((z) => `<li><span class="menge">${esc(mengeText(z))}</span><span>${esc(z.name)}${z.note ? ` <small class="leise">${esc(z.note)}</small>` : ''}</span></li>`).join('') || `<li><span>${L('Noch keine Zutaten.', 'No ingredients yet.')}</span></li>`}</ul>`; }
function schritteListe(r) { return `<ol class="schritte">${(r.steps || []).map((s) => `<li><span>${esc(s.txt)}</span></li>`).join('') || `<li><span>${L('Noch keine Schritte.', 'No steps yet.')}</span></li>`}</ol>`; }
function fakten(r) { return `<div class="fakten">${r.glass ? `<span class="fakt">${I('glass')}${esc(G.glasName(r.glass, sprache()))}</span>` : ''}${r.temp ? `<span class="fakt">${I(r.temp === 'warm' || r.temp === 'hot' ? 'coffee' : 'snow')}${esc(G.tempName(r.temp, sprache()))}</span>` : ''}${r.prepTime ? `<span class="fakt">${I('timer')}${Number(r.prepTime)} min</span>` : ''}${G.hatAlkohol(r) ? `<span class="fakt alk">${I('wine')}${L('mit Alkohol', 'with alcohol')}</span>` : `<span class="fakt ok">${I('noalc')}${L('ohne Alkohol', 'alcohol-free')}</span>`}</div>`; }
function portion(r) {
  const e = einheitWahl(), was = r.servings === 1 || Z.port === 1 ? L('Portion', 'serving') : L('Portionen', 'servings');
  return `<div class="portion"><b>${Z.port} ${Z.port === 1 ? L('Portion', 'serving') : L('Portionen', 'servings')}<small>${L('Mengen werden umgerechnet', 'Amounts are recalculated')}</small></b><div class="stepper"><button data-a="minus" aria-label="${L('Weniger', 'Fewer')}">${I('minus')}</button><output>${Z.port}</output><button data-a="plus" aria-label="${L('Mehr', 'More')}">${I('plus')}</button></div></div><div class="einheiten" role="group" aria-label="${L('Einheit', 'Unit')}">${[['orig', L('wie notiert', 'as written')], ['ml', 'ml'], ['cl', 'cl'], ['oz', 'oz']].map(([k, n]) => `<button data-e="${k}" aria-pressed="${e === k}">${n}</button>`).join('')}</div>`;
}
function geraeteKacheln(liste, hell) { return liste.length ? `<div class="geraete ${hell ? 'hell' : ''}">${liste.map((g) => `<span class="gk">${G.geraetSvg(g)}<small>${esc(G.geraetName(g, sprache()))}</small></span>`).join('')}</div>` : ''; }
function aktionen(r, br) { return `<div class="reihe" style="margin-top:14px"><button class="knopf" data-go="mix">${I('drinks')}${L('Mixen', 'Mix')}</button><button class="knopf hell" data-a="einkauf-dazu">${I('cart')}${L('Auf die Einkaufsliste', 'Add to shopping list')}</button><button class="knopf hell" data-a="teilen">${I('share')}${L('Teilen', 'Share')}</button><button class="knopf hell" data-a="bearbeiten">${I('pencil')}${L('Bearbeiten', 'Edit')}</button></div>`; }
function vGetraenk(br) {
  const r = getr(Z.uid); if (!r) { Z.view = 'start'; return vStart(br); }
  const ger = G.geraeteFuerGetraenk(r);
  const gerAbs = ger.length ? `<div class="abschnitt"><h3>${L('Gerätschaften', 'Equipment')}</h3>${geraeteKacheln(ger, true)}</div>` : '';
  const notiz = r.notes ? `<div class="abschnitt"><h3>${L('Notizen', 'Notes')}</h3><p class="notiz">${esc(r.notes)}</p></div>` : '';
  if (!br) return `<div class="held">${bild(r)}<button class="zurueck" data-a="zurueck" aria-label="${L('Zurück', 'Back')}">${I('left')}</button><button class="vollbild" data-a="bildvoll" aria-label="${L('Bild im Vollbild', 'Picture full screen')}">${I('full')}</button><div class="ueber"><h2>${esc(r.name)}</h2><p>${esc(katNameVon(r))}</p></div></div><div class="innen-p">${fakten(r)}${aktionen(r)}${portion(r)}<div class="abschnitt"><h3>${L('Zutaten', 'Ingredients')}</h3>${zutatenListe(r)}</div>${gerAbs}<div class="abschnitt"><h3>${L('Schritte', 'Steps')}</h3>${schritteListe(r)}</div>${notiz}</div>`;
  const fk = Z.fokus;
  const liste = fk ? '' : `<div class="liste">${leiste()}${sichtbar().map((x) => `<button class="zeile" data-d="${esc(x.uid)}" ${x.uid === r.uid ? 'aria-current="true"' : ''}><span class="mini">${bild(x)}</span><span><strong>${esc(x.name)}</strong><small>${esc(katNameVon(x))}${x.prepTime ? ` · ${Number(x.prepTime)} min` : ''}</small></span></button>`).join('')}</div>`;
  return `<div class="md ${fk ? 'fokus' : ''}">${liste}<div class="detail"><div class="detail-kopf"><div class="held">${bild(r)}<button class="vollbild" data-a="bildvoll" aria-label="${L('Bild im Vollbild', 'Picture full screen')}">${I('full')}</button><button class="fokusknopf" data-a="fokus" aria-pressed="${fk}">${I('panel')}${fk ? L('Liste zeigen', 'Show list') : L('Nur dieses Getränk', 'Only this drink')}</button></div><div class="seite"><p class="unter">${esc(katNameVon(r))}</p><h2>${esc(r.name)}</h2>${fakten(r)}${aktionen(r, true)}</div></div><div class="detail-rumpf"><div><div class="abschnitt" style="margin-top:0"><h3>${L('Zutaten', 'Ingredients')}</h3>${portion(r)}<div style="margin-top:12px">${zutatenListe(r)}</div></div>${gerAbs}</div><div><div class="abschnitt" style="margin-top:0"><h3>${L('Schritte', 'Steps')}</h3>${schritteListe(r)}</div>${notiz}</div></div></div></div>`;
}

/* ── Mix-Ansicht ── Welche Zutaten nennt der Schritt? Über den Namen (Wortanfang, mindestens 4 Buchstaben). */
const FUELLWORT = new Set(['eine', 'einem', 'einen', 'einer', 'eines', 'dazu', 'dazugeben', 'geben', 'glas', 'oben', 'unten', 'nach', 'sofort', 'alles', 'auch', 'noch', 'sich', 'wird', 'sein', 'über', 'fein', 'kalt', 'heiß', 'warm', 'gut', 'with', 'into', 'then', 'that', 'this', 'from', 'over', 'until', 'well', 'glass']);
function zutatenImSchritt(r, text) {
  const woerter = String(text).toLowerCase().split(/[^\p{L}]+/u).filter((w) => w.length >= 4 && !FUELLWORT.has(w));
  const staemme = woerter.map((w) => w.slice(0, 5));
  return zutatenVon(r).filter((z) => String(z.name).toLowerCase().split(/[^\p{L}]+/u).some((w) => w.length >= 4 && !FUELLWORT.has(w) && (staemme.some((st) => w.includes(st)) || woerter.some((sw) => sw.includes(w.slice(0, 5))))));
}
function vMix(br) {
  const r = getr(Z.uid); if (!r) return '';
  const schritte = r.steps && r.steps.length ? r.steps : [{ txt: L('Für dieses Getränk sind noch keine Schritte notiert.', 'No steps written for this drink yet.') }];
  const st = Math.min(Z.step, schritte.length - 1), s = schritte[st], braucht = zutatenImSchritt(r, s.txt), ger = G.geraeteFuerSchritt(s.txt);
  const letzter = st === schritte.length - 1, gr = ['klein', 'mittel', 'gross'][E.mixGr] || 'mittel', kz = !br && !Z.mixKopf;
  const zut = braucht.length ? braucht.map((z) => `<span><b>${esc(mengeText(z))}</b>${esc(z.name)}</span>`).join('') : '';
  const kopfz = `<div class="mixkopf"><div class="fort">${schritte.map((_, i) => `<i class="${i < st ? 'an' : i === st ? 'jetzt' : ''}"></i>`).join('')}</div><div class="oben">${kz ? '' : `<b>${esc(r.name)} · ${Z.port} ${Z.port === 1 ? L('Portion', 'serving') : L('Portionen', 'servings')}</b>`}${br ? '' : `<button data-a="mixkopf" aria-expanded="${!kz}" aria-label="${kz ? L('Kopfzeile aufklappen', 'Expand header') : L('Kopfzeile einklappen', 'Collapse header')}">${I(kz ? 'down' : 'up')}</button>`}<button data-a="mix-zu" aria-label="${L('Schließen', 'Close')}">${I('x')}</button></div></div>`;
  const b = `<div class="mixbild">${bild(r)}<span class="mixnr">${L(`Schritt ${st + 1} von ${schritte.length}`, `Step ${st + 1} of ${schritte.length}`)}</span></div>`;
  const kn = `<div><div class="knoepfe"><button class="zurueckk" data-a="sz" ${st === 0 ? 'disabled style="opacity:.4"' : ''}>${I('left')}${L('Zurück', 'Back')}</button><button class="weiter" data-a="${letzter ? 'fertig' : 'sv'}">${letzter ? I('check') + L('Fertig', 'Done') : L('Weiter', 'Next') + I('right')}</button></div><p class="wach">${I('sun')}${Z.wach ? L('Bildschirm bleibt an', 'Screen stays on') : L('Tippen oder wischen zum Blättern', 'Tap or swipe to page')}${br ? ` · <span class="taste">←</span><span class="taste">→</span> ${L('blättern', 'page')} · <span class="taste">Esc</span> ${L('schließt', 'closes')}` : ''}</p></div>`;
  if (!br) return `<div class="mix ${Z.richt || 'vor'} gr-${gr} ${kz ? 'kopfzu' : ''}" role="dialog" aria-label="${esc(r.name)}">${kopfz}<div class="mitte">${b}<p class="satz">${esc(s.txt)}</p>${zut ? `<div class="braucht">${zut}</div>` : ''}${geraeteKacheln(ger)}</div>${kn}</div>`;
  return `<div class="mix ${Z.richt || 'vor'} gr-${gr}" role="dialog" aria-label="${esc(r.name)}">${kopfz}<div class="mitte"><div class="mixlinks">${b}<p class="satz">${esc(s.txt)}</p></div><div class="seitlich"><h3>${L('Für diesen Schritt', 'For this step')}</h3><ul>${braucht.length ? braucht.map((z) => `<li><b>${esc(mengeText(z))}</b>${esc(z.name)}</li>`).join('') : `<li class="leise">${L('Keine Zutat genannt', 'No ingredient named')}</li>`}</ul>${ger.length ? `<h3 style="margin-top:18px">${L('Dafür brauchst du', 'You need')}</h3>${geraeteKacheln(ger)}` : ''}</div></div>${kn}</div>`;
}

/* ── Einkaufsliste ── */
const GRP = [['obst', ['Obst & Kräuter', 'Fruit & herbs'], 'leaf', /zitron|limett|orange|minz|gurke|ingwer|beere|apfel|äpfel|mango|basilik|rosmarin|ananas|pfirsich|banane|kirsch|melone|holunder|thymian|lemon|lime|mint|cucumber|ginger|berr|apple|peach|pineapple|basil/i], ['saft', ['Säfte & Sirupe', 'Juices & syrups'], 'drop', /saft|sirup|nektar|juice|syrup|grenadine|püree|puree/i], ['wasser', ['Sprudel & Wasser', 'Sparkling & water'], 'glass', /wasser|soda|sprudel|tonic|limonade|cola|ginger ale|ginger beer|water|lemonade/i], ['kuehl', ['Kühlregal & Eis', 'Chilled & ice'], 'snow', /milch|joghurt|sahne|eis|butter|quark|milk|yogurt|cream|ice/i], ['vorrat', ['Vorrat', 'Pantry'], 'list', /./]];
const gruppeVon = (name) => GRP.find((g) => g[3].test(name))[0];
function einkaufDazu(r, portionen, wofuer) {
  for (const z of G.portionenSkalieren(r.ings || [], r.servings, portionen)) {
    if (!String(z.name).trim()) continue;
    const m = G.mengeLesen(z.amt), wert = typeof m === 'number' ? m : null, name = String(z.name).trim(), unit = String(z.unit || '').trim();
    const da = wert !== null && A.einkauf.find((p) => !p.ok && p.wert !== null && p.name.toLowerCase() === name.toLowerCase() && p.unit === unit);
    if (da) { da.wert += wert; if (!da.fuer.includes(wofuer)) da.fuer.push(wofuer); } else A.einkauf.push({ id: Date.now() + Math.random(), name, unit, wert, text: wert === null ? String(z.amt || '') : '', fuer: [wofuer], ok: false });
  }
}
function vEinkauf(br) {
  const ps = A.einkauf, offen = ps.filter((p) => !p.ok).length;
  const posten = (p) => `<button class="posten ${Z.pop === p.id ? 'pop' : ''}" role="checkbox" aria-checked="${!!p.ok}" data-h="${p.id}"><span class="kasten">${p.ok ? I('check') : ''}</span><span class="was">${esc(p.name)}<small>${L('für', 'for')} ${esc(p.fuer.join(', '))}</small></span><span class="wieviel">${esc(p.wert !== null ? zahl(G.zahlFormatieren(p.wert)) + (p.unit ? ' ' + p.unit : '') : [p.text, p.unit].filter(Boolean).join(' '))}</span></button>`;
  const gruppen = GRP.map(([g, n, i]) => { const l = ps.filter((p) => gruppeVon(p.name) === g); return l.length ? `<div class="gruppe-e"><h3>${I(i)}${L(...n)}</h3>${l.map(posten).join('')}</div>` : ''; }).join('');
  const kopfz = `<h2 class="titel">${L('Einkaufsliste', 'Shopping list')}</h2><p class="unter">${ps.length ? L(`${offen} von ${ps.length} offen`, `${offen} of ${ps.length} open`) : L('Noch leer. Im Getränk oder in einer Getränkekarte auf „Auf die Einkaufsliste“ tippen.', 'Empty. Tap “Add to shopping list” in a drink or a drinks list.')}</p>`;
  const werk = ps.length ? `<div class="reihe" style="margin-top:10px"><button class="knopf hell" data-a="einkauf-teilen">${I('share')}${L('Teilen', 'Share')}</button><button class="knopf hell" data-a="einkauf-erledigt">${I('check')}${L('Erledigtes entfernen', 'Remove done')}</button><button class="knopf hell" data-a="einkauf-leeren">${I('trash')}${L('Liste leeren', 'Clear list')}</button></div>` : '';
  return `<div class="innen-p">${kopfz}${werk}${br ? `<div class="einkauf-breit">${gruppen}</div>` : gruppen}</div>`;
}

/* ── Getränkekarte (Anlässe) ── */
const ABSCHNITTE = [['Zum Ankommen', 'On arrival'], ['Zum Essen', 'With the meal'], ['Zum Nachtisch', 'With dessert'], ['Später', 'Later']];
function vKarte(br) {
  A.anlaesse = A.anlaesse || [];
  const an = A.anlaesse.find((x) => x.id === Z.anlass);
  if (!an) {
    const alt = (A.karten || []).length;
    return `<div class="innen-p"><h2 class="titel">${L('Getränkekarten', 'Drinks lists')}</h2><p class="unter">${L('Für einen Anlass zusammenstellen, was es wann zu trinken gibt.', 'Put together what to drink and when, for an occasion.')}</p><div class="reihe" style="margin-top:12px"><button class="knopf" data-a="anlass-neu">${I('plus')}${L('Neue Getränkekarte', 'New drinks list')}</button></div>${A.anlaesse.map((x) => `<button class="slot" data-anlass="${x.id}"><span class="mitte"><strong>${esc(x.titel)}</strong><small>${esc([x.datum, x.gaeste ? x.gaeste + ' ' + L('Gäste', 'guests') : ''].filter(Boolean).join(' · '))}</small></span><span class="anz">${x.posten.length}</span></button>`).join('')}${alt ? `<p class="hinweis">${I('info')}${L(`Dein Wochenplan aus der bisherigen App (${alt} Einträge) ist übernommen und bleibt gespeichert. Die Wochenansicht zieht noch um.`, `Your week plan from the previous app (${alt} entries) was taken over and stays saved. The week view is still to come.`)}</p>` : ''}</div>`;
  }
  const gaenge = ABSCHNITTE.map(([de, en], ai) => { const l = an.posten.filter((p) => p.abschnitt === ai); return l.length ? `<div class="gang"><h3>${L(de, en)}</h3>${l.map((p) => { const r = getr(p.uid); return r ? `<div class="slot"><button class="mini" data-d="${esc(r.uid)}" aria-label="${esc(r.name)}">${bild(r)}</button><span class="mitte"><strong>${esc(r.name)}</strong><small>${esc(katNameVon(r))}</small></span><span class="stepper klein"><button data-a="posten-minus" data-p="${p.id}" aria-label="${L('Weniger', 'Fewer')}">${I('minus')}</button><output>${p.anzahl}</output><button data-a="posten-plus" data-p="${p.id}" aria-label="${L('Mehr', 'More')}">${I('plus')}</button></span><button class="rund klein" data-a="posten-weg" data-p="${p.id}" aria-label="${L('Entfernen', 'Remove')}">${I('x')}</button></div>` : ''; }).join('')}</div>` : ''; }).join('');
  const links = `<button class="zurueckzeile" data-a="anlass-zu">${I('left')}${L('Alle Getränkekarten', 'All drinks lists')}</button><div class="anlass"><h2>${esc(an.titel)}</h2><p>${an.datum ? `<span>${I('plan')}${esc(an.datum)}</span>` : ''}${an.gaeste ? `<span>${I('users')}${Number(an.gaeste)} ${L('Gäste', 'guests')}</span>` : ''}</p></div>${gaenge || `<p class="leer">${L('Noch kein Getränk auf dieser Karte.', 'No drink on this list yet.')}</p>`}<div class="reihe" style="margin-top:16px"><button class="knopf" data-a="posten-neu">${I('plus')}${L('Getränk hinzufügen', 'Add drink')}</button><button class="knopf hell" data-a="anlass-einkauf">${I('cart')}${L('Alles auf die Einkaufsliste', 'All to the shopping list')}</button><button class="knopf hell" data-a="anlass-bearbeiten">${I('pencil')}${L('Bearbeiten', 'Edit')}</button><button class="knopf hell" data-a="anlass-weg">${I('trash')}${L('Löschen', 'Delete')}</button></div>`;
  if (!br) return `<div class="innen-p">${links}</div>`;
  const blatt = `<div class="menuekarte"><div class="kl">${L('Getränkekarte', 'Drinks list')}</div><h2>${esc(an.titel)}</h2><div class="dat">${esc(an.datum || '')}</div><hr>${ABSCHNITTE.map(([de, en], ai) => { const l = an.posten.filter((p) => p.abschnitt === ai && getr(p.uid)); return l.length ? `<h4>${L(de, en)}</h4>${l.map((p) => `<p>${esc(getr(p.uid).name)}</p>`).join('')}` : ''; }).join('')}</div>`;
  return `<div class="innen-p"><div class="menue-breit"><div>${links}</div><div><p class="unter" style="margin-bottom:10px;display:flex;justify-content:space-between;align-items:center">${L('So sieht die Karte aus', 'This is how the list looks')}<button class="chip" data-a="drucken">${I('print')}${L('Drucken', 'Print')}</button></p>${blatt}</div></div></div>`;
}

/* ── Labor (zieht als Nächstes um) ── */
function vLabor() { return `<div class="innen-p"><h2 class="titel">${L('Mix-Labor', 'Mix lab')}</h2><p class="unter">${L('Erfinden, bewerten, ins Buch übernehmen.', 'Invent, rate, move into the book.')}</p><div class="willkommen"><h3>${I('lab')} ${L('Das Labor zieht als Nächstes um', 'The lab moves in next')}</h3><p>${L('Mix-Labor, „Bekannte Drinks entdecken“, Foto-Scan, KI-Bild und Übersetzen sind in dieser ersten Fassung noch nicht eingebaut. Sie kommen mit allen bisherigen Funktionen, jede mit eigener Prüfung. Bis dahin findest du sie unverändert in der bisherigen App.', 'Mix lab, discover, photo scan, AI picture and translation are not built into this first version yet. They will come with all previous features. Until then you find them unchanged in the previous app.')}</p><div class="reihe"><a class="knopf hell" href="../index.html">${L('Zur bisherigen App', 'To the previous app')}</a></div></div></div>`; }

/* ── Einstellungen ── */
function vMehr() {
  const z = (i, t, w, attr = '') => `<button class="ezeile" ${attr}>${i}<span><b>${t}</b><small>${w}</small></span>${I('right')}</button>`;
  const bsp = A.getraenke.filter((r) => r.beispiel).length, alle = A.getraenke.filter(G.istSichtbar).length;
  return `<div class="innen-p"><h2 class="titel">${L('Einstellungen', 'Settings')}</h2>
  <div class="eliste">${z(I('lang'), L('Sprache', 'Language'), E.sprache ? SPRACHEN.find((x) => x[0] === E.sprache)[1] : L('wie das Gerät', 'same as device'), 'data-a="menue" data-m="sprache"')}${z(I('drop'), L('Einheiten', 'Units'), { auto: L('automatisch nach Land', 'automatic by country'), orig: L('wie notiert', 'as written'), ml: 'ml', cl: 'cl', oz: 'oz' }[E.einheit], 'data-a="einheit"')}${z(I('aa'), L('Schriftgröße in der Mix-Ansicht', 'Text size in mix view'), [L('klein', 'small'), L('mittel', 'medium'), L('groß', 'large')][E.mixGr], 'data-a="mixgr"')}${z('<span class="fleck farbknopf"></span>', L('Farbe, hell und dunkel', 'Colour, light and dark'), L(...FARBEN[E.farbe].n) + ' · ' + { system: L('wie das Gerät', 'same as device'), hell: L('hell', 'light'), dunkel: L('dunkel', 'dark') }[E.ton], 'data-a="menue" data-m="farbe"')}${z(I('noalc'), L('Ohne Alkohol', 'Alcohol-free'), ohneAlk() ? L('an: Getränke mit Alkohol sind ausgeblendet', 'on: drinks with alcohol are hidden') : L('aus', 'off'), 'data-a="alk"')}</div>
  <h3 class="eh">${L('Beispiele', 'Examples')}</h3><div class="eliste">${z(I('box'), L('Beispiele laden', 'Load examples'), L('Pakete mit Getränken zum Ausprobieren', 'Packages of drinks to try'), 'data-a="beispiele"')}${z(I('trash'), L('Alle Beispiele löschen', 'Delete all examples'), bsp ? L(`${bsp} Beispiele in deiner Sammlung`, `${bsp} examples in your collection`) : L('keine Beispiele in deiner Sammlung', 'no examples in your collection'), 'data-a="beispiele-weg"')}</div>
  <h3 class="eh">${L('Sammlung', 'Collection')}</h3><div class="eliste">${z(I('download'), L('Sicherung speichern', 'Save a backup'), L(`${alle} Getränke als Datei`, `${alle} drinks as a file`), 'data-a="sichern"')}${z(I('upload'), L('Sicherung einspielen', 'Restore a backup'), L('fügt hinzu, Doppelte werden erkannt', 'adds; duplicates are detected'), 'data-a="einspielen"')}${z(I('back'), L('Aus der bisherigen App übernehmen', 'Take over from the previous app'), L('liest die alten Daten, ändert sie nicht', 'reads the old data, does not change it'), 'data-a="uebernehmen"')}${z(I('warn'), L('Sammlung leeren', 'Empty the collection'), L('alle Getränke, Karten und die Einkaufsliste entfernen', 'remove all drinks, lists and the shopping list'), 'data-a="leeren"')}</div>
  <h3 class="eh">${L('Über', 'About')}</h3><div class="eliste">${z(I('info'), 'Mein Mixarium', L(`Fassung ${FASSUNG} · neue Gestaltung, Vorab`, `Version ${FASSUNG} · new design, preview`), 'data-a="ueber"')}<a class="ezeile" href="../index.html">${I('back')}<span><b>${L('Bisherige App öffnen', 'Open the previous app')}</b><small>${L('bleibt unverändert, mit Labor, Scan und KI', 'unchanged, with lab, scan and AI')}</small></span>${I('right')}</a><a class="ezeile" href="../impressum.html">${I('book')}<span><b>${L('Impressum', 'Legal notice')}</b><small></small></span>${I('right')}</a></div></div>`;
}

/* ── Fenster (Dialoge) ── */
function fenster() {
  const f = Z.fenster; if (!f) return '';
  return `<div class="schleier" data-a="fenster-zu-aussen"><div class="fenster" role="dialog" aria-modal="true" aria-label="${esc(f.titel)}"><div class="fkopf"><h2>${esc(f.titel)}</h2><button class="rund" data-a="fenster-zu" aria-label="${L('Schließen', 'Close')}">${I('x')}</button></div>${f.html}</div></div>`;
}
const fZu = () => { Z.fenster = null; zeichne(); };
function frage(titel, text, jaText, ja, gefahr) { Z.fenster = { titel, html: `<p class="ftext">${text}</p><div class="reihe ende"><button class="knopf hell" data-a="fenster-zu">${L('Abbrechen', 'Cancel')}</button><button class="knopf ${gefahr ? 'rot' : ''}" data-a="fenster-ja">${jaText}</button></div>`, ja }; zeichne(); }

function editor(r) {
  const neu = !r; r = r || { name: '', cat: Z.kat !== 'all' ? Z.kat : 'mock', glass: 'highball', temp: 'kalt', servings: 1, prepTime: 5, ings: [], steps: [], notes: '', img: '' };
  const katListe = G.katsAlle({ ...lage(), getraenke: A.getraenke }).filter((c) => c.id !== G.KAT_OHNE);
  const opt = (l, wert, name) => l.map((x) => `<option value="${esc(x.id)}" ${x.id === wert ? 'selected' : ''}>${esc(name(x))}</option>`).join('');
  const glasBekannt = !r.glass || G.istBekanntesGlas(r.glass);
  Z.fenster = { titel: neu ? L('Neues Getränk', 'New drink') : L('Getränk bearbeiten', 'Edit drink'), uid: r.uid || null, img: r.img || '', html: `<form id="ed" class="felder" autocomplete="off">
   <label>${L('Name', 'Name')}<input class="feld" name="name" required value="${esc(r.name)}"></label>
   <div class="zweier"><label>${L('Kategorie', 'Category')}<select class="feld" name="cat">${opt(katListe, r.cat, katText)}<option value="" ${!r.cat ? 'selected' : ''}>${L('ohne Kategorie', 'no category')}</option></select></label>
   <label>${L('Glas', 'Glass')}<select class="feld" name="glass">${glasBekannt ? '' : `<option value="${esc(r.glass)}" selected>${esc(r.glass)}</option>`}${opt(G.GLAESER, r.glass, (g) => g[sprache()] || g.de)}</select></label></div>
   <div class="dreier"><label>${L('Temperatur', 'Temperature')}<select class="feld" name="temp"><option value="">–</option>${opt(G.TEMPERATUREN, r.temp, (t) => t[sprache()] || t.de)}</select></label>
   <label>${L('Portionen', 'Servings')}<input class="feld" name="servings" type="number" min="1" max="99" value="${Number(r.servings) || 1}"></label>
   <label>${L('Minuten', 'Minutes')}<input class="feld" name="prepTime" type="number" min="0" max="9999" value="${r.prepTime == null ? '' : Number(r.prepTime)}"></label></div>
   <label class="haken"><input type="checkbox" name="alcohol" ${r.alcohol ? 'checked' : ''}> ${L('enthält Alkohol', 'contains alcohol')}</label>
   <label>${L('Zutaten, eine je Zeile (z. B. „2 cl Limettensaft“)', 'Ingredients, one per line (e.g. “2 cl lime juice”)')}<textarea class="feld" name="ings" rows="6">${esc((r.ings || []).map((z) => [z.amt, z.unit, z.name].filter(Boolean).join(' ')).join('\n'))}</textarea></label>
   <label>${L('Schritte, einer je Zeile', 'Steps, one per line')}<textarea class="feld" name="steps" rows="6">${esc((r.steps || []).map((s) => s.txt).join('\n'))}</textarea></label>
   <label>${L('Notizen', 'Notes')}<textarea class="feld" name="notes" rows="2">${esc(r.notes || '')}</textarea></label>
   <div class="bildwahl"><span class="mini" id="edbild">${r.img ? `<img class="foto" src="${esc(r.img)}" alt="">` : platzbild(r)}</span><label class="knopf hell">${I('image')}${L('Foto wählen', 'Choose photo')}<input type="file" id="edfoto" accept="image/*" hidden></label>${r.img ? `<button type="button" class="knopf hell" data-a="ed-bildweg">${I('trash')}${L('Foto entfernen', 'Remove photo')}</button>` : ''}</div>
   <div class="reihe ende">${neu ? '' : `<button type="button" class="knopf hell rotschrift" data-a="ed-loeschen">${I('trash')}${L('Löschen', 'Delete')}</button>`}<button type="button" class="knopf hell" data-a="fenster-zu">${L('Abbrechen', 'Cancel')}</button><button class="knopf" type="submit">${I('check')}${L('Speichern', 'Save')}</button></div></form>` };
  zeichne();
}
function editorSpeichern(form) {
  const d = new FormData(form), f = Z.fenster, name = String(d.get('name') || '').trim();
  if (!name) return;
  const zeilen = (k) => String(d.get(k) || '').split('\n').map((x) => x.trim()).filter(Boolean);
  const felder = { name, cat: String(d.get('cat') || ''), glass: String(d.get('glass') || ''), temp: String(d.get('temp') || '') || undefined, servings: Math.max(1, Number(d.get('servings')) || 1), prepTime: d.get('prepTime') === '' ? null : Math.max(0, Number(d.get('prepTime')) || 0), alcohol: d.get('alcohol') === 'on', ings: zeilen('ings').map((t, i) => ({ id: i, ck: false, note: '', ...G.zutatAusText(t) })), steps: zeilen('steps').map((t, i) => ({ id: i, txt: t })), notes: String(d.get('notes') || '').trim(), img: f.img || '', modified: Date.now() };
  let r = f.uid && getr(f.uid);
  if (r) Object.assign(r, felder);
  else { r = G.getraenkNormalisieren({ ...felder, id: A.getraenke.reduce((m, x) => Math.max(m, Number(x.id) || 0), 0) + 1, created: Date.now(), uid: G.neueUid(A.knoten) }); A.getraenke.unshift(r); }
  sichern(); Z.fenster = null; Z.uid = r.uid; Z.view = 'getraenk'; Z.port = Number(r.servings) || 1; melde(L('Gespeichert.', 'Saved.'));
}
/* Foto verkleinern: lange Kante höchstens 1600 px, JPEG, ohne Metadaten (die Leinwand trägt keine). */
async function fotoLesen(datei) {
  const bmp = await createImageBitmap(datei), m = Math.min(1, 1600 / Math.max(bmp.width, bmp.height));
  const c = document.createElement('canvas'); c.width = Math.round(bmp.width * m); c.height = Math.round(bmp.height * m);
  c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height); if (bmp.close) bmp.close();
  return c.toDataURL('image/jpeg', 0.86);
}

/* ── Beispiele ── Welche Pakete es gibt, sagt die Ausgabe (Küchen-Kern: ausgaben/<name>/ausgabe.json + KATALOG.json). */
const AUSGABE = 'mixarium-voll'; // die Web-Fassung; die Store-Fassung wird beim Bauen der App mit `mixarium-store` erzeugt
async function paketeLaden() {
  const [a, k] = await Promise.all([fetch(`../ausgaben/${AUSGABE}/ausgabe.json`).then((r) => r.json()), fetch('../beispiele/KATALOG.json').then((r) => r.json())]);
  return (k.pakete || []).filter((p) => a.beispiele.includes(p.id) && (!p.fuer || p.fuer.includes(a.name)) && (a.alkoholErlaubt || !p.alkohol));
}
async function beispieleFenster() {
  Z.fenster = { titel: L('Beispiele laden', 'Load examples'), html: `<p class="ftext">${L('Pakete werden gesucht …', 'Looking for packages …')}</p>` }; zeichne();
  let ps = [];
  try { ps = await paketeLaden(); } catch (e) { Z.fenster.html = `<p class="ftext">${L('Die Paketliste ließ sich nicht laden. Bist du online?', 'The package list could not be loaded. Are you online?')}</p>`; return zeichne(); }
  Z.pakete = ps;
  const zeigbar = ps.filter((p) => !(p.alkohol && ohneAlk())), versteckt = ps.length - zeigbar.length;
  Z.fenster.html = `<p class="ftext">${L('Ein Paket ist eine Sammlung fertiger Getränke. Es wird erst beim Antippen geladen. Beispiele lassen sich in den Einstellungen mit einem Tipp wieder löschen.', 'A package is a set of ready-made drinks. It loads only when you tap it. Examples can be deleted again with one tap in the settings.')}</p>${zeigbar.map((p) => `<button class="slot" data-paket="${esc(p.id)}"><span class="mitte"><strong>${esc(p.titel)}</strong><small>${(p.bytes / 1048576).toFixed(1).replace('.', sprache() === 'de' ? ',' : '.')} MB${p.alkohol ? ' · ' + L('mit Alkohol', 'with alcohol') : ' · ' + L('ohne Alkohol', 'alcohol-free')}</small></span>${I('download')}</button>`).join('') || `<p class="leer">${L('Zurzeit gibt es kein Paket für diese Einstellung.', 'There is no package for this setting at the moment.')}</p>`}${versteckt ? `<p class="hinweis">${I('noalc')}${L(`„Ohne Alkohol“ ist an: ${versteckt} Paket mit Alkohol wird nicht angeboten.`, `“Alcohol-free” is on: ${versteckt} package with alcohol is not offered.`)}</p>` : ''}`;
  zeichne();
}
async function paketEinspielen(id) {
  const p = (Z.pakete || []).find((x) => x.id === id); if (!p) return;
  Z.fenster.html = `<p class="ftext">${L('Paket wird geladen …', 'Loading package …')}</p>`; zeichne();
  try {
    const roh = await fetch('../beispiele/' + p.datei).then((r) => { if (!r.ok) throw new Error(String(r.status)); return r.text(); });
    const e = G.beispielPaketEinspielen(A, roh, p.id, { knoten: A.knoten });
    A = { ...A, ...e.sammlung }; sichern(); Z.fenster = null; Z.view = 'start'; Z.kat = 'all';
    melde(e.neu.length ? L(`${e.neu.length} Beispiele hinzugefügt.`, `${e.neu.length} examples added.`) : L('Diese Beispiele sind schon in deiner Sammlung.', 'These examples are already in your collection.'));
  } catch (err) { Z.fenster.html = `<p class="ftext">${L('Das Paket ließ sich nicht laden.', 'The package could not be loaded.')}</p>`; zeichne(); }
}
function beispieleWeg() {
  const p = G.beispielePruefen(A);
  if (!p.unveraendert.length && !p.veraendert.length) return melde(L('Es sind keine Beispiele in deiner Sammlung.', 'There are no examples in your collection.'));
  const text = L(`${p.unveraendert.length} Beispiele werden gelöscht.`, `${p.unveraendert.length} examples will be deleted.`) + (p.veraendert.length ? ' ' + L(`${p.veraendert.length} hast du verändert (${p.veraendert.map((r) => esc(r.name)).join(', ')}). Sie bleiben stehen und gehören jetzt dir.`, `You changed ${p.veraendert.length} (${p.veraendert.map((r) => esc(r.name)).join(', ')}). They stay and are yours now.`) : '');
  frage(L('Alle Beispiele löschen', 'Delete all examples'), text, L('Löschen', 'Delete'), () => { const e = G.beispieleLoeschen(A, {}); A = { ...A, ...e.sammlung }; sichern(); Z.fenster = null; Z.view = 'start'; Z.uid = null; melde(L(`${e.entfernt.length} Beispiele gelöscht.`, `${e.entfernt.length} examples deleted.`)); }, true);
}

/* ── Sicherung ── Format wie die alte App (version 10), damit beide Richtungen gehen. */
function sicherungText() { return JSON.stringify({ version: G.SICHERUNG_VERSION, exported: new Date().toISOString(), app: 'Mein Mixarium ' + FASSUNG, knoten: A.knoten || undefined, recipes: A.getraenke, folders: A.ordner, menu: A.karten || [], kategorien: (A.kategorien && A.kategorien.neu) || [], einkauf: A.einkauf, anlaesse: A.anlaesse || [] }); }
function sichernDatei() {
  const d = new Date(), p = (n) => String(n).padStart(2, '0');
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([sicherungText()], { type: 'application/json' }));
  a.download = `mein-mixarium-${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}-${p(d.getHours())}h${p(d.getMinutes())}.json`; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  melde(L('Sicherung gespeichert (Ordner „Downloads“).', 'Backup saved (Downloads folder).'));
}
async function einspielenDatei(datei) {
  try {
    const e = G.sicherungEinspielen(A, await datei.text(), { knoten: A.knoten });
    A = { ...A, ...e.sammlung }; sichern(); Z.view = 'start'; Z.kat = 'all';
    const ohne = (e.ohneKategorie || []).length;
    melde(L(`${e.neu.length} Getränke hinzugefügt${e.uebersprungen && e.uebersprungen.length ? `, ${e.uebersprungen.length} waren schon da` : ''}${ohne ? `, ${ohne} ohne Kategorie` : ''}.`, `${e.neu.length} drinks added${e.uebersprungen && e.uebersprungen.length ? `, ${e.uebersprungen.length} already there` : ''}.`));
  } catch (err) { melde(L('Diese Datei ist keine Sicherung, die ich lesen kann.', 'This file is not a backup I can read.')); }
}
async function ausAlterApp(still) {
  const alt = G.ausAlterApp(await Sp.alteAppLesen());
  if (!alt.getraenke.length) { if (!still) melde(L('In der bisherigen App auf diesem Gerät liegen keine Getränke.', 'The previous app on this device holds no drinks.')); return 0; }
  const e = G.zusammenfuehren(A, alt.getraenke, { ordner: alt.ordner, knoten: A.knoten || alt.knoten });
  A = { ...A, ...e.sammlung };
  if (!A.knoten && alt.knoten) A.knoten = alt.knoten;
  if (!(A.karten || []).length) A.karten = alt.karten;
  if (still) { A.kategorien = alt.kategorien; A.einstellungen = { ...A.einstellungen, ...alt.einstellungen }; }
  sichern();
  if (!still || e.neu.length) melde(e.neu.length ? L(`${e.neu.length} Getränke aus der bisherigen App übernommen. Dort bleibt alles, wie es ist.`, `${e.neu.length} drinks taken over from the previous app. Nothing changed there.`) : L('Alles aus der bisherigen App ist schon hier.', 'Everything from the previous app is already here.'));
  return e.neu.length;
}

/* ── Zeichnen ── */
function farbStil() { const f = FARBEN[E.farbe] || FARBEN.blau; return `--k1:${f.k[0]};--k2:${f.k[1]};--k3:${f.k[2]};--schrift:${f.schrift};--pa:${f.akz};--pfl:${f.fl}`; }
function zeichne(frisch) {
  const br = breit(), v = Z.view, mix = v === 'mix';
  const basis = mix ? 'getraenk' : v;
  const h = basis === 'start' ? vStart(br) : basis === 'getraenk' ? vGetraenk(br) : basis === 'einkauf' ? vEinkauf(br) : basis === 'karte' ? vKarte(br) : basis === 'labor' ? vLabor() : vMehr();
  const ohneKopf = !br && basis === 'getraenk', fokus = br && Z.fokus && basis === 'getraenk';
  const alt = $('.haupt'), roll = alt && zeichne.letzte === basis + '|' + Z.uid + '|' + Z.anlass ? alt.scrollTop : 0;
  const such = document.activeElement && document.activeElement.id === 'suche' ? document.activeElement.selectionStart : null;
  $('#app').innerHTML = `<div style="${farbStil()}" class="mx ${br ? 'breit' : 'handy'} fl-${E.fl.seite} ${frisch ? 'frisch' : ''} ${dunkel() ? 'dunkel' : ''} ${E.navZu ? 'navzu' : ''} ${fokus ? 'fokus' : ''}">${ohneKopf ? '<div></div>' : kopf(br)}${br && !fokus ? navLinks() : ''}<main class="haupt" id="haupt">${h}</main>${br || mix ? '' : flLeiste()}${mix ? vMix(br) : ''}${menue()}${fenster()}${Z.toast ? `<div class="mxtoast" role="status">${I('check')}${esc(Z.toast)}</div>` : ''}</div>`;
  zeichne.letzte = basis + '|' + Z.uid + '|' + Z.anlass;
  if (roll) $('.haupt').scrollTop = roll;
  if (such !== null) { const s = $('#suche'); if (s) { s.focus(); s.setSelectionRange(such, such); } }
  document.documentElement.lang = sprache();
  const tc = $('meta[name=theme-color]'); if (tc) tc.content = dunkel() ? '#0a1124' : (FARBEN[E.farbe] || FARBEN.blau).k[1];
  document.body.style.background = dunkel() ? '#0a1124' : '#f3f6fb';
}
function setze(f, frisch) {
  const go = () => { f(); zeichne(frisch); };
  if (document.startViewTransition && !matchMedia('(prefers-reduced-motion: reduce)').matches) document.startViewTransition(go); else go();
}
function geh(v) { history.pushState({ v }, ''); setze(() => { Z.view = v; Z.flAuf = false; Z.menue = null; if (v === 'mix') { Z.step = 0; Z.richt = 'vor'; wachAn(); } if (v !== 'karte') Z.anlass = null; }, true); }
function zurueck() { if (Z.fenster) return fZu(); if (Z.menue) { Z.menue = null; return zeichne(); } if (Z.view === 'mix') return mixZu(); if (Z.view === 'karte' && Z.anlass) return setze(() => { Z.anlass = null; }, true); if (Z.view !== 'start') return setze(() => { Z.view = Z.view === 'getraenk' ? 'start' : 'start'; Z.fokus = false; }, true); }
function oeffne(uid) { const r = getr(uid); if (!r) return; history.pushState({ v: 'getraenk' }, ''); setze(() => { Z.uid = uid; Z.view = 'getraenk'; Z.port = Number(r.servings) || 1; Z.einheit = null; Z.flAuf = false; }, true); }

/* Bildschirm wach halten, solange die Mix-Ansicht offen ist (wo das Gerät es erlaubt). */
let wachSperre = null;
async function wachAn() { try { if (navigator.wakeLock) { wachSperre = await navigator.wakeLock.request('screen'); Z.wach = true; if (Z.view === 'mix') zeichne(); } } catch (e) { Z.wach = false; } }
function wachAus() { try { if (wachSperre) wachSperre.release(); } catch (e) { /* schon frei */ } wachSperre = null; Z.wach = false; }
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && Z.view === 'mix') wachAn(); });
function mixZu() { wachAus(); setze(() => { Z.view = 'getraenk'; Z.step = 0; }, true); }
function schritt(d) { const r = getr(Z.uid), n = Math.max(1, (r.steps || []).length); const neu = Math.min(n - 1, Math.max(0, Z.step + d)); if (neu === Z.step) return; Z.richt = d > 0 ? 'vor' : 'zur'; Z.step = neu; zeichne(); }

/* ── Bedienung ── */
const TUN = {
  alk() { A.einstellungen.ohneAlkohol = !ohneAlk(); const r = getr(Z.uid); if (ohneAlk() && r && G.hatAlkohol(r)) { Z.view = 'start'; Z.uid = null; } if (!kats().some((x) => x.c.id === Z.kat)) Z.kat = 'all'; sichern(); },
  kopf() { Z.kopfAuf = !Z.kopfAuf; Z.menue = null; },
  navzu() { E.navZu = !E.navZu; einstSichern(); },
  menue(b) { Z.menue = Z.menue === b.dataset.m ? null : b.dataset.m; Z.flAuf = false; },
  'fl-auf'() { if (Date.now() - flGezogen < 500) return; Z.flAuf = true; },
  'fl-zu'() { Z.flAuf = false; },
  oben() { Z.flAuf = false; setTimeout(() => $('.haupt').scrollTo({ top: 0, behavior: 'smooth' })); },
  zurueck() { Z.flAuf = false; history.back(); return false; },
  fokus() { Z.fokus = !Z.fokus; },
  mixkopf() { Z.mixKopf = !Z.mixKopf; },
  'mix-zu'() { history.back(); return false; },
  sv() { schritt(1); return false; }, sz() { schritt(-1); return false; },
  fertig() { history.back(); setTimeout(() => melde(L('Fertig. Zum Wohl!', 'Done. Cheers!')), 60); return false; },
  plus() { Z.port = Math.min(99, Z.port + 1); }, minus() { Z.port = Math.max(1, Z.port - 1); },
  mixgr() { E.mixGr = (E.mixGr + 1) % 3; einstSichern(); },
  einheit() { const f = ['auto', 'orig', 'ml', 'cl', 'oz']; E.einheit = f[(f.indexOf(E.einheit) + 1) % f.length]; Z.einheit = null; einstSichern(); },
  neu() { Z.flAuf = false; editor(null); return false; },
  bearbeiten() { editor(getr(Z.uid)); return false; },
  'ed-bildweg'() { Z.fenster.img = ''; $('#edbild').innerHTML = platzbild({ name: 'x' }); return false; },
  'ed-loeschen'() { const r = getr(Z.fenster.uid); frage(L('Getränk löschen', 'Delete drink'), L(`„${esc(r.name)}“ wird aus deiner Sammlung entfernt.`, `“${esc(r.name)}” will be removed from your collection.`), L('Löschen', 'Delete'), () => { A.getraenke = A.getraenke.filter((x) => x.uid !== r.uid); (A.anlaesse || []).forEach((a) => { a.posten = a.posten.filter((p) => p.uid !== r.uid); }); sichern(); Z.fenster = null; Z.view = 'start'; Z.uid = null; melde(L('Gelöscht.', 'Deleted.')); }, true); return false; },
  'fenster-zu'() { Z.fenster = null; }, 'fenster-ja'() { const f = Z.fenster; if (f && f.ja) f.ja(); return false; },
  'einkauf-dazu'() { const r = getr(Z.uid); einkaufDazu(r, Z.port, r.name); sichern(); melde(L('Zutaten stehen auf der Einkaufsliste.', 'Ingredients are on the shopping list.')); return false; },
  'einkauf-erledigt'() { A.einkauf = A.einkauf.filter((p) => !p.ok); sichern(); },
  'einkauf-leeren'() { frage(L('Liste leeren', 'Clear list'), L('Alle Posten werden entfernt.', 'All items will be removed.'), L('Leeren', 'Clear'), () => { A.einkauf = []; sichern(); fZu(); }, true); return false; },
  'einkauf-teilen'() { teilen(L('Einkaufsliste', 'Shopping list'), GRP.map(([g, n]) => { const l = A.einkauf.filter((p) => !p.ok && gruppeVon(p.name) === g); return l.length ? L(...n) + '\n' + l.map((p) => '– ' + (p.wert !== null ? zahl(G.zahlFormatieren(p.wert)) + (p.unit ? ' ' + p.unit : '') : [p.text, p.unit].filter(Boolean).join(' ')) + ' ' + p.name).join('\n') : ''; }).filter(Boolean).join('\n\n')); return false; },
  teilen() { const r = getr(Z.uid); teilen(r.name, r.name + '\n\n' + zutatenVon(r).map((z) => '– ' + [mengeText(z), z.name].filter(Boolean).join(' ')).join('\n') + '\n\n' + (r.steps || []).map((s, i) => `${i + 1}. ${s.txt}`).join('\n')); return false; },
  bildvoll() { const r = getr(Z.uid); Z.fenster = { titel: r.name, html: `<div class="bildgross">${bild(r)}</div>` }; },
  beispiele() { beispieleFenster(); return false; }, 'beispiele-weg'() { beispieleWeg(); return false; },
  sichern() { sichernDatei(); return false; },
  einspielen() { $('#datei').click(); return false; },
  uebernehmen() { ausAlterApp(false).then(() => zeichne(true)); return false; },
  leeren() { Z.fenster = { titel: L('Sammlung leeren', 'Empty the collection'), html: `<p class="ftext">${L('Das entfernt alle Getränke, Getränkekarten und die Einkaufsliste aus dieser App. Einstellungen bleiben. Speichere vorher eine Sicherung, dann kannst du alles wieder einspielen.', 'This removes all drinks, drinks lists and the shopping list from this app. Settings stay. Save a backup first, then you can restore everything.')}</p><div class="reihe ende"><button class="knopf hell" data-a="fenster-zu">${L('Abbrechen', 'Cancel')}</button><button class="knopf hell" data-a="sichern">${I('download')}${L('Erst sichern', 'Back up first')}</button><button class="knopf rot" data-a="fenster-ja">${L('Jetzt leeren', 'Empty now')}</button></div>`, ja() { const e = G.sammlungLeeren(A); A = { ...e.sammlung, anlaesse: [] }; sichern(); Z.fenster = null; Z.view = 'start'; Z.uid = null; Z.kat = 'all'; melde(L(`${e.entfernt.getraenke} Getränke entfernt. Die App ist leer.`, `${e.entfernt.getraenke} drinks removed. The app is empty.`)); } }; },
  ueber() { Z.fenster = { titel: 'Mein Mixarium', html: `<p class="ftext">${L(`Fassung ${FASSUNG}. Das ist die neue Gestaltung zum Ansehen und Beurteilen. Deine Daten liegen nur auf diesem Gerät. Ohne dein Zutun geht nichts ins Netz: geladen wird nur, wenn du ein Beispielpaket antippst.`, `Version ${FASSUNG}. This is the new design to look at and judge. Your data stays on this device only. Nothing goes online without you: something loads only when you tap an example package.`)}</p>` }; },
  'anlass-neu'() { anlassFenster(null); return false; }, 'anlass-bearbeiten'() { anlassFenster(A.anlaesse.find((x) => x.id === Z.anlass)); return false; },
  'anlass-zu'() { Z.anlass = null; },
  'anlass-weg'() { const an = A.anlaesse.find((x) => x.id === Z.anlass); frage(L('Getränkekarte löschen', 'Delete drinks list'), L(`„${esc(an.titel)}“ wird entfernt. Die Getränke selbst bleiben.`, `“${esc(an.titel)}” will be removed. The drinks themselves stay.`), L('Löschen', 'Delete'), () => { A.anlaesse = A.anlaesse.filter((x) => x.id !== an.id); Z.anlass = null; sichern(); fZu(); }, true); return false; },
  'anlass-einkauf'() { const an = A.anlaesse.find((x) => x.id === Z.anlass); let n = 0; for (const p of an.posten) { const r = getr(p.uid); if (r) { einkaufDazu(r, p.anzahl, an.titel); n++; } } sichern(); melde(n ? L('Alles steht auf der Einkaufsliste.', 'Everything is on the shopping list.') : L('Auf dieser Karte ist noch kein Getränk.', 'There is no drink on this list yet.')); return false; },
  'posten-neu'() { postenFenster(); return false; },
  'posten-plus'(b) { const p = postenVon(b); p.anzahl = Math.min(999, p.anzahl + 1); sichern(); }, 'posten-minus'(b) { const p = postenVon(b); p.anzahl = Math.max(1, p.anzahl - 1); sichern(); },
  'posten-weg'(b) { const an = A.anlaesse.find((x) => x.id === Z.anlass); an.posten = an.posten.filter((p) => String(p.id) !== b.dataset.p); sichern(); },
  drucken() { print(); return false; },
};
const postenVon = (b) => A.anlaesse.find((x) => x.id === Z.anlass).posten.find((p) => String(p.id) === b.dataset.p);
function anlassFenster(an) {
  Z.fenster = { titel: an ? L('Getränkekarte bearbeiten', 'Edit drinks list') : L('Neue Getränkekarte', 'New drinks list'), anlass: an ? an.id : null, html: `<form id="anform" class="felder" autocomplete="off"><label>${L('Anlass', 'Occasion')}<input class="feld" name="titel" required value="${esc(an ? an.titel : '')}" placeholder="${L('z. B. Sommerabend bei Oma', 'e.g. Summer evening at Grandma’s')}"></label><div class="zweier"><label>${L('Wann', 'When')}<input class="feld" name="datum" value="${esc(an ? an.datum || '' : '')}" placeholder="${L('z. B. Sa 29.11., 18 Uhr', 'e.g. Sat 29 Nov, 6 pm')}"></label><label>${L('Gäste', 'Guests')}<input class="feld" name="gaeste" type="number" min="0" max="999" value="${an && an.gaeste ? Number(an.gaeste) : ''}"></label></div><div class="reihe ende"><button type="button" class="knopf hell" data-a="fenster-zu">${L('Abbrechen', 'Cancel')}</button><button class="knopf" type="submit">${I('check')}${L('Speichern', 'Save')}</button></div></form>` }; zeichne();
}
function postenFenster() {
  const l = G.filterOhneAlkohol(A.getraenke, ohneAlk()).filter(G.istSichtbar), an = A.anlaesse.find((x) => x.id === Z.anlass);
  Z.fenster = { titel: L('Getränk hinzufügen', 'Add drink'), html: `<div class="felder"><label>${L('Abschnitt', 'Section')}<select class="feld" id="pabschnitt">${ABSCHNITTE.map(([de, en], i) => `<option value="${i}">${L(de, en)}</option>`).join('')}</select></label></div><div class="wahl">${l.map((r) => `<button class="zeile" data-posten="${esc(r.uid)}"><span class="mini">${bild(r)}</span><span><strong>${esc(r.name)}</strong><small>${esc(katNameVon(r))}</small></span></button>`).join('') || `<p class="leer">${L('Noch keine Getränke in der Sammlung.', 'No drinks in the collection yet.')}</p>`}</div>`, gaeste: an.gaeste }; zeichne();
}
async function teilen(titel, text) {
  try { if (navigator.share) { await navigator.share({ title: titel, text }); return; } } catch (e) { if (e && e.name === 'AbortError') return; }
  try { await navigator.clipboard.writeText(text); melde(L('In die Zwischenablage kopiert.', 'Copied to the clipboard.')); } catch (e) { Z.fenster = { titel, html: `<textarea class="feld" rows="12" readonly>${esc(text)}</textarea>` }; zeichne(); }
}

document.addEventListener('click', (ev) => {
  const b = ev.target.closest('button,[data-a]');
  if (Z.menue && !(ev.target.closest('.sprachmenue,.farbmenue') || (b && b.dataset.a === 'menue'))) { Z.menue = null; zeichne(); if (!b) return; }
  if (Z.flAuf && !ev.target.closest('.fl-leiste')) { Z.flAuf = false; zeichne(); if (!b) return; }
  if (!b) return;
  const d = b.dataset;
  if (d.a === 'fenster-zu-aussen') { if (ev.target === b) fZu(); return; }
  if (d.lang !== undefined) { E.sprache = d.lang || null; Z.menue = null; einstSichern(); return zeichne(true); }
  if (d.farbe) { E.farbe = d.farbe; einstSichern(); return zeichne(); }
  if (d.ton) { E.ton = d.ton; einstSichern(); return zeichne(); }
  if (d.go) return geh(d.go);
  if (d.d) { if (Z.fenster) Z.fenster = null; return oeffne(d.d); }
  if (d.kat) return setze(() => { Z.kat = d.kat; }, true);
  if (d.e) return setze(() => { Z.einheit = d.e; });
  if (d.h) { const p = A.einkauf.find((x) => String(x.id) === d.h); p.ok = !p.ok; Z.pop = p.ok ? p.id : null; sichern(); zeichne(); Z.pop = null; return; }
  if (d.paket) return paketEinspielen(d.paket);
  if (d.anlass) { history.pushState({ v: 'karte' }, ''); return setze(() => { Z.anlass = Number(d.anlass); }, true); }
  if (d.posten) { const an = A.anlaesse.find((x) => x.id === Z.anlass), r = getr(d.posten); an.posten.push({ id: Date.now(), uid: r.uid, abschnitt: Number($('#pabschnitt').value) || 0, anzahl: Math.max(1, Number(an.gaeste) || Number(r.servings) || 1) }); sichern(); return fZu(); }
  const f = TUN[d.a]; if (!f) return;
  if (f(b) !== false) zeichne();
});
document.addEventListener('submit', (ev) => {
  ev.preventDefault();
  if (ev.target.id === 'ed') return editorSpeichern(ev.target);
  if (ev.target.id === 'anform') { const d = new FormData(ev.target), titel = String(d.get('titel') || '').trim(); if (!titel) return; A.anlaesse = A.anlaesse || []; let an = A.anlaesse.find((x) => x.id === Z.fenster.anlass); if (!an) { an = { id: Date.now(), posten: [] }; A.anlaesse.unshift(an); } Object.assign(an, { titel, datum: String(d.get('datum') || '').trim(), gaeste: Number(d.get('gaeste')) || 0 }); Z.anlass = an.id; Z.fenster = null; sichern(); zeichne(true); }
});
document.addEventListener('input', (ev) => { if (ev.target.id === 'suche') { Z.suche = ev.target.value; const o = $('#kartenort'); if (o) o.innerHTML = kartenHtml(); else if (Z.view !== 'start') { Z.view = 'start'; zeichne(); } const n = $('.kopf .name small'); if (n) { const z = sichtbar().length; n.textContent = `${z} ${z === 1 ? L('Getränk', 'drink') : L('Getränke', 'drinks')}`; } } });
document.addEventListener('change', async (ev) => {
  if (ev.target.id === 'edfoto' && ev.target.files[0]) { try { Z.fenster.img = await fotoLesen(ev.target.files[0]); $('#edbild').innerHTML = `<img class="foto" src="${Z.fenster.img}" alt="">`; } catch (e) { melde(L('Dieses Bild ließ sich nicht lesen.', 'This picture could not be read.')); } }
  if (ev.target.id === 'datei' && ev.target.files[0]) { await einspielenDatei(ev.target.files[0]); ev.target.value = ''; zeichne(true); }
});
document.addEventListener('keydown', (ev) => {
  if (ev.key === 'Escape') { if (Z.fenster || Z.menue) return zurueck(); if (Z.view === 'mix') return history.back(); if (Z.flAuf) { Z.flAuf = false; return zeichne(); } }
  if (Z.view === 'mix' && !Z.fenster) { if (ev.key === 'ArrowRight') schritt(1); if (ev.key === 'ArrowLeft') schritt(-1); }
});
addEventListener('popstate', () => zurueck());
let wx = null; document.addEventListener('touchstart', (ev) => { wx = Z.view === 'mix' && ev.target.closest('.mix') && !ev.target.closest('button') ? ev.touches[0].clientX : null; }, { passive: true });
document.addEventListener('touchend', (ev) => { if (wx === null) return; const dx = ev.changedTouches[0].clientX - wx; wx = null; if (Math.abs(dx) > 50) schritt(dx < 0 ? 1 : -1); });
let breitWar = null; addEventListener('resize', () => { if (breit() !== breitWar) { breitWar = breit(); zeichne(); } });
matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => zeichne());

/* Fliegende Leiste ziehen: langer Druck oder Ziehen; rastet links, rechts (Höhe frei) oder unten (Stelle frei) ein. Wie Private Akte. */
let flZug = null, flGezogen = 0;
document.addEventListener('pointerdown', (ev) => { const g = ev.target.closest && ev.target.closest('.fl-griff'); if (!g) return; flZug = { x: ev.clientX, y: ev.clientY, weit: false, el: g.closest('.fl-leiste'), uhr: setTimeout(() => { if (flZug) { flZug.weit = true; flZug.el.classList.add('zieht'); } }, 450) }; try { g.setPointerCapture(ev.pointerId); } catch (e) { /* geht auch ohne */ } });
document.addEventListener('pointermove', (ev) => { if (!flZug) return; if (!flZug.weit && Math.hypot(ev.clientX - flZug.x, ev.clientY - flZug.y) < 10) return; flZug.weit = true; const el = flZug.el; el.classList.add('zieht', 'frei'); el.classList.remove('links', 'unten'); const px = ev.clientX / innerWidth, py = ev.clientY / innerHeight; el.style.left = px * 100 + '%'; el.style.top = py * 100 + '%'; if (py > 0.86) { E.fl.seite = 'u'; E.fl.oben = Math.round(Math.min(92, Math.max(8, px * 100))); } else { E.fl.seite = px < 0.5 ? 'l' : 'r'; E.fl.oben = Math.round(Math.min(92, Math.max(8, py * 100))); } });
const flLos = () => { if (!flZug) return; const w = flZug.weit; clearTimeout(flZug.uhr); flZug = null; if (w) { flGezogen = Date.now(); einstSichern(); zeichne(); } };
document.addEventListener('pointerup', flLos); document.addEventListener('pointercancel', flLos);
document.addEventListener('contextmenu', (ev) => { if (ev.target.closest && ev.target.closest('.fl-griff')) ev.preventDefault(); });

/* ── Start ── */
async function start() {
  try { const e = await Sp.lesen('einst'); if (e) E = { ...E, ...e, fl: { ...E.fl, ...(e.fl || {}) } }; A = await Sp.lesen('sammlung'); } catch (e) { A = null; }
  const erster = !A;
  if (!A) A = G.leereSammlung();
  A.einkauf = A.einkauf || []; A.anlaesse = A.anlaesse || []; A.einstellungen = A.einstellungen || { ohneAlkohol: false, sprache: null };
  breitWar = breit();
  zeichne(true);
  $('#start').remove();
  if (erster) { try { await ausAlterApp(true); } catch (e) { /* nichts Altes da */ } sichern(); zeichne(true); Sp.dauerhaft(); }
  if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('./sw.js').catch(() => {});
}
start();
/* Für Proben: der Zustand ist von außen lesbar, nicht mehr. */
window.__mixarium = { get sammlung() { return A; }, get zustand() { return Z; }, get einstellungen() { return E; }, FASSUNG };
