#!/usr/bin/env python3
"""Getränke und Fingerfood aus Klaus' Rezeptbuch ins Mixarium (Klaus 26.11.2026: „Vielleicht kannst du noch welche aus meinem
Rezeptbuch ziehen, die noch nicht in Mixarium drin sind. Und vielleicht auch noch ein paar Fingerfoods als neue Kategorie.“)

Quelle: Mein-Rezeptbuch/beispiele/rezeptbuch-2026-11-26.json (Klaus' bereinigtes Buch, Prüfbericht daneben).
Schreibt:
  beispiele/getraenke-mit-alkohol-fuer-mixarium.json     die 8 Getränke mit Alkohol in der überarbeiteten Fassung
                                                         (bisherige Kennungen bleiben, wer das alte Paket hatte, bekommt kein Doppel)
  beispiele/getraenke-und-fingerfood-aus-dem-rezeptbuch.json   alkoholfreie Getränke + Fingerfood
  beispiele/KATALOG.json                                 Größe und Prüfsumme beider Pakete
Bilder: WebP, lange Kante 1200 px (die App rechnet beim Einlesen nicht nach; ein Paket soll nicht 10 MB wiegen).
Aufruf:  python3 tools/rezeptbuch-getraenke.py ../Mein-Rezeptbuch/beispiele/rezeptbuch-2026-11-26.json
"""
import base64, hashlib, io, json, pathlib, re, sys
from PIL import Image

WURZEL = pathlib.Path(__file__).resolve().parent.parent
QUELLE = pathlib.Path(sys.argv[1])
GETRAENKE = {'drk', 'smooth', 'mock', 'afckt', 'limo', 'tee', 'ckt', 'bowle', 'sirup'}
FINGER = ['Pizza-Toast', 'Gyoza (japanische gebratene Teigtaschen)', 'Ebi Tempura']
ALKOHOL = re.compile(r'\b(rum|wodka|vodka|gin|whisk(e)?y|tequila|likör|sekt|prosecco|champagner|wein|bier|amaretto|schnaps|brandy|cognac)\b', re.I)
# die bisherigen Kennungen der 8 Getränke im Paket (aus dem ersten Übertrag, 25.11.)
ALT = {'Tropische Kokostraum-Bowle': 'mrb-fa9b5810e7ae', 'Himbeer-Cooler': 'mrb-a72f981e00b1', 'Amaretto Fizz': 'mrb-1c576ecf5196', 'Mango-Mojito': 'mrb-7fa8101efde6',
       'Blind Russian': 'mrb-011de681a7f5', 'Amaretto Sunrise': 'mrb-759973ac5da0', 'Queen Charlotte': 'mrb-d3d144ea1078', 'Solero': 'mrb-5fb96ec2732b'}

def alkoholisch(r): return bool(r.get('alcohol')) or any(ALKOHOL.search(z.get('name', '')) and not re.search(r'alkoholfrei', z.get('name', ''), re.I) for z in r.get('ings', []))
def bild(adresse):
    if not adresse.startswith('data:image/'): return ''
    im = Image.open(io.BytesIO(base64.b64decode(adresse.split(',', 1)[1]))).convert('RGB'); im.thumbnail((1200, 1200), Image.LANCZOS)
    b = io.BytesIO(); im.save(b, 'WEBP', quality=82, method=6); return 'data:image/webp;base64,' + base64.b64encode(b.getvalue()).decode('ascii')
GLAS = [(r'highball|collins|longdrink', 'highball'), (r'tumbler|old fashioned|rocks', 'tumbler'), (r'mug|tasse|becher', 'mug'), (r'martini|coupe|cocktail', 'martini'),
        (r'sekt|wein|wine|flöte|flute', 'wine'), (r'smoothie', 'smoothie'), (r'shot', 'shot')]
def glas(g):   # die Glas-Kennungen des Mixariums (getraenke/glaeser.mjs); Unbekanntes wird „anderes Glas“, nie roher Datenbank-Text
    t = str(g or '').strip().lower()
    return '' if not t else next((k for m, k in GLAS if re.search(m, t)), 'oth')
def sauber(r, **mehr):
    x = {k: v for k, v in r.items() if k not in ('beispiel', 'folder', 'shut', 'blank', 'imgCrop')}
    x['glass'] = {'Würziger Pfirsich-Punsch': 'mug', 'Heißer Ingwer-Zitronen-Trunk (Kill the Cold)': 'mug'}.get(r['name']) or glas(r.get('glass'))   # heiß, in der Tasse
    x.update(img=bild(r.get('img', '')), folder='', **mehr); return x

buch = json.loads(QUELLE.read_text(encoding='utf-8'))['recipes']
mit = [sauber(r, uid=ALT.get(r['name'], r['uid']), alcohol=True) for r in buch if r.get('cat') in GETRAENKE and alkoholisch(r)]
ohne = [sauber(r, alcohol=False) for r in buch if r.get('cat') in GETRAENKE and not alkoholisch(r)]
finger = [sauber(r, cat='finger') for n in FINGER for r in buch if r['name'] == n]
if len(mit) != 8 or set(ALT) - {r['name'] for r in mit}: raise SystemExit('Erwartet: genau die 8 bekannten Getränke mit Alkohol, gefunden: ' + ', '.join(r['name'] for r in mit))
if len(finger) != len(FINGER): raise SystemExit('Fingerfood fehlt im Buch')
kopf = {'version': 11, 'exported': '2026-11-26', 'quelle': 'Klaus’ Rezeptbuch 26.11.2026 (bereinigt, Prüfbericht im Rezeptbuch)', 'kategorien': {'eigene': []}, 'menu': [], 'folders': []}
dateien = {'getraenke-mit-alkohol-fuer-mixarium': ('getraenke-mit-alkohol-fuer-mixarium.json', mit),
           'getraenke-und-fingerfood-aus-dem-rezeptbuch': ('getraenke-und-fingerfood-aus-dem-rezeptbuch.json', ohne + finger)}
kat = json.loads((WURZEL / 'beispiele' / 'KATALOG.json').read_text(encoding='utf-8'))
for pid, (datei, rezepte) in dateien.items():
    roh = json.dumps({**kopf, 'recipes': rezepte}, ensure_ascii=False, separators=(',', ':')).encode('utf-8')
    (WURZEL / 'beispiele' / datei).write_bytes(roh)
    p = next((x for x in kat['pakete'] if x['id'] == pid), None)
    if p is None:
        p = {'id': pid, 'titel': '', 'datei': datei, 'art': 'rezepte', 'alkohol': False, 'fuer': ['mixarium-store', 'mixarium-voll']}
        i = next((k for k, x in enumerate(kat['pakete']) if x['id'] == 'getraenke-ohne-alkohol-start'), -1); kat['pakete'].insert(i + 1, p)   # Reihenfolge = „beispiele“ der Ausgaben
    p.update(anzahl=len(rezepte), bytes=len(roh), sha256=hashlib.sha256(roh).hexdigest())
    if pid == 'getraenke-und-fingerfood-aus-dem-rezeptbuch': p['titel'] = f'Getränke & Fingerfood aus dem Rezeptbuch: {len(rezepte)} Rezepte'
    if pid == 'getraenke-mit-alkohol-fuer-mixarium': p['titel'] = f'Getränke mit Alkohol: {len(rezepte)} Rezepte'
    print(f'{datei}: {len(rezepte)} Rezepte, {len(roh) // 1024} KB · ' + ', '.join(r['name'] for r in rezepte))
(WURZEL / 'beispiele' / 'KATALOG.json').write_text(json.dumps(kat, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')
