![Website](https://img.shields.io/website?url=https%3A%2F%2Fcodesthings.com&style=for-the-badge)
 ![GitHub Actions Workflow Status](https://img.shields.io/github/actions/workflow/status/jamescodesthings/cv/deploy.yml?style=for-the-badge) ![GitHub License](https://img.shields.io/github/license/jamescodesthings/cv?style=for-the-badge)

The CV of James Macmillan (@JamesCodesThings) live at [codesthings.com/cv](https://codesthings.com/cv)

> A simple static site builder and PDF generator that uses Node.js and a handful of tools to generate my CV

If you're here to poke around my github account, here's some highlights of my other projects:

- [codesthings.com](https://github.com/jamescodesthings/jamescodesthings.github.io) - The base website that runs on codesthings.com, which is another static builder pattern
- [campsnap](https://github.com/jamescodesthings/campsnap) - This is a cool recent side project; the de-facto filter pack for the [Campsnap CS-Pro](https://www.campsnapphoto.com/products/cs-pro-camera) camera. You'll never guess how the website is built :grin:
- [ZeroCalc](https://codesthings.com/blog/2026-05-01-zerocalc.html) - A blog post on how I put together a standalone [pico-8](https://www.lexaloffle.com/pico-8.php) dev handheld
- [Makerworld: @jamescodesthings](https://makerworld.com/en/@jamescodesthing) - The things I've 3D Modelled for 3D printing. A mixture of Fusion 360, Blender, OnShape and Shapr3D models.

# Usage

```shell
# Run a dev server with watcher (no hot reload)
make dev

# Build the site for production
make build

# Build pdfs
make pdf

# Build gh-pages site
make pages
```
