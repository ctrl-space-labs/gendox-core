# Gendox documentation

The source of [docs.gendox.dev](https://docs.gendox.dev), built with [Docusaurus](https://docusaurus.io/).

| Folder | Contents |
|---|---|
| `docs/` | The documentation pages, one folder per section. Images are in each section's `img/` folder. |
| `blog/` | Release notes and news. |
| `static/` | Files served as they are: images, `llms.txt`, and the Agent Skills under `skills/`. |
| `src/` | Custom CSS and components. |

How to write pages and capture screenshots and GIFs: [AGENTS.md](./AGENTS.md).

## Run it locally

```bash
npm install
npm start          # http://localhost:4000, reloads as you edit
```

## Build

```bash
npm run build      # static site in build/
npm run serve      # serve the build locally
```

The build fails on broken links, so run it before you push.

## Deployment

The site is deployed to Cloudflare Pages at https://docs.gendox.dev.
