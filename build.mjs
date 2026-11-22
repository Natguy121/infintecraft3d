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
      export { initializeApp } from 'firebase/app';
      export { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, updateProfile } from 'firebase/auth';
      export { getFirestore, doc, getDoc, setDoc, runTransaction, collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
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
  .replace('/*__LIBS__*/', () => libCode + '\nconst { THREE, CANNON, Anthropic, Peer } = __LIBS;\nconst FB = __LIBS;\n')
  .replace('/*__GAME__*/', () => game);

fs.writeFileSync(path.join(root, 'elemental-lab.html'), html);
// landing page (index.html) with real text for search engines; the game itself is elemental-lab.html
fs.writeFileSync(path.join(root, 'index.html'), html);  // the link opens straight into the game
const kb = (Buffer.byteLength(html) / 1024).toFixed(0);
console.log(`built elemental-lab.html (${kb} KB) from ${files.length} source files`);
