// Mein Mixarium · Platzhalterbild, wenn ein Getränk kein Foto hat (Glasform nach Glas und Kategorie: getränke-eigen).
// Gezeichnetes Glas in einer Farbe, die fest zum Namen gehört. Kein Netz, keine Datei.
const GL = {
  highball: ['M164 64 L236 64 L231 252 Q230 262 220 262 L180 262 Q170 262 169 252 Z', 104, ''],
  smoothie: ['M156 70 L244 70 Q246 140 228 200 Q220 226 220 256 Q220 264 210 264 L190 264 Q180 264 180 256 Q180 226 172 200 Q154 140 156 70 Z', 96, '<path d="M214 30 L196 150" stroke="#ff5a7a" stroke-width="7" stroke-linecap="round"/>'],
  tumbler: ['M150 128 L250 128 L244 254 Q243 264 232 264 L168 264 Q157 264 156 254 Z', 156, ''],
  shot: ['M172 150 L228 150 L222 256 Q221 264 212 264 L188 264 Q179 264 178 256 Z', 172, ''],
  martini: ['M130 70 L270 70 L200 160 Z', 92, '<path d="M200 160 L200 252 M166 262 L234 262" stroke="rgba(255,255,255,.9)" stroke-width="7" stroke-linecap="round"/>'],
  wine: ['M150 58 L250 58 Q256 150 200 178 Q144 150 150 58 Z', 88, '<path d="M200 178 L200 252 M166 262 L234 262" stroke="rgba(255,255,255,.9)" stroke-width="7" stroke-linecap="round"/>'],
  mug: ['M148 110 L240 110 L236 252 Q235 264 222 264 L166 264 Q153 264 152 252 Z', 128, '<path d="M240 140 Q280 140 278 178 Q276 214 236 214" fill="none" stroke="rgba(255,255,255,.85)" stroke-width="10"/>'],
  krug: ['M150 70 L232 70 L240 92 L240 250 Q240 264 226 264 L164 264 Q150 264 150 250 Z', 110, '<path d="M240 120 Q286 120 284 170 Q282 216 240 216" fill="none" stroke="rgba(255,255,255,.85)" stroke-width="10"/>'],
  flasche: ['M186 44 L214 44 L214 92 Q246 112 246 150 L246 252 Q246 266 232 266 L168 266 Q154 266 154 252 L154 150 Q154 112 186 92 Z', 120, '<rect x="183" y="30" width="34" height="18" rx="4" fill="#8a6b4a"/>'],
};
const FARBEN = [['#e9fbe9', '#6fb98a', '#c9f0c4', '#7cc68f'], ['#fff3d6', '#f2a93b', '#ffd36b', '#f29a2e'], ['#fff8db', '#d9b43a', '#f6e27a', '#e0b830'], ['#ffeede', '#e88a5a', '#ffc49a', '#d9774a'], ['#fbfbe8', '#c8c37a', '#f1edb8', '#bdb46a'], ['#e6fbf1', '#3fae84', '#b9f0d6', '#36a078'], ['#fde9dc', '#b8562e', '#e98a4e', '#a54825'], ['#fde7ee', '#a2264d', '#e46a8f', '#9a1f45'], ['#e8f1fd', '#4d7fd0', '#b3cef5', '#3f6fc0'], ['#f1e9fb', '#7a55b8', '#cdb8ee', '#6a45a8']];
function glasForm(r) {
  const g = String(r.glass || '').toLowerCase(), c = r.cat;
  if (GL[g]) return g;
  if (/highball|collins|long/.test(g)) return 'highball';
  if (/martini|cocktail|coupe/.test(g)) return 'martini';
  if (/wein|wine/.test(g)) return 'wine';
  if (/shot/.test(g)) return 'shot';
  if (/mug|tasse|becher|cup/.test(g)) return 'mug';
  if (/tumbler|old|rocks/.test(g)) return 'tumbler';
  if (c === 'sirup') return 'flasche'; if (c === 'bowle' || c === 'limo') return 'krug'; if (c === 'smooth') return 'smoothie'; if (c === 'tee') return 'mug'; if (c === 'ckt') return 'martini';
  return 'highball';
}
let nr = 0;
export function platzbild(r) {
  const u = 'pb' + (++nr), [p, lv, extra] = GL[glasForm(r)];
  let h = 0; for (const ch of String(r.uid || r.name || '')) h = (h * 31 + ch.codePointAt(0)) >>> 0;
  const [l, t, q1, q2] = Array.isArray(r.farben) && r.farben.length === 4 ? r.farben : FARBEN[h % FARBEN.length];
  const warm = r.temp === 'warm' || r.temp === 'hot';
  const eis = !warm && p !== GL.flasche[0] && p !== GL.smoothie[0] ? [[180, lv + 26, -12], [206, lv + 58, 10], [186, lv + 96, -4]].map(([x, y, w]) => `<rect x="${x}" y="${y}" width="26" height="24" rx="5" fill="rgba(255,255,255,.4)" stroke="rgba(255,255,255,.7)" transform="rotate(${w} ${x + 13} ${y + 12})"/>`).join('') : '';
  const dampf = warm ? '<path d="M180 92 q8 -16 0 -30 M202 92 q8 -16 0 -30" stroke="rgba(255,255,255,.65)" stroke-width="4" fill="none" stroke-linecap="round"/>' : '';
  return `<svg class="platzbild" viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice" role="img" aria-label=""><defs><radialGradient id="${u}h" cx=".28" cy=".18" r="1.05"><stop offset="0" stop-color="${l}"/><stop offset=".55" stop-color="${q1}"/><stop offset="1" stop-color="${t}"/></radialGradient><linearGradient id="${u}f" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${q1}" stop-opacity=".92"/><stop offset="1" stop-color="${q2}"/></linearGradient><clipPath id="${u}c"><path d="${p}"/></clipPath></defs><rect width="400" height="300" fill="url(#${u}h)"/><rect y="252" width="400" height="48" fill="rgba(10,17,36,.16)"/><ellipse cx="200" cy="266" rx="70" ry="9" fill="rgba(10,17,36,.25)"/><g clip-path="url(#${u}c)"><rect x="0" y="${lv}" width="400" height="300" fill="url(#${u}f)"/><rect x="0" y="${lv}" width="400" height="5" fill="rgba(255,255,255,.55)"/>${eis}</g><path d="${p}" fill="rgba(255,255,255,.1)" stroke="rgba(255,255,255,.9)" stroke-width="3.5" stroke-linejoin="round"/>${extra}${dampf}</svg>`;
}
