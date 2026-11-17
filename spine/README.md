# Spine — architecture of this portfolio

This folder is the **architecture** of the portfolio: the red thread through the career, the box people can put Charlize into, the metaphor that holds every page together, and the **glossary** of SME phrases that may appear on the spine.

Edit **`spine.json`** first. Pages and components should read from it. Do not invent a second positioning story in a page.

## What the spine is

| Piece | Role |
| --- | --- |
| **Box** | The short label: *AI-native product engineer* — for software product engineering & enablement. |
| **Thread** | The red thread in words: shipping with coding agents → owning the outcome → teaching the new workflow. |
| **Pillars** | Discover / Build / Test / Own / Teach — SDLC phases plus ownership and enablement on that thread. Optional `samples` are short work samples (no employer or client names). |
| **Glossary** | SME vocabulary ([`glossary.json`](glossary.json)). Print a form only when `state` is `defined` with `text`. |
| **Metaphor** | Visual = golden cut (Phi Grid + Fibonacci spiral). Verbal = spiral to focus (maturity turns). |

Visually the spine is the golden cut. In words it is `spine.thread` and `spine.mantra`. Same architecture, two materials. The glossary is the shared dictionary those words must obey.

## How the site maps to the spine

```
spine/spine.json          ← positioning + which glossary ids sit on the spine
spine/glossary.json       ← SME meanings ledger
        │
        ├─► src/lib/spine.ts / glossary.ts
        ├─► GoldenCut.astro     visual spine (φ composition)
        ├─► AiSpiral.astro      verbal maturity along the spiral
        │
        └─► surfaces (views)
              home           entry composition + proof + spine
              how-i-work     practice architecture
              field-notes    field tests of the spine
              speaking       teach pillar in public
              about          human context around the box
```

Like a software application: `spine.json` is the domain model; `glossary.json` is the controlled vocabulary; Astro pages are UI; the golden cut is the design system’s primary mark.

## Glossary rules

1. `spine/glossary.json` is the SME ledger for this site.
2. Public surfaces may print a registered form **only** when `state` is `defined` and `text` is present.
3. Do not invent a meaning for a term without `text`. Leave it off the site until it has a definition.
4. Attach terms to the spine via `glossary.onSpine` and optional `pillars[].glossary` ids.

## Rules

1. Change positioning in `spine.json`, then let copy flow out.
2. Keep public surfaces inside `constraints.public` (no employer or client names, no invented claims, glossary discipline).
3. The metaphor must stay coherent: do not reintroduce ladder/elevator language; stay on spiral → focus.

## Schema

See `spine.schema.json`. Optional validation:

```bash
npx --yes ajv-cli validate -s spine/spine.schema.json -d spine/spine.json
```
