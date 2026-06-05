// §2  DEMO MAP & CONSTANTS
// ═══════════════════════════════════════════════════════════════
const T = 24; // tile size px
const TILE_VOID = 0, TILE_FLOOR = 1, TILE_WALL = 2, TILE_EXIT = 5;

// ═══════════════════════════════════════════════════════
// DEMO MAP  (Goblin Cave)
// ═══════════════════════════════════════════════════════
const DEMO_MAP = {
  id: 'builtin-demo',
  name: 'Demo Dungeon',
  width: 40, height: 24,
  rows: [
    "WWWWWWWWWWWWWWWWWWWWWWWFFFFFFWFFWWWWWWWW",
    "WWFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFWWWWWWWW",
    "WWFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFWWWWWWWW",
    "WWFFFWWWWWWFFFWWWWFFWFFFFFFFFFFFWWWWWWWW",
    "WWFFFWWWWWWWWWWWWWWFWFFWWWWWWWWWWWWWWWWW",
    "WWWWFFWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW",
    "WWWWFFWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW",
    "WWWWFFFWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW",
    "WWWWFFFFFWWWWWWFFFWWWFFFWWWWWWWWWWWWWWWW",
    "WWWWWFFFFFFFFFFFFFFFFFFFFFFWWWWWWWWWWWWW",
    "WWWWWWFFFFFFFFFFFFFFFFFFFWFFFFWWWWWWWWWW",
    "WWWWWWWWFFFFFFFFFFFFFFFFFFFFFFFFFWWWWWWW",
    "WWWWWWWWWFFFFFFFFFFFFFFFFWFWFFFWWWWWWWWW",
    "WWWWWWWWWFFFFFFFFFFFFFFFFWWWWFFFWWWWWWWW",
    "WWWWWWWWWWWWWWWWWWFFFWWWWWWWWFFFWWWWWWWW",
    "WWWWWWWWWWWWWWWWWWWWWWWWWWWWWFFFWWWWWWWW",
    "WWWWWWWWWWWWWWWWWWWWWWWWWWWWWFFFWWWWWWWW",
    "WWWWWWWWWWWWWWWWWWWWWWWWWWWWWFFFWWWWWWWW",
    "WWWWWWWWWWWWWWWWWWWWWWWWWWWWWFFFFWWWWWWW",
    "WWWWWWWWWWWWWWWWWWWWWWWWWWWWWFFFFFWWWWWW",
    "WWWWWWWWWWWWWWWWWWWWWWWWWWWWWFFFFFFFFFWW",
    "WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWFFFFFFEW",
    "WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW",
    "WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW"
  ],
  entities: [
    {kind:"crate",tx:2,ty:3},
    {kind:"crate",tx:2,ty:4},
    {kind:"barrel",tx:5,ty:5},
    {kind:"barrel",tx:5,ty:6},
    {kind:"goblin",tx:6,ty:9},
    {kind:"goblin",tx:10,ty:10},
    {kind:"goblin",tx:14,ty:10},
    {kind:"warrior",tx:25,ty:9},
    {kind:"warrior",tx:20,ty:11},
    {kind:"archer",tx:30,ty:20},
    {kind:"archer",tx:31,ty:20},
    {kind:"barrel",tx:31,ty:16},
    {kind:"crate",tx:29,ty:14},
    {kind:"crate",tx:29,ty:18},
    {kind:"archer",tx:13,ty:11},
    {kind:"goblin",tx:26,ty:10},
    {kind:"goblin",tx:26,ty:11},
    {kind:"goblin",tx:26,ty:12},
    {kind:"fire-trap",tx:18,ty:14,dir:"n",phase:0.5},
    {kind:"fire-trap",tx:19,ty:14,dir:"n",phase:0.5},
    {kind:"fire-trap",tx:20,ty:14,dir:"n",phase:0.5},
    {kind:"barrel",tx:13,ty:1},
    {kind:"barrel",tx:12,ty:1},
    {kind:"crate",tx:11,ty:3},
    {kind:"crate",tx:12,ty:3},
    {kind:"player",tx:30,ty:2},
    {kind:"crate",tx:18,ty:3},
    {kind:"crate",tx:19,ty:3},
    {kind:"crate",tx:19,ty:4},
    {kind:"torch",tx:24,ty:0},
    {kind:"torch",tx:15,ty:2},
    {kind:"torch",tx:3,ty:4},
    {kind:"torch",tx:12,ty:13},
    {kind:"torch",tx:29,ty:10},
    {kind:"torch",tx:29,ty:17},
    {kind:"torch",tx:37,ty:20},
    {kind:"archer",tx:29,ty:11},
    {kind:"archer",tx:32,ty:20},
    {kind:"fire-trap",tx:15,ty:8,dir:"s",phase:0},
    {kind:"fire-trap",tx:16,ty:8,dir:"s",phase:0},
    {kind:"fire-trap",tx:17,ty:8,dir:"s",phase:0},
    {kind:"fire-trap",tx:21,ty:8,dir:"s",phase:0},
    {kind:"fire-trap",tx:22,ty:8,dir:"s",phase:0},
    {kind:"fire-trap",tx:23,ty:8,dir:"s",phase:0}
  ],
  createdAt: 0, updatedAt: 0
}

// ── HUB_MAP — persistent multiplayer town world ─────────────────────────────
// Players spawn here on page load. No enemies, no combat.
// Portal arch (top centre) will connect to dungeon entry in Phase 2.
const HUB_MAP = {
  id: 'builtin-hub',
  name: 'The Sanctum',
  width: 40, height: 24,
  rows: [
    "WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW",
    "WWWWWWWWWWWWWWWWFFFFFFFFWWWWWWWWWWWWWWWW",
    "WWFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFWW",
    "WWFWWFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFWWFWW",
    "WWFWWFFFFFFFFFFFFWWWWWWFFFFFFFFFFFFWWFWW",
    "WWFFFFFFFFFFFFFFFWFFFFWFFFFFFFFFFFFFFFWW",
    "WWFFFFFFFFFFFFFFFWFFFFWFFFFFFFFFFFFFFFWW",
    "WWFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFWW",
    "WWFFFFFFWFFFFFFFFFFFFFFFFFFFFFFWFFFFFFWW",
    "WFFFFFFFWFFFFFFFFFFFFFFFFFFFFFFWFFFFFFFW",
    "WFFFFFFFWFFFFFFFFFFFFFFFFFFFFFFWFFFFFFFW",
    "WFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFW",
    "WFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFW",
    "WFFFFFFFWFFFFFFFFFFFFFFFFFFFFFFWFFFFFFFW",
    "WFFFFFFFWFFFFFFFFFFFFFFFFFFFFFFWFFFFFFFW",
    "WWFFFFFFWFFFFFFFFFFFFFFFFFFFFFFWFFFFFFWW",
    "WWFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFWW",
    "WWFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFWW",
    "WWFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFWW",
    "WWFWWFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFWWFWW",
    "WWFWWFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFWWFWW",
    "WWFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFWW",
    "WWWWWWWWWWWWWWWWFFFFFFFFWWWWWWWWWWWWWWWW",
    "WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW"
  ],
  entities: [{"kind":"player","tx":19,"ty":14},{"kind":"torch","tx":3,"ty":3},{"kind":"torch","tx":36,"ty":3},{"kind":"torch","tx":3,"ty":20},{"kind":"torch","tx":36,"ty":20},{"kind":"torch","tx":16,"ty":5},{"kind":"torch","tx":23,"ty":5},{"kind":"torch","tx":1,"ty":11},{"kind":"torch","tx":38,"ty":11},{"kind":"torch","tx":19,"ty":1},{"kind":"torch","tx":19,"ty":22},{"kind":"barrel","tx":9,"ty":9},{"kind":"barrel","tx":30,"ty":9},{"kind":"crate","tx":9,"ty":14},{"kind":"crate","tx":30,"ty":14}],
  createdAt: 0, updatedAt: 0,
};

// Default spawn tile for players entering the hub
const HUB_SPAWN = { tx: 19, ty: 14 };

