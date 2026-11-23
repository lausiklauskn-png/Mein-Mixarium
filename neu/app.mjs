/* Mein Mixarium – neue Fassung (PWA). Oberfläche nach docs/vorschau/mixarium-neu.html, von Klaus am 23.11.2026 abgenommen.
   Getränke-Logik: ../getraenke/ (mit Proben). Alles unter ./vorlaeufig/ und die Oberfläche hier sind VORLÄUFIG und werden
   gegen den Küchen-Kern aus Mein Rezeptbuch getauscht, sobald er sie liefert (siehe README.md).
   Die alte App (../index.html) und ihre Daten werden nur gelesen, nie geändert. */
import * as G from '../getraenke/index.mjs';
import { sym as I } from './getraenke-symbole.mjs';
import { platzbild } from './platzbild.mjs';
import { alteAppLesen, vorabLesen } from './alt.mjs';
import { speicher } from '../kern/speicher/speicher.mjs';
import { tresor } from '../kern/speicher/tresor.mjs';
import { FARBEN, TOENE, istDunkel, farbeSetzen, farbName as kernFarbName, tonName } from '../kern/oberflaeche/farben.mjs';
import { schriftWert, schriftSetzen, schriftRegler } from '../kern/oberflaeche/schrift.mjs';
import { bildAusDatei } from '../kern/oberflaeche/bild.mjs';
import { kiBild, gratisBild, KOSTEN } from '../kern/ki/bild.mjs';
import { sicht as kernSicht } from '../kern/modell/rezept.mjs';
import { diktat, diktatAus, diktatMoeglich } from '../kern/oberflaeche/diktat.mjs';
import { kategorienMit, beschriftung as katBeschr, anzahl as katZahl, anlegen as katAnlegen, umbenennen as katUmbenennen, KATEGORIEN_FEST, katBild, bildWaehlen } from '../kern/modell/kategorien.mjs';
import { katVonRezept, KAT_OHNE } from '../kern/modell/rezept.mjs';
import { einkaufMit } from '../kern/modell/einkauf.mjs';
import { rezeptAusText } from '../kern/import/text.mjs';
import { woche, tagIso, planen, entplanen, ausAltemMenu } from '../kern/modell/plan.mjs';
import { ladeBausteine, korpus as semKorpus, sucheBedeutung } from '../kern/suche/bedeutung.mjs';
import * as LAB from '../getraenke/labor.mjs';
import { hinweiseEinrichten } from '../kern/oberflaeche/hinweis.mjs';
import { wartenEinrichten, modellFortschritt, bytesMitAnteil } from '../kern/oberflaeche/warten.mjs';

/* Kategorien und Einkauf aus dem Küchen-Kern (ab 10.0.0-vor8), mit den Getränke-Kategorien und -Warengruppen dieser Ausgabe.
   Eine mitgebrachte Kennung (z. B. „vorsp“ aus einem Rezeptbuch-Paket) trägt den Namen aus der Familie, nie die rohe Kennung. */
const K = kategorienMit(G.KATEGORIEN, { familie: KATEGORIEN_FEST });
const EK = einkaufMit({ gruppen: G.GETRAENKE_WARENGRUPPEN, einheiten: G.GETRAENKE_EINKAUF_EINHEITEN });

/* Kern-Speicher: eine Datenbank für das Mixarium (beide Ausgaben teilen die Sammlung nicht – Web und App sind getrennte Orte). */
const lager = speicher('KuechenKern-mixarium'), tr = tresor(lager);

export const FASSUNG = '10.0.0-vor19';
const $ = (s, w = document) => w.querySelector(s);
const esc = (t) => String(t == null ? '' : t).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/* Wasserfarben des Familienbüros, wie in der Private Akte. */
/* Farben, Ton (hell/dunkel) und Schrift-Regler kommen aus dem Küchen-Kern. Englische Farbnamen hat der Kern nicht; sie stehen hier. */
const farbName = (k) => kernFarbName(FARBEN[k] ? k : 'blau', sprache());   // Namen de/en stehen seit Kern 0.11 im Kern
const SPRACHEN = [['de', 'Deutsch'], ['en', 'English'], ['es', 'Español'], ['fr', 'Français'], ['it', 'Italiano'], ['pt', 'Português'], ['ru', 'Русский'], ['zh', '中文']];
const NAV = [['start', ['Getränke', 'Drinks'], 'drinks'], ['karte', ['Karte', 'Drinks list'], 'plan'], ['einkauf', ['Einkauf', 'Shopping'], 'cart'], ['labor', ['Labor', 'Lab'], 'lab'], ['mehr', ['Einstellungen', 'Settings'], 'settings']];
const KAT_SYM = { all: 'drinks', mock: 'drinks', afckt: 'drinks', ckt: 'wine', smooth: 'glass', limo: 'citrus', tee: 'coffee', sirup: 'drop', bowle: 'users', knab: 'box', finger: 'box' };

/* ── Zustand ── E: Einstellungen des Geräts · A: die Sammlung · Z: was gerade zu sehen ist (flüchtig) */
let E = { sprache: null, farbe: 'blau', ton: 'geraet', schrift: 100, einheit: 'auto', fl: { seite: 'r', oben: 64 }, navZu: true };
let A = null;
const Z = { lab: { kat: 'mock', geschmack: [], zutaten: '', entwurf: null, laeuft: false, fehler: '', entfernteAuf: false }, planTag: new Date(), bilder: { gross: false, filter: 'alle', wahl: new Set() }, view: 'start', uid: null, step: 0, port: 1, einheit: null, kat: 'all', suche: '', kopfAuf: false, flAuf: false, fokus: false, mixKopf: true, menue: null, fenster: null, toast: '', anlass: null, willkommen: false, pakete: null };

const sprache = () => E.sprache || (A && A.einstellungen && A.einstellungen.sprache) || ((navigator.language || 'de').slice(0, 2));
const L = (de, en) => (sprache() === 'de' ? de : en);
const dunkel = () => istDunkel(E.farbe, E.ton);
const breit = () => innerWidth >= 1000;
const ohneAlk = () => !!(A.einstellungen && A.einstellungen.ohneAlkohol);
const lage = () => ({ getraenke: G.filterOhneAlkohol(A.getraenke, ohneAlk()), ordner: A.ordner, kategorien: A.kategorien, sprache: sprache() });
/* Freie Glas-Angaben (TheCocktailDB schreibt „Collins glass“, „Highball glass“) lesbar und in der Sprache zeigen. */
const GLAS_FREI = [[/highball/i, 'highball'], [/martini|cocktail|coupe/i, 'martini'], [/wine|wein/i, 'wine'], [/shot/i, 'shot'], [/mug|cup|tasse|becher/i, 'mug'], [/old.fashioned|tumbler|rocks|whiskey/i, 'tumbler']];
const glasText = (g) => { const n = G.glasName(g, sprache()); if (n !== g) return n; const t = String(g); const m = GLAS_FREI.find(([re]) => re.test(t)); if (m) return G.glasName(m[1], sprache()); if (/collins/i.test(t)) return L('Collins-Glas', 'Collins glass'); if (/^jar$/i.test(t)) return L('Einmachglas', 'Jar'); return t.charAt(0).toUpperCase() + t.slice(1); };
/* Übersetzung am Getränk zeigen (auch Deutsch): aus dem Küchen-Kern, `sicht(r, sprache)`. Ersetzt wird nur, wenn die Zahl der
   Zutaten und Schritte passt; bearbeitet wird immer das Original. */
const sicht = (r) => (r ? kernSicht(r, sprache()) : r);
const getr = (uid) => A.getraenke.find((r) => r.uid === uid) || null;
const zahl = (t) => (sprache() === 'de' ? String(t).replace('.', ',') : String(t));

let speicherUhr = 0;
function sichern() { clearTimeout(speicherUhr); speicherUhr = setTimeout(() => { lager.schreibe(A).catch(() => melde(L('Speichern ist fehlgeschlagen. Bitte eine Sicherung anlegen.', 'Saving failed. Please make a backup.'))); }, 150); }
function einstSichern() { lager.setz('einst', E).catch(() => {}); }
function melde(t) { Z.toast = t; zeichne(); clearTimeout(melde.uhr); melde.uhr = setTimeout(() => { Z.toast = ''; const o = $('.mxtoast'); if (o) o.remove(); }, 2600); }

/* ── Auswahl ── */
function sichtbar() {
  const q = Z.suche.trim().toLowerCase();
  return G.filterOhneAlkohol(A.getraenke, ohneAlk()).filter((r) => G.istSichtbar(r)
    && (Z.kat === 'all' || katVonRezept(r) === Z.kat)
    && (!q || String(r.name).toLowerCase().includes(q) || (r.ings || []).some((z) => String(z.name).toLowerCase().includes(q)) || (r.tags || []).some((t) => String(t).toLowerCase().includes(q))));
}
function kats() { const gl = G.filterOhneAlkohol(A.getraenke, ohneAlk()); return K.alleKategorien(gl, A.kategorien).map((c) => ({ c, n: katZahl(gl, c.id) })).filter((x) => x.n > 0); }
const katText = (c) => katBeschr(c, sprache(), A.kategorien);
const katNameVon = (r) => { const id = katVonRezept(r); const c = K.alleKategorien(A.getraenke, A.kategorien).find((x) => x.id === id); return c ? katText(c) : (id === KAT_OHNE ? L('Ohne Kategorie', 'No category') : id); };
/* Zeichen einer Kategorie: ein selbst gewähltes Emoji, sonst das gezeichnete Symbol. */
const katZeichen = (c) => { const e = (A.kategorien.namen && A.kategorien.namen[c.id] && A.kategorien.namen[c.id].emoji) || c.emoji; return e ? `<span class="kemoji" aria-hidden="true">${esc(e)}</span>` : I(KAT_SYM[c.id] || (c.art === 'ohne' ? 'frage' : c.art === 'unbekannt' ? 'paket' : 'box')); };
/* Sticker einer Kategorie (Klaus 23.11.: „kleine Bilderchen sprechen mehr als Emojis … wie kleine Sticker“): ein Foto aus der
   EIGENEN Kategorie (gewählt, sonst das erste mit Bild), sonst das Zeichen. Der Name steht immer darunter. */
const katSticker = (c, liste = A.getraenke) => {
  const b = katBild(liste, A.kategorien, c.id); if (b) return `<img class="sticker" src="${esc(b.img)}" alt="" loading="lazy">`;   // 1. Foto aus der Kategorie
  if ((A.kategorien.namen[c.id] && A.kategorien.namen[c.id].emoji) || c.emoji) return katZeichen(c);                                             // 2. selbst gewähltes Zeichen
  const r = liste.find((x) => G.istSichtbar(x) && katVonRezept(x) === c.id);                                                          // 3. das gezeichnete Bild des ersten Getränks
  return r ? `<span class="sticker gezeichnet" aria-hidden="true">${platzbild(r)}</span>` : katZeichen(c);                            // 4. Zeichen
};
/* Eine Form für alle Wege herein (Start, Einspielen, Tresor, Übernahme): Kategorie-Zustand im Kern-Format; ein altes
   cat: "fld_…" ist ein Ordner und zieht nach `folder` (Familien-Regel: ein Ordner frisst die Kategorie nicht). */
function inForm() {
  if (!A) return;
  A.kategorien = G.katZustandZuKern(A.kategorien);
  for (const r of A.getraenke || []) if (typeof r.cat === 'string' && r.cat.startsWith('fld_')) { if (!r.folder) r.folder = r.cat.slice(4); r.cat = ''; }
  if (!A.plan || typeof A.plan !== 'object' || Array.isArray(A.plan)) A.plan = {};
  /* Wochenplan der alten App EINMAL in die Kern-Form (A.karten bleibt unberührt). Gemerkt wird, DASS übernommen wurde – nicht nur,
     dass es einen Plan gibt: beim ersten Start zeichnet die App, bevor sie die alten Daten gelesen hat. */
  if (!A.planUebernommen && (A.karten || []).length && (A.getraenke || []).length) { const alt = ausAltemMenu(A.karten, A.getraenke); for (const [tag, l] of Object.entries(alt)) for (const u of l) A.plan = planen(A.plan, tag, u); A.planUebernommen = true; }
  A.einkaufLaeden = A.einkaufLaeden && A.einkaufLaeden.laeden ? A.einkaufLaeden : { laeden: { [L('Supermarkt', 'Supermarket')]: [] }, laden: L('Supermarkt', 'Supermarket') };
}

/* ── Bausteine ── */
function bild(r, klasse = '') {
  if (r.img) { const c = r.imgCrop || {}; return `<img class="foto ${klasse}" src="${esc(r.img)}" alt="" loading="lazy" decoding="async" style="object-position:${Number(c.x) >= 0 ? Number(c.x) : 50}% ${Number(c.y) >= 0 ? Number(c.y) : 50}%">`; }
  return platzbild(r);
}
function logo() { return `<svg class="logo" viewBox="0 0 64 64" aria-hidden="true"><defs><linearGradient id="lg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#5b8cff"/><stop offset="1" stop-color="#6b3fc4"/></linearGradient></defs><path d="M25 6h14v4h-2v14l15 24a6 6 0 0 1-5 9H17a6 6 0 0 1-5-9l15-24V10h-2z" fill="rgba(91,140,255,.16)" stroke="url(#lg)" stroke-width="3" stroke-linejoin="round"/><path d="M17 44c8-6 14 4 30-2l4 6a5 5 0 0 1-4 7H17a5 5 0 0 1-4-7z" fill="url(#lg)"/><path d="M52 6l1.6 4.4L58 12l-4.4 1.6L52 18l-1.6-4.4L46 12l4.4-1.6z" fill="#5b8cff"/></svg>`; }
/* Spracheingabe (Küchen-Kern, `diktat`): nur wo der Browser sie kann. Der Ton geht zur Erkennung an den Dienst des Browsers. */
const mikro = (ziel) => (diktatMoeglich() ? `<button type="button" class="mikro" data-a="diktat" data-ziel="${ziel}" aria-pressed="false" aria-label="${L('Diktieren', 'Dictate')}" title="${L('Diktieren', 'Dictate')}">${I('mic')}</button>` : '');
function suchfeld(voll) { return `<label class="suchfeld" ${voll ? 'style="width:100%;margin-top:12px"' : ''}>${I('search')}<input id="suche" type="search" value="${esc(Z.suche)}" placeholder="${L('Getränk oder Zutat suchen', 'Search drink or ingredient')}" aria-label="${L('Suchen', 'Search')}" autocomplete="off">${mikro('#suche')}<button type="button" class="sinn" data-a="sinn" aria-pressed="${!!E.sinn}" aria-label="${L('Sinn-Suche: auch nach Bedeutung suchen', 'Meaning search: also search by meaning')}" title="${L('Sinn-Suche', 'Meaning search')}">${I('sparkle')}</button></label>`; }
function kopf(br) {
  const auf = Z.kopfAuf, n = sichtbar().length;
  /* Aufgeklappt bleibt der Kopf EINE Zeile (Klaus 23.11.): am Handy weicht der Name, die Werkzeuge sind nur Symbole. */
  const alk = br ? `<button class="schalter ${ohneAlk() ? '' : 'aus'}" data-a="alk" aria-pressed="${ohneAlk()}">${I('noalc')}${ohneAlk() ? L('Ohne Alkohol', 'Alcohol-free') : L('Alkohol an', 'Alcohol on')}</button>` : `<button class="alkmini ${ohneAlk() ? '' : 'aus'}" data-a="alk" aria-pressed="${ohneAlk()}" aria-label="${L('Ohne Alkohol', 'Alcohol-free')}" title="${L('Ohne Alkohol', 'Alcohol-free')}">${I('noalc')}</button>`;
  const werk = `${alk}<button class="rund schriftknopf" data-a="menue" data-m="schrift" aria-label="${L('Schriftgröße', 'Text size')}" title="${L('Schriftgröße', 'Text size')}"><span aria-hidden="true">A<b>A</b></span></button><button class="rund" data-a="menue" data-m="sprache" aria-label="${L('Sprache', 'Language')}" title="${L('Sprache', 'Language')}">${I('lang')}</button><button class="rund farbknopf" data-a="menue" data-m="farbe" aria-label="${L('Farbe', 'Colour')}" title="${L('Farbe', 'Colour')}"></button><button class="rund" data-go="mehr" aria-label="${L('Einstellungen', 'Settings')}" title="${L('Einstellungen', 'Settings')}">${I('settings')}</button>`;
  const mini = ohneAlk() ? `<button class="alkmini" data-a="alk" aria-pressed="true" aria-label="${L('Ohne Alkohol ist an', 'Alcohol-free is on')}" title="${L('Ohne Alkohol', 'Alcohol-free')}">${I('noalc')}</button>` : '';
  const name = !br && auf ? '<span class="name"></span>' : `<div class="name">Mein Mixarium<small>${n} ${n === 1 ? L('Getränk', 'drink') : L('Getränke', 'drinks')}</small></div>`;
  return `<header class="kopf ${auf ? 'auf' : ''}">${logo()}${name}${br ? suchfeld(false) : ''}${auf ? werk : mini}<button class="rund neu" data-a="neu" aria-label="${L('Neues Getränk', 'New drink')}" title="${L('Neues Getränk', 'New drink')}">${I('plus')}</button><button class="klapp" data-a="kopf" aria-expanded="${auf}" aria-label="${auf ? L('Werkzeuge einklappen', 'Collapse tools') : L('Werkzeuge aufklappen', 'Expand tools')}">${I(auf ? 'right' : 'left')}</button></header>`;
}
function navLinks() {
  const akt = Z.view === 'getraenk' ? 'start' : Z.view === 'plan' ? 'karte' : Z.view, zu = E.navZu;
  return `<nav class="nav ${zu ? 'zu' : ''}" aria-label="${L('Bereiche', 'Sections')}">${NAV.map(([v, n, i]) => `<button data-go="${v}" ${akt === v ? 'aria-current="page"' : ''} ${zu ? `aria-label="${L(...n)}" title="${L(...n)}"` : ''}>${I(i)}<span>${L(...n)}</span></button>`).join('')}<button class="navgriff" data-a="navzu" aria-expanded="${!zu}" aria-label="${zu ? L('Leiste aufklappen', 'Expand bar') : L('Leiste einklappen', 'Collapse bar')}">${I(zu ? 'right' : 'left')}</button></nav>`;
}
function flLeiste() {
  const f = E.fl, akt = Z.view === 'getraenk' ? 'start' : Z.view === 'plan' ? 'karte' : Z.view;
  const cls = `fl-leiste ${f.seite === 'l' ? 'links' : ''} ${f.seite === 'u' ? 'unten' : ''}`;
  const ort = f.seite === 'u' ? `left:${Z.flAuf ? 50 : f.oben}%` : `top:${Z.flAuf ? Math.min(66, Math.max(34, f.oben)) : f.oben}%`;
  if (!Z.flAuf) return `<aside class="${cls}" style="${ort}"><button class="fl-griff" data-a="fl-auf" aria-label="${L('Leiste öffnen. Ziehen verschiebt sie.', 'Open bar. Drag to move it.')}"><span aria-hidden="true"></span></button></aside>`;
  const k = (attr, i, t, cur) => `<button ${attr} ${cur ? 'aria-current="page"' : ''}>${i}<span>${t}</span></button>`;
  return `<aside class="${cls}" style="${ort}"><div class="fl-knoepfe" role="menu"><button class="fl-zu" data-a="fl-zu" aria-label="${L('Schließen', 'Close')}">${I('x')}</button>${k('data-a="oben"', I('up'), L('Nach oben', 'To top'))}${Z.view !== 'start' ? k('data-a="zurueck"', I('left'), L('Zurück', 'Back')) : ''}${NAV.map(([v, n, i]) => k(`data-go="${v}"`, I(i), L(...n), akt === v)).join('')}<hr>${k('data-a="neu"', I('plus'), L('Neues Getränk', 'New drink'))}</div></aside>`;
}
function menue() {
  if (Z.menue === 'sprache') return `<div class="sprachmenue" role="menu"><h3>${L('Sprache der App', 'App language')}</h3><button role="menuitemradio" aria-checked="${!E.sprache}" data-lang="">${L('Wie das Gerät', 'Same as device')}${!E.sprache ? I('check') : ''}</button>${SPRACHEN.map(([k, n]) => `<button role="menuitemradio" aria-checked="${E.sprache === k}" data-lang="${k}">${n}${E.sprache === k ? I('check') : ''}</button>`).join('')}<p>${L('Vollständig sind Deutsch und Englisch. In den anderen Sprachen sind Kategorien und Gläser übersetzt, die übrige Oberfläche erscheint vorerst auf Englisch.', 'German and English are complete. In the other languages categories and glasses are translated; the rest of the interface is in English for now.')}</p></div>`;
  if (Z.menue === 'schrift') return `<div class="farbmenue schriftfeld" role="dialog" aria-label="${L('Schriftgröße', 'Text size')}"><h3>${L('Schriftgröße', 'Text size')}</h3>${schriftRegler(E.schrift, sprache())}<p>${L('Die Schrift ändert sich sofort, während du schiebst. Gilt für die ganze App, auch für die Mix-Ansicht.', 'The text changes right away while you slide. Applies to the whole app, including the mix view.')}</p><button data-a="schrift-100">${L('Zurück auf 100 %', 'Back to 100 %')}</button></div>`;
  if (Z.menue === 'farbe') return `<div class="farbmenue" role="menu"><h3>${L('Farbe der App', 'App colour')}</h3>${Object.entries(FARBEN).map(([k, f]) => `<button role="menuitemradio" aria-checked="${E.farbe === k}" data-farbe="${k}"><span class="fleck" style="background:linear-gradient(135deg,${f.k[0]},${f.k[2]})"></span>${farbName(k)}</button>`).join('')}<hr><h3>${L('Hell oder dunkel', 'Light or dark')}</h3>${Object.keys(TOENE).map((k) => `<button role="menuitemradio" aria-checked="${E.ton === k}" data-ton="${k}">${I(k === 'dunkel' ? 'moon' : 'sun')}${tonName(k, sprache())}</button>`).join('')}</div>`;
  return '';
}
function leiste() {
  const l = lage(), alle = l.getraenke.filter(G.istSichtbar).length;
  const gl = l.getraenke, alleBild = katBild(gl, A.kategorien, 'alle');
  const stk = (id, bildHtml, name, n) => `<button class="chip stk" data-kat="${esc(id)}" aria-pressed="${Z.kat === id}"><span class="stk-bild">${bildHtml}</span><span class="stk-name">${esc(name)} <span class="zahl">${n}</span></span></button>`;
  return `<div class="leiste stickers" role="group" aria-label="${L('Kategorien', 'Categories')}">${stk('all', alleBild ? `<img class="sticker" src="${esc(alleBild.img)}" alt="" loading="lazy">` : I('book'), L('Alle', 'All'), alle)}${kats().map(({ c, n }) => stk(c.id, katSticker(c, gl), katText(c), n)).join('')}</div>`;
}
function karte(r, i) { r = sicht(r); return `<button class="karte" style="--i:${Math.min(i || 0, 7)}" data-d="${esc(r.uid)}"><div class="bild">${bild(r)}${G.hatAlkohol(r) ? `<span class="marke">${I('wine')}${L('mit Alkohol', 'with alcohol')}</span>` : ''}${r.beispiel ? `<span class="marke rechts">${L('Beispiel', 'Example')}</span>` : r.labGen && r.labStatus && r.labStatus !== 'accepted' ? `<span class="marke rechts">${I('lab')}${L('Labor', 'Lab')}${r.labScore ? ' · ' + zahl(r.labScore.toFixed(1)) : ''}</span>` : ''}</div><div class="txt"><strong>${esc(r.name)}</strong><small><span class="nw">${I('glass')}${esc(r.glass ? glasText(r.glass) : katNameVon(r))}</span>${r.prepTime ? `<span class="nw">${I('timer')}${Number(r.prepTime)} min</span>` : ''}</small></div></button>`; }
function kartenHtml() {
  const l = sichtbar(), sinn = semTreffer(), an = E.sinn && Z.suche.trim();
  const status = an ? `<p class="sinn-status" id="sinn-status" role="status">${esc(sem.status)}</p>` : '';
  const zusatz = sinn.length ? `<h3 class="eh">${L('Nach Bedeutung', 'By meaning')} <small>${sinn.length}</small></h3><div class="karten" id="sinn-treffer">${sinn.map(karte).join('')}</div>` : '';
  if (!l.length) return (sinn.length ? '' : `<p class="leer">${Z.suche ? L('Nichts gefunden. Anderes Wort versuchen oder die Kategorie „Alle“ wählen.', 'Nothing found. Try another word or choose “All”.') : L('In dieser Kategorie ist noch nichts.', 'Nothing in this category yet.')}</p>`) + status + zusatz;
  return `<div class="karten">${l.map(karte).join('')}</div>${status}${zusatz}`;
}

/* ── Sinn-Suche (Kern: suche/bedeutung.mjs; Vorbild Mein Rezeptbuch). Lädt Modul 03 und 04 aus sbkim/ ERST beim Einschalten,
   sonst kein SBKIM-Baustein. Beim ersten Mal kommt das Sprachmodell aus dem Netz; danach rechnet das Gerät. ── */
const sem = { ids: [], fuer: '', status: '', uhr: null, laeuft: false, korpus: null, sig: '' };
const semStatus = (t) => { sem.status = t; const el = $('#sinn-status'); if (el) el.textContent = t; };
function semTreffer() {
  const q = Z.suche.trim().toLowerCase(); if (!E.sinn || !q || sem.fuer !== q) return [];
  const da = new Set(sichtbar().map((r) => r.uid)), erlaubt = new Set(G.filterOhneAlkohol(A.getraenke, ohneAlk()).map((r) => r.uid));
  return sem.ids.map(getr).filter((r) => r && G.istSichtbar(r) && !da.has(r.uid) && erlaubt.has(r.uid) && (Z.kat === 'all' || katVonRezept(r) === Z.kat));
}
/* Ladebalken (Klaus 23.11., Kern 0.17): jede Wartezeit zeigt Balken und Zeile, damit die App nie abgestürzt wirkt. */
const W = wartenEinrichten(document);
function semBereit() {
  return W.mit(L('Sinn-Suche: Sprachmodell wird geladen …', 'Meaning search: loading the language model …'), async (w) => {
    const ab = modellFortschritt((a, g, t) => { w.anteil(a); if (t) w.text(L(`Sprachmodell wird geladen: ${g} von ${t} MB`, `Loading the language model: ${g} of ${t} MB`)); });
    try { await ladeBausteine('../sbkim/'); await window.SbkimEmbedding.init(); } finally { ab(); }
    w.anteil(null); w.text(L('Sinn-Suche wird vorbereitet …', 'Preparing meaning search …'));
    const rs = A.getraenke.filter(G.istSichtbar), sig = rs.map((r) => r.uid + ':' + r.name).join(',');
    if (!sem.korpus || sem.sig !== sig) { sem.korpus = await semKorpus(rs.map(sicht), (r) => katNameVon(r), { einbetten: (t) => window.SbkimEmbedding.embedPassage(t), fortschritt: (i, n) => { const t = L(`Sinn-Suche wird vorbereitet: ${i} von ${n} Getränken`, `Preparing meaning search: ${i} of ${n} drinks`); semStatus(t); w.text(t); w.anteil(n ? i / n : null); } }); sem.sig = sig; }
    return sem.korpus;
  });
}
function semPlanen() { clearTimeout(sem.uhr); if (!E.sinn) return; const f = Z.suche.trim().toLowerCase(); if (!f) { sem.ids = []; sem.fuer = ''; return; } sem.uhr = setTimeout(() => semLauf(f), 350); }
async function semLauf(f) {
  if (!E.sinn) return; if (sem.laeuft) { sem.uhr = setTimeout(() => semLauf(f), 300); return; }
  sem.laeuft = true; semStatus(sem.korpus ? L('sucht nach Bedeutung …', 'searching by meaning …') : L('Sinn-Suche wird vorbereitet (beim ersten Mal lädt das Sprachmodell) …', 'Preparing meaning search (the language model loads the first time) …'));
  try {
    const c = await semBereit(); if (Z.suche.trim().toLowerCase() !== f) return;
    sem.ids = await sucheBedeutung(window.SbkimMatch, f, c); sem.fuer = f; if (Z.suche.trim().toLowerCase() !== f) return;
    const dazu = semTreffer().length;
    sem.status = dazu ? L(`${dazu} zusätzlich nach Bedeutung gefunden`, `${dazu} more found by meaning`) : L('Sinn-Suche an, keine weiteren Treffer', 'Meaning search on, no further results');
    const o = $('#kartenort'); if (o) o.innerHTML = kartenHtml();
  } catch (e) { console.warn('Sinn-Suche:', (e && e.message) || e); semStatus(L('Die Sinn-Suche ist gerade nicht verfügbar. Die Wortsuche läuft weiter.', 'Meaning search is not available right now. Word search keeps working.')); } finally { sem.laeuft = false; }
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
function fakten(r) { return `<div class="fakten">${r.glass ? `<span class="fakt">${I('glass')}${esc(glasText(r.glass))}</span>` : ''}${r.temp ? `<span class="fakt">${I(r.temp === 'warm' || r.temp === 'hot' ? 'coffee' : 'snow')}${esc(G.tempName(r.temp, sprache()))}</span>` : ''}${r.prepTime ? `<span class="fakt">${I('timer')}${Number(r.prepTime)} min</span>` : ''}${G.hatAlkohol(r) ? `<span class="fakt alk">${I('wine')}${L('mit Alkohol', 'with alcohol')}</span>` : `<span class="fakt ok">${I('noalc')}${L('ohne Alkohol', 'alcohol-free')}</span>`}</div>`; }
function portion(r) {
  const e = einheitWahl(), was = r.servings === 1 || Z.port === 1 ? L('Portion', 'serving') : L('Portionen', 'servings');
  return `<div class="portion"><b>${Z.port} ${Z.port === 1 ? L('Portion', 'serving') : L('Portionen', 'servings')}<small>${L('Mengen werden umgerechnet', 'Amounts are recalculated')}</small></b><div class="stepper"><button data-a="minus" aria-label="${L('Weniger', 'Fewer')}">${I('minus')}</button><output>${Z.port}</output><button data-a="plus" aria-label="${L('Mehr', 'More')}">${I('plus')}</button></div></div><div class="einheiten" role="group" aria-label="${L('Einheit', 'Unit')}">${[['orig', L('wie notiert', 'as written')], ['ml', 'ml'], ['cl', 'cl'], ['oz', 'oz']].map(([k, n]) => `<button data-e="${k}" aria-pressed="${e === k}">${n}</button>`).join('')}</div>`;
}
function geraeteKacheln(liste, hell) { return liste.length ? `<div class="geraete ${hell ? 'hell' : ''}">${liste.map((g) => `<span class="gk">${G.geraetSvg(g)}<small>${esc(G.geraetName(g, sprache()))}</small></span>`).join('')}</div>` : ''; }
function aktionen(r, br) { return `<div class="reihe" style="margin-top:14px"><button class="knopf" data-go="mix">${I('shaker')}${L('Mixen', 'Mix')}</button><button class="knopf hell" data-a="einkauf-dazu">${I('cart')}${L('Auf die Einkaufsliste', 'Add to shopping list')}</button><button class="knopf hell" data-a="planen">${I('plan')}${L('Planen', 'Plan')}</button><button class="knopf hell" data-a="teilen">${I('share')}${L('Teilen', 'Share')}</button><button class="knopf hell" data-a="bearbeiten">${I('pencil')}${L('Bearbeiten', 'Edit')}</button></div>`; }
function vGetraenk(br) {
  const r = sicht(getr(Z.uid)); if (!r) { Z.view = 'start'; return vStart(br); }
  const ger = G.geraeteFuerGetraenk(r);
  const gerAbs = ger.length ? `<div class="abschnitt"><h3>${L('Gerätschaften', 'Equipment')}</h3>${geraeteKacheln(ger, true)}</div>` : '';
  const notiz = r.notes ? `<div class="abschnitt"><h3>${L('Notizen', 'Notes')}</h3><p class="notiz">${esc(r.notes)}</p></div>` : '';
  const winkel = (d) => `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${d}"/></svg>`;
  const wk = (akt, i, t, kl = '') => `<button class="chip ${kl}" data-a="${akt}">${I(i)}${t}</button>`;
  /* Kein Knopf auf dem Foto (Klaus 23.11., wie im Rezeptbuch): rechts in der Namenszeile ein weißer Winkel, der die Werkzeuge
     über dem Bild aufklappt, ohne neue Zeile und ohne etwas zu verschieben; „Zurück“ als Winkel links vom Namen. */
  const werk = Z.bildWerk ? `<div class="rwerk">${wk('bearbeiten', 'pencil', L('Bearbeiten', 'Edit'))}${wk('bildblatt', 'image', L('Bild', 'Picture'))}${wk('loeschen', 'trash', L('Getränk löschen', 'Delete drink'), 'rot')}</div>` : '';
  if (!br) return `<div class="held" data-a="held" role="button" tabindex="0" aria-label="${r.img ? L('Bild ansehen, anpassen oder ersetzen', 'View, adjust or replace picture') : L('Bild einfügen', 'Add picture')}">${bild(r)}<div class="ueber">${werk}<div class="tzeile"><button class="wk-pf zur" data-a="zurueck" aria-label="${L('Zurück', 'Back')}">${winkel('M15 5l-7 7 7 7')}</button><h2>${esc(r.name)}</h2><button class="wk-pf" data-a="bildwerk" aria-expanded="${!!Z.bildWerk}" aria-label="${L('Werkzeuge für Getränk und Bild', 'Tools for drink and picture')}">${winkel(Z.bildWerk ? 'M5 9l7 7 7-7' : 'M5 15l7-7 7 7')}</button></div><p>${esc(katNameVon(r))}</p></div></div><div class="innen-p">${fakten(r)}${aktionen(r)}${portion(r)}<div class="abschnitt"><h3>${L('Zutaten', 'Ingredients')}</h3>${zutatenListe(r)}</div>${gerAbs}<div class="abschnitt"><h3>${L('Schritte', 'Steps')}</h3>${schritteListe(r)}</div>${notiz}</div>`;
  const fk = Z.fokus;
  const liste = fk ? '' : `<div class="liste">${leiste()}${sichtbar().map((x) => `<button class="zeile" data-d="${esc(x.uid)}" ${x.uid === r.uid ? 'aria-current="true"' : ''}><span class="mini">${bild(x)}</span><span><strong>${esc(x.name)}</strong><small>${esc(katNameVon(x))}${x.prepTime ? ` · ${Number(x.prepTime)} min` : ''}</small></span></button>`).join('')}</div>`;
  return `<div class="md ${fk ? 'fokus' : ''}">${liste}<div class="detail"><div class="detail-kopf"><div class="held ganz" data-a="held" role="button" tabindex="0" title="${L('Bild ansehen, anpassen oder ersetzen', 'View, adjust or replace picture')}">${bild(r, 'ganz')}</div><div class="seite"><p class="unter">${esc(katNameVon(r))}</p><div class="tzeile mon"><h2>${esc(r.name)}</h2><button class="wk-pf mon" data-a="bildwerk" aria-expanded="${!!Z.bildWerk}" aria-label="${L('Werkzeuge für Getränk und Bild', 'Tools for drink and picture')}">${winkel(Z.bildWerk ? 'M5 15l7-7 7 7' : 'M5 9l7 7 7-7')}</button></div>${Z.bildWerk ? `<div class="rwerk mon">${wk('bildblatt', 'image', L('Bild', 'Picture'))}<button class="chip" data-a="fokus" aria-pressed="${fk}">${I('panel')}${fk ? L('Liste zeigen', 'Show list') : L('Nur dieses Getränk', 'Only this drink')}</button>${wk('loeschen', 'trash', L('Getränk löschen', 'Delete drink'), 'rot')}</div>` : ''}${fakten(r)}${aktionen(r, true)}</div></div><div class="detail-rumpf"><div><div class="abschnitt" style="margin-top:0"><h3>${L('Zutaten', 'Ingredients')}</h3>${portion(r)}<div style="margin-top:12px">${zutatenListe(r)}</div></div>${gerAbs}</div><div><div class="abschnitt" style="margin-top:0"><h3>${L('Schritte', 'Steps')}</h3>${schritteListe(r)}</div>${notiz}</div></div></div></div>`;
}

/* ── Mix-Ansicht ── Welche Zutaten nennt der Schritt? Über den Namen (Wortanfang, mindestens 4 Buchstaben). */
const FUELLWORT = new Set(['eine', 'einem', 'einen', 'einer', 'eines', 'dazu', 'dazugeben', 'geben', 'glas', 'oben', 'unten', 'nach', 'sofort', 'alles', 'auch', 'noch', 'sich', 'wird', 'sein', 'über', 'fein', 'kalt', 'heiß', 'warm', 'gut', 'with', 'into', 'then', 'that', 'this', 'from', 'over', 'until', 'well', 'glass']);
function zutatenImSchritt(r, text) {
  const woerter = String(text).toLowerCase().split(/[^\p{L}]+/u).filter((w) => w.length >= 4 && !FUELLWORT.has(w));
  const staemme = woerter.map((w) => w.slice(0, 5));
  return zutatenVon(r).filter((z) => String(z.name).toLowerCase().split(/[^\p{L}]+/u).some((w) => w.length >= 4 && !FUELLWORT.has(w) && (staemme.some((st) => w.includes(st)) || woerter.some((sw) => sw.includes(w.slice(0, 5))))));
}
function vMix(br) {
  const r = sicht(getr(Z.uid)); if (!r) return '';
  const schritte = r.steps && r.steps.length ? r.steps : [{ txt: L('Für dieses Getränk sind noch keine Schritte notiert.', 'No steps written for this drink yet.') }];
  const st = Math.min(Z.step, schritte.length - 1), s = schritte[st], braucht = zutatenImSchritt(r, s.txt), ger = G.geraeteFuerSchritt(s.txt);
  const letzter = st === schritte.length - 1, gr = 'mittel', kz = !br && !Z.mixKopf;
  const zut = braucht.length ? braucht.map((z) => `<span><b>${esc(mengeText(z))}</b>${esc(z.name)}</span>`).join('') : '';
  const kopfz = `<div class="mixkopf"><div class="fort">${schritte.map((_, i) => `<i class="${i < st ? 'an' : i === st ? 'jetzt' : ''}"></i>`).join('')}</div><div class="oben">${kz ? '' : `<b>${esc(r.name)} · ${Z.port} ${Z.port === 1 ? L('Portion', 'serving') : L('Portionen', 'servings')}</b>`}${br ? '' : `<button data-a="mixkopf" aria-expanded="${!kz}" aria-label="${kz ? L('Kopfzeile aufklappen', 'Expand header') : L('Kopfzeile einklappen', 'Collapse header')}">${I(kz ? 'down' : 'up')}</button>`}<button data-a="mix-zu" aria-label="${L('Schließen', 'Close')}">${I('x')}</button></div></div>`;
  const b = `<div class="mixbild">${bild(r)}<span class="mixnr">${L(`Schritt ${st + 1} von ${schritte.length}`, `Step ${st + 1} of ${schritte.length}`)}</span></div>`;
  const kn = `<div><div class="knoepfe"><button class="zurueckk" data-a="sz" ${st === 0 ? 'disabled style="opacity:.4"' : ''}>${I('left')}${L('Zurück', 'Back')}</button><button class="weiter" data-a="${letzter ? 'fertig' : 'sv'}">${letzter ? I('check') + L('Fertig', 'Done') : L('Weiter', 'Next') + I('right')}</button></div><p class="wach">${I('sun')}${Z.wach ? L('Bildschirm bleibt an', 'Screen stays on') : L('Tippen oder wischen zum Blättern', 'Tap or swipe to page')}${br ? ` · <span class="taste">←</span><span class="taste">→</span> ${L('blättern', 'page')} · <span class="taste">Esc</span> ${L('schließt', 'closes')}` : ''}</p></div>`;
  if (!br) return `<div class="mix ${Z.richt || 'vor'} gr-${gr} ${kz ? 'kopfzu' : ''}" role="dialog" aria-label="${esc(r.name)}">${kopfz}<div class="mitte">${b}<p class="satz">${esc(s.txt)}</p>${zut ? `<div class="braucht">${zut}</div>` : ''}${geraeteKacheln(ger)}</div>${kn}</div>`;
  return `<div class="mix ${Z.richt || 'vor'} gr-${gr}" role="dialog" aria-label="${esc(r.name)}">${kopfz}<div class="mitte"><div class="mixlinks">${b}<p class="satz">${esc(s.txt)}</p></div><div class="seitlich"><h3>${L('Für diesen Schritt', 'For this step')}</h3><ul>${braucht.length ? braucht.map((z) => `<li><b>${esc(mengeText(z))}</b>${esc(z.name)}</li>`).join('') : `<li class="leise">${L('Keine Zutat genannt', 'No ingredient named')}</li>`}</ul>${ger.length ? `<h3 style="margin-top:18px">${L('Dafür brauchst du', 'You need')}</h3>${geraeteKacheln(ger)}` : ''}</div></div>${kn}</div>`;
}

/* ── Einkaufsliste ── */
/* Warengruppen aus getraenke/warengruppen.mjs, zugeordnet vom Kern; jeder Laden merkt sich seine Reihenfolge der Gruppen. */
const gruppeVon = (name) => EK.warengruppe(name);
const gruppeName = (g) => g[sprache()] || g.en || g.de;
const ladenFolge = () => EK.gruppenFolge(A.einkaufLaeden.laeden[A.einkaufLaeden.laden] || []);
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
  const gruppen = ladenFolge().map((gid) => { const g = EK.GRUPPEN.find((x) => x.id === gid), l = ps.filter((p) => gruppeVon(p.name) === gid); return l.length ? `<div class="gruppe-e" data-g="${gid}"><h3 title="${L('Lange drücken und ziehen, um die Reihenfolge zu ändern', 'Long-press and drag to reorder')}">${I('griff', 'griffz')}${I(g.symbol)}${esc(gruppeName(g))}</h3>${l.map(posten).join('')}</div>` : ''; }).join('');
  const lae = A.einkaufLaeden, laeden = ps.length ? `<div class="laeden" role="group" aria-label="${L('Laden', 'Shop')}">${Object.keys(lae.laeden).map((n) => `<button class="chip" data-a="ek-laden" data-l="${esc(n)}" aria-pressed="${n === lae.laden}">${I('markt')}${esc(n)}</button>`).join('')}<button class="chip" data-a="ek-laden-neu">${I('plus')}${L('Laden', 'Shop')}</button>${frag(L('Jeder Laden merkt sich seine Reihenfolge der Gruppen. Eine Gruppe an der Überschrift lange drücken oder mit der Maus ziehen.', 'Each shop keeps its own order of groups. Long-press a group heading or drag it with the mouse.'))}</div>` : '';
  const kopfz = `<h2 class="titel">${L('Einkaufsliste', 'Shopping list')}</h2><p class="unter">${ps.length ? L(`${offen} von ${ps.length} offen`, `${offen} of ${ps.length} open`) : L('Noch leer. Im Getränk oder in einer Getränkekarte auf „Auf die Einkaufsliste“ tippen.', 'Empty. Tap “Add to shopping list” in a drink or a drinks list.')}</p>`;
  const werk = ps.length ? `<div class="reihe" style="margin-top:10px"><button class="knopf hell" data-a="einkauf-teilen">${I('share')}${L('Teilen', 'Share')}</button><button class="knopf hell" data-a="einkauf-erledigt">${I('check')}${L('Erledigtes entfernen', 'Remove done')}</button><button class="knopf hell" data-a="einkauf-leeren">${I('trash')}${L('Liste leeren', 'Clear list')}</button></div>` : '';
  return `<div class="innen-p">${kopfz}${werk}${laeden}${br ? `<div class="einkauf-breit" id="ek-liste">${gruppen}</div>` : `<div id="ek-liste">${gruppen}</div>`}</div>`;
}

/* ── Getränkekarte (Anlässe) ── */
const ABSCHNITTE = [['Zum Ankommen', 'On arrival'], ['Zum Essen', 'With the meal'], ['Zum Nachtisch', 'With dessert'], ['Später', 'Later']];
function vKarte(br) {
  A.anlaesse = A.anlaesse || [];
  const an = A.anlaesse.find((x) => x.id === Z.anlass);
  if (!an) {
    return `<div class="innen-p"><h2 class="titel">${L('Getränkekarten', 'Drinks lists')}</h2><p class="unter">${L('Für einen Anlass zusammenstellen, was es wann zu trinken gibt.', 'Put together what to drink and when, for an occasion.')}</p><div class="reihe" style="margin-top:12px"><button class="knopf" data-a="anlass-neu">${I('plus')}${L('Neue Getränkekarte', 'New drinks list')}</button><button class="knopf hell" data-go="plan">${I('plan')}${L('Wochenplan', 'Week plan')}</button></div>${A.anlaesse.map((x) => `<button class="slot" data-anlass="${x.id}"><span class="mitte"><strong>${esc(x.titel)}</strong><small>${esc([x.datum, x.gaeste ? x.gaeste + ' ' + L('Gäste', 'guests') : ''].filter(Boolean).join(' · '))}</small></span><span class="anz">${x.posten.length}</span></button>`).join('')}</div>`;
  }
  const gaenge = ABSCHNITTE.map(([de, en], ai) => { const l = an.posten.filter((p) => p.abschnitt === ai); return l.length ? `<div class="gang"><h3>${L(de, en)}</h3>${l.map((p) => { const r = getr(p.uid); return r ? `<div class="slot"><button class="mini" data-d="${esc(r.uid)}" aria-label="${esc(r.name)}">${bild(r)}</button><span class="mitte"><strong>${esc(r.name)}</strong><small>${esc(katNameVon(r))}</small></span><span class="stepper klein"><button data-a="posten-minus" data-p="${p.id}" aria-label="${L('Weniger', 'Fewer')}">${I('minus')}</button><output>${p.anzahl}</output><button data-a="posten-plus" data-p="${p.id}" aria-label="${L('Mehr', 'More')}">${I('plus')}</button></span><button class="rund klein" data-a="posten-weg" data-p="${p.id}" aria-label="${L('Entfernen', 'Remove')}">${I('x')}</button></div>` : ''; }).join('')}</div>` : ''; }).join('');
  const links = `<button class="zurueckzeile" data-a="anlass-zu">${I('left')}${L('Alle Getränkekarten', 'All drinks lists')}</button><div class="anlass"><h2>${esc(an.titel)}</h2><p>${an.datum ? `<span>${I('plan')}${esc(an.datum)}</span>` : ''}${an.gaeste ? `<span>${I('users')}${Number(an.gaeste)} ${L('Gäste', 'guests')}</span>` : ''}</p></div>${gaenge || `<p class="leer">${L('Noch kein Getränk auf dieser Karte.', 'No drink on this list yet.')}</p>`}<div class="reihe" style="margin-top:16px"><button class="knopf" data-a="posten-neu">${I('plus')}${L('Getränk hinzufügen', 'Add drink')}</button><button class="knopf hell" data-a="anlass-einkauf">${I('cart')}${L('Alles auf die Einkaufsliste', 'All to the shopping list')}</button><button class="knopf hell" data-a="anlass-bearbeiten">${I('pencil')}${L('Bearbeiten', 'Edit')}</button><button class="knopf hell" data-a="anlass-weg">${I('trash')}${L('Löschen', 'Delete')}</button></div>`;
  if (!br) return `<div class="innen-p">${links}</div>`;
  const blatt = `<div class="menuekarte"><div class="kl">${L('Getränkekarte', 'Drinks list')}</div><h2>${esc(an.titel)}</h2><div class="dat">${esc(an.datum || '')}</div><hr>${ABSCHNITTE.map(([de, en], ai) => { const l = an.posten.filter((p) => p.abschnitt === ai && getr(p.uid)); return l.length ? `<h4>${L(de, en)}</h4>${l.map((p) => `<p>${esc(getr(p.uid).name)}</p>`).join('')}` : ''; }).join('')}</div>`;
  return `<div class="innen-p"><div class="menue-breit"><div>${links}</div><div><p class="unter" style="margin-bottom:10px;display:flex;justify-content:space-between;align-items:center">${L('So sieht die Karte aus', 'This is how the list looks')}<button class="chip" data-a="drucken">${I('print')}${L('Drucken', 'Print')}</button></p>${blatt}</div></div></div>`;
}

/* ── Wochenplan (Kern: modell/plan.mjs; Vorbild Mein Rezeptbuch). Was es an welchem Tag zu trinken gibt. ── */
const WT = () => (sprache() === 'de' ? ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'] : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']);
function vPlan() {
  const w = woche(Z.planTag), heute = tagIso(new Date()), loc = sprache() === 'de' ? 'de-DE' : 'en-GB';
  const von = w.tage[0].toLocaleDateString(loc, { day: 'numeric', month: 'short' }), bis = w.tage[6].toLocaleDateString(loc, { day: 'numeric', month: 'short' });
  const anzahlW = w.tage.reduce((n, t) => n + (A.plan[tagIso(t)] || []).filter(getr).length, 0);
  return `<div class="innen-p"><button class="zurueckzeile" data-go="karte">${I('left')}${L('Getränkekarten', 'Drinks lists')}</button><h2 class="titel">${L('Wochenplan', 'Week plan')}</h2>
   <div class="w-kopf"><button class="rund" data-a="plan-woche" data-tage="-7" aria-label="${L('Vorige Woche', 'Previous week')}">${I('left')}</button><strong>${L('Woche', 'Week')} ${w.kw}<small>${esc(von)} – ${esc(bis)}</small></strong><button class="rund" data-a="plan-woche" data-tage="7" aria-label="${L('Nächste Woche', 'Next week')}">${I('right')}</button></div>
   <div class="w-tage">${w.tage.map((t, i) => { const tag = tagIso(t), rz = (A.plan[tag] || []).map(getr).filter(Boolean);
     return `<div class="w-tag ${tag === heute ? 'heute' : ''}" data-tag="${tag}"><div class="d"><small>${WT()[i]}</small><b>${t.getDate()}</b></div><div class="w-slots">${rz.map((r) => `<div class="w-slot"><button class="w-auf" data-d="${esc(r.uid)}"><span class="w-bild">${bild(r)}</span><span>${esc(sicht(r).name)}<small>${esc(katNameVon(r))}</small></span></button><button class="w-weg" data-a="plan-weg" data-tag="${tag}" data-uid="${esc(r.uid)}" aria-label="${L('Aus dem Plan nehmen', 'Remove from plan')}">${I('x')}</button></div>`).join('')}<button class="w-leer ${rz.length ? 'mehr' : ''}" data-a="plan-waehlen" data-tag="${tag}">${I('plus')}${rz.length ? L('noch eins', 'one more') : L('Getränk planen', 'Plan a drink')}</button></div></div>`; }).join('')}</div>
   <div class="reihe" style="margin-top:14px"><button class="knopf" data-a="plan-einkauf" ${anzahlW ? '' : 'disabled'}>${I('cart')}${L('Einkaufsliste für die Woche', 'Shopping list for the week')}</button><button class="knopf hell" data-a="plan-heute">${L('Heute', 'Today')}</button></div></div>`;
}
function planWahl(tag, uidFest) {
  if (uidFest) { const tage = [...woche(new Date()).tage, ...woche(new Date(Date.now() + 7 * 864e5)).tage].filter((t) => tagIso(t) >= tagIso(new Date())), loc = sprache() === 'de' ? 'de-DE' : 'en-GB';
    Z.fenster = { titel: L('Wann?', 'When?'), html: `<div class="tagwahl">${tage.map((t) => `<button class="chip" data-a="plan-setzen" data-tag="${tagIso(t)}" data-uid="${esc(uidFest)}">${esc(t.toLocaleDateString(loc, { weekday: 'short', day: 'numeric', month: 'numeric' }))}</button>`).join('')}</div>` }; return; }
  const l = G.filterOhneAlkohol(A.getraenke, ohneAlk()).filter(G.istSichtbar);
  Z.fenster = { titel: L('Getränk planen', 'Plan a drink'), html: `<div class="wahl">${l.map((r) => `<button class="zeile" data-a="plan-setzen" data-tag="${tag}" data-uid="${esc(r.uid)}"><span class="mini">${bild(r)}</span><span><strong>${esc(sicht(r).name)}</strong><small>${esc(katNameVon(r))}</small></span></button>`).join('') || `<p class="leer">${L('Noch keine Getränke in der Sammlung.', 'No drinks in the collection yet.')}</p>`}</div>` };
}

/* ── Labor (zieht als Nächstes um) ── */
/* ── Mix-Labor (Logik: getraenke/labor.mjs, aus der alten App übernommen; Gestaltung: abgenommene Vorschau) ── */
/* Erklärung hinter einem „?“ genau an der Stelle, die sie erklärt (Klaus 23.11.; Baustein aus Mein Rezeptbuch). */
const frag = (t) => `<details class="frag"><summary aria-label="${L('Erklärung', 'Explanation')}">?</summary><p>${esc(t)}</p></details>`;
const GESCHMACK_FARBE = { frisch: '#2fa57a', 'süß': '#d9628f', herb: '#7d7a3a', fruchtig: '#ec7f2e', cremig: '#c9a25e', intensiv: '#7c3aa8' };
const sterneHtml = (n) => `<span class="sterne" aria-label="${Math.round(n)} / 5">${[1, 2, 3, 4, 5].map((i) => `<i class="${i <= Math.round(n) ? 'an' : ''}">${I('star')}</i>`).join('')}</span>`;
const labStatusText = (st) => { const x = LAB.LAB_STATUS[st] || LAB.LAB_STATUS.experimentell; return L(x.de, x.en); };
const labSolo = () => !!(A.einstellungen && A.einstellungen.labSolo);
function vLabor() {
  const br = breit(), lb = Z.lab, kats = G.KATEGORIEN.filter((k) => !(k.alcohol && ohneAlk()));
  if (!kats.some((k) => k.id === lb.kat)) lb.kat = kats[0].id;
  const form = `<div class="laborform"><h3>${I('wand')}${L('Neues Getränk erfinden', 'Invent a new drink')}${frag(L('Braucht Internet und deinen eigenen Anthropic-Schlüssel. Das Ergebnis landet erst im Labor; ins Buch kommt es, wenn es gut bewertet oder angenommen ist.', 'Needs internet and your own Anthropic key. The result goes to the lab first; it enters the book once it is rated well or accepted.'))}</h3>
   <p class="feldname">${L('Kategorie', 'Category')}</p><div class="kachelraster">${kats.map((k) => `<button class="kachel" style="--kc:${esc(k.col || '#5a7ab0')}" data-a="lab-kat" data-k="${k.id}" aria-pressed="${lb.kat === k.id}"><span class="kfeld">${I(KAT_SYM[k.id] || 'drinks')}</span><span>${esc(katText(k))}</span></button>`).join('')}</div>
   <p class="feldname">${L('Geschmack', 'Taste')}</p><div class="kachelraster drei">${LAB.GESCHMAECKER.map((g) => `<button class="kachel" style="--kc:${GESCHMACK_FARBE[g.id]}" data-a="lab-geschmack" data-g="${esc(g.id)}" aria-pressed="${lb.geschmack.includes(g.id)}"><span class="kfeld punkt"></span><span>${L(g.de, g.en)}</span></button>`).join('')}</div>
   <p class="feldname">${L('Das habe ich da (optional)', 'What I have (optional)')}</p><label class="suchfeld" style="width:100%;margin-top:6px">${I('drop')}<input id="labzutaten" value="${esc(lb.zutaten)}" placeholder="${L('z. B. Gurke, Basilikum, Tonic', 'e.g. cucumber, basil, tonic')}" autocomplete="off">${mikro('#labzutaten')}</label>
   <button class="knopf voll" data-a="lab-erfinden" style="margin-top:14px" ${lb.laeuft ? 'disabled' : ''}>${I('sparkle')}${lb.laeuft ? L('Die KI mixt …', 'The AI is mixing …') : L('Getränk erfinden', 'Invent drink')}</button>
   ${lb.fehler ? `<p class="hinweis rotschrift" role="alert">${I('info')}${esc(lb.fehler)}</p>` : ''}
   <div class="reihe" style="margin-top:10px;align-items:center"><label class="haken"><input type="checkbox" data-a="lab-solo" ${labSolo() ? 'checked' : ''}> ${L('Einzelpersonen-Modus', 'Single-person mode')}</label>${frag(L('Eine Bewertung genügt, um ein Getränk anzunehmen oder unter Beobachtung zu stellen. Sonst braucht es drei.', 'One rating is enough to accept a drink or put it under watch. Otherwise it takes three.'))}</div></div>`;
  const e = lb.entwurf;
  const vorschau = e ? `<div class="laborform entwurf"><h3>${I('lab')}${esc(e.titel)}<span class="status">${L('Vorschau', 'Preview')}</span></h3>${e.beschreibung ? `<p class="ftext">${esc(e.beschreibung)}</p>` : ''}
   <p class="klein">${[e.zubereitungszeit_min ? `${Number(e.zubereitungszeit_min)} min` : '', e.portionen ? L(`${Number(e.portionen)} Portionen`, `${Number(e.portionen)} servings`) : '', e.glastyp ? glasText(e.glastyp) : '', e.alkohol ? L('mit Alkohol', 'with alcohol') : L('alkoholfrei', 'alcohol-free')].filter(Boolean).map(esc).join(' · ')}</p>
   <ul class="zutaten klein-l">${e.zutaten.map((z) => `<li><b>${esc(z.menge || '')}</b> ${esc(z.name)}</li>`).join('')}</ul><ol class="klein-l">${e.schritte.map((x) => `<li>${esc(x)}</li>`).join('')}</ol>
   <div class="reihe"><button class="knopf" data-a="lab-sichern">${I('check')}${L('Ins Labor übernehmen', 'Move into the lab')}</button><button class="knopf hell" data-a="lab-verwerfen">${I('x')}${L('Verwerfen', 'Discard')}</button></div></div>` : '';
  const pool = LAB.imLabor(A.getraenke), weg = LAB.entfernteAusLabor(A.getraenke);
  const dimMittel = (r, d) => { const l = r.labRatings || []; return l.length ? l.reduce((s2, x) => s2 + x[d], 0) / l.length : 0; };
  const karteLab = (r) => { const n = (r.labRatings || []).length, x = LAB.LAB_STATUS[r.labStatus] || LAB.LAB_STATUS.experimentell;
    return `<div class="laborkarte" data-lab="${esc(r.uid)}"><button class="mini" data-d="${esc(r.uid)}" aria-label="${esc(r.name)}">${bild(r)}</button><div class="mitte"><strong>${esc(r.name)}${r.labFavorite ? ` ${I('star')}` : ''}</strong><small>${esc(katNameVon(r))} · ${L('Fassung', 'Version')} ${(r.labRevision || 0) + 1}</small>
     <div class="wertung"><span class="status" style="--st:${x.farbe}">${labStatusText(r.labStatus)}</span><b>${n ? zahl(r.labScore.toFixed(1)) : '–'}</b><span class="klein">${L(`${n} von ${LAB.mindestBewertungen(labSolo())} Bewertungen`, `${n} of ${LAB.mindestBewertungen(labSolo())} ratings`)}</span></div>
     ${n ? `<div class="dims">${LAB.DIMENSIONEN.map((d) => `<span>${L(d.de, d.en)}</span>${sterneHtml(dimMittel(r, d.id))}`).join('')}</div>` : ''}
     ${r.labRevisionPending ? `<p class="klein">${I('wand')} ${L('Die KI überarbeitet gerade …', 'The AI is revising …')}</p>` : ''}
     ${r.labRevisionDraft ? `<div class="entwurfbox"><b>${L('Überarbeiteter Entwurf', 'Revised draft')}: ${esc(r.labRevisionDraft.titel)}</b><small>${esc(r.labRevisionDraft.zutaten.map((z) => [z.menge, z.name].filter(Boolean).join(' ')).join(', '))}</small><div class="laborknoepfe"><button class="chip" data-a="lab-rev-ja" data-u="${esc(r.uid)}">${I('check')}${L('Annehmen', 'Accept')}</button><button class="chip" data-a="lab-rev-nein" data-u="${esc(r.uid)}">${I('x')}${L('Ablehnen', 'Reject')}</button></div></div>` : ''}
     <div class="laborknoepfe"><button class="chip" data-a="lab-bewerten" data-u="${esc(r.uid)}">${I('star')}${L('Bewerten', 'Rate')}</button><button class="chip" data-a="lab-annehmen" data-u="${esc(r.uid)}">${I('check')}${L('Ins Buch', 'To the book')}</button><button class="chip" data-a="lab-ueberarbeiten" data-u="${esc(r.uid)}" ${r.labRevisionPending || r.labRevisionDraft ? 'disabled' : ''}>${I('wand')}${L('Überarbeiten', 'Revise')}</button><button class="chip" data-a="lab-favorit" data-u="${esc(r.uid)}" aria-pressed="${!!r.labFavorite}" title="${L('Vor dem Rauswurf schützen', 'Protect from removal')}">${I('star')}${r.labFavorite ? L('Geschützt', 'Protected') : L('Schützen', 'Protect')}</button><button class="chip" data-a="lab-entfernen" data-u="${esc(r.uid)}">${I('trash')}${L('Verwerfen', 'Discard')}</button></div>
     ${(r.labLog || []).length ? `<details class="protokoll"><summary>${L('Protokoll', 'Log')}</summary>${r.labLog.slice(-6).reverse().map((l) => `<p>${esc(new Date(l.ts).toLocaleDateString(sprache() === 'de' ? 'de-DE' : 'en-GB'))}: ${esc(l.detail)}</p>`).join('')}</details>` : ''}</div></div>`; };
  const poolHtml = `<div class="abschnitt" style="${br ? 'margin-top:0' : ''}"><h3>${L('Im Labor', 'In the lab')} · ${pool.length}${frag(L('Ab 3,5 Punkten kommt ein Getränk ins Buch, unter 2,5 unter Beobachtung. Bleibt es schlecht, überarbeitet die KI es; fällt auch die neue Fassung durch, wird es verworfen, außer es ist geschützt. Gewichtung: Geschmack 40 %, Zubereitung 25 %, Originalität 20 %, Beschreibung 15 %.', 'From 3.5 points a drink enters the book, below 2.5 it goes under watch. If it stays poor, the AI revises it; if the new version fails too, it is discarded unless protected. Weights: taste 40 %, practicality 25 %, originality 20 %, description 15 %.'))}</h3>${pool.map(karteLab).join('') || `<p class="leer">${A.getraenke.some((r) => r.labLog) ? L('Alle Labor-Getränke sind angenommen oder verworfen. Angenommene stehen im Buch.', 'All lab drinks are accepted or discarded. Accepted ones are in the book.') : L('Noch nichts im Labor. Erfinde oben dein erstes Getränk.', 'Nothing in the lab yet. Invent your first drink above.')}</p>`}
   ${weg.length ? `<button class="chip" data-a="lab-entfernte" aria-expanded="${lb.entfernteAuf}" style="margin-top:10px">${I(lb.entfernteAuf ? 'down' : 'right')}${L(`Entfernte Getränke (${weg.length})`, `Removed drinks (${weg.length})`)}</button>${lb.entfernteAuf ? weg.map((r) => { const s2 = (r.labLog || []).filter((l) => l.type === 'status').slice(-1)[0]; return `<div class="laborkarte entfernt"><div class="mitte"><strong>${esc(r.name)}</strong><small>${esc(katNameVon(r))}${s2 ? ' · ' + esc(s2.detail) : ''}</small><div class="laborknoepfe"><button class="chip" data-a="lab-zurueck" data-u="${esc(r.uid)}">${I('back')}${L('Wiederherstellen', 'Restore')}</button></div></div></div>`; }).join('') : ''}` : ''}</div>`;
  const kopfz = `<h2 class="titel">${L('Mix-Labor', 'Mix lab')}${frag(L('Hier erfindet die KI neue Getränke. Du bewertest sie; gut bewertete kommen ins Buch, schwache überarbeitet die KI.', 'Here the AI invents new drinks. You rate them; good ones go into the book, weak ones are revised by the AI.'))}</h2>`;
  if (!br) return `<div class="innen-p">${kopfz}${form}${vorschau}${poolHtml}</div>`;
  return `<div class="innen-p">${kopfz}<div class="labor-breit"><div>${form}${vorschau}</div><div>${poolHtml}</div></div></div>`;
}
/* Ein Aufruf an Claude (Anthropic), wie in der alten App direkt aus dem Browser mit dem eigenen Schlüssel. Kein SDK:
   die PWA hat keinen Bauschritt und soll offline starten. Prüft stop_reason (Ablehnung, abgeschnitten) über LAB.antwortLesen. */
async function kiRezept(auftrag, text) {
  const k = (await lager.hol('schluessel-anthropic')) || ''; if (!k) { const f = new Error('kein-schluessel'); f.keinSchluessel = true; throw f; }
  const warte = W.start(text || L('Die KI arbeitet …', 'The AI is working …'));
  try {
  let ant;
  try { ant = await fetch('https://api.anthropic.com/v1/messages', { method: 'POST', headers: { 'x-api-key': k, 'anthropic-version': '2023-06-01', 'content-type': 'application/json', 'anthropic-dangerous-direct-browser-access': 'true' }, body: JSON.stringify({ model: LAB.LAB_MODELL, max_tokens: LAB.LAB_MAX_TOKENS, messages: [{ role: 'user', content: auftrag }] }) }); }
  catch (e) { throw new Error(L('Keine Verbindung. Das Labor braucht Internet.', 'No connection. The lab needs internet.')); }
  if (!ant.ok) { const j = await ant.json().catch(() => ({})); throw new Error(ant.status === 401 ? L('Der Anthropic-Schlüssel wurde abgelehnt. Bitte in den Einstellungen prüfen.', 'The Anthropic key was rejected. Please check it in the settings.') : ant.status === 429 ? L('Anthropic meldet: zu viele Anfragen oder kein Guthaben.', 'Anthropic reports: too many requests or no credit.') : ((j.error && j.error.message) || 'HTTP ' + ant.status)); }
  return LAB.antwortLesen(await ant.json());
  } finally { warte.ende(); }
}
const labKatName = (id) => { const c = G.KATEGORIEN.find((k) => k.id === id); return c ? c.de : id; };
async function labErfinden() {
  const lb = Z.lab; lb.zutaten = ($('#labzutaten') && $('#labzutaten').value) || lb.zutaten; lb.fehler = ''; lb.laeuft = true; zeichne();
  try { lb.entwurf = await kiRezept(LAB.auftragErfinden({ kategorie: labKatName(lb.kat), geschmack: lb.geschmack, zutaten: lb.zutaten, ohneAlkohol: ohneAlk() || ['mock', 'afckt'].includes(lb.kat) /* Schalter an, oder eine Kategorie, die alkoholfrei IST */, sprache: sprache() }), L('Neues Getränk wird erfunden …', 'Inventing a new drink …')); }
  catch (e) { if (e.keinSchluessel) { lb.laeuft = false; return anthropicFenster(true); } lb.fehler = e.message; }
  finally { lb.laeuft = false; zeichne(); }
}
async function labUeberarbeiten(r) {
  r.labRevisionPending = true; sichern(); zeichne();
  try { LAB.ueberarbeitungBereit(r, await kiRezept(LAB.auftragUeberarbeiten(r, { kategorie: labKatName(r.cat), sprache: sprache() }), L('Getränk wird überarbeitet …', 'Revising the drink …'))); melde(L('Entwurf bereit', 'Draft ready')); }
  catch (e) { LAB.ueberarbeitungFehlgeschlagen(r, e.keinSchluessel ? 'kein Schlüssel' : e.message); melde(e.keinSchluessel ? L('Für die Überarbeitung fehlt der Anthropic-Schlüssel.', 'The Anthropic key is missing for the revision.') : L('Überarbeitung fehlgeschlagen: ', 'Revision failed: ') + e.message); }
  sichern(); zeichne();
}
function labBewertenFenster(r) {
  Z.fenster = { titel: L('Bewerten', 'Rate') + ': ' + r.name, labUid: r.uid, html: `<form id="labrate" class="felder">${LAB.DIMENSIONEN.map((d) => `<label class="regler">${L(d.de, d.en)} <output id="lro-${d.id}">3</output><input type="range" name="${d.id}" min="1" max="5" step="1" value="3" data-lro="${d.id}"></label>`).join('')}
   <label>${L('Was würdest du ändern? (optional, hilft der Überarbeitung)', 'What would you change? (optional, helps the revision)')}${mikro('#labrate [name=fb]')}<textarea class="feld" name="fb" rows="2"></textarea></label>
   <div class="reihe ende"><button type="button" class="knopf hell" data-a="fenster-zu">${L('Abbrechen', 'Cancel')}</button><button class="knopf" type="submit">${I('check')}${L('Bewertung speichern', 'Save rating')}</button></div></form>` };
}
function anthropicFenster(fuerLabor) {
  lager.hol('schluessel-anthropic').then((da) => { Z.fenster = { titel: L('Anthropic-Schlüssel', 'Anthropic key'), fuerLabor, html: `${da ? `<p class="ftext">${L('Es ist ein Schlüssel gespeichert.', 'A key is saved.')}</p>` : ''}<form id="akform" class="felder" autocomplete="off"><label>${L('Schlüssel (beginnt mit sk-ant-)', 'Key (starts with sk-ant-)')}${frag(L('Für das Labor brauchst du einen eigenen Schlüssel von Anthropic (Claude). Er bleibt nur auf diesem Gerät, steht in keiner Sicherung und geht nur an Anthropic, wenn du im Labor etwas erfinden oder überarbeiten lässt.', 'The lab needs your own Anthropic (Claude) key. It stays on this device only, is in no backup and goes to Anthropic only when you invent or revise something in the lab.'))}<input class="feld" name="k" type="password" autocomplete="off" placeholder="sk-ant-…"></label><div class="reihe ende">${da ? `<button type="button" class="knopf hell rotschrift" data-a="anthropic-weg">${I('trash')}${L('Schlüssel löschen', 'Delete key')}</button>` : ''}<button type="button" class="knopf hell" data-a="fenster-zu">${L('Abbrechen', 'Cancel')}</button><button class="knopf" type="submit">${I('check')}${L('Speichern', 'Save')}</button></div></form>` }; zeichne(); });
}

/* ── Bilder-Ordner (Vorbild Mein Rezeptbuch): der EINZIGE Ort, an dem ein Bild gelöscht wird; das Getränk bleibt. ── */
function vBilder() {
  const B = Z.bilder, mit = A.getraenke.filter((r) => G.istSichtbar(r) && r.img), ohne = A.getraenke.filter((r) => G.istSichtbar(r) && !r.img);
  const gez = mit.filter((r) => B.filter === 'alle' || (B.filter === 'beispiele' ? r.beispiel : !r.beispiel));
  for (const u of [...B.wahl]) if (!gez.some((r) => r.uid === u)) B.wahl.delete(u);
  return `<div class="innen-p"><button class="zurueckzeile" data-go="mehr">${I('left')}${L('Einstellungen', 'Settings')}</button><h2 class="titel">${L('Bilder', 'Pictures')}${frag(L('Tippe Bilder an, um sie auszuwählen. „Löschen“ entfernt nur das Bild; das Getränk mit seinem Text bleibt. Vorher wird der Stand im Tresor abgelegt.', 'Tap pictures to select them. “Delete” removes only the picture; the drink and its text stay. The current state is stored in the vault first.'))}</h2><p class="unter">${L(`${mit.length} Bilder · ${ohne.length} Getränke ohne Bild`, `${mit.length} pictures · ${ohne.length} drinks without a picture`)}</p>
   <div class="laeden">${[['alle', L('Alle', 'All')], ['eigene', L('Eigene', 'Own')], ['beispiele', L('Beispiele', 'Examples')]].map(([f, t]) => `<button class="chip" data-a="bilder-filter" data-f="${f}" aria-pressed="${B.filter === f}">${t}</button>`).join('')}<button class="chip" data-a="bilder-gross" aria-pressed="${B.gross}">${I('full')}${B.gross ? L('Groß', 'Large') : L('Klein', 'Small')}</button></div>
   <div class="reihe" style="margin:10px 0"><button class="knopf rot" data-a="bilder-weg" ${B.wahl.size ? '' : 'disabled'}>${I('trash')}${L(`Löschen (${B.wahl.size})`, `Delete (${B.wahl.size})`)}</button><button class="knopf hell" data-a="bilder-alle-wahl" ${gez.length ? '' : 'disabled'}>${B.wahl.size === gez.length && gez.length ? L('Auswahl aufheben', 'Clear selection') : L('Alle auswählen', 'Select all')}</button><button class="knopf hell rotschrift" data-a="bilder-alle-weg" ${mit.length ? '' : 'disabled'}>${L('Alle Bilder löschen', 'Delete all pictures')}</button></div>
   <div class="bildgitter ${B.gross ? 'gross' : ''}">${gez.map((r) => `<button class="bildkachel" data-a="bild-wahl" data-uid="${esc(r.uid)}" aria-pressed="${B.wahl.has(r.uid)}"><img src="${esc(r.img)}" alt="" loading="lazy"><span class="hk">${B.wahl.has(r.uid) ? I('check') : ''}</span><span class="bn">${esc(r.name)}</span></button>`).join('') || `<p class="leer">${L('Keine Bilder in dieser Auswahl.', 'No pictures in this selection.')}</p>`}</div>
   ${ohne.length ? `<h3 class="eh">${L('Getränke ohne Bild', 'Drinks without a picture')}</h3><div class="eliste">${ohne.map((r) => `<button class="ezeile" data-a="bild-dazu" data-uid="${esc(r.uid)}">${I('camera')}<span><b>${esc(r.name)}</b><small>${L('Bild einfügen, KI-Bild oder Gratis-Foto', 'Add picture, AI picture or free photo')}</small></span>${I('right')}</button>`).join('')}</div>` : ''}</div>`;
}
async function bilderLoeschen(uids, grund) { await tresorAuto(grund); const w = new Set(uids); for (const r of A.getraenke) if (w.has(r.uid)) { r.img = ''; delete r.imgCrop; r.modified = Date.now(); } Z.bilder.wahl.clear(); sichern(); melde(L(`${w.size} Bilder gelöscht, die Getränke bleiben. Der vorige Stand liegt im Tresor.`, `${w.size} pictures deleted, the drinks stay. The previous state is in the vault.`)); }

/* ── Einstellungen ── */
function vMehr() {
  const z = (i, t, w, attr = '') => `<button class="ezeile" ${attr}>${i}<span><b>${t}</b><small>${w}</small></span>${I('right')}</button>`;
  const bsp = A.getraenke.filter((r) => r.beispiel).length, alle = A.getraenke.filter(G.istSichtbar).length;
  return `<div class="innen-p"><h2 class="titel">${L('Einstellungen', 'Settings')}</h2>
  <div class="eliste">${z(I('lang'), L('Sprache', 'Language'), E.sprache ? SPRACHEN.find((x) => x[0] === E.sprache)[1] : L('wie das Gerät', 'same as device'), 'data-a="menue" data-m="sprache"')}${z(I('drop'), L('Einheiten', 'Units'), { auto: L('automatisch nach Land', 'automatic by country'), orig: L('wie notiert', 'as written'), ml: 'ml', cl: 'cl', oz: 'oz' }[E.einheit], 'data-a="einheit"')}${z(I('aa'), L('Schriftgröße', 'Text size'), E.schrift + ' % · ' + L('Schieberegler, ändert sich sofort', 'slider, changes right away'), 'data-a="menue" data-m="schrift"')}${z('<span class="fleck farbknopf"></span>', L('Farbe, hell und dunkel', 'Colour, light and dark'), farbName(E.farbe) + ' · ' + { geraet: L('wie das Gerät', 'same as device'), hell: L('hell', 'light'), dunkel: L('dunkel', 'dark') }[E.ton], 'data-a="menue" data-m="farbe"')}${z(I('image'), L('Bilder', 'Pictures'), L('alle Bilder sehen, auswählen und löschen', 'see, select and delete all pictures'), 'data-go="bilder"')}${z(I('info'), L('Hinweis-Blasen', 'Tooltips'), E.hinweiseAus ? L('aus', 'off') : L('an: kurze Erklärung, wenn man auf ein Symbol zeigt oder es antippt', 'on: a short explanation when you point at or tap a symbol'), `data-a="hinweise" aria-pressed="${!E.hinweiseAus}"`)}${z(I('box'), L('Kategorien', 'Categories'), L('umbenennen, Zeichen, ordnen, löschen, neu', 'rename, symbol, order, delete, new'), 'data-a="kategorien"')}${z(I('noalc'), L('Ohne Alkohol', 'Alcohol-free'), ohneAlk() ? L('an: Getränke mit Alkohol sind ausgeblendet', 'on: drinks with alcohol are hidden') : L('aus', 'off'), 'data-a="alk"')}</div>
  <h3 class="eh">${L('Beispiele', 'Examples')}</h3><div class="eliste">${z(I('box'), L('Beispiele laden', 'Load examples'), L('Pakete mit Getränken zum Ausprobieren', 'Packages of drinks to try'), 'data-a="beispiele"')}${z(I('trash'), L('Alle Beispiele löschen', 'Delete all examples'), bsp ? L(`${bsp} Beispiele in deiner Sammlung`, `${bsp} examples in your collection`) : L('keine Beispiele in deiner Sammlung', 'no examples in your collection'), 'data-a="beispiele-weg"')}</div>
  <h3 class="eh">${L('Sammlung', 'Collection')}</h3><div class="eliste">${z(I('download'), L('Sicherung speichern', 'Save a backup'), L(`${alle} Getränke als Datei`, `${alle} drinks as a file`), 'data-a="sichern"')}${z(I('pencil'), L('Getränk aus Text', 'Drink from text'), L('Rezepttext einfügen, ohne KI aufteilen', 'paste a recipe text, split without AI'), 'data-a="text-import"')}${z(I('upload'), L('Sicherung einspielen', 'Restore a backup'), L('fügt hinzu, Doppelte werden erkannt', 'adds; duplicates are detected'), 'data-a="einspielen"')}${z(I('safe'), L('Tresor', 'Vault'), L('Stände im Gerät: ablegen und zurückholen', 'states on this device: store and restore'), 'data-a="tresor"')}${z(I('back'), L('Aus der bisherigen App übernehmen', 'Take over from the previous app'), L('liest die alten Daten, ändert sie nicht', 'reads the old data, does not change it'), 'data-a="uebernehmen"')}${z(I('warn'), L('Sammlung leeren', 'Empty the collection'), L('alle Getränke, Karten und die Einkaufsliste entfernen', 'remove all drinks, lists and the shopping list'), 'data-a="leeren"')}</div>
  <h3 class="eh">${L('KI', 'AI')}</h3><div class="eliste">${z(I('lab'), L('Anthropic-Schlüssel für das Labor', 'Anthropic key for the lab'), L('eigener Schlüssel, bleibt auf diesem Gerät', 'your own key, stays on this device'), 'data-a="anthropic"')}${z(I('sparkle'), L('OpenAI-Schlüssel für KI-Bilder', 'OpenAI key for AI pictures'), L('eigener Schlüssel, bleibt auf diesem Gerät', 'your own key, stays on this device'), 'data-a="schluessel"')}</div>
  <h3 class="eh">${L('Über', 'About')}</h3><div class="eliste">${z(I('info'), 'Mein Mixarium', L(`Fassung ${FASSUNG} · neue Gestaltung, Vorab`, `Version ${FASSUNG} · new design, preview`), 'data-a="ueber"')}<a class="ezeile" href="../index.html">${I('back')}<span><b>${L('Bisherige App öffnen', 'Open the previous app')}</b><small>${L('bleibt unverändert, mit Labor, Scan und KI', 'unchanged, with lab, scan and AI')}</small></span>${I('right')}</a><a class="ezeile" href="../impressum.html">${I('book')}<span><b>${L('Impressum', 'Legal notice')}</b><small></small></span>${I('right')}</a></div></div>`;
}

/* Bild im Vollbild: füllt den ganzen Schirm, das Bild ganz sichtbar (nicht beschnitten); Tipp, × oder Esc schließt. */
function bildVoll() { const r = Z.bildVoll && getr(Z.uid); if (!r) return ''; return `<div class="bildvoll" data-a="bildvoll-zu" role="dialog" aria-modal="true" aria-label="${esc(r.name)}">${r.img ? `<img src="${esc(r.img)}" alt="${esc(r.name)}">` : platzbild(r)}<span class="bvname">${esc(r.name)}</span><button class="bvwerk" data-a="bildvoll-werk">${I('image')}${L('Bild bearbeiten', 'Edit picture')}</button><button class="bvzu" data-a="bildvoll-zu" aria-label="${L('Schließen', 'Close')}">${I('x')}</button></div>`; }

/* ── Fenster (Dialoge) ── */
function fenster() {
  const f = Z.fenster; if (!f) return '';
  return `<div class="schleier" data-a="fenster-zu-aussen"><div class="fenster" role="dialog" aria-modal="true" aria-label="${esc(f.titel)}"><div class="fkopf"><h2>${esc(f.titel)}</h2><button class="rund" data-a="fenster-zu" aria-label="${L('Schließen', 'Close')}">${I('x')}</button></div>${f.html}</div></div>`;
}
const fZu = () => { diktatAus(); Z.fenster = null; zeichne(); };
function frage(titel, text, jaText, ja, gefahr) { Z.fenster = { titel, html: `<p class="ftext">${text}</p><div class="reihe ende"><button class="knopf hell" data-a="fenster-zu">${L('Abbrechen', 'Cancel')}</button><button class="knopf ${gefahr ? 'rot' : ''}" data-a="fenster-ja">${jaText}</button></div>`, ja }; zeichne(); }

function editor(r, vorlage = false) {
  const LEER = { name: '', cat: Z.kat !== 'all' ? Z.kat : 'mock', glass: 'highball', temp: 'kalt', servings: 1, prepTime: 5, ings: [], steps: [], notes: '', img: '' };
  const neu = !r || vorlage; r = r ? (vorlage ? { ...LEER, ...r } : r) : LEER;   // vorlage: neues Getränk, vorausgefüllt (Text-Import)
  const katListe = K.alleKategorien(A.getraenke, A.kategorien).filter((c) => c.art !== 'ohne');
  const opt = (l, wert, name) => l.map((x) => `<option value="${esc(x.id)}" ${x.id === wert ? 'selected' : ''}>${esc(name(x))}</option>`).join('');
  const glasBekannt = !r.glass || G.istBekanntesGlas(r.glass);
  Z.fenster = { titel: neu ? L('Neues Getränk', 'New drink') : L('Getränk bearbeiten', 'Edit drink'), uid: r.uid || null, img: r.img || '', html: `<form id="ed" class="felder" autocomplete="off">${r.hinweis ? `<p class="hinweis">${I('info')}${esc(r.hinweis)}</p>` : ''}
   <label>${L('Name', 'Name')}<input class="feld" name="name" required value="${esc(r.name)}"></label>
   <div class="zweier"><label>${L('Kategorie', 'Category')}<select class="feld" name="cat">${opt(katListe, r.cat, katText)}<option value="" ${!r.cat ? 'selected' : ''}>${L('ohne Kategorie', 'no category')}</option></select></label>
   <label>${L('Glas', 'Glass')}<select class="feld" name="glass">${glasBekannt ? '' : `<option value="${esc(r.glass)}" selected>${esc(r.glass)}</option>`}${opt(G.GLAESER, r.glass, (g) => g[sprache()] || g.de)}</select></label></div>
   <div class="dreier"><label>${L('Temperatur', 'Temperature')}<select class="feld" name="temp"><option value="">–</option>${opt(G.TEMPERATUREN, r.temp, (t) => t[sprache()] || t.de)}</select></label>
   <label>${L('Portionen', 'Servings')}<input class="feld" name="servings" type="number" min="1" max="99" value="${Number(r.servings) || 1}"></label>
   <label>${L('Minuten', 'Minutes')}<input class="feld" name="prepTime" type="number" min="0" max="9999" value="${r.prepTime == null ? '' : Number(r.prepTime)}"></label></div>
   <label class="haken"><input type="checkbox" name="alcohol" ${r.alcohol ? 'checked' : ''}> ${L('enthält Alkohol', 'contains alcohol')}</label>
   <label>${L('Zutaten, eine je Zeile (z. B. „2 cl Limettensaft“)', 'Ingredients, one per line (e.g. “2 cl lime juice”)')}${mikro('#ed [name=ings]')}<textarea class="feld" name="ings" rows="6">${esc((r.ings || []).map((z) => [z.amt, z.unit, z.name].filter(Boolean).join(' ')).join('\n'))}</textarea></label>
   <label>${L('Schritte, einer je Zeile', 'Steps, one per line')}${mikro('#ed [name=steps]')}<textarea class="feld" name="steps" rows="6">${esc((r.steps || []).map((s) => s.txt).join('\n'))}</textarea></label>
   <label>${L('Notizen', 'Notes')}${mikro('#ed [name=notes]')}<textarea class="feld" name="notes" rows="2">${esc(r.notes || '')}</textarea></label>
   <div class="bildwahl"><span class="mini" id="edbild">${r.img ? `<img class="foto" src="${esc(r.img)}" alt="">` : platzbild(r)}</span><label class="knopf hell">${I('image')}${L('Foto wählen', 'Choose photo')}<input type="file" id="edfoto" accept="image/*" hidden></label></div>
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
/* ── Beispiele ── Welche Pakete es gibt, sagt die Ausgabe (Küchen-Kern: ausgaben/<name>/ausgabe.json + KATALOG.json). */
const AUSGABE = 'mixarium-voll'; // die Web-Fassung; die Store-Fassung wird beim Bauen der App mit `mixarium-store` erzeugt
async function paketeLaden() {
  const [a, k] = await Promise.all([fetch(`../ausgaben/${AUSGABE}/ausgabe.json`).then((r) => r.json()), fetch('../beispiele/KATALOG.json').then((r) => r.json())]);
  return (k.pakete || []).filter((p) => a.beispiele.includes(p.id) && (!p.fuer || p.fuer.includes(a.name)) && (a.alkoholErlaubt || !p.alkohol));
}
async function beispieleFenster() {
  Z.fenster = { titel: L('Beispiele laden', 'Load examples'), html: `<p class="ftext">${L('Pakete werden gesucht …', 'Looking for packages …')}</p>` }; zeichne();
  let ps = [];
  try { ps = await W.mit(L('Pakete werden gesucht …', 'Looking for packages …'), paketeLaden); } catch (e) { Z.fenster.html = `<p class="ftext">${L('Die Paketliste ließ sich nicht laden. Bist du online?', 'The package list could not be loaded. Are you online?')}</p>`; return zeichne(); }
  Z.pakete = ps;
  const zeigbar = ps.filter((p) => !(p.alkohol && ohneAlk())), versteckt = ps.length - zeigbar.length;
  Z.fenster.html = `<p class="ftext klein">${L('Pakete', 'Packages')}${frag(L('Ein Paket ist eine Sammlung fertiger Getränke. Es wird erst beim Antippen geladen. Beispiele lassen sich in den Einstellungen mit einem Tipp wieder löschen.', 'A package is a set of ready-made drinks. It loads only when you tap it. Examples can be deleted again with one tap in the settings.'))}</p>${zeigbar.map((p) => `<button class="slot" data-paket="${esc(p.id)}"><span class="mitte"><strong>${esc(p.titel)}</strong><small>${(p.bytes / 1048576).toFixed(1).replace('.', sprache() === 'de' ? ',' : '.')} MB${p.alkohol ? ' · ' + L('mit Alkohol', 'with alcohol') : ' · ' + L('ohne Alkohol', 'alcohol-free')}</small></span>${I('download')}</button>`).join('') || `<p class="leer">${L('Zurzeit gibt es kein Paket für diese Einstellung.', 'There is no package for this setting at the moment.')}</p>`}${versteckt ? `<p class="hinweis">${I('noalc')}${L(`„Ohne Alkohol“ ist an: ${versteckt} Paket mit Alkohol wird nicht angeboten.`, `“Alcohol-free” is on: ${versteckt} package with alcohol is not offered.`)}</p>` : ''}`;
  zeichne();
}
async function paketEinspielen(id) {
  const p = (Z.pakete || []).find((x) => x.id === id); if (!p) return;
  Z.fenster.html = `<p class="ftext">${L('Paket wird geladen …', 'Loading package …')}</p>`; zeichne();
  try {
    const roh = await W.mit(L(`„${p.titel}“ wird geladen …`, `Loading “${p.titel}” …`), async (w) => { const ant = await fetch('../beispiele/' + p.datei); if (!ant.ok) throw new Error(String(ant.status)); return new TextDecoder().decode(await bytesMitAnteil(ant, (a) => w.anteil(a))); });
    const e = G.beispielPaketEinspielen(A, roh, p.id, { knoten: A.knoten });
    A = { ...A, ...e.sammlung }; sichern(); Z.fenster = null; Z.view = 'start'; Z.kat = 'all';
    melde(e.neu.length ? L(`${e.neu.length} Beispiele hinzugefügt.`, `${e.neu.length} examples added.`) : L('Diese Beispiele sind schon in deiner Sammlung.', 'These examples are already in your collection.'));
  } catch (err) { Z.fenster.html = `<p class="ftext">${L('Das Paket ließ sich nicht laden.', 'The package could not be loaded.')}</p>`; zeichne(); }
}
function beispieleWeg() {
  const p = G.beispielePruefen(A);
  if (!p.unveraendert.length && !p.veraendert.length) return melde(L('Es sind keine Beispiele in deiner Sammlung.', 'There are no examples in your collection.'));
  const text = L(`${p.unveraendert.length} Beispiele werden gelöscht.`, `${p.unveraendert.length} examples will be deleted.`) + (p.veraendert.length ? ' ' + L(`${p.veraendert.length} hast du verändert (${p.veraendert.map((r) => esc(r.name)).join(', ')}). Sie bleiben stehen und gehören jetzt dir.`, `You changed ${p.veraendert.length} (${p.veraendert.map((r) => esc(r.name)).join(', ')}). They stay and are yours now.`) : '');
  frage(L('Alle Beispiele löschen', 'Delete all examples'), text, L('Löschen', 'Delete'), async () => { await tresorAuto(L('vor „Beispiele löschen“', 'before deleting examples')); const e = G.beispieleLoeschen(A, {}); A = { ...A, ...e.sammlung }; sichern(); Z.fenster = null; Z.view = 'start'; Z.uid = null; melde(L(`${e.entfernt.length} Beispiele gelöscht.`, `${e.entfernt.length} examples deleted.`)); }, true);
}

/* ── Bild-Blatt (wie im Rezeptbuch): ganzes Bild, Ausschnitt, ersetzen, KI-Bild, Gratis-Foto. Gelöscht wird ein Bild hier nicht. */
function bildBlatt() {
  const r = getr(Z.uid); if (!r) return;
  const z = (akt, i, t, w) => `<button class="ezeile" data-a="${akt}">${I(i)}<span><b>${t}</b><small>${w}</small></span>${I('right')}</button>`;
  Z.fenster = { titel: sicht(r).name, html: `${r.img ? `<button class="bb-bild" data-a="bildvoll" aria-label="${L('Ganzes Bild im Vollbild', 'Whole picture full screen')}"><img src="${esc(r.img)}" alt=""></button>` : `<p class="ftext">${L('Dieses Getränk hat noch kein Bild.', 'This drink has no picture yet.')}</p>`}
   <div class="eliste">${r.img ? z('bildvoll', 'full', L('Ganzes Bild', 'Whole picture'), L('im Vollbild ansehen', 'view full screen')) + z('ausschnitt', 'crop', L('Ausschnitt anpassen', 'Adjust section'), L('verschieben, was auf Karte und Kopfbild zu sehen ist', 'move what shows on card and header')) : ''}${z('bild-datei', 'camera', r.img ? L('Bild ersetzen', 'Replace picture') : L('Bild einfügen', 'Add picture'), L('Foto aufnehmen oder Datei wählen', 'Take a photo or choose a file'))}${z('ki-bild', 'sparkle', L('Bild von der KI erzeugen', 'Create picture with AI'), 'OpenAI, ' + L(KOSTEN.de, KOSTEN.en))}${z('gratis-bild', 'image', L('Gratis-Foto erzeugen', 'Create free photo'), L('ohne Schlüssel; der Name des Getränks geht an den Dienst Pollinations', 'no key; the drink name goes to the Pollinations service'))}</div>
   <input type="file" id="bbdatei" accept="image/*" hidden>` };
  zeichne();
}
function ausschnittFenster() {
  const r = getr(Z.uid), c = r.imgCrop || {}, x = Number(c.x) >= 0 ? Number(c.x) : 50, y = Number(c.y) >= 0 ? Number(c.y) : 50;
  Z.fenster = { titel: L('Ausschnitt anpassen', 'Adjust section'), html: `<div class="as-vor"><img id="asbild" src="${esc(r.img)}" alt="" style="object-position:${x}% ${y}%"></div><div class="felder"><label>${L('nach links / rechts', 'left / right')}<input type="range" id="asx" min="0" max="100" value="${x}"></label><label>${L('nach oben / unten', 'up / down')}<input type="range" id="asy" min="0" max="100" value="${y}"></label></div><div class="reihe ende"><button class="knopf hell" data-a="bildblatt">${L('Zurück', 'Back')}</button><button class="knopf" data-a="ausschnitt-ok">${I('check')}${L('Übernehmen', 'Apply')}</button></div>` };
  zeichne();
}
function bildSetzen(img) { const r = getr(Z.uid); if (!r) return; r.img = img; r.imgCrop = { x: 50, y: 50, scale: 1 }; r.modified = Date.now(); sichern(); }
async function bildErzeugen(gratis) {
  const r = getr(Z.uid); if (!r) return;
  let schluessel = '';
  if (!gratis) { schluessel = (await lager.hol('schluessel-openai')) || ''; if (!schluessel) return schluesselFenster(true); }
  Z.fenster = null; zeichne();
  try {
    const img = await W.mit(gratis ? L('Gratis-Foto wird erzeugt …', 'Creating free photo …') : L('KI-Bild wird erzeugt (etwa 20 s) …', 'Creating AI picture (about 20 s) …'), async (w) => {
      const roh = gratis ? await gratisBild(sicht(r), { art: 'getraenk' }) : await kiBild(schluessel, sicht(r), { art: 'getraenk' });   // Getränke-Auftrag aus dem Kern (0.11)
      w.text(L('Bild wird gespeichert …', 'Saving the picture …')); return bildAusDatei(await (await fetch(roh)).blob()); });
    bildSetzen(img); melde(L('Das neue Bild ist da.', 'The new picture is there.'));
  } catch (f) { melde(L('Das hat nicht geklappt: ', 'That did not work: ') + (f && f.message ? f.message : L('unbekannter Fehler', 'unknown error'))); }
}
/* Der OpenAI-Schlüssel bleibt nur auf diesem Gerät (Kern-Speicher), steht in keiner Sicherung und wird nie aus der alten App übernommen. */
async function schluesselFenster(fuerBild) {
  const da = !!(await lager.hol('schluessel-openai'));
  Z.fenster = { titel: L('OpenAI-Schlüssel', 'OpenAI key'), html: `${da ? `<p class="ftext">${L('Es ist ein Schlüssel gespeichert.', 'A key is saved.')}</p>` : ''}<form id="skform" class="felder" autocomplete="off"><label>${L('Schlüssel (beginnt mit sk-)', 'Key (starts with sk-)')}${frag(L('Für KI-Bilder brauchst du einen eigenen Schlüssel von OpenAI. Er bleibt nur auf diesem Gerät, steht in keiner Sicherung und geht nur an OpenAI, wenn du ein Bild erzeugen lässt.', 'AI pictures need your own OpenAI key. It stays on this device only, is in no backup and goes to OpenAI only when you create a picture.'))}<input class="feld" name="k" type="password" autocomplete="off" placeholder="sk-…"></label><div class="reihe ende">${da ? `<button type="button" class="knopf hell rotschrift" data-a="schluessel-weg">${I('trash')}${L('Schlüssel löschen', 'Delete key')}</button>` : ''}<button type="button" class="knopf hell" data-a="fenster-zu">${L('Abbrechen', 'Cancel')}</button><button class="knopf" type="submit">${I('check')}${L('Speichern', 'Save')}</button></div></form>`, fuerBild };
  zeichne();
}

/* ── Tresor (Küchen-Kern): bis zu 5 automatische und 10 benannte Stände im Gerät. Schützt vor Versehen; gegen das Leeren
   des Browsers schützt nur die Sicherung als Datei. Automatisch wird vor jedem Eingriff abgelegt, der viel ändert. */
const sicherungObjekt = () => JSON.parse(sicherungText());
async function tresorAuto(grund) { try { if (A.getraenke.some(G.istSichtbar)) await tr.ablegen(sicherungObjekt(), 'auto', grund); } catch (e) { /* der Tresor darf nie etwas aufhalten */ } }
async function tresorFenster() {
  const l = await tr.liste(), zeit = (ts) => new Date(ts).toLocaleString(sprache() === 'de' ? 'de-DE' : 'en-GB', { dateStyle: 'medium', timeStyle: 'short' });
  Z.fenster = { titel: L('Tresor', 'Vault'), html: `<form id="trform" class="reihe" autocomplete="off"><input class="feld" name="name" style="flex:1;min-width:0" placeholder="${L('Name, z. B. vor dem Aufräumen', 'Name, e.g. before tidying')}"><button class="knopf" type="submit">${I('safe')}${L('Jetzt ablegen', 'Store now')}</button>${frag(L('Stände deiner Sammlung in diesem Gerät: bis zu 5 automatische (vor großen Änderungen) und 10 benannte. Gegen das Leeren des Browsers hilft nur die Sicherung als Datei.', 'States of your collection on this device: up to 5 automatic (before big changes) and 10 named. Only a backup file protects against clearing the browser.'))}</form>${l.map((x) => `<div class="slot"><span class="mitte"><strong>${esc(x.name)}</strong><small>${zeit(x.ts)} · ${x.anzahl} ${L('Getränke', 'drinks')} · ${x.art === 'auto' ? L('automatisch', 'automatic') : L('benannt', 'named')}</small></span><button class="chip" data-a="tresor-holen" data-id="${esc(x.id)}">${L('Zurückholen', 'Restore')}</button><button class="rund klein" data-a="tresor-weg" data-id="${esc(x.id)}" aria-label="${L('Löschen', 'Delete')}">${I('trash')}</button></div>`).join('') || `<p class="leer">${L('Noch nichts im Tresor.', 'Nothing in the vault yet.')}</p>`}` };
  zeichne();
}
async function tresorHolen(id) {
  const s = await tr.hol(id); if (!s) return melde(L('Dieser Stand ist nicht mehr da.', 'This state is gone.'));
  frage(L('Stand zurückholen', 'Restore state'), L(`Deine jetzige Sammlung wird durch diesen Stand ersetzt (${(s.recipes || []).length} Getränke). Der jetzige Stand wird vorher automatisch im Tresor abgelegt.`, `Your current collection is replaced by this state (${(s.recipes || []).length} drinks). The current state is stored in the vault first.`), L('Zurückholen', 'Restore'), async () => {
    await tresorAuto(L('vor dem Zurückholen', 'before restoring'));
    const g = G.sicherungLesen(s, { knoten: A.knoten });
    A = { ...G.leereSammlung(A), getraenke: g.getraenke, ordner: g.ordner, karten: g.karten, einkauf: Array.isArray(s.einkauf) ? s.einkauf : [], anlaesse: Array.isArray(s.anlaesse) ? s.anlaesse : [], kategorien: A.kategorien, einstellungen: A.einstellungen, knoten: A.knoten };
    A.kategorien = G.katZustandZuKern({ ...(s.kategorienZustand || A.kategorien), neu: g.kategorien }); if (s.einkaufLaeden) A.einkaufLaeden = s.einkaufLaeden; if (s.plan && typeof s.plan === 'object') A.plan = s.plan;
    sichern(); Z.fenster = null; Z.view = 'start'; Z.uid = null; Z.kat = 'all'; melde(L('Stand zurückgeholt.', 'State restored.')); zeichne(true);
  });
}

/* ── Sicherung ── Format wie die alte App (version 10), damit beide Richtungen gehen. */
function sicherungText() { return JSON.stringify({ version: G.SICHERUNG_VERSION, exported: new Date().toISOString(), app: 'Mein Mixarium ' + FASSUNG, knoten: A.knoten || undefined, recipes: A.getraenke, folders: A.ordner, menu: A.karten || [], kategorien: G.katListeFuerSicherung(A.kategorien), kategorienZustand: A.kategorien, einkauf: A.einkauf, einkaufLaeden: A.einkaufLaeden, plan: A.plan, anlaesse: A.anlaesse || [] }); }   // kategorienZustand/einkaufLaeden: neu, die bisherige App übergeht sie
function sichernDatei() {
  const d = new Date(), p = (n) => String(n).padStart(2, '0');
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([sicherungText()], { type: 'application/json' }));
  a.download = `mein-mixarium-${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}-${p(d.getHours())}h${p(d.getMinutes())}.json`; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  melde(L('Sicherung gespeichert (Ordner „Downloads“).', 'Backup saved (Downloads folder).'));
}
async function einspielenDatei(datei) {
  try {
    await tresorAuto(L('vor dem Einspielen', 'before restoring a file'));
    const text = await datei.text(), e = G.sicherungEinspielen(A, text, { knoten: A.knoten });
    A = { ...A, ...e.sammlung }; inForm();
    let roh = null; try { roh = JSON.parse(text); } catch (f) { /* gelesen hat sie schon sicherungEinspielen */ }
    if (roh && roh.kategorienZustand) { const f = G.katZustandZuKern(roh.kategorienZustand), k = A.kategorien; A.kategorien = { ...k, eigene: [...k.eigene, ...f.eigene.filter((c) => !k.eigene.some((x) => x.id === c.id))], namen: { ...f.namen, ...k.namen } }; }   // die eigenen Namen gewinnen
    sichern(); Z.view = 'start'; Z.kat = 'all';
    const ohne = (e.ohneKategorie || []).length;
    melde(L(`${e.neu.length} Getränke hinzugefügt${e.uebersprungen && e.uebersprungen.length ? `, ${e.uebersprungen.length} waren schon da` : ''}${ohne ? `, ${ohne} ohne Kategorie` : ''}.`, `${e.neu.length} drinks added${e.uebersprungen && e.uebersprungen.length ? `, ${e.uebersprungen.length} already there` : ''}.`));
  } catch (err) { melde(L('Diese Datei ist keine Sicherung, die ich lesen kann.', 'This file is not a backup I can read.')); }
}
async function ausAlterApp(still) {
  const alt = G.ausAlterApp(await alteAppLesen());
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
/* Farbe, Ton und Schriftgröße setzt der Kern als CSS-Variablen auf das App-Element. `--pa` ist die reine Palettenfarbe
   (für eigene Mischungen dieser Ausgabe). */
function kernStil() { const el = $('.mx'); farbeSetzen(el, E.farbe, E.ton); el.style.setProperty('--pa', (FARBEN[E.farbe] || FARBEN.blau).akz); E.schrift = schriftSetzen(el, E.schrift); }
/* Kacheln dicht packen (Klaus 23.11.: „die kleineren sollen so aufrücken, dass keine Zwischenräume leer bleiben“):
   natürliche Breite messen, dann der Reihe nach immer die breiteste Kachel nehmen, die in die aktuelle Reihe noch passt
   (erste Passung, absteigend). Die Reihenfolge wird nur über `order` gesetzt; danach füllen die Kacheln ihre Reihe. */
function kachelnPacken() {
  for (const r of document.querySelectorAll('.kachelraster:not(.drei)')) {
    const k = [...r.children]; if (k.length < 3) continue;
    r.classList.add('messen'); const breite = r.clientWidth, luecke = 7, w = k.map((x) => x.getBoundingClientRect().width); r.classList.remove('messen');
    const offen = k.map((x, i) => i).sort((a, b) => w[b] - w[a]); let ord = 0;
    while (offen.length) { let frei = breite; for (let j = 0; j < offen.length;) { const i = offen[j], brauch = w[i] + (frei < breite ? luecke : 0); if (brauch <= frei + 0.5) { k[i].style.order = String(ord++); frei -= brauch; offen.splice(j, 1); } else j++; } }
  }
}
function zeichne(frisch) {
  inForm();
  const br = breit(), v = Z.view, mix = v === 'mix';
  const basis = mix ? 'getraenk' : v;
  const h = basis === 'start' ? vStart(br) : basis === 'getraenk' ? vGetraenk(br) : basis === 'einkauf' ? vEinkauf(br) : basis === 'karte' ? vKarte(br) : basis === 'labor' ? vLabor() : basis === 'bilder' ? vBilder() : basis === 'plan' ? vPlan() : vMehr();
  const ohneKopf = !br && basis === 'getraenk', fokus = br && Z.fokus && basis === 'getraenk';
  const alt = $('.haupt'), roll = alt && zeichne.letzte === basis + '|' + Z.uid + '|' + Z.anlass ? alt.scrollTop : 0;
  const such = document.activeElement && document.activeElement.id === 'suche' ? document.activeElement.selectionStart : null;
  $('#app').innerHTML = `<div class="mx ${br ? 'breit' : 'handy'} fl-${E.fl.seite} ${frisch ? 'frisch' : ''} ${dunkel() ? 'dunkel' : ''} ${E.navZu ? 'navzu' : ''} ${fokus ? 'fokus' : ''}">${ohneKopf ? '<div></div>' : kopf(br)}${br && !fokus ? navLinks() : ''}<main class="haupt" id="haupt">${h}</main>${br || mix ? '' : flLeiste()}${mix ? vMix(br) : ''}${menue()}${fenster()}${bildVoll()}${Z.toast ? `<div class="mxtoast" role="status">${I('check')}${esc(Z.toast)}</div>` : ''}</div>`;
  kernStil();
  zeichne.letzte = basis + '|' + Z.uid + '|' + Z.anlass;
  if (roll) $('.haupt').scrollTop = roll;
  if (such !== null) { const s = $('#suche'); if (s) { s.focus(); s.setSelectionRange(such, such); } }
  document.documentElement.lang = sprache();
  document.body.style.background = getComputedStyle($('.mx')).backgroundColor;
  if ($('.kachelraster')) kachelnPacken();
}
function setze(f, frisch) {
  const go = () => { f(); zeichne(frisch); };
  if (document.startViewTransition && !matchMedia('(prefers-reduced-motion: reduce)').matches) document.startViewTransition(go); else go();
}
function geh(v) { history.pushState({ v }, ''); setze(() => { Z.view = v; Z.flAuf = false; Z.menue = null; if (v === 'mix') { Z.step = 0; Z.richt = 'vor'; wachAn(); } if (v !== 'karte') Z.anlass = null; }, true); }
function zurueck() { if (Z.bildVoll) { Z.bildVoll = false; if (Z.nachBild) { Z.nachBild = false; Z.bildWerk = false; return bildBlatt(); } return zeichne(); } if (Z.fenster) return fZu(); if (Z.menue) { Z.menue = null; return zeichne(); } if (Z.view === 'mix') return mixZu(); if (Z.view === 'karte' && Z.anlass) return setze(() => { Z.anlass = null; }, true); if (Z.view !== 'start') return setze(() => { Z.view = Z.view === 'getraenk' ? 'start' : 'start'; Z.fokus = false; }, true); }
function oeffne(uid) { const r = getr(uid); if (!r) return; history.pushState({ v: 'getraenk' }, ''); setze(() => { Z.uid = uid; Z.view = 'getraenk'; Z.port = Number(r.servings) || 1; Z.einheit = null; Z.flAuf = false; Z.bildWerk = false; }, true); }

/* Bildschirm wach halten, solange die Mix-Ansicht offen ist (wo das Gerät es erlaubt). */
let wachSperre = null;
async function wachAn() { try { if (navigator.wakeLock) { wachSperre = await navigator.wakeLock.request('screen'); Z.wach = true; if (Z.view === 'mix') zeichne(); } } catch (e) { Z.wach = false; } }
function wachAus() { try { if (wachSperre) wachSperre.release(); } catch (e) { /* schon frei */ } wachSperre = null; Z.wach = false; }
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && Z.view === 'mix') wachAn(); });
function mixZu() { wachAus(); setze(() => { Z.view = 'getraenk'; Z.step = 0; }, true); }
function schritt(d) { const r = getr(Z.uid), n = Math.max(1, (r.steps || []).length); const neu = Math.min(n - 1, Math.max(0, Z.step + d)); if (neu === Z.step) return; Z.richt = d > 0 ? 'vor' : 'zur'; Z.step = neu; zeichne(); }

/* ── Kategorien verwalten (Vorbild: Mein Rezeptbuch, neu/app.mjs) ── */
const EMOJI = '🥤 🍹 🍸 🍋 ☕ 🍶 🫙 🥨 🍢 🍷 🍺 🥂 🧃 🥛 🍵 🫖 🧉 🍾 🥃 🍓 🍒 🍑 🍍 🥭 🍌 🍇 🍉 🍊 🍎 🥥 🥝 🫐 🌿 🍃 🌸 🧊 🔥 ❄️ ⭐ ❤️ 🎄 🎂 🎉 🌞 🌙 👶 🍣 🍕 🍰 🍮 🍪 🧁 🍫 🍦 🍯'.split(' ');
function katFenster() {
  const alle = K.alleKategorien(A.getraenke, A.kategorien), aus = (A.kategorien.ausgeblendet || []).filter((id) => !alle.some((c) => c.id === id)).map((id) => G.KATEGORIEN.find((c) => c.id === id)).filter(Boolean);
  const zeile = (c) => { const n = katZahl(A.getraenke, c.id), eig = (A.kategorien.namen[c.id] && A.kategorien.namen[c.id].name) || '', ohne = c.art === 'ohne';
    return `<div class="kat-zeile" data-kid="${esc(c.id)}"><span class="griff" aria-hidden="true" title="${L('Zum Verschieben lange drücken oder ziehen', 'Long-press or drag to move')}">${I('griff')}</span><button class="kat-zeichen" data-a="kat-emoji" data-kid="${esc(c.id)}" aria-label="${L('Bild oder Zeichen ändern', 'Change picture or symbol')}">${katSticker(c)}</button>${ohne ? `<span class="kat-fest">${esc(katText(c))}</span>` : `<input class="feld kat-name" data-kid="${esc(c.id)}" value="${esc(c.art === 'eigen' && !eig ? c.de : eig)}" placeholder="${esc(c[sprache()] || c.de || c.id)}" aria-label="${L('Name der Kategorie', 'Category name')} ${esc(katText(c))}" autocomplete="off">`}<small>${n}</small>${ohne ? '<span class="platz"></span>' : `<button class="rund klein" data-a="kat-weg" data-kid="${esc(c.id)}" aria-label="${L('Kategorie löschen', 'Delete category')} ${esc(katText(c))}">${I('trash')}</button>`}</div>`; };
  Z.fenster = { titel: L('Kategorien', 'Categories'), html: `<p class="ftext klein">${L('Umbenennen, ordnen, löschen', 'Rename, reorder, delete')}${frag(L('Namen und Zeichen kannst du frei ändern; ein leeres Namensfeld heißt Vorgabe. Ein eigener Name gilt in allen Sprachen. Zum Ordnen eine Zeile am Griff lange drücken oder mit der Maus ziehen. Eine Kategorie mit Getränken fragt beim Löschen, wohin die Getränke sollen.', 'You can change names and symbols freely; an empty name means the default. Your own name applies in all languages. To reorder, long-press a row at its handle or drag it with the mouse. A category with drinks asks where its drinks should go when you delete it.'))}</p>
   <div class="kat-liste" id="kat-liste">${alle.map(zeile).join('')}</div><div class="reihe" style="margin-top:12px"><button class="knopf" data-a="kat-neu">${I('plus')}${L('Neue Kategorie', 'New category')}</button></div>
   ${aus.length ? `<h3 class="eh">${L('Ausgeblendet', 'Hidden')}</h3><div class="eliste">${aus.map((c) => `<button class="ezeile" data-a="kat-zurueck" data-kid="${esc(c.id)}">${I('plus')}<span><b>${esc(katText(c))}</b><small>${L('wieder zeigen', 'show again')}</small></span></button>`).join('')}</div>` : ''}`, kat: true };
}
function katWegFenster(id) {
  const c = K.alleKategorien(A.getraenke, A.kategorien).find((x) => x.id === id), n = katZahl(A.getraenke, id);
  const ziele = K.alleKategorien(A.getraenke, A.kategorien).filter((x) => x.art !== 'ohne' && x.id !== id);
  Z.fenster = { titel: L(`Wohin mit ${n} Getränken?`, `Where should ${n} drinks go?`), html: `<p class="ftext">${L(`„${esc(katText(c))}“ wird gelöscht. Die Getränke bleiben und bekommen die Kategorie, die du hier wählst.`, `“${esc(katText(c))}” will be deleted. The drinks stay and get the category you pick here.`)}</p><div class="eliste">${ziele.map((x) => `<button class="ezeile" data-a="kat-weg-ziel" data-kid="${esc(id)}" data-ziel="${esc(x.id)}"><span class="kat-zeichen klein">${katSticker(x)}</span><span><b>${esc(katText(x))}</b><small></small></span></button>`).join('')}<button class="ezeile" data-a="kat-weg-ziel" data-kid="${esc(id)}" data-ziel="">${I('frage')}<span><b>${L('ohne Kategorie', 'no category')}</b><small>${L('sie erscheinen unter „Ohne Kategorie“', 'they appear under “No category”')}</small></span></button></div><div class="reihe ende"><button class="knopf hell" data-a="kategorien">${L('Abbrechen', 'Cancel')}</button></div>` };
}
function katLoeschenMit(id, ziel) {
  const c = K.alleKategorien(A.getraenke, A.kategorien).find((x) => x.id === id), name = c ? katText(c) : id;
  const l = K.loeschen(A.getraenke, A.kategorien, id, ziel); A.getraenke = l.rezepte; A.kategorien = l.kat; if (Z.kat === id) Z.kat = 'all'; sichern(); katFenster();
  melde(l.verschoben ? L(`„${name}“ gelöscht, ${l.verschoben} Getränke umgehängt.`, `“${name}” deleted, ${l.verschoben} drinks moved.`) : L(`„${name}“ gelöscht.`, `“${name}” deleted.`));
}

/* ── Bedienung ── */
const TUN = {
  kategorien() { katFenster(); },
  hinweise() { E.hinweiseAus = !E.hinweiseAus; einstSichern(); melde(E.hinweiseAus ? L('Hinweis-Blasen aus', 'Tooltips off') : L('Hinweis-Blasen an', 'Tooltips on')); },
  'lab-kat'(b) { Z.lab.zutaten = ($('#labzutaten') && $('#labzutaten').value) || Z.lab.zutaten; Z.lab.kat = b.dataset.k; },
  'lab-geschmack'(b) { Z.lab.zutaten = ($('#labzutaten') && $('#labzutaten').value) || Z.lab.zutaten; const g = Z.lab.geschmack, x = b.dataset.g; Z.lab.geschmack = g.includes(x) ? g.filter((y) => y !== x) : [...g, x]; },
  'lab-erfinden'() { labErfinden(); return false; },
  'lab-verwerfen'() { Z.lab.entwurf = null; },
  'lab-sichern'() { const e = Z.lab.entwurf; if (!e) return; const d = LAB.getraenkAusEntwurf(e, { cat: Z.lab.kat });
    const r = G.getraenkNormalisieren({ ...d, id: A.getraenke.reduce((m, x) => Math.max(m, Number(x.id) || 0), 0) + 1, uid: G.neueUid(A.knoten) }); Object.assign(r, { labStatus: d.labStatus, labRatings: [], labScore: 0, labGen: true, labRevision: 0, labLog: d.labLog, notes: d.notes });
    A.getraenke.unshift(r); Z.lab.entwurf = null; sichern(); melde(L('Im Labor', 'In the lab')); },
  'lab-bewerten'(b) { const r = getr(b.dataset.u); if (r) labBewertenFenster(r); },
  'lab-annehmen'(b) { const r = getr(b.dataset.u); if (!r) return; LAB.annehmen(r); sichern(); melde(L('Im Buch', 'In the book')); },
  'lab-favorit'(b) { const r = getr(b.dataset.u); if (!r) return; const an = LAB.favorit(r); sichern(); melde(an ? L('Geschützt', 'Protected') : L('Schutz aus', 'Protection off')); },
  'lab-entfernen'(b) { const r = getr(b.dataset.u); if (!r) return; if (r.labFavorite) { melde(L('Erst den Schutz aufheben', 'Remove protection first')); return; }
    frage(L('Aus dem Labor verwerfen', 'Discard from the lab'), L(`„${esc(r.name)}“ wird verworfen. Es bleibt unter „Entfernte Getränke“ und lässt sich wiederherstellen.`, `“${esc(r.name)}” will be discarded. It stays under “Removed drinks” and can be restored.`), L('Verwerfen', 'Discard'), () => { LAB.entfernen(r); sichern(); fZu(); }, true); return false; },
  'lab-zurueck'(b) { const r = getr(b.dataset.u); if (!r) return; LAB.wiederherstellen(r); sichern(); melde(L('Zurück im Labor', 'Back in the lab')); },
  'lab-entfernte'() { Z.lab.entfernteAuf = !Z.lab.entfernteAuf; },
  'lab-ueberarbeiten'(b) { const r = getr(b.dataset.u); if (r) labUeberarbeiten(r); return false; },
  'lab-rev-ja'(b) { const r = getr(b.dataset.u); if (!r) return; LAB.ueberarbeitungAnnehmen(r); sichern(); melde(L('Neue Fassung aktiv', 'New version active')); },
  'lab-rev-nein'(b) { const r = getr(b.dataset.u); if (!r) return; LAB.ueberarbeitungAblehnen(r); sichern(); melde(L('Original bleibt', 'Original kept')); },
  'lab-solo'() { A.einstellungen.labSolo = !labSolo(); sichern(); melde(labSolo() ? L('Eine Bewertung genügt', 'One rating is enough') : L('Drei Bewertungen', 'Three ratings')); },
  anthropic() { anthropicFenster(false); return false; },
  'anthropic-weg'() { lager.weg('schluessel-anthropic').then(() => { Z.fenster = null; melde(L('Schlüssel gelöscht.', 'Key deleted.')); }); return false; },
  sinn() { if (E.sinn) { E.sinn = false; sem.ids = []; sem.fuer = ''; einstSichern(); melde(L('Sinn-Suche aus', 'Meaning search off')); return; }
    frage(L('Sinn-Suche einschalten?', 'Turn on meaning search?'), L('Sie findet Getränke auch nach Bedeutung, zum Beispiel „etwas Erfrischendes“ oder „für den Winter“. Dafür lädt die App einmalig ein Sprachmodell aus dem Netz (etwa 120 MB). Danach rechnet sie im Gerät; deine Getränke gehen nirgendwohin.', 'It also finds drinks by meaning, e.g. “something refreshing” or “for winter”. For this the app loads a language model from the internet once (about 120 MB). After that it works on the device; your drinks go nowhere.'), L('Einschalten', 'Turn on'), () => { E.sinn = true; sem.status = ''; einstSichern(); Z.fenster = null; zeichne(); if (Z.suche.trim()) semPlanen(); else semBereit().then(() => melde(L('Sinn-Suche bereit', 'Meaning search ready'))).catch(() => melde(L('Die Sinn-Suche ließ sich nicht laden.', 'The meaning search could not be loaded.'))); }); return false; },
  'plan-waehlen'(b) { planWahl(b.dataset.tag); }, planen() { planWahl(null, Z.uid); },
  'plan-setzen'(b) { A.plan = planen(A.plan, b.dataset.tag, b.dataset.uid); sichern(); Z.fenster = null; if (Z.view !== 'plan') melde(L('Im Wochenplan eingetragen.', 'Added to the week plan.')); },
  'plan-weg'(b) { A.plan = entplanen(A.plan, b.dataset.tag, b.dataset.uid); sichern(); },
  'plan-woche'(b) { const d = new Date(Z.planTag); d.setDate(d.getDate() + Number(b.dataset.tage)); Z.planTag = d; },
  'plan-heute'() { Z.planTag = new Date(); },
  'plan-einkauf'() { const w = woche(Z.planTag); let n = 0, da = 0;
    for (const t of w.tage) for (const uid of A.plan[tagIso(t)] || []) { const r = getr(uid); if (!r) continue; const v = sicht(r); if (A.einkauf.some((p) => !p.ok && p.fuer.includes(v.name))) { da++; continue; } einkaufDazu(v, Number(r.servings) || 1, v.name); n++; }
    sichern(); melde(n ? L(`${n} Getränke auf die Einkaufsliste gesetzt.`, `${n} drinks added to the shopping list.`) : L('Alle Getränke der Woche stehen schon auf der Liste.', 'All drinks of the week are already on the list.')); },
  /* Text-Import ohne KI (Kern: import/text.mjs, kennt seit 0.15 auch oz, Barlöffel, Dash …). Das Ergebnis steht im Formular
     zum Prüfen; gespeichert wird erst dort. Nichts geht ins Netz. */
  'text-import'() { Z.flAuf = false; Z.fenster = { titel: L('Getränk aus Text', 'Drink from text'), html: `<p class="ftext klein">${L('Erste Zeile = Name', 'First line = name')}${frag(L('Rezepttext einfügen, etwa aus einer Mail, einer Notiz oder von einer Webseite. Die erste Zeile ist der Name. Die App teilt ohne KI in Zutaten und Schritte; du siehst das Ergebnis im Formular und speicherst dort.', 'Paste a recipe text, e.g. from an e-mail, a note or a web page. The first line is the name. The app splits it into ingredients and steps without AI; you check the result in the form and save there.'))}</p><label class="felder">${mikro('#imptext')}<textarea class="feld" id="imptext" rows="10" placeholder="${L('Virgin Mojito\n\nZutaten\n2 cl Limettensaft\n…\n\nZubereitung\n1. Minze andrücken …', 'Virgin Mojito\n\nIngredients\n2 cl lime juice\n…\n\nMethod\n1. Muddle the mint …')}"></textarea></label><div class="reihe ende"><button type="button" class="knopf hell" data-a="fenster-zu">${L('Abbrechen', 'Cancel')}</button><button type="button" class="knopf" data-a="text-aufteilen">${I('check')}${L('Aufteilen', 'Split')}</button></div>` }; },
  'text-aufteilen'() {
    const t = $('#imptext') && $('#imptext').value, r = rezeptAusText(t); if (!r) { melde(L('Bitte zuerst einen Text einfügen.', 'Please paste a text first.')); return false; }
    diktatAus();
    const ings = r.ings.map((z) => ({ amt: z.amt, unit: z.unit, name: z.note ? `${z.name} (${z.note})` : z.name }));
    const alk = G.alkoholBefund({ ings }).alkohol;
    editor({ name: r.name || '', servings: r.servings || 1, prepTime: r.prepTime || null, ings, steps: r.steps, alcohol: alk, cat: alk ? 'ckt' : (Z.kat !== 'all' ? Z.kat : 'mock'),
      hinweis: r.sicher ? L('Aus dem Text übernommen. Bitte prüfen und speichern.', 'Taken from the text. Please check and save.') : L('Ohne Überschriften „Zutaten“/„Zubereitung“ geraten. Bitte genau prüfen.', 'Guessed without “Ingredients”/“Method” headings. Please check carefully.') }, true);
    return false; },
  'bilder-filter'(b) { Z.bilder.filter = b.dataset.f; }, 'bilder-gross'() { Z.bilder.gross = !Z.bilder.gross; },
  'bild-wahl'(b) { const w = Z.bilder.wahl, u = b.dataset.uid; if (w.has(u)) w.delete(u); else w.add(u); },
  'bilder-alle-wahl'() { const w = Z.bilder.wahl, alle = [...document.querySelectorAll('.bildkachel')].map((x) => x.dataset.uid); if (w.size === alle.length) w.clear(); else alle.forEach((u) => w.add(u)); },
  'bilder-weg'() { const u = [...Z.bilder.wahl]; if (!u.length) return false; frage(L('Bilder löschen', 'Delete pictures'), L(`${u.length} Bilder werden entfernt. Die Getränke mit ihrem Text bleiben.`, `${u.length} pictures will be removed. The drinks and their text stay.`), L('Löschen', 'Delete'), () => { Z.fenster = null; bilderLoeschen(u, L('vor „Bilder löschen“', 'before deleting pictures')); }, true); return false; },
  'bilder-alle-weg'() { const u = A.getraenke.filter((r) => r.img).map((r) => r.uid); frage(L('Alle Bilder löschen', 'Delete all pictures'), L(`${u.length} Bilder werden entfernt. Die Getränke mit ihrem Text bleiben.`, `${u.length} pictures will be removed. The drinks and their text stay.`), L('Alle Bilder löschen', 'Delete all pictures'), () => { Z.fenster = null; bilderLoeschen(u, L('vor „Alle Bilder löschen“', 'before deleting all pictures')); }, true); return false; },
  'bild-dazu'(b) { Z.uid = b.dataset.uid; Z.bildWerk = false; bildBlatt(); return false; },
  'kat-neu'() { const a = katAnlegen(A.kategorien, L('Neue Kategorie', 'New category')); A.kategorien = a.kat; sichern(); katFenster(); zeichne(); const f = document.querySelector(`.kat-name[data-kid="${a.id}"]`); if (f) { f.focus(); f.select(); } return false; },
  'kat-weg'(b) { const id = b.dataset.kid; if (katZahl(A.getraenke, id)) katWegFenster(id); else katLoeschenMit(id, null); },
  'kat-weg-ziel'(b) { katLoeschenMit(b.dataset.kid, b.dataset.ziel); return false; },
  'kat-zurueck'(b) { A.kategorien = { ...A.kategorien, ausgeblendet: A.kategorien.ausgeblendet.filter((x) => x !== b.dataset.kid) }; sichern(); katFenster(); },
  'kat-emoji'(b) { const id = b.dataset.kid, bilder = A.getraenke.filter((r) => G.istSichtbar(r) && r.img && katVonRezept(r) === id), gew = A.kategorien.namen[id] && A.kategorien.namen[id].bild, jetzt = (katBild(A.getraenke, A.kategorien, id) || {}).uid;
    Z.fenster = { titel: L('Bild oder Zeichen', 'Picture or symbol'), html: `${bilder.length ? `<h3 class="eh">${L('Foto als Sticker', 'Photo as sticker')}${frag(L('Ein kleines Foto aus dieser Kategorie, wie ein Sticker. Ohne Wahl steht das erste Getränk mit Bild.', 'A small photo from this category, like a sticker. Without a choice, the first drink with a picture is used.'))}</h3><div class="sticker-raster">${bilder.map((r) => `<button data-a="kat-bild-setzen" data-kid="${esc(id)}" data-uid="${esc(r.uid)}" aria-pressed="${r.uid === jetzt}" aria-label="${esc(r.name)}"><img src="${esc(r.img)}" alt="" loading="lazy"></button>`).join('')}</div>${gew ? `<div class="reihe"><button class="knopf hell" data-a="kat-bild-setzen" data-kid="${esc(id)}" data-uid="">${L('Vorgabe: erstes Bild', 'Default: first picture')}</button></div>` : ''}<h3 class="eh">${L('Zeichen, wenn es kein Bild gibt', 'Symbol if there is no picture')}</h3>` : `<p class="ftext">${L('In dieser Kategorie hat noch kein Getränk ein Bild. Bis dahin steht das Zeichen.', 'No drink in this category has a picture yet. Until then the symbol is shown.')}</p>`}<div class="emoji-raster">${EMOJI.map((x) => `<button data-a="kat-emoji-setzen" data-kid="${esc(id)}" data-em="${x}" aria-label="${x}">${x}</button>`).join('')}</div><div class="reihe ende"><button class="knopf hell" data-a="kat-emoji-setzen" data-kid="${esc(id)}" data-em="">${L('Vorgabe', 'Default')}</button><button class="knopf hell" data-a="kategorien">${L('Zurück', 'Back')}</button></div>` }; },
  'kat-bild-setzen'(b) { A.kategorien = bildWaehlen(A.kategorien, b.dataset.kid, b.dataset.uid || null); sichern(); katFenster(); },
  'kat-emoji-setzen'(b) { const id = b.dataset.kid, e = b.dataset.em, namen = { ...A.kategorien.namen }, v = { ...(namen[id] || {}) }; if (e) v.emoji = e; else delete v.emoji; if (Object.keys(v).length) namen[id] = v; else delete namen[id];
    A.kategorien = { ...A.kategorien, namen, eigene: A.kategorien.eigene.map((c) => (c.id === id && !e ? (({ emoji, ...rest }) => rest)(c) : c)) }; sichern(); katFenster(); },
  'ek-laden'(b) { A.einkaufLaeden = { ...A.einkaufLaeden, laden: b.dataset.l }; sichern(); },
  'ek-laden-neu'() { Z.fenster = { titel: L('Neuer Laden', 'New shop'), html: `<form id="ladenform" class="felder" autocomplete="off"><label>${L('Name', 'Name')}<input class="feld" name="n" required placeholder="${L('z. B. Getränkemarkt', 'e.g. drinks store')}"></label><div class="reihe ende"><button type="button" class="knopf hell" data-a="fenster-zu">${L('Abbrechen', 'Cancel')}</button><button class="knopf" type="submit">${I('check')}${L('Anlegen', 'Create')}</button></div></form>` }; },
  alk() { A.einstellungen.ohneAlkohol = !ohneAlk(); const r = getr(Z.uid); if (ohneAlk() && r && G.hatAlkohol(r)) { Z.view = 'start'; Z.uid = null; } if (!kats().some((x) => x.c.id === Z.kat)) Z.kat = 'all'; sichern(); },
  kopf() { Z.kopfAuf = !Z.kopfAuf; Z.menue = null; },
  navzu() { E.navZu = !E.navZu; einstSichern(); },
  menue(b) { Z.menue = Z.menue === b.dataset.m ? null : b.dataset.m; Z.flAuf = false; },
  'fl-auf'() { if (Date.now() - flGezogen < 500) return; Z.flAuf = true; },
  'fl-zu'() { Z.flAuf = false; },
  oben() { Z.flAuf = false; setTimeout(() => $('.haupt').scrollTo({ top: 0, behavior: 'smooth' })); },
  zurueck() { Z.flAuf = false; history.back(); return false; },
  fokus() { Z.fokus = !Z.fokus; },
  bildwerk() { Z.bildWerk = !Z.bildWerk; },
  diktat(b) { const feld = $(b.dataset.ziel); diktat(feld, { de: 'de-DE', en: 'en-US', es: 'es-ES', fr: 'fr-FR', it: 'it-IT', pt: 'pt-PT', ru: 'ru-RU', zh: 'zh-CN' }[sprache()] || 'de-DE', (an) => { const k = document.querySelector(`.mikro[data-ziel="${b.dataset.ziel}"]`); if (k) { k.setAttribute('aria-pressed', String(an)); k.classList.toggle('an', an); } }); return false; },
  bildblatt() { Z.bildWerk = false; bildBlatt(); return false; },
  ausschnitt() { ausschnittFenster(); return false; },
  'ausschnitt-ok'() { const r = getr(Z.uid); r.imgCrop = { ...(r.imgCrop || {}), x: Number($('#asx').value), y: Number($('#asy').value), scale: 1 }; sichern(); Z.fenster = null; melde(L('Ausschnitt gespeichert.', 'Section saved.')); return false; },
  'bild-datei'() { $('#bbdatei').click(); return false; },
  'ki-bild'() { bildErzeugen(false); return false; }, 'gratis-bild'() { bildErzeugen(true); return false; },
  schluessel() { schluesselFenster(false); return false; },
  'schluessel-weg'() { lager.weg('schluessel-openai').then(() => { Z.fenster = null; melde(L('Schlüssel gelöscht.', 'Key deleted.')); }); return false; },
  tresor() { tresorFenster(); return false; },
  'tresor-holen'(b) { tresorHolen(b.dataset.id); return false; },
  'tresor-weg'(b) { tr.loeschen(b.dataset.id).then(tresorFenster); return false; },
  loeschen() { Z.bildWerk = false; Z.fenster = { uid: Z.uid }; return TUN['ed-loeschen'](); },
  mixkopf() { Z.mixKopf = !Z.mixKopf; },
  'mix-zu'() { history.back(); return false; },
  sv() { schritt(1); return false; }, sz() { schritt(-1); return false; },
  fertig() { history.back(); setTimeout(() => melde(L('Fertig. Zum Wohl!', 'Done. Cheers!')), 60); return false; },
  plus() { Z.port = Math.min(99, Z.port + 1); }, minus() { Z.port = Math.max(1, Z.port - 1); },
  'schrift-100'() { E.schrift = 100; einstSichern(); },
  einheit() { const f = ['auto', 'orig', 'ml', 'cl', 'oz']; E.einheit = f[(f.indexOf(E.einheit) + 1) % f.length]; Z.einheit = null; einstSichern(); },
  neu() { Z.flAuf = false; editor(null); return false; },
  bearbeiten() { editor(getr(Z.uid)); return false; },
  'ed-bildweg'() { Z.fenster.img = ''; $('#edbild').innerHTML = platzbild({ name: 'x' }); return false; },
  'ed-loeschen'() { const r = getr(Z.fenster.uid); frage(L('Getränk löschen', 'Delete drink'), L(`„${esc(r.name)}“ wird aus deiner Sammlung entfernt.`, `“${esc(r.name)}” will be removed from your collection.`), L('Löschen', 'Delete'), () => { A.getraenke = A.getraenke.filter((x) => x.uid !== r.uid); (A.anlaesse || []).forEach((a) => { a.posten = a.posten.filter((p) => p.uid !== r.uid); }); sichern(); Z.fenster = null; Z.view = 'start'; Z.uid = null; melde(L('Gelöscht.', 'Deleted.')); }, true); return false; },
  'fenster-zu'() { Z.fenster = null; }, 'fenster-ja'() { const f = Z.fenster; if (f && f.ja) f.ja(); return false; },
  'einkauf-dazu'() { const r = sicht(getr(Z.uid)); einkaufDazu(r, Z.port, r.name); sichern(); melde(L('Zutaten stehen auf der Einkaufsliste.', 'Ingredients are on the shopping list.')); return false; },
  'einkauf-erledigt'() { A.einkauf = A.einkauf.filter((p) => !p.ok); sichern(); },
  'einkauf-leeren'() { frage(L('Liste leeren', 'Clear list'), L('Alle Posten werden entfernt.', 'All items will be removed.'), L('Leeren', 'Clear'), () => { A.einkauf = []; sichern(); fZu(); }, true); return false; },
  'einkauf-teilen'() { teilen(L('Einkaufsliste', 'Shopping list'), ladenFolge().map((g) => { const l = A.einkauf.filter((p) => !p.ok && gruppeVon(p.name) === g); return l.length ? gruppeName(EK.GRUPPEN.find((x) => x.id === g)) + '\n' + l.map((p) => '– ' + (p.wert !== null ? zahl(G.zahlFormatieren(p.wert)) + (p.unit ? ' ' + p.unit : '') : [p.text, p.unit].filter(Boolean).join(' ')) + ' ' + p.name).join('\n') : ''; }).filter(Boolean).join('\n\n')); return false; },
  teilen() { const r = sicht(getr(Z.uid)); teilen(r.name, r.name + '\n\n' + zutatenVon(r).map((z) => '– ' + [mengeText(z), z.name].filter(Boolean).join(' ')).join('\n') + '\n\n' + (r.steps || []).map((s, i) => `${i + 1}. ${s.txt}`).join('\n')); return false; },
  bildvoll() { Z.fenster = null; Z.bildVoll = true; history.pushState({ v: 'bild' }, ''); },
  'bildvoll-zu'() { history.back(); return false; },
  /* Klaus 23.11.: ein Tipp aufs Bild öffnet das Vollbild, von dort ein Tipp das Bild-Blatt. Ohne Bild gleich das Bild-Blatt. */
  held() { const r = getr(Z.uid); if (r && r.img) return TUN.bildvoll(); Z.bildWerk = false; bildBlatt(); return false; },
  'bildvoll-werk'() { Z.nachBild = true; history.back(); return false; },
  beispiele() { beispieleFenster(); return false; }, 'beispiele-weg'() { beispieleWeg(); return false; },
  sichern() { sichernDatei(); return false; },
  einspielen() { $('#datei').click(); return false; },
  uebernehmen() { ausAlterApp(false).then(() => zeichne(true)); return false; },
  leeren() { Z.fenster = { titel: L('Sammlung leeren', 'Empty the collection'), html: `<p class="ftext">${L('Das entfernt alle Getränke, Getränkekarten und die Einkaufsliste aus dieser App. Einstellungen bleiben. Speichere vorher eine Sicherung, dann kannst du alles wieder einspielen.', 'This removes all drinks, drinks lists and the shopping list from this app. Settings stay. Save a backup first, then you can restore everything.')}</p><div class="reihe ende"><button class="knopf hell" data-a="fenster-zu">${L('Abbrechen', 'Cancel')}</button><button class="knopf hell" data-a="sichern">${I('download')}${L('Erst sichern', 'Back up first')}</button><button class="knopf rot" data-a="fenster-ja">${L('Jetzt leeren', 'Empty now')}</button></div>`, async ja() { await tresorAuto(L('vor „Sammlung leeren“', 'before emptying')); const e = G.sammlungLeeren(A); A = { ...e.sammlung, anlaesse: [] }; sichern(); Z.fenster = null; Z.view = 'start'; Z.uid = null; Z.kat = 'all'; melde(L(`${e.entfernt.getraenke} Getränke entfernt. Die App ist leer.`, `${e.entfernt.getraenke} drinks removed. The app is empty.`)); } }; },
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
  if (ev.target.id === 'akform') { const k = String(new FormData(ev.target).get('k') || '').trim(), fl = Z.fenster.fuerLabor; if (!k) return; lager.setz('schluessel-anthropic', k).then(() => { Z.fenster = null; melde(L('Schlüssel gespeichert.', 'Key saved.')); if (fl) labErfinden(); }); return; }
  if (ev.target.id === 'labrate') { const d = new FormData(ev.target), r = getr(Z.fenster.labUid); if (!r) return; const vor = r.labStatus;
    const f = LAB.bewerten(r, { taste: d.get('taste'), practicality: d.get('practicality'), originality: d.get('originality'), description: d.get('description') }, String(d.get('fb') || ''), { solo: labSolo() });
    Z.fenster = null; sichern();
    melde(r.labStatus === 'accepted' && vor !== 'accepted' ? L('Angenommen · im Buch', 'Accepted · in the book') : r.labStatus === 'warning' && vor !== 'warning' ? L('Unter Beobachtung', 'Under watch') : r.labStatus === 'removed' ? L('Verworfen', 'Discarded') : L('Bewertet · ', 'Rated · ') + zahl(r.labScore.toFixed(1)));
    if (f.ueberarbeiten) labUeberarbeiten(r); return zeichne(); }
  if (ev.target.id === 'ladenform') { const n = String(new FormData(ev.target).get('n') || '').trim(); if (!n) return; const lae = A.einkaufLaeden; A.einkaufLaeden = { laeden: { ...lae.laeden, [n]: lae.laeden[n] || [...(lae.laeden[lae.laden] || [])] }, laden: n }; sichern(); Z.fenster = null; return zeichne(); }
  if (ev.target.id === 'trform') { tr.ablegen(sicherungObjekt(), 'benannt', String(new FormData(ev.target).get('name') || '').trim()).then(tresorFenster); return; }
  if (ev.target.id === 'skform') { const k = String(new FormData(ev.target).get('k') || '').trim(), fb = Z.fenster.fuerBild; if (!k) return; lager.setz('schluessel-openai', k).then(() => { Z.fenster = null; melde(L('Schlüssel gespeichert.', 'Key saved.')); if (fb) bildErzeugen(false); }); return; }
  if (ev.target.id === 'anform') { const d = new FormData(ev.target), titel = String(d.get('titel') || '').trim(); if (!titel) return; A.anlaesse = A.anlaesse || []; let an = A.anlaesse.find((x) => x.id === Z.fenster.anlass); if (!an) { an = { id: Date.now(), posten: [] }; A.anlaesse.unshift(an); } Object.assign(an, { titel, datum: String(d.get('datum') || '').trim(), gaeste: Number(d.get('gaeste')) || 0 }); Z.anlass = an.id; Z.fenster = null; sichern(); zeichne(true); }
});
document.addEventListener('input', (ev) => {
  if (ev.target.dataset && ev.target.dataset.lro) { const o = $('#lro-' + ev.target.dataset.lro); if (o) o.textContent = ev.target.value; return; }
  if (ev.target.id === 'asx' || ev.target.id === 'asy') { $('#asbild').style.objectPosition = `${$('#asx').value}% ${$('#asy').value}%`; return; }
  if (ev.target.id === 'schriftregler') { E.schrift = schriftSetzen($('.mx'), ev.target.value); $('#schriftzahl').textContent = E.schrift + ' %'; clearTimeout(einstSichern.uhr); einstSichern.uhr = setTimeout(einstSichern, 300); return; }
  if (ev.target.id === 'suche') { Z.suche = ev.target.value; semPlanen(); const o = $('#kartenort'); if (o) o.innerHTML = kartenHtml(); else if (Z.view !== 'start') { Z.view = 'start'; zeichne(); } const n = $('.kopf .name small'); if (n) { const z = sichtbar().length; n.textContent = `${z} ${z === 1 ? L('Getränk', 'drink') : L('Getränke', 'drinks')}`; } } });
document.addEventListener('change', async (ev) => {
  if (ev.target.classList && ev.target.classList.contains('kat-name')) { const f = ev.target, id = f.dataset.kid, eig = A.kategorien.eigene.some((c) => c.id === id);
    if (eig && f.value.trim()) A.kategorien = { ...katUmbenennen(A.kategorien, id, ''), eigene: A.kategorien.eigene.map((c) => (c.id === id ? { ...c, de: f.value.trim() } : c)) }; else if (!eig) A.kategorien = katUmbenennen(A.kategorien, id, f.value);
    sichern(); katFenster(); return; }
  if (ev.target.id === 'edfoto' && ev.target.files[0]) { try { Z.fenster.img = await W.mit(L('Foto wird aufbereitet …', 'Preparing the photo …'), () => bildAusDatei(ev.target.files[0])); $('#edbild').innerHTML = `<img class="foto" src="${Z.fenster.img}" alt="">`; } catch (e) { melde(L('Dieses Bild ließ sich nicht lesen.', 'This picture could not be read.')); } }
  if (ev.target.id === 'bbdatei' && ev.target.files[0]) { try { bildSetzen(await W.mit(L('Foto wird aufbereitet …', 'Preparing the photo …'), () => bildAusDatei(ev.target.files[0]))); Z.fenster = null; melde(L('Bild gespeichert.', 'Picture saved.')); } catch (e) { melde(L('Dieses Bild ließ sich nicht lesen.', 'This picture could not be read.')); } }
  if (ev.target.id === 'datei' && ev.target.files[0]) { await W.mit(L('Datei wird eingelesen …', 'Reading the file …'), () => einspielenDatei(ev.target.files[0])); ev.target.value = ''; zeichne(true); }
});
document.addEventListener('keydown', (ev) => {
  if (ev.key === 'Escape') { if (Z.bildVoll) return history.back(); if (Z.fenster || Z.menue) return zurueck(); if (Z.view === 'mix') return history.back(); if (Z.flAuf) { Z.flAuf = false; return zeichne(); } }
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

/* Kategorie oder Warengruppe verschieben: lange drücken (350 ms) oder mit der Maus ziehen. Übernommen aus Mein Rezeptbuch. */
let gz = null;
const gzAn = () => { if (!gz || gz.weit) return; gz.weit = true; gz.gr.classList.add('zieht'); };
document.addEventListener('pointerdown', (ev) => { const h = ev.target.closest && ev.target.closest('.gruppe-e h3, .kat-zeile .griff'); if (!h) return; const gr = h.closest('.gruppe-e, .kat-zeile'); gz = { gr, art: gr.classList.contains('kat-zeile') ? 'kat' : 'ek', y: ev.clientY, weit: false, ziel: null, uhr: setTimeout(gzAn, 350) }; try { h.setPointerCapture(ev.pointerId); } catch (e) { /* geht auch ohne */ } });
document.addEventListener('pointermove', (ev) => { if (!gz) return; if (!gz.weit && Math.abs(ev.clientY - gz.y) < 8) return; gzAn(); gz.gr.style.transform = `translateY(${ev.clientY - gz.y}px)`;
  const andere = [...document.querySelectorAll(gz.art === 'kat' ? '.kat-zeile' : '.gruppe-e')].filter((g) => g !== gz.gr); andere.forEach((g) => g.classList.remove('ziel-vor', 'ziel-nach')); let ziel = null, vor = true;
  for (const g of andere) { const r = g.getBoundingClientRect(); ziel = g; if (ev.clientY < r.top + r.height / 2) { vor = true; break; } vor = false; }
  if (ziel) { ziel.classList.add(vor ? 'ziel-vor' : 'ziel-nach'); gz.ziel = { id: ziel.dataset.g || ziel.dataset.kid, vor, nach: ziel.nextElementSibling === gz.gr ? ziel.nextElementSibling && ziel.nextElementSibling.nextElementSibling : ziel.nextElementSibling }; } });
const gzLos = () => { if (!gz) return; const g = gz; gz = null; clearTimeout(g.uhr); if (!g.weit) return;
  if (g.ziel) { const vorId = g.ziel.vor ? g.ziel.id : ((g.ziel.nach && (g.ziel.nach.dataset.g || g.ziel.nach.dataset.kid)) || null);
    if (g.art === 'kat') { A.kategorien = K.umsortieren(A.getraenke, A.kategorien, g.gr.dataset.kid, vorId); katFenster(); }
    else { const lae = A.einkaufLaeden; A.einkaufLaeden = { ...lae, laeden: { ...lae.laeden, [lae.laden]: EK.gruppeVerschieben(lae.laeden[lae.laden] || [], g.gr.dataset.g, vorId) } }; }
    sichern(); }
  zeichne(); };
document.addEventListener('pointerup', gzLos); document.addEventListener('pointercancel', gzLos);

/* ── Start ── */
async function start() {
  try {
    A = await lager.lies(); let e = await lager.hol('einst');
    if (!A) { const v = await vorabLesen(); if (v) { A = v.sammlung; e = e || v.einst; await lager.schreibe(A); if (e) await lager.setz('einst', e); } }   // Umzug aus der ersten Vorab-Fassung
    if (e) E = { ...E, ...e, fl: { ...E.fl, ...(e.fl || {}) } };
    if (E.ton === 'system') E.ton = 'geraet';
    if (!FARBEN[E.farbe]) E.farbe = 'blau';
    E.schrift = schriftWert(E.schrift);
  } catch (e) { A = null; }
  const erster = !A;
  if (!A) A = G.leereSammlung();
  A.einkauf = A.einkauf || []; A.anlaesse = A.anlaesse || []; A.einstellungen = A.einstellungen || { ohneAlkohol: false, sprache: null };
  breitWar = breit();
  hinweiseEinrichten(document, { aus: () => !!E.hinweiseAus });   // Hinweis-Blasen wie in der alten App (Kern 0.16), ausschaltbar
  zeichne(true);
  $('#start').remove();
  if (erster) { try { await ausAlterApp(true); } catch (e) { /* nichts Altes da */ } sichern(); zeichne(true); lager.dauerhaft(); }
  if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('./sw.js').catch(() => {});
}
start();
/* Für Proben: der Zustand ist von außen lesbar, nicht mehr. */
window.__mixarium = { sicherung: () => sicherungText(), get sammlung() { return A; }, get zustand() { return Z; }, get einstellungen() { return E; }, FASSUNG };
