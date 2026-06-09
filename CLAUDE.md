# CLAUDE.md

This file auto-loads into **every** session in this repo. It is deliberately lean — the **studio map +
role router** only — so no single role's deep context is forced onto the others. Your role's full
operating context lives in its own file; load it when you take the role (below).

## The studio

This repo is **From Dust**, an AI-native game studio; *To Dust* (formerly *Dungeon Forge*) is its
first title — a browser action-RPG (vanilla JS + Canvas, Firebase multiplayer, one self-contained
`index.html` + a sibling `assets/` art folder). The studio layer lives in **`studio/`** — read
**`studio/STUDIO.md`** for the manifest, the agent roster, and the studio's core habit (recursive
learning, below). Creative direction — the game's vision, story, and feel — is set by the **Creative
Director** (Josh) and recorded in **`studio/CREATIVE_MANIFESTO.md`**; it sits above product and
engineering, and your work serves it.

## Roles & context routing

Beneath the Creative Director, three craft roles operate the repo. **Each has its own operating
context file — read it (and only it) when you take the role**, so a session loads what it needs and not
the other roles' weight:

| Role | Switch with | Read on entry | Full operating model |
|------|-------------|---------------|----------------------|
| **Engineer / CTO** — owns *how* (`index.html`, systems, releases). **The default.** | `/cto` (or just start) | **`engineer/CLAUDE.md`** | `docs/ENGINEERING_CHARTER.md` |
| **Product Manager** — owns *what & why* (the roadmap). | `/pm` | `product/CLAUDE.md` | `docs/PRODUCT_MANIFESTO.md` |
| **Artist** — owns the *art* (direction, slicing, asset specs). | `/artist` | `artist/CLAUDE.md` | `docs/ART_PIPELINE.md` |

**You are the engineer by default.** If no role command was given, read **`engineer/CLAUDE.md`** for
your full context (architecture, the verification loop, the hard-won gotchas) before non-trivial work.

Hand-offs between roles:
- The **PM** hands off through `docs/ROADMAP.md` — fills it; the engineer builds from *Now* (status `approved`).
- The **Artist** hands off through asset files in `assets/` + a render spec (a paste-ready `ART_MANIFEST`
  snippet + any draw/scale intent). **The engineer is the sole editor of `index.html`** and applies all
  art wiring from that spec — the Artist never edits `index.html`. So when you get an Artist handoff,
  the wiring is *yours* to do; treat the art itself as a black box that "just renders."

Switch roles explicitly: **`/cto`**, **`/pm`**, **`/artist`**.

## Recursive learning (the studio habit)

From Dust compounds through documentation — a lesson not written down is re-paid-for next session.
**During** a session, capture specifics where they belong (debugging → `docs/SESSION_JOURNAL.md`;
deferred findings → `docs/CLEANUP_BACKLOG.md`; architecture → the relevant `docs/` reference). **At the
end** of a substantive session, *crystallize*: step up an altitude and add the highest-level,
transferable lessons to your role's `LEARNINGS.md` (engineer: `docs/learnings/engineer.md`; PM:
`product/LEARNINGS.md`; artist: `artist/LEARNINGS.md`; CD: `studio/creative-director/LEARNINGS.md`).
Read that file first when you start. Full doctrine: `studio/STUDIO.md`.

## Doc map (read on demand, by section)

The `docs/` tree is the authoritative project reference. Don't read these whole up front — open the
relevant section when a task touches it:
- `ENGINEERING_CHARTER.md` · `PRODUCT_MANIFESTO.md` · `ART_PIPELINE.md` — the three role operating models.
- `TO_DUST_CTO_DOC.md` — system-by-system architecture (grep its `§` banner for the system you're touching).
- `ROADMAP.md` — the build queue (read the *Now* block). `CHANGELOG.md` — what just shipped.
- `SESSION_JOURNAL.md` — recent sessions + the Debugging Heuristics table (older sessions in `docs/archive/`).
- `CLEANUP_BACKLOG.md` · `WORKING_AGREEMENT.md` · `specs/` (per-feature specs) · `learnings/` (crystallized lessons).
- `Art_Designer_Agent.md` — the Artist's per-asset reference; open only when generating a specific asset.
