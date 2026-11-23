/* getraenke/alkohol.mjs — „hat Alkohol" und der Schalter „Ohne Alkohol" (`mxNoAlc9`).

   WOHER (QC_Mixarium_20_04_26.html): Abschnitt „ALKOHOL-TOGGLE" (~8050):
   `getAlcFilter` (~8053), `alcAllowed` (~8085).

   ⚠ WAS DIE ALTE APP WIRKLICH PRÜFT — und was nicht. `alcAllowed` kennt genau
   ZWEI Merkmale: die Kategorie `ckt` und das Feld `r.alcohol`. Eine Erkennung
   über Zutaten-Stichworte gibt es in der alten App NICHT (gesucht in der ganzen
   QC-Datei; `alcohol` wird nur vom Labor ~7260 und von TheCocktailDB ~7668
   gesetzt). Deshalb stehen hier zwei getrennte Dinge:

   1. `hatAlkohol` / `alcErlaubt` / `filterOhneAlkohol` — urteilen GENAU wie die
      alte App. Das ist der Schalter.
   2. `alkoholBefund` — strenger, NEU: zusätzlich Zutaten-Stichworte. Er ist ein
      HINWEIS, kein Beweis, und wird nur für die Store-Ausgabe benutzt
      (`fuerAusgabe` in uebernahme.mjs), wo ein durchgerutschtes Getränk die
      Altersfreigabe kostet. Jeder Treffer nennt seinen Grund. */

import { KATEGORIEN, katHatAlkohol } from './kategorien.mjs';

/* Wie `getAlcFilter`: der rohe Speicherwert von `mxNoAlc9` → an/aus. */
export function schalterLesen(roh) { return roh === '1'; }
export function schalterSchreiben(an) { return an ? '1' : '0'; }

/* Die Kennungen der festen Kategorien mit Alkohol-Merkmal (heute nur `ckt`). */
const ALK_KATS = new Set(KATEGORIEN.filter(c => c.alcohol === true).map(c => c.id));

/* Genau die zwei Merkmale der alten App: Kategorie `ckt` (roh verglichen, wie
   `r.cat==='ckt'`) oder ein wahres Feld `alcohol`. */
export function hatAlkohol(r) {
  if (!r) return false;
  if (ALK_KATS.has(r.cat)) return true;
  if (r.alcohol) return true;
  return false;
}
/* Wie `alcAllowed(r)`: soll das Getränk gezeigt werden? `ohneAlkohol` ist der Schalter. */
export function alcErlaubt(r, ohneAlkohol) {
  if (!ohneAlkohol) return true;
  return !hatAlkohol(r);
}
export function filterOhneAlkohol(getraenke, ohneAlkohol) {
  return (getraenke || []).filter(r => alcErlaubt(r, ohneAlkohol));
}

/* ── Der strengere Befund (neu) ──────────────────────────────────────────
   Stichworte de/en, als GANZE Wörter. „Gin" trifft nicht „Ginger", „Wein"
   nicht „Schwein" oder „Weintrauben", „Rum" nicht „Rumaroma". */
const STICHWORTE = [
  'rum', 'wodka', 'vodka', 'gin', 'whisky', 'whiskey', 'bourbon', 'scotch', 'tequila', 'mezcal', 'cachaça', 'cachaca',
  'brandy', 'cognac', 'weinbrand', 'likör', 'likoer', 'liqueur', 'schnaps', 'obstler', 'grappa', 'calvados', 'pisco',
  'absinth', 'absinthe', 'ouzo', 'sambuca', 'amaretto', 'baileys', 'cointreau', 'triple sec', 'kahlúa', 'kahlua',
  'aperol', 'campari', 'wermut', 'vermouth', 'limoncello', 'jägermeister', 'sherry', 'portwein', 'sake',
  'wein', 'rotwein', 'weißwein', 'weisswein', 'roséwein', 'rosewein', 'glühwein', 'gluehwein', 'schaumwein', 'perlwein',
  'apfelwein', 'wine', 'sekt', 'prosecco', 'champagner', 'champagne', 'crémant', 'cremant', 'cidre',
  'bier', 'weizenbier', 'weißbier', 'pils', 'pilsner', 'beer',
];
/* Steht eines davon in der Zutat, ist das Stichwort entkräftet. */
const ENTLASTUNG = [
  'alkoholfrei', 'alkfr', 'ohne alkohol', 'alcohol-free', 'alcohol free', 'non-alcoholic', 'non alcoholic', 'nonalcoholic',
  '0,0', '0.0', 'aroma', 'extrakt', 'extract', 'essenz', 'sirup', 'syrup', 'essig', 'vinegar',
  'ginger beer', 'ginger bier', 'ingwerbier', 'root beer', 'malzbier', 'butterbier',
];
const _B = '(?<![\\p{L}\\p{N}])', _E = '(?![\\p{L}\\p{N}])';
/* Bei diesen darf vorn etwas angewachsen sein: „Orangenlikör", „Kirschschnaps",
   „Weizenbier". Bei „Wein", „Sekt", „Rum" NICHT — sonst träfen „Schwein",
   „Insekt", „Zentrum". */
const MIT_VORSILBE = new Set(['likör', 'likoer', 'schnaps', 'bier']);
const _STICH_RE = STICHWORTE.map(w => [w, new RegExp((MIT_VORSILBE.has(w) ? '' : _B) + w.replace(/ /g, '[\\s-]+') + _E, 'iu')]);

/* Welche Alkohol-Stichworte stehen in diesem Zutaten-Namen? */
export function alkoholStichworte(name) {
  const t = String(name == null ? '' : name).toLowerCase();
  if (!t) return [];
  if (ENTLASTUNG.some(e => t.includes(e))) return [];
  return _STICH_RE.filter(([, re]) => re.test(t)).map(([w]) => w);
}

/* Der Befund: {alkohol, gruende}. Gründe: 'kategorie:<id>', 'feld:alcohol',
   'feld:alkohol' (das Labor liefert `alkohol`, QC ~7260), 'zutat:<wort>'.
   Die Kategorie wird hier GETRIMMT gelesen (`"ckt "` zählt), und neu angelegte
   Kategorien mit `alcohol:true` zählen mit. `zutatenPruefen:false` schaltet die
   Stichworte ab. */
export function alkoholBefund(r, optionen) {
  const o = optionen || {};
  const gruende = [];
  if (!r) return { alkohol: false, gruende };
  const kat = typeof r.cat === 'string' ? r.cat.trim() : '';
  if (kat && katHatAlkohol(kat, o.neu)) gruende.push('kategorie:' + kat);
  if (r.alcohol) gruende.push('feld:alcohol');
  if (r.alkohol) gruende.push('feld:alkohol');
  if (o.zutatenPruefen !== false) {
    const gesehen = new Set();
    for (const i of (Array.isArray(r.ings) ? r.ings : [])) {
      const name = typeof i === 'string' ? i : (i && i.name);
      for (const w of alkoholStichworte(name)) if (!gesehen.has(w)) { gesehen.add(w); gruende.push('zutat:' + w); }
    }
  }
  return { alkohol: gruende.length > 0, gruende };
}
