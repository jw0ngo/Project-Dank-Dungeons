# ADR 0001 — Keep the custom Canvas engine; scale to "hundreds on a map" via the server/net layer, not an engine swap

- **Status:** Accepted (Josh + CTO, 2026-06-11)
- **Deciders:** Josh (Creative Director), CTO/Engineer
- **Supersedes / relates to:** the studio identity (AI-native, single-file `index.html`) in `CLAUDE.md`;
  the Creative Manifesto Direction Log ("the combat system is a reusable platform; roguelike is mode one,
  MOBA/MMORPG are future modes").

> ADRs record *why* a structural choice was made so it isn't re-litigated each time the codebase grows.
> One decision per file; never edit an Accepted ADR's decision — supersede it with a new ADR.

## Context

Two questions were raised:
1. Should we move from the hand-rolled engine to a ready-made one (Godot/Unity/Phaser) now?
2. Will the custom engine have **scaling issues**, given the long-term goal of **hundreds of players on a
   single map** (the MMORPG "future mode")?

**The engine today** is a bespoke, single-file, immediate-mode Canvas-2D engine: one `index.html` (~700 KB,
all JS/CSS inlined, art externalized to `assets/`), **no build step, no framework, no runtime dependencies**
(Firebase via CDN for multiplayer). Content is data-driven through registries (`SpriteRegistry`, `EntityDefs`,
`EnemyRegistry`, `WeaponRegistry`, `ART_MANIFEST`, `IMBUE_PATHS`). All run paths funnel through one
deterministic step, **`gSimUpdate(dt)`**, which the headless **`window.Sim`** harness already runs outside a
browser for AI/bot playtesting. Multiplayer today: Firebase Realtime Database, delta-compressed ~8 Hz streams,
browser-host authority (one player's tab simulates enemies), gated behind a `Net`/`MP` adapter (`window._FB`).

## Decision

**1. Do not switch to a ready-made engine.** It solves none of the scaling walls below and would forfeit the
studio's core advantage — an AI-native, build-free, single-file game that agents read and edit end-to-end, with
a headless deterministic sim. Godot/Unity do **not** provide MMO netcode either; the closest comparable
(Albion Online, real-time action MMO) runs a *custom* authoritative server.

**2. "Hundreds on a map" is a backend/netcode re-architecture, not a client-engine problem.** The walls,
ranked by severity:

| # | Wall | Why it breaks at scale | The real fix |
|---|------|------------------------|--------------|
| 1 | **Firebase RTDB transport** | Shared DB every client writes/reads → ~**O(N²)** fan-out; degrades in the **low tens** of real-time players (bandwidth, cost, latency). | Dedicated **authoritative server** + **interest management** (you only receive entities near you). |
| 2 | **Browser-host authority** | One browser tab can't simulate a world for hundreds. | Server-authoritative sim; likely **spatial sharding** (map regions per process). |
| 3 | **O(N²) sim loops** | Collision separation, nearest-target scans, despawn sweeps are quadratic in entity count. | **Spatial partitioning** (grids/quadtrees). |
| 4 | **Canvas-2D render density** *(least worrying)* | Many on-screen animated sprites + FX. | Bounded by **viewport culling + AOI** (you render ~tens, not hundreds); WebGL/PixiJS backend only if FX density demands it. |

**3. We are unusually well-positioned to grow into this.** Because the whole sim is one deterministic
`gSimUpdate(dt)` that **already runs headless** (the `Sim` harness), it can be lifted into a Node/Go server
process as the authoritative tick — most projects must rewrite their sim to get server authority; we would not.
The AI-native harness work doubles as MMO-server groundwork.

**4. Protect the door now, cheaply (discipline, not work — mostly already true):**
- Keep **all net code behind the `Net`/`MP` adapter** so the transport is swappable; do **not** deepen Firebase
  coupling into gameplay code.
- Keep **`gSimUpdate(dt)` deterministic and side-effect-clean** (no DOM/render coupling in the step) so it can
  run server-side unchanged.
- Keep entity access **spatially indexable** (don't bake in full-array scans that a partition can't replace).

## Staged path (when we get there — *Later* horizon, after the slice is fun)

- **Now (≤ ~8, co-op):** Firebase is fine. Do not touch it.
- **Tens of players:** replace Firebase with a **dedicated relay/authoritative server** (Node + WebSocket) and
  **basic interest management**. Firebase must go *sooner than intuition suggests* for real-time action.
- **Hundreds:** authoritative server with **spatial sharding + area-of-interest + client-side
  prediction/interpolation**; likely a **WebGL render backend**; possibly a compiled server (Go/Rust) if one
  Node process can't hold the tick.

## Consequences

- **Positive:** no migration cost; velocity and the AI-native workflow preserved; the deterministic-sim design
  is reaffirmed as load-bearing (it's now also the MMO-server seed); the scaling dependency is on record before
  the run-loop work locks in choices that'd be expensive to undo.
- **Negative / accepted:** "hundreds on a map" remains genuinely hard (AAA-MMO-adjacent) and is a separate,
  sizable future project; we keep paying small hand-rolled-engine costs (manual collision/pathfinding) in the
  meantime — judged worth it for the workflow.
- **Revisit triggers (would reopen the engine question):** a hard need for **3D / real physics / native console
  ports**, or a **profiled perf wall** in the Canvas/JS client we can't optimize past. None are near today.

## Follow-ups

- Roadmap *Later* item added: **"MMO-scale server architecture spike."**
- Revisit the **modular ES-module split** (the dormant `dungeon-forge-project/` Vite scaffold) if/when the
  single file becomes hard to navigate — that is the response to *maintainability*, and is **independent** of
  this networking decision.
