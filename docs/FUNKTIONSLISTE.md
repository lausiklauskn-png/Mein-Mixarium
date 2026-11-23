# Funktionsliste Mein Mixarium (Bestand v9.5)

Erhoben am 23.11.2026 aus `QC_Mixarium_20_04_26.html` (main `ddf402e`, 16541 Zeilen), maschinell mit `tools/funktionsliste.mjs`.
Spalte **Ziel**: *Kern* = kommt aus dem Küchen-Kern von Mein Rezeptbuch (byte-gleich, Pin) · *nur Mixarium* = Getränke-Schicht in diesem Repo · *entfällt* = nicht in der neuen Fassung.
Spalte **Probe**: vorhandene Probe unter `tests/`, die eine Funktion des Abschnitts beim Namen nennt.
Abgleich mit der Funktionsliste von Sitzung A: **offen** – sie liegt noch nicht im Repo Mein-Rezeptbuch (geprüft 23.11., alle Zweige).

## Übersicht

| Abschnitt | ab Zeile | Funktionen | Ziel | Hinweis | Probe |
|---|---:|---:|---|---|---|
| (vor den Abschnitten: Kopf, Stil, frühe Helfer) | 1 | 5 | Kern |  | – |
| TRANSLATIONS | 4188 | 14 | Kern | Übersetzung (8 Sprachen); Getränke-Wörter in der Getränke-Schicht | – |
| STATIC DATA | 5736 | 30 | nur Mixarium | Kategorien, Gläser, Temperaturen, eigene Kategorie-Namen | gegenprobe_kategorien, smoke_kategorien, smoke_herkunft, gegenprobe_herkunft, smoke_doppelte_namen |
| INDEXEDDB BACKUP LAYER | 6153 | 37 | Kern + Übernahme | Sicherung; Übernahme aus MeinMxBackup1 ist Getränke-Schicht | gegenprobe_kamera_bild, smoke_kamera_bild, smoke_ki_bild, smoke_reinigung, gegenprobe_reinigung |
| BOOT PROGRESS | 6602 | 5 | entfällt | Intro nur beim ersten Start, überspringbar | – |
| BOOT / SEED | 6640 | 4 | Kern + nur Mixarium | Start im Kern; Beispiel-Getränke (ohne Alkohol) hier | – |
| LANGUAGE | 6849 | 6 | Kern |  | gegenprobe_zugangscode_erklaerung, smoke_ki_bild, smoke_zugangscode_erklaerung |
| THEME | 6950 | 2 | Kern (geändert) | 8 Themen → eine Palette hell/dunkel | – |
| PWA | 6969 | 6 | Kern |  | – |
| TOAST | 7032 | 1 | Kern |  | gegenprobe_ki_bild, smoke_kamera_bild |
| SCREENS | 7042 | 6 | Kern |  | smoke_bildausschnitt, smoke_kategorien, smoke_schluessel_loeschen |
| KI-LABOR (Mix-Labor) — Getränke erfinden & bewerten | 7110 | 44 | nur Mixarium | Mix-Labor, Bewertung, TheCocktailDB-Entdecken (Netz auf Knopfdruck) | – |
| ALKOHOL-TOGGLE (systemweit, Privacy-First) | 8050 | 6 | nur Mixarium | Schalter „ohne Alkohol“ (mxNoAlc9) | smoke_kategorien |
| SEARCH | 8112 | 17 | Kern | Suche, Bedeutungssuche | smoke_a5_suchfeld_multiquery |
| OVERLAYS | 8279 | 3 | Kern |  | – |
| KI-BILD (DALL·E 3) — Foto für ein Getränk erzeugen | 8314 | 43 | Kern | KI-Aufruf mit eigenem Schlüssel; Bild-Auftrag für Getränke hier | smoke_schluessel_loeschen, gegenprobe_ki_bild, smoke_reinigung, smoke_ki_bild, smoke_zugangscode_erklaerung |
| IMAGE IMPORT | 8935 | 3 | Kern |  | – |
| DRAG & DROP — Karten, Zutaten, Schritte | 8995 | 32 | Kern |  | gegenprobe_kategorien, smoke_kategorien |
| AI SCAN | 9318 | 28 | Kern + nur Mixarium | Foto-Import im Kern; Getränke-Prompt hier | smoke_reinigung, smoke_schluessel_loeschen, smoke_zugangscode_erklaerung, gegenprobe_zugangscode_erklaerung, gegenprobe_kamera_bild, smoke_kamera_bild |
| REZEPT TEILEN (QR-Code + Web Share) | 9761 | 14 | Kern |  | smoke_reinigung |
| JSON EXPORT/IMPORT | 10028 | 12 | Kern + Übernahme | Format version 10, Übernahme alter Sicherungen | smoke_herkunft |
| COVER HELPERS | 10177 | 2 | Kern | Bücher | – |
| PDF BOOK EXPORT | 10196 | 4 | Kern | Bücher | – |
| FLIPBOOK EXPORT | 10318 | 6 | Kern | Bücher | – |
| CAT NAV | 10466 | 2 | Kern + nur Mixarium | Kategorie-Mechanik im Kern, Getränke-Kategorien hier | gegenprobe_kategorien, smoke_kategorien |
| BADGE | 10531 | 1 | Kern |  | gegenprobe_kategorien, smoke_kategorien |
| MENU SCREEN | 10553 | 21 | Kern | Planer (Mein Menü / Wochenplan) | – |
| COURSE SHEET | 10749 | 9 | nur Mixarium | Gänge → Gläser | – |
| MENU VIEWER | 10811 | 11 | Kern | Menü-Ansicht, Einkaufsliste | smoke_doppelte_namen |
| PRINT | 11048 | 2 | Kern |  | – |
| FOLDERS | 11290 | 25 | Kern |  | gegenprobe_kategorien, smoke_kategorien |
| NEW RECIPE | 11830 | 6 | Kern |  | smoke_kategorien |
| BILD-AUSSCHNITT ANPASSEN (Crop) | 11892 | 15 | Kern |  | smoke_bildausschnitt |
| NOTES | 12016 | 3 | Kern |  | – |
| SERVING SIZE SCALING | 12029 | 6 | Kern + nur Mixarium | Skalieren im Kern; ml/cl/Spritzer/Barlöffel hier | smoke_doppelte_namen |
| RENDER | 12112 | 3 | Kern + nur Mixarium | Karte im Kern; Glas/Temperatur/Alkohol-Marke hier | gegenprobe_kategorien, smoke_bildausschnitt, smoke_kategorien, smoke_ki_bild, smoke_reinigung |
| ACTIONS | 12412 | 41 | Kern |  | gegenprobe_kategorien |
| INIT | 12991 | 44 | Kern | Wischen, Zurück-Taste, KI-Panel, Barrierefreiheit, Text-Import | smoke_reinigung, gegenprobe_reinigung |
| WEB RECIPE IMPORT – Rezept aus dem Internet laden | 13897 | 29 | Kern (geändert) | ohne öffentliche Weiterleiter | smoke_doppelte_namen, smoke_web_import |
| JSON SANITIZER — fixes unescaped control chars and quotes in AI responses | 14378 | 2 | Kern |  | – |
| TRANSLATION ENGINE | 14449 | 16 | Kern |  | – |
| BACKUP VAULT – Mehrere Sicherungen verwalten | 14857 | 15 | Kern |  | – |
| HANDBUCH / MANUAL | 15156 | 50 | Kern + nur Mixarium | Hilfe-Gerüst im Kern, Getränke-Texte hier | smoke_kategorien, smoke_wortkarte, gegenprobe_reinigung |

**Summe: 631 Funktionsdefinitionen.**

## Außerhalb der Seite

| Teil | Ziel | Hinweis |
|---|---|---|
| `sbkim/` (SBKIM/Mycel, 41 Dateien, u. a. `23_rendezvous_ui.js`) | **nicht in die Store-Fassung** | bleibt in der Web-Fassung bis Klaus entscheidet |
| `assets/` (Reinigung, Prüfer) | Kern | Reinigung vor der KI, Prüfung auf Knopfdruck |
| `app-sw.js` | Kern | Offline-Speicher |
| `gift*.html`, `invite-v5.html`, `impressum.html` | nur Mixarium | eigenständige Seiten, unverändert |
| `mr-*.html` | – | Fremdkörper aus Muttis Rezeptbuch, nicht anfassen |
| TheCocktailDB (Entdecken) | nur Mixarium | Netz nur auf Knopfdruck |
| Web-Import über allorigins/codetabs | **entfällt** | in der App direkt laden (Capacitor-HTTP) |

## Speicher (Übernahme in der Getränke-Schicht)

`mix9m` (Getränke), `mxfd9m` (Ordner), `mxms9m` (Menüplan), `mxNoAlc9` (ohne Alkohol), `mxcats9m`/`mxcatsneu9m`/`mxcatsaus9m`/`mxcatord9m` (Kategorien), `mxlang9m`, `mxtheme9m`, `mxknoten9m`, Schlüssel `mxkey9m`/`mxmistralkey9m` (werden **nicht** übernommen, nur hingewiesen), IndexedDB `MeinMxBackup1`. Gelesen wird nur, nichts gelöscht.

## Getränke-Felder am Rezept (Bestand)

`id uid name cat folder ings steps img imgCrop servings prepTime flavors glass rating translations herkunft dbId kiEntfernt` sowie Labor-Felder `labGen labStatus labScore labRatings labLog labFavorite labRevision*`. Alkohol: Kategorie-Marke `alcohol:true` (Cocktails) plus Zutaten-Erkennung.

## Einzelne Funktionen je Abschnitt

### (vor den Abschnitten: Kopf, Stil, frühe Helfer) (ab Zeile 1) – Kern

`hole` · `erudaBtn` · `setBtn` · `attempt` · `cornerTap`

### TRANSLATIONS (ab Zeile 4188) – Kern

`ersteSprache` · `T` · `rTr` · `rName` · `rAmt` · `rUnit` · `_normUnit` · `_unitKind` · `unitsMatchSystem` · `convertAmtUnitLocal` · `currentUnitSystem` · `_countDrinksMissingTransl` · `bulkTranslateForLang` · `offerBulkTranslate`

### STATIC DATA (ab Zeile 5736) – nur Mixarium

`ladeCatsEigen` · `svCatsEigen` · `ladeCatsNeu` · `svCatsNeu` · `ladeCatsOrd` · `svCatsOrd` · `katAnzahl` · `katBeschriftung` · `katSymbol` · `ordnerVonRezept` · `katVonRezept` · `_knotenKennung` · `_neueUid` · `_uidSichern` · `_herkunftStempeln` · `_herkunftVereinen` · `_ohneZuhause` · `_zusammenfuehren` · `katFamilie` · `catsFremd` · `catsAlle` · `katUmsortieren` · `catName` · `catCol` · `catIco` · `courseName` · `glassName` · `tempName` · `themeName` · `h`

### INDEXEDDB BACKUP LAYER (ab Zeile 6153) – Kern + Übernahme

`_idbOpen` · `_idbSet` · `_idbGet` · `resizeImage` · `_b64Bytes` · `_bildUeberImage` · `_bildDekodieren` · `_aufKante` · `_bildAufDeckel` · `bildFuersNetz` · `scanBildAufbereiten` · `KT` · `_kiSkript` · `reinigungLaden` · `pdfjsLaden` · `_bytesAus` · `_kiSeiteJpeg` · `pdfFuersNetz` · `kiReiniger` · `halt` · `_kiOv` · `kiHaltDialog` · `kiVermerken` · `kiEntferntHtml` · `pdfSicherSenden` · `ocrSeiten` · `pruefKernRB` · `scanDateiPruefen` · `bildAuftragFreigabe` · `_pushUndo` · `undoRec` · `sv` · `svM` · `svFD` · `_fmtSnapTs` · `_showRestoreDialog` · `_showIosExportReminder`

### BOOT PROGRESS (ab Zeile 6602) – entfällt

`_bootProg` · `_splashClose` · `_tryFinishSplash` · `_introInit` · `_bootDone`

### BOOT / SEED (ab Zeile 6640) – Kern + nur Mixarium

`boot` · `playOpeningAnimation` · `mxAniSkip` · `maybeShowOpeningAnimation`

### LANGUAGE (ab Zeile 6849) – Kern

`applyLang` · `openLang` · `closeLang` · `renderLangChips` · `renderLangGrid` · `selectLang`

### THEME (ab Zeile 6950) – Kern (geändert)

`setTheme` · `renderThemeGrid`

### PWA (ab Zeile 6969) – Kern

`pwaLaeuftAlsApp` · `pwaIstIos` · `pwaKopfRefresh` · `pwaKopf` · `pwaRefresh` · `triggerPWA`

### TOAST (ab Zeile 7032) – Kern

`toast`

### SCREENS (ab Zeile 7042) – Kern

`showSc` · `navTo` · `carouselInit` · `carouselShow` · `carouselNext` · `carouselPrev`

### KI-LABOR (Mix-Labor) — Getränke erfinden & bewerten (ab Zeile 7110) – nur Mixarium

`labInfoToggle` · `labInit` · `labSetCat` · `labToggleTaste` · `labGenerate` · `labShowResult` · `labSave` · `discoverToggle` · `_discoverInitCats` · `discoverSetCat` · `discoverSearch` · `discoverRandom` · `_discoverFetch` · `_discoverLoading` · `_discoverErr` · `_discoverCatFor` · `_discoverShow` · `discoverRemove` · `_disTrIngredient` · `_disTrUnit` · `discoverPreview` · `discoverModalClose` · `discoverConfirmImport` · `_disTrAIBackground` · `labAddLog` · `labSoloActive` · `labToggleSolo` · `_labUpdateSoloUI` · `_labCalcScore` · `_labApplyStatusLogic` · `labRate` · `labUpdateSlider` · `labCloseRate` · `labSubmitRate` · `labRevise` · `labAcceptRevision` · `labRejectRevision` · `labToggleFavorite` · `labRenderPool` · `labAccept` · `labRemove` · `labToggleRemoved` · `labRenderRemoved` · `labRestore`

### ALKOHOL-TOGGLE (systemweit, Privacy-First) (ab Zeile 8050) – nur Mixarium

`getAlcFilter` · `setAlcFilter` · `toggleAlcFilter` · `_applyAlcToggleUI` · `alcAllowed` · `updateSettings`

### SEARCH (ab Zeile 8112) – Kern

`semSig` · `semEnsureCorpus` · `semSetStatus` · `semReady` · `judgeCreds` · `semPrepare` · `semSchedule` · `semRun` · `semBtnBusy` · `updateSemBtn` · `toggleSem` · `updateJudgeBtn` · `toggleJudge` · `doSearch` · `clearSearch` · `wordMatchSQ` · `matchSQ`

### OVERLAYS (ab Zeile 8279) – Kern

`openApiKeyOv` · `closeApiKeyOv` · `renderApiKeyOv`

### KI-BILD (DALL·E 3) — Foto für ein Getränk erzeugen (ab Zeile 8314) – Kern

`_runImgQueue` · `keyWert` · `keyMaske` · `keyAltZeilen` · `schluesselLoeschen` · `getOpenAiImgKey` · `saveOpenAiImgKey` · `_buildDallePrompt` · `_einBildVersuch` · `_dalleGenImg` · `_igEligible` · `updateImgGenInfo` · `onImgReplaceToggle` · `_igrRow` · `_igrMiniBtn` · `_renderIgrPanel` · `igrOnChange` · `igrCatAll` · `igrAllRecipes` · `stopImgGen` · `startImgGen` · `_imgFehlerText` · `pruefeImgSchluessel` · `_meldeSchluesselPruefung` · `zeigeWarumEigenerSchluessel` · `toggleImgKeyField` · `onImgKeySettInput` · `saveImgKeyFromSettings` · `openImgGenForRecipe` · `startImgGenSingle` · `downloadImg` · `onImgGenKeyInput` · `pasteImgGenKey` · `_openAiKeyOk` · `saveAndActivateImgGen` · `switchToImgGenMain` · `showImgGenSetup` · `initImgGenPane` · `openImport` · `closeImport` · `openExport` · `closeExport` · `switchFovTab`

### IMAGE IMPORT (ab Zeile 8935) – Kern

`handleImgSel` · `renderPendImgs` · `assignAllImgs`

### DRAG & DROP — Karten, Zutaten, Schritte (ab Zeile 8995) – Kern

`_startAutoScroll` · `step` · `_stopAutoScroll` · `fldRecDragStart` · `fldRecDragEnd` · `katZiehMarkenWeg` · `katZiehStart` · `katZiehEnde` · `pillDragOver` · `pillDragLeave` · `pillDrop` · `fldGrpDragOver` · `fldGrpDragLeave` · `setzeOrdner` · `fldGrpDrop` · `ingDragStart` · `ingDragOver` · `ingDragLeave` · `ingDrop` · `stepDragStart` · `stepDragOver` · `stepDragLeave` · `stepDrop` · `wkSlotDragStart` · `wkSlotDragEnd` · `wkSlotDragOver` · `wkSlotDragLeave` · `wkSlotDrop` · `wkMealDragOver` · `wkMealDragLeave` · `wkMealDrop` · `wkMealToggle`

### AI SCAN (ab Zeile 9318) – Kern + nur Mixarium

`_claudeApiUrl` · `_claudeHeaders` · `validateApiKey` · `selectScanModel` · `getSavedKey` · `getScanProvider` · `setScanProvider` · `getMistralKey` · `onMistralKeyInput` · `saveMistralKey` · `toggleMistralKeyField` · `onApiKeyInput` · `pasteFromClipboard` · `markStep1` · `saveAndStartScan` · `saveApiKey` · `showKeySetup` · `switchToScanMain` · `initScanPane` · `loadScanFile` · `handleScanFile` · `runBatchScan` · `updBar` · `batchScanDone` · `handleScanDrop` · `resetScan` · `triggerScan` · `setScanSt`

### REZEPT TEILEN (QR-Code + Web Share) (ab Zeile 9761) – Kern

`_b64enc` · `_b64dec` · `_compressB64` · `_decompressB64` · `shareRecipeQR` · `showNutrition` · `_estimateNutrition` · `_showShareModal` · `_doWebShare` · `_copyShareLink` · `_checkShareUrl` · `_importPendingShare` · `renderScanResult` · `acceptScan`

### JSON EXPORT/IMPORT (ab Zeile 10028) – Kern + Übernahme

`_collapseAll` · `exportData` · `_normalizeRecs` · `_showImportChoiceDialog` · `importData` · `setUpSt` · `checkAppUpdate` · `dlBlob` · `toggleDonate` · `closeDonate` · `_resetDonateTimer` · `clearAll`

### COVER HELPERS (ab Zeile 10177) – Kern

`getCoverImgs` · `coverGridHtml`

### PDF BOOK EXPORT (ab Zeile 10196) – Kern

`exportPDF` · `pdfIngRows` · `pdfSteps` · `pdfRecipePage`

### FLIPBOOK EXPORT (ab Zeile 10318) – Kern

`exportFlipbook` · `makeRecipePg` · `sh` · `np` · `pp` · `gp`

### CAT NAV (ab Zeile 10466) – Kern + nur Mixarium

`renderCatNav` · `setCAT`

### BADGE (ab Zeile 10531) – Kern

`badge`

### MENU SCREEN (ab Zeile 10553) – Kern

`renderMenu` · `wkShift` · `getWkDates` · `fmtDate` · `fmtWkRange` · `renderWeek` · `addMenuSlot` · `addDaySlot` · `addDayMealSlot` · `openAsl` · `applyAslLang` · `closeAsl` · `aslBack` · `aslSelMeal` · `aslSelCourse` · `aslConfirmOther` · `rmSlot` · `removeFromMenu` · `extractPrepTime` · `fmtPrepTime` · `savePrepTime`

### COURSE SHEET (ab Zeile 10749) – nur Mixarium

`openCSheet` · `openCSheetForSlot` · `renderCGrid` · `selCourse` · `closeCSheet` · `confirmCourse` · `showRecipePicker` · `assignR` · `goToRecipe`

### MENU VIEWER (ab Zeile 10811) – Kern

`openMV` · `closeMV` · `switchMVTab` · `buildMV` · `togI` · `rstI` · `togS` · `togAL` · `rstAL` · `parseAmt` · `fmtAmt`

### PRINT (ab Zeile 11048) – Kern

`printRecipe` · `doPrint`

### FOLDERS (ab Zeile 11290) – Kern

`openFolderSheet` · `katEmojiRaster` · `katEmojiOeffnen` · `katEmojiSchliessen` · `katEmojiWaehlen` · `openKatUmbenennen` · `katEingabenUebernehmen` · `katAnlegen` · `katNeuAnlegen` · `katAufloesen` · `katAuflBestaetigen` · `katWegNehmen` · `katZuPop` · `schliess` · `katZuNeuFeld` · `katZuNeuAnlegen` · `katZuSetzen` · `katZuruecksetzen` · `katSpeichern` · `closeFolderSheet` · `saveFolder` · `renderFolders` · `deleteFolder` · `tglFld` · `tglAllFld`

### NEW RECIPE (ab Zeile 11830) – Kern

`openNewPanel` · `toggleNewPanel` · `ensureFolderBlanks` · `closeNewPanel` · `createRecipe` · `pickImgForCard`

### BILD-AUSSCHNITT ANPASSEN (Crop) (ab Zeile 11892) – Kern

`openCropOv` · `cropAnSicht` · `cropAnSichtAn` · `cropAnSichtAus` · `_cropFormAnpassen` · `closeCropOv` · `saveCropOv` · `resetCropOv` · `setCropPos` · `setCropZoom` · `_cropApplyPos` · `_cropInitDrag` · `_cropMouseMove` · `_cropMouseUp` · `_cropMoveDelta`

### NOTES (ab Zeile 12016) – Kern

`openNote` · `cancelNote` · `saveNote`

### SERVING SIZE SCALING (ab Zeile 12029) – Kern + nur Mixarium

`parseAmt` · `fmtNum` · `scaleAmt` · `setServ` · `setBaseServ` · `applyCustomServ`

### RENDER (ab Zeile 12112) – Kern + nur Mixarium

`render` · `rndDiv` · `rndCard`

### ACTIONS (ab Zeile 12412) – Kern

`delRecipe` · `togCard` · `addFl` · `delFl` · `addIng` · `delIng` · `togIng` · `togIngLocal` · `rstCk` · `addStep` · `delStep` · `openIngEdit` · `saveIngEdit` · `cancelIngEdit` · `openStepEdit` · `saveStepEdit` · `cancelStepEdit` · `setupWkTouchDrag` · `setupTouchDrag` · `_katHdlStart` · `_katHdlCheck` · `_katHdlDrag` · `_katHdlEnd` · `_tddRowStart` · `_tddRowMove` · `_tddRowEnd` · `_sliRowStart` · `_sliRowCheck` · `_sliRowDrag` · `_sliRowEnd` · `_fldHdlStart` · `_fldHdlCheck` · `_fldHdlDrag` · `_fldHdlEnd` · `_tddStart` · `_tddMove` · `_tddEnd` · `setStars` · `saveRat` · `addImp` · `delImp`

### INIT (ab Zeile 12991) – Kern

`doImportSwipe` · `anyModalOpen` · `_doSwipe` · `_vis` · `_doBack` · `openAiPanel` · `closeAiPanel` · `applyAipLang` · `aipChgP` · `buildAipPrompt` · `aipSetSrc` · `aipSetDayRange` · `aipInitDaySelects` · `aipCopy` · `aipImport` · `editWkSlot` · `applyA11y` · `setA11ySize` · `setA11yContrast` · `setTipsShow` · `checkAppRating` · `openAppRate` · `closeAppRate` · `submitAppRate` · `openInlineEdit` · `startRename` · `saveInlineName` · `cancelInlineEdit` · `spellCheckCard` · `renderSpellModal` · `acceptSpell` · `closeSpellModal` · `initTxtPane` · `onTxtApiKeyInput` · `pasteTxtKey` · `saveTxtKey` · `resetTxtKey` · `handleTxtDrop` · `extractPdfText` · `_txtUpdateUI` · `resetTxtImport` · `setTxtSt` · `analyzeTxtImport` · `renderTxtResult`

### WEB RECIPE IMPORT – Rezept aus dem Internet laden (ab Zeile 13897) – Kern (geändert)

`_webFetch` · `_parseJsonLdRecipe` · `_parseIngStr` · `_parseInstr` · `proc` · `_bildAusSchema` · `_bildAusSeite` · `_webBildHolen` · `_bildLaedt` · `_ergiebigkeit` · `_katRaten` · `_schemaToRec` · `_htmlToText` · `_aiExtractWeb` · `_webBildAnhaengen` · `_webSetSt` · `_webKatGueltig` · `_webRenderResult` · `fetchWebRecipe` · `acceptWebImport` · `resetWebImport` · `acceptTxtImport` · `resetFullWeek` · `resetCurrentWeek` · `resetDay` · `resetSelectedDay` · `updateDayResetSelect` · `saveAndStartTxt` · `showTxtKeySetup`

### JSON SANITIZER — fixes unescaped control chars and quotes in AI responses (ab Zeile 14378) – Kern

`cleanJSON` · `repairJSON`

### TRANSLATION ENGINE (ab Zeile 14449) – Kern

`getKey` · `openTransl` · `restoreTranslPanels` · `renderTranslPanel` · `toggleTranslLang` · `runTransl` · `renderTranslResult` · `saveTranslToRecipe` · `delTransl` · `openScanTransl` · `renderScanTranslPanel` · `toggleScanLang` · `runScanTransl` · `getTip` · `show` · `hide`

### BACKUP VAULT – Mehrere Sicherungen verwalten (ab Zeile 14857) – Kern

`_bvRead` · `_bvWrite` · `_stripImgs` · `_extractImgs` · `_bvImgsSave` · `_bvImgsLoad` · `_bvImgsDel` · `_autoSnapshot` · `saveManualBackup` · `loadFromVault` · `deleteFromVault` · `importJsonFromVault` · `exportFromVault` · `_renderVault` · `_bvRow`

### HANDBUCH / MANUAL (ab Zeile 15156) – Kern + nur Mixarium

`openManual` · `closeManual` · `toggleSettingsManual` · `toggleScanFaq` · `openApiKeyHelp` · `renderManualInline` · `settManScrollTo` · `renderManual` · `toggleManSec` · `manScrollTo` · `manBackToTop` · `downloadManualPDF` · `buildManualSections` · `openBackupVault` · `closeBackupVault` · `_startNavAutoCollapse` · `toggleNav` · `initNav` · `showUpdBanner` · `applyUpdate` · `hdrHardReload` · `hardReloadApp` · `k` · `obCheckSetupParam` · `obPatchScan` · `obInit` · `openHelp` · `closeHelpOv` · `helpAction` · `sbkimMailboxFetch` · `sbkimCosine` · `sbkimMailboxCheck` · `pause` · `naechste` · `los` · `makeError` · `InvalidEuPolicyError` · `normalizeEuPolicy` · `getProviders` · `availableProviders` · `pickProvider` · `isFileSupported` · `isBrowserOcrSupported` · `toBase64Image` · `mimeOf` · `ocrErrorHint` · `recognizeBrowser` · `cleanOcrText` · `recognize` · `init`
