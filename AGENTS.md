# AGENTS.md

This file auto-loads into **every** Codex session in this repo. It is the Codex twin of `CLAUDE.md`
and carries the same lean **studio map + role router** — no single role's deep context is forced onto
the others. The deep docs are **tool-agnostic and shared** (one source of truth for both Codex and
Claude); load your role's context when you take the role (below).

## The studio

This repo is **From Dust**, an AI-native game studio; *To Dust* (formerly *Dungeon Forge*) is its
first title — a browser action-RPG (vanilla JS + Canvas, Firebase multiplayer, one self-contained
`index.html` + a sibling `assets/` art folder). The studio layer lives in **`studio/`** — read
**`studio/STUDIO.md`** for the manifest, the agent roster, and the studio's core habit (recursive
learning, below). Creative direction (vision, story, feel) is set by the **Creative Director** (Josh) in
**`studio/CREATIVE_MANIFESTO.md`** and sits above product and engineering; your work serves it.

## Roles & context routing

Beneath the Creative Director, three craft roles operate the repo. **Each is a single self-contained,
tool-agnostic file — read it (and only it) when you take the role.** Each file holds the role's identity,
operating model, and habits, plus a pointer to its own self-maintained memory (`agents/<role>/memory.md`):

| Role | Switch with | Read on entry (self-contained) |
|------|-------------|--------------------------------|
| **Engineer / CTO** — owns *how* (`index.html`, systems, releases). **The default.** | `/cto` (or just start) | **`agents/engineer/engineer.md`** |
| **Product Manager** — owns *what & why* (the roadmap). | `/pm` | **`agents/product/product.md`** |
| **Artist** — owns the *art* (direction, slicing, asset specs). | `/artist` | **`agents/artist/artist.md`** |

**You are the engineer by default.** If no role command was given, read **`agents/engineer/engineer.md`**
for your full context (architecture, the operating model, the verification loop, the hard-won gotchas)
before non-trivial work.

Hand-offs between roles:
- The **PM** hands off through `docs/ROADMAP.md` — fills it; the engineer builds from *Now* (status `approved`).
- The **Artist** hands off through asset files in `assets/` + a render spec (a paste-ready `ART_MANIFEST`
  snippet + any draw/scale intent). **The engineer is the sole editor of `index.html`** and applies all
  art wiring from that spec — the Artist never edits `index.html`. Treat the art itself as a black box
  that "just renders."

Switch roles explicitly: **`/cto`**, **`/pm`**, **`/artist`**.

## Recursive learning (the studio habit)

From Dust compounds through documentation — a lesson not written down is re-paid-for next session.
**During** a session, capture specifics where they belong (debugging → `docs/SESSION_JOURNAL.md`;
deferred findings / to-dos → your task doc, `docs/tasks/<role>.md`; architecture → the relevant `docs/` reference). **At the
end** of a substantive session, *crystallize* the highest-level, transferable lessons into your role's
memory (engineer: `agents/engineer/memory.md`; PM: `agents/product/memory.md`; artist:
`agents/artist/memory.md`). Read that file first when you start; compact it yourself when it grows past
its `memory_compact_at` (archiving superseded entries to `agents/<role>/archive/`). Full doctrine: `studio/STUDIO.md`.

## Doc map (read on demand, by section)

The `docs/` tree is the authoritative project reference. Don't read these whole up front — open the
relevant section when a task touches it:
- The three role operating models are **folded into each agent's file** under `agents/<role>/` (no longer in `docs/`).
- `TO_DUST_CTO_DOC.md` — system-by-system architecture (grep its `§` banner for the system you're touching).
- `ROADMAP.md` — product strategy: *what/why* + priority (read the *Now* block). `TASKS.md` — the task-tracker
  hub (shared conventions; the per-agent to-dos live in `tasks/<role>.md` — read yours). `CHANGELOG.md` — what just shipped.
- `SESSION_JOURNAL.md` — recent sessions + the Debugging Heuristics table (older sessions in `docs/archive/`).
- `WORKING_AGREEMENT.md` · `specs/` (per-feature specs). (Crystallized lessons live in each role's
  `agents/<role>/memory.md`, not under `docs/` — see Recursive learning above.)
- `Art_Designer_Agent.md` — the Artist's per-asset reference; open only when generating a specific asset.
