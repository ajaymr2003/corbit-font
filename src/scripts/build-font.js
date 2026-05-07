'use strict';
const opentype = require('opentype.js');
const fs = require('fs');
const path = require('path');

const UNITS_PER_EM = 1000;
const ASCENDER = 800;
const DESCENDER = -200;
const ADVANCE_WIDTH = 600;
const STROKE_W = 50;

// Transform SVG coords (1000x1000, y down) -> font coords (y up, baseline at 0)
// SVG y=800 -> font y=0 (baseline)
// SVG x: scale 0.6 (1000 -> 600 advance width)
function tx(x) { return x * 0.6; }
function ty(y) { return ASCENDER - y; }

function parsePath(d) {
  if (!d || !d.trim()) return [];
  const commands = [];
  const re = /([MLQZCz])\s*([-\d\s.,]*)/g;
  let m;
  while ((m = re.exec(d)) !== null) {
    const cmd = m[1].toUpperCase();
    const raw = m[2].trim();
    const nums = raw === '' ? [] : raw.split(/[\s,]+/).filter(s => s !== '').map(Number);
    commands.push({ cmd, nums });
  }
  return commands;
}

function strokeToOutline(d, sw) {
  const hw = sw / 2;
  const otPath = new opentype.Path();
  const commands = parsePath(d);
  if (commands.length === 0) return otPath;

  // Scale half-width to font units
  const fhw = hw * 0.6;

  function addRoundedSegment(x1, y1, x2, y2) {
    const fx1 = tx(x1), fy1 = ty(y1);
    const fx2 = tx(x2), fy2 = ty(y2);

    const dx = fx2 - fx1;
    const dy = fy2 - fy1;
    const len = Math.sqrt(dx * dx + dy * dy);
    if (len < 0.001) return;

    // Perpendicular unit vector scaled by half-width
    const nx = (-dy / len) * fhw;
    const ny = (dx / len) * fhw;
    // Forward unit vector scaled by half-width (for caps)
    const ax = (dx / len) * fhw;
    const ay = (dy / len) * fhw;

    // 4 corners of stroke rectangle
    const p1x = fx1 + nx, p1y = fy1 + ny; // start left
    const p2x = fx1 - nx, p2y = fy1 - ny; // start right
    const p3x = fx2 - nx, p3y = fy2 - ny; // end right
    const p4x = fx2 + nx, p4y = fy2 + ny; // end left

    // Kappa for circle approximation
    const k = 0.5523;

    // Draw clockwise outline with round caps
    otPath.moveTo(p1x, p1y);
    // Start cap (semicircle from p1 around to p2, going backward)
    otPath.bezierCurveTo(
      p1x - ax * k, p1y - ay * k,
      p2x - ax * k, p2y - ay * k,
      p2x, p2y
    );
    // Right side
    otPath.lineTo(p3x, p3y);
    // End cap (semicircle from p3 around to p4)
    otPath.bezierCurveTo(
      p3x + ax * k, p3y + ay * k,
      p4x + ax * k, p4y + ay * k,
      p4x, p4y
    );
    // Left side back to start
    otPath.lineTo(p1x, p1y);
    otPath.closePath();
  }

  function addQuadBezierSegments(x1, y1, cpx, cpy, x2, y2, steps) {
    steps = steps || 12;
    let prevX = x1, prevY = y1;
    for (let i = 1; i <= steps; i++) {
      const t = i / steps;
      const mt = 1 - t;
      const qx = mt * mt * x1 + 2 * mt * t * cpx + t * t * x2;
      const qy = mt * mt * y1 + 2 * mt * t * cpy + t * t * y2;
      addRoundedSegment(prevX, prevY, qx, qy);
      prevX = qx;
      prevY = qy;
    }
  }

  let cx = 0, cy = 0;
  let subStartX = 0, subStartY = 0;

  for (const { cmd, nums } of commands) {
    if (cmd === 'M') {
      cx = nums[0]; cy = nums[1];
      subStartX = cx; subStartY = cy;
    } else if (cmd === 'L') {
      const nx = nums[0], ny = nums[1];
      addRoundedSegment(cx, cy, nx, ny);
      cx = nx; cy = ny;
    } else if (cmd === 'Q') {
      const cpx = nums[0], cpy = nums[1];
      const ex = nums[2], ey = nums[3];
      addQuadBezierSegments(cx, cy, cpx, cpy, ex, ey, 12);
      cx = ex; cy = ey;
    } else if (cmd === 'Z') {
      // Close path back to sub-path start
      if (Math.abs(cx - subStartX) > 0.1 || Math.abs(cy - subStartY) > 0.1) {
        addRoundedSegment(cx, cy, subStartX, subStartY);
      }
      cx = subStartX; cy = subStartY;
    }
  }

  return otPath;
}

// All glyph path data
const GLYPH_DEFS = [
  // Uppercase
  { cp: 0x41, name: 'A', d: "M 500 150 L 150 800 M 500 150 L 850 800 M 250 570 L 750 570" },
  { cp: 0x42, name: 'B', d: "M 200 150 L 200 800 M 200 150 L 550 150 Q 750 150 750 350 Q 750 500 200 500 M 200 500 L 600 500 Q 800 500 800 650 Q 800 800 550 800 L 200 800" },
  { cp: 0x43, name: 'C', d: "M 750 250 Q 650 150 500 150 Q 200 150 200 475 Q 200 800 500 800 Q 650 800 750 700" },
  { cp: 0x44, name: 'D', d: "M 200 150 L 200 800 L 450 800 Q 800 800 800 475 Q 800 150 450 150 Z" },
  { cp: 0x45, name: 'E', d: "M 750 150 L 200 150 L 200 800 L 750 800 M 200 475 L 650 475" },
  { cp: 0x46, name: 'F', d: "M 750 150 L 200 150 L 200 800 M 200 475 L 650 475" },
  { cp: 0x47, name: 'G', d: "M 750 250 Q 650 150 500 150 Q 200 150 200 475 Q 200 800 500 800 Q 700 800 800 700 L 800 475 L 550 475" },
  { cp: 0x48, name: 'H', d: "M 200 150 L 200 800 M 800 150 L 800 800 M 200 475 L 800 475" },
  { cp: 0x49, name: 'I', d: "M 350 150 L 650 150 M 500 150 L 500 800 M 350 800 L 650 800" },
  { cp: 0x4A, name: 'J', d: "M 300 150 L 700 150 M 550 150 L 550 650 Q 550 800 400 800 Q 200 800 200 650" },
  { cp: 0x4B, name: 'K', d: "M 200 150 L 200 800 M 800 150 L 200 475 M 350 570 L 800 800" },
  { cp: 0x4C, name: 'L', d: "M 200 150 L 200 800 L 800 800" },
  { cp: 0x4D, name: 'M', d: "M 150 800 L 150 150 L 500 570 L 850 150 L 850 800" },
  { cp: 0x4E, name: 'N', d: "M 200 800 L 200 150 L 800 800 L 800 150" },
  { cp: 0x4F, name: 'O', d: "M 500 150 Q 800 150 800 475 Q 800 800 500 800 Q 200 800 200 475 Q 200 150 500 150 Z" },
  { cp: 0x50, name: 'P', d: "M 200 150 L 200 800 M 200 150 L 550 150 Q 800 150 800 325 Q 800 500 550 500 L 200 500" },
  { cp: 0x51, name: 'Q', d: "M 500 150 Q 800 150 800 475 Q 800 800 500 800 Q 200 800 200 475 Q 200 150 500 150 Z M 600 680 L 850 900" },
  { cp: 0x52, name: 'R', d: "M 200 150 L 200 800 M 200 150 L 550 150 Q 800 150 800 325 Q 800 500 550 500 L 200 500 M 450 500 L 800 800" },
  { cp: 0x53, name: 'S', d: "M 750 250 Q 650 150 500 150 Q 200 150 200 350 Q 200 500 500 500 Q 800 500 800 650 Q 800 800 500 800 Q 350 800 200 700" },
  { cp: 0x54, name: 'T', d: "M 150 150 L 850 150 M 500 150 L 500 800" },
  { cp: 0x55, name: 'U', d: "M 200 150 L 200 650 Q 200 800 500 800 Q 800 800 800 650 L 800 150" },
  { cp: 0x56, name: 'V', d: "M 150 150 L 500 800 L 850 150" },
  { cp: 0x57, name: 'W', d: "M 150 150 L 300 800 L 500 500 L 700 800 L 850 150" },
  { cp: 0x58, name: 'X', d: "M 200 150 L 800 800 M 800 150 L 200 800" },
  { cp: 0x59, name: 'Y', d: "M 150 150 L 500 500 M 850 150 L 500 500 L 500 800" },
  { cp: 0x5A, name: 'Z', d: "M 200 150 L 800 150 L 200 800 L 800 800" },
  // Lowercase
  { cp: 0x61, name: 'a', d: "M 750 430 Q 700 350 550 350 Q 300 350 300 580 Q 300 800 550 800 Q 700 800 750 720 L 750 350 L 750 800" },
  { cp: 0x62, name: 'b', d: "M 200 150 L 200 800 M 200 600 Q 200 800 450 800 Q 750 800 750 580 Q 750 350 450 350 Q 200 350 200 580" },
  { cp: 0x63, name: 'c', d: "M 700 450 Q 620 350 500 350 Q 250 350 250 580 Q 250 800 500 800 Q 620 800 700 700" },
  { cp: 0x64, name: 'd', d: "M 800 150 L 800 800 M 800 600 Q 800 800 550 800 Q 250 800 250 580 Q 250 350 550 350 Q 800 350 800 580" },
  { cp: 0x65, name: 'e', d: "M 250 550 L 750 550 Q 750 350 500 350 Q 250 350 250 580 Q 250 800 500 800 Q 650 800 750 700" },
  { cp: 0x66, name: 'f', d: "M 650 200 Q 550 150 450 150 Q 300 150 300 300 L 300 800 M 150 450 L 600 450" },
  { cp: 0x67, name: 'g', d: "M 750 350 L 750 900 Q 750 980 500 980 Q 300 980 250 880 M 750 430 Q 700 350 550 350 Q 250 350 250 580 Q 250 800 550 800 Q 750 800 750 580" },
  { cp: 0x68, name: 'h', d: "M 200 150 L 200 800 M 200 520 Q 200 350 450 350 Q 750 350 750 520 L 750 800" },
  { cp: 0x69, name: 'i', d: "M 500 350 L 500 800 M 500 200 L 500 250" },
  { cp: 0x6A, name: 'j', d: "M 550 350 L 550 900 Q 550 980 400 980 Q 300 980 250 930 M 550 200 L 550 250" },
  { cp: 0x6B, name: 'k', d: "M 200 150 L 200 800 M 700 350 L 200 600 M 400 540 L 750 800" },
  { cp: 0x6C, name: 'l', d: "M 500 150 L 500 750 Q 500 800 600 800" },
  { cp: 0x6D, name: 'm', d: "M 150 350 L 150 800 M 150 490 Q 150 350 350 350 Q 500 350 500 490 L 500 800 M 500 490 Q 500 350 700 350 Q 850 350 850 490 L 850 800" },
  { cp: 0x6E, name: 'n', d: "M 200 350 L 200 800 M 200 490 Q 200 350 500 350 Q 800 350 800 490 L 800 800" },
  { cp: 0x6F, name: 'o', d: "M 500 350 Q 800 350 800 580 Q 800 800 500 800 Q 200 800 200 580 Q 200 350 500 350 Z" },
  { cp: 0x70, name: 'p', d: "M 200 350 L 200 980 M 200 580 Q 200 350 500 350 Q 800 350 800 580 Q 800 800 500 800 Q 200 800 200 580" },
  { cp: 0x71, name: 'q', d: "M 800 350 L 800 980 M 800 580 Q 800 350 500 350 Q 200 350 200 580 Q 200 800 500 800 Q 800 800 800 580" },
  { cp: 0x72, name: 'r', d: "M 200 350 L 200 800 M 200 490 Q 200 350 450 350 Q 600 350 650 420" },
  { cp: 0x73, name: 's', d: "M 700 430 Q 640 350 500 350 Q 250 350 250 500 Q 250 600 500 600 Q 750 600 750 700 Q 750 800 500 800 Q 350 800 250 730" },
  { cp: 0x74, name: 't', d: "M 500 150 L 500 750 Q 500 800 600 800 M 300 450 L 700 450" },
  { cp: 0x75, name: 'u', d: "M 200 350 L 200 680 Q 200 800 500 800 Q 800 800 800 680 L 800 350" },
  { cp: 0x76, name: 'v', d: "M 200 350 L 500 800 L 800 350" },
  { cp: 0x77, name: 'w', d: "M 150 350 L 320 800 L 500 550 L 680 800 L 850 350" },
  { cp: 0x78, name: 'x', d: "M 200 350 L 800 800 M 800 350 L 200 800" },
  { cp: 0x79, name: 'y', d: "M 200 350 L 500 720 M 800 350 L 500 720 L 350 950" },
  { cp: 0x7A, name: 'z', d: "M 200 350 L 800 350 L 200 800 L 800 800" },
  // Numbers
  { cp: 0x30, name: 'zero',  d: "M 500 150 Q 800 150 800 475 Q 800 800 500 800 Q 200 800 200 475 Q 200 150 500 150 Z M 300 720 L 700 220" },
  { cp: 0x31, name: 'one',   d: "M 300 300 L 500 150 L 500 800 M 250 800 L 750 800" },
  { cp: 0x32, name: 'two',   d: "M 200 300 Q 200 150 500 150 Q 800 150 800 350 Q 800 500 200 800 L 800 800" },
  { cp: 0x33, name: 'three', d: "M 200 200 Q 300 150 500 150 Q 800 150 800 350 Q 800 500 500 500 M 500 500 Q 800 500 800 650 Q 800 800 500 800 Q 300 800 200 750" },
  { cp: 0x34, name: 'four',  d: "M 700 800 L 700 150 L 150 600 L 850 600" },
  { cp: 0x35, name: 'five',  d: "M 750 150 L 250 150 L 200 500 Q 350 400 500 400 Q 800 400 800 600 Q 800 800 500 800 Q 300 800 200 700" },
  { cp: 0x36, name: 'six',   d: "M 700 250 Q 600 150 500 150 Q 200 150 200 500 L 200 650 Q 200 800 500 800 Q 800 800 800 650 Q 800 500 500 500 Q 200 500 200 650" },
  { cp: 0x37, name: 'seven', d: "M 200 150 L 800 150 L 400 800" },
  { cp: 0x38, name: 'eight', d: "M 500 475 Q 200 475 200 325 Q 200 150 500 150 Q 800 150 800 325 Q 800 475 500 475 Q 200 475 200 650 Q 200 800 500 800 Q 800 800 800 650 Q 800 475 500 475" },
  { cp: 0x39, name: 'nine',  d: "M 800 350 Q 800 150 500 150 Q 200 150 200 350 Q 200 500 500 500 Q 800 500 800 350 L 800 650 Q 800 800 500 800 Q 350 800 250 720" },
  // Symbols
  { cp: 0x20, name: 'space',       d: "" },
  { cp: 0x21, name: 'exclam',      d: "M 500 150 L 500 620 M 500 750 L 500 800" },
  { cp: 0x22, name: 'quotedbl',    d: "M 350 150 L 350 300 M 650 150 L 650 300" },
  { cp: 0x23, name: 'numbersign',  d: "M 300 150 L 200 850 M 700 150 L 600 850 M 150 400 L 850 400 M 100 600 L 800 600" },
  { cp: 0x24, name: 'dollar',      d: "M 500 100 L 500 900 M 750 250 Q 650 150 500 150 Q 200 150 200 350 Q 200 500 500 500 Q 800 500 800 650 Q 800 800 500 800 Q 350 800 200 700" },
  { cp: 0x25, name: 'percent',     d: "M 800 150 L 200 800 M 300 150 Q 200 150 200 250 Q 200 350 300 350 Q 400 350 400 250 Q 400 150 300 150 M 700 650 Q 600 650 600 750 Q 600 850 700 850 Q 800 850 800 750 Q 800 650 700 650" },
  { cp: 0x26, name: 'ampersand',   d: "M 750 650 Q 750 800 450 800 Q 150 800 150 550 Q 150 400 400 300 L 250 150 Q 450 50 600 200 Q 700 300 600 400 L 150 800" },
  { cp: 0x27, name: 'apostrophe',  d: "M 500 150 L 500 300" },
  { cp: 0x28, name: 'parenleft',   d: "M 600 100 Q 300 400 300 500 Q 300 600 600 900" },
  { cp: 0x29, name: 'parenright',  d: "M 400 100 Q 700 400 700 500 Q 700 600 400 900" },
  { cp: 0x2A, name: 'asterisk',    d: "M 500 200 L 500 600 M 200 350 L 800 450 M 800 350 L 200 450" },
  { cp: 0x2B, name: 'plus',        d: "M 500 200 L 500 800 M 200 500 L 800 500" },
  { cp: 0x2C, name: 'comma',       d: "M 500 700 Q 450 800 400 850" },
  { cp: 0x2D, name: 'minus',       d: "M 200 500 L 800 500" },
  { cp: 0x2E, name: 'period',      d: "M 500 750 L 500 800" },
  { cp: 0x2F, name: 'slash',       d: "M 700 150 L 300 850" },
  { cp: 0x3A, name: 'colon',       d: "M 500 350 L 500 400 M 500 600 L 500 650" },
  { cp: 0x3B, name: 'semicolon',   d: "M 500 350 L 500 400 M 500 600 Q 450 700 400 750" },
  { cp: 0x3C, name: 'less',        d: "M 750 200 L 250 500 L 750 800" },
  { cp: 0x3D, name: 'equal',       d: "M 200 400 L 800 400 M 200 600 L 800 600" },
  { cp: 0x3E, name: 'greater',     d: "M 250 200 L 750 500 L 250 800" },
  { cp: 0x3F, name: 'question',    d: "M 200 300 Q 200 150 500 150 Q 800 150 800 350 Q 800 500 500 600 L 500 680 M 500 750 L 500 800" },
  { cp: 0x40, name: 'at',          d: "M 650 475 Q 650 350 500 350 Q 300 350 300 500 Q 300 650 500 650 Q 650 650 650 500 L 650 350 Q 650 150 500 150 Q 200 150 200 500 Q 200 800 500 800 Q 700 800 800 650" },
  { cp: 0x5B, name: 'bracketleft', d: "M 650 150 L 350 150 L 350 800 L 650 800" },
  { cp: 0x5C, name: 'backslash',   d: "M 300 150 L 700 850" },
  { cp: 0x5D, name: 'bracketright',d: "M 350 150 L 650 150 L 650 800 L 350 800" },
  { cp: 0x5E, name: 'asciicircum', d: "M 250 550 L 500 200 L 750 550" },
  { cp: 0x5F, name: 'underscore',  d: "M 150 850 L 850 850" },
  { cp: 0x60, name: 'grave',       d: "M 350 150 L 550 300" },
  { cp: 0x7B, name: 'braceleft',   d: "M 650 150 L 500 150 Q 350 150 350 300 L 350 450 Q 350 500 200 500 Q 350 500 350 550 L 350 700 Q 350 850 500 850 L 650 850" },
  { cp: 0x7C, name: 'bar',         d: "M 500 150 L 500 850" },
  { cp: 0x7D, name: 'braceright',  d: "M 350 150 L 500 150 Q 650 150 650 300 L 650 450 Q 650 500 800 500 Q 650 500 650 550 L 650 700 Q 650 850 500 850 L 350 850" },
  { cp: 0x7E, name: 'asciitilde',  d: "M 200 500 Q 300 350 500 500 Q 700 650 800 500" },
  // Ligatures using Unicode PUA
  { cp: 0xE000, name: 'fat-arrow',     d: "M 150 475 L 750 475 M 500 250 L 750 475 L 500 700 M 800 300 L 800 650" },
  { cp: 0xE001, name: 'not-equal',     d: "M 200 400 L 800 400 M 200 600 L 800 600 M 600 200 L 400 800" },
  { cp: 0xE002, name: 'triple-equal',  d: "M 150 325 L 850 325 M 150 500 L 850 500 M 150 675 L 850 675" },
  { cp: 0xE003, name: 'tag-close',     d: "M 350 200 L 150 500 L 350 800 M 650 200 L 850 500 L 650 800 M 600 200 L 400 800" },
];

function buildFont() {
  fs.mkdirSync('assets', { recursive: true });

  console.log(`Building Corbit Mono with ${GLYPH_DEFS.length} glyphs...`);

  const glyphs = [];

  // .notdef glyph — simple rectangle outline
  const notdefPath = new opentype.Path();
  notdefPath.moveTo(50, DESCENDER);
  notdefPath.lineTo(550, DESCENDER);
  notdefPath.lineTo(550, ASCENDER);
  notdefPath.lineTo(50, ASCENDER);
  notdefPath.closePath();
  notdefPath.moveTo(80, DESCENDER + 30);
  notdefPath.lineTo(520, DESCENDER + 30);
  notdefPath.lineTo(520, ASCENDER - 30);
  notdefPath.lineTo(80, ASCENDER - 30);
  notdefPath.closePath();
  glyphs.push(new opentype.Glyph({
    name: '.notdef',
    unicode: 0,
    advanceWidth: ADVANCE_WIDTH,
    path: notdefPath,
  }));

  for (const { cp, name, d } of GLYPH_DEFS) {
    const outlinePath = strokeToOutline(d, STROKE_W);
    glyphs.push(new opentype.Glyph({
      name,
      unicode: cp,
      advanceWidth: ADVANCE_WIDTH,
      path: outlinePath,
    }));
    process.stdout.write('.');
  }
  console.log('\n✓ Glyphs created');

  const font = new opentype.Font({
    familyName: 'Corbit Mono',
    styleName: 'Regular',
    unitsPerEm: UNITS_PER_EM,
    ascender: ASCENDER,
    descender: DESCENDER,
    glyphs,
  });

  const outPath = path.join('assets', 'CorbitMono.ttf');

  // opentype.js: use toArrayBuffer() for Node.js file writing
  const arrayBuffer = font.toArrayBuffer();
  fs.writeFileSync(outPath, Buffer.from(arrayBuffer));

  const sizeKB = (fs.statSync(outPath).size / 1024).toFixed(1);
  console.log(`✅ Font saved: ${outPath} (${sizeKB} KB)`);
}

buildFont();
