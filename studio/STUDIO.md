# From Dust — Studio Charter

**From Dust is an AI-native game studio.** This repository *is* the studio: it houses the agents
that make the games, their operating contexts, their accumulated skills, and their memory. The
humans set creative direction; the agents do the craft and **get better at it every session.**

## The manifest

> Make amazing games — games that tell **great stories**, coupled with **great-feeling gameplay**.

Story and feel are co-equal and inseparable. A mechanic that doesn't serve the fantasy is noise;
a story that the moment-to-moment play doesn't *make you feel* is a cutscene. From Dust ships games
where the two reinforce each other.

## First title — *To Dust* (formerly *Dungeon Forge*)

*To Dust* is a browser action-RPG (vanilla JS + Canvas, Firebase multiplayer, one self-contained
`index.html`). It is the studio's first project and its proving ground: every system we build, every
asset we make, and every lesson we learn here is also building the studio itself.

> The live game and full engineering context live at the repo root (`CLAUDE.md`, `index.html`).
> This `studio/` directory is the layer *above* the game — who makes it, and how they grow.

## The roster

Each agent is a role with its own home, its own operating context, and its own crystallized
learnings. Switch into a role with its slash command; the engineer is the default.

| Role | Owns | Home | Operating model | Learnings |
|------|------|------|-----------------|-----------|
| **Creative Director** (Josh; future agent) | Vision, story, feel, taste — the *soul* | `studio/creative-director/` | [`CREATIVE_MANIFESTO.md`](CREATIVE_MANIFESTO.md) | `studio/creative-director/LEARNINGS.md` |
| **Engineer / CTO** (default) | *How* — systems, `index.html`, releases | repo root `CLAUDE.md` | `docs/ENGINEERING_CHARTER.md` | `docs/learnings/engineer.md` |
| **Product Manager** (`/pm`) | *What & why* — the roadmap | `product/` | `docs/PRODUCT_MANIFESTO.md` | `product/LEARNINGS.md` |
| **Artist** (`/artist`) | The *art* — direction, slicing, wiring | `artist/` | `docs/ART_PIPELINE.md` | `artist/LEARNINGS.md` |

How they relate:

```
            Creative Director (Josh) — vision · story · feel · the final call
                          │  sets direction (CREATIVE_MANIFESTO.md)
        ┌─────────────────┼─────────────────┐
   Product Manager     Artist            (taste flows to all three)
   what/why            the art
        │                 │
        └──── Engineer / CTO ────┘   builds the game (index.html)
              how
```

The PM hands off through `docs/ROADMAP.md`. The Artist and Engineer both edit `index.html` in
different regions. The Creative Director's direction is recorded in `CREATIVE_MANIFESTO.md` and
flows into all three roles' work.

## Recursive learning — the studio's core habit

**Every agent gets more skilled every session.** Documentation and logging are how an AI-native
studio compounds: a lesson that isn't written down is re-learned (and re-paid-for) next time.

The discipline, for every role:

1. **During the session**, capture specifics where they already belong:
   - debugging lessons → `docs/SESSION_JOURNAL.md` (engineer/artist)
   - deferred findings → `docs/CLEANUP_BACKLOG.md`
   - architecture changes → the relevant `docs/` reference
2. **At the end of the session**, *crystallize* — step up an altitude and write the **highest-level,
   most transferable** learnings into your role's `LEARNINGS.md`. Not "fixed bug X," but the
   principle that prevents the *class* of mistake, or the technique that made the work better.
   - One learning = one dated, titled entry. Lead with the principle; then why; then how to apply.
   - Prefer 1–3 sharp entries over a dump. If nothing rose to that altitude, write nothing.
3. **At the start of the next session**, read your `LEARNINGS.md` first. It is the role's
   accumulated craft. A `SessionStart` hook (`tools/session-brief.ps1`, wired in
   `.claude/settings.local.json`) auto-surfaces the latest release notes + the newest learning per
   role and asks the agent to open with a brief executive summary — so each session starts informed.

These per-role `LEARNINGS.md` files are the seed corpus for **future specialized agents** — most
directly the Creative Director, whose taste we are recording now so it can one day be trained.

## Where to go

- Building the game → repo-root `CLAUDE.md` (you are the engineer by default).
- Setting direction → [`CREATIVE_MANIFESTO.md`](CREATIVE_MANIFESTO.md).
- Stepping into a role → `/cto`, `/pm`, `/artist`.
