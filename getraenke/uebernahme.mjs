/* getraenke/uebernahme.mjs — Daten aus der alten App und aus Sicherungen übernehmen;
   Beispiele einspielen/löschen; Sammlung leeren; Ausgaben `store` und `voll`.

   WOHER (QC_Mixarium_20_04_26.html):
   - Speichern/Laden: `sv` (~6520), `boot` (~6642–6705: localStorage zuerst,
     IndexedDB als Rückfall, Bilder getrennt unter `mix9m_imgs`)
   - IndexedDB `MeinMxBackup1`, Version 1, EIN Speicher `kv` mit Zeilen `{k, v}`
     („INDEXEDDB BACKUP LAYER", ~6153). Schlüssel darin: `mix9m`, `mix9m_imgs`,
     `mxms9m`, `mxfd9m`, `mix9m_bvault` (Tresor, ~14859) und `mrz9m_bvi_<id>`
     (Bilder je Tresor-Eintrag).
   - Herkunft/Kennung: `_neueUid`, `_herkunftStempeln`, `_herkunftVereinen`,
     `_ohneZuhause`, `_zusammenfuehren` (~5900–5990)
   - Export/Import: `exportData` (~10036, `version:10`), `_normalizeRecs` (~10046),
     `importData` (~10078), `importJsonFromVault` (~15017, nimmt auch `r`/`ms`/`fd`),
     `exportFromVault` (~15060, `version:9`)
   - Der `kategorien`-Block kommt aus Mein Rezeptbuch (Beispielpakete vom
     23.11.2026: Liste eigener Kategorien `{id:'eig_…', de, en, …, ico}`). Die
     alte Mixarium-App liest ihn NICHT; hier landet er bei den neu angelegten.

   GRUNDSÄTZE
   - Nichts löschen, nichts überschreiben: jede Eingabe bleibt unberührt
     (es wird auf Kopien gearbeitet), unbekannte Felder bleiben am Getränk.
   - API-Schlüssel werden NIE übernommen (`mxkey9m`, `mxmistralkey9m`, und der
     OpenAI-Schlüssel `mxoaiimg9m`, QC ~8356) — auch nicht „zur Sicherheit".
   - Rein: kein Speicher, kein Netz. Lesen und Schreiben macht der Kern. */

import { zutatTrennen } from './einheiten.mjs';
import { KATEGORIEN, KAT_OHNE, katEinstellungenLesen, leereKatEinstellungen, katVonRezept } from './kategorien.mjs';
import { alkoholBefund, schalterLesen } from './alkohol.mjs';

export const HERK_MAX = 5;                                   // wie alt
export const SICHERUNG_VERSION = 10;
/* Diese Speicher-Schlüssel sind Geheimnisse und werden nie gelesen. */
export const GEHEIME_SCHLUESSEL = Object.freeze(['mxkey9m', 'mxmistralkey9m', 'mxoaiimg9m']);
const _istGeheim = k => GEHEIME_SCHLUESSEL.includes(k) || /key|secret|token|passw/i.test(String(k));
/* Diese werden gelesen. Alles andere wird nur beim Namen genannt (`unbeachtet`). */
const GELESEN = ['mix9m', 'mxfd9m', 'mxms9m', 'mxNoAlc9', 'mxcats9m', 'mxcatsneu9m', 'mxcatsaus9m', 'mxcatord9m', 'mxlang9m', 'mxknoten9m'];

const kopie = x => (x === undefined ? undefined : JSON.parse(JSON.stringify(x)));
function _json(roh, leer) {
  if (roh == null || roh === '') return leer;
  if (typeof roh !== 'string') return kopie(roh);            // ein Dump darf schon gelesen sein
  try { const v = JSON.parse(roh); return v == null ? leer : v; } catch (e) { return leer; }
}
const _liste = x => (Array.isArray(x) ? x : []);
const _hatNamen = r => !!(r && r.name && String(r.name).trim());

/* ── Kennung ─────────────────────────────────────────────────────────────
   Wie `_neueUid`: die ersten 12 Zeichen der Knoten-Kennung, Zeit, Zufall.
   ⚠ `lokal-…` ist kein Beweis, nur eine stabile Marke — und sagt es im Namen.
   `uhr` und `zufall` lassen sich für Proben stellen. */
export function neueUid(knoten, uhr, zufall) {
  const k = String(knoten || 'lokal-unbekannt').slice(0, 12);
  const t = (uhr ? uhr() : Date.now()).toString(36);
  const z = (zufall ? zufall() : Math.random()).toString(36).slice(2, 7);
  return k + '-' + t + '-' + z;
}
function _uidGeber(optionen) {
  const o = optionen || {};
  if (typeof o.uidGeber === 'function') return o.uidGeber;
  let n = 0;                                                  // hält Kennungen im selben Tick auseinander
  return () => neueUid(o.knoten, o.uhr, o.zufall) + (n++ ? '-' + n.toString(36) : '');
}

/* ── Herkunft (wie alt) ──────────────────────────────────────────────────*/
/* Hängt DIESE Station an; keine Wiederholung direkt hintereinander; gedeckelt
   auf HERK_MAX, und wo gekürzt wurde, steht `herkGekuerzt`. Gibt Kopien zurück. */
export function herkunftStempeln(getraenke, knoten, datum) {
  const k = String(knoten || 'lokal-unbekannt'), d = datum || new Date().toISOString().slice(0, 10);
  return _liste(getraenke).map(alt => {
    const r = kopie(alt);
    if (!r || r.blank) return r;
    if (!Array.isArray(r.herkunft)) r.herkunft = [];
    const letzte = r.herkunft[r.herkunft.length - 1];
    if (letzte && letzte.k === k) return r;
    r.herkunft.push({ k, d });
    if (r.herkunft.length > HERK_MAX) { r.herkunft = r.herkunft.slice(-HERK_MAX); r.herkGekuerzt = true; }
    return r;
  });
}
/* Zwei Ketten treffen aufeinander: die LÄNGERE gewinnt, sie weiß mehr. */
export function herkunftVereinen(a, b) {
  const x = Array.isArray(a) ? a : [], y = Array.isArray(b) ? b : [];
  return y.length > x.length ? y : x;
}
/* Wie `_ohneZuhause`: wie viele hätten nach dem Einspielen keine Kategorie? */
export function ohneZuhause(getraenke, ordner) {
  return _liste(getraenke).filter(r => r && r.name && !r.blank && katVonRezept(r, ordner) === KAT_OHNE).length;
}

/* ── Ein Getränk in die neue Form ────────────────────────────────────────
   Die Pflichtfelder aus `boot` und `_normalizeRecs`, dazu:
   - `uid` (bleibt, wenn vorhanden; sonst neu)
   - Zutaten getrennt nach `amt` / `unit` / `name` (siehe `zutatTrennen`)
   - Schritte als `{id, txt}` (auch wenn sie als reine Texte kamen)
   - `cat` ist eine Zeichenkette, getrimmt; leer heißt „ohne Kategorie" und
     wird NICHT geraten
   - `blank` gilt nur ohne Namen (Vorschlag aus dem Brief des Rezeptbuchs vom
     23.11.2026, Abschnitt 5: ein benanntes Getränk mit `blank:true` fand sonst
     nur die Suche)
   Unbekannte Felder bleiben, `herkunft` bleibt. Die Eingabe wird nicht verändert. */
export function getraenkNormalisieren(alt, optionen, befund) {
  const r = kopie(alt) || {};
  const b = befund || {};
  const zaehl = k => { b[k] = (b[k] || 0) + 1; };
  if (!r.img) r.img = '';
  if (r.folder === undefined || r.folder === null) r.folder = '';
  if (!r.rating) r.rating = { stars: 0, comment: '', imps: [] };
  if (!Array.isArray(r.flavors)) r.flavors = [];
  if (!r.servings) r.servings = 4;
  if (!r.imgCrop) r.imgCrop = { x: 50, y: 50, scale: 1 };
  if (r.prepTime === undefined) r.prepTime = null;
  if (typeof r.cat !== 'string') r.cat = '';
  if (r.cat !== r.cat.trim()) { r.cat = r.cat.trim(); zaehl('kategorieGetrimmt'); }
  if (r.blank && _hatNamen(r)) { r.blank = false; zaehl('blankMitNamen'); }
  r.ings = _liste(r.ings).map((z, i) => {
    const t = zutatTrennen(z);
    if (t.amtRoh !== undefined) zaehl('zutatenGetrennt');
    if (t.id === undefined) t.id = i;
    if (t.ck === undefined) t.ck = false;
    if (t.note === undefined) t.note = '';
    return t;
  });
  r.steps = _liste(r.steps).map((s, i) => (typeof s === 'string' ? { id: i, txt: s } : { ...(s || {}), txt: String((s && s.txt) == null ? '' : s.txt) }));
  if (r.uidFrisch && !(optionen && optionen.frischMerken)) delete r.uidFrisch;
  if (!r.uid) {
    r.uid = (optionen && optionen._uid ? optionen._uid : _uidGeber(optionen))(); zaehl('uidVergeben');
    if (optionen && optionen.frischMerken) r.uidFrisch = true;
  }
  return r;
}
function _alleNormalisieren(liste, optionen, befund) {
  const o = { ...(optionen || {}), _uid: _uidGeber(optionen) };
  const out = [];
  for (const r of _liste(liste)) {
    if (!r || typeof r !== 'object') { befund.unlesbar = (befund.unlesbar || 0) + 1; continue; }
    /* Eine leere Karte ohne Namen ist kein Inhalt — die alte App speichert sie
       selbst nicht (`sv`: `R.filter(r=>!r.blank)`). Gezählt, nicht still. */
    if (!_hatNamen(r) && (r.blank || (!_liste(r.ings).length && !_liste(r.steps).length))) { befund.leereKarten = (befund.leereKarten || 0) + 1; continue; }
    out.push(getraenkNormalisieren(r, o, befund));
  }
  /* Lokale Nummern müssen Zahlen und eindeutig sein; die `uid` ist die Identität. */
  const gesehen = new Set();
  let max = out.reduce((m, r) => Math.max(m, typeof r.id === 'number' && isFinite(r.id) ? r.id : 0), 0);
  for (const r of out) {
    if (typeof r.id !== 'number' || !isFinite(r.id) || gesehen.has(r.id)) { r.idAlt = r.id; r.id = ++max; befund.nummerNeu = (befund.nummerNeu || 0) + 1; }
    gesehen.add(r.id);
  }
  return out;
}

/* ── Sammlung ────────────────────────────────────────────────────────────*/
export function leereSammlung(vorlage) {
  const v = vorlage || {};
  return {
    getraenke: [], ordner: [], karten: [], einkauf: [],
    kategorien: v.kategorien ? kopie(v.kategorien) : leereKatEinstellungen(),
    einstellungen: v.einstellungen ? kopie(v.einstellungen) : { ohneAlkohol: false, sprache: null },
    knoten: v.knoten || null,
  };
}
/* „Sammlung leeren": entfernt alle Getränke, Ordner, Karten und die
   Einkaufsliste. Einstellungen und die Knoten-Kennung bleiben (wie `clearAll`,
   das nur `mix9m`, `mxms9m`, `mxfd9m` löscht). Eigene Kategorie-NAMEN bleiben;
   neu angelegte Kategorien bleiben ebenfalls — sie sind Einstellung, kein Inhalt.
   Gibt eine NEUE Sammlung zurück und nennt, was wegfiel. Die Sicherung davor
   bietet die Oberfläche an, nicht diese Funktion. */
export function sammlungLeeren(sammlung) {
  const s = sammlung || {};
  const leer = leereSammlung(s);
  return {
    sammlung: leer,
    entfernt: { getraenke: _liste(s.getraenke).length, ordner: _liste(s.ordner).length, karten: _liste(s.karten).length, einkauf: _liste(s.einkauf).length },
  };
}

/* ── Sicherung lesen ─────────────────────────────────────────────────────
   Versteht alle Fassungen, die `importData` und `importJsonFromVault` heute
   annehmen, und dazu, was im Umlauf ist:
   - `{version:9|10, recipes, menu, folders, knoten?}`  (Export, Tresor-Export)
   - `{r, ms, fd}`                                       (Tresor-Eintrag; `r` darf
                                                          ein JSON-Text sein)
   - `{version:10, …, kategorien:[…], quelle}`           (Pakete aus Mein Rezeptbuch)
   - eine nackte Liste von Getränken
   - dasselbe als JSON-Text
   ⚠ `uidFrisch`: bringt ein Getränk KEINE `uid` mit, bekommt es hier eine — und
   die Marke `uidFrisch:true`. Sie sagt: „diese Kennung ist eben erst entstanden,
   sie beweist nichts". `zusammenfuehren` vergleicht solche Getränke deshalb über
   den NAMEN (Regel 3) und nimmt die Marke beim Aufnehmen weg. Ohne sie hätte
   dieselbe alte Sicherung beim zweiten Einspielen lauter neue Kennungen und
   käme doppelt herein (gefangen von der Probe, nicht vom Nachdenken).
   Fehlt die Liste, wirft sie „Ungültiges Format" (wie `importData`). */
export function sicherungLesen(eingabe, optionen) {
  let d = eingabe;
  if (typeof d === 'string') { try { d = JSON.parse(d); } catch (e) { throw new Error('Ungültiges Format: kein JSON'); } }
  if (Array.isArray(d)) d = { recipes: d };
  if (!d || typeof d !== 'object') throw new Error('Ungültiges Format');
  let roh = d.recipes !== undefined ? d.recipes : (d.r !== undefined ? d.r : d.getraenke);
  if (typeof roh === 'string') roh = _json(roh, null);
  if (!Array.isArray(roh)) throw new Error('Ungültiges Format');
  const befund = {};
  const kats = _liste(typeof d.kategorien === 'string' ? _json(d.kategorien, []) : d.kategorien).filter(c => c && c.id != null && String(c.id).trim());
  return {
    version: typeof d.version === 'number' ? d.version : null,
    exportiert: d.exported || null,
    quelle: d.quelle || null,
    knoten: typeof d.knoten === 'string' ? d.knoten : null,   // nur Auskunft: ändert NIE, wer diese App ist
    getraenke: _alleNormalisieren(roh, { ...(optionen || {}), frischMerken: true }, befund),
    ordner: kopie(_liste(_json(d.folders !== undefined ? d.folders : (d.fd !== undefined ? d.fd : d.ordner), []))).filter(f => f && f.id != null),
    karten: kopie(_liste(_json(d.menu !== undefined ? d.menu : (d.ms !== undefined ? d.ms : d.karten), []))),
    kategorien: kopie(kats),
    befund,
  };
}

/* ── Aus der alten App ───────────────────────────────────────────────────
   `quelle.localStorage`: Abbild {schlüssel: rohwert}.
   `quelle.indexedDB`: Dump von `MeinMxBackup1` — angenommen wird
     {kv:[{k,v},…]}, {stores:{kv:[…]}}, eine Liste [{k,v},…] oder {k: v}.
   Welche Fassung der Getränke gewinnt (wie `boot`, verallgemeinert):
   localStorage; fehlt sie → IndexedDB; sind beide da und die IndexedDB hat MEHR
   benannte Getränke, gewinnt die IndexedDB. Die alte App macht das nur auf iOS;
   hier immer, weil `sv` bei vollem Speicher nur noch die IndexedDB schreibt —
   dort liegt dann die neuere Fassung. Der Befund nennt beide Zahlen. */
function _idbKarte(dump) {
  const m = new Map();
  if (!dump) return m;
  let zeilen = Array.isArray(dump) ? dump : (Array.isArray(dump.kv) ? dump.kv : (dump.stores && Array.isArray(dump.stores.kv) ? dump.stores.kv : null));
  if (zeilen) { for (const z of zeilen) if (z && z.k != null) m.set(String(z.k), z.v); }
  else if (typeof dump === 'object') { for (const k of Object.keys(dump)) m.set(k, dump[k]); }
  return m;
}
export function ausAlterApp(quelle, optionen) {
  const q = quelle || {};
  const ls = q.localStorage || {};
  const idb = _idbKarte(q.indexedDB);
  const befund = { nichtUebernommen: [], unbeachtet: [], warnungen: [] };
  for (const k of Object.keys(ls)) {
    if (_istGeheim(k)) befund.nichtUebernommen.push(k);       // nur der NAME, nie der Wert
    else if (!GELESEN.includes(k)) befund.unbeachtet.push(k);
  }
  for (const k of idb.keys()) if (_istGeheim(k)) befund.nichtUebernommen.push('indexedDB:' + k);

  const knoten = (typeof ls.mxknoten9m === 'string' && ls.mxknoten9m) ? ls.mxknoten9m : null;
  const opt = { ...(optionen || {}), knoten: (optionen && optionen.knoten) || knoten };

  const lsR = _json(ls.mix9m, null), idbR = _json(idb.get('mix9m'), null);
  const zahl = l => (Array.isArray(l) ? l.filter(r => r && !r.blank && r.name).length : -1);
  let rohR = [], woher = 'leer';
  if (Array.isArray(lsR)) { rohR = lsR; woher = 'localStorage'; }
  if (Array.isArray(idbR) && (!Array.isArray(lsR) || zahl(idbR) > zahl(lsR))) { rohR = idbR; woher = 'indexedDB'; }
  if (ls.mix9m && !Array.isArray(lsR)) befund.warnungen.push('mix9m im localStorage ist nicht lesbar');
  befund.getraenkeAus = woher;
  befund.benannt = { localStorage: Math.max(zahl(lsR), 0), indexedDB: Math.max(zahl(idbR), 0) };

  /* Bilder liegen getrennt (`mix9m_imgs`: {lokale Nummer: Bild}) — VOR dem
     Normalisieren einsetzen, solange die alten Nummern noch gelten. */
  const bilder = _json(idb.get('mix9m_imgs'), {}) || {};
  let mitBild = 0;
  rohR = kopie(rohR).map(r => { if (r && !r.img && bilder[r.id]) { r.img = bilder[r.id]; mitBild++; } return r; });
  befund.bilderEingesetzt = mitBild;

  const getraenke = _alleNormalisieren(rohR, opt, befund);
  const ordner = _liste(_json(ls.mxfd9m, null) || _json(idb.get('mxfd9m'), [])).filter(f => f && f.id != null);
  const karten = _liste(_json(ls.mxms9m, null) || _json(idb.get('mxms9m'), []));

  /* Der Tresor (`mix9m_bvault`): mehrere Sicherungen. Sie werden mitgenommen,
     aber NICHT in die Sammlung gemischt — das entscheidet der Mensch. */
  const sicherungen = [];
  for (const e of _liste(_json(idb.get('mix9m_bvault'), []))) {
    if (!e) continue;
    try {
      const gelesen = sicherungLesen({ r: e.r, ms: e.ms, fd: e.fd }, opt);
      const eb = _json(idb.get('mrz9m_bvi_' + e.id), {}) || {};
      for (const r of gelesen.getraenke) { const alt = r.idAlt !== undefined ? r.idAlt : r.id; if (!r.img && eb[alt]) r.img = eb[alt]; }
      sicherungen.push({ id: e.id, name: e.name || '', art: e.type || '', zeit: e.ts || '', anzahl: gelesen.getraenke.length, getraenke: gelesen.getraenke, ordner: gelesen.ordner, karten: gelesen.karten });
    } catch (err) { befund.warnungen.push('Tresor-Eintrag nicht lesbar: ' + String(e.id)); }
  }

  return {
    getraenke, ordner: kopie(ordner), karten: kopie(karten), einkauf: [],
    kategorien: katEinstellungenLesen(ls),
    einstellungen: { ohneAlkohol: schalterLesen(ls.mxNoAlc9), sprache: (typeof ls.mxlang9m === 'string' && ls.mxlang9m) ? ls.mxlang9m : null },
    knoten,
    sicherungen,
    befund,
  };
}

/* ── Zusammenführen ohne Dubletten ───────────────────────────────────────
   DIE REGEL (aus `_zusammenfuehren`, QC ~5962), dokumentiert:
   1. Trägt das eingehende Getränk eine `uid` und gibt es sie schon → es kommt
      NICHT dazu; die längere Herkunfts-Kette gewinnt am vorhandenen.
   2. Trägt es eine `uid`, die es hier nicht gibt → es kommt dazu, auch wenn
      der Name schon vorkommt (Umbenannt ≠ doppelt, gleicher Name ≠ dasselbe).
   3. RÜCKFALL ohne `uid` (alte Sicherungen; auch mit der Marke `uidFrisch`,
      siehe `sicherungLesen`): es kommt nur dazu, wenn sein Name (getrimmt,
      klein geschrieben) hier noch NICHT vorkommt.
   4. Ohne Namen kommt nichts dazu.
   Die mitgebrachte `uid` bleibt; nur die lokale Nummer wird neu vergeben
   (höchste + 1 …). Neue stehen vorn (wie `R.unshift`). Ordner aus der Datei
   kommen mit; vorhandene werden nicht überschrieben.

   ⚠ BENANNTE ABWEICHUNG: steht dieselbe `uid` ZWEIMAL in der eingehenden Liste,
   kommt sie hier einmal. Die alte App prüfte nur gegen den Bestand und hätte
   beide aufgenommen.

   Rein: gibt eine neue Sammlung zurück, `sammlung` bleibt unberührt. */
export function zusammenfuehren(sammlung, eingehend, optionen) {
  const o = optionen || {};
  const s = kopie(sammlung || {}) || {};
  s.getraenke = _liste(s.getraenke); s.ordner = _liste(s.ordner);
  const uid = _uidGeber({ ...o, knoten: o.knoten || s.knoten });
  s.getraenke.forEach(r => { if (r && !r.uid) r.uid = uid(); });
  const nachUid = new Map(s.getraenke.filter(r => r && r.uid).map(r => [r.uid, r]));
  const namen = new Set(s.getraenke.filter(r => r && r.name).map(r => String(r.name).trim().toLowerCase()));
  const neu = [], uebersprungen = [], imStapel = new Set();
  for (const roh of _liste(eingehend)) {
    if (!roh || !roh.name) { uebersprungen.push({ name: '', grund: 'ohne-namen' }); continue; }
    if (roh.uid && !roh.uidFrisch) {
      const mein = nachUid.get(roh.uid);
      if (mein) { mein.herkunft = herkunftVereinen(mein.herkunft, kopie(roh.herkunft)); uebersprungen.push({ name: roh.name, uid: roh.uid, grund: 'uid' }); continue; }
      if (imStapel.has(roh.uid)) { uebersprungen.push({ name: roh.name, uid: roh.uid, grund: 'uid-doppelt-in-datei' }); continue; }
      imStapel.add(roh.uid);
    } else if (namen.has(String(roh.name).trim().toLowerCase())) {
      uebersprungen.push({ name: roh.name, grund: 'name' }); continue;
    }
    neu.push(kopie(roh));
  }
  const maxId = s.getraenke.reduce((m, r) => Math.max(m, (r && r.id) || 0), 0);
  const befund = {};
  const fertig = neu.map((r, i) => { const n = getraenkNormalisieren(r, { _uid: uid }, befund); delete n.uidFrisch; n.id = maxId + i + 1; return n; });
  const habe = new Set(s.ordner.map(f => String(f.id)));
  const neueOrdner = kopie(_liste(o.ordner)).filter(f => f && f.id != null && !habe.has(String(f.id)) && (habe.add(String(f.id)), true));
  s.getraenke = fertig.concat(s.getraenke);
  s.ordner = s.ordner.concat(neueOrdner);
  return { sammlung: s, neu: fertig, neueOrdner, uebersprungen, ohneKategorie: ohneZuhause(fertig, s.ordner) };
}

/* Eine ganze Sicherung (schon gelesen oder roh) hinzufügen: Getränke, Ordner
   und — aus dem `kategorien`-Block — neu angelegte Kategorien. Eine Kategorie,
   deren Kennung es hier schon gibt (fest oder neu), wird NICHT überschrieben.
   Karten/Menü der Datei werden beim Hinzufügen nicht angefasst (wie alt). */
export function sicherungEinspielen(sammlung, sicherung, optionen) {
  const g = (sicherung && Array.isArray(sicherung.getraenke) && sicherung.befund) ? sicherung : sicherungLesen(sicherung, optionen);
  const e = zusammenfuehren(sammlung, g.getraenke, { ...(optionen || {}), ordner: g.ordner });
  const k = e.sammlung.kategorien = e.sammlung.kategorien || leereKatEinstellungen();
  k.neu = _liste(k.neu);
  const habe = new Set(KATEGORIEN.map(c => c.id).concat(k.neu.map(c => String(c.id))));
  e.neueKategorien = [];
  for (const c of g.kategorien) {
    const id = String(c.id).trim();
    if (habe.has(id)) continue;
    habe.add(id);
    const n = { col: '#7a5840', eigen: true, ...kopie(c), id };
    k.neu.push(n); e.neueKategorien.push(n);
  }
  return e;
}

/* ── Beispiele ───────────────────────────────────────────────────────────
   Jedes Beispiel trägt seine feste `uid`, die Marke `beispiel: "<Paket>"` und
   einen Prüfwert `beispielPruef` über seinen Inhalt zum Zeitpunkt des
   Einspielens. Daran erkennt `beispielePruefen`, was der Mensch geändert hat. */
function _fnv(text) {                                         // FNV-1a, 32 Bit — ein Prüfwert, keine Sicherheit
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) { h ^= text.charCodeAt(i); h = Math.imul(h, 0x01000193); }
  return (h >>> 0).toString(16).padStart(8, '0');
}
/* Was zählt als Inhalt: Name, Kategorie, Ordner, Alkohol, Glas, Temperatur,
   Portionen, Zeit, Schwierigkeit, Zutaten (Menge, Einheit, Name, Notiz),
   Schritte, Schlagworte, Aromen, Bild, Bildausschnitt, Bewertung, Notizen.
   NICHT: lokale Nummer, auf/zu, Häkchen, Zeitstempel, Herkunft, Übersetzungen. */
export function inhaltsPruefwert(r) {
  const x = r || {};
  const bild = String(x.img || '');
  return _fnv(JSON.stringify([
    x.name || '', (typeof x.cat === 'string' ? x.cat.trim() : ''), String(x.folder == null ? '' : x.folder), !!x.alcohol,
    x.glass || '', x.temp || '', x.servings || 0, x.prepTime == null ? null : x.prepTime, x.difficulty || 0,
    _liste(x.ings).map(i => [String((i && i.amt) == null ? '' : i.amt), String((i && i.unit) == null ? '' : i.unit), String((i && i.name) == null ? '' : i.name), String((i && i.note) == null ? '' : i.note)]),
    _liste(x.steps).map(s => (typeof s === 'string' ? s : String((s && s.txt) == null ? '' : s.txt))),
    _liste(x.tags), _liste(x.flavors), bild.length + ':' + _fnv(bild), x.imgCrop || null,
    x.rating ? [x.rating.stars || 0, x.rating.comment || '', _liste(x.rating.imps)] : null, x.notes || '',
  ]));
}
/* Ein Beispielpaket einspielen (= eine Sicherung hinzufügen, nur markiert).
   Dubletten über `uid`, wie überall. */
export function beispielPaketEinspielen(sammlung, paket, paketName, optionen) {
  const name = String(paketName || '').trim();
  if (!name) throw new Error('Beispielpaket braucht einen Namen');
  const g = sicherungLesen(paket, optionen);
  for (const r of g.getraenke) { r.beispiel = name; r.beispielPruef = inhaltsPruefwert(r); }
  return sicherungEinspielen(sammlung, g, optionen);
}
/* Welche Beispiele sind unverändert, welche hat der Mensch angefasst?
   Ein Beispiel OHNE Prüfwert gilt als verändert — im Zweifel bleibt es stehen. */
export function beispielePruefen(sammlung, paket) {
  const unveraendert = [], veraendert = [];
  for (const r of _liste(sammlung && sammlung.getraenke)) {
    if (!r || !r.beispiel) continue;
    if (paket && r.beispiel !== paket) continue;
    (r.beispielPruef && r.beispielPruef === inhaltsPruefwert(r) ? unveraendert : veraendert).push(r);
  }
  return { unveraendert, veraendert };
}
/* „Alle Beispiele löschen": entfernt alles mit der Marke `beispiel`.
   Veränderte Beispiele werden GETRENNT gemeldet. Vorgabe: sie bleiben stehen,
   und ihre Marke fällt weg (sie gehören jetzt dem Menschen). Nur mit
   `veraenderteBehalten:false` gehen auch sie. `paket` beschränkt auf ein Paket.
   Rein: gibt eine neue Sammlung zurück. */
export function beispieleLoeschen(sammlung, optionen) {
  const o = optionen || {};
  const behalten = o.veraenderteBehalten !== false;
  const s = kopie(sammlung || {}) || {};
  const p = beispielePruefen(s, o.paket);
  const weg = new Set(p.unveraendert), geaendert = new Set(p.veraendert);
  const entfernt = [], veraendert = [];
  s.getraenke = _liste(s.getraenke).filter(r => {
    if (weg.has(r)) { entfernt.push({ uid: r.uid, name: r.name, paket: r.beispiel }); return false; }
    if (geaendert.has(r)) {
      veraendert.push({ uid: r.uid, name: r.name, paket: r.beispiel, behalten });
      if (!behalten) return false;
      r.beispielWar = r.beispiel; delete r.beispiel; delete r.beispielPruef;
    }
    return true;
  });
  return { sammlung: s, entfernt, veraendert };
}

/* ── Ausgaben ────────────────────────────────────────────────────────────
   `voll`: das Paket, wie es ist (Kopie).
   `store` (Google Play): kein Getränk mit Alkohol und keine Kategorie mit
   `alcohol:true` im Paket. „Mit Alkohol" heißt hier der STRENGE Befund
   (Kategorie, Feld `alcohol`/`alkohol`, Zutaten-Stichworte) — jedes
   herausgenommene Getränk steht mit seinem Grund in `entfernt`, damit ein
   Fehlgriff der Stichworte sichtbar ist und niemand ihn erst im Laden bemerkt.
   Das Paket bleibt im Format einer Sicherung (`recipes`, `folders`, …); die
   Getränke selbst werden NICHT umgeschrieben. */
export const AUSGABEN = Object.freeze(['store', 'voll']);
export function fuerAusgabe(paket, ausgabe, optionen) {
  if (!AUSGABEN.includes(ausgabe)) throw new Error('Unbekannte Ausgabe: ' + String(ausgabe) + ' (erlaubt: store, voll)');
  let p = typeof paket === 'string' ? JSON.parse(paket) : paket;
  if (Array.isArray(p)) p = { recipes: p };
  p = kopie(p) || {};
  const feld = Array.isArray(p.recipes) ? 'recipes' : (Array.isArray(p.getraenke) ? 'getraenke' : null);
  if (!feld) throw new Error('Ungültiges Format');
  const entfernt = [], entfernteKategorien = [];
  if (ausgabe === 'store') {
    const kats = _liste(p.kategorien);
    const neu = kats.filter(c => c && c.alcohol === true);
    p[feld] = p[feld].filter(r => {
      const b = alkoholBefund(r, { ...(optionen || {}), neu });
      if (b.alkohol) entfernt.push({ uid: r && r.uid, name: r && r.name, gruende: b.gruende });
      return !b.alkohol;
    });
    if (Array.isArray(p.kategorien)) {
      p.kategorien = kats.filter(c => { const a = !!(c && (c.alcohol === true || KATEGORIEN.some(k => k.id === c.id && k.alcohol))); if (a) entfernteKategorien.push(c.id); return !a; });
    }
  }
  p.ausgabe = ausgabe;
  return { paket: p, entfernt, entfernteKategorien };
}
/* Die Probe für das Bauen: was im Paket verstößt gegen die Store-Regel?
   Leere Liste = sauber. */
export function storeVerstoesse(paket, optionen) {
  let p = typeof paket === 'string' ? JSON.parse(paket) : paket;
  if (Array.isArray(p)) p = { recipes: p };
  const liste = _liste(p && (p.recipes || p.getraenke));
  const neu = _liste(p && p.kategorien).filter(c => c && c.alcohol === true);
  const out = [];
  for (const r of liste) { const b = alkoholBefund(r, { ...(optionen || {}), neu }); if (b.alkohol) out.push({ art: 'getraenk', uid: r && r.uid, name: r && r.name, gruende: b.gruende }); }
  for (const c of _liste(p && p.kategorien)) if (c && (c.alcohol === true || KATEGORIEN.some(k => k.id === c.id && k.alcohol))) out.push({ art: 'kategorie', id: c.id });
  return out;
}
