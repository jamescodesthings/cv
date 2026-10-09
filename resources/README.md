# Resources

Source files for images used outside the CV itself, such as profile banners. Each one is an SVG so it can be edited as text and re-exported at any size.

## Export a PNG

```shell
npm run resources
```

This writes a PNG beside every SVG in `resources/`, at the size set on the `<svg>` element, using headless Chrome. Chrome loads the web fonts and renders the grid pattern and its fade the way a browser does; Illustrator and Preview don't, which is why their exports lose the grid and the title size. Set `CHROME` to the Chrome binary if it isn't at the default macOS path.

Exported PNGs are not committed.

| File                   | Size     | Used on                     |
| ---------------------- | -------- | --------------------------- |
| `banners/linkedin.svg` | 1584x396 | LinkedIn profile background |
