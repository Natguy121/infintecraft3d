// Builds the single-file, fully offline game: elemental-lab.html (+ index.html copy)
//   node build.mjs
// Three.js, cannon-es and the Anthropic SDK are bundled (minified) into one
// inline script; the game code from src/js is appended verbatim and readable.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as esbuild from 'esbuild';

const root = path.dirname(fileURLToPath(import.meta.url));
const src = path.join(root, 'src');

const libs = await esbuild.build({
  stdin: {
    contents: `
      export * as THREE from 'three';
      export * as CANNON from 'cannon-es';
      export { default as Anthropic } from '@anthropic-ai/sdk';
      export { Peer } from 'peerjs';
    `,
    resolveDir: root,
    loader: 'js',
  },
  bundle: true, minify: true, format: 'iife', globalName: '__LIBS', platform: 'browser',
  target: ['es2020'], write: false, legalComments: 'none', logLevel: 'warning',
});
let libCode = libs.outputFiles[0].text;

const jsDir = path.join(src, 'js');
const files = fs.readdirSync(jsDir).filter(f => f.endsWith('.js')).sort();
let game = '';
for (const f of files) {
  game += `\n// ===================================================================== ${f}\n`;
  game += fs.readFileSync(path.join(jsDir, f), 'utf8');
}

const guard = (code, label) => {
  // keep the inline <script> intact
  if (/<\/script/i.test(code)) code = code.replace(/<\/script/gi, '<\\/script');
  if (/<!--/.test(code)) console.warn(`warning: "<!--" found in ${label}`);
  return code;
};
libCode = guard(libCode, 'libraries');
game = guard(game, 'game code');

const template = fs.readFileSync(path.join(src, 'template.html'), 'utf8');
const html = template
  .replace('/*__LIBS__*/', () => libCode + '\nconst { THREE, CANNON, Anthropic, Peer } = __LIBS;\n')
  .replace('/*__GAME__*/', () => game);

fs.writeFileSync(path.join(root, 'elemental-lab.html'), html);
// tiny index.html so the repo can be served as-is (e.g. GitHub Pages)
fs.writeFileSync(path.join(root, 'index.html'), '<!doctype html><meta charset="utf-8"><title>Elemental Lab</title>'
  + '<meta http-equiv="refresh" content="0; url=elemental-lab.html"><a href="elemental-lab.html">Play Elemental Lab</a>\n');
const kb = (Buffer.byteLength(html) / 1024).toFixed(0);
console.log(`built elemental-lab.html (${kb} KB) from ${files.length} source files`);
