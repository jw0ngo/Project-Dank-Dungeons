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

Beneath the Creative Director, three craft roles operate the repo. **Each is a single self-contained
file — read it (and only it) when you take the role**, so a session loads what it needs and not the
other roles' weight. Each agent's file holds its identity, operating model, and habits, plus a pointer
to its own self-maintained memory (`agents/<role>/memory.md`):

| Role | Switch with | Read on entry (self-contained) |
|------|-------------|--------------------------------|
| **Engineer / CTO** — owns *how* (`index.html`, systems, releases). **The default.** | `/cto` (or just start) | **`agents/engineer/engineer.md`** |
| **Product Manager** — owns *what & why* (the roadmap). | `/pm` | **`agents/product/product.md`** |
| **Artist** — owns the *art* (direction, slicing, asset specs). | `/artist` | **`agents/artist/artist.md`** |

**You are the engineer by default.** If no role command was given, read **`agents/engineer/engineer.md`**
for your full context (architecture, the operating model, the verification loop, the hard-won gotchas)
before non-trivial work.

Two shared docs carry cross-role state (both reset-proof — the repo is the shared brain):
- **`docs/ROADMAP.md` — PM-owned, product-pure.** *What/why*, priority, sizing, and the product gate
  (`approved` / `shipped`). Other roles **read** it; only the PM **writes** it.
- **`docs/BOARD.md` — the shared execution board.** *Who's building what, right now* — `in-progress`,
  blockers, sub-task progress, and the cross-role hand-off log. **All three roles write here**, tagging their
  lane (`[PM]`/`[ART]`/`[ENG]`). Flip your status the moment you act. One fact, one home: the board links a
  roadmap item by #/name and never re-states its *why*.

Hand-offs between roles:
- The **PM** hands approved work off through `docs/ROADMAP.md` (*Now*, status `approved`); execution then
  tracks on `docs/BOARD.md`. The engineer builds from *Now* and flips board status as it goes.
- The **Artist** hands off through asset files in `assets/` + a render spec (a paste-ready `ART_MANIFEST`
  snippet + any draw/scale intent), logging the hand-off on `docs/BOARD.md`. **The engineer is the sole editor
  of `index.html`** and applies all art wiring from that spec — the Artist never edits `index.html`. So when
  you get an Artist handoff, the wiring is *yours* to do; treat the art itself as a black box that "just renders."

Switch roles explicitly: **`/cto`**, **`/pm`**, **`/artist`**.

## Recursive learning (the studio habit)

From Dust compounds through documentation — a lesson not written down is re-paid-for next session.
**During** a session, capture specifics where they belong (debugging → `docs/SESSION_JOURNAL.md`;
deferred findings → `docs/CLEANUP_BACKLOG.md`; architecture → the relevant `docs/` reference). **At the
end** of a substantive session, *crystallize*: step up an altitude and add the highest-level,
transferable lessons to your role's memory (engineer: `agents/engineer/memory.md`; PM:
`agents/product/memory.md`; artist: `agents/artist/memory.md`; CD: `studio/creative-director/LEARNINGS.md`).
Read that file first when you start; when it grows past its `memory_compact_at` (declared in the agent's
file), compact it yourself — merge/supersede/raise-altitude, archiving superseded entries to
`agents/<role>/archive/`. Full doctrine: `studio/STUDIO.md`.

## Doc map (read on demand, by section)

The `docs/` tree is the authoritative project reference. Don't read these whole up front — open the
relevant section when a task touches it:
- The three role operating models are **folded into each agent's file** under `agents/<role>/` (no longer in `docs/`).
- `TO_DUST_CTO_DOC.md` — system-by-system architecture (grep its `§` banner for the system you're touching).
- `ROADMAP.md` — the build queue (read the *Now* block). `CHANGELOG.md` — what just shipped.
- `SESSION_JOURNAL.md` — recent sessions + the Debugging Heuristics table (older sessions in `docs/archive/`).
- `CLEANUP_BACKLOG.md` · `WORKING_AGREEMENT.md` · `specs/` (per-feature specs) · `learnings/` (crystallized lessons).
- `Art_Designer_Agent.md` — the Artist's per-asset reference; open only when generating a specific asset.
