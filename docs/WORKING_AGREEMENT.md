# Dungeon Forge — Working Agreement
**How the developer and AI assistant collaborate on this project**

This document captures the working patterns established across 9+ sessions. A new LLM should read this before starting any work session.

---

## Request Style

**The developer gives terse requests.** "build it", "fix this", "assess the bug" are complete instructions. Do not ask for clarification unless the spec is genuinely ambiguous in a way that would change the implementation. When in doubt, make a reasonable assumption, state it inline, and proceed.

**Screenshots are bug reports.** When a screenshot is provided alongside a bug description, read the image carefully before touching any code. The visual state often contains the root cause (health bar empty at spawn, no enemies visible, wrong layout, etc.).

**"Assess" means diagnose first, fix second.** When asked to assess a bug, trace the full call chain and identify all plausible causes before writing a single line of fix code. State the root cause clearly, then fix it. Do not speculatively patch things.

---

## Development Discipline

**Read before writing.** Before any code change, read the relevant section of the file. Never assume a function's signature or a variable's location from memory — always grep and verify.

**Verify after every change.** Every code change must be followed by:
1. `node --check` on the extracted JS to confirm no syntax errors
2. A targeted verification check (grep or node module) confirming the change is present and correct

**30-line str_replace minimum context.** When using str_replace, include enough surrounding context to be unique. Never replace a 1-line string that appears multiple times.

**Python for multi-site changes.** When a change needs to be made in 3+ locations, use a Python script that reports OK/SKIP/FAIL for each replacement. Never do multi-site changes with repeated str_replace calls that can leave the file in a half-patched state.

**Skills first.** Before creating any file (docx, pptx, etc.), read the relevant SKILL.md. Before building a visual UI, read the frontend-design SKILL.md.

---

## Communication Style

**No preamble on code delivery.** When delivering a built feature, the message structure is: brief description of what was built → present_files. No "I've completed the implementation of..." filler.

**Verification counts matter.** End significant feature deliveries with a `X/X passed` verification summary. This gives the developer confidence without reading the code.

**State assumptions inline.** If a design decision is ambiguous, make the reasonable choice and note it in a comment or inline in the response. Don't stop to ask.

**Flag structural issues.** If a request would create technical debt or has a better architectural approach, say so briefly before proceeding. One sentence. Then do what was asked unless the developer redirects.

---

## Bug Investigation Protocol

1. **Read the error or screenshot** — extract the exact symptom
2. **Grep for all relevant references** — don't assume file location
3. **Trace the call chain** — follow the data from trigger to symptom
4. **Identify all plausible causes** — list them before fixing
5. **State the root cause** — be specific ("missing `hp` field in EntityDefs means `undefined <= 0` is `false`")
6. **Fix the confirmed cause** — do not speculatively patch adjacent code
7. **Verify the fix** — targeted check, not just `node --check`

---

## Project Rhythms

- Sessions end with a CTO doc update and journal entry
- The developer playtests between sessions and reports bugs via screenshot + one-line description
- Architecture decisions (refactors, new systems) are discussed briefly before implementation
- Performance is checked periodically — if gEnemies grows unbounded or a loop is O(n²), flag it
- The single-file constraint (`dungeon_forge.html`) is intentional — do not propose splitting

---

## What the Developer Values

- **Speed** — fast iteration, minimal friction
- **Correctness** — bugs should be traced to root cause, not patched at the symptom
- **Game feel** — visual polish, audio feedback, juice (particles, screen shake, damage numbers) matters
- **Clarity** — systems should be named and structured so any LLM can pick them up cold
- **No fluff** — in code comments, in responses, in variable names
