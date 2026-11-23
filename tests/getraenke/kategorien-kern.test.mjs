import test from 'node:test';
import assert from 'node:assert/strict';
import { katZustandZuKern, katListeFuerSicherung, KATEGORIEN, katEinstellungenLesen } from '../../getraenke/kategorien.mjs';
import { kategorienMit, beschriftung, KATEGORIEN_FEST } from '../../kern/modell/kategorien.mjs';

const ALT = { eigen: { mock: { name: 'Alkoholfreies', ico: '🧃' }, smooth: { ico: '🥝' } }, neu: [{ id: 'eig_1', de: 'Sushi', ico: '🍣', col: '#7a5840', eigen: true }], aus: ['knab'], ord: ['limo', 'mock'] };

test('Übergang alt → Kern: Namen, Zeichen, neue Kategorien, Ausblendungen und Reihenfolge kommen mit', () => {
  const k = katZustandZuKern(ALT);
  assert.deepEqual(k.namen, { mock: { name: 'Alkoholfreies', emoji: '🧃' }, smooth: { emoji: '🥝' } });
  assert.deepEqual(k.eigene, [{ id: 'eig_1', de: 'Sushi', emoji: '🍣' }]);
  assert.deepEqual(k.ausgeblendet, ['knab']); assert.deepEqual(k.folge, ['limo', 'mock']);
  assert.deepEqual(katZustandZuKern(k), k, 'ein Kern-Zustand bleibt, wie er ist');
  assert.deepEqual(katZustandZuKern(undefined), { eigene: [], namen: {}, ausgeblendet: [], folge: [] });
});
test('Übergang: ein gemischter Zustand (Kern + beim Einspielen angehängtes `neu`) wird zusammengelegt, Kennung einmal', () => {
  const k = katZustandZuKern({ ...katZustandZuKern(ALT), neu: [{ id: 'eig_1', de: 'Anders', ico: '🐟' }, { id: 'eig_2', de: 'Tiki', ico: '🗿' }] });
  assert.deepEqual(k.eigene.map((c) => [c.id, c.de]), [['eig_1', 'Sushi'], ['eig_2', 'Tiki']]);
  assert.equal(k.neu, undefined);
});
test('Übergang mit den echten Speicher-Schlüsseln der alten App; der Kern zeigt danach dieselben Namen', () => {
  const alt = katEinstellungenLesen({ mxcats9m: JSON.stringify(ALT.eigen), mxcatsneu9m: JSON.stringify(ALT.neu), mxcatsaus9m: '["knab"]', mxcatord9m: '["limo","mock"]' });
  const k = katZustandZuKern(alt), K = kategorienMit(KATEGORIEN, { familie: KATEGORIEN_FEST });
  const rz = [{ uid: 'a', name: 'A', cat: 'mock' }, { uid: 'b', name: 'B', cat: 'eig_1' }, { uid: 'c', name: 'C', cat: 'limo' }, { uid: 'd', name: 'D', cat: 'vorsp' }];
  const l = K.alleKategorien(rz, k);
  assert.deepEqual(l.slice(0, 2).map((c) => c.id), ['limo', 'mock'], 'Reihenfolge');
  assert.equal(beschriftung(l.find((c) => c.id === 'mock'), 'en', k), 'Alkoholfreies', 'eigener Name gilt in allen Sprachen');
  assert.equal(beschriftung(l.find((c) => c.id === 'eig_1'), 'de', k), 'Sushi');
  assert.equal(beschriftung(l.find((c) => c.id === 'vorsp'), 'de', k), 'Vorspeisen', 'Familien-Name statt roher Kennung');
  assert.ok(!l.some((c) => c.id === 'knab'), 'ausgeblendet, weil leer');
});
test('Sicherung: die Liste im alten Format trägt das Zeichen wieder als `ico`', () => {
  assert.deepEqual(katListeFuerSicherung(katZustandZuKern(ALT)), [{ id: 'eig_1', de: 'Sushi', ico: '🍣' }]);
});
