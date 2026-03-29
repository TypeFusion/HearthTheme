# Hearth Theme Baseline

Updated: 2026-03-29

## 1) Design Intent

Hearth uses one warm semantic language across four variants:

- Dark mode (`Hearth Dark`): soot blackboard, chalk-like glyphs, amber-led warmth; tuned as a daily driver for mixed-light environments.
- Dark Soft (`Hearth Dark Soft`): same semantic roles with softer substrate contrast; tuned for night work and low-stimulation focus.
- Light mode (`Hearth Light`): parchment base, walnut ink text, yellow-led warmth with brick-red accents; tuned for daytime office and document-dense reading.
- Light Soft (`Hearth Light Soft`): same light-mode semantics with calmer daytime contrast; tuned for long daytime sessions.

Role parity is mandatory: syntax roles keep the same meaning across all variants. This line runs warm-only (no cool anchor), and tuning is mainly via lightness/chroma with role-weighted exposure balancing, with bounded hue compensation when readability requires it.

## 2) Semantic Color Matrix

| Role | Dark | Dark Soft | Light | Light Soft | Narrative Role |
| --- | --- | --- | --- | --- | --- |
| background | `#211d1a` | `#29211d` | `#e9ded0` | `#e3d7c6` | Soot board base vs parchment desk-paper base |
| foreground | `#d3c9b8` | `#cec5ba` | `#2a1e0f` | `#4d4032` | Chalk-walnut ink readability spine |
| keyword | `#ce5b3f` | `#a86958` | `#b34935` | `#a36050` | Brick-red control-flow anchors (accent only) |
| operator | `#a18d6a` | `#a29485` | `#675844` | `#776859` | Brass connective symbols with low noise |
| function | `#6e97a8` | `#5e8ca1` | `#507282` | `#6a767c` | Denim-blue callable anchors for deliberate contrast |
| method | `#af6b45` | `#8e6a58` | `#936247` | `#866452` | Leather-orange method calls for secondary action |
| property | `#797f5c` | `#7b7965` | `#586047` | `#676b53` | Muted olive member access cues |
| string | `#9aa984` | `#9c9c86` | `#768061` | `#7e8676` | Calm olive literals for reading rhythm |
| number | `#cd854b` | `#b58866` | `#bd7338` | `#b17d56` | Sunset terracotta numeric constants |
| type | `#9b924a` | `#9f9366` | `#7f7030` | `#8a825b` | Dark-ochre structural symbols |
| variable | `#c8bdac` | `#c3bab0` | `#553e2d` | `#645447` | Coffee-neutral information carriers |
| comment | `#74695a` | `#887d70` | `#8a7a65` | `#897e71` | Quiet guidance layer |

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
| light function anchor separation (`deltaE` vs keyword/number/tag) | `>= 10` |
| warm gamut guard | `forbid 170-250 deg (s>=0.08)` |
| red/yellow exposure balance | `frequency-damped chroma + saliency boost (ts/py/go/rust/json/md)` |
| light key pair separation (`deltaE`) | `keyword/tag>=9, comment/type>=8.5, property/string>=8, method/variable>=12` |
| light soft key pair separation (`deltaE`) | `keyword/tag>=7, comment/type>=8, property/string>=6, method/variable>=11` |
| variable/parameter near-foreground deltaE | `dark 3-12, darkSoft 3-12, light 6-22, lightSoft 5-14` |
| function critical separation deltaE | `keyword>=13, number>=11, tag>=12, variable>=13, method>=9` |
| method critical separation deltaE | `variable>=12` |
| property critical separation deltaE | `operator>=9` |
| type critical separation deltaE | `variable>=9, operator>=9` |

Current snapshot from audit:

- dark fg/bg: `10.2`
- dark soft fg/bg: `9.3`
- light fg/bg: `12.3`
- light soft fg/bg: `7.1`
- dark comment: `3.1`
- dark soft comment: `3.9`
- light comment: `3.1`
- light soft comment: `2.8`
- dark operator: `5.2`
- dark soft operator: `5.3`
- light operator: `5.2`
- light soft operator: `3.8`

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
