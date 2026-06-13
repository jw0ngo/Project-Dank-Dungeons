# Artist — Memory
*Crystallized, transferable art lessons. Read first each session; append at session end. Self-compact when over 250 lines (merge/supersede/raise-altitude; archive superseded entries to `agents/artist/archive/`).*
*Compacted 2026-06-13 — merged/superseded originals verbatim in `archive/memory-archive-2026-06-13.md`.*

---

### 2026-06-12 — FX cutout decision tree: choose the *medium* by what the FX is, and QA over the dark game bg

- **First fork — pure light, or a coloured object with edges?**
  - **Pure light-on-black (shockwaves, glows, white-hot impacts) → DON'T cut at all.** Additive `'lighter'` *is*
    the background removal. Resize → **floor faint ambient to true black** (`max(R,G,B)≤~8 → 0`, re-floor after
    LANCZOS ringing) → optimize → hand off black-bg + `'lighter'` (the `FP_SPR`/`FW_SPR` pattern). A hard alpha
    cut clips the glow falloff; QA: corners must read `(0,0,0)` or a square wash shows under `'lighter'`.
  - **Coloured object with edges (fire burst, smoke) → cut.** A single FX sprite is NOT a 3×3 variant set
    (`slice-variants.py` is hardcoded `W//3`); the one-cell case is encoded as `tools/slice-single-fx.py`
    (`cut_cell` + `recover_specks` — flying embers ARE the art; `--no-specks` to drop). fx folds by OWNER (not
    derivable from the id) → name `--out-dir assets/fx/<owner>`.
- **Edge-seeded flood keeps the white-hot core for free** — the core is *interior* (never border-connected), so
  the flood never reaches it. Contrapositive: **never `--global` on fire** — a *bright* enclosed region is figure;
  only a genuinely *empty* enclosed gap (inside a drawn bow, a hollow ring's middle) is the `--global` case. The
  bg-leak metric over-reports on fire (cores count as bg-white) — the contact sheet is the verdict.
- **"Transparent" gen art is often an OPAQUE painted near-white checkerboard** — sample a corner first:
  `(254,254,254,255)` means a real bg-removal job, not a trim; find the two checker shades and set `--thresh` to
  catch the darker one (white 254 / grey 241 → ~16+).
- **Fire/smoke defringe ≠ character defringe.** `defringe-sprite.py` clamps edges to a DARK outline tone — right
  for a knight, it would *blacken* a glow. A pale *neutral* halo on fire must fade to **transparent** →
  `slice-single-fx.py --dewhite` (neutral-gated white-spill alpha suppression, `a *= (255-min)/255` only where
  low-saturation, so coloured wisps survive). Diagnose the edge first: neutral-bright = halo → dewhite;
  saturated (e.g. orange `(246,148,129)`) = real flame → leave it.
- **QA over the DARK game bg `(26,26,28)`, not just magenta** — a white halo's worst-contrast case is near-black,
  which magenta hides (3 halos passed magenta; Josh saw them over the real scene). Render is the truth.
- **Compositing is part of the spec and splits by substance:** `'lighter'` erases black → black smoke (chaosfire)
  = NORMAL alpha; bright fire (dragonfire) = additive — name the op per substance in the handoff. Tall FX keep
  native AR (`--frame tight`, not square pad — the engine draws pillars at a fixed `FP_SPRITE_AR`); report the
  ratio. Where an FX *fires* is a design call — deliver the clean asset + key, don't presume the wiring.

### 2026-06-12 — Organizing assets for an AI-native game: foldering is mostly human-readability; machine-value comes from where CODE reasons, or from DERIVING the dimension cheaply

- **Principle:** Before a structural reorg, ask the AI-native question Josh asks — *"does this actually help the
  agents/engine, or is it human cosmetics?"* — and **answer it honestly, don't defend your own work.** A folder
  tree is navigated by humans; an AI navigates by **grep/glob and by the `ART_MANIFEST` *key***, which is built
  by **string concatenation at each draw site** (`'world.tree.'+variant`) and almost never parsed. So foldering
  `assets/` changes only the path *string* → **near-zero machine value on its own**. The machine-useful fact a
  fold *can* add is **membership** (area/owner) — but only if it lands somewhere code/agents read.
- **Why — the resolution that beat both extremes (the "B+" call):** the honest options were (A) area *in the key*
  (`world.<area>.<id>`) — purest but a whole-keyspace rename + every concat site, deploy-gated, typo→silent
  procedural fallback; (B) area in the *folder only* — cheap but invisible to anything reading keys, one `git mv`
  from desync. The winner was **derive the dimension from what you already built**: keep keys flat, and at boot
  parse the foldered **path** (`assets/world/<area>/…`) into a runtime `gAreaAssets` map (~5 lines, pure addition,
  no key/draw churn) — making area queryable *and* unlocking per-area asset load/unload. The fold becomes the
  *data source*, not the deliverable. **Corollary — don't fold what's redundant:** `tile/` by type restates the id
  (`tile.grass.*` already says "grass"), so it stays FLAT. Fold only where the folder adds a NEW machine-legible fact.
- **How to apply:** (a) **assets/ upkeep is a standing Artist responsibility** (`agents/artist/artist.md`): the
  living scheme is `assets/README.md`; **per-kind axis** (`char/` by faction→type, `fx/` by owner, `world/` by
  **area** + `_shared/`, `tile/` **flat**) — never one axis everywhere, fold only at >~12 and kept shallow.
  (b) A code-referenced reorg is a **two-owner atomic op**: Artist owns the scheme + tool + dry-run, the
  **engineer** runs `fold-assets.py --apply` (git mv + manifest rewrite in ONE commit); half-done = 404'd art that
  silently falls back. (c) **Migrate the slicer with the fold**: `slice-variants.py` imports the `FAMILIES` map
  and auto-routes `world` slices into `world/<area>/` + emits the foldered path; an unmapped id warns + falls back
  flat → add it to `FAMILIES` first. (d) Before reaching for an art tool, check the deliverable's *medium* — here
  the real lever was a 5-line engine change + a spec (`docs/specs/asset-area-namespace.md`), not more asset moves;
  spec the tradeoff and let Josh pick the altitude.

### 2026-06-12 — A 3×3 sheet's right treatment depends on what the cells ARE: opaque tiles crop full-bleed, props cut transparent, tall feet-anchored props need `--bleed` + a common foot line

- **Opaque ground tiles** (forest grass) must end up **full-bleed** so they tile seamlessly: crop the inner solid
  square inset past any framing fringe (content bbox per cell, inset ~11%), resize to the live tile res, output
  **opaque RGB**. Never alpha-key them — transparent edges show a grid when tiled. Match the **existing family's**
  treatment by measuring it (the live `grass-*` are 96² opaque full-bleed — not a stale doc's "128").
  **Verify TILING, not just the cutout:** render a 4×4 repeat and eyeball for seams/dark-edge grid; bright
  foliage over-reports bg-leak, so trust the over-ground render.
- **Transparent props** (barrel/crate) are the opposite: edge-seeded flood fill + erode, keep alpha. A single
  isolated prop on a plain bg = a one-cell sheet → `import cut_cell` from `slice-turnaround.py` (reuse the
  accumulated edge-case logic, don't hand-roll); `extract-town-props.py` is only for props fused to busy
  same-coloured ground.
- **Tall feet-anchored variant props** (trees/bushes) break the default `--frame cell` path two ways, both fixed
  IN the slicer: (1) **canopy overflow** into the cell above is cropped away *before* `cut_cell` sees it →
  flat tops; recovery = `slice-variants.py --bleed N` (expanded window + `keep_owner`, ported from the turnaround
  slicer — the recurring-defect-class-becomes-a-flag lesson again). (2) **Inconsistent feet** — `cell` leaves
  feet wherever the art sat; `square` centres vertically → `--anchor bottom`/`--foot-pad`: shared square sized to
  the largest figure, every variant's feet on one line, foot fraction = `1 - foot_pad`, relative scale preserved.
- **Diagnose overflow before reaching for `--bleed` — the obvious metric lies:** "non-white px above the cell
  top" is confounded by the neighbour's content. Instead scan upward from the cell top to the first near-white
  separator row (= this figure's true overflow), and crop the boundary strip with the cell line drawn on it and
  eyeball. `top_gap=0` + measured overflow = clipped, not flush; a clean bg gap between figures keeps
  `keep_owner` unambiguous (the `comps=N` print is the QA).
- **Handoff couplings:** bottom-anchored framing fixes the foot fraction (~0.94) → `TREE_FOOT` must match; the
  canvas now holds the full taller tree, so at the same draw size the body renders ~8–10% smaller → `TREE_BASE`
  may need a bump — name both, the engineer moves them together. Same-keys re-slice = drop-in (no manifest/draw
  change); a genuinely new variety = new id/keyspace (`world.treesmall.*`) + a wiring + placement handoff.

### 2026-06-11 — Before reporting an art task as "outstanding," verify it against `index.html` — handoff docs lag the engineer's wiring

- **Principle:** A handoff/roadmap note is a *snapshot at write time*, not live state. Engineer wiring routinely
  lands without the tracking doc updating (doc-drift), so an entry that says "in flight / to-wire" can describe
  something already **shipped**. Never relay an art task as outstanding from a doc alone — **grep the proof in
  `index.html` first**: the `ART_MANIFEST` key (`char.<id>.<dir>`), the draw selector, and the scale constant;
  plus confirm the cutouts exist and are git-tracked. All three present = wired; the doc is stale, not the feature.
- **Why:** I reported the heavy-attack windup as "the single most actionable artist task" off ROADMAP item 0's
  stale build-note — it had fully shipped in `adf291d` (manifest, selector, scale constants); same for the dash.
  Josh caught it. The session-start brief + handoff docs are a starting *hypothesis*, not ground truth.
- **How to apply:** (a) the moment a task is "report what's outstanding," reconcile each candidate against
  `index.html` (one grep per manifest key) before listing it — wiring presence is the truth, the doc is a hint.
  (b) When you find a doc stale, fix only the docs the Artist *owns* (this memory, your task doc
  **`docs/tasks/artist.md`**) — **`docs/ROADMAP.md` is PM-owned and read-only**; flag a stale roadmap status to
  the PM as a task in `docs/tasks/pm.md`, don't edit the roadmap. Don't let a known-false note re-mislead the
  next session. (c) Source of truth for *outstanding* work is the per-agent task docs **`docs/tasks/<role>.md`**
  (yours `artist.md`; art-wiring hand-offs you file go in `engineer.md`; split 2026-06-13 out of the old shared
  `docs/TASKS.md`, now just the conventions hub — that tracker had itself superseded BOARD.md + CLEANUP_BACKLOG.md
  on 2026-06-11). Treat this memory as a *live index* but re-verify every claim against `index.html` + the task
  docs, never as settled fact.

### 2026-06-10 — Particle-system FX: hundreds of sliced sprites compose one skill, and a *scaling* effect scales by COUNT, not by upscale

- **Principle:** Treat each sliced FX cutout as a tiny *instance* and spawn hundreds — the big skill (spiral,
  ring, crescent, jet, ball) is *emergent* from the swarm. The rule that makes it survive in-game: a skill whose
  reach grows with rank scales by adding particle **count with area** (≈`scale^1.7`) at constant per-particle
  size — NOT by bitmap-upscaling a fixed image, which goes fat + sparse + blurry; density/grain stay constant,
  only extent grows. Tools: `tools/fx-skill-fx.py` (scale-aware emitters), `fx-particle-sim.py` (emitter base);
  `fx-gif-compose.py` is the single-big-sprite keyframe model — the WRONG model, kept as a foil.
- **The recipe that makes shapes read** (Josh rejected the first cut as flat): (1) **sprite-variation MIX** —
  one sprite repeated reads as tiling; a weighted table across a set's cells (comets=streaks, flames=body,
  swirl=turbulence) reads organic. (2) **Spine concentration** — bias density onto the shape's defining line
  and taper the edges; a uniform scatter is a blob. (3) **Directional alignment** — a native-"up" sprite needs
  `rot = target_dir_deg + 90`. (4) **Colour recovery** — vivid hues in low-alpha wisps sink toward black
  composited small; saturation bump *plus* brightness lift raises them back. A "solid + rainbow" ask is in
  tension (dense overlap reads as the hot core; colour shows where sparse) — name the trade-off.
- **How to apply:** (a) **Read the implemented skills before authoring FX** — verify "off-style" art against
  the code first: the prismatic *dragonfire* and dark-red *chaosfire* I'd flagged as off-house-style were
  literally named in-game substances. (b) A *traveling* effect drives every particle's start/end off a shared
  `centre(global_t)` so the mass moves as one — independent paths gave "two clouds drifting apart";
  "heavy/solid" = crank **count** + centre-bias + full opacity, not bigger sprites. (c) A hollow **ring** cell's
  empty middle is an *enclosed* bg pocket → `--global`, not `--sever`. (d) The **GIF is an evaluation artifact**
  (gitignore `_gifs/`/`_qa/`); the in-game form is a **frame-strip PNG + `'lighter'`** + a scale-tier decision —
  an engineer handoff. Build emitters with live knobs (MIX, bias, taper, saturate/bright) so tuning is data.

### 2026-06-10 — Cutout-defect diagnosis: classify by measurement before reaching for a flag, and every QA metric can lie

*Raised from four 2026-06-10 entries; raw px counts + flag values in `archive/2026-06-10-cutout-defect-raw.md`.*

- **Principle — diagnose the defect *class* by measurement, then pick the tool; never guess a flag.** Each
  cutout defect has a measurable signature that names the fix, and they don't overlap:
  - **Geometry (clipped paw/foot/holes):** compare each figure's connected-blob bbox to its **cell** and to
    the **sheet edge**. Overflow past the cell but *not* the sheet = pixels exist, the rigid crop discarded
    them → recoverable with `--bleed`. Overflow past the *sheet* = never drawn → needs new art, no flag helps.
    White-on-white interior holes → `--sever`.
  - **Colour fringe (grey halo on the soft edge):** the RGB of the semi-transparent edge is bg-blended grey,
    not the house dark outline → luminance-clamp it to the idle outline tone (`defringe-sprite.py`). Re-keying
    is the wrong tool (a `--tol` sweep eats the neutral-grey steel; nearest-solid bleed *brightens* it).
  - **Baked cast shadow (opaque smudge trailing the feet, `α=255`):** colour-only can't touch it → **re-cut**
    seeding the shadow as definite bg (`slice-walk-video.py --shadow-bg`), bounded by `--shadow-lum`/`--shadow-band`
    so it doesn't eat the dark boots in the same bottom band.
  - **Localized border on a *symmetric* prop (one side only):** a directional baked shadow gradient, not AA →
    raise `--thresh` to key the shadow band as bg, **not** `--erode`. A uniform thin bright ring *is* true AA →
    `--erode`. The tell: sharp 1px edge ramp = AA; gradual ramp into a near-neutral band = shadow.
- **The metric trap: every QA number can false-pass or conflate; the render is the truth.** A fringe metric
  measuring only a soft sub-band (`8<α<200`) missed the bright near-opaque rim and opaque smudges — "clean"
  while Josh still saw the halo. A foot-area pixel count **conflated** intended shadow-removal with unintended
  boot-loss. Fixes: QA fringe against the idle's **full ring** (`8≤α<245`); **split** any count that sums
  opposing effects; judge by the **over-ground render + magenta contact (before/now/fix three-way)**.
- **How to apply:** (a) for any "X broke my asset" report, **prove ownership first** — `git diff HEAD` + the
  tool's write-set (`{id}-{dir}.png` for its `id`) separates "did this change?" from "is it defective?"; often
  the real cause is a *prior* session's re-cut. (b) An mp4 re-cut is **alpha+RGB** → it undoes any prior
  RGB-only defringe; **defringe must follow every re-cut.** (c) A note asserting "boots survive" is a claim to
  **re-measure across every affected facing** (the planted side-profile foot sits deepest in the shadow-seed
  band). (d) A *recurring* defect class gets encoded as a documented slicer flag — the slicer is the accumulated
  solution to every cutout edge case. Snapshot/commit before in-place rewrites — recoverability is what makes
  rejected experiments safe.

### 2026-06-10 — Action/motion sheets must register against the SHIPPED idle: head/shoulder mean for scale, feet-anchor + one gait cycle for frames

- **Pose scale:** the draw-mult in a handoff comes from **`python tools/check-pose-scale.py <prefix>`** (mean of
  head-width and shoulder-width ratios vs idle, per facing) — never bbox height, `bodyH`, or "body-fill" parity.
  `--match-bodyh` is right only for idle-silhouette sheets (walk cycles); a coiled/extended pose's bbox lies
  about body size (heavy wind-up: body-fill parity said `1.3` → rendered ~30% too big; head/shoulder said ~1.07).
  Head and shoulder alone are noisy and move *oppositely* across silhouettes; their **mean** cancels it (the
  dash, correct at 1.0, measures head 1.12 / shoulder 0.88 / mean 1.00). Paste the tool's `RECOMMEND draw-mult`
  + `feet-plant` lines into the handoff verbatim.
- **Corollary — a re-cut that changes the frame/canvas size is a COUPLED engineer change; flag the exact ratio.**
  `gDrawSprite` scales the whole canvas, so growing all 8 facings 192→208 means the draw-mult must grow
  `208/192` (≈1.08×) or the body shrinks. "I preserved the body scale" is not enough — the frame size is itself
  a render coupling.
- **Motion clips aren't turnaround sheets:** a generated walk video drifts in scale (~10–25%), translates, and
  may turn before settling. Pick all N frames from **one gait cycle** in the settled-facing window, use **one
  uniform feet-anchored scale** (per-frame height-normalisation flattens the natural contact-vs-passing bob),
  and **match the shipped idle sheet's body height + feet baseline** — the live system swaps idle↔walk at the
  same draw scale, so a self-normalised frame (body 168, feet y180) pops vs the idle (body 180, feet y191).
  **Verify source identity + facing first** by zooming an unambiguous feature (helmet back vs visor — a stale
  renamed clip that turned front→back burned a cycle). Encoded in `tools/slice-walk-video.py` (GrabCut +
  `--match-bodyh` + feet-anchor + `--mirror`).

### 2026-06-10 — Mirroring an asymmetric sprite: measure against ground truth, patch only what flips

- "No lazy mirroring" is a *generation* rule, not a runtime ban. Before redrawing an opposite facing,
  **measure how wrong a flip actually is against the true-rotated idle you already have** — pixel-diff *and*
  eyeball at full size. For this knight only the sword shoulder visibly flips, and even that reads correct;
  scabbard/strap/rim-light flips are sub-perceptual — so E↔W, NE↔NW, SE↔SW mirror cleanly, halving an
  8-direction job (`art/player/_mirror-QA/`). Build the mirror-vs-truth comparison first and let it decide;
  generate fresh art (or re-composite) only for the parts the flip can't carry.

### 2026-06-09/12 — Done = on-style + spec handed off + engineer-verified render; a pure draw-effect has NO asset, so the deliverable is ONLY the spec (never a wrong-medium mock)

- **Principle:** The Artist never edits `index.html` (the engineer is its sole editor). The deliverable is the
  art files (`assets/`/`art/`) + a *render spec* (paste-ready `ART_MANIFEST` snippet + draw/scale intent +
  size-coupling); the engineer wires and verifies. "Done" = on-style, magenta-clean, spec handed off, assets
  correct — never "I made it render." No half-measures (6 clean cutouts + 2 haloed = not shipped). The boundary
  was deliberately drawn along *declarative-art vs procedural-code*, not by region of one file — one owner on
  the single game file (a stray quote in a manifest path breaks all of `index.html`).
- **The no-asset case (2026-06-12):** anything composited per-frame over a moving sprite — a glow, tint,
  shader-like tell — is a **draw-layer effect, not an art asset**, and engineer-owned. Triage by deliverable:
  "does this produce an asset file?" No → the Artist's output is the **look direction** only (palette, subtlety,
  behaviour: "eyes-only, subtle, yellow→red") + a cheap-runtime suggestion, evaluated live.
- **Match medium to medium:** I mocked an enemy eye glow in Pillow; it failed three ways from one root cause —
  wrong medium: isotropic blur invented an artifact the canvas `'lighter'` composite wouldn't produce; per-pixel
  detection the runtime can't afford (>100 night sprites); a static crop can't show motion/zoom/pulse. Josh
  rejected it twice. Pillow + the slice tools are right for the *static asset pipeline*, wrong for *live render
  effects* — those need canvas/JS (a `gctx`-compositing harness, or the engineer behind a dev knob). Salvage the
  reusable nugget into the handoff (eye-key thresholds + a boot-time cached mask — exact values archived), then
  **discard the wrong-medium mock** so no one reuses it.

### 2026-06-09 — Migrate the tool when you migrate the pipeline, or every use pays a hand-bridge tax

- When the asset pipeline changes shape (inline base64 → external `assets/` files), the generator that feeds it
  must move in the same step — a tool left behind doesn't fail loudly, it silently makes every future use a
  manual fix-up (`slice-turnaround.py` kept emitting base64 snippets long after art was externalized; every
  slice paid a hand-bridge). When you change where art *lives* or how it's *referenced*, grep `tools/` for
  emitters of that reference and update them in the same pass; make output paste-ready for the *current*
  pipeline and smoke-test on a real sheet — a tool that compiles but emits the old format is still broken.

### 2026-06-09 — A sprite's dwell time is a feel knob, separate from the action's hitbox timing

- "Wired and rendering in all 8 facings" isn't "done" — a pose/attack sprite also has to *read* at gameplay
  speed, and how long it stays on screen is its own tunable. The wolf lunge sliced clean and rendered, yet
  playtest said it "flashed past": the swap condition (`biteStrike`, ~12f) is the *combat* follow-through, too
  short to read. Give the *display* its own hold timer (a draw-only `_biteHold`) decoupled from hitbox/recovery
  math so readability tunes without touching combat feel; a real playtest, not the render, is the acceptance
  test. Coordinate with the engineer when the only lever is a combat-timing field.
