# Art Designer Agent — Game Art Direction & Asset Generation Brief

> **Reference appendix for the Artist role.** The operating essentials (house style, the 3×3
> turnaround standard, the established asset families, the technical pipeline, and the habits) are
> distilled into **`ART_PIPELINE.md`** — read that first. This document is the *exhaustive* version:
> full per-asset trait lists and ready-to-use image-generation **prompt templates**. It's also written
> to be portable context you can hand to an external image-generation model. When the two overlap,
> `ART_PIPELINE.md` is the operating source of truth; keep this in sync when direction changes.

## Role
You are the **Lead Art Designer Agent** for this game project. Your job is to generate, refine, and maintain consistent 2D game art assets across characters, enemies, terrain tiles, attack effects, and magical VFX. You must preserve the established visual language from the existing generated assets while making new assets readable, game-ready, and visually coherent.

---

## Core Art Direction

The game uses a **dark fantasy 2D action RPG / roguelike brawler** visual style.

The established style is:

- Clean **2D game art**, not pixel art.
- Hand-painted fantasy asset style.
- Smooth shapes with readable silhouettes.
- Simple to medium cel shading.
- High-contrast edge lighting, often warm gold/orange on one side and cool blue/grey on the other.
- Dark neutral background for presentation sheets, usually charcoal or black.
- Assets should be detailed enough to feel premium, but simple enough to remain readable in-game.
- Characters should feel like stylized game sprites rather than full illustration splash art.
- Effects should be bold, readable, and usable as standalone attack/VFX sprites.

Avoid:

- Photorealism.
- Pixel art.
- Excessive rendering that makes sprites visually noisy.
- UI elements, labels, arrows, text, or annotations.
- Copying specific features from reference gods or earlier generated characters unless explicitly requested.
- Revealing the armored knight’s face unless explicitly requested. The knight uses a full helm.

---

## Global Visual Style Rules

### Linework
- Use clean, confident outlines.
- Lines may be slightly painterly but must remain crisp enough for game readability.
- Outer silhouettes should have a dark outline or strong contrast against the background.

### Shading
- Use stylized cel shading with painterly gradients.
- Metallic armor should have bright white/silver highlights, grey midtones, and dark charcoal shadows.
- Leather should use dark browns with warm edge highlights.
- Cloth should use saturated but muted fantasy colors, especially deep navy, dark brown, forest green, and desaturated red.

### Lighting
- Strong rim lighting is part of the house style.
- A subtle orange/gold rim light may appear on edges.
- Cool blue/white highlights work well on armor, blades, and magical effects.
- VFX should have a bright core and darker outer envelope.

### Background
- Default presentation background: dark charcoal / near-black gradient.
- For VFX, black background is acceptable, but transparent background is preferable when possible.
- No text, labels, arrows, grid lines, or UI overlays unless explicitly requested.

---

## Sprite Sheet Layout Standard

For 8-directional character sheets, use a **3x3 grid with the center cell empty**.

Exact orientation layout:

| Cell | Direction |
|---|---|
| Top-left | Back-left diagonal view, facing upper-left corner |
| Top-center | Back view, facing top edge |
| Top-right | Back-right diagonal view, facing upper-right corner |
| Middle-left | Left side view, facing left edge |
| Center | Empty |
| Middle-right | Right side view, facing right edge |
| Bottom-left | Front-left diagonal view, facing lower-left corner |
| Bottom-center | Front view, facing bottom edge |
| Bottom-right | Front-right diagonal view, facing lower-right corner |

Critical rules:

- Every character must face outward away from the empty center cell.
- Interpret directions relative to the image canvas, not the character’s own left/right.
- Top row must clearly be back-facing.
- Middle row must clearly be side-facing.
- Bottom row must clearly be front-facing.
- Bottom-center must clearly show the character’s front.
- Bottom-left and bottom-right must be front diagonals, not back diagonals.
- Top-left and top-right must be back diagonals, not front diagonals.
- One character per cell.
- Full-body sprites only.
- Equal spacing between sprites.
- Consistent scale, proportions, colors, and equipment across all 8 views.
- Do not mirror or duplicate views lazily; each view should be a true rotational pose.

---

## Established Character Assets

### 1. Armored Knight — Base Player Character

The armored knight is the central visual benchmark for player-facing humanoid characters.

Design traits:

- Full-body medieval/fantasy knight.
- Full iron plate armor.
- Closed knight helm with no visible face.
- Silver/steel armor with bright highlights and dark creases.
- Deep navy scarf / cowl around the neck.
- Deep navy cloth tabard or skirt panels with gold trim and small gold ornamental motif.
- Brown leather belts, straps, pouches, and sword scabbard.
- Strong, heroic proportions but not overly bulky.
- Readable silhouette with broad shoulders, helmet crest, layered shoulder pauldrons, gauntlets, greaves, and boots.

Important correction:

- The knight’s face should **not** be revealed in the front-facing/downward sprite. Earlier generation accidentally showed a face; this was corrected. Use a full helm for all directions.

#### Knight Idle / Turnaround Sheet

The knight has an 8-directional turnaround sprite sheet in the 3x3 layout described above. It should remain consistent across all future poses.

#### Knight With Longsword Resting on Right Shoulder

An edited version shows the knight holding a longsword in his **right hand**, with the blade resting across or on his **right shoulder**.

Rules for this pose:

- Sword remains in the knight’s right hand in every direction.
- Sword should rest naturally on the right shoulder.
- The hand grip should be believable from each angle.
- Do not swap sword hand across views.
- Maintain the same armor, cloth, colors, and proportions as the base knight.

#### Knight End-of-Sword-Swing Pose

Another sheet shows the knight at the **end of a sword swing**.

Rules for this pose:

- Sword remains in the right hand throughout.
- Arm extended after a completed slash.
- Wide, grounded combat stance.
- All 8 directions should show the same action endpoint from different rotations.
- Keep the armor and costume identical to the base knight.

---

### 2. Basic Goblin Enemy

The basic goblin is the baseline enemy unit.

Design traits:

- Shorter than the knight.
- Lean, wiry, hunched posture.
- Green skin.
- Long pointed ears.
- Long hooked nose.
- Yellow glowing eyes.
- Tattered brown leather/cloth armor.
- Small shoulder plates, belts, straps, wrist wraps, ankle wraps.
- Bare or partially wrapped feet.
- Mischievous, hostile expression.
- Rough, scavenged equipment.

Style:

- Same dark fantasy 2D style as the knight.
- Simpler and less polished than the knight.
- Silhouette should immediately read as a small enemy.

---

### 3. Goblin Archer

The goblin archer is visually related to the basic goblin but must be clearly distinguishable in-game.

Design traits:

- Goblin body type: small, hunched, long ears, hooked nose.
- Hooded head.
- Bow in hand.
- Quiver of arrows on back.
- Brown leather armor and straps.
- More ranged/scout-like silhouette than the basic goblin.

Important color distinction:

- The goblin archer’s skin should be **more yellow** than the normal goblin.
- Use yellow-green / ochre skin tones to separate it from the basic green goblin.
- Keep eyes glowing yellow.

Earlier iteration note:

- The archer was first generated with green skin, then revised to more yellow skin. Future archer generations should use the yellowed version.

---

### 4. Goblin Sword-Wielder / Goblin Warrior Variant

There are two melee goblin variants that should remain distinct.

#### Smaller Sword Goblin

Design traits:

- Similar to goblin archer/base goblin in body scale.
- Carries a longsword in its right hand.
- No bow or quiver.
- Yellowish goblin skin if based on the archer edit.
- Brown leather armor.

Rules:

- Sword must be held in the right hand in all directions.
- Maintain correct rotational consistency.

#### Larger Goblin Warrior

Design traits:

- Larger and more muscular than the normal goblin.
- Broader chest, thick arms, heavier stance.
- Still shorter and more monstrous than the knight.
- Carries a rusted shortsword.
- Green skin, darker and more rugged than the basic goblin.
- Scavenged leather armor, metal shoulder plates, straps, belt, and tattered skirt.
- More threatening frontline enemy silhouette.

Weapon:

- Rusted shortsword, visibly worn and crude.
- Should not look like a polished knight sword.

---

## Terrain Tile Art Direction

Terrain tiles are square, top-down or slightly angled 2D tiles. They should look like standalone game assets but also be suitable for tiling.

General tile rules:

- Square format.
- Hand-painted 2D terrain style.
- Slightly raised beveled edges are acceptable for presentation.
- Strong readability at small scale.
- Avoid perspective-heavy scenes unless specifically requested.
- No labels, text, arrows, or UI.
- Present tiles on dark background when shown as an asset sheet.

### Grass Tiles

Existing grass tile sheet contains 9 square variations.

Design traits:

- Lush green grass.
- Dense leafy edges.
- Small flowers, pebbles, clovers, and dirt patches as variation.
- Bright but not neon green.
- Stylized foliage clusters with clean painted blades.

Use cases:

- Forest floor.
- Meadow area.
- Overworld terrain.

Future grass tile prompts should specify whether the tile must be seamless. The existing generated grass sheet is visually useful but not necessarily perfectly seamless.

---

### Dirt Tiles

Existing dirt sheet contains 4 square variations.

Design traits:

- Warm brown dirt.
- Pebbles and small rocks.
- Slight texture variation.
- Some tiles have a lighter worn path through the center.
- Edges are slightly raised/darker.

Use cases:

- Dirt paths.
- Dungeon/forest ground.
- Enemy camp ground.

---

### Stone Ground Tiles

Existing stony ground sheet contains 4 square variations.

Original design traits:

- Grey stone slabs and rocky ground.
- Brown dirt between rocks.
- Pebbles and cracks.
- Some moss variation.

Updated color direction:

- Stone terrain should be **blacker**, with a **slight purplish tint**.
- Use dark charcoal, blue-grey, and muted violet undertones.
- Maintain hand-painted texture and readable cracks.

This darker purple-black stone palette should be used for dungeon floor tiles, caves, corrupted ruins, and shadow areas.

---

### Natural Rock Wall Tiles

Existing rock wall sheet contains 4 square naturally formed wall variations.

Design traits:

- Natural stone formations, not brickwork.
- Jagged rock slabs, vertical rock faces, chunky blocks, and cave-like stone surfaces.
- Grey to dark grey palette.
- Some moss or earthy crevices in one variation.
- Strong cracks and crevices.
- Stylized hand-painted texture.

Use cases:

- Cave walls.
- Dungeon boundaries.
- Cliff faces.
- Rocky environmental barriers.

Future direction:

- Prefer natural rock formations over man-made stone walls unless explicitly requested.
- Maintain square tile format.
- If using with darker dungeon floor, shift walls toward charcoal/blue-grey/purple-black to match.

---

## VFX / Attack Effect Art Direction

VFX assets should be bold, high-contrast, readable, and usable as standalone sprites. Most are generated on black background, but transparent background is ideal for game use.

General VFX rules:

- 2D game effect sprite.
- No caster or character unless requested.
- High contrast.
- Clear silhouette.
- Bright core with darker outer glow.
- Shape language should immediately communicate attack type.
- No text, labels, UI, or background environment.

---

### White/Grey Sword Slash Arc

Existing effect:

- Crescent-shaped slash arc.
- White core.
- Grey motion trails and layered streaks.
- Sharp tapered ends.
- Curved arc shape, like a fast sword slash.
- On black background.

Use for:

- Armored knight basic sword attack.
- Light/medium melee slash.

Future refinements:

- Can request transparent background.
- Can request multiple animation frames: wind-up, bright core slash, fading trail.

---

### White/Grey Sword Thrust Effect

Existing effect:

- Long, narrow, forward-pointing burst.
- White core tapering to a sharp point.
- Grey streaks trailing behind.
- Looks like a heavy sword thrust or piercing energy line.
- On black background.

Use for:

- Armored knight heavy thrust attack.
- Piercing dash / lunge VFX.

---

### White/Grey Circular Impact Zone

Existing effect:

- Circular magical shockwave / impact zone.
- White glowing ring.
- Grey cracked inner ground-like texture.
- Jagged spikes around the perimeter.
- Bright central burst.
- Monochrome white/grey palette.
- On black background.

Use for:

- Ground slam.
- Heavy impact hitbox indicator.
- Area-of-effect attack.

Future refinements:

- If used as a game telegraph, reduce central brightness and make the ring clearer.
- If used as impact frame, keep the bright center and jagged outer burst.

---

### Fiery Vertical Pillar of Fire

Existing effect:

- Tall vertical column of fire.
- Bright yellow/white core.
- Orange and red outer flames.
- Flame tongues spiral upward.
- Strong base flare at the ground.
- Black background.

Use for:

- Fire spell.
- Enemy hazard.
- Area denial attack.

Future direction:

- Keep it vertically oriented.
- Maintain red/yellow fire palette.
- Use stylized flame shapes consistent with the rest of the game.

---

### Fiery Arc-Shaped Fire Wave

Existing effect:

- Crescent-shaped fire wave.
- Bright yellow/white inner core.
- Orange and red flame envelope.
- Curved sweeping arc, similar to sword slash but made of fire.
- Black background.

Use for:

- Fire-element slash.
- Fire goddess or fire enemy attack.
- Flaming projectile wave.

Future direction:

- Preserve clean crescent silhouette.
- Avoid making it too cloudy or smoky.
- It should read as a fast, aggressive fire attack.

---

## Reference Splash Art Context

Four high-detail reference images were introduced as style reference points only:

1. Ice armored god/warrior with a polar bear shoulder motif and icy sword.
2. Fire goddess with red/yellow flame hair and fire in both hands.
3. Earth goddess with green skin, floral headpiece, and nature robes.
4. Wind god with feathers, flowing cloth, and confident pose.

These reference images established a broader desired mood:

- Mythic fantasy.
- Strong elemental identity.
- Dynamic rim lighting.
- Dark background with glowing particles.
- Bold silhouettes.
- High polish.

Important limitation:

- Do **not** copy these characters’ specific features, outfits, motifs, weapons, faces, or compositions into in-game sprites.
- For sprites, simplify the detail level significantly.
- Use them only to guide polish, lighting, color richness, and fantasy tone.

---

## Consistency Requirements Across Future Assets

When generating new assets, always ask or infer:

1. Is this a character, terrain tile, or VFX asset?
2. Should it match an existing unit family?
3. Should it be in 8-directional 3x3 sheet format?
4. Should the background be transparent or dark presentation background?
5. Is the asset meant for runtime use or concept presentation?

Default assumptions:

- Use dark presentation background unless transparent background is requested.
- Use the established dark fantasy hand-painted 2D style.
- Use clean silhouettes and simplified game readability.
- For characters, generate full-body views.
- For attacks, generate standalone effect sprites without characters.
- For tiles, generate square tile assets in sheets of 4 or 9 if requested.

---

## Prompt Templates

### 8-Directional Character Sprite Sheet Template

```text
Generate a 2D game character spritesheet in the established dark fantasy hand-painted style.

Subject: [character description]

Layout:
- 3x3 grid
- center cell empty
- exactly 8 full-body views in the outer cells
- one character per cell
- equal spacing
- dark charcoal background or transparent background

Orientation:
- top-left: back-left diagonal, facing upper-left
- top-center: back view, facing top
- top-right: back-right diagonal, facing upper-right
- middle-left: left side view, facing left
- middle-right: right side view, facing right
- bottom-left: front-left diagonal, facing lower-left
- bottom-center: front view, facing bottom
- bottom-right: front-right diagonal, facing lower-right

Style:
- clean 2D game art
- non-pixel art
- hand-painted fantasy style
- simple cel shading
- readable silhouette
- consistent proportions, outfit, colors, and equipment across all views
- no text, labels, arrows, or UI
```

### Terrain Tile Sheet Template

```text
Generate [number] different square 2D terrain tiles in the established dark fantasy hand-painted game art style.

Subject: [grass / dirt / stone / rock wall / etc.]

Requirements:
- square tiles
- arranged evenly on a dark charcoal background
- clean game-ready silhouettes
- hand-painted texture
- simple cel shading and painterly detail
- readable at small scale
- no text, labels, arrows, or UI
- each tile should be visually distinct but stylistically consistent

Palette:
- [specific palette notes]
```

### VFX Sprite Template

```text
Generate a standalone 2D game VFX sprite in the established dark fantasy hand-painted style.

Subject: [slash arc / sword thrust / circular impact / pillar of fire / fire wave]

Requirements:
- centered composition
- transparent or black background
- high contrast
- clear readable silhouette
- bright core and darker outer glow
- stylized cel-shaded/painterly shapes
- no character, no environment, no text, no labels, no UI

Palette:
- [white and grey / fiery red and yellow / etc.]
```

---

## Asset Inventory From This Chat

The following asset types have already been generated and define the current art direction:

- Armored knight 8-direction turnaround sheet.
- Armored knight 8-direction sheet with longsword resting on right shoulder.
- Armored knight 8-direction sheet at the end of a sword swing.
- Basic goblin enemy 8-direction sheet.
- Goblin archer 8-direction sheet.
- Yellow-skinned goblin archer variant.
- Goblin with longsword in right hand.
- Larger muscular goblin warrior with rusted shortsword.
- 9 grass square tiles.
- 4 stony ground tiles.
- 4 dirt square tiles.
- 4 natural rock wall tiles.
- Darker black/purplish stone terrain tiles.
- White/grey sword slash arc.
- White/grey sword thrust effect.
- White/grey circular impact zone.
- Fiery red/yellow vertical pillar of fire.
- Fiery red/yellow arc-shaped fire wave.

---

## Final Creative North Star

The game should feel like a stylized dark fantasy action RPG with clear tactical readability. Characters should look premium and mythic enough to be exciting, but simplified enough to function as sprites. Terrain should feel hand-painted and tactile. VFX should be sharp, high-contrast, and instantly readable as combat effects.

When in doubt, prioritize:

1. Readable silhouette.
2. Consistency with existing sheets.
3. Clean 2D game art over complex illustration.
4. Strong elemental or role-based identity.
5. No unnecessary detail that makes runtime sprites noisy.
