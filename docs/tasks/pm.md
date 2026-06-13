# 🟦 Product Manager — Tasks

**Owner: the Product Manager.** Only the owner flips a status here; **any agent may file a task in** (tag it
`(↳ from <role>, date)`). Conventions + the status/type legend live in the hub: [`../TASKS.md`](../TASKS.md).
Strategy/priority: [`../ROADMAP.md`](../ROADMAP.md). Sibling docs: [`engineer.md`](engineer.md) · [`artist.md`](artist.md).

---

- ✅ 🔴 **pm-bot deploy-gating bug: a "docs-only" push can carry an un-pushed `index.html` commit to the remote**
  (↳ from ENG, 2026-06-12) — **DONE 2026-06-12 (PM).** Root cause: `git push` advances `origin/main` over the
  **whole ancestor chain**, so a pre-authorized docs push silently deployed the engineer's parked `index.html` #8
  fixers (`1f41da0`, now live). **Fix shipped** in `tools/pm-bot/pm_bot.py` — `commit_and_push` now routes through
  `_safe_push_main()`: it inspects the *entire* outgoing delta; if any commit touches `index.html`/`assets/`, it
  pushes **only the docs commits** (replayed onto the clean remote tip via an isolated `git worktree`, then
  reconciles local main by rebase) and **holds the build commit** for Josh's auth — never silently deploying. Clear
  "HELD" status on any cherry-pick/rebase conflict. Mirror of the ENG-memory learning + my PM-memory gate
  (2026-06-12). Tooling-only, deploy-inert. *(Heads-up: `1f41da0` is already live; the follow-up `78cd9b2` is
  correctly still local.)*

- ◻️ ✨ **Finalize Ikras / Boreas / Bhumi stat-synergy mechanics when each god is built** (↳ Josh 2026-06-12 ·
  spec [`specs/god-stat-identities.md`](../specs/god-stat-identities.md) "design-ahead") — the per-god mechanics are
  PM-proposed (Ikras chain-arc ← move/atk speed; Boreas frost-field ← pickup range, CC uptime ← CDR, sustain ←
  mana regen; Bhumi thorns ← max HP, heal-engine ← HP regen). Confirm/redirect with Josh + author into each god's
  kit **when that god lands** (Boreas #5 is next — fold its hooks into the Frost-kit design at unhold). **Resolve
  the Attack-Speed stat gap** (no character-stat card exists for it — add one or map to swing-speed) before Ikras.

- ◻️ 🔧 **Re-rank after item 2's first slice lands** — once God Skills proves out in playtest, re-sequence *Next*:
  the Boreas unhold is the keystone (lights up Elemental Fusion + co-op synergy + its own Frost kit at once).
  Define the unhold trigger then. (roadmap #5 / *Next*)

- ◻️ ✨ **Mana-build card expansion — size as a proposal** (↳ Josh 2026-06-12 · spec [`specs/mana-economy.md`](../specs/mana-economy.md) "mana-build card expansion" follow-on) — the *supply* side of item 7: a card pool rich enough to make SUSTAIN (regen), BURST (max-pool / UNIQUE multipliers like *3× pool*), and hybrid mana builds all viable. Item 7 only rebalances the existing `mpRegenAdd`/`mpBonus` cards ~10×; this expands the archetypes + introduces a **UNIQUE build-defining card class**. Write a roadmap proposal once item 7's mechanic is live (sequence after, don't block Phase 1). Embodies the build-potential north star (PM memory 2026-06-12).

---

## ✅ Done (recent track record — prune to git history as it grows)

*(none recorded yet — ✅ items inside the lane above double as the recent record; shipped features live in [`../ROADMAP.md`](../ROADMAP.md) + [`../CHANGELOG.md`](../CHANGELOG.md).)*
