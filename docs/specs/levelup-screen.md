# Spec — Level-Up "Choose a Blessing" screen, art-direction pass

**Owner of the visual spec:** Artist · **Owner of `index.html` wiring:** Engineer · **Status:** spec ready, unbuilt.
**Goal:** bring the in-game level-up screen to the fidelity of the two reference mockups
(`art/reference images/level up screen.png` — Cilia/warm; `nameless knight level screen.png` — cool).

> **The good news:** the screen is already built *toward* these exact references — same left portrait
> panel, `✦ LEVEL UP ✦` title + "Choose a Blessing" sub, three injected rarity cards, reroll/confirm
> buttons (with the same "Accept this Blessing" sub-labels), and a warm/cool theme swap
> (`#g-stat-pick.theme-cilia`). This is a **polish + paint pass on an existing structure, not a rebuild.**
> Most of the layout fidelity is **pure CSS the engineer can land with no new art**; the rest is a thin
> painted-art layer (icons → filigree → frame).

---

## Where it lives today (grounding)

| Thing | Location in `index.html` |
|---|---|
| Overlay markup | `#g-stat-pick` (~`:875`) — scrim, vignette, `#g-levelup-god-panel`, right panel, `#g-stat-cards`, buttons |
| All level-up CSS | the `/* Level-up "Choose a Blessing" */` block (~`:171–224`) |
| Theme vars | `#g-stat-pick` (cool default) + `.theme-cilia` (warm) — `--lvl-accent/-accent2/-glow/-frame/-frame-hi/-frame-lo` |
| Portrait frame | `.lvl-portrait` (border-image gradient + `::before` hairline + `::after` vignette), `.lvl-corner` `❖`, `.lvl-pname` |
| Card render (per pick) | `_paintDraft()` → `el.innerHTML` (~`:13853`): `.sc-rarity` · `.sc-ring`>`.sc-icon` (**emoji** `card.icon`) · `.sc-name` · `.sc-bonuses` · optional `.imb-track` · optional favor button |
| Rarity palette | `CARD_RARITIES` (~`:13291`): Common `#c8ccd4` · Rare `#5a9cff` · Epic `#b066ff` · Legendary `#ffcc33` (+ glows) |
| Portrait art | knight = `assets/portraits/knight.jpg`; god img set via `#g-levelup-god-img` |

---

## Gap redline — reference vs. current, by element

`CSS` = engineer-only, no new art. `ART` = needs an asset (Artist produces or Josh generates → Artist preps).

| # | Element | Reference | Current | Close it with | Owner |
|---|---|---|---|---|---|
| 1 | **Card icon** | Painted circular icon (gold bolt / purple-blue energy swirl) in a rarity ring | Emoji in `.sc-ring` | **Image-icon override** (see *Icon system* below) + the painted set | ART + CSS |
| 2 | **Card divider** | Thin rule between name and effect line | none | `.sc-name`→`.sc-bonuses` separator (1px gradient rule, `--lvl-accent` @ ~.4) | CSS |
| 3 | **Card frame** | Taller card, faint parchment gradient, engraved double border + soft inner shadow | flat gradient + 1px border | restyle `.stat-card` (gradient + `box-shadow inset` engrave + `::before` hairline) | CSS |
| 4 | **Rarity label** | Centered small-caps with tiny flanking marks (`— COMMON —`) | plain `.sc-rarity` | center + pseudo-element flank ticks | CSS |
| 5 | **Card corner filigree** | Small gold scroll ornaments in each card corner | none | 1 ornament PNG, 4× rotated, CSS-tinted to theme | ART (P3) |
| 6 | **Title flourish** | Symmetric scrollwork + a small flame crest above LEVEL UP | plain `✦ … ✦` | flourish ornament PNG/SVG flanking `.lvl-title` (+ crest above) | ART (P3) |
| 7 | **Portrait frame** | Ornate **arched** architectural frame (gold-on-fire / carved stone) | border-image gradient + `❖` studs | arched frame overlay PNG (transparent center) over `.lvl-portrait` | ART (P4) |
| 8 | **Confirm button** | Amber-**filled** engraved pill (active), reroll = outline pill | both outline; confirm dims until pick | give `.lvl-btn-confirm` (enabled) an amber fill + inner-glow | CSS |
| 9 | **Background** | Faint ember/starfield texture under the warm vignette | scrim + radial vignette | add a tiling ember-noise layer (low-α) — optional asset or CSS noise | CSS / ART (P3) |
| 10 | **Bottom status bar** (Cilia ref) | Skill-slot row + "THE WILDERNESS · NIGHT n · HORDE" strip | not on the overlay | themed bottom strip (reuse `.sk-slot` + run/night/wave state) | CSS (P5, optional) |

---

## Icon system (the key engineering enabler)

The reference's signature is the **painted circular skill icons**. Make them a clean, optional override so
the screen keeps working before art exists and upgrades icon-by-icon:

1. **Assets:** `assets/ui/skill-icons/<iconKey>.png` — ~128×128, the glyph only (transparent, or a dark
   disc), centred. The **rarity ring stays CSS** (`.sc-ring` keeps coloring/glowing by tier), so one icon
   art serves all four rarities — no re-art per tier.
2. **Map:** a small literal, e.g. `const CARD_ICON_ART = { swiftness:'assets/ui/skill-icons/swiftness.png',
   'leap-bound':'…/leap-bound.png', … };` keyed by a **stable card id** (engineer: confirm cards carry a
   stable `id`/`iconKey`; if not, add one — do **not** key off `card.name`).
3. **Render swap** (in `_paintDraft`, the `.sc-ring` inner): if `CARD_ICON_ART[card.iconKey]` exists →
   `<img class="sc-icon-art" src=…>`; else the existing `<span class="sc-icon">${card.icon}</span>`. New CSS:
   `.sc-icon-art{ width:30px; height:30px; object-fit:contain; filter:drop-shadow(0 0 5px var(--lvl-glow)); }`.
4. **Fallback is graceful:** any card without art shows today's emoji — ship icons in batches.

**Icon-art source (decision needed — see handoff):** the painted look wants image-gen (Josh's ChatGPT
workflow) → Artist slices to transparent + sizes; *or* a flatter procedural/vector set the Artist can
build now without generation. Either feeds the same override system.

---

## Asset manifest (what art this needs)

| Asset | Path | Size | Source | Phase |
|---|---|---|---|---|
| Skill icons (per card) | `assets/ui/skill-icons/<key>.png` | 128² | gen→prep (or procedural) | **P2** |
| Card corner filigree | `assets/ui/card-filigree.png` | ~64² | procedural/SVG, CSS-tinted | P3 |
| Title flourish + crest | `assets/ui/title-flourish.png` (+ `title-crest.png`) | ~256×48 / 48² | procedural/SVG or gen | P3 |
| Ember-noise bg | `assets/ui/ember-noise.png` | tiling 256² | procedural | P3 |
| Arched portrait frame | `assets/ui/portrait-frame.png` (warm + cool, or 1 tinted) | matches panel, transparent center | **gen** (painterly) | P4 |

All `assets/ui/*` are DOM `<img>`/`background-image` (not the canvas `ART_MANIFEST`); raster ones follow the
HiDPI rule only if drawn to a canvas — here they're plain DOM images, so just ship them crisp at display size.

---

## Phasing (recommended build order)

- **P1 — CSS-only, zero new art (biggest fidelity jump for the effort):** rows 2,3,4,8 (+9 CSS noise).
  Engineer-only; lands the card/button look immediately.
- **P2 — painted skill icons** (row 1) via the icon-override system. The signature upgrade.
- **P3 — ornamental chrome** (rows 5,6,9): filigree, title flourish, ember bg.
- **P4 — arched portrait frame** (row 7): the largest single painted piece.
- **P5 — bottom status strip** (row 10): optional.

## Verification (engineer, after wiring)
`node --check` the extracted script · grep each new CSS class/asset key · `python dev.py` → trigger a
level-up (or the §8 Sim harness draft path) → eyeball **both** themes: pledge Cilia (warm) and an unpledged
run (cool nameless knight). Confirm: icons render (and fall back to emoji where art is absent), divider +
engraved frames read, confirm-button amber-fills on select, and nothing overflows at min panel width
(`#g-levelup-god-panel min-width:260px`).
