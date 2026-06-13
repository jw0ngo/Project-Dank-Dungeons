# To Dust — Task Tracker (hub)

**The shared backlog of concrete work — one task doc per agent, conventions here.** Every to-do for the
PM, Engineer/CTO, and Artist lives in its owner's doc with a live status. When there's no higher-priority
*Now* work in [`ROADMAP.md`](ROADMAP.md), pull from your doc:

| Owner | Task doc |
|---|---|
| 🟦 Product Manager | [`tasks/pm.md`](tasks/pm.md) |
| 🟧 Engineer / CTO | [`tasks/engineer.md`](tasks/engineer.md) |
| 🟨 Artist | [`tasks/artist.md`](tasks/artist.md) |

> **TASKS vs ROADMAP — two layers, one axis each.**
> [`ROADMAP.md`](ROADMAP.md) is the **strategy** layer (PM-owned): *what* features we're building and *why*,
> priority, sizing, the product gate (`approved`/`shipped`). **The task docs are the execution layer:** the
> concrete to-dos — feature sub-tasks, cross-role hand-offs, deferred cruft/bugs — for every agent. A roadmap
> feature spawns tasks here. **One fact, one home:** a task links its roadmap item by # / name and never
> re-states the *why*; the roadmap never tracks execution churn. (For spec-backed work the **spec** is the
> source of truth; a task tracks only *progress against it*, not build detail.)

## Conventions (shared by all three task docs)

- **One doc per owner** — the agent who does the work **and updates the status.** Read your doc to pick up work.
- **Any agent may add a task to any doc** (flag work for another). Tag who flagged it: `(↳ from ART, 2026-06-11)`.
  **Only the owning agent changes a task's status.**
- **One line per task where possible:** `<status> <type> **Title** — what + grounding (greppable symbol / file).
  (↳ from <role>, date)`. Meaty spec-less hand-offs keep a collapsible **detail** block — they're their only home.
- **Status:** ◻️ todo · 🔄 in-progress · ⛔ blocked · ✅ done (move to the **Done** section at the bottom of your
  doc; git keeps the depth).
- **Type:** 🔴 bug · 🟡 cruft (dead/misleading code, no behavior impact) · 🟢 polish · ✨ feature-work · 🎨 art · 🔧 chore.
- **Flip status the moment you act, in the same commit.** **Commit your own lane — never `git add -A`** (the tree
  carries cross-role WIP; stage explicit paths so a `pm:`/`eng:`/`art:` commit stays single-lane). Your task doc
  is part of your lane.
- **Session-open (~30s):** `git status` + `git log --oneline -15` → roadmap *Now* → your task doc → act.

*(Split from the single-file tracker on 2026-06-13 — one doc per agent so a session loads only its own lane.
The combined history, incl. pre-2026-06-11 Done entries, lives in git.)*
