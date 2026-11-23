/* getraenke/kategorien.mjs — Getränke-Kategorien und ihre Deutung.

   WOHER (QC_Mixarium_20_04_26.html): `CATS` (~5739), eigene Namen `CATS_EIGEN`
   (`mxcats9m`, ~5786), `CATS_NEU`/`CATS_AUS` (`mxcatsneu9m`/`mxcatsaus9m`, ~5804),
   `CATS_ORD` (`mxcatord9m`, ~5817), `katBeschriftung`/`katSymbol` (~5835),
   `KAT_OHNE`, `ordnerVonRezept`, `katVonRezept` (~5859–5884), `KAT_FAMILIE`,
   `katFamilie`, `catsFremd`, `catsAlle`, `katUmsortieren` (~6001–6111).
   Die Befunde dazu stehen in CLAUDE.md („KATEGORIEN SIND UMBENENNBAR",
   „EINE KENNUNG IST KEIN NAME", „ZWEI STELLEN ZÄHLTEN DIESELBE SACHE VERSCHIEDEN").

   Alles hier ist REIN: keine Funktion liest einen Speicher oder eine globale
   Liste. Getränke, Ordner und Einstellungen werden übergeben. Das Speichern
   und die Oberfläche gehören in den Kern, nicht hierher.

   ⚠ GESPEICHERT WIRD NUR DIE BESCHRIFTUNG, NIE DIE KENNUNG. `id` bleibt `ckt`,
   auch wenn dort „Salate" steht — jedes Getränk zeigt über `cat` darauf. */

export const KAT_OHNE = '__ohne';            // Zustand „ohne Kategorie", kein Thema
export const KAT_ALLE = Object.freeze({ id: 'all', symbol: 'kat-alle', ico: '🧪', de: 'Alle', en: 'All', ru: 'Все', zh: '全部', es: 'Todos', fr: 'Tous', it: 'Tutti', pt: 'Todos', col: '#0d5c5a' });

/* Die zehn festen Getränke-Kategorien (ohne die Ansicht „Alle").
   `ico` ist das Emoji der alten App (Nutzer wählen dort eigene Emojis, deshalb
   bleibt das Feld); `symbol` ist die sprachfreie Kennung für eine Zeichnung. */
export const KATEGORIEN = Object.freeze([
  { id: 'smooth', symbol: 'kat-smoothie', ico: '🥤', de: 'Smoothies & Shakes', en: 'Smoothies', ru: 'Смузи', zh: '奶昔', es: 'Batidos', fr: 'Smoothies', it: 'Frullati', pt: 'Batidos', col: '#2d8a4e' },
  { id: 'mock', symbol: 'kat-mocktail', ico: '🍹', de: 'Mocktails', en: 'Mocktails', ru: 'Мокт.', zh: '无酒', es: 'Mocktails', fr: 'Mocktails', it: 'Mocktail', pt: 'Mocktail', col: '#c05a8a' },
  { id: 'afckt', symbol: 'kat-alkoholfrei', ico: '🍸', de: 'Alkfr. Cocktails', en: 'Alcohol-free', ru: 'Безалк.', zh: '无酒鸡尾', es: 'Sin alcohol', fr: 'Sans alcool', it: 'Analcolici', pt: 'Sem álcool', col: '#7a3a9a' },
  { id: 'limo', symbol: 'kat-limonade', ico: '🍋', de: 'Limonaden', en: 'Lemonades', ru: 'Лимонады', zh: '柠檬水', es: 'Limonadas', fr: 'Limonades', it: 'Limoniate', pt: 'Limonadas', col: '#c8a020' },
  { id: 'tee', symbol: 'kat-tee', ico: '☕', de: 'Tees & Kaffees', en: 'Teas & Coffees', ru: 'Чаи & Кофе', zh: '茶 & 咖啡', es: 'Tés & Cafés', fr: 'Thés & Cafés', it: 'Tè & Caffè', pt: 'Chás & Cafés', col: '#6b4a2a' },
  { id: 'ckt', symbol: 'kat-cocktail', ico: '🍸', de: 'Cocktails', en: 'Cocktails', ru: 'Коктейли', zh: '鸡尾酒', es: 'Cócteles', fr: 'Cocktails', it: 'Cocktail', pt: 'Coquetéis', col: '#c04030', alcohol: true },
  { id: 'bowle', symbol: 'kat-bowle', ico: '🍶', de: 'Bowlen', en: 'Punches', ru: 'Пунши', zh: '宾治', es: 'Ponches', fr: 'Punchs', it: 'Punch', pt: 'Ponches', col: '#ff5a5f' },
  { id: 'sirup', symbol: 'kat-sirup', ico: '🫙', de: 'Sirup & Basis', en: 'Syrups & Base', ru: 'Сиропы', zh: '糖浆', es: 'Siropes', fr: 'Sirops', it: 'Sciroppi', pt: 'Xaropes', col: '#5a8a3a' },
  { id: 'knab', symbol: 'kat-knabbern', ico: '🥨', de: 'Knabbereien', en: 'Snacks', ru: 'Снэки', zh: '小吃', es: 'Aperitivos', fr: 'Grignotages', it: 'Stuzzichini', pt: 'Petiscos', col: '#b8852a' },
  { id: 'finger', symbol: 'kat-fingerfood', ico: '🍢', de: 'Fingerfood', en: 'Finger food', ru: 'Закуски', zh: '指食', es: 'Tapas', fr: 'Amuse-bouches', it: 'Finger food', pt: 'Petiscos', col: '#a04a3a' },
].map(Object.freeze));

/* Das Wörterbuch der Familie: Kennung → Symbol + Name in 8 Sprachen, 18 Stück.
   Aus den CATS-Blöcken der drei Apps abgeleitet (QC ~6001). Ein eigener Name
   gewinnt weiterhin über alles; eine unbekannte Kennung wird NICHT erfunden. */
export const KAT_FAMILIE = Object.freeze([
  ...KATEGORIEN.map(c => ({ id: c.id, ico: c.ico, de: c.de, en: c.en, ru: c.ru, zh: c.zh, es: c.es, fr: c.fr, it: c.it, pt: c.pt })),
  { id: 'vorsp', ico: '🥗', de: 'Vorspeisen', en: 'Starters', ru: 'Закуски', zh: '前菜', es: 'Entrantes', fr: 'Entrées', it: 'Antipasti', pt: 'Entradas' },
  { id: 'suppe', ico: '🍜', de: 'Suppen', en: 'Soups', ru: 'Супы', zh: '汤', es: 'Sopas', fr: 'Soupes', it: 'Zuppe', pt: 'Sopas' },
  { id: 'fleisch', ico: '🍲', de: 'Fleisch', en: 'Meat', ru: 'Мясо', zh: '肉类', es: 'Carne', fr: 'Viande', it: 'Carne', pt: 'Carne' },
  { id: 'fisch', ico: '🐟', de: 'Fisch', en: 'Fish', ru: 'Рыба', zh: '鱼类', es: 'Pescado', fr: 'Poisson', it: 'Pesce', pt: 'Peixe' },
  { id: 'vegi', ico: '🥦', de: 'Vegetarisch', en: 'Vegetarian', ru: 'Вегет.', zh: '素食', es: 'Vegetariano', fr: 'Végétarien', it: 'Vegetariano', pt: 'Vegetariano' },
  { id: 'kuchen', ico: '🍰', de: 'Kuchen', en: 'Cakes', ru: 'Выпечка', zh: '蛋糕', es: 'Pasteles', fr: 'Gâteaux', it: 'Torte', pt: 'Bolos' },
  { id: 'dessert', ico: '🍮', de: 'Desserts', en: 'Desserts', ru: 'Десерты', zh: '甜点', es: 'Postres', fr: 'Desserts', it: 'Dolci', pt: 'Sobremesas' },
  { id: 'drk', ico: '🍷', de: 'Getränke', en: 'Drinks', ru: 'Напитки', zh: '饮料', es: 'Bebidas', fr: 'Boissons', it: 'Bevande', pt: 'Bebidas' },
].map(Object.freeze));
export function katFamilie(id) { return KAT_FAMILIE.find(k => k.id === id) || null; }

const FREMD_FARBE = '#7a5840';
const OHNE_NAME = Object.freeze({ de: 'Ohne Kategorie', en: 'No category', ru: 'Без категории', zh: '无分类', es: 'Sin categoría', fr: 'Sans catégorie', it: 'Senza categoria', pt: 'Sem categoria' });

/* ── Einstellungen lesen (nur lesen — schreiben ist Sache des Kerns) ─────
   Nimmt die ROHEN localStorage-Werte der alten App und gibt
   {eigen, neu, aus, ord} zurück. Kaputtes JSON → leer, wie `ladeCatsEigen` usw. */
function _json(roh, leer) { try { const v = JSON.parse(roh == null || roh === '' ? 'null' : roh); return v == null ? leer : v; } catch (e) { return leer; } }
export function katEinstellungenLesen(werte) {
  const w = werte || {};
  const e = _json(w.mxcats9m, {}), n = _json(w.mxcatsneu9m, []), a = _json(w.mxcatsaus9m, []), o = _json(w.mxcatord9m, []);
  return {
    eigen: (e && typeof e === 'object' && !Array.isArray(e)) ? e : {},
    neu: Array.isArray(n) ? n.filter(c => c && c.id) : [],
    aus: Array.isArray(a) ? a.map(String) : [],
    ord: Array.isArray(o) ? o.map(String) : [],
  };
}
export function leereKatEinstellungen() { return { eigen: {}, neu: [], aus: [], ord: [] }; }

/* ── Deutung am einzelnen Getränk ────────────────────────────────────────*/
function _hatOrdner(ordner, fid) { return Array.isArray(ordner) && ordner.some(f => f && String(f.id) === fid); }

/* Wie `ordnerVonRezept`: ein Ordner, den es nicht gibt, ist kein Ordner → ''. */
export function ordnerVonRezept(r, ordner) {
  const f = (r && r.folder != null) ? String(r.folder) : '';
  if (!f) return '';
  return _hatOrdner(ordner, f) ? f : '';
}
/* Wie `katVonRezept`: leer → KAT_OHNE; `fld_…` auf einen toten Ordner → KAT_OHNE;
   jede andere Kennung bleibt, wie sie ist (auch eine fremde). */
export function katVonRezept(r, ordner) {
  const id = (r && typeof r.cat === 'string') ? r.cat.trim() : '';
  if (!id) return KAT_OHNE;
  if (id.indexOf('fld_') === 0) return _hatOrdner(ordner, id.slice(4)) ? id : KAT_OHNE;
  return id;
}
/* Sichtbar ist, was einen Namen hat und keine leere Karte ist (wie `katAnzahl`). */
export function istSichtbar(r) { return !!(r && !r.blank && r.name && String(r.name).trim()); }
export function katAnzahl(id, getraenke, ordner) {
  return (getraenke || []).filter(r => istSichtbar(r) && katVonRezept(r, ordner) === id).length;
}

/* ── Name und Symbol ─────────────────────────────────────────────────────
   EINE Stelle für den angezeigten Namen. Ein eigener Name gewinnt über alles
   und gilt in allen 8 Sprachen (Klaus hat ihn selbst geschrieben). */
export function katBeschriftung(c, eigen, sprache) {
  if (!c) return '';
  const e = eigen && eigen[c.id];
  if (e && e.name) return e.name;
  return c[sprache || 'de'] || c.de || c.id;
}
export function katSymbol(c, eigen) {
  if (!c) return '📦';
  const e = eigen && eigen[c.id];
  if (e && e.ico) return e.ico;
  return c.ico || '📦';
}

/* ── Mitgebrachte Kategorien ─────────────────────────────────────────────
   Wie `catsFremd`: Kennungen, die in den Getränken vorkommen und die die festen
   Kategorien nicht kennen, bekommen einen Eintrag (`fremd:true`). Steht die
   Kennung im Familien-Wörterbuch, trägt sie dessen Namen; sonst bleibt sie
   sichtbar, wie sie ist (`unbekannt:true`). „Ohne Kategorie" erscheint nur,
   wenn es etwas darin gibt.

   ⚠ BENANNTE ABWEICHUNG VON DER ALTEN APP: gelesen wird hier die GEDEUTETE
   Kennung (`katVonRezept`, getrimmt), nicht das rohe Feld. Die alte `catsFremd`
   las `r.cat` roh: bei `"sushi "` entstand ein Reiter `"sushi "`, während
   gezählt wurde unter `"sushi"` — ein Reiter, der nie etwas zeigt (gemessen im
   Brief aus Mein Rezeptbuch vom 23.11.2026, Abschnitt 5). „Eine Kennung, die an
   einer Stelle gedeutet und an der anderen roh gelesen wird, ist zwei."
   `Sushi` und `sushi` bleiben ZWEI Kennungen — still zusammengelegt wird nichts. */
export function katsFremd(getraenke, ordner, optionen) {
  const o = optionen || {};
  const sprache = o.sprache || 'de';
  const bekannt = new Set(KATEGORIEN.map(c => c.id).concat(['all']));
  const out = [], gesehen = new Set();
  let ohne = 0;
  for (const r of (getraenke || [])) {
    const id = katVonRezept(r, ordner);
    if (id === KAT_OHNE) { if (istSichtbar(r)) ohne++; continue; }
    if (bekannt.has(id) || gesehen.has(id)) continue;
    if (id.indexOf('fld_') === 0) continue;                 // Ordner haben ihren eigenen Weg
    gesehen.add(id);
    const bk = katFamilie(id);
    if (bk) out.push({ id, ico: bk.ico, col: FREMD_FARBE, fremd: true, de: bk.de, en: bk.en, ru: bk.ru, zh: bk.zh, es: bk.es, fr: bk.fr, it: bk.it, pt: bk.pt });
    else out.push({ id, ico: '📦', de: id, col: FREMD_FARBE, fremd: true, unbekannt: true });
  }
  if (ohne > 0) {
    const lbl = o.ohneName || OHNE_NAME[sprache] || OHNE_NAME.de;
    const e = { id: KAT_OHNE, ico: '❓', de: OHNE_NAME.de, col: FREMD_FARBE, fremd: true, ohne: true };
    e[sprache] = lbl;
    out.push(e);
  }
  return out;
}

/* Wie `catsAlle`: alle Kategorien außer „Alle" — die festen, die neu
   angelegten und die mitgebrachten.
   - EINE KENNUNG KOMMT GENAU EINMAL HERAUS (Riegel an der Quelle).
   - Ausgeblendet (`aus`) wird nur, was LEER ist.
   - `ord` ist die gespeicherte Reihenfolge; wer nicht darin steht, behält
     seinen Platz dahinter. */
export function katsAlle(lage) {
  const l = lage || {};
  const getraenke = l.getraenke || [], ordner = l.ordner || [];
  const k = l.kategorien || {};
  const neu = k.neu || [], ord = k.ord || [];
  const aus = new Set((k.aus || []).map(String).filter(id => katAnzahl(id, getraenke, ordner) === 0));
  const out = [], gesehen = new Set();
  KATEGORIEN.concat(neu).concat(katsFremd(getraenke, ordner, { sprache: l.sprache, ohneName: l.ohneName })).forEach(c => {
    if (!c || c.id === undefined || c.id === null) return;
    const id = String(c.id);
    if (aus.has(id) || gesehen.has(id)) return;
    gesehen.add(id); out.push(c);
  });
  if (ord.length) {
    const pos = {}; ord.forEach((id, i) => { pos[String(id)] = i; });
    const gross = ord.length, idx = new Map();
    out.forEach((c, i) => idx.set(c, i));
    out.sort((a, b) => {
      const pa = pos[String(a.id)], pb = pos[String(b.id)];
      return ((pa === undefined) ? gross + idx.get(a) : pa) - ((pb === undefined) ? gross + idx.get(b) : pb);
    });
  }
  return out;
}

/* Name zu einer Kennung, über dieselbe Quelle wie alles andere (`catName`). */
export function katName(id, lage) {
  const l = lage || {};
  if (typeof id === 'string' && id.indexOf('fld_') === 0) {
    const f = (l.ordner || []).find(x => String(x.id) === id.slice(4));
    return f ? f.name : id;
  }
  const c = katsAlle(l).find(x => x.id === id);
  return c ? katBeschriftung(c, (l.kategorien || {}).eigen, l.sprache) : id;
}

/* Wie `katUmsortieren`, aber rein: gibt die NEUE vollständige Reihenfolge
   zurück (oder null, wenn der Zug nichts ist). Die Liste wird vollständig neu
   geschrieben, nicht ergänzt — eine Teil-Liste hätte Lücken. */
export function katUmsortieren(lage, vonId, nachId, wohin) {
  const von = String(vonId || ''), nach = String(nachId || '');
  if (!von || !nach || von === nach) return null;
  const ids = katsAlle(lage).map(c => String(c.id));
  const i = ids.indexOf(von); if (i < 0) return null;
  ids.splice(i, 1);
  let j = ids.indexOf(nach); if (j < 0) return null;
  if (wohin === 'nach') j++;
  ids.splice(j, 0, von);
  return ids;
}

/* Trägt die Kategorie das Alkohol-Merkmal? (fest: nur `ckt`; neu angelegte
   oder mitgebrachte dürfen es ebenfalls tragen.) */
export function katHatAlkohol(id, neu) {
  const sid = String(id == null ? '' : id).trim();
  return KATEGORIEN.concat(neu || []).some(c => c && String(c.id) === sid && c.alcohol === true);
}

/* ── Übergang zum Zustand des Küchen-Kerns (ab PWA 10.0.0-vor8) ───────────
   Alt (wie die bisherige App speichert): { eigen: {id: {name, ico}}, neu: [{id, de, ico, …}], aus: [id], ord: [id] }
   Kern (`kern/modell/kategorien.mjs`):   { eigene: [{id, de, emoji, …}], namen: {id: {name, emoji}}, ausgeblendet: [id], folge: [id] }
   Nimmt auch einen GEMISCHTEN Zustand (Kern-Zustand, an den die Getränke-Schicht beim Einspielen noch `neu` gehängt
   hat) und legt beides zusammen. Verloren geht nichts: eigene Namen, Zeichen, Ausblendungen und die Reihenfolge
   kommen mit; eine Kennung kommt genau einmal vor (die schon vorhandene gewinnt). Das Zeichen der alten App (`ico`,
   ein Emoji) heißt im Kern `emoji`. */
export function katZustandZuKern(z) {
  const k = z || {};
  const eigene = [], ids = new Set();
  const nimm = (c, ausAlt) => {
    if (!c || c.id == null || !String(c.id).trim()) return;
    const id = String(c.id).trim(); if (ids.has(id)) return; ids.add(id);
    if (!ausAlt) { eigene.push({ ...c, id }); return; }
    const { ico, col, eigen, fremd, ...rest } = c;
    eigene.push({ ...rest, id, de: rest.de || rest.name || id, ...(ico ? { emoji: ico } : {}) });
  };
  (Array.isArray(k.eigene) ? k.eigene : []).forEach((c) => nimm(c, false));
  (Array.isArray(k.neu) ? k.neu : []).forEach((c) => nimm(c, true));
  const namen = {};
  const eigenAlt = k.eigen && typeof k.eigen === 'object' && !Array.isArray(k.eigen) ? k.eigen : {};
  for (const [id, e] of Object.entries(eigenAlt)) { if (!e) continue; const v = {}; if (e.name && String(e.name).trim()) v.name = String(e.name).trim(); if (e.ico) v.emoji = e.ico; if (Object.keys(v).length) namen[id] = v; }
  Object.assign(namen, k.namen && typeof k.namen === 'object' ? k.namen : {});
  const liste = (a) => (Array.isArray(a) ? a.map(String) : []);
  const ausgeblendet = [...new Set([...liste(k.ausgeblendet), ...liste(k.aus)])];
  const folge = liste(k.folge).length ? liste(k.folge) : liste(k.ord);
  return { eigene, namen, ausgeblendet, folge };
}
/* Für die Sicherung (Fassung 10, die die bisherige App lesen kann): die neu angelegten Kategorien als Liste im alten
   Format. Der vollständige Kern-Zustand geht ZUSÄTZLICH als `kategorienZustand` mit (die alte App übergeht das Feld). */
export function katListeFuerSicherung(k) {
  return (katZustandZuKern(k).eigene).map(({ emoji, ...c }) => ({ ...c, ...(emoji ? { ico: emoji } : {}) }));
}
