/* Probe: getraenke/uebernahme.mjs — Übernahme aus der alten App und aus
   Sicherungen, Zusammenführen ohne Dubletten, Beispiele, Leeren, Ausgaben.
   Alle Daten sind ERFUNDEN; kein echter Schlüssel, keine echte Sammlung. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { altLaden, schlicht, QC } from './_alt.mjs';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { WURZEL } from './_alt.mjs';
import * as U from '../../getraenke/uebernahme.mjs';
import { hatAlkohol } from '../../getraenke/alkohol.mjs';
import { katVonRezept, katsAlle, KAT_OHNE } from '../../getraenke/kategorien.mjs';

const frieren = x => JSON.stringify(x);
let zaehler = 0;
const opt = () => ({ uidGeber: () => 'probe-uid-' + (++zaehler) });

/* ── erfundene Daten ───────────────────────────────────────────────────── */
const GEHEIM_1 = 'sk-ant-ERFUNDEN-0000-nicht-echt', GEHEIM_2 = 'mistral-ERFUNDEN-1111', GEHEIM_3 = 'sk-openai-ERFUNDEN-2222';
const altGetraenke = () => [
  { id: 101, name: 'Gurken-Minz-Limo', cat: 'limo', alcohol: false, glass: 'highball', servings: 2, ings: [{ id: 0, amt: '4', unit: 'cl', name: 'Limettensaft', ck: true, note: '' }, { id: 1, amt: '1/2', unit: '', name: 'Gurke' }], steps: [{ id: 0, txt: 'Gurke andrücken' }], img: '', uid: 'lokal-abc-1', herkunft: [{ k: 'lokal-abc', d: '2026-09-16' }], eigenesFeld: { bleibt: true } },
  { id: 102, name: 'Mojito', cat: 'ckt', ings: [{ amt: '5 cl', unit: '', name: 'weißer Rum' }, { amt: 'eine Handvoll', unit: '', name: 'Minze' }], steps: ['Minze andrücken', 'Mit Eis auffüllen'], labGen: true },
  { id: 103, name: 'Sushi-Bowl', cat: '' },
  { id: 104, name: 'Verwaist', cat: 'fld_99', folder: 99 },
];
const alteApp = () => ({
  localStorage: {
    mix9m: JSON.stringify(altGetraenke()),
    mxfd9m: JSON.stringify([{ id: 7, name: 'Sommer', ico: '☀️' }]),
    mxms9m: JSON.stringify([{ id: 1, rid: 101, day: 2 }]),
    mxNoAlc9: '1', mxlang9m: 'en', mxknoten9m: 'lokal-abc12345xyz',
    mxcats9m: JSON.stringify({ ckt: { name: 'Salate', ico: '🥗' } }),
    mxcatsneu9m: JSON.stringify([{ id: 'eig_1', de: 'Sushi', ico: '🍣' }]),
    mxcatsaus9m: JSON.stringify(['tee']), mxcatord9m: JSON.stringify(['eig_1', 'ckt']),
    mxkey9m: GEHEIM_1, mxmistralkey9m: GEHEIM_2, mxoaiimg9m: GEHEIM_3,
    mxtheme9m: 'night', mxsem9m: '1',
  },
  indexedDB: { kv: [
    { k: 'mix9m', v: JSON.stringify(altGetraenke()) },
    { k: 'mix9m_imgs', v: JSON.stringify({ 101: 'data:image/jpeg;base64,BILD101' }) },
    { k: 'mxfd9m', v: JSON.stringify([{ id: 7, name: 'Sommer' }]) },
    { k: 'mix9m_bvault', v: JSON.stringify([{ id: 'auto-1', name: 'Auto', type: 'auto', ts: '2026-09-01T10:00:00.000Z', recCnt: 1, r: JSON.stringify([{ id: 5, name: 'Alter Eistee', cat: 'tee' }]), ms: '[]', fd: '[]' }]) },
    { k: 'mrz9m_bvi_auto-1', v: JSON.stringify({ 5: 'data:image/jpeg;base64,BILD5' }) },
  ] },
});

/* ── aus der alten App ─────────────────────────────────────────────────── */
test('Übernahme aus der alten App: Getränke, Ordner, Karten, Einstellungen, Bilder, Tresor', () => {
  const q = alteApp(), vorher = frieren(q);
  const s = U.ausAlterApp(q, opt());
  assert.equal(frieren(q), vorher, 'die Quelle wurde verändert');
  assert.deepEqual(s.getraenke.map(r => r.name), ['Gurken-Minz-Limo', 'Mojito', 'Sushi-Bowl', 'Verwaist']);
  assert.deepEqual(s.ordner, [{ id: 7, name: 'Sommer', ico: '☀️' }]);
  assert.deepEqual(s.karten, [{ id: 1, rid: 101, day: 2 }]);
  assert.deepEqual(s.einstellungen, { ohneAlkohol: true, sprache: 'en' });
  assert.equal(s.knoten, 'lokal-abc12345xyz');
  assert.deepEqual(s.kategorien, { eigen: { ckt: { name: 'Salate', ico: '🥗' } }, neu: [{ id: 'eig_1', de: 'Sushi', ico: '🍣' }], aus: ['tee'], ord: ['eig_1', 'ckt'] });
  assert.equal(s.getraenke[0].img, 'data:image/jpeg;base64,BILD101', 'das Bild aus mix9m_imgs fehlt');
  assert.equal(s.befund.bilderEingesetzt, 1);
  assert.equal(s.sicherungen.length, 1);
  assert.equal(s.sicherungen[0].getraenke[0].name, 'Alter Eistee');
  assert.equal(s.sicherungen[0].getraenke[0].img, 'data:image/jpeg;base64,BILD5');
  assert.equal(s.getraenke.some(r => r.name === 'Alter Eistee'), false, 'der Tresor wird nicht still in die Sammlung gemischt');
});

test('jedes Getränk trägt eine uid; vorhandene uid und Herkunft bleiben; unbekannte Felder bleiben', () => {
  const s = U.ausAlterApp(alteApp(), opt());
  for (const r of s.getraenke) assert.ok(typeof r.uid === 'string' && r.uid, r.name + ' ohne uid');
  assert.equal(new Set(s.getraenke.map(r => r.uid)).size, s.getraenke.length, 'uid doppelt');
  const limo = s.getraenke[0];
  assert.equal(limo.uid, 'lokal-abc-1');
  assert.deepEqual(limo.herkunft, [{ k: 'lokal-abc', d: '2026-09-16' }]);
  assert.deepEqual(limo.eigenesFeld, { bleibt: true });
  assert.equal(s.getraenke[1].labGen, true);
  assert.equal(s.befund.uidVergeben, 3);
  /* ohne gestellten Geber: Kennung beginnt mit den ersten 12 Zeichen des Knotens (wie _neueUid) */
  const echt = U.ausAlterApp(alteApp());
  assert.match(echt.getraenke[1].uid, /^lokal-abc123-[0-9a-z]+-[0-9a-z]+/);
  assert.equal(new Set(echt.getraenke.map(r => r.uid)).size, 4);
});

test('Zutaten kommen getrennt nach amt / unit / name; Schritte als {id, txt}', () => {
  const s = U.ausAlterApp(alteApp(), opt());
  const mojito = s.getraenke[1];
  assert.deepEqual(mojito.ings[0], { amt: '5', unit: 'cl', name: 'weißer Rum', amtRoh: '5 cl', id: 0, ck: false, note: '' });
  assert.deepEqual(mojito.ings[1], { amt: 'eine Handvoll', unit: '', name: 'Minze', id: 1, ck: false, note: '' }, 'Text wird nicht zerlegt');
  assert.deepEqual(mojito.steps, [{ id: 0, txt: 'Minze andrücken' }, { id: 1, txt: 'Mit Eis auffüllen' }]);
  assert.deepEqual(s.getraenke[0].ings[0], { id: 0, amt: '4', unit: 'cl', name: 'Limettensaft', ck: true, note: '' }, 'schon Getrenntes bleibt, wie es ist');
  for (const r of s.getraenke) for (const i of r.ings) for (const f of ['amt', 'unit', 'name']) assert.equal(typeof i[f], 'string', `${r.name}: ${f}`);
  assert.equal(s.befund.zutatenGetrennt, 1);
});

test('die Pflichtfelder der alten App sind gesetzt (wie boot / _normalizeRecs)', () => {
  const ALT = altLaden(['_normalizeRecs']);
  const roh = [{ id: 1, name: 'Nackt' }, { id: 2, name: 'Null', cat: null, folder: undefined, servings: 0 }, { id: 3, name: 'Zahl', cat: 5 }];
  const vorher = frieren(roh); const altListe = schlicht(roh); ALT._normalizeRecs(altListe);
  const neu = U.sicherungLesen({ recipes: roh }, opt()).getraenke;
  for (const [i, a] of schlicht(altListe).entries()) for (const f of ['img', 'folder', 'rating', 'ings', 'steps', 'flavors', 'servings', 'imgCrop', 'cat'])
    assert.deepEqual(neu[i][f], a[f], `${a.name}.${f}`);
  assert.equal(neu[0].prepTime, null);
  assert.equal(frieren(roh), vorher, 'die Eingabe wurde verändert');
});

test('API-Schlüssel werden NICHT übernommen — weder als Feld noch irgendwo im Ergebnis', () => {
  const s = U.ausAlterApp(alteApp(), opt());
  const alles = JSON.stringify(s);
  for (const g of [GEHEIM_1, GEHEIM_2, GEHEIM_3]) assert.ok(!alles.includes(g), 'ein Schlüsselwert steht im Ergebnis');
  assert.deepEqual([...s.befund.nichtUebernommen].sort(), ['mxkey9m', 'mxmistralkey9m', 'mxoaiimg9m']);
  assert.deepEqual([...U.GEHEIME_SCHLUESSEL].sort(), ['mxkey9m', 'mxmistralkey9m', 'mxoaiimg9m']);
  assert.deepEqual(s.befund.unbeachtet.sort(), ['mxsem9m', 'mxtheme9m'], 'was nicht gelesen wird, wird beim Namen genannt');
  /* die drei Namen sind wirklich die Schlüssel-Speicher der alten App */
  assert.match(QC, /const KEY_LS=\{claude:\['mxkey9m'\],openai:\['mxoaiimg9m'\],mistral:\['mxmistralkey9m'\]\}/);
  /* auch ein künftiger Schlüssel-Speicher mit anderem Namen bleibt draußen */
  const q = alteApp(); q.localStorage.mxneukey9m = 'ERFUNDEN-3333';
  const t = U.ausAlterApp(q, opt());
  assert.ok(!JSON.stringify(t).includes('ERFUNDEN-3333'));
  assert.ok(t.befund.nichtUebernommen.includes('mxneukey9m'));
});

test('localStorage leer → IndexedDB; IndexedDB mit mehr benannten Getränken gewinnt; sonst localStorage', () => {
  const q1 = alteApp(); delete q1.localStorage.mix9m; delete q1.localStorage.mxfd9m;
  const s1 = U.ausAlterApp(q1, opt());
  assert.equal(s1.befund.getraenkeAus, 'indexedDB'); assert.equal(s1.getraenke.length, 4); assert.equal(s1.ordner.length, 1);
  const q2 = alteApp(); q2.localStorage.mix9m = JSON.stringify(altGetraenke().slice(0, 2));
  const s2 = U.ausAlterApp(q2, opt());
  assert.equal(s2.befund.getraenkeAus, 'indexedDB'); assert.deepEqual(s2.befund.benannt, { localStorage: 2, indexedDB: 4 });
  const q3 = alteApp(); q3.indexedDB.kv[0].v = JSON.stringify(altGetraenke().slice(0, 2));
  assert.equal(U.ausAlterApp(q3, opt()).befund.getraenkeAus, 'localStorage');
  assert.equal(U.ausAlterApp({}, opt()).getraenke.length, 0, 'eine leere Quelle ist kein Fehler');
  assert.equal(U.ausAlterApp({ localStorage: { mix9m: '{kaputt' } }, opt()).befund.warnungen.length, 1);
  /* der Dump darf auch eine Liste oder eine schlichte Karte sein */
  for (const dump of [alteApp().indexedDB.kv, { stores: { kv: alteApp().indexedDB.kv } }, Object.fromEntries(alteApp().indexedDB.kv.map(z => [z.k, z.v]))])
    assert.equal(U.ausAlterApp({ indexedDB: dump }, opt()).getraenke.length, 4);
});

test('nichts geht verloren: leere Kennung und toter Ordner bleiben sichtbar unter „Ohne Kategorie"', () => {
  const s = U.ausAlterApp(alteApp(), opt());
  assert.equal(katVonRezept(s.getraenke[2], s.ordner), KAT_OHNE);
  assert.equal(katVonRezept(s.getraenke[3], s.ordner), KAT_OHNE);
  assert.equal(s.getraenke[3].cat, 'fld_99', 'die Kennung wird nicht umgeschrieben');
  const ids = new Set(katsAlle({ getraenke: s.getraenke, ordner: s.ordner, kategorien: s.kategorien }).map(c => c.id));
  for (const r of s.getraenke) assert.ok(ids.has(katVonRezept(r, s.ordner)), r.name + ' hätte keinen Reiter');
});

test('leere Karten werden gezählt statt mitgeschleppt; ein benanntes Getränk mit blank:true bleibt sichtbar', () => {
  const g = U.sicherungLesen({ recipes: [{ id: 1, name: '', blank: true, cat: 'suppe' }, { id: 2, name: 'Mit Namen', blank: true, cat: 'mock ' }, null, 'text', { id: 3, name: '', ings: [{ amt: '1', unit: '', name: 'x' }] }] }, opt());
  assert.deepEqual(g.getraenke.map(r => r.name), ['Mit Namen', '']);
  assert.equal(g.getraenke[0].blank, false);
  assert.equal(g.getraenke[0].cat, 'mock');
  assert.deepEqual({ l: g.befund.leereKarten, b: g.befund.blankMitNamen, u: g.befund.unlesbar, k: g.befund.kategorieGetrimmt }, { l: 1, b: 1, u: 2, k: 1 });
});

/* ── Sicherungen ───────────────────────────────────────────────────────── */
test('alte Sicherung ohne uid (version 9): jedes Getränk bekommt eine, Ordner und Menü kommen mit', () => {
  const alt = { version: 9, exported: '2026-05-01T08:00:00.000Z', recipes: [{ id: 1, name: 'Eistee', cat: 'tee', ings: [{ amt: '1', unit: 'l', name: 'Wasser' }], steps: [{ id: 1, txt: 'Aufgießen' }] }, { id: 2, name: 'Zitronenlimo', cat: 'limo' }], menu: [{ id: 9 }], folders: [{ id: 3, name: 'Party' }] };
  const vorher = frieren(alt);
  const g = U.sicherungLesen(JSON.stringify(alt), opt());
  assert.equal(g.version, 9);
  assert.equal(g.knoten, null);
  assert.equal(g.getraenke.length, 2);
  for (const r of g.getraenke) { assert.match(r.uid, /^probe-uid-\d+$/); assert.equal(r.uidFrisch, true, 'eine eben erst vergebene Kennung sagt es'); }
  assert.notEqual(g.getraenke[0].uid, g.getraenke[1].uid);
  assert.deepEqual(g.ordner, [{ id: 3, name: 'Party' }]);
  assert.deepEqual(g.karten, [{ id: 9 }]);
  assert.equal(frieren(alt), vorher);
});

test('alle Fassungen: recipes/menu/folders, r/ms/fd (auch als JSON-Text), nackte Liste; Unlesbares wirft', () => {
  const liste = [{ id: 1, name: 'A', cat: 'mock' }];
  for (const d of [{ recipes: liste }, { r: liste, ms: [], fd: [{ id: 1, name: 'O' }] }, { r: JSON.stringify(liste), ms: '[]', fd: '[{"id":1,"name":"O"}]' }, liste, JSON.stringify({ version: 10, knoten: 'lokal-x', recipes: liste })])
    assert.deepEqual(U.sicherungLesen(d, opt()).getraenke.map(r => r.name), ['A'], JSON.stringify(d).slice(0, 40));
  assert.equal(U.sicherungLesen({ r: liste, fd: [{ id: 1, name: 'O' }] }, opt()).ordner.length, 1);
  assert.equal(U.sicherungLesen({ version: 10, knoten: 'lokal-x', recipes: liste }, opt()).knoten, 'lokal-x');
  for (const d of [{}, { recipes: 'text' }, { recipes: {} }, null, 5, '{kaputt', '"text"']) assert.throws(() => U.sicherungLesen(d, opt()), /Ungültiges Format/, JSON.stringify(d));
});

test('Rezeptbuch-Export version 10 mit kategorien-Block: eigene Kategorie kommt mit, fremde Kennungen bleiben', () => {
  const rb = { version: 10, exported: '2026-11-23T12:00:00Z', quelle: 'Beispielbuch (erfunden)', knoten: 'lokal-rezeptbuch',
    kategorien: [{ id: 'eig_1789', de: 'Sushi', en: 'Sushi', ico: '🍣' }, { id: 'ckt', de: 'Überschreiben?' }, { de: 'ohne id' }],
    menu: [], folders: [],
    recipes: [{ id: 1778, name: 'Lachs-Maki', cat: 'eig_1789', uid: 'rb-1', ings: [{ id: 0, amt: '1 ½', unit: 'TL', name: 'Reisessig' }], steps: [{ id: 0, txt: 'Rollen' }], herkunft: [{ k: 'lokal-rezeptbuch', d: '2026-11-23' }] },
      { id: 1779, name: 'Bolognese', cat: 'fleisch', uid: 'rb-2' }, { id: 1780, name: 'Bowle', cat: 'bowle', uid: 'rb-3', alcohol: false }] };
  const leer = U.leereSammlung({ knoten: 'lokal-mix' });
  const e = U.sicherungEinspielen(leer, rb, opt());
  assert.deepEqual(e.neu.map(r => r.uid), ['rb-1', 'rb-2', 'rb-3'], 'die mitgebrachte uid bleibt');
  assert.deepEqual(e.neu.map(r => r.cat), ['eig_1789', 'fleisch', 'bowle']);
  assert.deepEqual(e.neu[0].herkunft, [{ k: 'lokal-rezeptbuch', d: '2026-11-23' }]);
  assert.deepEqual(e.neueKategorien.map(c => c.id), ['eig_1789'], 'feste Kategorien werden nicht überschrieben, Einträge ohne id nicht übernommen');
  assert.equal(e.sammlung.knoten, 'lokal-mix', 'eine Datei ändert nie, wer diese App ist');
  const alle = katsAlle({ getraenke: e.sammlung.getraenke, kategorien: e.sammlung.kategorien });
  assert.equal(alle.find(c => c.id === 'eig_1789').de, 'Sushi');
  assert.equal(alle.find(c => c.id === 'ckt').de, 'Cocktails');
  assert.ok(alle.find(c => c.id === 'fleisch').fremd);
  /* zweimal einspielen: nichts doppelt, auch die Kategorie nicht */
  const z = U.sicherungEinspielen(e.sammlung, rb, opt());
  assert.equal(z.neu.length, 0); assert.equal(z.neueKategorien.length, 0);
  assert.equal(z.sammlung.getraenke.length, 3); assert.equal(z.sammlung.kategorien.neu.length, 1);
});

/* ── Zusammenführen ────────────────────────────────────────────────────── */
const bestand = () => ({ knoten: 'lokal-mix', ordner: [{ id: 1, name: 'Mein Ordner' }], getraenke: [
  { id: 10, name: 'Mojito', cat: 'ckt', uid: 'u-mojito', herkunft: [{ k: 'a', d: '1' }] },
  { id: 11, name: 'Eistee', cat: 'tee', uid: 'u-eistee' },
  { id: 12, name: 'Alte Limo', cat: 'limo' }] });

test('zusammenführen ohne Dubletten: die uid entscheidet, der Name ist nur der Rückfall', () => {
  const b = bestand(), vorher = frieren(b);
  const rein = [
    { id: 1, name: 'Mojito umbenannt', uid: 'u-mojito', cat: 'ckt', herkunft: [{ k: 'a', d: '1' }, { k: 'b', d: '2' }] },   // gleiche uid → nicht doppelt
    { id: 2, name: 'Eistee', uid: 'u-anderer-eistee', cat: 'tee' },                                                      // gleiche Namen, andere uid → kommt
    { id: 3, name: '  ALTE LIMO ', cat: 'limo' },                                                                        // ohne uid, Name da → nicht
    { id: 4, name: 'Neue Bowle', cat: 'bowle' },                                                                         // ohne uid, neu → kommt
    { id: 5, name: '' }, null,
    { id: 6, name: 'Zwilling', uid: 'u-zw' }, { id: 7, name: 'Zwilling', uid: 'u-zw' },                                  // doppelt in der Datei
  ];
  const e = U.zusammenfuehren(b, rein, { ...opt(), ordner: [{ id: 1, name: 'ÜBERSCHREIBEN?' }, { id: 2, name: 'Neu' }, { id: 2, name: 'Neu doppelt' }] });
  assert.equal(frieren(b), vorher, 'der Bestand wurde verändert');
  assert.deepEqual(e.neu.map(r => r.name), ['Eistee', 'Neue Bowle', 'Zwilling']);
  assert.deepEqual(e.uebersprungen.map(u => u.grund), ['uid', 'name', 'ohne-namen', 'ohne-namen', 'uid-doppelt-in-datei']);
  assert.equal(new Set(e.sammlung.getraenke.map(r => r.uid)).size, e.sammlung.getraenke.length, 'eine uid kommt zweimal vor');
  assert.equal(e.sammlung.getraenke.length, 6);
  assert.deepEqual(e.sammlung.getraenke.slice(0, 3).map(r => r.name), ['Eistee', 'Neue Bowle', 'Zwilling'], 'Neues steht vorn');
  assert.deepEqual(e.neu.map(r => r.id), [13, 14, 15], 'nur die lokale Nummer wird neu vergeben');
  assert.equal(e.neu[0].uid, 'u-anderer-eistee');
  assert.match(e.neu[1].uid, /^probe-uid-/);
  const mojito = e.sammlung.getraenke.find(r => r.uid === 'u-mojito');
  assert.equal(mojito.name, 'Mojito', 'Vorhandenes wird nicht überschrieben');
  assert.equal(mojito.herkunft.length, 2, 'die längere Herkunfts-Kette gewinnt');
  assert.ok(e.sammlung.getraenke.find(r => r.name === 'Alte Limo').uid, 'auch der Bestand bekommt seine uid');
  assert.deepEqual(e.sammlung.ordner, [{ id: 1, name: 'Mein Ordner' }, { id: 2, name: 'Neu' }]);
  assert.deepEqual(e.neueOrdner.map(f => f.id), [2]);
});

test('zusammenführen trifft dieselbe Auswahl wie _zusammenfuehren der alten App', () => {
  const VOR = 'var R=[],FD=[],__ls={mxknoten9m:"lokal-altprobe"};var localStorage={getItem:function(k){return k in __ls?__ls[k]:null},setItem:function(k,v){__ls[k]=String(v)}};var window={};function svFD(){}';
  const ALT = altLaden(['_KNOTEN_KEY', '_knotenKennung', '_neueUid', '_uidSichern', '_herkunftVereinen', '_zusammenfuehren'], VOR);
  const faelle = [
    [bestand(), [{ id: 1, name: 'Mojito X', uid: 'u-mojito', herkunft: [{ k: 'a' }, { k: 'b' }, { k: 'c' }] }, { id: 2, name: 'Eistee', uid: 'u-neu' }, { id: 3, name: 'alte limo' }, { id: 4, name: 'Frisch' }, { id: 5, name: '' }], [{ id: 1, name: 'x' }, { id: 5, name: 'Fünf' }]],
    [{ getraenke: [], ordner: [] }, [{ id: 1, name: 'A' }, { id: 2, name: 'B', uid: 'u-b' }], []],
    [bestand(), [], [{ id: 9, name: 'Nur Ordner' }]],
  ];
  for (const [i, [b, rein, ordner]] of faelle.entries()) {
    ALT.__lauf(`R=${JSON.stringify(b.getraenke)};FD=${JSON.stringify(b.ordner)};`);
    const alt = ALT._zusammenfuehren(schlicht(rein), schlicht(ordner));
    const neu = U.zusammenfuehren(b, rein, { ...opt(), ordner });
    assert.deepEqual(neu.neu.map(r => r.name), schlicht(alt.newRecs).map(r => r.name), `Fall ${i}: welche dazukommen`);
    assert.deepEqual(neu.neu.map(r => r.id), schlicht(alt.newRecs).map(r => r.id), `Fall ${i}: lokale Nummern`);
    assert.deepEqual(neu.neu.map(r => !!r.uid), schlicht(alt.newRecs).map(r => !!r.uid), `Fall ${i}: jede hat eine uid`);
    assert.deepEqual(neu.neueOrdner.map(f => f.id), schlicht(alt.neueOrdner).map(f => f.id), `Fall ${i}: neue Ordner`);
    const altR = schlicht(ALT.__lauf('R'));
    for (const a of altR) assert.deepEqual((neu.sammlung.getraenke.find(r => r.name === a.name) || {}).herkunft, a.herkunft, `Fall ${i}: Herkunft von ${a.name}`);
  }
});

test('alte Sicherung ohne uid zweimal eingespielt: beim zweiten Mal greift der Namens-Rückfall', () => {
  const alt = { version: 9, recipes: [{ id: 1, name: 'Eistee', cat: 'tee' }, { id: 2, name: 'Limo', cat: 'limo' }] };
  const eins = U.sicherungEinspielen(U.leereSammlung(), alt, opt());
  assert.equal(eins.neu.length, 2);
  for (const r of eins.sammlung.getraenke) { assert.ok(r.uid); assert.equal(r.uidFrisch, undefined, 'in der Sammlung trägt niemand die Marke'); }
  const zwei = U.sicherungEinspielen(eins.sammlung, alt, opt());
  assert.equal(zwei.neu.length, 0);
  assert.deepEqual(zwei.uebersprungen.map(u => u.grund), ['name', 'name']);
  assert.equal(zwei.sammlung.getraenke.length, 2);
});

test('Herkunft: Station anhängen, keine Wiederholung, bei 5 gedeckelt und als gekürzt markiert (wie alt)', () => {
  const ALT = altLaden(['_KNOTEN_KEY', 'HERK_MAX', '_knotenKennung', '_herkunftStempeln', '_herkunftVereinen'], 'var __ls={mxknoten9m:"lokal-k"};var localStorage={getItem:function(k){return __ls[k]||null},setItem:function(){}};var window={};');
  assert.equal(U.HERK_MAX, ALT.HERK_MAX);
  const liste = [{ name: 'A' }, { name: 'B', herkunft: [{ k: 'lokal-k', d: 'x' }] }, { name: 'C', herkunft: [1, 2, 3, 4, 5].map(n => ({ k: 'k' + n, d: 'd' })) }, { name: '', blank: true }];
  const alt = schlicht(liste); ALT._herkunftStempeln(alt);
  const heute = new Date().toISOString().slice(0, 10);
  const neu = U.herkunftStempeln(liste, 'lokal-k', heute);
  assert.deepEqual(neu, schlicht(alt));
  assert.equal(neu[2].herkunft.length, 5); assert.equal(neu[2].herkGekuerzt, true);
  assert.equal(liste[0].herkunft, undefined, 'die Eingabe bleibt unberührt');
  for (const [a, b] of [[[1], [1, 2]], [[1, 2], [3]], [[1], [2]], [null, [1]], [[1], undefined], [undefined, undefined]])
    assert.deepEqual(U.herkunftVereinen(a, b), schlicht(ALT._herkunftVereinen(a, b)));
});

/* ── Beispiele ─────────────────────────────────────────────────────────── */
const paket = () => ({ version: 10, quelle: 'erfunden', recipes: [
  { id: 1, uid: 'bsp-gurke', name: 'Gurken-Limo', cat: 'limo', alcohol: false, ings: [{ id: 0, amt: '4', unit: 'cl', name: 'Limettensaft' }], steps: [{ id: 0, txt: 'Rühren' }] },
  { id: 2, uid: 'bsp-mango', name: 'Mango-Lassi', cat: 'smooth', alcohol: false, ings: [{ id: 0, amt: '200', unit: 'ml', name: 'Joghurt' }], steps: [] },
  { id: 3, uid: 'bsp-tee', name: 'Pfirsich-Eistee', cat: 'tee', alcohol: false, ings: [], steps: [] }] });
function mitBeispielen() {
  const eigen = U.sicherungEinspielen(U.leereSammlung({ knoten: 'lokal-mix' }), { recipes: [{ id: 1, name: 'Mein eigener Drink', cat: 'mock', uid: 'u-eigen' }] }, opt()).sammlung;
  return U.beispielPaketEinspielen(eigen, paket(), 'getraenke', opt());
}

test('Beispiele tragen uid und die Marke beispiel:"<paket>"; zweimal laden verdoppelt nichts', () => {
  const e = mitBeispielen();
  assert.deepEqual(e.neu.map(r => [r.uid, r.beispiel]), [['bsp-gurke', 'getraenke'], ['bsp-mango', 'getraenke'], ['bsp-tee', 'getraenke']]);
  for (const r of e.neu) assert.match(r.beispielPruef, /^[0-9a-f]{8}$/);
  assert.equal(e.sammlung.getraenke.find(r => r.uid === 'u-eigen').beispiel, undefined);
  const z = U.beispielPaketEinspielen(e.sammlung, paket(), 'getraenke', opt());
  assert.equal(z.neu.length, 0); assert.equal(z.sammlung.getraenke.length, 4);
  assert.throws(() => U.beispielPaketEinspielen(e.sammlung, paket(), '  ', opt()), /Namen/);
});

test('Beispiele löschen: ein Klick entfernt alle unveränderten, Eigenes bleibt', () => {
  const s = mitBeispielen().sammlung, vorher = frieren(s);
  const e = U.beispieleLoeschen(s);
  assert.equal(frieren(s), vorher, 'die Sammlung wurde verändert');
  assert.deepEqual(e.entfernt.map(x => x.uid).sort(), ['bsp-gurke', 'bsp-mango', 'bsp-tee']);
  assert.deepEqual(e.veraendert, []);
  assert.deepEqual(e.sammlung.getraenke.map(r => r.uid), ['u-eigen']);
  assert.equal(e.sammlung.getraenke.some(r => r.beispiel), false);
});

test('Beispiele löschen: ein verändertes Beispiel wird getrennt gemeldet und bleibt (Marke fällt weg) — oder geht auf Wunsch', () => {
  const s = mitBeispielen().sammlung;
  s.getraenke.find(r => r.uid === 'bsp-mango').ings[0].amt = '250';          // der Mensch hat etwas geändert
  const tee = s.getraenke.find(r => r.uid === 'bsp-tee');
  tee.shut = true; tee.id = 999; tee.ings.forEach(i => { i.ck = true; }); tee.herkunft = [{ k: 'x', d: 'y' }]; // das zählt NICHT als Änderung
  const p = U.beispielePruefen(s);
  assert.deepEqual(p.veraendert.map(r => r.uid), ['bsp-mango']);
  assert.deepEqual(p.unveraendert.map(r => r.uid).sort(), ['bsp-gurke', 'bsp-tee']);

  const e = U.beispieleLoeschen(s);
  assert.deepEqual(e.entfernt.map(x => x.uid).sort(), ['bsp-gurke', 'bsp-tee']);
  assert.deepEqual(e.veraendert, [{ uid: 'bsp-mango', name: 'Mango-Lassi', paket: 'getraenke', behalten: true }]);
  const mango = e.sammlung.getraenke.find(r => r.uid === 'bsp-mango');
  assert.ok(mango, 'das veränderte Beispiel ist weg');
  assert.equal(mango.beispiel, undefined); assert.equal(mango.beispielWar, 'getraenke'); assert.equal(mango.ings[0].amt, '250');
  assert.equal(U.beispieleLoeschen(e.sammlung).entfernt.length, 0, 'es gehört jetzt dem Menschen');

  const hart = U.beispieleLoeschen(s, { veraenderteBehalten: false });
  assert.deepEqual(hart.sammlung.getraenke.map(r => r.uid), ['u-eigen']);
  assert.deepEqual(hart.veraendert.map(v => [v.uid, v.behalten]), [['bsp-mango', false]]);
});

test('Beispiele löschen: jede Art von Änderung zählt (Name, Kategorie, Schritt, Bild, Bewertung); ohne Prüfwert bleibt es stehen', () => {
  const aendern = [r => { r.name += '!'; }, r => { r.cat = 'mock'; }, r => { r.steps.push({ id: 9, txt: 'neu' }); }, r => { r.img = 'data:x'; }, r => { r.rating = { stars: 5, comment: '', imps: [] }; }, r => { r.alcohol = true; }, r => { r.servings = 6; }, r => { r.ings[0].unit = 'ml'; }, r => { delete r.beispielPruef; }];
  for (const [i, f] of aendern.entries()) {
    const s = mitBeispielen().sammlung;
    f(s.getraenke.find(r => r.uid === 'bsp-gurke'));
    assert.deepEqual(U.beispielePruefen(s).veraendert.map(r => r.uid), ['bsp-gurke'], 'Änderung ' + i);
  }
});

test('Beispiele löschen nur für EIN Paket lässt das andere stehen', () => {
  let s = mitBeispielen().sammlung;
  s = U.beispielPaketEinspielen(s, { recipes: [{ id: 1, uid: 'bsp-spritz', name: 'Spritz', cat: 'ckt', alcohol: true }] }, 'getraenke-mit-alkohol', opt()).sammlung;
  const e = U.beispieleLoeschen(s, { paket: 'getraenke-mit-alkohol' });
  assert.deepEqual(e.entfernt.map(x => x.uid), ['bsp-spritz']);
  assert.equal(e.sammlung.getraenke.filter(r => r.beispiel === 'getraenke').length, 3);
});

test('Sammlung leeren und neu aufbauen: leer ist leer, Einstellungen und Knoten bleiben, die Sicherung bringt alles zurück', () => {
  const voll = U.ausAlterApp(alteApp(), opt());
  voll.einkauf = [{ name: 'Limetten' }];
  const vorher = frieren(voll);
  const e = U.sammlungLeeren(voll);
  assert.equal(frieren(voll), vorher, 'die Sammlung wurde verändert');
  assert.deepEqual(e.entfernt, { getraenke: 4, ordner: 1, karten: 1, einkauf: 1 });
  assert.deepEqual([e.sammlung.getraenke, e.sammlung.ordner, e.sammlung.karten, e.sammlung.einkauf], [[], [], [], []]);
  assert.deepEqual(e.sammlung.einstellungen, { ohneAlkohol: true, sprache: 'en' });
  assert.equal(e.sammlung.knoten, 'lokal-abc12345xyz');
  assert.deepEqual(e.sammlung.kategorien.eigen, { ckt: { name: 'Salate', ico: '🥗' } });
  /* neu aufbauen aus der Sicherung von vorhin */
  const sicherung = { version: 10, recipes: voll.getraenke, folders: voll.ordner, menu: voll.karten };
  const neu = U.sicherungEinspielen(e.sammlung, sicherung, opt());
  assert.deepEqual(neu.sammlung.getraenke.map(r => r.uid).sort(), voll.getraenke.map(r => r.uid).sort());
  assert.deepEqual(neu.sammlung.ordner, voll.ordner);
  assert.equal(U.sicherungEinspielen(neu.sammlung, sicherung, opt()).neu.length, 0, 'ein zweites Mal verdoppelt nichts');
  assert.deepEqual(U.sammlungLeeren(undefined).sammlung.getraenke, []);
});

/* ── Ausgaben ──────────────────────────────────────────────────────────── */
const gemischt = () => ({ version: 10, quelle: 'erfunden', kategorien: [{ id: 'eig_1', de: 'Sushi' }, { id: 'eig_2', de: 'Schnäpse', alcohol: true }, { id: 'ckt', de: 'Cocktails' }], folders: [{ id: 1, name: 'O' }], menu: [], recipes: [
  { id: 1, uid: 'a', name: 'Gurken-Limo', cat: 'limo', alcohol: false, ings: [{ amt: '4', unit: 'cl', name: 'Limettensaft' }, { amt: '100', unit: 'ml', name: 'Ginger Ale' }] },
  { id: 2, uid: 'b', name: 'Mojito', cat: 'ckt', ings: [{ amt: '5', unit: 'cl', name: 'Limettensaft' }] },                 // Kategorie
  { id: 3, uid: 'c', name: 'Kokos-Bowle', cat: 'bowle', alcohol: true, ings: [] },                                           // Feld
  { id: 4, uid: 'd', name: 'Heimlicher Punsch', cat: 'tee', alcohol: false, ings: [{ amt: '4', unit: 'cl', name: 'brauner Rum' }] }, // nur die Zutat verrät es
  { id: 5, uid: 'e', name: 'Kräuterschnaps', cat: 'eig_2', ings: [] },                                                       // eigene Kategorie mit alcohol:true
  { id: 6, uid: 'f', name: 'Labor-Drink', cat: 'mock', alkohol: true, ings: [] },                                            // Feld des Labors
  { id: 7, uid: 'g', name: 'Virgin Colada', cat: 'afckt', alcohol: false, ings: [{ amt: '4', unit: 'cl', name: 'alkoholfreier Rum' }] },
  { id: 8, uid: 'h', name: 'Lachs-Maki', cat: 'eig_1', ings: [] }] });

test('Store-Ausgabe enthält kein Getränk mit Alkohol und keine Kategorie mit alcohol:true', () => {
  const p = gemischt(), vorher = frieren(p);
  const e = U.fuerAusgabe(p, 'store');
  assert.equal(frieren(p), vorher, 'das Paket wurde verändert');
  assert.deepEqual(e.paket.recipes.map(r => r.name), ['Gurken-Limo', 'Virgin Colada', 'Lachs-Maki']);
  assert.deepEqual(e.entfernt.map(x => x.uid), ['b', 'c', 'd', 'e', 'f']);
  assert.deepEqual(e.entfernt.map(x => x.gruende[0]), ['kategorie:ckt', 'feld:alcohol', 'zutat:rum', 'kategorie:eig_2', 'feld:alkohol'], 'jeder Fall nennt seinen Grund');
  for (const r of e.paket.recipes) { assert.notEqual(r.alcohol, true, r.name); assert.notEqual(r.cat, 'ckt', r.name); }
  assert.deepEqual(e.paket.kategorien.map(c => c.id), ['eig_1']);
  assert.deepEqual(e.entfernteKategorien, ['eig_2', 'ckt']);
  assert.equal(e.paket.ausgabe, 'store');
  assert.deepEqual(U.storeVerstoesse(e.paket), [], 'das fertige Store-Paket ist sauber');
  assert.equal(U.storeVerstoesse(p).length, 7, 'das unbereinigte Paket hat 5 Getränke + 2 Kategorien als Verstoß');
  assert.deepEqual(e.paket.folders, [{ id: 1, name: 'O' }]);
});

test('Voll-Ausgabe enthält alles; unbekannte Ausgabe und kaputtes Paket werfen', () => {
  const p = gemischt();
  const e = U.fuerAusgabe(p, 'voll');
  assert.deepEqual(e.paket.recipes, p.recipes);
  assert.deepEqual(e.paket.kategorien, p.kategorien);
  assert.deepEqual([e.entfernt, e.entfernteKategorien], [[], []]);
  assert.equal(e.paket.ausgabe, 'voll');
  assert.deepEqual(U.fuerAusgabe(JSON.stringify(p), 'store').paket.recipes.length, 3, 'auch als JSON-Text');
  assert.deepEqual(U.fuerAusgabe(p.recipes, 'store').paket.recipes.map(r => r.uid), ['a', 'e', 'g', 'h'], 'als nackte Liste fehlt der kategorien-Block — `eig_2` ist dann nicht als Alkohol-Kategorie bekannt');
  for (const a of ['Store', 'play', '', undefined]) assert.throws(() => U.fuerAusgabe(p, a), /Unbekannte Ausgabe/);
  assert.throws(() => U.fuerAusgabe({}, 'store'), /Ungültiges Format/);
  assert.deepEqual([...U.AUSGABEN], ['store', 'voll']);
});

test('ein Store-Paket, eingespielt als Beispiele, bringt bei eingeschaltetem „Ohne Alkohol" nichts Verstecktes mit', () => {
  const store = U.fuerAusgabe(gemischt(), 'store').paket;
  const e = U.beispielPaketEinspielen(U.leereSammlung(), store, 'getraenke', opt());
  assert.equal(e.neu.length, 3);
  assert.deepEqual(U.storeVerstoesse({ recipes: e.sammlung.getraenke, kategorien: e.sammlung.kategorien.neu }), []);
});

/* Das echte Alkohol-Paket aus Mein Rezeptbuch liegt (seit 23.11.2026) im Repo.
   Fehlt es, wird die Probe übersprungen — sie ist eine Zugabe, kein Fundament. */
const ALK_PAKET = join(WURZEL, 'beispiele', 'getraenke-mit-alkohol-fuer-mixarium.json');
test('das echte Alkohol-Paket: lesbar, jedes Getränk mit uid, und in der Store-Ausgabe bleibt KEINES übrig', { skip: !existsSync(ALK_PAKET) && 'Paket liegt nicht im Repo' }, () => {
  const roh = JSON.parse(readFileSync(ALK_PAKET, 'utf8'));
  const g = U.sicherungLesen(roh);
  assert.ok(g.getraenke.length > 0);
  for (const r of g.getraenke) { assert.ok(r.uid, r.name); assert.equal(r.uidFrisch, undefined, r.name + ': das Paket bringt seine uid mit'); }
  const e = U.fuerAusgabe(roh, 'store');
  assert.deepEqual(e.paket.recipes.map(r => r.name), []);
  assert.equal(e.entfernt.length, roh.recipes.length);
  /* und schon die ALTE Regel (Kategorie oder Feld) erkennt jedes davon */
  for (const r of roh.recipes) assert.equal(hatAlkohol(r), true, r.name);
  assert.equal(U.fuerAusgabe(roh, 'voll').paket.recipes.length, roh.recipes.length);
});
