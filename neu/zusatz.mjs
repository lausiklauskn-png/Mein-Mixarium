// Mein Mixarium · Zusätze: Stücke, die für sich stehen, damit die Hauptdatei (app.mjs) nicht weiter wächst.
// Prüfung des Bildauftrags · KI-Bilder für alle ohne Bild · KI-Richter der Suche · Tresor-Stände der bisherigen App · Getränkebuch.
// app.mjs reicht ihre Werkzeuge herein und ruft die Stücke an wenigen, benannten Stellen (such dort nach „ZU.“).
// Die Aktionen hängen sich selbst in TUN; Rückgabe false heißt wie dort: nicht neu zeichnen.
import { pruefeBildAuftrag, sammelBilder, sammelKosten, ohneBild } from '../kern/ki/bild.mjs';
import { kiAnweisungen } from '../kern/pruefung/datei.mjs';
import { richte, kandidat, richterHinaus, RICHTER_MAX } from '../kern/suche/richter.mjs';
import { leseAltenTresor, alteStaendeInTresor } from '../kern/speicher/alt-tresor.mjs';
import { text as spText, fuelle } from '../kern/oberflaeche/sprache.mjs';
import { katVonRezept, ordnerVonRezept } from '../kern/modell/rezept.mjs';
import { buchInhalt, buchPdf, buchBlaettern, buchGroesse, buchGroesseText } from '../kern/ausgabe/buch.mjs';
import { drucke } from '../kern/ausgabe/druck.mjs';

/** app: { sprache(), esc, I, Z, TUN, SK, W, melde, sichern, zeichne, schluesselFenster(a, danach), bildAusDatei(blob), tresorAuto(grund),
 *         bildAn(uid, img), sichtbare() → die Getränke, die zu sehen sind („Ohne Alkohol“ gilt: nichts Ausgeblendetes geht an eine KI),
 *         warte(fenster, fertig) → ruft fertig, sobald dieses Fenster nicht mehr offen ist,
 *         tr → der Tresor des Kerns, E() → Einstellungen des Geräts, einstSichern(),
 *         sinnTreffer() → Treffer der Sinn-Suche (nur Sichtbares), sicht(r) → Fassung in der Sprache der Oberfläche, katName(r),
 *         buchKats() → [{ id, name }] in der Reihenfolge der Leiste, ordner() → die Ordner, ordTitel(o) } */
export function zusatz(app) {
  const { esc, I, Z, TUN, SK, W, melde, zeichne } = app;
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
      fortschritt: (i, alle, r) => { if (!stopp) stand(fuelle(L('{0} von {1} · {2}', '{0} of {1} · {2}'), i + 1, alle, r.name), Math.round((i / alle) * 100)); app.bildArbeit.start(fuelle(L('KI-Bild {0} von {1}', 'AI picture {0} of {1}'), i + 1, alle), 22); },
      je: async (r, roh) => { app.bildAn(r.uid, await app.bildAusDatei(await (await fetch(roh)).blob())); app.bildArbeit.fertig(); } }).finally(() => setTimeout(() => app.bildArbeit.weg(), 1000));   /* Klaus 26.11.: kreisende Punkte und geschätzte Prozent, auch wenn man die Seite wechselt */
    if (Z.fenster === f) Z.fenster = null;
    const teile = [e.fertig === 1 ? L('+1 Bild', '+1 picture') : fuelle(L('+{0} Bilder', '+{0} pictures'), e.fertig)];
    if (e.uebersprungen.length) teile.push(fuelle(L('{0} mit Befehl übersprungen', '{0} with instruction skipped'), e.uebersprungen.length));
    if (e.fehler.length) teile.push(fuelle(L('{0} Fehler', '{0} failed'), e.fehler.length));
    if (e.offen) teile.push(fuelle(L('{0} offen', '{0} open'), e.offen));
    /* Ein abgelehnter Schlüssel oder ein Limit beendet den Lauf: dann steht das da, nicht die Zählung. */
    melde(e.grund === 'schluessel' ? L('Der OpenAI-Schlüssel wurde abgelehnt', 'The OpenAI key was rejected') : e.grund === 'limit' ? L('OpenAI meldet: Limit erreicht oder kein Guthaben', 'OpenAI reports: limit reached or no credit') : teile.join(' · '));
  }

  /* ── KI-Richter der Suche: die Sinn-Suche schlägt vor, auf Knopfdruck urteilt Claude; Passendes rückt vor, der Rest klappt ein. ── */
  const ri = { fuer: '', urteile: new Map(), laeuft: false };
  /** Der Block „Nach Bedeutung“. sinn: die Treffer in der Reihenfolge der Sinn-Suche; karte(r, i) zeichnet eine Karte. */
  function sinnBlock(sinn, karte) {
    if (!sinn.length) return '';
    const f = Z.suche.trim().toLowerCase(); if (ri.fuer !== f) { ri.fuer = f; ri.urteile = new Map(); }
    const u = (r) => ri.urteile.get(r.uid), da = ri.urteile.size > 0, n = Math.min(sinn.length, RICHTER_MAX), ja = (r) => (u(r) && u(r).passt === true ? 1 : 0);
    const vorn = da ? sinn.filter((r) => !u(r) || u(r).passt !== false) : sinn, hinten = da ? sinn.filter((r) => u(r) && u(r).passt === false) : [];
    if (da) vorn.sort((x, y) => ja(y) - ja(x));   /* was passt, zuerst; was nicht geprüft ist, dahinter */
    const knopf = da ? `<span class="chip ok" id="richter-fertig" title="${esc(L('Von der KI geprüft', 'Checked by the AI'))}">${I('check')}${esc(fuelle(L('{0} passen', '{0} fit'), sinn.filter(ja).length))}</span>`
      : `<button class="chip ki" data-a="richter" title="${esc(richterHinaus(n, app.sprache()))}">${I('sparkle')}${L('KI prüft', 'AI check')}<small>Anthropic · ${n}</small></button>`;
    return `<div class="eh-zeile"><h3 class="eh">${L('Nach Bedeutung', 'By meaning')} <small>${sinn.length}</small></h3>${knopf}</div><div class="karten" id="sinn-treffer">${vorn.map(karte).join('')}</div>`
      + (hinten.length ? `<details class="mehr" id="sinn-rest"><summary>${I('right')}<span>${esc(fuelle(L('Passt weniger · {0}', 'Fits less · {0}'), hinten.length))}</span></summary><div class="karten">${hinten.map(karte).join('')}</div></details>` : '');
  }
  TUN.richter = () => { richterLauf(); return false; };
  async function richterLauf() {
    if (ri.laeuft) return;
    if (!SK.anthropic) { app.schluesselFenster('anthropic', 'richter'); return; }
    const frage = Z.suche.trim(), sinn = app.sinnTreffer(); if (!frage || !sinn.length) return;   /* sinnTreffer(): nur, was zu sehen ist */
    ri.laeuft = true;
    try {
      const e = await W.mit(L('KI prüft die Treffer …', 'AI is checking the hits …'), () => richte(SK.anthropic, frage, sinn.map((r) => kandidat(app.sicht(r), app.katName(r))), { sprache: app.sprache() }));
      if (Z.suche.trim() !== frage) return;   /* es wurde schon weitergetippt */
      if (!e.gefragt) { melde({ 'pruefliste-fehlt': L('Prüfliste fehlt – nichts gesendet', 'Check list missing – nothing sent'), frage: L('Befehl in der Suchfrage – nichts gesendet', 'Instruction in the query – nothing sent') }[e.grund] || L('Nichts zu prüfen', 'Nothing to check')); return; }
      ri.fuer = frage.toLowerCase(); ri.urteile = new Map(e.urteile.map((x) => [x.uid, x]));
      const aus = e.urteile.filter((x) => x.ausgeschlossen).length;
      melde(fuelle(L('{0} von {1} passen', '{0} of {1} fit'), e.urteile.filter((x) => x.passt === true).length, e.urteile.length) + (aus ? ' · ' + fuelle(L('{0} nicht gesendet', '{0} not sent'), aus) : ''));
    } catch (f) { melde(f.message); } finally { ri.laeuft = false; }
  }

  /* ── Tresor-Stände der bisherigen App: einmal lesen und mit Name und alter Zeit in den neuen Tresor legen. Dort wird nur gelesen;
     gibt es ihre Datenbank nicht, entsteht sie beim Nachsehen auch nicht (kern/speicher/alt-tresor.mjs). ── */
  const ALT_TRESOR = { db: 'MeinMxBackup1', schluessel: 'mix9m_bvault', bilder: 'mrz9m_bvi_' };   /* so heißen Datenbank, Liste und Bilder dort (am Code der bisherigen App geprüft) */
  async function altTresor() {
    const E = app.E(); if (E.altTresor) return 0;
    const staende = await leseAltenTresor(ALT_TRESOR); if (!staende.length) return 0;
    const e = await alteStaendeInTresor(app.tr, staende); E.altTresor = true; app.einstSichern();   /* zwei Riegel gegen doppelt: der Merker hier, die alte Kennung am Stand */
    const sag = () => (Z.toast ? setTimeout(sag, 600) : melde(e.dazu === 1 ? L('Tresor: +1 Stand', 'Vault: +1 state') : fuelle(L('Tresor: +{0} Stände', 'Vault: +{0} states'), e.dazu)));   /* eine Meldung, die gerade dasteht, bleibt stehen */
    if (e.dazu) sag();
    return e.dazu;
  }

  /* ── Getränkebuch: alle Getränke, eine Kategorie oder ein Ordner als PDF zum Drucken oder als Datei zum Blättern (kern/ausgabe/buch.mjs).
     Ins Buch kommt nur, was zu sehen ist: steht „Ohne Alkohol“ an, bleibt jedes Getränk mit Alkohol draußen. ── */
  const anzahl = (n) => (n === 1 ? L('1 Getränk', '1 drink') : fuelle(L('{0} Getränke', '{0} drinks'), n));
  /** Die zwei Zeilen für die Einstellungen (Thema „Sichern“: die Getränke kommen aus dem Gerät, auf Papier oder als Datei). z: der Zeilen-Baustein der App. */
  const buchZeilen = (z) => z(I('print'), L('Getränkebuch drucken', 'Print drinks book'), String(app.sichtbare().length), 'data-a="buch" data-art="pdf"') + z(I('book'), L('Buch zum Blättern', 'Book to leaf through'), L('als Datei', 'as a file'), 'data-a="buch" data-art="blaettern"');
  const bw = { titel: 'Mein Mixarium', wahl: '', bilder: true };   /* bleibt stehen, solange die App offen ist; eine leere Auswahl zeichnet das Fenster neu */
  function buchHtml(art) {
    const rs = app.sichtbare(), zahl = new Map(), oz = new Map();
    for (const r of rs) { const k = katVonRezept(r), o = ordnerVonRezept(r, app.ordner()); zahl.set(k, (zahl.get(k) || 0) + 1); if (o) oz.set(o, (oz.get(o) || 0) + 1); }
    const opt = (v, t) => `<option value="${esc(v)}" ${bw.wahl === v ? 'selected' : ''}>${esc(t)}</option>`;
    return `<div class="felder"><input class="feld" id="buch-titel" value="${esc(bw.titel)}" aria-label="${esc(L('Titel', 'Title'))}" autocomplete="off">
      <select class="feld" id="buch-wahl" aria-label="${esc(L('Auswahl', 'Selection'))}">${opt('', L('Alle Getränke', 'All drinks') + ' · ' + rs.length)}${app.buchKats().filter((c) => zahl.get(c.id)).map((c) => opt('k:' + c.id, c.name + ' · ' + zahl.get(c.id))).join('')}${app.ordner().map((o) => opt('o:' + o.id, app.ordTitel(o) + ' · ' + (oz.get(String(o.id)) || 0))).join('')}</select>
      <label class="haken"><input type="checkbox" id="buch-bilder" ${bw.bilder ? 'checked' : ''}> ${L('mit Bildern', 'with pictures')}</label></div>
      <div class="reihe ende"><button class="knopf hell" data-a="fenster-zu">${L('Abbrechen', 'Cancel')}</button><button class="knopf" data-a="buch-los" data-art="${art}">${art === 'pdf' ? I('print') + L('Drucken', 'Print') : I('download') + L('Speichern', 'Save')}</button></div>`;
  }
  TUN.buch = (b) => { const art = b.dataset.art === 'pdf' ? 'pdf' : 'blaettern'; Z.fenster = { titel: art === 'pdf' ? L('Getränkebuch als PDF', 'Drinks book as a PDF') : L('Getränkebuch zum Blättern', 'Drinks book to leaf through'), buch: art, html: buchHtml(art) }; };
  TUN['buch-los'] = (b) => {
    const art = b.dataset.art, f = Z.fenster, w = document.getElementById('buch-wahl').value;
    bw.titel = document.getElementById('buch-titel').value.trim() || 'Mein Mixarium'; bw.wahl = w; bw.bilder = document.getElementById('buch-bilder').checked;
    const rs = app.sichtbare(), opt = { titel: bw.titel, kategorien: app.buchKats(), ordner: app.ordner(), sprache: app.sprache(), mitBildern: bw.bilder, anzahlText: anzahl,
      auswahl: !w ? null : w.startsWith('k:') ? { kat: w.slice(2) } : { ordner: w.slice(2) } };
    if (!buchInhalt(rs, opt).anzahl) { if (f) f.html = buchHtml(art); melde(L('In dieser Auswahl ist kein Getränk', 'No drink in this selection')); return false; }   /* das Fenster bleibt offen, mit der Wahl */
    Z.fenster = null; zeichne(); buchSetzen(art, rs, opt); return false;
  };
  async function buchSetzen(art, rs, opt) {
    try {
      if (art === 'pdf') await W.mit(L('Buch wird gesetzt …', 'Setting the book …'), () => drucke(buchPdf(rs, opt), { sprache: app.sprache() }));
      else { const html = await W.mit(L('Buch wird gesetzt …', 'Setting the book …'), async () => buchBlaettern(rs, opt));
        const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([html], { type: 'text/html' })); a.download = (opt.titel.replace(/[^\p{L}\p{N} _-]+/gu, '').trim().replace(/\s+/g, '-') || 'Getraenkebuch') + '.html'; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 5000);
        melde(fuelle(L('Buch gespeichert · {0}', 'Book saved · {0}'), buchGroesseText(buchGroesse(html), app.sprache()))); }
    } catch (f) { melde(f.message); }
  }

  /* Was nach dem Speichern eines Schlüssels von selbst weitergeht (Kennung = Name der Aktion in TUN). */
  const danach = ['sammel-bilder', 'richter'];
  return { bildFreigabe, sammelKnopf, sinnBlock, altTresor, danach, wahl, stellenHtml, buchZeilen };
}
