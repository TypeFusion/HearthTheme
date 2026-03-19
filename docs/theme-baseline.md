# Hearth Theme Baseline

Updated: 2026-03-19

## 1) Design Intent

Hearth uses one semantic language across both modes:

- Dark mode: soot blackboard, chalk-like glyphs, ember highlights.
- Light mode: parchment base, walnut ink text, brass/ember accents.
- Role parity: the same syntax role keeps the same meaning in both modes; only lightness/saturation shifts.

## 2) Semantic Color Matrix

| Role | Dark | Light | Narrative Role |
| --- | --- | --- | --- |
| background | `#161411` | `#f2eadc` | Blackboard vs parchment substrate |
| foreground | `#d6cab4` | `#2f210e` | Chalk ink vs walnut ink |
| keyword | `#d0653b` | `#8f1f00` | Ember red, control-flow anchors |
| operator | `#a8824e` | `#755f33` | Low-noise brass connective symbols |
| function | `#ddb06a` | `#5a3900` | Brass amber, callable targets |
| string | `#87ab70` | `#2e6a2c` | Moss green, literal content |
| number | `#c66a52` | `#b24724` | Terracotta numeric constants |
| type | `#79a8a2` | `#0d6378` | Mineral teal, structural symbols |
| variable | `#c1b59f` | `#3b2c18` | Neutral content carrier |
| comment | `#6b5f4d` | `#847257` | Intentionally quiet guidance layer |

## 3) Readability Budget (Theme Audit Gates)

The following thresholds are enforced by `scripts/theme-audit.mjs`.

| Check | Target |
| --- | --- |
| editor fg/bg contrast | `>= 7.0` |
| comment contrast window | `2.2 - 4.2` |
| operator contrast window | `2.8 - 6.2` |
| minimum role separation (`deltaE`) | `>= 10` |
| cross-theme role hue drift | `<= 45°` |

Current snapshot from audit:

- dark fg/bg: `11.4`
- light fg/bg: `13.1`
- dark comment: `2.9`
- light comment: `3.9`
- dark operator: `5.2`
- light operator: `5.1`

## 4) Token Coverage Standard

Theme must keep both layers aligned:

- TextMate token coverage: `comment keyword operator function string number type variable property`
- Semantic token alignment: `keyword function enumMember type variable property`
- Semantic/TextMate drift should stay visually close (audit warns when drift grows)

## 5) Stable Change Protocol

All palette changes must follow this order:

1. Edit only source themes in `themes/`.
2. Run `node scripts/sync-themes.mjs`.
3. Run `npm run audit:theme`.
4. Check fixtures in `fixtures/theme-audit/` (TS/Python/Rust/Go/JSON/Markdown).
5. Run `npm run changelog:draft` (or `npm run changelog:append -- vX.Y.Z`) to generate/update history entry. For custom compare ranges, use `node scripts/changelog-draft.mjs --from HEAD~1 --to HEAD --ver vX.Y.Z`.
6. Add a versioned entry to `src/data/themeChangelog.ts`.
7. If thresholds or governance changed, update this document and `scripts/theme-audit.mjs` together in the same PR.

One-shot alternative:

- `npm run release:theme -- vX.Y.Z` (runs audit, build/sync, and changelog append in order)

## 6) PR Acceptance Checklist

- `themes/hearth-dark.json` and `themes/hearth-light.json` preserve role parity.
- `src/data/tokens.ts` regenerated via sync script.
- `npm run audit:theme` passes without blocking issues.
- `npm run build` passes and static pages can be generated.
- Any warnings are explicitly accepted with rationale in PR notes.
- `src/data/themeChangelog.ts` includes a clear versioned entry for this change.
- Visual review confirms “blackboard + parchment” atmosphere remains intact.

## 7) Change History

Structured history is maintained in `src/data/themeChangelog.ts` and rendered in `/docs`.

- 2026-03-19 `v0.4.3`: Added auto-generated changelog draft/append workflow.
- 2026-03-19 `v0.4.2`: Added audit script, fixtures, and CI guardrails.
- 2026-03-19 `v0.4.1`: Reduced long-session noise by dimming comments/operators.
- 2026-03-19 `v0.4.0`: Unified blackboard + parchment language across dark/light modes.
