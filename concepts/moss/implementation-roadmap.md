# Signal Implementation Roadmap

## Current State

`Signal` already has:

- product philosophy
- positioning
- taxonomy
- family foundation
- semantic rules
- surface / interface / interaction drafts
- guidance / feedback / terminal drafts
- variant knob draft
- one dark flagship palette concept
- one visual preview mockup

This means the concept is no longer just an idea.
It is now a scheme-ready draft that has not yet been admitted into the production pipeline.

## Next Translation Steps

### Step 1: Review the dark flagship direction

Focus only on the flagship dark climate and answer:

- does it feel clearly different from Hearth?
- does it feel more energetic rather than merely cooler?
- do `keyword`, `function`, and `type` now form a stronger recognition triangle?

If the answer is not clearly yes, the palette should be revised before any pipeline migration.

### Step 2: Tighten family ownership

Before production migration:

- confirm whether `citron` owns `type` long-term
- confirm whether `jade` should own both `string` and `property`
- confirm whether `spark` is hot enough without becoming noisy
- confirm whether `voltage` is strong enough to be the main callable anchor

This is the last clean stage to change semantic family ownership without downstream churn.

### Step 3: Promote into `color-system/schemes/moss/`

When the concept is ready:

1. copy the concept files into `color-system/schemes/moss/`
2. add any missing compatibility or rule files
3. keep `signal` out of product release metadata until smoke checks pass

The migration should be a file move plus final tuning, not a redesign.

### Step 4: Run scheme-level validation

After promotion:

- run source-layer audit
- run scheme smoke checks
- generate local theme JSON only for `signal`
- inspect dark first, then soft, then light

Do not try to tune all four climates at once.

### Step 5: Build the flagship variant first

Priority order should be:

1. `dark`
2. `darkSoft`
3. `light`
4. `lightSoft`

The flavor only deserves to exist if `dark` is compelling first.

### Step 6: Add brand-facing preview and copy

Once the scheme survives smoke checks:

- create a proper preview image
- add website-facing flavor copy
- explain `Signal` as a different working posture, not as an alternate color pack

## Release Gate

Do not ship `Signal` publicly until all of these are true:

1. It is unmistakably not Hearth.
2. It still feels authored by the same system.
3. Its soft variants do not collapse into muted calm.
4. Its light variants keep structural pop.
5. It can be explained as a real product choice.
