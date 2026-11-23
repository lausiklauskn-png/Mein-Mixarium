/* Probe: Gläser und Temperaturen stimmen mit der alten App überein, tragen
   acht Sprachen und eine Symbol-Kennung statt eines Emojis. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { altLaden, schlicht } from './_alt.mjs';
import * as G from '../../getraenke/glaeser.mjs';

const ALT = altLaden(['GLASS_TYPES', 'TEMPS', 'glassName', 'tempName'], 'var CL="de";');
const EMOJI = /\p{Extended_Pictographic}/u;

for (const [name, neu, alt] of [['Gläser', G.GLAESER, schlicht(ALT.GLASS_TYPES)], ['Temperaturen', G.TEMPERATUREN, schlicht(ALT.TEMPS)]]) {
  test(`${name}: Kennungen, Reihenfolge und die vier alten Sprachen wie in der alten App`, () => {
    assert.deepEqual(neu.map(x => x.id), alt.map(x => x.id));
    for (const a of alt) {
      const n = neu.find(x => x.id === a.id);
      for (const s of ['de', 'en', 'ru', 'zh']) assert.equal(n[s], a[s], `${a.id}.${s}`);
      assert.equal(n.altEmoji, a.ico, `${a.id}: altes Emoji`);
    }
  });
  test(`${name}: alle acht Sprachen, Symbol-Kennung ohne Emoji`, () => {
    for (const x of neu) {
      for (const s of G.SPRACHEN) assert.ok(typeof x[s] === 'string' && x[s].trim(), `${x.id}.${s} fehlt`);
      assert.match(x.symbol, /^[a-z]+(-[a-z]+)+$/, x.id);
      assert.ok(!EMOJI.test(x.symbol), x.id);
      for (const s of G.SPRACHEN) assert.ok(!EMOJI.test(x[s]), `${x.id}.${s} enthält ein Emoji`);
    }
    assert.equal(new Set(neu.map(x => x.symbol)).size, neu.length, 'jede Symbol-Kennung einmal');
  });
}

test('ergänzt sind genau die vier Sprachen, die die alte App nicht führt', () => {
  assert.deepEqual([...G.SPRACHEN], ['de', 'en', 'ru', 'zh', 'es', 'fr', 'it', 'pt']);
  const fehltAlt = G.SPRACHEN.filter(s => schlicht(ALT.GLASS_TYPES).every(g => g[s] === undefined));
  assert.deepEqual([...G.ERGAENZT], fehltAlt);
});

test('glasName / tempName wie glassName / tempName, auch für fremde Kennungen', () => {
  for (const cl of ['de', 'en', 'ru', 'zh']) {
    ALT.__lauf(`CL=${JSON.stringify(cl)}`);
    for (const id of ['highball', 'tumbler', 'martini', 'wine', 'shot', 'mug', 'smoothie', 'oth', 'bowle', 'Highball glass', '', 'kalt', 'room', 'warm', 'hot']) {
      assert.equal(G.glasName(id, cl), ALT.glassName(id), `Glas ${id} (${cl})`);
      assert.equal(G.tempName(id, cl), ALT.tempName(id), `Temperatur ${id} (${cl})`);
    }
  }
  assert.equal(G.glasName('wine', 'fr'), 'Verre à vin');
  assert.equal(G.glasName('wine', 'xx'), 'Weinglas', 'unbekannte Sprache fällt auf Deutsch');
  assert.equal(G.glasName('bowle', 'de'), 'bowle', 'eine fremde Kennung bleibt sichtbar');
  assert.equal(G.istBekanntesGlas('bowle'), false);
});
