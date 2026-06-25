import Debug from 'debug';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import config from './config.js';
import { readJson, writeFile, mkdirp, rmrf, cpDir, renderTemplate, formatDate } from './utils.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

const debug = Debug('cv:index');
debug.enabled = true;

function applyVariant(baseData, variant) {
  return {
    ...baseData,
    coverLetter: variant.coverLetter
      ? { ...baseData.coverLetter, ...variant.coverLetter }
      : baseData.coverLetter,
    showProjects: variant.showProjects ?? false,
  };
}

async function loadData() {
  const dataDir = resolve(root, config.dataDir);
  const [profile, experience, skills, education, projects, sidebar, coverLetter] = await Promise.all([
    readJson(`${dataDir}/profile.json`),
    readJson(`${dataDir}/experience.json`),
    readJson(`${dataDir}/skills.json`),
    readJson(`${dataDir}/education.json`),
    readJson(`${dataDir}/projects.json`),
    readJson(`${dataDir}/sidebar.json`),
    readJson(`${dataDir}/cover-letter.json`),
  ]);
  return { profile, experience, skills, education, projects, sidebar, coverLetter };
}

async function build() {
  const buildStart = Date.now();
  debug(`Build started at ${new Date(buildStart).toLocaleTimeString()}`);

  const outputDir = resolve(root, config.outputDir);
  const baseData = await loadData();
  const variants = await readJson(resolve(root, config.dataDir, 'variants.json'));
  const defaultVariant = variants.find(v => v.default) ?? variants[0];
  const data = applyVariant(baseData, defaultVariant);

  await rmrf(outputDir);
  await mkdirp(outputDir);
  await cpDir(resolve(root, config.cssDir), `${outputDir}/css`);
  await cpDir(resolve(root, config.jsDir), `${outputDir}/js`);
  await cpDir(resolve(root, config.assetsDir), `${outputDir}/assets`);

  debug('Rendering index.html');
  const indexTemplatePath = resolve(root, config.templateDir, 'index.ejs');
  const html = await renderTemplate(indexTemplatePath, { ...data, formatDate });
  await writeFile(`${outputDir}/index.html`, html);

  const buildEnd = Date.now();
  debug(`Build Complete (${((buildEnd - buildStart) / 1000).toFixed(2)}s)\n`);
}

await build();
