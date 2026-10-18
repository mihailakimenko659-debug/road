// Векторные рисунки вещей и данные карточек. На реальном сайте здесь будут фото товаров.
const shade = (hex, k) => {
  const n = parseInt(hex.slice(1), 16);
  const f = (v) => Math.max(0, Math.min(255, Math.round(v * k)));
  return `rgb(${f(n >> 16)},${f((n >> 8) & 255)},${f(n & 255)})`;
};
const line = 'stroke="rgba(15,15,12,.32)" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round"';
const stitch = 'fill="none" stroke="rgba(255,255,255,.4)" stroke-width="1.2" stroke-dasharray="3 3"';
const ribs = (x, y, w, h, step = 5) => {
  let s = '';
  for (let i = x + step; i < x + w; i += step) s += `<line x1="${i}" y1="${y + 2}" x2="${i}" y2="${y + h - 2}" stroke="rgba(0,0,0,.18)" stroke-width="1.2"/>`;
  return s;
};

export const DRAW = {
  bomber: (c, a) => `
    <path d="M64 48 L36 62 Q24 68 22 82 L14 150 L36 154 L48 98 L56 86 Z" fill="${shade(c, 0.92)}" ${line}/>
    <path d="M136 48 L164 62 Q176 68 178 82 L186 150 L164 154 L152 98 L144 86 Z" fill="${shade(c, 0.92)}" ${line}/>
    <path d="M14 150 L36 154 L35 168 L12 164 Z" fill="${a}" ${line}/>
    <path d="M186 150 L164 154 L165 168 L188 164 Z" fill="${a}" ${line}/>
    <path d="M64 46 L136 46 L150 166 L50 166 Z" fill="${c}" ${line}/>
    <rect x="48" y="162" width="104" height="18" rx="3" fill="${a}" ${line}/>${ribs(48, 162, 104, 18)}
    <path d="M70 46 Q100 64 130 46 L127 34 Q100 50 73 34 Z" fill="${a}" ${line}/>
    <path d="M66 112 L74 142 M134 112 L126 142" ${line} fill="none"/>
    <path d="M28 96 L44 98 L42 112 L27 110 Z" fill="${shade(c, 0.8)}" ${line}/>
    <line x1="100" y1="52" x2="100" y2="164" stroke="#cfcdc6" stroke-width="3.5"/>
    <line x1="100" y1="52" x2="100" y2="164" stroke="#77756e" stroke-width="1" stroke-dasharray="1.5 1.5"/>
    <rect x="96.5" y="56" width="7" height="12" rx="2" fill="#e8e6df" ${line}/>
    <path d="M56 60 L58 160 M144 60 L142 160" ${stitch}/>`,
  hoodie: (c, a) => `
    <path d="M62 62 L34 76 Q24 82 22 96 L16 160 L36 164 L48 108 L56 96 Z" fill="${shade(c, 0.93)}" ${line}/>
    <path d="M138 62 L166 76 Q176 82 178 96 L184 160 L164 164 L152 108 L144 96 Z" fill="${shade(c, 0.93)}" ${line}/>
    <path d="M62 60 L138 60 L146 172 L54 172 Z" fill="${c}" ${line}/>
    <rect x="15" y="156" width="22" height="12" rx="3" fill="${shade(c, 0.85)}" ${line}/>
    <rect x="163" y="156" width="22" height="12" rx="3" fill="${shade(c, 0.85)}" ${line}/>
    <rect x="53" y="166" width="94" height="14" rx="3" fill="${shade(c, 0.85)}" ${line}/>${ribs(53, 166, 94, 14)}
    <path d="M68 64 Q62 22 100 16 Q138 22 132 64 Q116 76 100 76 Q84 76 68 64 Z" fill="${shade(c, 0.9)}" ${line}/>
    <path d="M80 60 Q80 32 100 30 Q120 32 120 60 Q110 68 100 68 Q90 68 80 60 Z" fill="${shade(c, 0.55)}"/>
    <path d="M92 72 L89 108 M108 72 L111 108" stroke="${a}" stroke-width="3" stroke-linecap="round"/>
    <rect x="86.5" y="106" width="5" height="9" rx="2" fill="#d9d7d0"/><rect x="108.5" y="106" width="5" height="9" rx="2" fill="#d9d7d0"/>
    <path d="M70 128 L130 128 L138 160 L62 160 Z" fill="${shade(c, 0.96)}" ${line}/>
    <path d="M74 132 L126 132" ${stitch}/>`,
  tee: (c, a) => `
    <path d="M70 40 Q100 56 130 40 L170 62 L156 94 L140 86 L140 172 L60 172 L60 86 L44 94 L30 62 Z" fill="${c}" ${line}/>
    <path d="M70 40 Q100 56 130 40 Q128 50 100 60 Q72 50 70 40 Z" fill="${shade(c, 0.86)}" ${line}/>
    <path d="M44 94 L30 62 M156 94 L170 62" ${line}/>
    <circle cx="100" cy="112" r="20" fill="none" stroke="${a}" stroke-width="4"/>
    <text x="100" y="117" text-anchor="middle" font-family="Dela Gothic One, Arial Black, sans-serif" font-size="13" fill="${a}">SH</text>
    <path d="M62 166 L138 166" ${stitch}/>`,
  cargo: (c, a) => `
    <path d="M58 34 L142 34 L152 182 L112 182 L100 84 L88 182 L48 182 Z" fill="${c}" ${line}/>
    <rect x="57" y="20" width="86" height="16" rx="2" fill="${shade(c, 0.85)}" ${line}/>
    <rect x="72" y="18" width="5" height="20" fill="${shade(c, 0.7)}"/><rect x="123" y="18" width="5" height="20" fill="${shade(c, 0.7)}"/>
    <path d="M100 36 L100 76" ${line}/>
    <path d="M48 104 L74 106 L72 146 L46 144 Z" fill="${shade(c, 0.9)}" ${line}/>
    <path d="M152 104 L126 106 L128 146 L154 144 Z" fill="${shade(c, 0.9)}" ${line}/>
    <path d="M48 104 L74 106 L74 116 L48 114 Z M152 104 L126 106 L126 116 L152 114 Z" fill="${shade(c, 0.8)}" ${line}/>
    <rect x="47" y="170" width="42" height="12" fill="${a}" ${line}/><rect x="111" y="170" width="42" height="12" fill="${a}" ${line}/>
    <path d="M62 40 Q70 60 66 66 M138 40 Q130 60 134 66" ${stitch}/>`,
  sneaker: (c, a) => `
    <path d="M22 132 Q20 150 42 152 L168 152 Q186 152 184 134 L178 126 Z" fill="#f3f0e9" ${line}/>
    <path d="M22 146 Q24 152 42 152 L168 152 Q184 152 184 144" fill="none" stroke="${shade(a, 0.9)}" stroke-width="5"/>
    <path d="M30 132 Q32 96 64 86 L96 70 Q110 63 120 76 L132 100 Q162 104 178 126 L30 132 Z" fill="${c}" ${line}/>
    <path d="M30 132 Q30 104 44 96 L50 132 Z" fill="${a}" ${line}/>
    <path d="M140 104 Q166 108 178 126 L150 128 Q146 112 140 104 Z" fill="${shade(c, 0.8)}" ${line}/>
    <path d="M70 122 Q98 96 134 114" fill="none" stroke="${a}" stroke-width="7" stroke-linecap="round"/>
    <path d="M98 76 L110 92 M104 72 L118 88 M94 82 L104 96 M110 70 L124 84" stroke="#f3f0e9" stroke-width="3" stroke-linecap="round"/>
    <path d="M40 140 L172 140" ${stitch} stroke="rgba(0,0,0,.25)"/>`,
  cap: (c, a) => `
    <path d="M40 122 Q40 52 100 46 Q160 52 160 122 Z" fill="${c}" ${line}/>
    <path d="M100 46 Q84 80 82 122 M100 46 Q116 80 118 122 M100 46 Q60 70 56 122 M100 46 Q140 70 144 122" fill="none" stroke="rgba(0,0,0,.22)" stroke-width="1.4"/>
    <path d="M28 120 Q100 104 174 120 Q178 140 152 146 Q100 134 48 146 Q24 140 28 120 Z" fill="${shade(c, 0.78)}" ${line}/>
    <path d="M40 128 Q100 116 162 128" ${stitch}/>
    <circle cx="100" cy="47" r="5" fill="${a}" ${line}/>
    <rect x="84" y="80" width="32" height="20" rx="3" fill="${a}"/>
    <text x="100" y="95" text-anchor="middle" font-family="Dela Gothic One, Arial Black, sans-serif" font-size="11" fill="${c}">SH</text>`,
  backpack: (c, a) => `
    <path d="M78 40 Q78 22 100 22 Q122 22 122 40" fill="none" stroke="${shade(c, 0.7)}" stroke-width="7"/>
    <rect x="40" y="58" width="16" height="96" rx="7" fill="${shade(c, 0.75)}"/><rect x="144" y="58" width="16" height="96" rx="7" fill="${shade(c, 0.75)}"/>
    <rect x="50" y="38" width="100" height="144" rx="30" fill="${c}" ${line}/>
    <path d="M58 66 Q100 44 142 66" fill="none" stroke="#d6d4cc" stroke-width="2.5"/>
    <rect x="64" y="104" width="72" height="62" rx="16" fill="${shade(c, 0.85)}" ${line}/>
    <path d="M70 116 L130 116" stroke="#d6d4cc" stroke-width="2.5"/>
    <rect x="126" y="112" width="6" height="10" rx="2" fill="#efede6"/>
    <rect x="84" y="134" width="32" height="16" rx="3" fill="${a}"/>
    <path d="M58 52 Q100 34 142 52" ${stitch}/>`,
  puffer: (c, a) => `
    <path d="M60 50 L30 66 Q20 74 18 92 L12 158 L38 164 L48 106 L56 96 Z" fill="${shade(c, 0.92)}" ${line}/>
    <path d="M140 50 L170 66 Q180 74 182 92 L188 158 L162 164 L152 106 L144 96 Z" fill="${shade(c, 0.92)}" ${line}/>
    <path d="M58 48 L142 48 L154 178 L46 178 Z" fill="${c}" ${line}/>
    ${[70, 92, 114, 136, 158].map((y) => `<path d="M${50 + (y - 48) * 0.05} ${y} Q100 ${y + 7} ${150 - (y - 48) * 0.05} ${y}" fill="none" stroke="rgba(0,0,0,.35)" stroke-width="1.6"/>`).join('')}
    ${[82, 104, 126, 148].map((y) => `<path d="M${16} ${y} L${42} ${y + 3} M${184} ${y} L${158} ${y + 3}" stroke="rgba(0,0,0,.3)" stroke-width="1.4"/>`).join('')}
    <path d="M66 50 Q66 26 100 24 Q134 26 134 50 Q118 58 100 58 Q82 58 66 50 Z" fill="${shade(c, 0.85)}" ${line}/>
    <path d="M66 48 Q100 64 134 48" fill="none" stroke="${a}" stroke-width="4"/>
    <line x1="100" y1="58" x2="100" y2="176" stroke="#cfcdc6" stroke-width="3"/>
    <rect x="96.5" y="62" width="7" height="12" rx="2" fill="${a}"/>`,
  beanie: (c, a) => `
    <path d="M50 124 Q50 54 100 50 Q150 54 150 124 Z" fill="${c}" ${line}/>
    ${[62, 74, 86, 100, 114, 126, 138].map((x) => `<path d="M${x} 120 Q${x + (x - 100) * 0.2} 80 100 54" fill="none" stroke="rgba(0,0,0,.14)" stroke-width="1.3"/>`).join('')}
    <rect x="44" y="114" width="112" height="44" rx="10" fill="${shade(c, 0.86)}" ${line}/>${ribs(44, 114, 112, 44, 6)}
    <rect x="88" y="126" width="24" height="18" rx="2" fill="${a}"/>
    <circle cx="100" cy="40" r="17" fill="${a}" ${line}/>
    <path d="M90 32 L94 36 M104 28 L106 34 M110 40 L104 42 M92 46 L96 44" stroke="rgba(0,0,0,.2)" stroke-width="1.4"/>`,
  shirt: (c, a, id) => `
    <defs><clipPath id="sh${id}"><path d="M62 44 L138 44 L146 176 L54 176 Z M62 46 L32 62 L14 158 L34 162 L52 100 L58 90 Z M138 46 L168 62 L186 158 L166 162 L148 100 L142 90 Z"/></clipPath></defs>
    <path d="M62 46 L32 62 L14 158 L34 162 L52 100 L58 90 Z" fill="${c}" ${line}/>
    <path d="M138 46 L168 62 L186 158 L166 162 L148 100 L142 90 Z" fill="${c}" ${line}/>
    <path d="M62 44 L138 44 L146 176 L54 176 Z" fill="${c}" ${line}/>
    <g clip-path="url(#sh${id})" opacity=".55">${Array.from({ length: 18 }, (_, i) => `<rect x="${8 + i * 10.5}" y="0" width="4" height="200" fill="${a}"/>`).join('')}${Array.from({ length: 18 }, (_, i) => `<rect x="0" y="${30 + i * 10.5}" width="200" height="4" fill="${a}" opacity=".7"/>`).join('')}</g>
    <path d="M78 44 L100 64 L92 40 Z M122 44 L100 64 L108 40 Z" fill="${shade(c, 0.95)}" ${line}/>
    <line x1="100" y1="64" x2="100" y2="176" ${line}/>
    ${[80, 102, 124, 146].map((y) => `<circle cx="104" cy="${y}" r="2.6" fill="#f6f3ec" ${line}/>`).join('')}
    <rect x="66" y="78" width="22" height="22" rx="2" fill="none" ${line}/>`,
  tote: (c, a) => `
    <path d="M74 70 Q74 24 100 24 Q126 24 126 70" fill="none" stroke="${shade(c, 0.8)}" stroke-width="8"/>
    <path d="M46 68 L154 68 L160 182 L40 182 Z" fill="${c}" ${line}/>
    <path d="M50 76 L150 76" ${stitch} stroke="rgba(0,0,0,.25)"/>
    <text x="100" y="140" text-anchor="middle" font-family="Dela Gothic One, Arial Black, sans-serif" font-size="30" fill="${a}">SHOV</text>
    <text x="100" y="160" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="8" fill="${a}">ХОЛСТ 340 г/м²</text>`,
  socks: (c, a) => `
    <path d="M62 28 L96 28 L96 116 Q96 132 116 142 Q136 152 132 168 Q126 182 100 176 L66 164 Q54 158 58 140 L62 116 Z" fill="${c}" ${line}/>
    <path d="M104 28 L138 28 L138 116 Q138 132 158 142 Q178 152 174 168 Q168 182 142 176 L108 164 Q96 158 100 140 L104 116 Z" fill="${shade(c, 0.94)}" ${line}/>
    <rect x="61" y="24" width="36" height="22" rx="3" fill="${a}" ${line}/>${ribs(61, 24, 36, 22, 4)}
    <rect x="103" y="24" width="36" height="22" rx="3" fill="${a}" ${line}/>${ribs(103, 24, 36, 22, 4)}
    <path d="M116 142 Q136 152 132 168 Q126 182 112 179 Q122 160 104 150 Z" fill="${a}" opacity=".9"/>
    <path d="M158 142 Q178 152 174 168 Q168 182 154 179 Q164 160 146 150 Z" fill="${a}" opacity=".9"/>`,
};

export const PRODUCTS = [
  { type: 'bomber', name: 'Бомбер «Пилот»', price: '18 900 ₽', sku: 'SH-0412', c: '#4a5a3c', a: '#e2652a', tile: '#ddd5c6' },
  { type: 'hoodie', name: 'Худи «Петля»', price: '9 400 ₽', sku: 'SH-0208', c: '#d8cbb5', a: '#8b6f4e', tile: '#c9bba3' },
  { type: 'sneaker', name: 'Кроссовки «Шаг»', price: '14 500 ₽', sku: 'SH-0911', c: '#2f3c5a', a: '#e2652a', tile: '#e4ded3' },
  { type: 'puffer', name: 'Пуховик «Север»', price: '27 900 ₽', sku: 'SH-0101', c: '#232a33', a: '#e2652a', tile: '#d4ccbe' },
  { type: 'cap', name: 'Кепка «Козырь»', price: '3 200 ₽', sku: 'SH-0730', c: '#26332b', a: '#e2652a', tile: '#e6dfd2' },
  { type: 'cargo', name: 'Карго «Маршрут»', price: '11 200 ₽', sku: 'SH-0517', c: '#6b6150', a: '#3b352b', tile: '#dcd3c4' },
  { type: 'tee', name: 'Футболка «База»', price: '3 900 ₽', sku: 'SH-0303', c: '#f6f2ea', a: '#1f2a24', tile: '#cfc5b4' },
  { type: 'backpack', name: 'Рюкзак «Тяга»', price: '12 800 ₽', sku: 'SH-0820', c: '#c2552a', a: '#1f2a24', tile: '#e2dbcf' },
  { type: 'beanie', name: 'Шапка «Узел»', price: '2 900 ₽', sku: 'SH-0744', c: '#b9452f', a: '#f0e6d6', tile: '#d9d0c1' },
  { type: 'shirt', name: 'Рубашка «Клетка»', price: '7 600 ₽', sku: 'SH-0622', c: '#ece5d6', a: '#3d5a7a', tile: '#d2c8b6' },
  { type: 'tote', name: 'Шоппер «Каждый день»', price: '2 400 ₽', sku: 'SH-0855', c: '#e9dfc8', a: '#1f2a24', tile: '#cdc2ae' },
  { type: 'socks', name: 'Носки «Пара»', price: '990 ₽', sku: 'SH-0899', c: '#f0e9dd', a: '#c2552a', tile: '#ddd5c7' },
];
