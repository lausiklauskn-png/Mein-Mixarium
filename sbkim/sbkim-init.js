// sbkim-init.js — Mixarium Klaus
// Auto-Init Karte 09 § Schritt 4 + 9 + 10 + 11.
// Spore-Generierung manuell via window.__sbkimErzeugeSpore() in DevTools-Konsole.

(async function () {
  try {
    await SbkimStorage.init({ dbSuffix: "mixarium" });

    // Modul 17 Floating-Widget — Endknoten-Standard-Render-Schicht
    // (Karte 09 § Schritt 12). Nach Storage (01) und VOR Spore (02), damit
    // die Proxy-Spans #lamp-fremd + #sbkim-siegel-badge im DOM sind. Sage-
    // Protokol-Quelle: Commit b2cf42ca0708a2f3cc12d0f344a16d28539a765d
    // (2026-05-25). Modul 15 + 16 reaktiviert 2026-05-26 (Phase 1, parallel
    // zu Mein-Rezeptbuch).
    if (window.SbkimWidget) {
      await SbkimWidget.init({
        allowedOrigins: ["https://lausiklauskn-png.github.io"],
        repoUrl:        "https://github.com/lausiklauskn-png/Mein-Mixarium",
      });
      console.info("SBKIM-Widget grün — Floating-Pille bottom-right aktiv.");
    }

    await SbkimMembrane.init({
      allowedOrigins: ["https://lausiklauskn-png.github.io"],
    });
    SbkimSiegel.init({
      badgeSelector: "#sbkim-siegel-badge",
      repoUrl: "https://github.com/lausiklauskn-png/Mein-Mixarium",
    });

    // Modul 18 Tool-PWA Sub (a) Vorab — Andock-Wizard, getriggert durch
    // Bronze-SIEGEL-Klick (Modul 16 Sub e Hook). Nur geladen + bereit,
    // kein automatischer Andock-Trigger. Werte aus sbkim/spore.json.
    if (window.SbkimToolPwa) {
      await SbkimToolPwa.init({
        endpoint:        "https://lausiklauskn-png.github.io/Mein-Mixarium/",
        domain:          "mixarium",
        domainKeywords:  ["Cocktail", "Drink", "Mocktail", "Limonade", "Smoothie", "Aperitif", "Sake"],
        stammCategories: ["Cocktails", "Mocktails", "Alkfr. Cocktails", "Smoothies & Shakes", "Limonaden", "Tees & Kaffees", "Bowlen", "Sirup & Basis"],
        guestCategories: ["Knabbereien", "Fingerfood"],
        repoUrl:         "https://github.com/lausiklauskn-png/Mein-Mixarium",
      });
      console.info("SBKIM-ToolPwa grün — Modul 18 Andock-Wizard bereit.");
    }

    await SbkimAnastomose.init();
    console.info("SBKIM-Init grün — Storage, Spore, Match bereit.");

    await SbkimApoptose.init();
    console.info("SBKIM-Apoptose grün — Vermächtnis-Empfang aktiv.");

    if (window.SbkimHeterokaryose) {
      await SbkimHeterokaryose.init();
      console.info("SBKIM-Heterokaryose grün — Heterokaryose-Empfang aktiv.");
    }

    if (window.SbkimUiDemo) {
      await SbkimUiDemo.init();
      console.info("SBKIM-UiDemo grün — Outbox-API bereit.");
    }

    console.info("SBKIM-Andock bereit. Spore erzeugen mit __sbkimErzeugeSpore() in der DevTools-Konsole.");
  } catch (e) {
    console.error("SBKIM-Init-Fehler:", e);
  }
})();

window.__sbkimErzeugeSpore = async function () {
  console.info("Lade Embedding-Modell (~30 MB einmalig, dann gecacht)...");
  await SbkimEmbedding.init();

  var stammCategories = ["Cocktails", "Mocktails", "Alkfr. Cocktails", "Smoothies & Shakes", "Limonaden", "Tees & Kaffees", "Bowlen", "Sirup & Basis"];
  var guestCategories = ["Knabbereien", "Fingerfood"];
  var domainKeywords = ["Cocktail", "Drink", "Mocktail", "Limonade", "Smoothie", "Aperitif", "Sake"];
  var allText = stammCategories.concat(guestCategories).concat(domainKeywords).join(", ");

  var vec = await SbkimEmbedding.embedPassage(allText);
  console.info("Domain-Vektor erzeugt: " + vec.length + " Floats");

  var spore = await SbkimSpore.generateOwnSpore({
    domain: "lausiklauskn-png.github.io",
    endpoint: "https://lausiklauskn-png.github.io/Mein-Mixarium/",
    nodeType: "hybrid",
    nodeName: "Mixarium Klaus",
    domainDescription: "Klaus Mixarium - Cocktails, Mocktails, Smoothies und mehr; Knabbereien als Begleit-Plus.",
    domainKeywords: domainKeywords,
    domainVector: Array.from(vec),
    stammCategories: stammCategories,
    guestCategories: guestCategories,
  });

  console.info("Spore erzeugt, nodeId =", spore.id);
  console.info("Signatur-Länge =", spore.signature.length);
  console.info("Spore-JSON in DevTools kopieren mit: copy(JSON.stringify(await SbkimSpore.getOwnSpore(), null, 2))");
  return spore;
};

// ============================================================================
// SIEGEL-NEUGESTALTUNG (Bau 2026-06-07) — Host-seitige Injektion
// ----------------------------------------------------------------------------
// Vorlage: Sage-Protokol index.html (injectIdentityLinkIntoSiegel /
// buildSchutzInfoBlock / buildSemantikBlock / sageReSignWithDescription /
// openSchutzModal / closeSchutzModal / watchForSiegelModal). Modul 16 bleibt
// netzweit geteiltes, reines Render-Modul — wir hängen NUR host-seitig drei
// Blöcke in sein Modal (#sbkim-siegel-modal):
//   1. 🔑-Knopf  → öffnet Modul 18 Andock-Wizard (SbkimToolPwa.openAndockTab)
//   2. Schutz-/Vertrauens-Block + „Ausführlich erklärt"-Link → In-Page-Overlay
//      (iframe auf sicherheit.html), KEIN neuer Tab.
//   3. Semantik-Beschreibungs-Textfeld: Text → Modul 03 Embedding (e5-small,
//      384-dim, L2) → domainVector → Modul 02 generateOwnSpore (re-sign mit
//      vorhandenem Schlüssel, gleiche nodeId). Keine neue Krypto.
// Die DevTools-Funktion __sbkimErzeugeSpore() bleibt als Fallback bestehen.
// ============================================================================
(function () {
  "use strict";

  // ---- Netzweit kopierbare CONFIG — nur diese variiert pro Knoten ----------
  var SBKIM_SEMANTIK_CONFIG = {
    domain:          "lausiklauskn-png.github.io",   // wie in der heutigen Spore — unverändert
    endpoint:        "https://lausiklauskn-png.github.io/Mein-Mixarium/",
    nodeType:        "hybrid",
    nodeName:        "Mixarium Klaus",
    domainKeywords:  ["Cocktail", "Drink", "Mocktail", "Limonade", "Smoothie", "Aperitif", "Sake"],
    stammCategories: ["Cocktails", "Mocktails", "Alkfr. Cocktails", "Smoothies & Shakes", "Limonaden", "Tees & Kaffees", "Bowlen", "Sirup & Basis"],
    guestCategories: ["Knabbereien", "Fingerfood"],
    defaultDomainDescription:
      "Klaus' Mixarium ist ein Endknoten im SBKIM-Mycel für Getränke und Drinks — Cocktails und " +
      "Mocktails, alkoholfreie Cocktails, Smoothies & Shakes, Limonaden, Tees & Kaffees, Bowlen " +
      "sowie Sirup- und Basis-Rezepte. Dazu kleine Knabbereien und Fingerfood als Begleit-Plus. Eine " +
      "ruhige, werbefreie Sammlung zum Mixen und Genießen, die sich semantisch mit verwandten Knoten " +
      "wie dem Kochrezept-Knoten Rezeptbuch verbinden lässt.",
    placeholder: "Beschreibe deine App neu oder kopiere die Beschreibung / README hier hinein.",
    hint:
      "Je konkreter, desto besser findet dich das Mycel. Beschreibe in eigenen Worten: was die " +
      "App/Seite ist, wofür man sie nutzt, welche Themen/Stichworte sie abdeckt, für wen sie gedacht " +
      "ist. Ein gut gefüllter Absatz (ca. 3–8 Sätze) ist ideal — gern auch die README hineinkopieren, " +
      "sie beschreibt das Projekt meist am treffendsten. Vermeide reine Schlagwort-Listen ohne Kontext.",
    // Skin (Mixarium-Teal/Mint, passend zum Drink-Labor) — pro Knoten anpassbar.
    skin: { accent: "rgba(56,184,170,0.55)", accentBg: "rgba(56,184,170,0.10)", ink: "#dff5f0" },
  };

  // ---- Kleiner, in sich geschlossener JSON-Download-Helfer -----------------
  function downloadJson(filename, obj) {
    try {
      var blob = new Blob([JSON.stringify(obj, null, 2)], { type: "application/json" });
      var url = URL.createObjectURL(blob);
      var a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      setTimeout(function () {
        try { document.body.removeChild(a); } catch (_e) { /* nb */ }
        try { URL.revokeObjectURL(url); } catch (_e) { /* nb */ }
      }, 0);
    } catch (e) {
      console.warn("[SBKIM] downloadJson fehlgeschlagen:", e);
    }
  }

  // ---- Identitäts-Knopf + Schutz-Block + Semantik-Block ins Siegel-Modal ---
  function injectIdentityLinkIntoSiegel(modal) {
    if (!modal || modal.querySelector("[data-mx-identity-link]")) return;
    var panel = modal.querySelector('[role="dialog"]') || modal.firstElementChild || modal;
    if (!panel) return;

    // (A2) 🔑-Knopf — öffnet Modul 18 Andock-Wizard (In-Page-Modal, kein Tab).
    var link = document.createElement("button");
    link.setAttribute("data-mx-identity-link", "");
    link.type = "button";
    link.textContent = "🔑 Eigene Identität & Spore erzeugen / verwalten →";
    link.style.cssText = "display:block;width:100%;margin:0 0 1rem;padding:0.6rem 0.9rem;background:rgba(255,209,102,0.16);border:1px solid rgba(201,169,97,0.5);border-radius:8px;color:#F5F5FF;font:inherit;font-size:0.86rem;cursor:pointer;text-align:left;";
    link.addEventListener("click", function () {
      // Fail-soft: Modul 18 (Andock-Wizard) öffnen, wenn geladen + bereit.
      var toolPwa = window.SbkimToolPwa;
      if (toolPwa && typeof toolPwa.openAndockTab === "function") {
        try {
          var r = toolPwa.openAndockTab();
          if (r && typeof r.catch === "function") r.catch(function (e) { console.warn("[SBKIM] openAndockTab:", e); });
          return;
        } catch (e) {
          console.warn("[SBKIM] Andock-Wizard konnte nicht starten:", e);
        }
      }
      // Fallback-Hinweis direkt unter dem Knopf (idempotent).
      if (!panel.querySelector("[data-mx-identity-info]")) {
        var info = document.createElement("p");
        info.setAttribute("data-mx-identity-info", "");
        info.textContent = "Andock-Wizard (Modul 18) nicht verfügbar — nutze das Beschreibungs-Feld unten, um Spore neu zu signieren.";
        info.style.cssText = "margin:0.4rem 0 1rem;font-size:0.8rem;color:rgba(245,245,255,0.7);font-style:italic;";
        if (link.nextSibling) link.parentNode.insertBefore(info, link.nextSibling);
        else link.parentNode.appendChild(info);
      }
    });

    // (C) Vertrauens-/Schutz-Block + (B) Semantik-Beschreibungs-Textfeld.
    var schutz = buildSchutzInfoBlock();
    var semantik = buildSemantikBlock();

    // Direkt unter den Bronze-Hinweis / die Datums-Zeile einhängen.
    var anchor = panel.querySelector("[data-siegel-bronze-hinweis]") || panel.querySelector("[data-siegel-date]");
    if (anchor && anchor.parentNode) {
      anchor.parentNode.insertBefore(link, anchor.nextSibling);
      anchor.parentNode.insertBefore(schutz, link.nextSibling);
      anchor.parentNode.insertBefore(semantik, schutz.nextSibling);
    } else {
      panel.appendChild(link);
      panel.appendChild(schutz);
      panel.appendChild(semantik);
    }
  }

  // ---- (C) Schutz-/Vertrauens-Block ----------------------------------------
  function buildSchutzInfoBlock() {
    var wrap = document.createElement("div");
    wrap.setAttribute("data-mx-schutz-block", "");
    wrap.style.cssText = "margin:0 0 1rem;padding:0.7rem 0.9rem;background:rgba(244,196,48,0.07);border:1px solid rgba(244,196,48,0.32);border-radius:8px;";
    var head = document.createElement("div");
    head.textContent = "🛡 Was bedeutet dieses Siegel — und wie bist du geschützt?";
    head.style.cssText = "font-weight:600;font-size:0.84rem;margin:0 0 0.35rem;color:#f4d57a;";
    var body = document.createElement("p");
    body.textContent = "Das Siegel ist selbst-ausgestellt: der Knoten prüft sich beim Start selbst und legt alles offen. Es bewegt nur Daten, nie Programme — und läuft im Browser-Sandkasten. Kurz: prüf mich nach, hier ist alles offen.";
    body.style.cssText = "margin:0 0 0.5rem;font-size:0.8rem;line-height:1.5;color:rgba(245,245,255,0.82);";
    // In-Page-Overlay statt neuem Tab (Tablet-UX). ✕ / Backdrop / Esc schließen.
    var link = document.createElement("button");
    link.type = "button";
    link.setAttribute("data-mx-schutz-open", "");
    link.textContent = "Ausführlich erklärt → So funktioniert das Mycel & wie du geschützt bist";
    link.style.cssText = "display:inline-block;padding:0;background:none;border:none;font:inherit;font-size:0.82rem;color:#f4c430;text-decoration:underline;cursor:pointer;text-align:left;";
    link.addEventListener("click", openSchutzModal);
    wrap.appendChild(head);
    wrap.appendChild(body);
    wrap.appendChild(link);
    return wrap;
  }

  // ---- (D) Erklär-Seite als In-Page-Overlay (iframe auf sicherheit.html) ----
  function openSchutzModal() {
    var existing = document.getElementById("mx-schutz-modal");
    if (existing) { existing.style.display = "grid"; return; }
    var modal = document.createElement("div");
    modal.id = "mx-schutz-modal";
    modal.style.cssText = "position:fixed;inset:0;z-index:100001;display:grid;place-items:center;padding:1.1rem;";
    var backdrop = document.createElement("div");
    backdrop.style.cssText = "position:absolute;inset:0;background:rgba(0,0,0,0.78);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);";
    backdrop.addEventListener("click", closeSchutzModal);
    var card = document.createElement("div");
    card.style.cssText = "position:relative;z-index:1;width:min(820px,96vw);height:min(88vh,100%);background:#070710;border:1px solid rgba(244,196,48,0.32);border-radius:16px;overflow:hidden;box-shadow:0 28px 60px rgba(0,0,0,0.7);display:flex;flex-direction:column;";
    var bar = document.createElement("div");
    bar.style.cssText = "display:flex;justify-content:flex-end;padding:0.45rem;flex:0 0 auto;border-bottom:1px solid rgba(255,255,255,0.08);";
    var close = document.createElement("button");
    close.type = "button";
    close.setAttribute("aria-label", "Schließen");
    close.textContent = "✕";
    close.style.cssText = "width:34px;height:34px;border-radius:50%;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.18);color:#f0f0ff;font-size:1.1rem;line-height:1;cursor:pointer;";
    close.addEventListener("click", closeSchutzModal);
    var frame = document.createElement("iframe");
    frame.src = "sicherheit.html";
    frame.title = "So funktioniert das Mycel & wie du geschützt bist";
    frame.style.cssText = "flex:1 1 auto;width:100%;border:0;background:#070710;";
    bar.appendChild(close);
    card.appendChild(bar);
    card.appendChild(frame);
    modal.appendChild(backdrop);
    modal.appendChild(card);
    document.body.appendChild(modal);
    if (!window.__mxSchutzEsc) {
      window.__mxSchutzEsc = function (e) { if (e.key === "Escape") closeSchutzModal(); };
      document.addEventListener("keydown", window.__mxSchutzEsc);
    }
  }
  function closeSchutzModal() {
    var m = document.getElementById("mx-schutz-modal");
    if (m) m.style.display = "none";
  }

  // ---- (B) Semantik-Beschreibungs-Textfeld ---------------------------------
  function autoGrowSemantik(ta) {
    ta.style.height = "auto";
    ta.style.height = Math.max(ta.scrollHeight, 120) + "px";
  }

  function prefillSemantik(ta) {
    var fallback = SBKIM_SEMANTIK_CONFIG.defaultDomainDescription;
    function apply(v) { if (!ta.value) { ta.value = v || fallback; autoGrowSemantik(ta); } }
    try {
      if (window.SbkimSpore && typeof window.SbkimSpore.getOwnSpore === "function") {
        window.SbkimSpore.getOwnSpore()
          .then(function (sp) { apply(sp && typeof sp.domainDescription === "string" && sp.domainDescription.length ? sp.domainDescription : fallback); })
          .catch(function () { apply(fallback); });
      } else { apply(fallback); }
    } catch (_e) { apply(fallback); }
  }

  function buildSemantikBlock() {
    var C = SBKIM_SEMANTIK_CONFIG;
    var wrap = document.createElement("div");
    wrap.setAttribute("data-mx-semantik-block", "");
    wrap.style.cssText = "margin:0 0 1rem;padding:0.8rem 0.9rem;background:" + C.skin.accentBg + ";border:1px solid " + C.skin.accent + ";border-radius:8px;";

    var label = document.createElement("div");
    label.textContent = "✍ Semantische Beschreibung — macht deinen Domain-Vektor treffender";
    label.style.cssText = "font-weight:600;font-size:0.84rem;margin:0 0 0.5rem;color:" + C.skin.ink + ";";

    var ta = document.createElement("textarea");
    ta.setAttribute("data-mx-semantik-input", "");
    ta.placeholder = C.placeholder;
    ta.rows = 4;
    ta.style.cssText = "width:100%;box-sizing:border-box;min-height:120px;resize:vertical;overflow:hidden;font:inherit;font-size:0.84rem;line-height:1.5;color:" + C.skin.ink + ";background:rgba(0,0,0,0.35);border:1px solid " + C.skin.accent + ";border-radius:6px;padding:0.6rem 0.7rem;";
    ta.addEventListener("input", function () { autoGrowSemantik(ta); });

    var hint = document.createElement("p");
    hint.textContent = C.hint;
    hint.style.cssText = "margin:0.5rem 0 0.7rem;font-size:0.78rem;line-height:1.5;color:rgba(245,245,255,0.7);";

    var btn = document.createElement("button");
    btn.type = "button";
    btn.setAttribute("data-mx-semantik-btn", "");
    btn.textContent = "Beschreibung übernehmen → Vektor & Spore neu signieren";
    btn.style.cssText = "display:block;width:100%;padding:0.55rem 0.9rem;background:" + C.skin.accent + ";border:1px solid " + C.skin.accent + ";border-radius:7px;color:#0c0c1c;font:inherit;font-size:0.84rem;font-weight:600;cursor:pointer;";

    var out = document.createElement("pre");
    out.setAttribute("data-mx-semantik-out", "");
    out.style.cssText = "margin:0.7rem 0 0;white-space:pre-wrap;word-break:break-word;font-family:'Geist Mono',ui-monospace,monospace;font-size:0.76rem;line-height:1.5;color:rgba(245,245,255,0.78);";

    btn.addEventListener("click", function () { mixariumReSignWithDescription(ta.value, out, btn); });

    wrap.appendChild(label);
    wrap.appendChild(ta);
    wrap.appendChild(hint);
    wrap.appendChild(btn);
    wrap.appendChild(out);

    prefillSemantik(ta);
    return wrap;
  }

  // Voller Pfad: Beschreibung → Modul 03 Embedding → domainVector → Modul 02
  // generateOwnSpore (re-sign mit vorhandenem Schlüssel, gleiche nodeId).
  async function mixariumReSignWithDescription(description, outEl, btn) {
    var C = SBKIM_SEMANTIK_CONFIG;
    function set(t) { outEl.textContent = t; }
    description = (description || "").trim();
    if (description.length < 12) {
      set("Bitte eine etwas ausführlichere Beschreibung eingeben (mindestens ein Satz).");
      return;
    }
    if (!window.SbkimEmbedding || !window.SbkimSpore) {
      set("Module 02/03 (SbkimSpore/SbkimEmbedding) nicht geladen — Sichttest-Setup prüfen.");
      return;
    }
    btn.disabled = true;
    var onProg = function (ev) {
      var d = ev && ev.detail;
      if (!d) return;
      if (d.status === "progress" && typeof d.progress === "number" && isFinite(d.progress)) {
        var pct = Math.max(0, Math.min(100, Math.round(d.progress)));
        var file = d.file ? String(d.file).split("/").pop() : "Modell";
        var bar = "█".repeat(Math.round(pct / 5)) + "░".repeat(20 - Math.round(pct / 5));
        set("Embedding-Modell lädt … " + bar + " " + pct + " %  (" + file + ", ~30 MB einmalig)");
      }
    };
    window.addEventListener("sbkim:embedding-progress", onProg);
    try {
      set("Stelle Identität sicher (vorhandener Schlüssel → gleiche nodeId) …");
      await window.SbkimSpore.getOrCreateIdentity();
      set("Lade Modul 03 (Embedding-Modell, ~30 MB einmalig) …");
      await window.SbkimEmbedding.init();
      set("Erzeuge Domain-Vektor (384 floats) aus deiner Beschreibung …");
      var vec = await window.SbkimEmbedding.embedPassage(description);
      var arr = Array.from(vec);
      var l2 = Math.sqrt(arr.reduce(function (a, x) { return a + x * x; }, 0));
      set("Signiere Spore mit neuem Domain-Vektor …");
      var spore = await window.SbkimSpore.generateOwnSpore({
        domain:            C.domain,
        endpoint:          C.endpoint,
        nodeType:          C.nodeType,
        nodeName:          C.nodeName,
        domainDescription: description,
        domainKeywords:    C.domainKeywords,
        domainVector:      arr,
        stammCategories:   C.stammCategories,
        guestCategories:   C.guestCategories,
      });
      window.removeEventListener("sbkim:embedding-progress", onProg);
      downloadJson("spore.json", spore);
      set("✔ Spore neu signiert + heruntergeladen — nodeId " + spore.id + " (unverändert), Vektor 384-dim, L2=" + l2.toFixed(4) + ". Committe sie nach sbkim/spore.json.");
      btn.disabled = false;
    } catch (err) {
      window.removeEventListener("sbkim:embedding-progress", onProg);
      set("Fehler: " + (err && err.message ? err.message : err));
      btn.disabled = false;
    }
  }

  // ---- Modal-Beobachter: injizieren, sobald Modul 16 sein Modal anhängt -----
  function watchForSiegelModal() {
    var existing = document.getElementById("sbkim-siegel-modal");
    if (existing) injectIdentityLinkIntoSiegel(existing);
    if (typeof MutationObserver !== "function" || !document.body) return;
    try {
      var obs = new MutationObserver(function (mutations) {
        for (var i = 0; i < mutations.length; i++) {
          var added = mutations[i].addedNodes;
          for (var j = 0; j < added.length; j++) {
            var node = added[j];
            if (!node || node.nodeType !== 1) continue;
            if (node.id === "sbkim-siegel-modal") injectIdentityLinkIntoSiegel(node);
            else if (node.querySelector) {
              var inner = node.querySelector("#sbkim-siegel-modal");
              if (inner) injectIdentityLinkIntoSiegel(inner);
            }
          }
        }
      });
      obs.observe(document.body, { childList: true, subtree: true });
    } catch (_e) { /* fail-soft */ }
  }
  if (document.body) watchForSiegelModal();
  else document.addEventListener("DOMContentLoaded", watchForSiegelModal);
})();
