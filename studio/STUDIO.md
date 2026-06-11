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

> The live game is `index.html` at the repo root. The repo-root `CLAUDE.md` is the lean studio router
> (auto-loaded into every session); the engineer's full context lives in `agents/engineer/engineer.md`.
> This `studio/` directory is the layer *above* the game — who makes it, and how they grow.

## The roster

Each agent is a role with its own home, its own operating context, and its own crystallized
learnings. Switch into a role with its slash command; the engineer is the default.

Each craft role is a **single self-contained file** (`agents/<role>/<role>.md`) that folds in its
identity, operating model, and habits, beside its own self-maintained **memory** (`agents/<role>/memory.md`)
and an `archive/` for compacted entries.

| Role | Owns | Agent file (self-contained) | Memory |
|------|------|-----------------------------|--------|
| **Creative Director** (Josh; future agent) | Vision, story, feel, taste — the *soul* | `studio/creative-director/ROLE.md` + [`CREATIVE_MANIFESTO.md`](CREATIVE_MANIFESTO.md) | `studio/creative-director/LEARNINGS.md` |
| **Engineer / CTO** (default) | *How* — systems, `index.html`, releases | `agents/engineer/engineer.md` | `agents/engineer/memory.md` |
| **Product Manager** (`/pm`) | *What & why* — the roadmap | `agents/product/product.md` | `agents/product/memory.md` |
| **Artist** (`/artist`) | The *art* — direction, slicing, asset specs (hands wiring to the engineer) | `agents/artist/artist.md` | `agents/artist/memory.md` |

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

The PM hands off through `docs/ROADMAP.md`. The Artist hands off through asset files (in `assets/`) plus
a render spec — a paste-ready `ART_MANIFEST` snippet and any draw/scale intent; **the Engineer is the
sole editor of `index.html`** and applies the wiring. The Creative Director's direction is recorded in
`CREATIVE_MANIFESTO.md` and flows into all three roles' work.

## Recursive learning — the studio's core habit

**Every agent gets more skilled every session.** Documentation and logging are how an AI-native
studio compounds: a lesson that isn't written down is re-learned (and re-paid-for) next time.

The discipline, for every role:

1. **During the session**, capture specifics where they already belong:
   - debugging lessons → `docs/SESSION_JOURNAL.md` (engineer/artist)
   - deferred findings / to-dos → your owner-lane in `docs/TASKS.md` (the shared task tracker)
   - architecture changes → the relevant `docs/` reference
2. **At the end of the session**, *crystallize* — step up an altitude and write the **highest-level,
   most transferable** learnings into your role's **memory** (`agents/<role>/memory.md`). Not "fixed
   bug X," but the principle that prevents the *class* of mistake, or the technique that made the work better.
   - One learning = one dated, titled entry. Lead with the principle; then why; then how to apply.
   - Prefer 1–3 sharp entries over a dump. If nothing rose to that altitude, write nothing.
   - **Also log a workflow-friction line:** what cost us a turn this session, and what doc/process
     change prevents it next time? Workflow efficiency compounds the same way craft does — assess it
     every session, don't wait for it to hurt.
   - **Maintain your own memory.** Each agent file declares a `memory_compact_at` line budget; when
     `memory.md` grows past it, *you* compact it — merge overlapping entries, supersede outdated ones,
     raise altitude, and move superseded raw entries into `agents/<role>/archive/`. The session-brief
     hook nudges you when you're over. Agents own their own memory hygiene.
3. **At the start of the next session**, read your `memory.md` first. It is the role's
   accumulated craft. A `SessionStart` hook (`tools/session-brief.ps1`, wired in
   `.claude/settings.local.json`) reads each agent file's frontmatter and auto-surfaces the latest
   release notes + the newest memory entry per role (plus a compaction nudge if any memory is over
   budget) — so each session starts informed.

These per-role memory files are the seed corpus for **future specialized agents** — most
directly the Creative Director, whose taste we are recording now so it can one day be trained.

## Where to go

- Building the game → `agents/engineer/engineer.md` (you are the engineer by default; the repo-root `CLAUDE.md` is just the router).
- Setting direction → [`CREATIVE_MANIFESTO.md`](CREATIVE_MANIFESTO.md).
- Stepping into a role → `/cto`, `/pm`, `/artist`.
