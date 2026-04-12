# Contributing to HearthTheme

Thanks for helping improve HearthTheme.

## What Is Source of Truth

- Color language inputs: `color-system/semantic.json`, `color-system/framework/adapters.json`, `color-system/framework/variants.json`, `color-system/framework/tuning.json`
- Dark UI baseline: `color-system/ember-dark.source.json`
- Generators and audits: `scripts/*`
- Version source: `releases/color-language.json`

Generated outputs (`themes/*`, `packages/site/public/themes/*`, `packages/extension/themes/*`, `obsidian/*`, reports/docs snapshots) should be produced by scripts, not hand-maintained alone.

## Local Setup

1. Install Node `>=22.12.0` and pnpm.
2. Install dependencies:
   - `pnpm install`

## Required Workflow For Theme/System Changes

1. Edit source-of-truth files (`color-system/*`) and/or generator logic (`scripts/*`).
2. Run `pnpm run sync`.
3. If previews changed, run `pnpm run preview:generate`.
4. Run:
   - `pnpm run check:sync`
   - `pnpm run check:preview`
   - `pnpm run audit:generated-origin`
   - `pnpm run audit:all`
   - `pnpm --filter @hearth/site build`
5. Commit source + generated outputs in one change set.

## Release Notes Requirement

If your PR changes extension release payload (`packages/extension/themes/*`, `packages/extension/package.json`, `packages/extension/CHANGELOG.md`, `packages/extension/icon.png`):

- Keep version metadata consistent (`releases/color-language.json`, `packages/extension/package.json`, changelog top version).
- Do not leave placeholder release notes like `Update notes pending` in the top changelog section.

## Pull Requests

- Use the PR template checklist.
- Include rationale for palette/contrast tradeoffs and any accepted warnings.
- Keep changes scoped and reproducible.
