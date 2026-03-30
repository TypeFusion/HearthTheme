# HearthCode Maintainer Guide

This document is the operational reference for maintaining the color-language pipeline.

Public messaging belongs in the scheme philosophy and README.
This guide is about source layers, generation order, and release discipline.

## 1. Source-of-Truth Map

### Scheme Layer

- `color-system/active-scheme.json`
- `color-system/schemes/hearth/scheme.json`
- `color-system/schemes/hearth/philosophy.md`

### Color Language Core

- `color-system/schemes/hearth/foundation.json`
- `color-system/schemes/hearth/semantic-rules.json`
- `color-system/schemes/hearth/surface-rules.json`
- `color-system/schemes/hearth/interaction-rules.json`

### Shared Framework

- `color-system/framework/variant-profiles.json`
- `color-system/framework/variants.json`
- `color-system/framework/adapters.json`
- `color-system/framework/tuning.json`

### Migration Anchors / Compatibility Baselines

- `color-system/hearth-dark.source.json`
- `color-system/templates/*.base.json`

### Generated Outputs

- `color-system/semantic.json`
- `themes/`
- `public/themes/`
- `extension/themes/`
- `obsidian/themes/`
- `obsidian/app-theme/`
- `src/data/tokens.ts`
- `src/styles/theme-vars.css`
- `docs/theme-baseline.md`
- `docs/color-language-report.md`
- `reports/color-language-lineage.json`
- `reports/color-language-consistency.json`

### Release Metadata

- `releases/color-language.json`
- `extension/package.json`
- `extension/CHANGELOG.md`

## 2. Editing Policy

Normal order of operations:

1. scheme manifest / philosophy
2. foundation
3. semantic rules
4. surface rules
5. interaction rules
6. variant profiles
7. adapters
8. tuning
9. migration anchors only if the change is truly platform-compatibility work

Do not directly edit generated artifacts.

`color-system/semantic.json` is a generated snapshot.
It is not a source file.

## 3. Required Local Workflow

1. Update scheme/core/framework inputs.
2. Run `pnpm run sync`.
3. Run `pnpm run preview:generate` if preview assets are affected.
4. Run `pnpm run check:sync`.
5. Run `pnpm run check:preview`.
6. Run `pnpm run audit:generated-origin`.
7. Run `pnpm run audit:all`.
8. Run `pnpm run build`.
9. Commit source and generated outputs together.

## 4. Interpretation Rules

- `adapters.json` is a platform contract file, not a design file.
- `tuning.json` is a calibration file, not a palette-definition file.
- `hearth-dark.source.json` is a migration anchor, not the final philosophical authority.
- lineage must be able to explain every generated downstream token.

If a change cannot be explained in lineage, the change is not in a good state.

## 5. Versioning and Release

- Bump release version from the canonical file: `pnpm run bump:release:patch` (or `minor` / `major`).
- The bump command synchronizes `releases/color-language.json` and `extension/package.json`, and ensures a changelog heading exists.
- Before publishing, replace placeholder notes in the top changelog section.
- Obsidian package release (local): `pnpm run release:obsidian`.
- Optional snippets-only package: `pnpm run pack:obsidian:snippets`.

## 6. CI and Publishing

- Main workflow: `.github/workflows/publish.yml`
- `verify` requires clean generated outputs and all audits passing.
- Marketplace / Open VSX jobs skip when the same version already exists and only docs or preview assets changed.
- GitHub release job publishes release assets after verification.
