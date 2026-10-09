import { execFileSync } from 'child_process';
import { readdirSync, rmSync, mkdirSync } from 'fs';
import { resolve, dirname, basename } from 'path';
import { fileURLToPath } from 'url';

// Renders every PDF in public/assets to PNGs in .preview/, one per page, so a layout change
// can be checked without opening each PDF. Needs poppler's pdftoppm on the host.
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const assetsDir = resolve(root, 'public/assets');
const previewDir = resolve(root, '.preview');

const pdfs = readdirSync(assetsDir).filter(file => file.endsWith('.pdf'));
if (pdfs.length === 0) {
  console.error('No PDFs in public/assets. Run `make pdf` first.');
  process.exit(1);
}

rmSync(previewDir, { recursive: true, force: true });
mkdirSync(previewDir);

for (const pdf of pdfs) {
  const prefix = resolve(previewDir, basename(pdf, '.pdf'));
  execFileSync('pdftoppm', ['-png', '-r', '60', resolve(assetsDir, pdf), prefix]);
}

console.log(
  readdirSync(previewDir)
    .map(file => `.preview/${file}`)
    .join('\n'),
);
