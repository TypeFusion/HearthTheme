# HearthCode Color Language Spec

This document defines HearthCode as a cross-platform color language system.

## 1. Product Boundary

HearthCode is not a single platform theme package.
It is a semantic color language that is adapted to multiple surfaces:

- VS Code / Open VSX extension theme payload
- Obsidian app-theme payload
- Website and docs presentation surfaces

Platform files are delivery artifacts. Semantic role mapping is the source-of-truth.
Authoring source files live under `color-system/`.

Current source files:

- `color-system/semantic.json` (role -> variant palette values)
- `color-system/adapters.json` (role -> TextMate / semantic / Obsidian / web mappings)
- `color-system/variants.json` (variant registry + output wiring)
- `color-system/tuning.json` (algorithmic compensation + soft chroma budgets)
- `color-system/hearth-dark.source.json` (UI/chrome baseline source)

## 2. Token Architecture

HearthCode uses four token layers:

1. `Core Tokens`
- Perceptual anchors: background, foreground, border, accent, status.

2. `Semantic Tokens`
- Meaning roles: `keyword`, `function`, `type`, `variable`, `property`, `string`, `number`, `comment`, `operator`, `tag`.

3. `Platform Alias Tokens`
- Platform-specific variable keys that map to the semantic roles.
- Examples:
  - VS Code semantic keys (for example `function`, `type`, `property`)
  - Obsidian CSS variables (for example `--code-function`, `--code-important`, `--code-property`)
  - Web token aliases (for example `fn`, `type`, `variable`)

4. `Output Artifacts`
- Generated, publishable files:
  - `themes/*.json`
  - `extension/themes/*.json`
  - `obsidian/themes/*.css`
  - `obsidian/app-theme/theme.css`
  - `src/data/tokens.ts`

## 3. Semantic Contract

Each semantic role must satisfy:

- **Role stability**: meaning remains consistent across all variants.
- **Cross-theme continuity**: dark/light pair drift should stay controlled for stable roles; light variants may use polarity compensation on selected roles (for example `function`) when readability gains are measurable.
- **Readability floor**: foreground/background contrast and role separability remain above guardrails.
- **Adapter parity**: VS Code TextMate roles and semantic token roles should remain aligned.

## 4. Variants

HearthCode variants:

- `dark`
- `darkSoft`
- `light`
- `lightSoft`

All variants share one semantic hierarchy with different contrast texture and environment tuning.

## 5. Change Policy

When changing colors:

1. Change semantic role colors in `color-system/semantic.json`.
2. If role mapping changes, update `color-system/adapters.json` in the same change set.
3. If variant registration/paths change, update `color-system/variants.json`.
4. If compensation/chroma policy changes, update `color-system/tuning.json`.
5. If UI/chrome baseline shifts, update `color-system/hearth-dark.source.json`.
6. If the derivation baseline itself changes, update `color-system/templates/*.base.json` in the same change set.
7. Regenerate platform artifacts via `pnpm run sync`.
8. Review generated consistency report:
  - `docs/color-language-report.md`
  - `reports/color-language-consistency.json`
8. Run full audits (`pnpm run audit:all`) before release.

## 6. Release Narrative

Release notes should separate:

- `Color Language Changes` (semantic-level decisions)
- `Platform Adapter Changes` (distribution/runtime adaptation)

This keeps HearthCode positioned as a color-language product rather than a single theme package.
