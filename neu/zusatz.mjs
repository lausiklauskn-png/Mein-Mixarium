// Mein Mixarium · Zusätze: Stücke, die für sich stehen, damit die Hauptdatei (app.mjs) nicht weiter wächst.
// Prüfung des Bildauftrags · KI-Bilder für alle ohne Bild.
// app.mjs reicht ihre Werkzeuge herein und ruft die Stücke an wenigen, benannten Stellen (such dort nach „ZU.“).
// Die Aktionen hängen sich selbst in TUN; Rückgabe false heißt wie dort: nicht neu zeichnen.
import { pruefeBildAuftrag, sammelBilder, sammelKosten, ohneBild } from '../kern/ki/bild.mjs';
import { kiAnweisungen } from '../kern/pruefung/datei.mjs';
import { text as spText, fuelle } from '../kern/oberflaeche/sprache.mjs';

/** app: { sprache(), esc, I, Z, TUN, SK, W, melde, sichern, zeichne, schluesselFenster(a, danach), bildAusDatei(blob), tresorAuto(grund),
 *         bildAn(uid, img), sichtbare() → die Getränke, die zu sehen sind („Ohne Alkohol“ gilt: nichts Ausgeblendetes geht an eine KI),
 *         warte(fenster, fertig) → ruft fertig, sobald dieses Fenster nicht mehr offen ist } */
export function zusatz(app) {
  const { esc, I, Z, TUN, SK, melde, zeichne } = app;
  const L = (de, en) => spText(app.sprache(), de, en);

  /* ── Eine Wahl mit zwei Antworten; das Kreuz des Fensters heißt „keine von beiden“. Für Funde, bei denen der Mensch entscheidet (raus oder rein). ── */
  function wahl(titel, html, a, b) {
    return new Promise((fertig) => {
      let aus = null;
      const f = { titel, html: `${html}<div class="reihe ende"><button class="knopf hell" data-a="wahl-b">${esc(b)}</button><button class="knopf" data-a="wahl-a">${esc(a)}</button></div>` };
      TUN['wahl-a'] = () => { aus = 'a'; Z.fenster = null; }; TUN['wahl-b'] = () => { aus = 'b'; Z.fenster = null; };
      app.warte(f, () => fertig(aus)); Z.fenster = f; zeichne();
    });
  }
  const stellenHtml = (stellen) => `<ul class="ki-liste rot" data-ki-halt>${stellen.slice(0, 4).map((x) => `<li><mark>${esc(String(x.text || '').slice(0, 160))}</mark></li>`).join('')}</ul>`;

  /* ── Prüfung des Bildauftrags: steht in Name, Zutaten oder Schritten ein Befehl an eine KI, wird die Stelle gezeigt und entschieden. ── */
  /** Zurück: das Getränk, mit dem der Auftrag gebaut wird (wie es ist oder ohne die Stellen), oder null = nicht senden. */
  async function bildFreigabe(r, gratis = false) {
    const p = await pruefeBildAuftrag(r, kiAnweisungen), st = gratis ? p.stellen.filter((x) => x.teil === 'name') : p.stellen;   /* das Gratis-Foto bekommt nur den Namen */
    if (!st.length) return r;
    const w = await wahl(L('Befehl an eine KI im Bildauftrag', 'Instruction to an AI in the picture request'), stellenHtml(st), L('Ohne senden', 'Send without'), L('Mit senden', 'Send with'));
    return w === 'a' ? p.sauber : w === 'b' ? r : null;
  }

  /* ── Sammel-Weg: ein KI-Bild für jedes Getränk ohne Bild. Ein Fenster nennt Anzahl, Kosten und Empfänger; der Lauf ist abbrechbar. ── */
  const offeneBilder = () => ohneBild(app.sichtbare());
  function sammelKnopf() {
    const n = offeneBilder().length;
    return n ? `<button class="chip ki" data-a="sammel-bilder" title="${esc(L('Für jedes Getränk ohne Bild ein KI-Bild erzeugen', 'Create an AI picture for every drink without one'))}">${I('sparkle')}${esc(fuelle(L('KI-Bilder · {0}', 'AI pictures · {0}'), n))}</button>` : '';
  }
  TUN['sammel-bilder'] = () => {
    if (!SK.openai) { app.schluesselFenster('openai', 'sammel-bilder'); return false; }
    const n = offeneBilder().length; if (!n) return;
    Z.fenster = { titel: L('KI-Bilder', 'AI pictures'), html: `<p class="ftext eine" id="sammel-kosten">${esc(sammelKosten(n, app.sprache()))}</p><div class="reihe ende"><button class="knopf hell" data-a="fenster-zu">${L('Abbrechen', 'Cancel')}</button><button class="knopf" data-a="sammel-start">${I('sparkle')}${L('Erzeugen', 'Create')}</button></div>` };
  };
  TUN['sammel-start'] = () => { sammelLauf(); return false; };
  async function sammelLauf() {
    let stopp = false, zeile = '…', anteil = 0;
    /* Das Fenster trägt seinen Stand selbst: zeichnet die App zwischendurch neu, steht dieselbe Zeile wieder da. */
    const bau = () => `<p class="ftext eine" id="sammel-stand" role="status">${esc(zeile)}</p><div class="fortschritt"><i id="sammel-balken" style="width:${anteil}%"></i></div><div class="reihe ende"><button class="knopf hell" data-a="sammel-stopp">${L('Abbrechen', 'Cancel')}</button></div>`;
    const f = { titel: L('KI-Bilder', 'AI pictures'), html: bau() };
    const stand = (t, a) => { zeile = t; anteil = a; f.html = bau(); const el = document.getElementById('sammel-stand'), b = document.getElementById('sammel-balken'); if (el) el.textContent = t; if (b) b.style.width = a + '%'; };
    TUN['sammel-stopp'] = () => { stopp = true; stand(L('Hört nach diesem Bild auf …', 'Stops after this picture …'), anteil); return false; };
    app.warte(f, () => { stopp = true; });   /* Fenster zu = aufhören nach dem laufenden Bild */
    Z.fenster = f; zeichne();
    await app.tresorAuto(L('vor den KI-Bildern', 'before the AI pictures'));
    const e = await sammelBilder(app.sichtbare(), { schluessel: SK.openai, pruefe: kiAnweisungen, art: 'getraenk', abbruch: () => stopp,
      fortschritt: (i, alle, r) => { if (!stopp) stand(fuelle(L('{0} von {1} · {2}', '{0} of {1} · {2}'), i + 1, alle, r.name), Math.round((i / alle) * 100)); },
      je: async (r, roh) => app.bildAn(r.uid, await app.bildAusDatei(await (await fetch(roh)).blob())) });
    if (Z.fenster === f) Z.fenster = null;
    const teile = [e.fertig === 1 ? L('+1 Bild', '+1 picture') : fuelle(L('+{0} Bilder', '+{0} pictures'), e.fertig)];
    if (e.uebersprungen.length) teile.push(fuelle(L('{0} mit Befehl übersprungen', '{0} with instruction skipped'), e.uebersprungen.length));
    if (e.fehler.length) teile.push(fuelle(L('{0} Fehler', '{0} failed'), e.fehler.length));
    if (e.offen) teile.push(fuelle(L('{0} offen', '{0} open'), e.offen));
    /* Ein abgelehnter Schlüssel oder ein Limit beendet den Lauf: dann steht das da, nicht die Zählung. */
    melde(e.grund === 'schluessel' ? L('Der OpenAI-Schlüssel wurde abgelehnt', 'The OpenAI key was rejected') : e.grund === 'limit' ? L('OpenAI meldet: Limit erreicht oder kein Guthaben', 'OpenAI reports: limit reached or no credit') : teile.join(' · '));
  }

  /* Was nach dem Speichern eines Schlüssels von selbst weitergeht (Kennung = Name der Aktion in TUN). */
  const danach = ['sammel-bilder'];
  return { bildFreigabe, sammelKnopf, danach, wahl, stellenHtml };
}
