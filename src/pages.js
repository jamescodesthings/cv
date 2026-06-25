import Debug from 'debug';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { cpDir, mkdirp, writeFile } from './utils.js';

const debug = Debug('cv:pages');
debug.enabled = true;

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

async function buildPages() {
  debug('Building pages output...');

  const outputDir = resolve(root, 'public');
  const pagesDir = resolve(root, 'pages');

  await mkdirp(pagesDir);
  await cpDir(outputDir, pagesDir);

  // No CNAME — cv repo uses subpath routing via jamescodesthings.github.io/cv
  await writeFile(`${pagesDir}/.nojekyll`, '');

  debug('Pages build complete! Output in: %s', pagesDir);
}

await buildPages();
