/* getraenke/entdecken.mjs — „Bekannte Drinks entdecken“: TheCocktailDB durchsuchen und einen Drink als Getränk übernehmen.

   WOHER (QC_Mixarium_20_04_26.html, „Datenbank: Bekannte Drinks entdecken“ ab ~7284): `_DB_BASE` (7285), `_DB_CAT_MAP`
   (7287), `discoverSearch` (7326, search.php?s=), `discoverRandom` (7336, 6 × random.php), `_discoverFetch` (7344,
   filter.php?a= / ?c=, 12 gemischt), `_discoverCatFor` (7363), `_discoverShow` (7374, Vorschaubild `/preview`, „schon
   da“ über `dbId`, die ersten vier Zutaten), `_DB_LANG_FIELD` (7417), `_DISC_INGRX` (7425), `_DISC_UNITX` (7522),
   `_disTrIngredient` (7564), `_disTrUnit` (7570), `discoverPreview` (7584, lookup.php?i=), `discoverConfirmImport` (7633).
   Die zwei Wörterbücher sind WÖRTLICH übernommen (von einem Skript herausgeschrieben, nicht abgetippt); die Probe
   vergleicht sie mit der QC-Datei und rechnet Namen, Schritte und Mengen gegen `discoverConfirmImport`.

   NETZ: nur über `hol` (Vorgabe `fetch`) und nur in `suche`, `zufall`, `nachschlagen`, `nachKategorie`, `holeBild`.
   Alles andere ist rein: kein Speicher, keine Oberfläche. Die Antworten der Datenbank sind fremde Daten: Nummern werden
   geprüft, Bilder nur von thecocktaildb.com geholt, Kategorie und Glas nur gesetzt, wenn die App sie kennt.

   ⚠ BENANNTE ABWEICHUNGEN VON DER ALTEN APP:
   1. Menge und Einheit sind getrennt („1 1/2 oz“ → amt „1 1/2“, unit „oz“). Alt stand alles in `amt`, `unit` blieb
      leer; `scaleAmt` machte daraus beim Umrechnen der Portionen „2“ statt „3 oz“ (gemessen, steht in der Probe).
   2. „Juice of 1“ + „Lime“ wird Menge 1, Name „Limette (Saft)“. Zusätze hinter Menge und Einheit („2 oz light“,
      „1 Fresh“) stehen in Klammern hinter dem Namen, wie beim Web-Import der neuen App (`getraenkAusRezept`); der Kern
      zählt „Rum (light)“ beim Einkauf zu „Rum“. Text ohne Zahl („Fill with“, „dash“) bleibt wie alt in `amt`.
   3. Rechenbare Einheiten (oz, ml, cl, l, cup) bleiben in jeder Sprache so, dass die App sie umrechnen kann. Alt wurde
      „oz“ für Russisch zu „унц.“ – das kennt der Umschalter ml/cl/oz nicht. „tblsp“ gilt wie „tbsp“ (alt: unübersetzt).
   4. Lücken in der Zutatenliste beenden sie nicht (alt: `break` beim ersten leeren Feld).
   5. Alkohol: „Optional alcohol“ zählt als mit Alkohol (alt: ohne) – der Schalter „Ohne Alkohol“ soll auf der
      sicheren Seite liegen. Fehlt die Angabe ganz, entscheiden die Zutaten (`alkoholBefund`).
   6. Kategorie: „Punch / Party Drink“ → Bowlen (alt: Cocktails oder Limonaden, obwohl es Bowlen als Kategorie gibt).
      Eine Kategorie, die die App nicht (mehr) hat, wird nicht gesetzt: `cat` bleibt leer. Ohne Angabe zu Alkohol
      UND Art (gekürzter Treffer) gibt es keinen Vorschlag (alt: Mocktails).
   7. Glas: ein Glas, das die App kennt, bekommt deren Kennung („Highball glass“ → `highball`); alles andere bleibt
      der Text der Datenbank (alt: immer der englische Text).
   8. Bild: `img` ist leer oder eine eigene Kopie (`holeBild`, data:-Adresse). Alt stand die Adresse bei
      thecocktaildb.com im Getränk – ohne Netz fehlte das Bild, und jedes Öffnen fragte dort an.
   9. Portionen 1 (alt: 2 – die Mengen der Datenbank sind für ein Glas), Zeit unbekannt (`null`, alt: 0), keine
      Schwierigkeit. Zeilenumbrüche trennen Schritte (alt: nur Satzenden). Schritte und Zutaten zählen ab 0.
   10. Kein Suchtext → kein Aufruf. Zufall: doppelte fallen weg; scheitert JEDER Abruf, gibt es eine Meldung
       (alt: „Keine Ergebnisse“). Filter: Bowlen ergänzt. */
import { mengeLesen, mengeUndEinheitTrennen, zutatAusText, einheitInfo, einheitKennung } from './einheiten.mjs';
import { KATEGORIEN, KAT_OHNE } from './kategorien.mjs';
import { alkoholBefund } from './alkohol.mjs';
import { text, fuelle } from '../kern/oberflaeche/sprache.mjs';

export const BASIS = 'https://www.thecocktaildb.com/api/json/v1/1/';
export const DB_QUELLE = 'thecocktaildb';
export const ZUTATEN_MAX = 15;
const ORT = 'thecocktaildb.com', SUCHTEXT_MAX = 80, BILD_MIN = 500, BILD_MAX = 4 * 1024 * 1024;

/* Sprach-Felder der Datenbank (alt: `_DB_LANG_FIELD`). Englisch steht in `strInstructions`. */
export const ANLEITUNG_FELD = Object.freeze({ de: 'strInstructionsDE', es: 'strInstructionsES', fr: 'strInstructionsFR', it: 'strInstructionsIT', zh: 'strInstructionsZH-HANS', pt: 'strInstructionsPT', ru: 'strInstructionsRU' });
/* Kategorie der App → Filter der Datenbank (alt: `_DB_CAT_MAP`; `bowle` ist ergänzt). */
export const KAT_FILTER = Object.freeze({
  smooth: { art: 'category', wert: 'Milk / Float / Shake' }, mock: { art: 'alcoholic', wert: 'Non_Alcoholic' }, afckt: { art: 'alcoholic', wert: 'Non_Alcoholic' },
  limo: { art: 'category', wert: 'Soft Drink' }, tee: { art: 'category', wert: 'Coffee / Tea' }, ckt: { art: 'category', wert: 'Cocktail' },
  sirup: { art: 'category', wert: 'Homemade Liqueur' }, bowle: { art: 'category', wert: 'Punch / Party Drink' },
});
/* Gläser der Datenbank, die es in der App gibt. Alles andere bleibt Text. */
const GLAS_KENNUNG = new Map([['highball glass', 'highball'], ['cocktail glass', 'martini'], ['martini glass', 'martini'], ['old fashioned glass', 'tumbler'], ['whiskey glass', 'tumbler'],
  ['shot glass', 'shot'], ['wine glass', 'wine'], ['white wine glass', 'wine'], ['coffee mug', 'mug'], ['irish coffee cup', 'mug'], ['copper mug', 'mug']]);

/* ── Wörterbücher der alten App (wörtlich): Zutaten (alt: `_DISC_INGRX`) und Mengenwörter (alt: `_DISC_UNITX`) ──
   Schlüssel ist der englische Name in Kleinbuchstaben; Englisch selbst braucht keinen Eintrag. Bei den Mengenwörtern
   zählt die Reihenfolge: längere zuerst, sonst träfe „oz“ auch in „ounces“. */
export const ZUTAT_WOERTER = Object.freeze({
  'vodka': { de: 'Wodka', ru: 'Водка', zh: '伏特加', es: 'Vodka', fr: 'Vodka', it: 'Vodka', pt: 'Vodka' },
  'gin': { de: 'Gin', ru: 'Джин', zh: '金酒', es: 'Ginebra', fr: 'Gin', it: 'Gin', pt: 'Gim' },
  'rum': { de: 'Rum', ru: 'Ром', zh: '朗姆酒', es: 'Ron', fr: 'Rhum', it: 'Rum', pt: 'Rum' },
  'white rum': { de: 'Weißer Rum', ru: 'Белый ром', zh: '白朗姆酒', es: 'Ron blanco', fr: 'Rhum blanc', it: 'Rum bianco', pt: 'Rum branco' },
  'dark rum': { de: 'Dunkler Rum', ru: 'Тёмный ром', zh: '深色朗姆酒', es: 'Ron oscuro', fr: 'Rhum brun', it: 'Rum scuro', pt: 'Rum escuro' },
  'light rum': { de: 'Heller Rum', ru: 'Светлый ром', zh: '浅色朗姆酒', es: 'Ron ligero', fr: 'Rhum léger', it: 'Rum leggero', pt: 'Rum claro' },
  'gold rum': { de: 'Gold-Rum', ru: 'Золотой ром', zh: '金朗姆酒', es: 'Ron dorado', fr: 'Rhum doré', it: 'Rum dorato', pt: 'Rum dourado' },
  'spiced rum': { de: 'Spiced Rum', ru: 'Пряный ром', zh: '香料朗姆酒', es: 'Ron especiado', fr: 'Rhum épicé', it: 'Rum speziato', pt: 'Rum especiado' },
  'tequila': { de: 'Tequila', ru: 'Текила', zh: '龙舌兰', es: 'Tequila', fr: 'Tequila', it: 'Tequila', pt: 'Tequila' },
  'mezcal': { de: 'Mezcal', ru: 'Мескаль', zh: '梅斯卡尔', es: 'Mezcal', fr: 'Mezcal', it: 'Mezcal', pt: 'Mezcal' },
  'whiskey': { de: 'Whiskey', ru: 'Виски', zh: '威士忌', es: 'Whiskey', fr: 'Whisky', it: 'Whiskey', pt: 'Uísque' },
  'whisky': { de: 'Whisky', ru: 'Виски', zh: '威士忌', es: 'Whisky', fr: 'Whisky', it: 'Whisky', pt: 'Uísque' },
  'bourbon': { de: 'Bourbon', ru: 'Бурбон', zh: '波本威士忌', es: 'Bourbon', fr: 'Bourbon', it: 'Bourbon', pt: 'Bourbon' },
  'scotch': { de: 'Scotch', ru: 'Скотч', zh: '苏格兰威士忌', es: 'Scotch', fr: 'Scotch', it: 'Scotch', pt: 'Scotch' },
  'rye whiskey': { de: 'Rye-Whiskey', ru: 'Ржаной виски', zh: '黑麦威士忌', es: 'Whisky de centeno', fr: 'Whisky de seigle', it: 'Whiskey di segale', pt: 'Whisky de centeio' },
  'irish whiskey': { de: 'Irischer Whiskey', ru: 'Ирландский виски', zh: '爱尔兰威士忌', es: 'Whiskey irlandés', fr: 'Whisky irlandais', it: 'Whiskey irlandese', pt: 'Whiskey irlandês' },
  'brandy': { de: 'Brandy', ru: 'Бренди', zh: '白兰地', es: 'Brandy', fr: 'Brandy', it: 'Brandy', pt: 'Brandy' },
  'cognac': { de: 'Cognac', ru: 'Коньяк', zh: '干邑', es: 'Coñac', fr: 'Cognac', it: 'Cognac', pt: 'Conhaque' },
  'champagne': { de: 'Champagner', ru: 'Шампанское', zh: '香槟', es: 'Champán', fr: 'Champagne', it: 'Champagne', pt: 'Champanhe' },
  'prosecco': { de: 'Prosecco', ru: 'Просекко', zh: '普罗赛克', es: 'Prosecco', fr: 'Prosecco', it: 'Prosecco', pt: 'Prosecco' },
  'sparkling wine': { de: 'Schaumwein', ru: 'Игристое вино', zh: '起泡酒', es: 'Vino espumoso', fr: 'Vin pétillant', it: 'Vino frizzante', pt: 'Vinho espumante' },
  'red wine': { de: 'Rotwein', ru: 'Красное вино', zh: '红酒', es: 'Vino tinto', fr: 'Vin rouge', it: 'Vino rosso', pt: 'Vinho tinto' },
  'white wine': { de: 'Weißwein', ru: 'Белое вино', zh: '白葡萄酒', es: 'Vino blanco', fr: 'Vin blanc', it: 'Vino bianco', pt: 'Vinho branco' },
  'vermouth': { de: 'Wermut', ru: 'Вермут', zh: '味美思', es: 'Vermut', fr: 'Vermouth', it: 'Vermouth', pt: 'Vermute' },
  'dry vermouth': { de: 'Trockener Wermut', ru: 'Сухой вермут', zh: '干味美思', es: 'Vermut seco', fr: 'Vermouth sec', it: 'Vermouth secco', pt: 'Vermute seco' },
  'sweet vermouth': { de: 'Süßer Wermut', ru: 'Сладкий вермут', zh: '甜味美思', es: 'Vermut dulce', fr: 'Vermouth doux', it: 'Vermouth dolce', pt: 'Vermute doce' },
  'beer': { de: 'Bier', ru: 'Пиво', zh: '啤酒', es: 'Cerveza', fr: 'Bière', it: 'Birra', pt: 'Cerveja' },
  'absinthe': { de: 'Absinth', ru: 'Абсент', zh: '苦艾酒', es: 'Absenta', fr: 'Absinthe', it: 'Assenzio', pt: 'Absinto' },
  'triple sec': { de: 'Triple Sec', ru: 'Трипл-сек', zh: '橙皮酒', es: 'Triple seco', fr: 'Triple sec', it: 'Triple sec', pt: 'Triple sec' },
  'cointreau': { de: 'Cointreau', ru: 'Куантро', zh: '君度', es: 'Cointreau', fr: 'Cointreau', it: 'Cointreau', pt: 'Cointreau' },
  'curacao': { de: 'Curaçao', ru: 'Кюрасао', zh: '库拉索', es: 'Curasao', fr: 'Curaçao', it: 'Curaçao', pt: 'Curaçao' },
  'blue curacao': { de: 'Blue Curaçao', ru: 'Голубой кюрасао', zh: '蓝橙利口酒', es: 'Curasao azul', fr: 'Curaçao bleu', it: 'Curaçao blu', pt: 'Curaçao azul' },
  'amaretto': { de: 'Amaretto', ru: 'Амаретто', zh: '阿玛雷托', es: 'Amaretto', fr: 'Amaretto', it: 'Amaretto', pt: 'Amaretto' },
  'kahlua': { de: 'Kahlúa', ru: 'Калуа', zh: '卡鲁瓦', es: 'Kahlúa', fr: 'Kahlúa', it: 'Kahlúa', pt: 'Kahlúa' },
  'baileys irish cream': { de: 'Baileys Irish Cream', ru: 'Бейлис ирландский крем', zh: '百利爱尔兰甜奶酒', es: 'Baileys Irish Cream', fr: 'Baileys Irish Cream', it: 'Baileys Irish Cream', pt: 'Baileys Irish Cream' },
  'angostura bitters': { de: 'Angostura-Bitter', ru: 'Биттер Ангостура', zh: '安高斯图拉苦精', es: 'Amargo de Angostura', fr: 'Amer Angostura', it: 'Bitter Angostura', pt: 'Bitter Angostura' },
  'orange bitters': { de: 'Orangenbitter', ru: 'Апельсиновый биттер', zh: '橙苦精', es: 'Amargo de naranja', fr: 'Bitter à l\'orange', it: 'Bitter all\'arancia', pt: 'Bitter de laranja' },
  'bitters': { de: 'Bitter', ru: 'Биттер', zh: '苦精', es: 'Amargo', fr: 'Bitter', it: 'Bitter', pt: 'Bitter' },
  'lime juice': { de: 'Limettensaft', ru: 'Сок лайма', zh: '青柠汁', es: 'Zumo de lima', fr: 'Jus de citron vert', it: 'Succo di lime', pt: 'Sumo de lima' },
  'lemon juice': { de: 'Zitronensaft', ru: 'Лимонный сок', zh: '柠檬汁', es: 'Zumo de limón', fr: 'Jus de citron', it: 'Succo di limone', pt: 'Sumo de limão' },
  'orange juice': { de: 'Orangensaft', ru: 'Апельсиновый сок', zh: '橙汁', es: 'Zumo de naranja', fr: 'Jus d\'orange', it: 'Succo d\'arancia', pt: 'Sumo de laranja' },
  'pineapple juice': { de: 'Ananassaft', ru: 'Ананасовый сок', zh: '菠萝汁', es: 'Zumo de piña', fr: 'Jus d\'ananas', it: 'Succo di ananas', pt: 'Sumo de ananás' },
  'cranberry juice': { de: 'Cranberrysaft', ru: 'Клюквенный сок', zh: '蔓越莓汁', es: 'Zumo de arándano', fr: 'Jus de canneberge', it: 'Succo di mirtillo', pt: 'Sumo de oxicoco' },
  'grapefruit juice': { de: 'Grapefruitsaft', ru: 'Грейпфрутовый сок', zh: '葡萄柚汁', es: 'Zumo de pomelo', fr: 'Jus de pamplemousse', it: 'Succo di pompelmo', pt: 'Sumo de toranja' },
  'tomato juice': { de: 'Tomatensaft', ru: 'Томатный сок', zh: '番茄汁', es: 'Zumo de tomate', fr: 'Jus de tomate', it: 'Succo di pomodoro', pt: 'Sumo de tomate' },
  'apple juice': { de: 'Apfelsaft', ru: 'Яблочный сок', zh: '苹果汁', es: 'Zumo de manzana', fr: 'Jus de pomme', it: 'Succo di mela', pt: 'Sumo de maçã' },
  'simple syrup': { de: 'Einfachsirup', ru: 'Сахарный сироп', zh: '糖浆', es: 'Jarabe simple', fr: 'Sirop simple', it: 'Sciroppo semplice', pt: 'Xarope simples' },
  'sugar syrup': { de: 'Zuckersirup', ru: 'Сахарный сироп', zh: '糖浆', es: 'Jarabe de azúcar', fr: 'Sirop de sucre', it: 'Sciroppo di zucchero', pt: 'Xarope de açúcar' },
  'grenadine': { de: 'Grenadine', ru: 'Гренадин', zh: '红石榴糖浆', es: 'Granadina', fr: 'Grenadine', it: 'Granatina', pt: 'Grenadine' },
  'orgeat syrup': { de: 'Orgeat-Sirup', ru: 'Сироп оршад', zh: '杏仁糖浆', es: 'Orgeat', fr: 'Sirop orgeat', it: 'Sciroppo di orzata', pt: 'Xarope de orchata' },
  'tonic water': { de: 'Tonic Water', ru: 'Тоник', zh: '汤力水', es: 'Agua tónica', fr: 'Tonic', it: 'Acqua tonica', pt: 'Água tónica' },
  'club soda': { de: 'Sodawasser', ru: 'Содовая', zh: '苏打水', es: 'Soda', fr: 'Eau gazeuse', it: 'Acqua frizzante', pt: 'Água com gás' },
  'soda water': { de: 'Sodawasser', ru: 'Содовая', zh: '苏打水', es: 'Soda', fr: 'Eau gazeuse', it: 'Acqua frizzante', pt: 'Água com gás' },
  'sparkling water': { de: 'Mineralwasser', ru: 'Газированная вода', zh: '气泡水', es: 'Agua con gas', fr: 'Eau pétillante', it: 'Acqua frizzante', pt: 'Água com gás' },
  'ginger beer': { de: 'Ingwerbier', ru: 'Имбирное пиво', zh: '姜啤', es: 'Cerveza de jengibre', fr: 'Bière au gingembre', it: 'Ginger beer', pt: 'Ginger beer' },
  'ginger ale': { de: 'Ginger Ale', ru: 'Имбирный эль', zh: '姜汁汽水', es: 'Ginger ale', fr: 'Ginger ale', it: 'Ginger ale', pt: 'Ginger ale' },
  'cola': { de: 'Cola', ru: 'Кола', zh: '可乐', es: 'Cola', fr: 'Cola', it: 'Cola', pt: 'Cola' },
  'coca-cola': { de: 'Coca-Cola', ru: 'Кока-кола', zh: '可口可乐', es: 'Coca-Cola', fr: 'Coca-Cola', it: 'Coca-Cola', pt: 'Coca-Cola' },
  'lemonade': { de: 'Limonade', ru: 'Лимонад', zh: '柠檬水', es: 'Limonada', fr: 'Limonade', it: 'Limonata', pt: 'Limonada' },
  'sprite': { de: 'Sprite', ru: 'Спрайт', zh: '雪碧', es: 'Sprite', fr: 'Sprite', it: 'Sprite', pt: 'Sprite' },
  'water': { de: 'Wasser', ru: 'Вода', zh: '水', es: 'Agua', fr: 'Eau', it: 'Acqua', pt: 'Água' },
  'hot water': { de: 'Heißes Wasser', ru: 'Горячая вода', zh: '热水', es: 'Agua caliente', fr: 'Eau chaude', it: 'Acqua calda', pt: 'Água quente' },
  'ice': { de: 'Eis', ru: 'Лёд', zh: '冰', es: 'Hielo', fr: 'Glace', it: 'Ghiaccio', pt: 'Gelo' },
  'ice cubes': { de: 'Eiswürfel', ru: 'Кубики льда', zh: '冰块', es: 'Cubitos de hielo', fr: 'Glaçons', it: 'Cubetti di ghiaccio', pt: 'Cubos de gelo' },
  'crushed ice': { de: 'Crushed Ice', ru: 'Колотый лёд', zh: '碎冰', es: 'Hielo picado', fr: 'Glace pilée', it: 'Ghiaccio tritato', pt: 'Gelo picado' },
  'mint': { de: 'Minze', ru: 'Мята', zh: '薄荷', es: 'Menta', fr: 'Menthe', it: 'Menta', pt: 'Hortelã' },
  'mint leaves': { de: 'Minzblätter', ru: 'Листья мяты', zh: '薄荷叶', es: 'Hojas de menta', fr: 'Feuilles de menthe', it: 'Foglie di menta', pt: 'Folhas de hortelã' },
  'fresh mint': { de: 'Frische Minze', ru: 'Свежая мята', zh: '新鲜薄荷', es: 'Menta fresca', fr: 'Menthe fraîche', it: 'Menta fresca', pt: 'Hortelã fresca' },
  'lime': { de: 'Limette', ru: 'Лайм', zh: '青柠', es: 'Lima', fr: 'Citron vert', it: 'Lime', pt: 'Lima' },
  'lemon': { de: 'Zitrone', ru: 'Лимон', zh: '柠檬', es: 'Limón', fr: 'Citron', it: 'Limone', pt: 'Limão' },
  'orange': { de: 'Orange', ru: 'Апельсин', zh: '橙子', es: 'Naranja', fr: 'Orange', it: 'Arancia', pt: 'Laranja' },
  'cherry': { de: 'Kirsche', ru: 'Вишня', zh: '樱桃', es: 'Cereza', fr: 'Cerise', it: 'Ciliegia', pt: 'Cereja' },
  'maraschino cherry': { de: 'Cocktailkirsche', ru: 'Коктейльная вишня', zh: '糖渍樱桃', es: 'Cereza marrasquino', fr: 'Cerise marasquin', it: 'Ciliegia marasca', pt: 'Cereja marasquino' },
  'olive': { de: 'Olive', ru: 'Оливка', zh: '橄榄', es: 'Aceituna', fr: 'Olive', it: 'Oliva', pt: 'Azeitona' },
  'salt': { de: 'Salz', ru: 'Соль', zh: '盐', es: 'Sal', fr: 'Sel', it: 'Sale', pt: 'Sal' },
  'sugar': { de: 'Zucker', ru: 'Сахар', zh: '糖', es: 'Azúcar', fr: 'Sucre', it: 'Zucchero', pt: 'Açúcar' },
  'brown sugar': { de: 'Brauner Zucker', ru: 'Коричневый сахар', zh: '红糖', es: 'Azúcar moreno', fr: 'Sucre roux', it: 'Zucchero di canna', pt: 'Açúcar mascavado' },
  'cinnamon': { de: 'Zimt', ru: 'Корица', zh: '肉桂', es: 'Canela', fr: 'Cannelle', it: 'Cannella', pt: 'Canela' },
  'nutmeg': { de: 'Muskatnuss', ru: 'Мускатный орех', zh: '肉豆蔻', es: 'Nuez moscada', fr: 'Muscade', it: 'Noce moscata', pt: 'Noz-moscada' },
  'cream': { de: 'Sahne', ru: 'Сливки', zh: '奶油', es: 'Nata', fr: 'Crème', it: 'Panna', pt: 'Creme' },
  'milk': { de: 'Milch', ru: 'Молоко', zh: '牛奶', es: 'Leche', fr: 'Lait', it: 'Latte', pt: 'Leite' },
  'coconut cream': { de: 'Kokoscreme', ru: 'Кокосовый крем', zh: '椰奶油', es: 'Crema de coco', fr: 'Crème de coco', it: 'Crema di cocco', pt: 'Creme de coco' },
  'coconut milk': { de: 'Kokosmilch', ru: 'Кокосовое молоко', zh: '椰奶', es: 'Leche de coco', fr: 'Lait de coco', it: 'Latte di cocco', pt: 'Leite de coco' },
  'egg': { de: 'Ei', ru: 'Яйцо', zh: '鸡蛋', es: 'Huevo', fr: 'Œuf', it: 'Uovo', pt: 'Ovo' },
  'egg white': { de: 'Eiweiß', ru: 'Яичный белок', zh: '蛋清', es: 'Clara de huevo', fr: 'Blanc d\'œuf', it: 'Albume', pt: 'Clara de ovo' },
  'egg yolk': { de: 'Eigelb', ru: 'Яичный желток', zh: '蛋黄', es: 'Yema de huevo', fr: 'Jaune d\'œuf', it: 'Tuorlo', pt: 'Gema de ovo' },
  'coffee': { de: 'Kaffee', ru: 'Кофе', zh: '咖啡', es: 'Café', fr: 'Café', it: 'Caffè', pt: 'Café' },
  'espresso': { de: 'Espresso', ru: 'Эспрессо', zh: '浓缩咖啡', es: 'Espresso', fr: 'Espresso', it: 'Espresso', pt: 'Expresso' },
  'tea': { de: 'Tee', ru: 'Чай', zh: '茶', es: 'Té', fr: 'Thé', it: 'Tè', pt: 'Chá' },
  'honey': { de: 'Honig', ru: 'Мёд', zh: '蜂蜜', es: 'Miel', fr: 'Miel', it: 'Miele', pt: 'Mel' },
  'vanilla': { de: 'Vanille', ru: 'Ваниль', zh: '香草', es: 'Vainilla', fr: 'Vanille', it: 'Vaniglia', pt: 'Baunilha' },
  'chocolate': { de: 'Schokolade', ru: 'Шоколад', zh: '巧克力', es: 'Chocolate', fr: 'Chocolat', it: 'Cioccolato', pt: 'Chocolate' },
});
export const MASS_WOERTER = Object.freeze([
  ['fl oz', { de: 'fl oz', ru: 'жидк. унц.', zh: '液量盎司', es: 'oz líq.', fr: 'oz liq.', it: 'oz fl', pt: 'fl oz' }],
  ['ounces', { de: 'Unzen', ru: 'унций', zh: '盎司', es: 'onzas', fr: 'onces', it: 'once', pt: 'onças' }],
  ['ounce', { de: 'Unze', ru: 'унция', zh: '盎司', es: 'onza', fr: 'once', it: 'oncia', pt: 'onça' }],
  ['oz', { de: 'oz', ru: 'унц.', zh: '盎司', es: 'oz', fr: 'oz', it: 'oz', pt: 'oz' }],
  ['ml', { de: 'ml', ru: 'мл', zh: '毫升', es: 'ml', fr: 'ml', it: 'ml', pt: 'ml' }],
  ['cl', { de: 'cl', ru: 'сл', zh: '厘升', es: 'cl', fr: 'cl', it: 'cl', pt: 'cl' }],
  ['liters', { de: 'Liter', ru: 'литров', zh: '升', es: 'litros', fr: 'litres', it: 'litri', pt: 'litros' }],
  ['liter', { de: 'Liter', ru: 'литр', zh: '升', es: 'litro', fr: 'litre', it: 'litro', pt: 'litro' }],
  ['litres', { de: 'Liter', ru: 'литров', zh: '升', es: 'litros', fr: 'litres', it: 'litri', pt: 'litros' }],
  ['litre', { de: 'Liter', ru: 'литр', zh: '升', es: 'litro', fr: 'litre', it: 'litro', pt: 'litro' }],
  ['dashes', { de: 'Spritzer', ru: 'капель', zh: '数滴', es: 'chorritos', fr: 'traits', it: 'gocce', pt: 'pingos' }],
  ['dash', { de: 'Spritzer', ru: 'капля', zh: '一滴', es: 'chorrito', fr: 'trait', it: 'goccia', pt: 'pingo' }],
  ['splashes', { de: 'Schuss', ru: 'всплеска', zh: '少量', es: 'chorros', fr: 'giclées', it: 'spruzzate', pt: 'salpicos' }],
  ['splash', { de: 'Schuss', ru: 'всплеск', zh: '少量', es: 'chorro', fr: 'giclée', it: 'spruzzata', pt: 'salpico' }],
  ['drops', { de: 'Tropfen', ru: 'капель', zh: '滴', es: 'gotas', fr: 'gouttes', it: 'gocce', pt: 'gotas' }],
  ['drop', { de: 'Tropfen', ru: 'капля', zh: '滴', es: 'gota', fr: 'goutte', it: 'goccia', pt: 'gota' }],
  ['shots', { de: 'Shots', ru: 'стопок', zh: '杯', es: 'chupitos', fr: 'shots', it: 'shot', pt: 'doses' }],
  ['shot', { de: 'Shot', ru: 'стопка', zh: '一杯', es: 'chupito', fr: 'shot', it: 'shot', pt: 'dose' }],
  ['jiggers', { de: 'Jigger', ru: 'джиггеров', zh: '量酒器', es: 'jiggers', fr: 'jiggers', it: 'jigger', pt: 'medidores' }],
  ['jigger', { de: 'Jigger', ru: 'джиггер', zh: '量酒器', es: 'jigger', fr: 'jigger', it: 'jigger', pt: 'medidor' }],
  ['parts', { de: 'Teile', ru: 'частей', zh: '份', es: 'partes', fr: 'parts', it: 'parti', pt: 'partes' }],
  ['part', { de: 'Teil', ru: 'часть', zh: '份', es: 'parte', fr: 'part', it: 'parte', pt: 'parte' }],
  ['cups', { de: 'Tassen', ru: 'чашек', zh: '杯', es: 'tazas', fr: 'tasses', it: 'tazze', pt: 'chávenas' }],
  ['cup', { de: 'Tasse', ru: 'чашка', zh: '杯', es: 'taza', fr: 'tasse', it: 'tazza', pt: 'chávena' }],
  ['tablespoons', { de: 'Esslöffel', ru: 'столовых ложек', zh: '汤匙', es: 'cucharadas', fr: 'cuillères à soupe', it: 'cucchiai', pt: 'colheres de sopa' }],
  ['tablespoon', { de: 'Esslöffel', ru: 'столовая ложка', zh: '汤匙', es: 'cucharada', fr: 'cuillère à soupe', it: 'cucchiaio', pt: 'colher de sopa' }],
  ['tbsp', { de: 'EL', ru: 'ст. л.', zh: '汤匙', es: 'cda.', fr: 'c. à s.', it: 'cucch.', pt: 'c. sopa' }],
  ['teaspoons', { de: 'Teelöffel', ru: 'чайных ложек', zh: '茶匙', es: 'cucharaditas', fr: 'cuillères à café', it: 'cucchiaini', pt: 'colheres de chá' }],
  ['teaspoon', { de: 'Teelöffel', ru: 'чайная ложка', zh: '茶匙', es: 'cucharadita', fr: 'cuillère à café', it: 'cucchiaino', pt: 'colher de chá' }],
  ['tsp', { de: 'TL', ru: 'ч. л.', zh: '茶匙', es: 'cdta.', fr: 'c. à c.', it: 'cucch.', pt: 'c. chá' }],
  ['bottles', { de: 'Flaschen', ru: 'бутылок', zh: '瓶', es: 'botellas', fr: 'bouteilles', it: 'bottiglie', pt: 'garrafas' }],
  ['bottle', { de: 'Flasche', ru: 'бутылка', zh: '瓶', es: 'botella', fr: 'bouteille', it: 'bottiglia', pt: 'garrafa' }],
  ['cans', { de: 'Dosen', ru: 'банок', zh: '罐', es: 'latas', fr: 'canettes', it: 'lattine', pt: 'latas' }],
  ['can', { de: 'Dose', ru: 'банка', zh: '罐', es: 'lata', fr: 'canette', it: 'lattina', pt: 'lata' }],
  ['glasses', { de: 'Gläser', ru: 'стаканов', zh: '杯', es: 'vasos', fr: 'verres', it: 'bicchieri', pt: 'copos' }],
  ['glass', { de: 'Glas', ru: 'стакан', zh: '杯', es: 'vaso', fr: 'verre', it: 'bicchiere', pt: 'copo' }],
  ['pinches', { de: 'Prisen', ru: 'щепоток', zh: '撮', es: 'pizcas', fr: 'pincées', it: 'pizzichi', pt: 'pitadas' }],
  ['pinch', { de: 'Prise', ru: 'щепотка', zh: '一撮', es: 'pizca', fr: 'pincée', it: 'pizzico', pt: 'pitada' }],
  ['to taste', { de: 'nach Geschmack', ru: 'по вкусу', zh: '适量', es: 'al gusto', fr: 'au goût', it: 'q.b.', pt: 'a gosto' }],
]);
const MASS_NACH_WORT = new Map(MASS_WOERTER.map(([en, tr]) => [en, tr]));
const MASS_GLEICH = new Map([['tblsp', 'tbsp'], ['tbs', 'tbsp']]);
const MASS_RE = MASS_WOERTER.map(([en, tr]) => [new RegExp('(^|[^a-zA-ZäöüÄÖÜß])' + en.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '(?=[^a-zA-ZäöüÄÖÜß]|$)', 'i'), tr]);

const zeile = (v) => String(v == null ? '' : v).replace(/\s+/g, ' ').trim();
const klein = (u) => zeile(u).toLowerCase().replace(/\./g, '');
const massEintrag = (u) => { const k = klein(u); return MASS_NACH_WORT.get(MASS_GLEICH.get(k) || k) || null; };

/* Die Nummer eines Drinks (aus dem Datensatz oder für sich), nur Ziffern; sonst ''. */
export function dbNummer(d) { const s = String(d && typeof d === 'object' ? (d.idDrink == null ? '' : d.idDrink) : (d == null ? '' : d)).trim(); return /^\d{1,12}$/.test(s) ? s : ''; }

/* ── Netz ── */
function netzFehler(e, sprache) {
  const f = new Error(e && e.name === 'AbortError' ? text(sprache, 'thecocktaildb.com antwortet nicht.', 'thecocktaildb.com does not answer.')
    : text(sprache, 'Keine Verbindung zu thecocktaildb.com. Bitte die Internetverbindung prüfen.', 'No connection to thecocktaildb.com. Please check the internet connection.'));
  f.netz = true; return f;
}
/* Ein Abruf bei der Datenbank → Liste der Roh-Drinks. `drinks: null`, „None Found“ und eine leere Antwort heißen:
   nichts gefunden (leere Liste). Alles andere, was nicht zu lesen ist, wird ein Fehler mit Klartext. */
async function abruf(pfad, { hol = fetch, sprache = 'de', zeitMs = 15000 } = {}) {
  const ab = typeof AbortController === 'function' ? new AbortController() : null, uhr = ab ? setTimeout(() => ab.abort(), zeitMs) : null;
  let ant, roh = '';
  try { ant = await hol(BASIS + pfad, { credentials: 'omit', referrerPolicy: 'no-referrer', signal: ab ? ab.signal : undefined }); if (ant && ant.ok) roh = await ant.text(); }
  catch (e) { throw netzFehler(e, sprache); }
  finally { if (uhr) clearTimeout(uhr); }
  if (!ant || !ant.ok) {
    const st = ant ? ant.status : 0;
    const f = new Error(st === 429 ? text(sprache, 'thecocktaildb.com nimmt gerade keine weiteren Anfragen an (zu viele in kurzer Zeit). Bitte kurz warten.', 'thecocktaildb.com is not taking more requests right now (too many in a short time). Please wait a moment.')
      : fuelle(text(sprache, 'thecocktaildb.com antwortet mit einem Fehler (HTTP {0}).', 'thecocktaildb.com answers with an error (HTTP {0}).'), st));
    f.status = st; throw f;
  }
  const t = String(roh || '').trim();
  if (!t) return [];
  let j; try { j = JSON.parse(t); } catch (e) { throw new Error(text(sprache, 'Die Antwort von thecocktaildb.com war nicht lesbar.', 'The answer from thecocktaildb.com could not be read.')); }
  const l = j && j.drinks;
  return Array.isArray(l) ? l.filter((d) => d && typeof d === 'object' && dbNummer(d)) : [];
}
/* Wie `discoverSearch`: Drinks nach dem Namen suchen. Ohne Suchtext geht nichts hinaus. */
export async function suche(suchtext, optionen = {}) {
  const q = zeile(suchtext).slice(0, SUCHTEXT_MAX);
  return q ? abruf('search.php?s=' + encodeURIComponent(q), optionen) : [];
}
/* Wie `discoverRandom`: `anzahl` (Vorgabe 6) zufällige Drinks, jeder mit einem eigenen Abruf. Einzelne Abrufe dürfen
   scheitern; scheitern alle, kommt der Fehler des ersten. */
export async function zufall(optionen = {}) {
  const n = Math.max(1, Math.min(12, Number(optionen.anzahl) || 6));
  const erg = await Promise.all(Array.from({ length: n }, () => abruf('random.php', optionen).then((l) => ({ d: l[0] || null }), (f) => ({ f }))));
  const aus = [], gesehen = new Set();
  for (const { d } of erg) { if (!d || gesehen.has(dbNummer(d))) continue; gesehen.add(dbNummer(d)); aus.push(d); }
  const fehler = erg.find((x) => x.f);
  if (!aus.length && fehler) throw fehler.f;
  return aus;
}
/* Wie `discoverPreview`: der vollständige Datensatz zu einer Nummer, oder null, wenn es ihn nicht gibt. */
export async function nachschlagen(id, optionen = {}) {
  const nr = dbNummer(id); if (!nr) return null;
  return (await abruf('lookup.php?i=' + nr, optionen)).find((d) => dbNummer(d) === nr) || null;
}
function mischen(liste, wuerfel = Math.random) { const l = liste.slice(); for (let i = l.length - 1; i > 0; i--) { const j = Math.floor(wuerfel() * (i + 1)); [l[i], l[j]] = [l[j], l[i]]; } return l; }
/* Wie `_discoverFetch` mit gewählter Kategorie: bis zu `anzahl` (Vorgabe 12) Drinks, gemischt. Die Datensätze sind
   GEKÜRZT (Name, Bild, Nummer) – vor dem Übernehmen `nachschlagen`. Eine Kategorie ohne Filter → leere Liste, kein Abruf. */
export async function nachKategorie(katId, optionen = {}) {
  const f = Object.prototype.hasOwnProperty.call(KAT_FILTER, katId) ? KAT_FILTER[katId] : null; if (!f) return [];
  const l = await abruf('filter.php?' + (f.art === 'alcoholic' ? 'a=' : 'c=') + encodeURIComponent(f.wert), optionen);
  return mischen(l, optionen.wuerfel).slice(0, Math.max(1, Number(optionen.anzahl) || 12));
}

/* ── Lesen eines Datensatzes ── */
/* Hat der Datensatz Zutaten oder eine Anleitung? Die Treffer von `nachKategorie` haben beides nicht. */
export function istVoll(d) { if (!d) return false; for (let i = 1; i <= ZUTATEN_MAX; i++) if (zeile(d['strIngredient' + i])) return true; return !!zeile(d.strInstructions); }

/* Alkohol laut Datenbank: true, false oder null (keine Angabe). „Optional alcohol“ zählt als mit Alkohol. */
export function alkoholAusDb(d) {
  const a = zeile(d && d.strAlcoholic).toLowerCase().replace(/[_-]+/g, ' ');
  if (/^non\b/.test(a)) return false;
  if (a === 'alcoholic' || a.startsWith('optional')) return true;
  return null;
}
const zutatNamenRoh = (d) => { const l = []; for (let i = 1; i <= ZUTATEN_MAX; i++) { const n = zeile(d && d['strIngredient' + i]); if (n) l.push(n); } return l; };
const alkoholMitZutaten = (d) => { const a = alkoholAusDb(d); return a === null ? alkoholBefund({ ings: zutatNamenRoh(d).map((name) => ({ name })) }).alkohol : a; };
/* Für die Trefferliste bei „Ohne Alkohol“: nur, was die Datenbank alkoholfrei nennt UND dessen Zutaten kein
   Alkohol-Stichwort tragen. Ein gekürzter Datensatz (keine Angabe) ist nicht sicher → false. */
export function sicherOhneAlkohol(d) { return alkoholAusDb(d) === false && !alkoholBefund({ ings: zutatNamenRoh(d).map((name) => ({ name })) }).alkohol; }

/* Die Kennungen, die als Kategorie gelten dürfen. „Alle“, „Ohne Kategorie“ und Ordner (`fld_…`) sind keine. */
const katKennungen = (kategorien) => new Set((Array.isArray(kategorien) ? kategorien : KATEGORIEN).map((c) => String(c && typeof c === 'object' ? c.id : c)).filter((id) => id && id !== KAT_OHNE && id !== 'all' && !id.startsWith('fld_')));
/* Wie `_discoverCatFor`: Vorschlag für die Kategorie der App. `kategorien` ist die Liste der App ([{id}] oder
   Kennungen; ohne Angabe die zehn festen). Zurück kommt eine Kennung DIESER Liste oder '' – geraten wird nichts. */
export function kategorieAusDb(d, kategorien) {
  const erlaubt = katKennungen(kategorien);
  const k = zeile(d && d.strCategory).toLowerCase(), alk = alkoholAusDb(d);
  let id = '';
  if (k.includes('shake') || k.includes('milk')) id = 'smooth';
  else if (k.includes('tea') || k.includes('coffee')) id = 'tee';
  else if (k.includes('soft')) id = 'limo';
  else if (k.includes('punch')) id = 'bowle';
  else if (k.includes('liqueur')) id = 'sirup';
  else if (alk !== null) id = alk ? 'ckt' : 'mock';
  return id && erlaubt.has(id) ? id : '';
}
/* Die Wahl des Nutzers: '' heißt ausdrücklich „ohne Kategorie“; eine Kennung gilt, wenn die App sie kennt; sonst
   (keine Wahl oder eine unbekannte) der Vorschlag. */
const katWahl = (d, kategorien, wahl) => (wahl === '' ? '' : (wahl != null && katKennungen(kategorien).has(String(wahl)) ? String(wahl) : kategorieAusDb(d, kategorien)));

/* Glas: die Kennung der App, wenn es das Glas dort gibt; sonst der Text der Datenbank. */
export function glasAusDb(d) { const g = zeile(d && d.strGlass); return GLAS_KENNUNG.get(g.toLowerCase().replace(/-/g, ' ')) || g; }

/* Adresse des Bildes – nur, wenn sie bei thecocktaildb.com liegt (die Antwort ist fremd; ein Bild von woanders würde
   dorthin anfragen). `vorschau`: das kleine Bild der Datenbank (`/preview`), wie in der Trefferliste der alten App. */
function eigeneAdresse(adr) {
  try { const u = new URL(zeile(adr)); if (u.hostname !== ORT && !u.hostname.endsWith('.' + ORT)) return ''; if (u.protocol === 'http:') u.protocol = 'https:'; return u.protocol === 'https:' ? u.href : ''; }
  catch (e) { return ''; }
}
export function bildAdresse(d, vorschau = false) { const a = eigeneAdresse(d && typeof d === 'object' ? d.strDrinkThumb : d); return a && vorschau ? a.replace(/\/+$/, '') + '/preview' : a; }
/* Adresse der Seite des Drinks bei TheCocktailDB (für `source`). */
export function quelleAdresse(d) {
  const nr = dbNummer(d); if (!nr) return '';
  const n = zeile(d && typeof d === 'object' ? d.strDrink : '').normalize('NFD').replace(/\p{M}+/gu, '').replace(/[^A-Za-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  return 'https://www.' + ORT + '/drink/' + nr + (n ? '-' + n : '');
}

/* Wie `_disTrIngredient`: der Name einer Zutat in der Sprache, wenn das Wörterbuch ihn kennt; sonst wie geliefert. */
export function zutatName(name, sprache = 'de') {
  const n = zeile(name), k = n.toLowerCase();
  return sprache !== 'en' && Object.prototype.hasOwnProperty.call(ZUTAT_WOERTER, k) && ZUTAT_WOERTER[k][sprache] ? ZUTAT_WOERTER[k][sprache] : n;
}
/* Wie `_disTrUnit`: in einem Mengentext ohne Zahl das erste bekannte Mengenwort übersetzen („dash“ → „Spritzer“). */
function textMenge(s, sprache) {
  if (!s || sprache === 'en') return s;
  for (const [re, tr] of MASS_RE) { if (tr[sprache] && re.test(s)) return s.replace(re, (_, vor) => vor + tr[sprache]); }
  return s;
}
/* Ein Mengenwort als Einheit in der Sprache. Eine rechenbare Einheit bleibt rechenbar: ihre Übersetzung gilt nur,
   wenn `einheiten.mjs` sie als dieselbe Einheit kennt. */
function massWort(u, sprache) {
  const info = einheitInfo(u), rechenbar = !!info && (info.art === 'volumen' || info.art === 'gewicht');
  const wort = rechenbar && klein(u) === info.kennung ? info.kennung : u;
  const e = massEintrag(u), neu = sprache !== 'en' && e && e[sprache] ? e[sprache] : '';
  return !neu || (rechenbar && einheitKennung(neu) !== info.kennung) ? wort : neu;
}
/* Eine Mengenangabe der Datenbank → { amt, unit, zusatz }.
   `amt` ist eine Zahl, ein Bruch oder eine Spanne – oder, wenn keine Zahl vorn steht, der ganze Text.
   `unit` ist nur ein Mengenwort, das `einheiten.mjs` oder das Wörterbuch der alten App kennt.
   `zusatz` ist, was sonst noch dastand („light“, „Fresh“, „Saft“). Verloren geht nichts – bis auf die zweite
   Schreibweise derselben Menge in „70ml/2fl oz“. */
export function mengeZerlegen(roh, sprache = 'de') {
  const s = zeile(roh);
  if (!s) return { amt: '', unit: '', zusatz: '' };
  const saft = s.match(/^juice of\s+(.+)$/i);
  if (saft) { const r = mengeZerlegen(saft[1], sprache); if (r.amt && mengeLesen(r.amt) !== null) return { amt: r.amt, unit: r.unit, zusatz: [text(sprache, 'Saft', 'juice'), r.zusatz].filter(Boolean).join(', ') }; }
  const strich = s.indexOf('/');
  /* „70ml/2fl oz“: dieselbe Menge in zwei Maßen – das erste gilt */
  if (strich > 0) { const a = mengeUndEinheitTrennen(s.slice(0, strich)), b = mengeUndEinheitTrennen(s.slice(strich + 1)); if (a && b) return { amt: a.amt, unit: massWort(a.unit, sprache), zusatz: '' }; }
  const ganz = mengeUndEinheitTrennen(s);
  if (ganz) return { amt: ganz.amt, unit: massWort(ganz.unit, sprache), zusatz: '' };
  const z = zutatAusText(s);
  if (!z.amt) return { amt: textMenge(s, sprache), unit: '', zusatz: '' };
  if (z.unit) return { amt: z.amt, unit: massWort(z.unit, sprache), zusatz: z.name };
  const w = z.name ? z.name.split(' ') : [];
  for (const n of [2, 1]) { if (w.length >= n) { const u = w.slice(0, n).join(' '); if (massEintrag(u)) return { amt: z.amt, unit: massWort(u, sprache), zusatz: w.slice(n).join(' ') }; } }
  return { amt: z.amt, unit: '', zusatz: z.name };
}
/* Die Zutaten (strIngredient1…15 mit strMeasure1…15) in der Form der App. */
export function zutatenAusDb(d, sprache = 'de') {
  const aus = [];
  for (let i = 1; i <= ZUTATEN_MAX; i++) {
    const roh = zeile(d && d['strIngredient' + i]); if (!roh) continue;
    const m = mengeZerlegen(d['strMeasure' + i], sprache), n = zutatName(roh, sprache);
    aus.push({ id: aus.length, amt: m.amt, unit: m.unit, name: m.zusatz ? `${n} (${m.zusatz})` : n, ck: false, note: '' });
  }
  return aus;
}
/* Die Anleitung in der gewünschten Sprache, sonst Englisch. `sprache` im Ergebnis sagt, was wirklich geliefert wurde. */
export function anleitung(d, sprache = 'de') {
  const sauber = (v) => String(v == null ? '' : v).replace(/\r\n?/g, '\n').trim();
  const feld = sprache === 'en' ? '' : ANLEITUNG_FELD[sprache], eigen = feld && d ? sauber(d[feld]) : '';
  if (eigen) return { text: eigen, sprache };
  const en = sauber(d && d.strInstructions);
  return { text: en, sprache: en ? 'en' : '' };
}
/* Wie in `discoverConfirmImport`: nach jedem Satzende ein Schritt, Bruchstücke bis drei Zeichen fallen weg. */
export function schritteAus(anleitungText) {
  const t = String(anleitungText == null ? '' : anleitungText).trim();
  const teile = t.split(/\n+/).flatMap((z) => z.split(/(?<=[.!?])\s+/)).map((s) => s.trim()).filter((s) => s.length > 3);
  return (teile.length ? teile : (t ? [t] : [])).map((txt, i) => ({ id: i, txt }));
}
/* Was nach dem Wörterbuch noch englisch ist: { zutaten: [Namen], anleitung: true|false } (alt: `aiPending`,
   `stepsNeedAI`). Damit kann die Oberfläche „teilweise Englisch“ sagen oder später übersetzen lassen. */
export function nochEnglisch(d, sprache = 'de') {
  if (sprache === 'en') return { zutaten: [], anleitung: false };
  const a = anleitung(d, sprache);
  return { zutaten: zutatNamenRoh(d).filter((n) => { const k = n.toLowerCase(); return !(Object.prototype.hasOwnProperty.call(ZUTAT_WOERTER, k) && ZUTAT_WOERTER[k][sprache]); }), anleitung: !!a.text && a.sprache !== sprache };
}

/* ── Für die Oberfläche ── */
/* Ein Treffer für die Liste. `bild` ist das Vorschaubild bei thecocktaildb.com, `kategorie` eine Kennung der App
   oder '', `glas` eine Kennung der App oder der Text der Datenbank, `alkohol` true/false/null (keine Angabe),
   `zutaten` die ersten vier Namen, `voll` sagt, ob der Datensatz Zutaten und Anleitung trägt. */
export function kurz(d, { sprache = 'de', kategorien, kategorie } = {}) {
  return { id: dbNummer(d), name: zeile(d && d.strDrink), bild: bildAdresse(d, true), kategorie: katWahl(d, kategorien, kategorie), glas: glasAusDb(d),
    alkohol: alkoholAusDb(d), zutaten: zutatNamenRoh(d).slice(0, 4).map((n) => zutatName(n, sprache)), voll: istVoll(d) };
}
/* Wie `discoverConfirmImport`: aus einem VOLLSTÄNDIGEN Datensatz wird ein Getränk in der Form der App.
   `kategorie` ist die Wahl des Nutzers (gilt, wenn die App sie kennt; '' heißt ausdrücklich ohne), `bild` eine eigene
   Kopie (data:-Adresse, z. B. aus `holeBild`). `id` und `uid` vergibt der Aufrufer (wie beim Labor). Wirft mit Klartext, wenn Nummer oder Name
   fehlen oder wenn der Datensatz weder Zutaten noch Anleitung trägt (gekürzter Treffer: erst `nachschlagen`). */
export function getraenkAusDb(d, { sprache = 'de', kategorien, kategorie, bild = '', jetzt = Date.now() } = {}) {
  const nr = dbNummer(d), name = zeile(d && d.strDrink);
  if (!nr || !name) throw new Error(text(sprache, 'Das ist kein Drink aus der Datenbank (Nummer oder Name fehlt).', 'This is not a drink from the database (number or name missing).'));
  const ings = zutatenAusDb(d, sprache), steps = schritteAus(anleitung(d, sprache).text);
  if (!ings.length && !steps.length) throw new Error(text(sprache, 'Zu diesem Drink fehlen Zutaten und Anleitung. Bitte zuerst nachschlagen.', 'Ingredients and instructions are missing for this drink. Please look it up first.'));
  return { name, cat: katWahl(d, kategorien, kategorie), alcohol: alkoholMitZutaten(d), glass: glasAusDb(d), servings: 1, prepTime: null, ings, steps, tags: [], flavors: [],
    img: typeof bild === 'string' && bild.startsWith('data:image/') ? bild : '', source: quelleAdresse(d), dbSource: DB_QUELLE, dbId: nr, created: jetzt, modified: jetzt };
}
/* Wie `R.some(r=>r.dbId===String(d.idDrink))`: das Getränk der Sammlung, das aus diesem Drink entstand, oder
   undefined. `d` ist der Datensatz, ein Treffer aus `kurz` oder die Nummer. */
export function schonDa(getraenke, d) {
  const nr = dbNummer(d && typeof d === 'object' ? (d.idDrink != null ? d.idDrink : d.dbId != null ? d.dbId : d.id) : d); if (!nr) return undefined;
  return (getraenke || []).find((r) => r && r.dbId != null && String(r.dbId) === nr && (!r.dbSource || r.dbSource === DB_QUELLE));
}

/* Das Bild als eigene Kopie: data:-Adresse (JPEG, PNG, WebP oder GIF, am Inhalt erkannt) oder '' – bei jedem Fehler,
   ohne Meldung. Verkleinern macht die Oberfläche; mit `alsBlob: true` kommt dafür ein Blob zurück (so nimmt ihn
   `bildAusDatei` aus dem Kern). Im Browser klappt das nur, wenn thecocktaildb.com es erlaubt. */
function bildTyp(b) {
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return 'image/jpeg';
  if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return 'image/png';
  if (b[0] === 0x47 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x38) return 'image/gif';
  if (b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 && b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50) return 'image/webp';
  return '';
}
function base64(b) { let s = ''; for (let i = 0; i < b.length; i += 0x8000) s += String.fromCharCode.apply(null, b.subarray(i, i + 0x8000)); return btoa(s); }
export async function holeBild(d, { hol = fetch, zeitMs = 12000, alsBlob = false } = {}) {
  const adr = bildAdresse(d); if (!adr) return '';
  const ab = typeof AbortController === 'function' ? new AbortController() : null, uhr = ab ? setTimeout(() => ab.abort(), zeitMs) : null;
  try {
    const a = await hol(adr, { credentials: 'omit', referrerPolicy: 'no-referrer', signal: ab ? ab.signal : undefined }); if (!a || !a.ok) return '';
    const b = new Uint8Array(await a.arrayBuffer()), typ = bildTyp(b);
    if (!typ || b.length <= BILD_MIN || b.length > BILD_MAX) return '';
    return alsBlob ? new Blob([b], { type: typ }) : 'data:' + typ + ';base64,' + base64(b);
  } catch (e) { return ''; } finally { if (uhr) clearTimeout(uhr); }
}

/* EINE Zeile für die Oberfläche: was beim Entdecken das Gerät verlässt. */
export function wasGehtHinaus(sprache = 'de') {
  return text(sprache, 'Hinaus geht: der Suchtext an thecocktaildb.com – sonst nichts aus deiner Sammlung.', 'Sent: the search text to thecocktaildb.com – nothing else from your collection.');
}
