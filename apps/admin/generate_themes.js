
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper: HSL to RGB
function hslToRgb(h, s, l) {
  s /= 100;
  l /= 100;
  const k = n => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = n =>
    l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return [
    Math.round(f(0) * 255),
    Math.round(f(8) * 255),
    Math.round(f(4) * 255)
  ];
}

function rgbStr(r, g, b) {
  return `${r} ${g} ${b}`;
}

// Generate a tailwind-like scale
// Light Mode: 50 (lightest) -> 900 (darkest)
// Dark Mode: keep ordering (50 lightest -> 900 darkest), but tune for dark UI use.
function generateScale(hue, sat, isDark) {
  const scale = {};
  
  // Lightness values for 50..900
  // Standard Tailwind: 50:98%, 100:94%, 200:86%, 300:74%, 400:60%, 500:50%, 600:40%, 700:32%, 800:26%, 900:16%, 950:10%
  // My target lightness:
  const lightL = [98, 95, 88, 78, 64, 50, 40, 30, 20, 12];
  
  // Dark mode (Non-inverted):
  // Keep 900 as the darkest (background), and 50/100 as light text/overlays when needed.
  // This aligns with existing usage like `dark:bg-slate-900` and `dark:text-slate-100`.
  const darkL = [96, 92, 84, 74, 60, 46, 34, 24, 16, 10];
  
  const lightness = isDark ? darkL : lightL;
  // In dark mode: keep neutrals lightly tinted (esp. low-sat palettes),
  // but reduce very saturated palettes to avoid "neon" accents.
  const saturation = isDark ? (sat <= 30 ? sat : Math.max(0, sat - 18)) : sat;
  
  const steps = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900];
  
  steps.forEach((step, i) => {
    let s = saturation;
    
    const rgb = hslToRgb(hue, s, lightness[i]);
    scale[step] = rgbStr(...rgb);
  });
  
  return scale;
}

const themes = [
  { id: 'mini', hue: 220, sat: 90, name: 'Mini' }, // Blue (brand default)
  { id: 'ocean', hue: 190, sat: 90, name: 'Ocean' }, // Cyan
  { id: 'nord', hue: 215, sat: 30, name: 'Nord' }, // Desaturated Blue
  { id: 'graphite', hue: 240, sat: 5, name: 'Graphite' }, // Neutral
  { id: 'sand', hue: 35, sat: 40, name: 'Sand' }, // Warm/Beige
  { id: 'forest', hue: 140, sat: 60, name: 'Forest' }, // Green
  { id: 'rose', hue: 340, sat: 80, name: 'Rose' }, // Pink/Red
  { id: 'sunset', hue: 25, sat: 90, name: 'Sunset' }, // Orange
  { id: 'lavender', hue: 270, sat: 80, name: 'Lavender' }, // Purple
  { id: 'emerald', hue: 155, sat: 70, name: 'Emerald' }, // Green-Blue
  { id: 'citrus', hue: 85, sat: 80, name: 'Citrus' }, // Lime
  { id: 'cyber', hue: 280, sat: 90, name: 'Cyber' }, // Deep Purple
  { id: 'slate', hue: 210, sat: 20, name: 'Slate' }, // Slate
  { id: 'coffee', hue: 30, sat: 50, name: 'Coffee' }, // Brown
  { id: 'winter', hue: 200, sat: 80, name: 'Winter' }, // Light Blue
  { id: 'aurora', hue: 170, sat: 80, name: 'Aurora' }, // Teal
  { id: 'candy', hue: 320, sat: 70, name: 'Candy' }, // Pink
  { id: 'abyss', hue: 230, sat: 85, name: 'Abyss' }, // Deep Blue-Purple
  { id: 'silk', hue: 45, sat: 40, name: 'Silk' }, // Gold/Cream
  { id: 'vintage', hue: 180, sat: 15, name: 'Vintage' }, // Desaturated Cyan
];

let css = `/* Admin Theme Engine (Generated)
 * 
 * Defines CSS variables for Tailwind colors.
 * Dark Mode Strategy: NON-INVERTED SCALE
 * - Keep 50 as lightest and 900 as darkest in both modes.
 * - This matches existing Tailwind usage like 'dark:bg-slate-900'.
 */

:root {
  /* Static Status Colors (unchanged) */
  --twc-red-50: 254 242 242;
  --twc-red-100: 254 226 226;
  --twc-red-200: 254 202 202;
  --twc-red-300: 252 165 165;
  --twc-red-400: 248 113 113;
  --twc-red-500: 239 68 68;
  --twc-red-600: 220 38 38;
  --twc-red-700: 185 28 28;
  --twc-red-800: 153 27 27;
  --twc-red-900: 127 29 29;

  --twc-green-50: 240 253 244;
  --twc-green-100: 220 252 231;
  --twc-green-200: 187 247 208;
  --twc-green-300: 134 239 172;
  --twc-green-400: 74 222 128;
  --twc-green-500: 34 197 94;
  --twc-green-600: 22 163 74;
  --twc-green-700: 21 128 61;
  --twc-green-800: 22 101 52;
  --twc-green-900: 20 83 45;

  --twc-amber-50: 255 251 235;
  --twc-amber-100: 254 243 199;
  --twc-amber-200: 253 230 138;
  --twc-amber-300: 252 211 77;
  --twc-amber-400: 251 191 36;
  --twc-amber-500: 245 158 11;
  --twc-amber-600: 217 119 6;
  --twc-amber-700: 180 83 9;
  --twc-amber-800: 146 64 14;
  --twc-amber-900: 120 53 15;
}
`;

themes.forEach(theme => {
  const isDefault = theme.id === 'mini';
  const selector = isDefault ? `:root,\n:root[data-theme='${theme.id}']` : `:root[data-theme='${theme.id}']`;
  
  // Light Mode Generation
  const primaryHue = theme.hue;
  const primarySat = theme.sat;
  
  // Gray scale is usually desaturated primary
  const graySat = Math.max(0, primarySat - 70); 
  const grayHue = primaryHue;

  const grayScale = generateScale(grayHue, Math.max(5, graySat), false);
  const slateScale = generateScale(grayHue, Math.max(15, graySat + 10), false); // Slate is slightly more colored
  const primaryScale = generateScale(primaryHue, primarySat, false);

  css += `\n/* THEME: ${theme.name.toUpperCase()} */\n${selector} {\n`;
  css += `  --twc-white: 255 255 255;\n`;
  css += `  --twc-black: 0 0 0;\n\n`;

  // Grays
  Object.entries(grayScale).forEach(([k, v]) => css += `  --twc-gray-${k}: ${v};\n`);
  css += `\n`;
  Object.entries(slateScale).forEach(([k, v]) => css += `  --twc-slate-${k}: ${v};\n`);
  css += `\n`;

  // Brand colors (map primary to purple/blue/indigo to keep compatibility)
  // We'll map "primary" to these
  Object.entries(primaryScale).forEach(([k, v]) => css += `  --twc-primary-${k}: ${v};\n`);
  // Map aliases
  ['purple', 'blue', 'indigo'].forEach(alias => {
     // For variety, we could shift hue slightly for different aliases, but keeping them unified is safer for now
     Object.entries(primaryScale).forEach(([k, v]) => css += `  --twc-${alias}-${k}: ${v};\n`);
  });
  
  css += `}\n`;

  // Dark Mode Generation
  const darkSelector = isDefault ? `.dark,\n.dark[data-theme='${theme.id}']` : `.dark[data-theme='${theme.id}']`;
  
  // Dark mode scales (non-inverted)
  const darkGrayScale = generateScale(grayHue, Math.max(10, graySat + 5), true);
  const darkSlateScale = generateScale(grayHue, Math.max(20, graySat + 15), true);
  const darkPrimaryScale = generateScale(primaryHue, primarySat, true);

  css += `\n${darkSelector} {\n`;

  // NOTE:
  // We intentionally do NOT try to make `--twc-white` / `--twc-black` dynamic for dark mode,
  // because app code frequently uses `dark:text-white` expecting real white.
  // Neutrals should be handled via gray/slate tokens instead.

  Object.entries(darkGrayScale).forEach(([k, v]) => css += `  --twc-gray-${k}: ${v};\n`);
  css += `\n`;
  Object.entries(darkSlateScale).forEach(([k, v]) => css += `  --twc-slate-${k}: ${v};\n`);
  css += `\n`;

  Object.entries(darkPrimaryScale).forEach(([k, v]) => css += `  --twc-primary-${k}: ${v};\n`);
  ['purple', 'blue', 'indigo'].forEach(alias => {
     Object.entries(darkPrimaryScale).forEach(([k, v]) => css += `  --twc-${alias}-${k}: ${v};\n`);
  });
  
  css += `}\n`;
});

const outFile = path.join(__dirname, 'src', 'assets', 'themes2.css');
fs.writeFileSync(outFile, css, 'utf8');
console.log(`Generated: ${outFile}`);
