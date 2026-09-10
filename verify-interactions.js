#!/usr/bin/env node
// Non-destructive static regression checks for the public GANI shell.
const fs = require('fs');

const html = fs.readFileSync('index.html', 'utf8');
const app = fs.readFileSync('app.js', 'utf8');
const manifest = JSON.parse(fs.readFileSync('manifest.webmanifest', 'utf8'));
const sw = fs.readFileSync('sw.js', 'utf8');
const developmentStatus = JSON.parse(fs.readFileSync('gani-development-status.json', 'utf8'));
const frontFaceCss = fs.readFileSync('front-face.css', 'utf8');
const emblem = fs.readFileSync('assets/gani-front-face-crowned-emblem.png');
const failures = [];

const ids = new Set([...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]));
const targets = [...html.matchAll(/data-screen="([^"]+)"/g)].map(match => match[1]);
for (const target of new Set(targets)) {
  if (!ids.has(target)) failures.push(`missing navigation target: ${target}`);
}

if (html.includes('127.0.0.1') || html.includes('localhost')) failures.push('public HTML contains a localhost URL');
if (app.includes('127.0.0.1') || app.includes('localhost')) failures.push('public app code contains a localhost URL');
if (manifest.start_url.includes('localhost') || manifest.scope.includes('localhost')) failures.push('manifest contains a localhost URL');
if (!manifest.start_url || !manifest.scope || manifest.display !== 'standalone') failures.push('manifest install fields are incomplete');
if (!/const CACHE='gani-app-v\d+'/.test(sw)) failures.push('service-worker cache version is missing');
if (!app.includes('function searchDestination')) failures.push('shared search routing is missing');
if (!app.includes("data-screen") || !app.includes('hashchange')) failures.push('navigation binding is missing');

// Front Face owner-review guards: the emblem must be a fixed alpha cutout and only
// its gold reflection may animate. These are deliberately static checks so they run
// without a browser and fail closed if decorative motion is changed later.
if (!html.includes('assets/gani-front-face-crowned-emblem.png')) failures.push('complete crowned emblem asset is not used');
if (!html.includes('data-owner-source="design-reference/gani-owner-master-logo.jpg"')) failures.push('Front Face does not identify the Owner-supplied master logo source');
if (emblem.slice(0, 8).toString('hex') !== '89504e470d0a1a0a' || emblem[25] !== 6) failures.push('Front Face emblem is not an RGBA PNG with transparency');
if (!/background:\s*transparent/.test(frontFaceCss) || !/mask-image:\s*url\("assets\/gani-front-face-crowned-emblem\.png"\)/.test(frontFaceCss)) failures.push('emblem canvas is not explicitly transparent/masked');
if (/\.front-face-mark[^{}]*\{[^}]*\btransform\s*:/.test(frontFaceCss)) failures.push('stationary emblem rule contains decorative transform motion');
const reflectionKeyframes = frontFaceCss.match(/@keyframes\s+front-face-reflection\s*\{[\s\S]*?(?=\n@|$)/m)?.[0] || '';
if (/\btransform\s*:/.test(reflectionKeyframes)) failures.push('emblem reflection animation translates the emblem');
if (!/animation:\s*front-face-reflection/.test(frontFaceCss)) failures.push('emblem reflection animation is missing');
if (!/@media\s*\(prefers-reduced-motion:\s*reduce\)/.test(frontFaceCss) || !frontFaceCss.includes('.front-face-pending .front-face-mark::after')) failures.push('reduced-motion emblem fallback is missing');
if (!/animation:\s*none/.test(frontFaceCss)) failures.push('reduced-motion animation disable is missing');
console.log('PASS: stationary emblem — no decorative translate, rotate, bounce, shake, or scale rule is present.');

const requiredJobStates = ['queued', 'working', 'testing', 'fixing', 'completed', 'failed', 'blocked'];
if (!developmentStatus.currentJob?.title || !developmentStatus.currentJob?.phase || !Array.isArray(developmentStatus.currentJob?.tests)) {
  failures.push('development control status is missing current job evidence');
}
for (const state of requiredJobStates) {
  if (!Array.isArray(developmentStatus.jobs?.[state])) failures.push(`development status is missing ${state} jobs`);
}
if (!Array.isArray(developmentStatus.blockers) || !developmentStatus.functionality?.real || !developmentStatus.functionality?.demo || !developmentStatus.functionality?.providerDependent) {
  failures.push('development status truth classification is incomplete');
}

if (failures.length) {
  console.error(failures.map(failure => `FAIL: ${failure}`).join('\n'));
  process.exitCode = 1;
} else {
  console.log(`PASS: ${new Set(targets).size} unique navigation targets resolve; install and search guards are present.`);
}
