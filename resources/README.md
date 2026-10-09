# Resources

Source files for images used outside the CV itself, such as profile banners. Each one is an SVG so it can be edited as text and re-exported at any size.

## Export a PNG

Headless Chrome renders the SVG with its web fonts. Set the window to the SVG's own width and height:

```shell
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --hide-scrollbars \
  --window-size=1584,396 --virtual-time-budget=5000 \
  --screenshot=linkedin.png "file://$PWD/resources/banners/linkedin.svg"
```

Exported PNGs are not committed.

| File                   | Size     | Used on                     |
| ---------------------- | -------- | --------------------------- |
| `banners/linkedin.svg` | 1584x396 | LinkedIn profile background |
