# Charlize Vogelsinger — portfolio

Tiny public Astro showcase, deployed to GitHub Pages.

**Live:** https://xyzcharlize.github.io/website/

## Spine (start here)

The portfolio is held together by the spine architecture:

- [`spine/spine.json`](spine/spine.json) — box, red thread, pillars, metaphor, glossary anchors
- [`spine/glossary.json`](spine/glossary.json) — SME meanings ledger
- [`spine/README.md`](spine/README.md) — how pages, golden cut, and glossary map together

Edit the spine first. Surfaces read from it via `src/lib/spine.ts` / `src/lib/glossary.ts`.

Visually the spine is the golden cut. In words it is `spine.thread`. Vocabulary obeys the glossary (`defined` + `text` only).

## Local

```bash
npm install
npm run dev
```

Open the printed URL (base path is `/website`).

```bash
npm run build
npm run preview
```

## Deploy

Push to `main`. The workflow [`.github/workflows/deploy-pages.yml`](.github/workflows/deploy-pages.yml) builds and deploys via GitHub Actions.

In the repo settings, set **Pages → Source** to **GitHub Actions**.
