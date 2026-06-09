# Creative Manifesto — *To Dust*

**The Creative Director's living document.** It captures the *soul* of the game: the vision, the
story, the feel, and the taste behind the calls. Josh holds the Creative Director seat for *To Dust*;
this is where his direction is recorded — in his words where possible — so the whole studio can serve
one coherent vision, and so a **future Creative Director agent** can one day be trained on it.

> This is not the product roadmap (`docs/PRODUCT_MANIFESTO.md` — *what/why*, owned by the PM) and not
> the engineering charter (`docs/ENGINEERING_CHARTER.md` — *how*). This is the layer above both:
> **why the game should exist and how it should make you feel.** When the others conflict, this wins.

## How to use this doc

- **Read it first** if you're setting or serving direction.
- **The Creative Director adds to the Direction Log** whenever a real creative call is made — a
  feeling we're chasing, a thing we'll never do, a story beat, a "no, more like *this*." Capture the
  *taste*, not just the decision. Verbatim phrasing from Josh is gold; preserve it.
- Other roles **cite it**: a proposal or build that serves a logged principle should say which one.

---

## The two pillars

1. **Great-feeling gameplay.** The moment-to-moment must feel *good in the hands* before anything
   else. Weight, impact, readable telegraphs, responsive control. Feel is the product; everything
   else is delivered through it.
2. **A great story, told through play.** Narrative is felt, not read. The world, the gods, and the
   stakes should reach the player through what they *do* — not through walls of text. Story and feel
   are inseparable: the story gives the feel its meaning.

When these two are in tension, they're usually not — fix the design so both are served. Josh breaks
genuine ties.

## Standing taste principles

These are distilled from direction given so far. Each links to the deeper record where one exists.

- **Weighty combat.** Player and enemy attacks land with impact. Committed actions compromise
  mobility — missing has a real cost. Nothing floaty, nothing consequence-free.
- **The hero wields the gods' power.** Core fantasy: an individual hero channeling the blessings of
  patron gods. Power feels *borrowed and earned*, not innate.
- **Gods have souls, not stat-lines.** Each patron is a distinct identity expressed through *different
  mechanics*, never a reskin — Cilia (offense/AOE), Boreas (defense/control), Ikras
  (mobility/chaining), Bhumi (tank/thorns/heal).
- **Builds are identity, not arithmetic.** Depth comes from combination and expression, not stat
  sprawl. A build should feel like a *character*, not a spreadsheet.
- **Earned mastery.** Wins are earned. Enemies telegraph; the player learns; the game respects that.

## The name — *To Dust*

The title carries a thematic charge the studio should grow into (mortality, ruin, what endures and
what returns to dust, the cost of borrowed divine power). **The canonical meaning is the Creative
Director's to define** — logged below as it's decided, not invented here.

## Open questions for the Creative Director

*(Prompts for Josh to fill over time — these shape the game's soul and currently have no canonical
answer recorded.)*

- What does *"To Dust"* mean in this world? What's the central story the game is telling?
- Who is the hero, and why do the gods lend their power?
- What's the single feeling a first-time player should walk away with?
- What would we *never* do, even if it tested well?

---

## Direction Log

*Newest first. One entry per real creative call. Lead with the call; preserve Josh's words.*

### 2026-06-09 — The waning gods & the rise of "perceived higher powers" (the world's central myth)

The foundational myth of the world, in Josh's words (verbatim):

> *"The gods are waning in power, and resort to other means of 'perceived higher power' to preserve
> themselves. Chaos and order, light and dark, are some of these perceived means of higher power. If
> called upon enough, these concepts will become the new gods of the next age."*

- **The setting is the turning of the age.** The game takes place in the period where the gods are
  *beginning* to call upon these perceived higher powers — so the balance of power is actively shifting.
  It is **a period of the passing of the old gods and the birthing of the new.**
- **This is what *To Dust* means.** The old gods are crumbling — to dust — and from that dust the new
  powers (chaos, order, light, dark) are being born. Mortality and what-endures, applied to gods
  themselves. (Answers two open questions below: the meaning of the title, and the cost of the gods'
  borrowed power.)
- **How it reaches the player through play (story-told-through-play, pillar 2):** a patron's blessing
  channeled to its *peak* routes through these raw, half-born forces — so the strongest powers carry
  **chaos: more havoc, less control.** Borrowed divine power, at its limit, corrupts. First expressed
  mechanically in **Imbue Paths' level-10 "Chaos Ascension"** ([`../docs/specs/imbue-paths.md`](../docs/specs/imbue-paths.md)):
  maxing a fire skill spills fire onto the ground you stand on, makes effects spread past your aim — the
  god's waning grip showing through your own hands.

### 2026-06-09 — Studio framing & the rename to *To Dust*

- **From Dust is an AI-native game studio**; this repo houses its agents. The mission: *amazing games
  that tell great stories, coupled with great-feeling gameplay.*
- **The game is renamed *Dungeon Forge* → *To Dust***. (Display name propagated across the repo;
  legacy code tokens like the `DF1` seed prefix and the `dungeon-forge:map:` save key kept for
  compatibility.)
- **Josh is the Creative Director** for this first project — giving general direction and gameplay-feel
  guidance. This manifesto is the record of that direction, and the eventual training corpus for a
  future Creative Director agent.
- **Recursive learning is now studio doctrine**: every agent crystallizes its highest-level learnings
  each session (see `studio/STUDIO.md`).
