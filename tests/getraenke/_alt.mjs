/* Hilfe für die Proben: holt Funktionen und Konstanten WÖRTLICH aus der QC-Datei
   (der alten App) und führt sie in einem eigenen `vm`-Kontext aus. So vergleicht
   eine Probe die neue Schicht mit der alten RECHNUNG, nicht mit einer Abschrift.
   Die QC-Datei wird nur gelesen. */
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import vm from 'node:vm';

export const WURZEL = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const qcName = readdirSync(WURZEL).filter(n => /^QC_Mixarium_.*\.html$/.test(n)).sort()[0];
export const QC_PFAD = join(WURZEL, qcName);
export const QC = readFileSync(QC_PFAD, 'utf8');

/* Ab `start` (zeigt auf die öffnende Klammer) bis zur passenden schließenden.
   Zeichenketten und Kommentare werden übersprungen (in den Kommentaren der
   alten App stehen Apostrophe und Klammern). */
function klammerEnde(src, start) {
  const auf = src[start], zu = auf === '{' ? '}' : auf === '[' ? ']' : ')';
  let tiefe = 0;
  for (let i = start; i < src.length; i++) {
    const c = src[i], d = src[i + 1];
    if (c === '/' && d === '*') { i = src.indexOf('*/', i + 2) + 1; continue; }
    if (c === '/' && d === '/' && src[i - 1] !== '\\' && src[i - 1] !== ':') { i = src.indexOf('\n', i); continue; }
    if (c === "'" || c === '"' || c === '`') {
      for (i++; i < src.length && src[i] !== c; i++) if (src[i] === '\\') i++;
      continue;
    }
    if (c === auf) tiefe++;
    else if (c === zu) { tiefe--; if (tiefe === 0) return i; }
  }
  throw new Error('Klammer nicht geschlossen ab ' + start);
}
/* Quelltext einer Funktion (`function name(`) oder Konstante (`const NAME=`).
   ⚠ GENOMMEN WIRD DIE LETZTE DEKLARATION. In der QC-Datei steht `parseAmt`
   zweimal (~11037 und ~12032); Funktions-Deklarationen werden hochgezogen, die
   spätere gewinnt — so rechnet der Browser, also misst die Probe dagegen. */
function letzte(re) { let m, l = null; while ((m = re.exec(QC))) l = m; return l; }
export function altQuelle(name) {
  let m = letzte(new RegExp('(^|\\n)(async )?function ' + name + '\\(', 'g'));
  if (m) {
    const a = m.index + m[1].length;
    const kopfEnde = klammerEnde(QC, QC.indexOf('(', a));
    return QC.slice(a, klammerEnde(QC, QC.indexOf('{', kopfEnde)) + 1);
  }
  m = letzte(new RegExp('(^|\\n)const ' + name + '=', 'g'));
  if (!m) throw new Error('In der QC-Datei nicht gefunden: ' + name);
  const a = m.index + m[1].length;
  const wert = a + ('const ' + name + '=').length;
  const klammer = QC.startsWith('new Set(', wert) ? wert + 7 : ('{[('.includes(QC[wert]) ? wert : -1);
  return QC.slice(a, QC.indexOf(';', klammer < 0 ? wert : klammerEnde(QC, klammer)) + 1);
}
/* Wie oft ist eine Funktion in der QC-Datei deklariert? */
export function altAnzahl(name) { return (QC.match(new RegExp('(^|\\n)(async )?function ' + name + '\\(', 'g')) || []).length; }
/* Lädt die genannten Stücke in EINEN Kontext. `vorspann` stellt, was die alte
   App global erwartet (R, FD, CL, localStorage …). Zurück kommt ein Objekt mit
   den Namen; `__lauf(code)` führt weiteren Code im selben Kontext aus. */
export function altLaden(namen, vorspann) {
  const code = (vorspann || '') + '\n' + namen.map(altQuelle).join('\n') +
    '\n;({' + namen.join(',') + ', __lauf: function(c){ return eval(c); } })';
  return vm.runInNewContext(code, { console, JSON, Math, Date, Number, String, Array, Object, Set, Map, isFinite, isNaN, parseInt, parseFloat });
}
/* Werte aus dem fremden Kontext in gewöhnliche Objekte (für deepEqual). */
export const schlicht = x => (x === undefined ? undefined : JSON.parse(JSON.stringify(x)));
/* Fester Zufall für viele Eingaben — dieselbe Folge bei jedem Lauf. */
export function zufall(saat) { let s = saat >>> 0; return () => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296); }
