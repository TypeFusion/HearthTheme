# Second Flavor Brief

Updated: 2026-04-05

## 1) Working Goal

The second public flavor must be obviously different from `HearthCode` within a single screen.

That difference should come from:

- stronger landmark contrast
- faster syntax recognition
- sharper semantic jumps
- higher local energy

That difference should not come from:

- painting the whole substrate with a personality hue
- drifting into novelty-theme spectacle
- becoming a small hue-shift variant of `Hearth`

## 2) Product Position

### HearthCode

Hearth is the steady line:

- warm-neutral
- long-session friendly
- low-glare
- composed
- reading-first

### Second Flavor

The second flavor should be the active line:

- cooler-neutral substrate
- stronger visual landmarks
- quicker scanning
- more vivid semantic peaks
- implementation-first

If Hearth is the flavor users choose to settle in, the second flavor should be the one they choose when they want the editor to feel more awake and responsive.

## 3) User Need

The second flavor should serve users who often feel one or more of the following:

- warm-neutral themes are readable, but too restrained
- they want structure to pop faster in peripheral vision
- they move between files and contexts quickly
- they want a stronger sense of momentum during implementation work
- they prefer clearer role boundaries over atmospheric subtlety

This is not primarily a "preference for blue" or "preference for cool themes" segment.
It is a preference for stronger syntax signal.

## 4) Differentiation Rules

The second flavor should pass all of these checks before palette work is considered successful.

### Recognition

- a screenshot should not be mistaken for `HearthCode`
- the theme should read as more energetic before the user reads any label

### Relationship

- it should still feel authored by the same team
- it should keep the same level of semantic discipline

### Usability

- contrast increases must improve recognition, not cause glare
- vivid roles must still leave neutral space on the page

### Scope

- the difference should be strongest in the flagship dark climate
- the same difference should still survive in soft and light climates

## 5) Role Energy Map

| Role | Hearth tendency | Second flavor target |
| --- | --- | --- |
| `background` | warm paper / soot support | cooler neutral frame, still controlled |
| `foreground` | chalk-walnut carrier | cleaner, firmer carrier with slightly sharper edge |
| `keyword` | warm pressure accent | hotter and more immediate control-flow landmark |
| `function` | bounded cool anchor | stronger electric anchor; one of the primary recognizers |
| `method` | warm secondary motion | energetic but subordinate to `function` |
| `property` | muted support structure | clearer than Hearth, but not as loud as keyword/function |
| `string` | calm reading rhythm | fresher and brighter; should help scanning literals sooner |
| `type` | dry structural classification | clearly separated from both keyword and function |
| `number` | warm detail accent | punchier and more visible in quick scanning |
| `comment` | soft guidance layer | still quiet; must not join the energy race |
| `variable` | neutral information carrier | mostly restrained; should preserve page stability |

The key shift is not that every role gets louder.
The key shift is that the most important landmarks get farther apart.

## 6) Chroma Budget

Use a tiered chroma budget instead of an overall saturation lift.

### Tier A: primary recognizers

- `keyword`
- `function`
- `type`

These roles may carry the strongest personality.

### Tier B: rhythmic support

- `string`
- `number`
- `property`

These roles can be lively, but should not compete with the primary recognizers.

### Tier C: page stabilizers

- `comment`
- `variable`
- `operator`
- surface scaffolding

These should stay disciplined enough to keep the page coherent.

This flavor wins by **peak placement**, not by turning the whole page up.

## 6.1) Preferred Color Lane

The preferred lane for the second flavor is now:

- yellow / yellow-green-led
- with cyan-blue as the main cool anchor
- with coral or orange-red as interruption pressure

Why this lane works:

- it is visibly farther from Hearth's warm-neutral ochre/moss balance
- it creates stronger first-screen recognition
- it supports a more awake and active editing mood
- it can stay mature if the substrate remains neutral

Why this lane is better than olive-led:

- olive-led directions tend to shift atmosphere more than semantics
- yellow-green-led directions can create clearer role energy without repainting the whole screen

The yellow-green here should behave more like a signal family than a natural-material family.

## 7) Contrast Model

The second flavor should be contrast-forward in a targeted way.

Recommended rules:

- raise contrast around primary recognizers, not around every role
- keep comments and secondary carriers within calm windows
- preserve enough midtone structure that soft variants do not collapse into fog
- ensure `function` and `keyword` are immediately separable from background and from each other

The theme should feel sharper because the important landmarks are clearer, not because everything is brighter.

## 8) Surface Model

The substrate should support the product voice without becoming the main source of personality.

Recommended behavior:

- dark flagship: graphite / carbon / smoked neutral
- dark soft: quieter carbon, not muddy charcoal
- light: studio paper with cleaner brightness than Hearth
- light soft: soft bright neutral, not parchment nostalgia

The second flavor should avoid:

- heavy color-cast backgrounds
- cinematic haze
- sepia warmth
- decorative substrate personality

The background is infrastructure.
The syntax is where the product should speak.

## 9) UI Direction

The product's website, preview image, and extension metadata should reinforce the same design shift.

### Preview behavior

- lead with a dark flagship screenshot
- show a sharper landmark hierarchy than Hearth
- avoid making the preview look like a neon novelty piece

### Website language

- emphasize energy, recognition, and momentum
- avoid overusing words like calm, quiet, grounded, paper, hearth, glow

### Installation guidance

Position the second flavor as:

- the faster, more vivid option
- not the "edgier color variant"

## 10) Anti-Drift Rules

During palette work, reject any direction that:

- could plausibly be described as "Hearth but cooler"
- gets most of its identity from background tint
- raises saturation everywhere at once
- looks exciting in preview but tiring in real code
- loses the editor-level discipline visible in Hearth
- drifts back into muted olive or stone-neutral territory

## 11) Acceptance Criteria

Before this becomes a real scheme, the design should be able to answer "yes" to all of the following.

1. Is the flavor visibly different from Hearth in one screenshot?
2. Is the difference coming mainly from semantic energy, not substrate mood?
3. Are keyword/function/type clearly more distinguishable than in Hearth?
4. Does the page still contain enough neutral space to work daily?
5. Do the soft variants still feel more alive than Hearth soft variants?
6. Could this be explained to a user as a real product choice, not a palette experiment?

## 12) Recommended Build Order

1. Lock the product thesis.
2. Lock a working codename.
3. Define role-energy priorities.
4. Design one dark flagship palette.
5. Verify that it is unmistakably not Hearth.
6. Only then translate it into scheme files and climate variants.

This order matters.

The second flavor should be created as a differentiated product first, and only afterward as a generated color system artifact.
