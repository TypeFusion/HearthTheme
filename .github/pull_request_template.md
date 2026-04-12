## Theme Change Checklist

- [ ] I edited source-of-truth inputs under `color-system/*` and/or generator logic under `scripts/*` (not hand-editing generated artifacts only).
- [ ] I ran `pnpm run sync` and included all generated updates (`themes`, `packages/site/public/themes`, `packages/extension/themes`, `obsidian/themes`, `obsidian/app-theme`, `packages/site/src/data/tokens.ts`, `packages/site/src/styles/theme-vars.css`, `docs/theme-baseline.md`, `docs/color-language-report.md`, `reports/color-language-consistency.json`).
- [ ] I ran `pnpm run audit:generated-origin` and confirmed generated outputs are source-linked (`color-system/` or `scripts/` changed together).
- [ ] I ran `pnpm run audit:all`.
- [ ] I ran `pnpm --filter @hearth/site build`.
- [ ] If this PR updates extension release payload (`packages/extension/themes/*`, `packages/extension/package.json`, `packages/extension/CHANGELOG.md`, `packages/extension/icon.png`), versioning and changelog are release-ready (no placeholder notes).

## Notes

Describe intentional palette/governance changes and any accepted warnings.
