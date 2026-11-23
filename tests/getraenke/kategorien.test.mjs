/* Probe: getraenke/kategorien.mjs — die Fälle aus CLAUDE.md („KATEGORIEN SIND
   UMBENENNBAR", „EINE KENNUNG IST KEIN NAME") und der Vergleich mit der alten App. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { altLaden, schlicht } from './_alt.mjs';
import * as K from '../../getraenke/kategorien.mjs';

const VORSPANN = 'var R=[],FD=[],CL="de",CATS_EIGEN={},CATS_NEU=[],CATS_AUS=[],CATS_ORD=[];';
const ALT = altLaden(['CATS', 'KAT_FAMILIE', 'KAT_OHNE', 'katFamilie', 'ordnerVonRezept', 'katVonRezept', 'katAnzahl', 'katBeschriftung', 'katSymbol', 'catsFremd', 'catsAlle', 'catName'], VORSPANN);
const altLage = (l) => ALT.__lauf(`R=${JSON.stringify(l.getraenke || [])};FD=${JSON.stringify(l.ordner || [])};CL=${JSON.stringify(l.sprache || 'de')};` +
  `CATS_EIGEN=${JSON.stringify((l.kategorien || {}).eigen || {})};CATS_NEU=${JSON.stringify((l.kategorien || {}).neu || [])};CATS_AUS=${JSON.stringify((l.kategorien || {}).aus || [])};CATS_ORD=${JSON.stringify((l.kategorien || {}).ord || [])};`);
const g = (name, cat, mehr) => ({ id: Math.abs(hash(name)), name, cat, ...(mehr || {}) });
function hash(s) { let h = 7; for (const c of s) h = (h * 31 + c.charCodeAt(0)) | 0; return h; }
const SPR = ['de', 'en', 'ru', 'zh', 'es', 'fr', 'it', 'pt'];

test('die zehn festen Kategorien sind die der alten App (ohne „Alle"), Feld für Feld', () => {
  const alt = schlicht(ALT.CATS);
  assert.deepEqual(K.KATEGORIEN.map(c => c.id), ['smooth', 'mock', 'afckt', 'limo', 'tee', 'ckt', 'bowle', 'sirup', 'knab', 'finger']);
  assert.deepEqual(K.KATEGORIEN.map(c => c.id), alt.filter(c => c.id !== 'all').map(c => c.id));
  for (const a of alt) {
    const n = a.id === 'all' ? K.KAT_ALLE : K.KATEGORIEN.find(c => c.id === a.id);
    for (const f of Object.keys(a)) assert.deepEqual(n[f], a[f], `${a.id}.${f}`);
    assert.match(n.symbol, /^kat-[a-z]+$/);
  }
});
test('nur Cocktails tragen alcohol:true', () => {
  assert.deepEqual(K.KATEGORIEN.filter(c => c.alcohol === true).map(c => c.id), ['ckt']);
  assert.equal(K.katHatAlkohol('ckt'), true);
  assert.equal(K.katHatAlkohol('afckt'), false);
  assert.equal(K.katHatAlkohol('eig_1', [{ id: 'eig_1', de: 'Schnäpse', alcohol: true }]), true);
});
test('KAT_FAMILIE: 18 Kennungen in 8 Sprachen, gleich der alten App', () => {
  assert.equal(K.KAT_FAMILIE.length, 18);
  assert.deepEqual(schlicht(K.KAT_FAMILIE), schlicht(ALT.KAT_FAMILIE));
  for (const k of K.KAT_FAMILIE) for (const s of SPR) assert.ok(k[s], `${k.id}.${s}`);
  assert.equal(new Set(K.KAT_FAMILIE.map(k => k.id)).size, 18);
});

test('katVonRezept und ordnerVonRezept deuten wie die alte App', () => {
  const ordner = [{ id: 7, name: 'Sommer' }, { id: 'abc', name: 'Party' }];
  const faelle = [null, undefined, {}, { cat: '' }, { cat: '   ' }, { cat: null }, { cat: 5 }, { cat: 'ckt' }, { cat: ' ckt ' }, { cat: 'afckt' }, { cat: 'drk' }, { cat: 'Sushi' }, { cat: 'sushi ' },
    { cat: 'fld_7' }, { cat: 'fld_abc' }, { cat: 'fld_99' }, { cat: 'fld_' }, { cat: '__ohne' },
    { folder: 7 }, { folder: '7' }, { folder: 'abc' }, { folder: 99 }, { folder: '' }, { folder: null }, { folder: 0 }];
  for (const fd of [ordner, [], undefined]) {
    altLage({ ordner: fd || [] });
    if (fd === undefined) ALT.__lauf('FD=undefined');
    for (const r of faelle) {
      assert.equal(K.katVonRezept(r, fd), ALT.katVonRezept(r), 'Kategorie ' + JSON.stringify(r));
      assert.equal(K.ordnerVonRezept(r, fd), ALT.ordnerVonRezept(r), 'Ordner ' + JSON.stringify(r));
    }
  }
});

test('eine leere Kennung landet unter „__ohne" — und der Reiter erscheint nur, wenn es ihn braucht', () => {
  const mit = [g('Mojito', 'ckt'), g('Sushi-Rolle', ''), g('Maki', '   ')];
  assert.equal(K.katVonRezept(mit[1]), '__ohne');
  const alle = K.katsAlle({ getraenke: mit });
  const ohne = alle.find(c => c.id === K.KAT_OHNE);
  assert.ok(ohne && ohne.ohne && ohne.fremd);
  assert.equal(K.katAnzahl(K.KAT_OHNE, mit, []), 2);
  assert.equal(K.katBeschriftung(ohne, {}, 'de'), 'Ohne Kategorie');
  assert.equal(K.katsAlle({ getraenke: [g('Mojito', 'ckt')] }).some(c => c.id === K.KAT_OHNE), false, 'ohne Inhalt kein Sammel-Reiter');
  assert.equal(K.katsAlle({ getraenke: [{ id: 1, name: '', cat: '', blank: true }] }).some(c => c.id === K.KAT_OHNE), false, 'eine leere Karte ist kein Inhalt');
});

test('ein toter Ordner ist kein Zuhause: fld_… ohne Ordner → „__ohne", r.folder ohne Ordner → kein Ordner', () => {
  const ordner = [{ id: 7, name: 'Sommer' }];
  assert.equal(K.katVonRezept({ cat: 'fld_7' }, ordner), 'fld_7');
  assert.equal(K.katVonRezept({ cat: 'fld_99' }, ordner), '__ohne');
  assert.equal(K.katVonRezept({ cat: 'fld_7' }, []), '__ohne');
  assert.equal(K.ordnerVonRezept({ folder: 7 }, ordner), '7');
  assert.equal(K.ordnerVonRezept({ folder: 99 }, ordner), '');
  const alle = K.katsAlle({ getraenke: [g('Verwaist', 'fld_99')], ordner });
  assert.equal(alle.some(c => String(c.id).startsWith('fld_')), false, 'Ordner sind keine Kategorie');
  assert.ok(alle.some(c => c.id === K.KAT_OHNE));
});

test('eine fremde Kennung bleibt sichtbar: afckt-Fall, Familien-Name, Unbekanntes wird nicht erfunden', () => {
  const liste = [g('Bolognese', 'fleisch'), g('Rotwein', 'drk'), g('Rolle', 'eig_1789'), g('Virgin Colada', 'afckt')];
  const fremd = K.katsFremd(liste, []);
  assert.deepEqual(fremd.map(c => c.id), ['fleisch', 'drk', 'eig_1789']);
  const fleisch = fremd[0], drk = fremd[1], unbek = fremd[2];
  assert.equal(fleisch.fremd, true); assert.equal(fleisch.unbekannt, undefined);
  assert.equal(K.katBeschriftung(fleisch, {}, 'de'), 'Fleisch');
  assert.equal(K.katBeschriftung(drk, {}, 'fr'), 'Boissons');
  assert.equal(unbek.unbekannt, true);
  assert.equal(K.katBeschriftung(unbek, {}, 'en'), 'eig_1789', 'ein Name wird nicht geraten');
  /* `afckt` ist im Mixarium KEINE fremde Kennung — sie trägt ihren Namen selbst */
  assert.equal(fremd.some(c => c.id === 'afckt'), false);
  assert.equal(K.katName('afckt', { getraenke: liste }), 'Alkfr. Cocktails');
  assert.equal(K.katFamilie('afckt').en, 'Alcohol-free');
  assert.equal(K.katFamilie('gibtsnicht'), null);
  /* und jedes Getränk steht in genau einer Kategorie der Liste */
  const ids = new Set(K.katsAlle({ getraenke: liste }).map(c => c.id));
  for (const r of liste) assert.ok(ids.has(K.katVonRezept(r, [])), r.name + ' hat keinen Reiter');
});

test('ein eigener Name gewinnt — in allen acht Sprachen, auch über den Familien-Namen und den Sammel-Eimer', () => {
  const eigen = { ckt: { name: 'Salate', ico: '🥗' }, fleisch: { name: 'Braten' }, __ohne: { name: 'Sushi' }, mock: { ico: '🌈' } };
  const liste = [g('A', 'ckt'), g('B', 'fleisch'), g('C', ''), g('D', 'mock')];
  const lage = { getraenke: liste, kategorien: { eigen } };
  const alle = K.katsAlle(lage);
  const c = id => alle.find(x => x.id === id);
  for (const s of SPR) {
    assert.equal(K.katBeschriftung(c('ckt'), eigen, s), 'Salate', s);
    assert.equal(K.katBeschriftung(c('fleisch'), eigen, s), 'Braten', s);
    assert.equal(K.katBeschriftung(c('__ohne'), eigen, s), 'Sushi', s);
  }
  assert.equal(c('ckt').id, 'ckt', 'gespeichert wird die Beschriftung, nie die Kennung');
  assert.equal(K.katSymbol(c('ckt'), eigen), '🥗');
  assert.equal(K.katSymbol(c('mock'), eigen), '🌈');
  assert.equal(K.katBeschriftung(c('mock'), eigen, 'de'), 'Mocktails', 'nur das Symbol ist eigen, der Name bleibt');
  assert.equal(K.katBeschriftung(c('tee'), eigen, 'pt'), 'Chás & Cafés');
  assert.equal(K.katName('ckt', { ...lage, sprache: 'zh' }), 'Salate');
});

test('eine Kennung kommt genau einmal heraus — auch wenn neu Angelegtes eine feste oder mitgebrachte doppelt', () => {
  const neu = [{ id: 'ckt', de: 'Doppelt' }, { id: 'eig_1', de: 'Sushi' }, { id: 'eig_1', de: 'Sushi zwei' }, { id: 'drk', de: 'Meine Getränke' }, { id: null }, null];
  const liste = [g('A', 'drk'), g('B', 'eig_1'), g('C', 'eig_1'), g('D', 'fleisch'), g('E', 'fleisch'), g('F', ''), g('G', ' ')];
  const alle = K.katsAlle({ getraenke: liste, kategorien: { neu } });
  const ids = alle.map(c => String(c.id));
  assert.equal(new Set(ids).size, ids.length, 'doppelt: ' + ids.join(','));
  for (const fest of K.KATEGORIEN) assert.ok(ids.includes(fest.id), 'feste Kategorie fehlt: ' + fest.id);
  assert.equal(alle.find(c => c.id === 'ckt').de, 'Cocktails', 'die feste gewinnt über das Duplikat');
  assert.equal(alle.find(c => c.id === 'eig_1').de, 'Sushi', 'die erste gewinnt');
});

test('benannte Abweichung: „sushi " und „sushi" sind EINE Kennung mit einem Reiter (die alte App zeigte einen leeren zweiten)', () => {
  const liste = [g('A', 'sushi'), g('B', 'sushi ')];
  const neu = K.katsAlle({ getraenke: liste });
  assert.deepEqual(neu.filter(c => String(c.id).trim() === 'sushi').map(c => c.id), ['sushi']);
  assert.equal(K.katAnzahl('sushi', liste, []), 2);
  altLage({ getraenke: liste });
  const alt = schlicht(ALT.catsAlle()).filter(c => String(c.id).trim() === 'sushi').map(c => c.id);
  assert.deepEqual(alt, ['sushi', 'sushi '], 'so war es in der alten App');
  assert.equal(ALT.katAnzahl('sushi '), 0, 'der zweite Reiter der alten App zählte nichts');
  /* Groß-/Kleinschreibung wird NICHT still zusammengelegt */
  assert.deepEqual(K.katsFremd([g('A', 'Sushi'), g('B', 'sushi')], []).map(c => c.id), ['Sushi', 'sushi']);
});

test('ausgeblendet wird nur, was leer ist; die Reihenfolge folgt mxcatord9m', () => {
  const liste = [g('A', 'limo'), g('B', 'drk')];
  const alle = K.katsAlle({ getraenke: liste, kategorien: { aus: ['limo', 'tee', 'knab'], ord: ['drk', 'sirup', 'smooth'] } }).map(c => c.id);
  assert.ok(alle.includes('limo'), 'eine Kategorie mit Inhalt verschwindet nicht');
  assert.ok(!alle.includes('tee') && !alle.includes('knab'));
  assert.deepEqual(alle.slice(0, 3), ['drk', 'sirup', 'smooth']);
  assert.deepEqual(alle.slice(3), ['mock', 'afckt', 'limo', 'ckt', 'bowle', 'finger'], 'wer nicht genannt ist, behält seinen Platz');
});

test('katsAlle liefert dieselbe Liste wie catsAlle der alten App (saubere Kennungen, viele Lagen)', () => {
  const lagen = [
    {},
    { getraenke: [g('A', 'ckt'), g('B', 'afckt'), g('C', 'drk'), g('D', ''), g('E', 'fld_3'), g('F', 'fld_9'), g('G', 'kuchen'), g('H', 'xyz'), { id: 9, name: '', cat: 'suppe', blank: true }], ordner: [{ id: 3, name: 'O' }] },
    { getraenke: [g('A', 'limo'), g('B', 'eig_5')], kategorien: { neu: [{ id: 'eig_5', de: 'Sushi', ico: '🍣' }, { id: 'eig_6', de: 'Leer' }], aus: ['tee', 'limo', 'eig_6'], ord: ['eig_5', 'finger', 'ckt', 'gibtsnicht'] } },
    { getraenke: [g('A', ''), g('B', 'vegi')], sprache: 'en', kategorien: { eigen: { __ohne: { name: 'Sushi' }, vegi: { name: 'Grün', ico: '🥬' } }, ord: ['__ohne', 'vegi'] } },
    { getraenke: [g('A', 'ckt')], kategorien: { neu: [{ id: 'ckt', de: 'Doppelt' }, { id: 'eig_1', de: 'X' }, { id: 'eig_1', de: 'Y' }] } },
  ];
  for (const [i, l] of lagen.entries()) {
    altLage(l);
    const alt = schlicht(ALT.catsAlle()), neu = K.katsAlle(l);
    assert.deepEqual(neu.map(c => String(c.id)), alt.map(c => String(c.id)), 'Lage ' + i);
    for (const [j, c] of neu.entries()) {
      assert.equal(K.katBeschriftung(c, (l.kategorien || {}).eigen, l.sprache), ALT.katBeschriftung(ALT.catsAlle()[j]), `Lage ${i}, Name von ${c.id}`);
      assert.equal(K.katSymbol(c, (l.kategorien || {}).eigen), ALT.katSymbol(ALT.catsAlle()[j]), `Lage ${i}, Symbol von ${c.id}`);
      assert.equal(K.katAnzahl(c.id, l.getraenke, l.ordner), ALT.katAnzahl(c.id), `Lage ${i}, Zahl von ${c.id}`);
    }
  }
});

test('katUmsortieren schreibt die Liste vollständig neu und rührt Fremdes nicht an', () => {
  const lage = { getraenke: [g('A', 'drk')], kategorien: {} };
  const vor = K.katsAlle(lage).map(c => c.id);
  const neu = K.katUmsortieren(lage, 'drk', 'smooth', 'vor');
  assert.equal(neu.length, vor.length, 'keine Lücken');
  assert.deepEqual(neu.slice(0, 2), ['drk', 'smooth']);
  assert.deepEqual(K.katUmsortieren(lage, 'smooth', 'mock', 'nach').slice(0, 2), ['mock', 'smooth']);
  assert.equal(K.katUmsortieren(lage, 'drk', 'drk', 'vor'), null);
  assert.equal(K.katUmsortieren(lage, 'gibtsnicht', 'smooth', 'vor'), null);
  assert.deepEqual(K.katsAlle({ ...lage, kategorien: { ord: neu } }).map(c => c.id), neu);
});

test('katEinstellungenLesen: die vier Speicherwerte, kaputtes JSON wird leer', () => {
  const e = K.katEinstellungenLesen({ mxcats9m: '{"ckt":{"name":"Salate"}}', mxcatsneu9m: '[{"id":"eig_1","de":"Sushi"},{"de":"ohne id"},null]', mxcatsaus9m: '["tee",5]', mxcatord9m: '["ckt","tee"]' });
  assert.deepEqual(e, { eigen: { ckt: { name: 'Salate' } }, neu: [{ id: 'eig_1', de: 'Sushi' }], aus: ['tee', '5'], ord: ['ckt', 'tee'] });
  assert.deepEqual(K.katEinstellungenLesen({ mxcats9m: '{kaputt', mxcatsneu9m: '"text"', mxcatsaus9m: 'null', mxcatord9m: '' }), K.leereKatEinstellungen());
  assert.deepEqual(K.katEinstellungenLesen(undefined), K.leereKatEinstellungen());
});
