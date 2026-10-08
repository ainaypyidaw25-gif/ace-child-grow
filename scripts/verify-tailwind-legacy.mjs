#!/usr/bin/env node
// Keep every generated utility available to WebViews that load the frozen v3
// stylesheet. Run after each distribution build; a new utility requires a
// corresponding compatible rule in the fallback before it can ship.
import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import postcss from 'postcss';

const index = readFileSync(resolve('dist/index.html'), 'utf8');
const asset = index.match(/\/assets\/[^"']+\.css/);
if (!asset) throw new Error('Production CSS asset missing');
const appCssFiles = readdirSync(resolve('dist/assets')).filter((name) => /^index-.*\.css$/.test(name));
if (appCssFiles.length !== 1 || !asset[0].endsWith(`/${appCssFiles[0]}`)) {
  throw new Error(`Stale app CSS assets in dist/: ${appCssFiles.join(', ')}`);
}

const current = postcss.parse(readFileSync(resolve(`dist${asset[0]}`), 'utf8'));
const fallback = postcss.parse(readFileSync(resolve('public/legacy-tailwind-v3.css'), 'utf8'));
const selectors = (css) => {
  const classes = new Set();
  css.walkRules((rule) => {
    for (const [, name] of rule.selector.matchAll(/\.((?:\\.|[\w-])+)/g)) {
      classes.add(name.replace(/\\/g, ''));
    }
  });
  return classes;
};

const modernClasses = selectors(current);
const legacyClasses = selectors(fallback);
// These v3 arbitrary grid values are preserved in explicit legacy @media rules.
const gridClasses = [
  'lg:grid-cols-[minmax(220px,0.72fr)_minmax(0,1.6fr)]',
  'xl:grid-cols-[minmax(0,1.45fr)_minmax(280px,0.75fr)]',
];
const legacySource = fallback.toString();
for (const className of gridClasses) {
  if (!legacySource.includes(`[class~="${className}"]`)) {
    throw new Error(`Legacy grid rule missing: ${className}`);
  }
  legacyClasses.add(className);
}

const missing = [...modernClasses].filter((className) => !legacyClasses.has(className));
if (missing.length) {
  throw new Error(`Legacy WebView CSS lacks ${missing.length} utilities: ${missing.join(', ')}`);
}
console.log(`Legacy WebView CSS covers all ${modernClasses.size} generated utility selectors.`);
