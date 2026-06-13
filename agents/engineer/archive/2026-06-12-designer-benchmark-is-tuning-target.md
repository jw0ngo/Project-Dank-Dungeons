# 2026-06-12 — A designer's quantitative benchmark is a TUNING TARGET, not a mechanic spec — don't re-architect to hit a number

*(Archived verbatim from `agents/engineer/memory.md` during the 2026-06-13 compaction; a condensed stub remains there.)*

- **Principle:** When the designer hands a number ("rank-10 ≈ 80–100 MP/s"), it sizes a *parameter*, not the
  *mechanic*. I burned ~5 rounds converting a discrete per-rank chunk cost → a smooth drain → frequency-scaling
  → a cost cap, all to make one average "come out right" — and the designer walked **every** one back ("keep
  the dynamic system", "keep the interval", "no cap"). The right move: build the simplest mechanic that honors
  the *stated knobs* (chunk every 3 s, grows per level, per-emit on evolves), expose the numbers as live consts,
  and let the benchmark drive **one** increment. Iterate numbers, not architecture. The tell you've gone wrong:
  you're changing the mechanic's *shape* (discrete↔continuous, adding a cap/clamp/new scaling axis) to hit a
  target — that's re-architecting, not tuning. Re-read the directive for the *mechanic* words and treat the
  number as the dial.
- **When two stated constraints look impossible, SURFACE the conflict — don't silently clamp it away.** "~90/s
  average" + "castable on a base pool" can't both hold at a fixed interval + 100 pool; I nearly shipped a cost
  cap to force castability, but the designer's resolution was the opposite ("not enough Max-MP → you literally
  can't cast it — that gate IS the design"). A cap/clamp that makes the impossible look possible erases the
  decision the designer wanted. Present the conflict + the tradeoff; let them choose.
- **A relationship between two game quantities the designer tunes independently is DATA (two tables), not a
  formula — even when the spec hands you the formula.** I faithfully built the #8.9 spec's `dps ∝ cost^1.5` as a
  runtime `gGodSkillDpsScale` (damage *derived* from cost); Josh rejected it — cost and damage are independent
  per-rank tables, and the "damage climbs faster than cost" intent lives in the *chosen numbers*, not code. A
  faithful impl of an over-engineered spec is still **your** miss to catch: implement the design *intent*, not the
  literal math. (I authored that bad spec in the PM hat — the same person over-specs in one role and must catch it
  in the other; PM-memory sibling logged the spec-craft side.)
- **A designer's FEEL-description IS the architecture spec, and "make it one ring" means unify at the ENTITY
  level.** "Firebloom = a persistent ring that ebbs/flows · Cinderburst = a periodic explosion" mapped sensation →
  which variant gets the aura-ring-unify vs stays centre-out. Unifying Dragonbreath to *one* ring meant the aura
  ring **itself** breathes (delete the separate wave entity), which cascaded into a damage-delivery change
  (swept-wave → breathing-aura). Confirm SCOPE before broad-applying a feel concept (I did all evolutions; Josh
  narrowed to Dragonbreath) and expose every magnitude as a named const for his eye.
