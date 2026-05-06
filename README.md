# Corbit Mono

A futuristic, stroke-based open-source monospace font crafted for developers.

```
ABCDEFGHIJKLMNOPQRSTUVWXYZ
abcdefghijklmnopqrstuvwxyz
0123456789 !@#$%^&*(){}[]|
```

## Features

- **Stroke-based geometry** — every glyph built from clean SVG path data
- **True monospace** — fixed 600-unit advance width for perfect code alignment
- **99 glyphs** — uppercase, lowercase, numbers, symbols, and programming ligatures
- **Fully reproducible** — build pipeline written entirely in Node.js using opentype.js
- **Open Source** — SIL Open Font License 1.1

## Preview

Open `index.html` in your browser for the interactive specimen page with a live text editor and full character map.

## Installation

Download `dist/CorbitMono.ttf` and install it as a system font, or reference it directly from your CSS:

```css
@font-face {
  font-family: 'Corbit Mono';
  src: url('CorbitMono.ttf') format('truetype');
  font-weight: normal;
  font-style: normal;
}

body {
  font-family: 'Corbit Mono', monospace;
}
```

## Building from Source

**Requirements:** Node.js 16+

```bash
# Install dependencies
npm install

# Generate SVG preview glyphs → glyphs/
npm run generate

# Build the TTF font → dist/CorbitMono.ttf
npm run build

# Both steps in sequence
npm run all
```

### What the build does

1. `scripts/generate-glyphs.js` — reads path definitions and writes individual SVG files into `glyphs/uppercase/`, `glyphs/lowercase/`, `glyphs/numbers/`, `glyphs/symbols/`, and `glyphs/ligatures/`.
2. `scripts/build-font.js` — converts each stroke path to filled outline contours using a custom `strokeToOutline()` function and assembles a TTF binary via [opentype.js](https://github.com/opentypejs/opentype.js).

## Font Design

Corbit Mono uses a consistent 1000×1000 SVG coordinate space:
- Baseline at y = 800
- Cap height at y = 150
- Descenders extend to y = 980
- All strokes have a width of 50 units (±25 from center)

The stroke-to-outline algorithm approximates round line caps with cubic Bézier curves (κ ≈ 0.5523) and converts quadratic Bézier segments into polyline approximations at 12 steps for accuracy.

## License

Corbit Mono is released under the [SIL Open Font License 1.1](LICENSE).

Copyright 2024 Corbit Technologies
