# Agent notes

## Spine first

Before changing copy, positioning, or page structure, read the spine:

- [`spine/README.md`](spine/README.md) — architecture of this portfolio
- [`spine/spine.json`](spine/spine.json) — box, red thread, pillars, metaphor, glossary anchors
- [`spine/glossary.json`](spine/glossary.json) — SME meanings ledger

The spine is the source of truth. Pages import it through [`src/lib/spine.ts`](src/lib/spine.ts) and [`src/lib/glossary.ts`](src/lib/glossary.ts). Do not invent a second positioning story in a page.

- **Visual spine:** golden cut — [`src/components/GoldenCut.astro`](src/components/GoldenCut.astro)
- **Verbal maturity:** spiral to focus — [`src/components/AiSpiral.astro`](src/components/AiSpiral.astro)
- **Vocabulary:** glossary forms only when `state` is `defined` with `text`. Never invent a meaning for a term that has no `text`.

Edit `spine/spine.json` first when the red thread, box, or pillars change. Keep public surfaces inside `constraints.public` (no employer or client names, no invented claims, glossary discipline).

## Local

```bash
npm install
npm run dev
# base path /website
npm run build && npm run preview
```

## Deploy

GitHub Actions: [`.github/workflows/deploy-pages.yml`](.github/workflows/deploy-pages.yml). Pages source must be **GitHub Actions**.
