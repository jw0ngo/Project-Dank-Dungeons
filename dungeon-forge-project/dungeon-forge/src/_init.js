// §10  INIT
//     Run once on page load
// ═══════════════════════════════════════════════════════════════
buildEdPalette();
refreshHub();
// Go straight to the town world on page load
// Firebase must be ready first — _fbInit sets up window._FB
// goTown() is safe to call immediately; presence defers gracefully if Firebase isn't ready
goTown();

