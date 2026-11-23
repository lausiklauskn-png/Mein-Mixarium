/* getraenke/labor.mjs — Mix-Labor: Getränke erfinden, bewerten, in den Lebenszyklus führen.

   WOHER (QC_Mixarium_20_04_26.html, „KI-LABOR“ ab ~7110): `LAB_STATUS`, `LAB_WEIGHTS`, die sechs Geschmäcker
   (~2933), `labGenerate` (Auftrag), `labSave`, `labAddLog`, `_labCalcScore`, `_labApplyStatusLogic`, `labSubmitRate`,
   `labRevise` (Auftrag), `labAcceptRevision`, `labRejectRevision`, `labToggleFavorite`, `labAccept`, `labRemove`,
   `labRestore`. Die Regeln sind ÜBERNOMMEN, nicht neu erfunden; die Probe rechnet sie gegen die alte Funktion.

   REIN: kein Netz, kein Speicher, keine Oberfläche. Der Aufruf an die KI steht in neu/app.mjs; hier stehen nur der
   Auftrag (Text) und das Lesen der Antwort. Jede Änderung am Getränk geht über eine Funktion hier und schreibt einen
   Eintrag ins Protokoll (`labLog`), wie in der alten App (Transparenz-Log).

   ⚠ BENANNTE ABWEICHUNGEN VON DER ALTEN APP:
   1. Die Menge aus der KI („2 cl“) wird in Zahl und Einheit getrennt (`mengeUndEinheitTrennen`); die alte App legte
      alles in `amt` und ließ `unit` leer – dann rechnete weder das Umrechnen ml/cl/oz noch die Einkaufsliste.
   2. Die Antwort wird geprüft, bevor sie ein Getränk wird: ohne Titel, ohne Zutaten oder ohne Schritte ist sie
      unbrauchbar und wird abgelehnt (alt: ein leeres „Lab-Getränk“ hätte entstehen können).
   3. `statusNachBewertung` ruft die Überarbeitung nicht selbst auf; es sagt, DASS sie fällig ist (`ueberarbeiten`).
      Den Aufruf macht die Oberfläche – die Regel selbst bleibt rein und prüfbar.
   4. Ab wann Bewertungen zur ÜBERARBEITETEN Fassung zählen (`labRevisionTs`): ab dem Annehmen des Entwurfs. Alt war es
      der Zeitpunkt, an dem der Entwurf ankam – Bewertungen zwischen Ankunft und Annehmen galten dann schon der neuen
      Fassung, obwohl noch die alte zu sehen war. */
import { mengeUndEinheitTrennen } from './einheiten.mjs';
const trennen = (menge) => { const roh = String(menge == null ? '' : menge).trim(); return mengeUndEinheitTrennen(roh) || { amt: roh, unit: '' }; };

/* Klaus 23.11.2026: Haiku 5.5 statt Haiku 4.5 (die alte App nutzt 4.5). Laut Anthropic etwa ein Zehntel des Preises und
   besser im Befolgen von Anweisungen. Haiku 5.5 denkt vor der Antwort; das Denken zählt in die Längengrenze, deshalb
   LAB_MAX_TOKENS höher als die 2048 von bisher. Keine temperature/top_p und kein vorgefülltes Antwortstück (beides 400). */
export const LAB_MODELL = 'claude-haiku-5-5';
export const LAB_MAX_TOKENS = 8192;

export const LAB_STATUS = Object.freeze({
  experimentell: { de: 'Experimentell', en: 'Experimental', farbe: '#e07c20' },
  inReview: { de: 'Bewertung', en: 'Rating', farbe: '#2d8a4e' },
  accepted: { de: 'Angenommen', en: 'Accepted', farbe: '#0d5c5a' },
  warning: { de: 'Beobachtung', en: 'Watch', farbe: '#c04030' },
  revised: { de: 'Überarbeitet', en: 'Revised', farbe: '#7c3aa8' },
  removed: { de: 'Entfernt', en: 'Removed', farbe: '#888888' },
});
// Gewichtung laut Kosten-Nutzen-Analyse (alt: LAB_WEIGHTS)
export const LAB_WEIGHTS = Object.freeze({ taste: 0.40, practicality: 0.25, originality: 0.20, description: 0.15 });
export const DIMENSIONEN = Object.freeze([
  { id: 'taste', de: 'Geschmack', en: 'Taste' }, { id: 'practicality', de: 'Zubereitung', en: 'Practicality' },
  { id: 'originality', de: 'Originalität', en: 'Originality' }, { id: 'description', de: 'Beschreibung', en: 'Description' },
]);
export const GESCHMAECKER = Object.freeze([
  { id: 'frisch', de: 'frisch', en: 'fresh' }, { id: 'süß', de: 'süß', en: 'sweet' }, { id: 'herb', de: 'herb', en: 'bitter' },
  { id: 'fruchtig', de: 'fruchtig', en: 'fruity' }, { id: 'cremig', de: 'cremig', en: 'creamy' }, { id: 'intensiv', de: 'intensiv', en: 'intense' },
]);
export const SCHWELLE_GUT = 3.5, SCHWELLE_SCHLECHT = 2.5;

/* Mindestzahl Bewertungen: 3, im Einzelpersonen-Modus 1 (alt: labSoloActive → minR). */
export const mindestBewertungen = (solo) => (solo ? 1 : 3);

/* Wie `_labCalcScore`: gewichteter Durchschnitt der vier Durchschnitte. */
export function punkte(ratings) {
  if (!ratings || !ratings.length) return 0;
  const avg = (arr) => arr.reduce((s, x) => s + x, 0) / arr.length;
  return avg(ratings.map((x) => x.taste)) * LAB_WEIGHTS.taste + avg(ratings.map((x) => x.practicality)) * LAB_WEIGHTS.practicality
    + avg(ratings.map((x) => x.originality)) * LAB_WEIGHTS.originality + avg(ratings.map((x) => x.description)) * LAB_WEIGHTS.description;
}

export function protokoll(r, typ, detail, jetzt = Date.now()) { if (!r.labLog) r.labLog = []; r.labLog.push({ ts: jetzt, type: typ, detail }); }

/* Wie `_labApplyStatusLogic`, rein. Ändert `r` und gibt { ueberarbeiten, entfernt } zurück.
   Stufen: experimentell → inReview (1. Bewertung) · ≥ 3,5 nach minR → accepted · < 2,5 nach minR → warning ·
   warning + 2 weitere schlechte → Überarbeitung fällig · revised + minR schlechte nach der Überarbeitung → removed
   (nur ohne Favorit-Schutz) · revised + gute nach der Überarbeitung → accepted. */
export function statusNachBewertung(r, { solo = false, jetzt = Date.now() } = {}) {
  const minR = mindestBewertungen(solo), n = (r.labRatings || []).length, score = r.labScore || 0;
  if (n >= 1 && r.labStatus === 'experimentell') { r.labStatus = 'inReview'; protokoll(r, 'status', 'inReview: erste Bewertung', jetzt); }
  if (n >= minR && score >= SCHWELLE_GUT && r.labStatus === 'inReview') { r.labStatus = 'accepted'; protokoll(r, 'status', 'accepted: Score ' + score.toFixed(2), jetzt); return {}; }
  if (n >= minR && score < SCHWELLE_SCHLECHT && r.labStatus === 'inReview') { r.labStatus = 'warning'; protokoll(r, 'status', 'warning: Score ' + score.toFixed(2), jetzt); }
  if (r.labStatus === 'warning' && n >= minR + 2 && !r.labRevisionPending) {
    const zuletzt = punkte((r.labRatings || []).slice(-(minR + 2)));
    if (zuletzt < SCHWELLE_SCHLECHT) { r.labRevisionPending = true; protokoll(r, 'revision', 'Überarbeitung ausgelöst nach weiterhin Score ' + zuletzt.toFixed(2), jetzt); return { ueberarbeiten: true }; }
  }
  if (r.labStatus === 'revised' && !r.labFavorite) {
    const neu = (r.labRatings || []).filter((x) => x.ts > (r.labRevisionTs || 0));
    if (neu.length >= minR && punkte(neu) < SCHWELLE_SCHLECHT) { r.labStatus = 'removed'; r.labGen = false; protokoll(r, 'status', 'removed: Stufe 3 – 3x schlechte Bewertung nach Überarbeitung', jetzt); return { entfernt: true }; }
  }
  if (r.labStatus === 'revised' && n >= 1) {
    const neu = (r.labRatings || []).filter((x) => x.ts > (r.labRevisionTs || 0));
    if (neu.length >= 1 && punkte(neu) >= SCHWELLE_GUT) { r.labStatus = 'accepted'; protokoll(r, 'status', 'accepted: überarbeitete Version angenommen', jetzt); }
  }
  return {};
}

/* Wie `labSubmitRate`: Werte auf 1–5 begrenzen, anhängen, Score neu, Status-Logik. */
export function bewerten(r, werte, feedback = '', { solo = false, jetzt = Date.now() } = {}) {
  const k = (v) => Math.max(1, Math.min(5, parseInt(v, 10) || 3));
  const rating = { ts: jetzt, taste: k(werte.taste), practicality: k(werte.practicality), originality: k(werte.originality), description: k(werte.description) };
  if (!r.labRatings) r.labRatings = [];
  r.labRatings.push(rating);
  r.labScore = punkte(r.labRatings);
  const fb = String(feedback || '').trim();
  if (fb) r.labFeedback = [...(r.labFeedback || []), fb].slice(-5);
  protokoll(r, 'rating', 'Score ' + r.labScore.toFixed(2) + (fb ? ' – Feedback: ' + fb.slice(0, 60) : ''), jetzt);
  return statusNachBewertung(r, { solo, jetzt });
}

export function annehmen(r, jetzt = Date.now()) { r.labStatus = 'accepted'; protokoll(r, 'status', 'accepted: manuell angenommen', jetzt); }
/* Wie `labRemove`: der Favorit-Schutz verhindert das Entfernen. Gibt false zurück, wenn geschützt. */
export function entfernen(r, jetzt = Date.now()) { if (r.labFavorite) return false; r.labStatus = 'removed'; r.labGen = false; protokoll(r, 'status', 'removed: manuell entfernt', jetzt); return true; }
export function wiederherstellen(r, jetzt = Date.now()) { r.labStatus = 'inReview'; r.labGen = true; protokoll(r, 'status', 'inReview: wiederhergestellt', jetzt); }
export function favorit(r, jetzt = Date.now()) { r.labFavorite = !r.labFavorite; protokoll(r, 'favorite', r.labFavorite ? 'Favorit-Schutz aktiviert' : 'Favorit-Schutz deaktiviert', jetzt); return r.labFavorite; }

/* Im Labor (Pool): alle Labor-Getränke, die weder angenommen noch entfernt sind (alt: labRenderPool). */
export const imLabor = (getraenke) => (getraenke || []).filter((r) => r.labGen && r.labStatus && r.labStatus !== 'accepted' && r.labStatus !== 'removed');
export const entfernteAusLabor = (getraenke) => (getraenke || []).filter((r) => r.labStatus === 'removed' && Array.isArray(r.labLog) && r.labLog.length);

/* ── Aufträge an die KI (Wortlaut der alten App, ergänzt um die Sprache und „nur gängige Zutaten“) ── */
const SCHEMA = '{"titel":"...","beschreibung":"...","portionen":2,"zubereitungszeit_min":5,"schwierigkeit":2,"glastyp":"highball","alkohol":false,"zutaten":[{"menge":"...","name":"..."}],"schritte":["..."],"tags":["..."]}';
const SPRACHE = { de: 'Deutsch', en: 'English', es: 'Español', fr: 'Français', it: 'Italiano', pt: 'Português', ru: 'Русский', zh: '中文' };
export function auftragErfinden({ kategorie, geschmack = [], zutaten = '', ohneAlkohol = false, sprache = 'de' }) {
  return `Du bist ein erfahrener Mixologe. Erstelle ein kreatives ${kategorie}-Rezept.
Optionale Zutaten: ${String(zutaten || '').trim() || 'keine Vorgabe'}.
Gewünschter Geschmack: ${geschmack.length ? geschmack.join(', ') : 'keine Präferenz'}.${ohneAlkohol ? '\nDas Getränk muss alkoholfrei sein.' : ''}
Schreibe alle Texte auf ${SPRACHE[sprache] || 'Deutsch'}. Mengen mit Einheit (z. B. „2 cl“, „100 ml“, „1 TL“).
Antworte NUR als gültiges JSON-Objekt, kein Text davor/danach:
${SCHEMA}`;
}
export function auftragUeberarbeiten(r, { kategorie, feedback = '', sprache = 'de' }) {
  const zut = (r.ings || []).map((i) => [i.amt, i.unit, i.name].filter(Boolean).join(' ')).join(', ');
  const schr = (r.steps || []).map((s, i) => (i + 1) + '. ' + (s.txt || s)).join(' ');
  const fb = String(feedback || '').trim() || (r.labFeedback || []).slice(-3).join('; ') || 'Kein spezifisches Feedback';
  return `Du bist Mixologe. Verbessere dieses ${kategorie}-Rezept basierend auf dem Nutzer-Feedback.
Original: "${r.name}"
Zutaten: ${zut}
Zubereitung: ${schr}
Bewertungsscore: ${(r.labScore || 0).toFixed(1)}/5
Feedback: ${fb}
Schreibe alle Texte auf ${SPRACHE[sprache] || 'Deutsch'}.
Antworte NUR als JSON:
${SCHEMA}`;
}

/* Antwort der KI lesen. Nimmt den Antworttext (oder die ganze API-Antwort) und gibt ein geprüftes Rezept zurück –
   oder wirft einen Fehler mit Klartext. */
export function antwortLesen(antwort) {
  if (antwort && typeof antwort === 'object') {
    if (antwort.stop_reason === 'refusal') throw new Error('Die KI hat diese Anfrage abgelehnt.');
    if (antwort.stop_reason === 'max_tokens') throw new Error('Die Antwort der KI war zu lang und wurde abgeschnitten.');
    antwort = (antwort.content || []).filter((b) => b && b.type === 'text').map((b) => b.text).join('\n');
  }
  const m = String(antwort || '').match(/\{[\s\S]*\}/);
  if (!m) throw new Error('Die KI hat kein Rezept geschickt.');
  let j; try { j = JSON.parse(m[0]); } catch (e) { throw new Error('Die Antwort der KI war kein gültiges Rezept.'); }
  const titel = String(j.titel || '').trim();
  const zutaten = (Array.isArray(j.zutaten) ? j.zutaten : []).filter((z) => z && String(z.name || '').trim());
  const schritte = (Array.isArray(j.schritte) ? j.schritte : []).map((s) => String(s || '').trim()).filter(Boolean);
  if (!titel || !zutaten.length || !schritte.length) throw new Error('Das Rezept der KI ist unvollständig (Name, Zutaten oder Schritte fehlen).');
  return { ...j, titel, zutaten, schritte };
}

/* Wie `labSave`: ein geprüftes Rezept wird ein Getränk im Labor (experimentell). uid/id vergibt der Aufrufer. */
export function getraenkAusEntwurf(e, { cat, jetzt = Date.now() }) {
  return {
    name: e.titel, cat, alcohol: !!e.alkohol, glass: e.glastyp || '', prepTime: Number(e.zubereitungszeit_min) || 0,
    servings: Number(e.portionen) || 2, difficulty: Number(e.schwierigkeit) || 1, notes: String(e.beschreibung || ''),
    ings: e.zutaten.map((z, i) => { const t = trennen(z.menge); return { id: i, amt: t.amt, unit: t.unit, name: String(z.name).trim(), ck: false, note: '' }; }),
    steps: e.schritte.map((s, i) => ({ id: i, txt: s })), tags: Array.isArray(e.tags) ? e.tags.map(String) : [],
    labStatus: 'experimentell', labRatings: [], labScore: 0, labGen: true, labRevision: 0,
    labLog: [{ ts: jetzt, type: 'status', detail: 'experimentell: von der KI erfunden' }], created: jetzt, modified: jetzt,
  };
}
/* Wie `labAcceptRevision`: der Entwurf ersetzt Name, Zutaten und Schritte; Status „überarbeitet“. */
export function ueberarbeitungAnnehmen(r, jetzt = Date.now()) {
  const d = r.labRevisionDraft; if (!d) return false;
  r.name = d.titel || r.name;
  r.ings = d.zutaten.map((z, i) => { const t = trennen(z.menge); return { id: i, amt: t.amt, unit: t.unit, name: String(z.name).trim(), ck: false, note: '' }; });
  r.steps = d.schritte.map((s, i) => ({ id: i, txt: s }));
  if (d.beschreibung) r.notes = String(d.beschreibung);
  r.labStatus = 'revised'; r.labRevisionDraft = null; r.labRevision = (r.labRevision || 0) + 1; r.labRevisionTs = jetzt; r.modified = jetzt;
  protokoll(r, 'revision', 'Überarbeitung angenommen – neue Version aktiv', jetzt); return true;
}
export function ueberarbeitungAblehnen(r, jetzt = Date.now()) { r.labRevisionDraft = null; protokoll(r, 'revision', 'Überarbeitung abgelehnt', jetzt); }
export function ueberarbeitungBereit(r, entwurf, jetzt = Date.now()) { r.labRevisionDraft = entwurf; r.labRevisionPending = false; protokoll(r, 'revision', 'KI-Entwurf bereit: ' + entwurf.titel, jetzt); }
export function ueberarbeitungFehlgeschlagen(r, fehler, jetzt = Date.now()) { r.labRevisionPending = false; protokoll(r, 'revision', 'Fehler: ' + String(fehler).slice(0, 80), jetzt); }
