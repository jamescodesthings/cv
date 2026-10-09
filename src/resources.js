import { execFileSync } from 'child_process';
import { readdirSync, readFileSync } from 'fs';
import { resolve, dirname, join } from 'path';
import { fileURLToPath } from 'url';

// Exports every SVG under resources/ to a PNG beside it, at the SVG's own width and height.
// Headless Chrome is used because it loads the web fonts and renders the masks and patterns
// exactly as a browser does, which Illustrator and Preview don't.
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const chrome = process.env.CHROME ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

function svgFiles(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return svgFiles(path);
    return entry.name.endsWith('.svg') ? [path] : [];
  });
}

for (const svg of svgFiles(resolve(root, 'resources'))) {
  const [, width, height] = readFileSync(svg, 'utf-8').match(/<svg[^>]*width="(\d+)"[^>]*height="(\d+)"/) ?? [];
  if (!width) {
    console.error(`Skipping ${svg}: no width and height on the <svg> element`);
    continue;
  }
  const png = svg.replace(/\.svg$/, '.png');
  execFileSync(
    chrome,
    [
      '--headless=new',
      '--hide-scrollbars',
      `--window-size=${width},${height}`,
      '--virtual-time-budget=5000',
      `--screenshot=${png}`,
      `file://${svg}`,
    ],
    { stdio: 'ignore' },
  );
  console.log(`${png} (${width}x${height})`);
}
