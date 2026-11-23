/* getraenke/geraete.mjs — Gerätschaften der Bar: Zeichnungen und Erkennung im Schritt-Text.

   WOHER: die Zeichnungen stehen WÖRTLICH aus `docs/vorschau/mixarium-neu.html`
   (Objekt `GERAET`, ~Zeile 615) hier — eigene Strichzeichnungen im 64er Raster,
   Klasse `f` = Zweitfläche in Akzentfarbe. Die Probe vergleicht Zeichen für
   Zeichen mit der Vorschau. Die alte App (QC-Datei) kennt keine Gerätschaften;
   `geraeteFuerSchritt` ist neu.

   Der Kern führt später eine erweiterbare Geräteliste (Kochansicht); das hier
   sind die Bar-Geräte, die das Mixarium als Ausgabe anhängt. Farben, Strichstärke
   und die Kochansicht selbst gehören NICHT hierher. */

export const GERAETE = Object.freeze({
  stoessel: { de: "Stößel", en: "Muddler", pfade: '<path class="f" d="M24 30l10 10-9 9a7 7 0 0 1-10-10z"/><path d="M24 30l10 10-9 9a7 7 0 0 1-10-10zM29 35l21-21a3 3 0 0 1 4 0l2 2a3 3 0 0 1 0 4L35 41"/>' },
  barloeffel: { de: "Barlöffel", en: "Bar spoon", pfade: '<path d="M52 8L20 44"/><path d="M44 17l-3-3M40 21l-3-3M36 26l-3-3M32 30l-3-3"/><ellipse class="f" cx="15" cy="50" rx="6" ry="9" transform="rotate(42 15 50)"/><ellipse cx="15" cy="50" rx="6" ry="9" transform="rotate(42 15 50)"/>' },
  shaker: { de: "Shaker", en: "Shaker", pfade: '<path class="f" d="M20 28h24l-3 28H23z"/><path d="M20 28h24l-3 28H23zM22 20h20v8H22zM28 12h8v8h-8z"/>' },
  sieb: { de: "Barsieb", en: "Strainer", pfade: '<circle class="f" cx="26" cy="32" r="14"/><circle cx="26" cy="32" r="14"/><path d="M40 32h18M16 26a4 4 0 0 1 6 0 4 4 0 0 0 6 0 4 4 0 0 1 6 0M16 34a4 4 0 0 1 6 0 4 4 0 0 0 6 0 4 4 0 0 1 6 0"/>' },
  mixer: { de: "Standmixer", en: "Blender", pfade: '<path class="f" d="M20 10h26l-4 30H24z"/><path d="M20 10h26l-4 30H24zM18 40h30v14H18zM28 30l5-4 5 4M33 47h0"/>' },
  jigger: { de: "Messbecher", en: "Jigger", pfade: '<path class="f" d="M18 8h28l-10 22h-8z"/><path d="M18 8h28l-10 22h-8zM28 30l-6 24h20l-6-24"/>' },
  reibe: { de: "Reibe", en: "Grater", pfade: '<rect class="f" x="18" y="8" width="26" height="44" rx="4"/><rect x="18" y="8" width="26" height="44" rx="4"/><path d="M25 18h2M33 18h2M25 26h2M33 26h2M25 34h2M33 34h2M25 42h2M33 42h2M28 52v6h6v-6"/>' },
  presse: { de: "Zitruspresse", en: "Juicer", pfade: '<path class="f" d="M10 40h44a22 10 0 0 1-44 0z"/><path d="M10 40h44a22 10 0 0 1-44 0zM22 40c0-14 4-24 10-28 6 4 10 14 10 28M32 12v28"/>' },
  messer: { de: "Messer", en: "Knife", pfade: '<path class="f" d="M8 44L40 12c6 6 6 16 0 22L20 54z"/><path d="M8 44L40 12c6 6 6 16 0 22L20 54zM40 34l14 14"/>' },
  topf: { de: "Topf", en: "Pot", pfade: '<path class="f" d="M14 26h36v22a6 6 0 0 1-6 6H20a6 6 0 0 1-6-6z"/><path d="M14 26h36v22a6 6 0 0 1-6 6H20a6 6 0 0 1-6-6zM8 30h6M50 30h6M20 20h24M28 14h8"/>' },
  glas: { de: "Glas", en: "Glass", pfade: '<path class="f" d="M22 24h20l-2 30H24z"/><path d="M20 8h24l-3 46H23zM22 24h20"/>' },
  krug: { de: "Krug", en: "Jug", pfade: '<path class="f" d="M18 22h26v28a4 4 0 0 1-4 4H22a4 4 0 0 1-4-4z"/><path d="M18 10h22l4 8v32a4 4 0 0 1-4 4H22a4 4 0 0 1-4-4zM44 22c8 0 10 4 10 10s-2 10-10 10"/>' },
  eis: { de: "Eiswürfel", en: "Ice", pfade: '<rect class="f" x="10" y="26" width="22" height="22" rx="4" transform="rotate(-10 21 37)"/><rect x="10" y="26" width="22" height="22" rx="4" transform="rotate(-10 21 37)"/><rect x="32" y="14" width="20" height="20" rx="4" transform="rotate(12 42 24)"/>' },
});
for (const k of Object.keys(GERAETE)) Object.freeze(GERAETE[k]);

export const GERAET_KENNUNGEN = Object.freeze(Object.keys(GERAETE));
export const VIEWBOX = '0 0 64 64';

/* Name eines Geräts; Sprachen außer de/en fallen auf Englisch (bewusst: nur
   diese zwei sind gezeichnet und benannt, siehe README „Grenzen"). */
export function geraetName(kennung, sprache) {
  const g = GERAETE[kennung];
  if (!g) return kennung;
  return sprache === 'de' ? g.de : (g[sprache] || g.en);
}
/* Das fertige SVG wie in der Vorschau (`gZ`). Unbekannte Kennung → ''. */
export function geraetSvg(kennung, klasse) {
  const g = GERAETE[kennung];
  if (!g) return '';
  return `<svg class="${klasse || 'geraet'}" viewBox="${VIEWBOX}" aria-hidden="true">${g.pfade}</svg>`;
}

/* ── Erkennung im Schritt-Text (ohne KI, Wörterliste de/en) ──────────────
   Reihenfolge der Liste = Reihenfolge der Ausgabe. Jedes Muster steht für ein
   Tätigkeits- oder Ding-Wort; Wortanfänge sind bewacht, damit „Eis" nicht in
   „Reis" und „Preis" trifft und „mix" nicht in „Remix".
   ⚠ Ein Hinweis, kein Wissen: am Getränk von Hand ergänzbar muss es bleiben. */
const A = '(?<![\\p{L}])';                 // Wortanfang
const REGELN = [
  ['messer', [A + 'schneid', A + 'geschnitten', A + 'schnitt', A + 'würfel[nt]', A + 'gewürfelt', A + 'wuerfel[nt]', A + 'hack', A + 'gehackt', A + 'halbier', A + 'viertel[nt]', A + 'geviertelt', A + 'schäl', A + 'schael', A + 'in (?:scheiben|stücke|stuecke|spalten|würfel)', A + 'messer',
    A + 'cut(?:s|ting)?(?![\\p{L}])', A + 'slic(?:e|es|ed|ing)(?![\\p{L}])', A + 'chop', A + 'dic(?:e|ed|ing)(?![\\p{L}])', A + 'halve', A + 'quarter(?:ed|s)?(?![\\p{L}])', A + 'peel(?:ed|ing)?(?![\\p{L}])', A + 'knife']],
  ['reibe', [A + 'reib(?:e|en|t)(?![\\p{L}])', A + 'gerieben', A + 'raspel', A + 'geraspelt', A + 'abrieb', A + 'zesten? abziehen',
    A + 'grat(?:e|ed|ing|er)(?![\\p{L}])', A + 'zest(?:ed|ing)(?![\\p{L}])']],
  ['presse', [A + 'auspress', A + 'ausgepresst', A + 'press(?:e|en|t)(?![\\p{L}])', A + 'gepresst', A + 'entsaft', A + 'zitruspresse',
    A + 'squeez', A + 'juic(?:e|ed|ing) the', A + 'juicer']],
  ['stoessel', [A + 'andrück', A + 'andrueck', A + 'angedrückt', A + 'zerdrück', A + 'zerdrueck', A + 'zerstoß', A + 'zerstoss', A + 'zerstampf', A + 'muddel', A + 'stößel', A + 'stoessel', A + 'mörser', A + 'moerser',
    A + 'muddl', A + 'crush(?:ed|ing)? (?:the )?(?:mint|lime|leaves|fruit|berries|sugar)', A + 'mash(?:ed|ing)?(?![\\p{L}])']],
  ['jigger', [A + 'abmess', A + 'abgemessen', A + 'messbecher', A + 'jigger', A + 'measur']],
  ['shaker', [A + 'schüttel', A + 'schuettel', A + 'geschüttelt', A + 'shak', A + 'shaker']],
  ['mixer', [A + 'mix(?:e|en|t|er|ern)(?![\\p{L}])', A + 'gemixt', A + 'pürier', A + 'puerier', A + 'püriert', A + 'standmixer', A + 'blender',
    A + 'blend(?:s|ed|ing)?(?![\\p{L}])', A + 'pur[ée]e', A + 'liquidi[sz]e']],
  ['topf', [A + 'koch', A + 'gekocht', A + 'aufkoch', A + 'erhitz', A + 'erwärm', A + 'erwaerm', A + 'köchel', A + 'koechel', A + 'einkoch', A + 'sieden', A + 'ziehen lassen', A + 'topf',
    A + 'boil', A + 'simmer', A + 'heat(?:s|ed|ing)?(?![\\p{L}])', A + 'saucepan', A + 'pot(?![\\p{L}])', A + 'steep']],
  ['sieb', [A + 'abseih', A + 'abgeseiht', A + 'seih', A + 'durchsieb', A + 'passier', A + 'abgieß', A + 'abgiess', A + 'filter', A + 'sieb(?![\\p{L}])', A + 'barsieb',
    A + 'strain', A + 'sieve']],
  ['barloeffel', [A + 'umrühr', A + 'umruehr', A + 'umgerührt', A + 'verrühr', A + 'verruehr', A + 'einrühr', A + 'einruehr', A + 'rühr', A + 'ruehr', A + 'gerührt', A + 'barlöffel', A + 'barloeffel',
    A + 'stir', A + 'bar ?spoon']],
  ['krug', [A + 'krug', A + 'karaffe', A + 'kanne', A + 'bowlengefäß', A + 'bowlenschüssel', A + 'pitcher', A + 'jug(?![\\p{L}])', A + 'carafe', A + 'punch bowl']],
  ['glas', [A + 'glas(?![\\p{L}])', A + 'gläser', A + 'glaeser', A + 'ins glas', A + 'becher(?![\\p{L}])', A + 'tasse(?![\\p{L}])',
    A + 'glass', A + 'tumbler', A + 'highball', A + 'mug(?![\\p{L}])']],
  ['eis', [A + 'eis(?![\\p{L}])', A + 'eiswürfel', A + 'eiswuerfel', A + 'crushed ice', A + 'gestoßenes eis', A + 'auf eis',
    A + 'ice(?![\\p{L}])', A + 'ice cubes?']],
].map(([k, muster]) => [k, new RegExp(muster.join('|'), 'iu')]);

/* Welche Gerätschaften braucht dieser Schritt? Kennungen in fester Reihenfolge,
   jede höchstens einmal. Leerer oder fehlender Text → []. */
export function geraeteFuerSchritt(text) {
  const t = String(text == null ? '' : text);
  if (!t.trim()) return [];
  return REGELN.filter(([, re]) => re.test(t)).map(([k]) => k);
}
/* Alle Gerätschaften eines Getränks (über seine Schritte), ohne Wiederholung,
   in der Reihenfolge des ersten Auftretens. Von Hand ergänzte (`r.geraete`,
   Liste von Kennungen) stehen vorn. */
export function geraeteFuerGetraenk(r) {
  const out = [];
  const dazu = k => { if (GERAETE[k] && !out.includes(k)) out.push(k); };
  (Array.isArray(r && r.geraete) ? r.geraete : []).forEach(dazu);
  for (const s of (Array.isArray(r && r.steps) ? r.steps : [])) geraeteFuerSchritt(typeof s === 'string' ? s : (s && s.txt)).forEach(dazu);
  return out;
}
