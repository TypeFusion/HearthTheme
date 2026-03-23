# Hearth Theme Baseline

Updated: 2026-03-23

## 1) Design Intent

Hearth uses one semantic language across four variants:

- Dark mode (`Hearth Dark`): soot blackboard, chalk-like glyphs, ember highlights; tuned as a daily driver for mixed-light environments.
- Dark Soft (`Hearth Dark Soft`): same semantic roles with softer substrate contrast; tuned for night work and low-stimulation focus.
- Light mode (`Hearth Light`): parchment base, walnut ink text, brass/ember accents; tuned for daytime office and document-dense reading.
- Light Soft (`Hearth Light Soft`): same light-mode semantics with calmer daytime contrast; tuned for long daytime sessions.

Role parity is mandatory: syntax roles keep the same meaning across all variants; tuning is mainly via lightness/chroma, with bounded hue compensation when readability requires it.

## 2) Semantic Color Matrix

| Role | Dark | Dark Soft | Light | Light Soft | Narrative Role |
| --- | --- | --- | --- | --- | --- |
| background | `#23201c` | `#2b2926` | `#ece2d3` | `#dfd2be` | Blackboard vs parchment substrate |
| foreground | `#d3c9b8` | `#d3c9b8` | `#2a1e0f` | `#4b3a27` | Chalk ink vs walnut ink |
| keyword | `#c26f59` | `#cb6d4e` | `#a33a2f` | `#ab5b47` | Ember red control-flow anchors |
| operator | `#8f846f` | `#8f846f` | `#6a5d42` | `#61563e` | Low-noise brass connective symbols |
| function | `#7f97ae` | `#8a9fb2` | `#406074` | `#43646f` | Denim-blue callable targets as restrained cool anchors |
| method | `#c0a37a` | `#c2ab8c` | `#8f5864` | `#895f65` | Warm sand method calls for relaxed action emphasis |
| property | `#889566` | `#929d73` | `#305443` | `#3e655a` | Olive member access cues to keep structure low-stimulus |
| string | `#94ab78` | `#9bb17f` | `#5e7342` | `#697a54` | Muted olive literal content for calm scan rhythm |
| number | `#ba846d` | `#cc8664` | `#b36938` | `#b86b3f` | Terracotta numeric constants |
| type | `#857f9d` | `#8f88a4` | `#635276` | `#716883` | Smoked violet structural symbols with restrained chroma |
| variable | `#d0cbc5` | `#cbc7c1` | `#5a3c28` | `#654a35` | Neutral content carrier |
| comment | `#6b5f4d` | `#6b5f4d` | `#847257` | `#887861` | Intentionally quiet guidance layer |

## 3) Readability Budget (Theme Audit Gates)

The following thresholds are enforced by `scripts/theme-audit.mjs`.

| Check | Target |
| --- | --- |
| editor fg/bg contrast | `>= 7.0` |
| comment contrast window | `2.2 - 4.2` |
| operator contrast window | `2.8 - 6.2` |
| minimum role separation (`deltaE`) | `>= 10` |
| method/property critical separation (`deltaE`) | `>= 10` |
| operator/comment critical separation (`deltaE`) | `>= 4.5` (`light`/`lightSoft` use `>= 5.0`) |
| cross-theme role hue drift (comment/keyword/operator/string/number/type/variable/method/property) | `<= 45 deg` |
| light function/background hue distance | `>= 3 deg` |
| light function anchor separation (`deltaE` vs keyword/number/tag) | `>= 18` |
| function cool-hue band (dark/darkSoft/light/lightSoft) | `208-224 / 208-224 / 184-222 / 184-222 deg` |
| variable/parameter near-foreground deltaE | `dark 3-12, darkSoft 3-12, light 6-22, lightSoft 5-14` |
| function critical separation deltaE | `keyword>=18, number>=14, tag>=18, variable>=14` |

Current snapshot from audit:

- dark fg/bg: `9.9`
- dark soft fg/bg: `8.9`
- light fg/bg: `12.7`
- light soft fg/bg: `7.3`
- dark comment: `2.6`
- dark soft comment: `2.3`
- light comment: `3.6`
- light soft comment: `2.9`
- dark operator: `4.4`
- dark soft operator: `3.9`
- light operator: `5.0`
- light soft operator: `4.8`

## 4) Token Coverage Standard

Theme releases must keep both layers aligned:

- TextMate token coverage: `comment keyword operator function string number type variable property`
- Semantic token alignment: `keyword function enumMember type variable property`
- Semantic/TextMate drift should stay visually close (audit warns when drift grows)

## 5) Stable Change Protocol

All palette changes must follow this order:

1. Edit semantic role palette: `color-system/semantic.json`.
2. If role mapping changes, update `color-system/adapters.json` in the same PR.
3. If variant registration/path rules change, update `color-system/variants.json`.
4. If compensation/chroma policy changes, update `color-system/tuning.json` in the same PR.
5. If this is a UI/chrome baseline shift, update `color-system/hearth-dark.source.json`.
6. If this is a deliberate derivation reset, update templates in `color-system/templates/*.base.json` in the same PR.
7. Run `pnpm run sync` (this regenerates `themes/*.json` and all downstream artifacts).
8. Run `pnpm run check:sync` (must be clean right after sync).
9. Run `pnpm run audit:generated-origin` (generated outputs must be backed by changes in `color-system/` or `scripts/`).
10. Run `pnpm run audit:all` (`theme + copy + claims + generated-origin + cjk + release`).
11. Check fixtures in `fixtures/theme-audit/` (TS/Python/Rust/Go/JSON/Markdown).
12. If thresholds or governance changed, update this document and audit scripts in the same PR.
13. If you are releasing extension metadata/theme changes, update `extension/CHANGELOG.md` in the same PR.

One-shot alternative:

- `pnpm run release:theme` (runs audit, build/sync, and preview generation)

## 6) PR Acceptance Checklist

- `color-system/semantic.json` is the semantic color authority.
- `color-system/adapters.json` is the adapter contract authority.
- `color-system/variants.json` is the variant/output routing authority.
- `color-system/tuning.json` is the algorithmic compensation authority.
- `color-system/hearth-dark.source.json` is the UI/chrome baseline source.
- `themes/hearth-dark.json`, `themes/hearth-dark-soft.json`, `themes/hearth-light.json`, and `themes/hearth-light-soft.json` are regenerated artifacts.
- `color-system/templates/*.base.json` are updated only when intentionally changing derivation baseline.
- `src/data/tokens.ts` regenerated via sync script.
- `src/styles/theme-vars.css` regenerated via sync script.
- `extension/package.json` `galleryBanner.color` matches `themes/hearth-dark.json` background.
- `docs/theme-baseline.md` semantic matrix + snapshot lines are in sync with current themes.
- `pnpm run check:sync` passes (no generated drift after sync).
- `pnpm run audit:generated-origin` passes (generated outputs are source-linked).
- `pnpm run audit:theme` passes without blocking issues.
- `pnpm run audit:copy` passes (variant count + color copy + README metrics parity).
- `pnpm run audit:copy` also enforces "no hardcoded color literals" in site source files.
- `pnpm run audit:claims` passes (no stale or misleading public claims).
- `pnpm run audit:cjk` passes without typography regressions.
- `pnpm run build` passes and static pages can be generated.
- Local git hooks are enabled (`pnpm install` runs `prepare` to install Husky).
- Any warnings are explicitly accepted with rationale in PR notes.
- `extension/CHANGELOG.md` is updated when extension metadata/themes are changed.

## 7) Change History

Website `/docs` change history is sourced from `extension/CHANGELOG.md` to stay aligned with Marketplace releases.

- Full history source: `extension/CHANGELOG.md`
- Live docs page preview: `/docs`
