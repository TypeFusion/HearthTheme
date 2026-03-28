# HearthCode Maintainer Guide

This document is the maintainer-facing workflow reference.
Public-facing messaging belongs on the website and README; operational details stay here.

## Source-of-Truth Map

- Core color language inputs: `color-system/semantic.json`, `color-system/adapters.json`, `color-system/variants.json`, `color-system/tuning.json`
- Canonical release version: `releases/color-language.json`
- Generated theme payloads: `themes/`, `public/themes/`, `extension/themes/`, `obsidian/themes/`, `obsidian/app-theme/`
- Generated site/report outputs: `src/data/tokens.ts`, `src/styles/theme-vars.css`, `docs/theme-baseline.md`, `docs/color-language-report.md`, `reports/color-language-consistency.json`, `reports/theme-audit-interaction.json`, `reports/theme-audit-interaction.md`
- Extension release metadata: `extension/package.json`, `extension/CHANGELOG.md`

## Required Local Workflow

1. Update color-system inputs in `color-system/*`.
2. Run `pnpm run sync`.
3. Run `pnpm run preview:generate` if preview assets are affected.
4. Run `pnpm run check:sync`.
5. Run `pnpm run check:preview`.
6. Run `pnpm run audit:generated-origin`.
7. Run `pnpm run audit:all`.
8. Commit source + generated outputs together.

## Versioning and Release

- Bump release version from the canonical file: `pnpm run bump:release:patch` (or `minor` / `major`).
- The bump command synchronizes `releases/color-language.json` and `extension/package.json`, and ensures a changelog heading exists.
- Before publishing, replace placeholder notes in the top changelog section (release audit blocks `Update notes pending`).
- Obsidian package release (local): `pnpm run release:obsidian`.
- Optional snippets-only package: `pnpm run pack:obsidian:snippets`.

## CI and Publishing

- Main workflow: `.github/workflows/publish.yml`.
- `verify` gate requires clean generated outputs (`check:sync`, `check:preview`) and all audits.
- Marketplace/Open VSX jobs skip when the same version already exists and only docs/images changed.
- GitHub release job publishes release assets after verification.

## External Registry Reference

- Obsidian community theme index source: <https://github.com/obsidianmd/obsidian-releases/blob/master/community-css-themes.json>
