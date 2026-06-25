import Debug from 'debug';
import { resolve, dirname, extname } from 'path';
import { fileURLToPath } from 'url';
import { copyFile, readFile as fsReadFile, writeFile as fsWriteFile } from 'fs/promises';
import { renderTemplate, readJson, mkdirp, formatDate } from './utils.js';
import config from './config.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

const debug = Debug('cv:pdf');
debug.enabled = true;

const { GOTENBERG_URL } = process.env;
const publicDir = resolve(root, config.outputDir);
const pagesDir = resolve(root, 'pages');

const MIME_TYPES = {
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
};

function getMimeType(filePath) {
  return MIME_TYPES[extname(filePath).toLowerCase()] ?? 'application/octet-stream';
}

async function toDataUri(absPath) {
  const buf = await fsReadFile(absPath);
  return `data:${getMimeType(absPath)};base64,${buf.toString('base64')}`;
}

async function inlineCssUrls(css, cssAbsPath) {
  const cssDir = dirname(cssAbsPath);
  const urlRegex = /url\((['"]?)([^)'"]+)\1\)/g;
  const matches = [...css.matchAll(urlRegex)];
  let result = css;
  for (const match of matches) {
    const urlStr = match[2];
    if (urlStr.startsWith('http') || urlStr.startsWith('data:') || urlStr.startsWith('//')) continue;
    const absPath = resolve(cssDir, urlStr);
    try {
      const dataUri = await toDataUri(absPath);
      result = result.replace(match[0], `url('${dataUri}')`);
    } catch {
      debug(`Warning: could not inline asset ${absPath}`);
    }
  }
  return result;
}

async function inlineAssets(html) {
  let result = html;

  const linkRegex = /<link[^>]+rel="stylesheet"[^>]+href="([^"]+)"[^>]*\/?>/g;
  for (const match of [...html.matchAll(linkRegex)]) {
    const href = match[1];
    if (href.startsWith('http') || href.startsWith('//')) continue;
    const absPath = resolve(publicDir, href);
    try {
      let css = await fsReadFile(absPath, 'utf-8');
      css = await inlineCssUrls(css, absPath);
      result = result.replace(match[0], `<style>${css}</style>`);
    } catch {
      debug(`Warning: could not inline stylesheet ${href}`);
    }
  }

  const scriptRegex = /<script[^>]+src="([^"]+)"[^>]*><\/script>/g;
  for (const match of [...html.matchAll(scriptRegex)]) {
    const src = match[1];
    if (src.startsWith('http') || src.startsWith('//')) continue;
    const absPath = resolve(publicDir, src);
    try {
      const js = await fsReadFile(absPath, 'utf-8');
      result = result.replace(match[0], `<script>${js}</script>`);
    } catch {
      debug(`Warning: could not inline script ${src}`);
    }
  }

  const imgRegex = /<img([^>]*)src="([^"]+)"([^>]*)>/g;
  for (const match of [...html.matchAll(imgRegex)]) {
    const src = match[2];
    if (src.startsWith('http') || src.startsWith('//') || src.startsWith('data:')) continue;
    const absPath = resolve(publicDir, src);
    try {
      const dataUri = await toDataUri(absPath);
      result = result.replace(match[0], `<img${match[1]}src="${dataUri}"${match[3]}>`);
    } catch {
      debug(`Warning: could not inline image ${src}`);
    }
  }

  return result;
}

function applyDarkClass(html, dark) {
  if (dark) {
    if (/<html[^>]*class="/.test(html)) {
      return html.replace(/(<html[^>]*class=")/, '$1dark ');
    }
    return html.replace(/<html\b/, '<html class="dark"');
  }
  return html.replace(/(<html[^>]*class="[^"]*)\bdark\b\s*/, '$1');
}

function applyVariant(baseData, variant) {
  return {
    ...baseData,
    coverLetter: variant.coverLetter ? { ...baseData.coverLetter, ...variant.coverLetter } : baseData.coverLetter,
    showProjects: variant.showProjects ?? false,
  };
}

async function gotenbergConvert(html, outputPath) {
  const formData = new FormData();
  formData.append('marginTop', '0');
  formData.append('marginBottom', '0');
  formData.append('marginLeft', '0');
  formData.append('marginRight', '0');
  formData.append('printBackground', 'true');
  formData.append('files', new Blob([html], { type: 'text/html' }), 'index.html');

  const response = await fetch(`${GOTENBERG_URL}/forms/chromium/convert/html`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`PDF conversion failed: ${response.statusText}: ${body}`);
  }

  const pdfBuffer = await response.arrayBuffer();
  await fsWriteFile(outputPath, Buffer.from(pdfBuffer));
  debug(`PDF written to ${outputPath}`);
}

async function loadData() {
  const dataDir = resolve(root, config.dataDir);
  const [profile, experience, skills, education, projects, sidebar, coverLetter, variants] = await Promise.all([
    readJson(`${dataDir}/profile.json`),
    readJson(`${dataDir}/experience.json`),
    readJson(`${dataDir}/skills.json`),
    readJson(`${dataDir}/education.json`),
    readJson(`${dataDir}/projects.json`),
    readJson(`${dataDir}/sidebar.json`),
    readJson(`${dataDir}/cover-letter.json`),
    readJson(`${dataDir}/variants.json`),
  ]);
  return { profile, experience, skills, education, projects, sidebar, coverLetter, variants };
}

debug(`Gotenberg URL: ${GOTENBERG_URL}`);

const healthRes = await fetch(`${GOTENBERG_URL}/health`);
if (!healthRes.ok) throw new Error(`Gotenberg unavailable at ${GOTENBERG_URL}`);
debug('Gotenberg healthy');

const { variants, ...baseData } = await loadData();
const indexTemplatePath = resolve(root, config.templateDir, 'index.ejs');

await mkdirp(resolve(publicDir, 'assets'));
await mkdirp(resolve(pagesDir, 'assets'));

for (const variant of variants) {
  debug(`Processing variant: ${variant.id}`);

  const data = applyVariant(baseData, variant);
  let html = await renderTemplate(indexTemplatePath, { ...data, formatDate });
  html = await inlineAssets(html);

  const lightPath = resolve(publicDir, 'assets', `cv.${variant.id}.pdf`);
  await gotenbergConvert(applyDarkClass(html, false), lightPath);
  await copyFile(lightPath, resolve(pagesDir, 'assets', `cv.${variant.id}.pdf`));

  const darkPath = resolve(publicDir, 'assets', `cv.${variant.id}-dark.pdf`);
  await gotenbergConvert(applyDarkClass(html, true), darkPath);
  await copyFile(darkPath, resolve(pagesDir, 'assets', `cv.${variant.id}-dark.pdf`));

  debug(`Variant ${variant.id}: done`);
}

debug('All PDFs generated.');
