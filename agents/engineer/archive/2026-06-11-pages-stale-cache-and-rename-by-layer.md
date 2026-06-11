### 2026-06-11 — A Pages-only asset 404 with a case-correct commit is a STALE CACHE, not a path bug; and rename only the layer that's actually the art

- **Principle:** When art loads locally but 404s on GitHub Pages (Linux, case-sensitive) while Windows
  (`core.ignorecase=true`) hides it, the textbook cause is a case mismatch — but **prove it against the
  committed/staged git tree, not the working disk** (the disk lies under ignorecase; what *deploys* is the
  index). If the committed tree is already case-exact (every manifest path ∈ `git ls-tree HEAD` / `git
  ls-files --cached`, case-sensitive), then the live 404 is a **stale Pages build or CDN-cached 404**, not a
  bug in the current commit — and a content change that gives the asset a **fresh path** sidesteps it on the
  next deploy. Don't "fix" a correct commit; diagnose the delivery layer.
- **The two diagnostics that settle it fast:** (1) `git show HEAD:index.html` manifest paths vs `git ls-tree
  -r HEAD` as a **set membership** test = exactly what the case-sensitive host sees; (2) after staging a
  move, the same test against `git ls-files --cached` = what the *next* deploy will serve. Both are ~10-line
  Python; neither touches a browser.
- **Renaming an entangled identity — split by layer, not by token.** `player` meant two things: the
  **art class** (`char.player.*`, the `_bodyId` draw selectors, `fx.slash`) and the **game-logic hero
  identity** (entity `kind:'player'`, `SpriteRegistry('player')` pixel fallback, the editor, custom-sprite
  uploads). Renaming player→**knight** touched only the art layer; the logic identity is *frozen* (the
  `player` entity *wears* a `knight` class — and a blind `'player'`→`'knight'` would have broken MP/editor).
  A key-rename's "test that would have caught it": cross-check **every draw-CONSTRUCTED key**
  (`'char.'+_bodyId+'.'+dir`, `'char.knightwalk'+n+…`, `fx.knight.*`) resolves to a manifest entry **and** a
  real file — `node --check` + a path-exists grep both pass a rename that points the draw code at a dead key.
- **How to apply:** for "works here, broken on Pages," check the committed tree case-sensitively *first*
  (one grep, exonerates or convicts the commit); for any identity rename, enumerate the game-logic vs
  art-layer occurrences before find/replace (sibling to the 2026-06-09 display-text-vs-frozen-token split),
  rename only the art layer, and verify the full draw→key→file chain, not just parse.
