'use strict';
const fse = require('fs-extra');
const path = require('path');

const DIRS = [
  'src/glyphs/uppercase',
  'src/glyphs/lowercase',
  'src/glyphs/numbers',
  'src/glyphs/symbols',
  'src/glyphs/ligatures',
];

const GLYPH_DATA = {
  uppercase: {
    A: "M 500 150 L 150 800 M 500 150 L 850 800 M 250 570 L 750 570",
    B: "M 200 150 L 200 800 M 200 150 L 550 150 Q 750 150 750 350 Q 750 500 200 500 M 200 500 L 600 500 Q 800 500 800 650 Q 800 800 550 800 L 200 800",
    C: "M 750 250 Q 650 150 500 150 Q 200 150 200 475 Q 200 800 500 800 Q 650 800 750 700",
    D: "M 200 150 L 200 800 L 450 800 Q 800 800 800 475 Q 800 150 450 150 Z",
    E: "M 750 150 L 200 150 L 200 800 L 750 800 M 200 475 L 650 475",
    F: "M 750 150 L 200 150 L 200 800 M 200 475 L 650 475",
    G: "M 750 250 Q 650 150 500 150 Q 200 150 200 475 Q 200 800 500 800 Q 700 800 800 700 L 800 475 L 550 475",
    H: "M 200 150 L 200 800 M 800 150 L 800 800 M 200 475 L 800 475",
    I: "M 350 150 L 650 150 M 500 150 L 500 800 M 350 800 L 650 800",
    J: "M 300 150 L 700 150 M 550 150 L 550 650 Q 550 800 400 800 Q 200 800 200 650",
    K: "M 200 150 L 200 800 M 800 150 L 200 475 M 350 570 L 800 800",
    L: "M 200 150 L 200 800 L 800 800",
    M: "M 150 800 L 150 150 L 500 570 L 850 150 L 850 800",
    N: "M 200 800 L 200 150 L 800 800 L 800 150",
    O: "M 500 150 Q 800 150 800 475 Q 800 800 500 800 Q 200 800 200 475 Q 200 150 500 150 Z",
    P: "M 200 150 L 200 800 M 200 150 L 550 150 Q 800 150 800 325 Q 800 500 550 500 L 200 500",
    Q: "M 500 150 Q 800 150 800 475 Q 800 800 500 800 Q 200 800 200 475 Q 200 150 500 150 Z M 600 680 L 850 900",
    R: "M 200 150 L 200 800 M 200 150 L 550 150 Q 800 150 800 325 Q 800 500 550 500 L 200 500 M 450 500 L 800 800",
    S: "M 750 250 Q 650 150 500 150 Q 200 150 200 350 Q 200 500 500 500 Q 800 500 800 650 Q 800 800 500 800 Q 350 800 200 700",
    T: "M 150 150 L 850 150 M 500 150 L 500 800",
    U: "M 200 150 L 200 650 Q 200 800 500 800 Q 800 800 800 650 L 800 150",
    V: "M 150 150 L 500 800 L 850 150",
    W: "M 150 150 L 300 800 L 500 500 L 700 800 L 850 150",
    X: "M 200 150 L 800 800 M 800 150 L 200 800",
    Y: "M 150 150 L 500 500 M 850 150 L 500 500 L 500 800",
    Z: "M 200 150 L 800 150 L 200 800 L 800 800",
  },
  lowercase: {
    a: "M 750 430 Q 700 350 550 350 Q 300 350 300 580 Q 300 800 550 800 Q 700 800 750 720 L 750 350 L 750 800",
    b: "M 200 150 L 200 800 M 200 600 Q 200 800 450 800 Q 750 800 750 580 Q 750 350 450 350 Q 200 350 200 580",
    c: "M 700 450 Q 620 350 500 350 Q 250 350 250 580 Q 250 800 500 800 Q 620 800 700 700",
    d: "M 800 150 L 800 800 M 800 600 Q 800 800 550 800 Q 250 800 250 580 Q 250 350 550 350 Q 800 350 800 580",
    e: "M 250 550 L 750 550 Q 750 350 500 350 Q 250 350 250 580 Q 250 800 500 800 Q 650 800 750 700",
    f: "M 650 200 Q 550 150 450 150 Q 300 150 300 300 L 300 800 M 150 450 L 600 450",
    g: "M 750 350 L 750 900 Q 750 980 500 980 Q 300 980 250 880 M 750 430 Q 700 350 550 350 Q 250 350 250 580 Q 250 800 550 800 Q 750 800 750 580",
    h: "M 200 150 L 200 800 M 200 520 Q 200 350 450 350 Q 750 350 750 520 L 750 800",
    i: "M 500 350 L 500 800 M 500 200 L 500 250",
    j: "M 550 350 L 550 900 Q 550 980 400 980 Q 300 980 250 930 M 550 200 L 550 250",
    k: "M 200 150 L 200 800 M 700 350 L 200 600 M 400 540 L 750 800",
    l: "M 500 150 L 500 750 Q 500 800 600 800",
    m: "M 150 350 L 150 800 M 150 490 Q 150 350 350 350 Q 500 350 500 490 L 500 800 M 500 490 Q 500 350 700 350 Q 850 350 850 490 L 850 800",
    n: "M 200 350 L 200 800 M 200 490 Q 200 350 500 350 Q 800 350 800 490 L 800 800",
    o: "M 500 350 Q 800 350 800 580 Q 800 800 500 800 Q 200 800 200 580 Q 200 350 500 350 Z",
    p: "M 200 350 L 200 980 M 200 580 Q 200 350 500 350 Q 800 350 800 580 Q 800 800 500 800 Q 200 800 200 580",
    q: "M 800 350 L 800 980 M 800 580 Q 800 350 500 350 Q 200 350 200 580 Q 200 800 500 800 Q 800 800 800 580",
    r: "M 200 350 L 200 800 M 200 490 Q 200 350 450 350 Q 600 350 650 420",
    s: "M 700 430 Q 640 350 500 350 Q 250 350 250 500 Q 250 600 500 600 Q 750 600 750 700 Q 750 800 500 800 Q 350 800 250 730",
    t: "M 500 150 L 500 750 Q 500 800 600 800 M 300 450 L 700 450",
    u: "M 200 350 L 200 680 Q 200 800 500 800 Q 800 800 800 680 L 800 350",
    v: "M 200 350 L 500 800 L 800 350",
    w: "M 150 350 L 320 800 L 500 550 L 680 800 L 850 350",
    x: "M 200 350 L 800 800 M 800 350 L 200 800",
    y: "M 200 350 L 500 720 M 800 350 L 500 720 L 350 950",
    z: "M 200 350 L 800 350 L 200 800 L 800 800",
  },
  numbers: {
    '0': "M 500 150 Q 800 150 800 475 Q 800 800 500 800 Q 200 800 200 475 Q 200 150 500 150 Z M 300 720 L 700 220",
    '1': "M 300 300 L 500 150 L 500 800 M 250 800 L 750 800",
    '2': "M 200 300 Q 200 150 500 150 Q 800 150 800 350 Q 800 500 200 800 L 800 800",
    '3': "M 200 200 Q 300 150 500 150 Q 800 150 800 350 Q 800 500 500 500 M 500 500 Q 800 500 800 650 Q 800 800 500 800 Q 300 800 200 750",
    '4': "M 700 800 L 700 150 L 150 600 L 850 600",
    '5': "M 750 150 L 250 150 L 200 500 Q 350 400 500 400 Q 800 400 800 600 Q 800 800 500 800 Q 300 800 200 700",
    '6': "M 700 250 Q 600 150 500 150 Q 200 150 200 500 L 200 650 Q 200 800 500 800 Q 800 800 800 650 Q 800 500 500 500 Q 200 500 200 650",
    '7': "M 200 150 L 800 150 L 400 800",
    '8': "M 500 475 Q 200 475 200 325 Q 200 150 500 150 Q 800 150 800 325 Q 800 475 500 475 Q 200 475 200 650 Q 200 800 500 800 Q 800 800 800 650 Q 800 475 500 475",
    '9': "M 800 350 Q 800 150 500 150 Q 200 150 200 350 Q 200 500 500 500 Q 800 500 800 350 L 800 650 Q 800 800 500 800 Q 350 800 250 720",
  },
  symbols: {
    space: "",
    exclam: "M 500 150 L 500 620 M 500 750 L 500 800",
    quotedbl: "M 350 150 L 350 300 M 650 150 L 650 300",
    numbersign: "M 300 150 L 200 850 M 700 150 L 600 850 M 150 400 L 850 400 M 100 600 L 800 600",
    dollar: "M 500 100 L 500 900 M 750 250 Q 650 150 500 150 Q 200 150 200 350 Q 200 500 500 500 Q 800 500 800 650 Q 800 800 500 800 Q 350 800 200 700",
    percent: "M 800 150 L 200 800 M 300 150 Q 200 150 200 250 Q 200 350 300 350 Q 400 350 400 250 Q 400 150 300 150 M 700 650 Q 600 650 600 750 Q 600 850 700 850 Q 800 850 800 750 Q 800 650 700 650",
    ampersand: "M 750 650 Q 750 800 450 800 Q 150 800 150 550 Q 150 400 400 300 L 250 150 Q 450 50 600 200 Q 700 300 600 400 L 150 800",
    apostrophe: "M 500 150 L 500 300",
    parenleft: "M 600 100 Q 300 400 300 500 Q 300 600 600 900",
    parenright: "M 400 100 Q 700 400 700 500 Q 700 600 400 900",
    asterisk: "M 500 200 L 500 600 M 200 350 L 800 450 M 800 350 L 200 450",
    plus: "M 500 200 L 500 800 M 200 500 L 800 500",
    comma: "M 500 700 Q 450 800 400 850",
    minus: "M 200 500 L 800 500",
    period: "M 500 750 L 500 800",
    slash: "M 700 150 L 300 850",
    colon: "M 500 350 L 500 400 M 500 600 L 500 650",
    semicolon: "M 500 350 L 500 400 M 500 600 Q 450 700 400 750",
    less: "M 750 200 L 250 500 L 750 800",
    equal: "M 200 400 L 800 400 M 200 600 L 800 600",
    greater: "M 250 200 L 750 500 L 250 800",
    question: "M 200 300 Q 200 150 500 150 Q 800 150 800 350 Q 800 500 500 600 L 500 680 M 500 750 L 500 800",
    at: "M 650 475 Q 650 350 500 350 Q 300 350 300 500 Q 300 650 500 650 Q 650 650 650 500 L 650 350 Q 650 150 500 150 Q 200 150 200 500 Q 200 800 500 800 Q 700 800 800 650",
    bracketleft: "M 650 150 L 350 150 L 350 800 L 650 800",
    backslash: "M 300 150 L 700 850",
    bracketright: "M 350 150 L 650 150 L 650 800 L 350 800",
    asciicircum: "M 250 550 L 500 200 L 750 550",
    underscore: "M 150 850 L 850 850",
    grave: "M 350 150 L 550 300",
    braceleft: "M 650 150 L 500 150 Q 350 150 350 300 L 350 450 Q 350 500 200 500 Q 350 500 350 550 L 350 700 Q 350 850 500 850 L 650 850",
    bar: "M 500 150 L 500 850",
    braceright: "M 350 150 L 500 150 Q 650 150 650 300 L 650 450 Q 650 500 800 500 Q 650 500 650 550 L 650 700 Q 650 850 500 850 L 350 850",
    asciitilde: "M 200 500 Q 300 350 500 500 Q 700 650 800 500",
  },
  ligatures: {
    'fat-arrow': "M 150 475 L 750 475 M 500 250 L 750 475 L 500 700 M 800 300 L 800 650",
    'not-equal': "M 200 400 L 800 400 M 200 600 L 800 600 M 600 200 L 400 800",
    'triple-equal': "M 150 325 L 850 325 M 150 500 L 850 500 M 150 675 L 850 675",
    'tag-close': "M 350 200 L 150 500 L 350 800 M 650 200 L 850 500 L 650 800 M 600 200 L 400 800",
  },
};

function makeSVG(pathData) {
  const pathEl = pathData
    ? `<path d="${pathData}" />`
    : '<!-- empty glyph -->';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000" fill="none" stroke="currentColor" stroke-width="80" stroke-linecap="round" stroke-linejoin="round">
  ${pathEl}
</svg>`;
}

async function main() {
  // Create directories
  for (const dir of DIRS) {
    await fse.ensureDir(dir);
  }
  console.log('✓ Created glyph directories');

  let total = 0;

  // Uppercase
  for (const [char, d] of Object.entries(GLYPH_DATA.uppercase)) {
    const svg = makeSVG(d);
    await fse.writeFile(path.join('src/glyphs/uppercase', `${char}.svg`), svg, 'utf8');
    total++;
  }
  console.log(`✓ Generated ${Object.keys(GLYPH_DATA.uppercase).length} uppercase glyphs`);

  // Lowercase
  for (const [char, d] of Object.entries(GLYPH_DATA.lowercase)) {
    const svg = makeSVG(d);
    await fse.writeFile(path.join('src/glyphs/lowercase', `${char}.svg`), svg, 'utf8');
    total++;
  }
  console.log(`✓ Generated ${Object.keys(GLYPH_DATA.lowercase).length} lowercase glyphs`);

  // Numbers
  for (const [char, d] of Object.entries(GLYPH_DATA.numbers)) {
    const svg = makeSVG(d);
    await fse.writeFile(path.join('src/glyphs/numbers', `${char}.svg`), svg, 'utf8');
    total++;
  }
  console.log(`✓ Generated ${Object.keys(GLYPH_DATA.numbers).length} number glyphs`);

  // Symbols
  for (const [name, d] of Object.entries(GLYPH_DATA.symbols)) {
    const svg = makeSVG(d);
    await fse.writeFile(path.join('src/glyphs/symbols', `${name}.svg`), svg, 'utf8');
    total++;
  }
  console.log(`✓ Generated ${Object.keys(GLYPH_DATA.symbols).length} symbol glyphs`);

  // Ligatures
  for (const [name, d] of Object.entries(GLYPH_DATA.ligatures)) {
    const svg = makeSVG(d);
    await fse.writeFile(path.join('src/glyphs/ligatures', `${name}.svg`), svg, 'utf8');
    total++;
  }
  console.log(`✓ Generated ${Object.keys(GLYPH_DATA.ligatures).length} ligature glyphs`);

  console.log(`\n✅ Done! Generated ${total} SVG files in src/glyphs/`);
}

main().catch(err => { console.error(err); process.exit(1); });
