# Mein-Mixarium
# 🍹 Mein Mixarium

**Dein persönliches Getränke-Labor** — Mocktails, Smoothies & mehr verwalten, teilen und genießen.

Eine Progressive Web App (PWA) für Getränkerezepte mit modernem Design, Offline-Funktionalität und Multi-Plattform-Unterstützung.

---

## ✨ Features

### 📱 Kern-Funktionen
- **Rezepte verwalten** — Erstelle, bearbeite und lösche Getränkerezepte
- **Zutaten-Management** — Vollständige Zutat-Verwaltung mit Mengen und Einheiten
- **Zubereitungsschritte** — Detaillierte Anleitung zum Mischen
- **Bewertungssystem** — Bewerte deine Kreationen mit Sternen
- **Bilder hochladen** — Fotogalerie mit Crop-Funktion für perfekte Drink-Bilder
- **Wochenplaner** — Plane deine Getränke für die Woche
- **Menü-Viewer** — Präsentiere deine Rezepte als Menü
- **Shopping-Liste** — Generiere automatisch Einkaufslisten

### 🎨 Design & Themes
8 verschiedene Farbthemen:
- **Standard** (Teal/Grün) — Klassisch
- **Spring** — Frisches Grün
- **Night** (Dunkel) — Nacht-Modus
- **Modern** — Minimalistisch
- **Colorful** — Bunt & lebendig
- **Pastel** — Weiches Y2K Design
- **Neon** — Gaming-Ästhetik
- **Spektral** — Regenbogen-Farbverlauf

### 🌐 Sprachen
Vollständige Unterstützung für:
- 🇩🇪 Deutsch (de)
- 🇬🇧 Englisch (en)
- 🇷🇺 Russisch (ru)
- 🇨🇳 Chinesisch (zh)
- 🇪🇸 Spanisch (es)
- 🇫🇷 Französisch (fr)
- 🇮🇹 Italienisch (it)
- 🇵🇹 Portugiesisch (pt)

### ♿ Barrierefreiheit
- **Schriftgrößen-Anpassung** — Klein, Normal, Groß, Extra-Groß
- **Hoher Kontrast-Modus** — Für bessere Lesbarkeit
- **Keyboard-Navigation** — Vollständig unterstützt
- **ARIA-Labels** — Für Screen-Reader optimiert

### 📲 PWA Funktionen
- **Installierbar** — Direkt auf dem Home-Screen
- **Offline-Betrieb** — Funktioniert auch ohne Internet
- **App-Manifest** — Native App-ähnliches Erlebnis
- **Service Worker** — Für schnelle Ladevorgänge

---

## 🚀 Installation

### Lokal starten
```bash
# Repository klonen
git clone https://github.com/lausiklauskn-png/Mein-Mixarium.git
cd Mein-Mixarium

# Mit lokalem Server öffnen (z.B. Python)
python -m http.server 8000
# Dann: http://localhost:8000
```

### Auf Mobilgerät installieren
1. **Browser öffnen:** App-URL in Chrome/Firefox aufrufen
2. **Installieren:** "Zum Home-Screen hinzufügen" oder "Installieren"
3. **Nutzen:** Wie eine native App

---

## 📋 App-Struktur

```
Mein-Mixarium/
├── index.html                    # Produktionsversion
├── QC_Mixarium_20_04_26.html    # Entwicklungs-Quellcode
├── manifest.json                # PWA-Manifest
└── README.md                    # Diese Datei
```

### Haupt-Komponenten (HTML)

#### 🎯 Header & Navigation
- **Top Header** — Logo "Mein Mixarium" + Action-Buttons
- **Search Bar** — Suche nach Rezepten
- **Bottom Navigation** — Tabs für: Rezepte | Menü | Ordner | Einstellungen

#### 📖 Recipe Management
```html
<!-- Rezept-Karte -->
<div class="rcard">
  <div class="rcard-img-wrap">
    <img class="rcard-img" src="drink.jpg" />
  </div>
  <div class="rcard-hd">
    <div class="rcard-hd-content">
      <h3 class="rname">Mojito</h3>
      <p class="rmeta">Schwierigkeit: Mittel | Zeit: 5 min</p>
    </div>
  </div>
  <section class="sec">
    <h4 class="slbl">Zutaten</h4>
    <ul class="ing-ul">
      <li class="ing-li">
        <span class="ing-amt">50</span>
        <span class="ing-unit">ml</span>
        <span class="ing-lbl">Rum</span>
      </li>
    </ul>
  </section>
</div>
```

#### 🗓️ Wochenplaner
```html
<div class="wk-day">
  <div class="wk-day-hdr">
    <span class="wk-dn">Montag</span>
    <span class="wk-dt">01.04.2024</span>
  </div>
  <div class="wk-meal">
    <div class="wk-slot filled">
      <span class="wk-slot-course">Getränk</span>
      <span class="wk-slot-name">Mojito</span>
    </div>
  </div>
</div>
```

#### 🍽️ Menü-Viewer
```html
<div class="mv">
  <div class="mv-hdr">
    <h2 class="mv-title">Cocktail Menu</h2>
  </div>
  <div class="mv-body">
    <div class="mv-rcard">
      <h3 class="mv-rname">Mojito</h3>
      <section class="mv-sec">
        <h4 class="mv-slbl">Zutaten</h4>
        <div class="mv-ing">
          <span class="mv-amt">50ml</span>
          <span class="mv-itxt">Rum</span>
        </div>
      </section>
    </div>
  </div>
</div>
```

#### 📸 Image Upload & Crop
```html
<div class="fov">
  <div class="fov-hdr">
    <h2 class="fov-title">Foto hochladen</h2>
  </div>
  <div class="dropzone">
    <div class="dz-ico">📸</div>
    <div class="dz-lbl">Foto hochladen</div>
  </div>
  <div class="crop-prev-wrap">
    <img class="crop-prev-img" />
  </div>
  <div class="crop-zoom-row">
    <input type="range" class="crop-zoom" />
  </div>
</div>
```

#### 🎨 Theme Selector
```html
<div class="theme-grid">
  <div class="theme-chip" data-theme="default">
    <div class="theme-prev">
      <div class="theme-strip" style="background: #0d5c5a;"></div>
      <div class="theme-strip" style="background: #2a8a87;"></div>
    </div>
    <span class="theme-name">Standard</span>
  </div>
  <!-- Weitere Themes... -->
</div>
```

---

## 🎨 CSS Design System

### Farbvariablen (Standard Theme)
```css
:root {
  --sand: #f0f8f7;        /* Helles Beige */
  --sand2: #d4ebe9;       /* Mittleres Beige */
  --parch: #f7fdfc;       /* Sehr helles Weiß */
  --ink: #0a2020;         /* Dunkles Teal */
  --br: #0d5c5a;          /* Primär-Teal */
  --br2: #2a8a87;         /* Sekundär-Teal */
  --br3: #5ab8b4;         /* Tertär-Teal */
  --rust: #2ea87c;        /* Grün (Akzent) */
  --grn: #2d8a4e;         /* Grün (Positiv) */
  --teal: #0d5c5a;        /* Teal (Info) */
  --gold: #c8a020;        /* Gold (Warning) */
}
```

### Layout-System
- **Spacing:** 4px-Grid (--space-1 bis --space-6)
- **Typography:** 11px–36px Skala
- **Border Radius:** 12px standard (--r)
- **Breakpoint:** Max-width 520px (mobile-first)

### Komponenten-Klassen

| Klasse | Zweck |
|--------|-------|
| `.rcard` | Rezept-Karte |
| `.ing-li` | Zutat-Listenelement |
| `.step-li` | Zubereitungsschritt |
| `.wk-slot` | Wochenplaner-Slot |
| `.mv-rcard` | Menü-Rezept-Karte |
| `.sett-row` | Einstellungen-Zeile |
| `.theme-chip` | Theme-Auswahl |
| `.lang-chip` | Sprach-Auswahl |

---

## 📱 Responsive Design

### Breakpoints
```css
/* Mobile (default) */
body { max-width: 520px; }

/* Desktop */
@media (min-width: 560px) {
  html { background: #ddd8d0; }
  body { box-shadow: 0 0 40px rgba(0,0,0,.18); }
}
```

### Touch-Optimierte UI
- Button-Höhe: Mindestens 44px
- Finger-freundliche Abstände
- Lange drücken für zusätzliche Aktionen

---

## 🔧 Entwicklung

### Die Apparat basiert auf:
- **HTML5** — Semantische Struktur
- **CSS3** — Modern mit CSS-Variablen
- **Vanilla JavaScript** — Keine Abhängigkeiten
- **SVG/PNG Icons** — Für alle Geräte

### Dateigrößen (optimiert)
- **index.html** — ~50–80 KB (komplett mit CSS & Icons)
- **Offline-Cache** — Alle Assets lokal verfügbar

### Development Workflow
```bash
# Quelle: QC_Mixarium_20_04_26.html
# Kopie (Produktion): index.html
# Deployment: Direkt über GitHub Pages
```

---

## 📤 Rezept-Freigabe

### QR-Code Sharing
```html
<div class="share-ov">
  <div class="share-box">
    <h3 class="share-box-title">Rezept teilen</h3>
    <div class="share-qr-wrap">
      <svg><!-- QR-Code SVG --></svg>
    </div>
    <button class="share-btn-p">💚 Kopieren</button>
  </div>
</div>
```

### Export-Formate
- Kopieren in Zwischenablage
- QR-Code zum Scannen
- JSON-Export für Backup

---

## 🛠️ Zukünftige Features

- [ ] Cloud-Synchronisierung (Firebase/Supabase)
- [ ] Kollaboratives Menü-Erstellen
- [ ] Nährstoff-Informationen (API)
- [ ] Einkaufslistenint egration
- [ ] Video-Tutorials
- [ ] Community-Rezepte teilen

---

## 📄 Lizenz

MIT License — Frei nutzbar, änderbar und teilbar.

---

## 👨‍💻 Autor

**lausiklauskn-png** — 🇩🇪 Getränke-Enthusiast

---

## 📞 Support

Probleme? [Öffne ein Issue](https://github.com/lausiklauskn-png/Mein-Mixarium/issues)

---

**Viel Spaß beim Mixen! 🍹🎉**
