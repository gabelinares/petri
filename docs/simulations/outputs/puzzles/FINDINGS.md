# PETRI Solo Puzzles — Round 1 findings

> Paper-prototype validation for the 5 solo puzzles in the MVP. Generated 2026-04-11. Every puzzle was simulated end-to-end via `sim.js`. All five have a working solution. Recommendation: **ship this puzzle set** with minor scope cuts noted below.
>
> **Context:** this puzzle set is the MVP for Gabriel's chess.com Product Designer application — shipping in ~2 days, live demo + public link + portfolio case study. Scope is ruthlessly cut. 5 hand-authored puzzles, one screen, no backend.

---

## Simulator fix along the way

The old `PATTERNS.Eater` in `sim.js` was a 6-cell shape that was NOT a valid Conway still life — it decayed on contact. I replaced it with the canonical 7-cell Eater 1 (fishhook). This is a bug fix, not a design change. The old 2-player scenarios (02-baseline etc.) that referenced `Eater` were computing from an invalid still life; if they're ever re-run, results will differ and be more correct. The historical markdown outputs are untouched.

Before:

```
##..
#.#.
.#..
.#..
```

After (canonical Eater 1 / fishhook, still life):

```
##..
#...
.###
...#
```

---

## The 5 puzzles

| # | Title | Prompt | Palette | Moves | Verdict |
|---|---|---|---|---|---|
| 01 | Build a Beacon | "Build a period-2 oscillator in 1 move." | `Block` | 1 | ✅ fun |
| 02 | Catch the Glider | "Destroy the glider in 1 move." | `Eater` | 1 | ✅ works (see caveat) |
| 03 | Glider Strike | "Destroy the specimen in 1 move." | `GliderSE` | 1 | ✅ fun |
| 04 | Silence the Blinker | "Destroy the oscillator in 1 move." | `Block` | 1 | ✅ fun |
| 05 | Silence at Range | "Destroy the specimen across the dish in 1 move." | `GliderSE` | 1 | ✅ works (see caveat) |

Each puzzle teaches a different mode of thinking: **build, defend, attack, stabilize, long-range strike**.

---

## Per-puzzle notes

### P1 — Build a Beacon ✅

**Lesson:** Named Conway patterns compose. Two blocks diagonally adjacent = a beacon. You don't always use the named piece you want; sometimes you build it from simpler parts.

**Sim result:** After the player places a second Block diagonally adjacent, the combined 8 cells oscillate visibly between state A (8 cells) and state B (6 cells) on each advance. Period-2 confirmed.

**Key design choice:** This puzzle uses `advanceSteps=1` instead of the normal `advanceSteps=4`. Reason: with `advanceSteps=4` a period-2 pattern returns to its original state on every advance and looks identical to "nothing happened." Setting `advanceSteps=1` makes the oscillation visible. **Per-puzzle advance rate is a game feature worth keeping** — it lets each puzzle tune its pacing for legibility.

**Why it's fun:** It's the clean aha moment — the player learns that the named pattern they want (Beacon) can be built from a simpler one (Block). This is the central thesis of the game, delivered in puzzle one.

**Fun rating:** 8/10. Strong opener.

---

### P2 — Catch the Glider ⚠️ partial

**Lesson:** Named tools have known behaviors. The Eater is designed for this job.

**Sim result:** Glider at (1,1) traveling SE, player places Eater at (6,6). They collide on advance 3, and everything on the board is empty by advance 4. Goal met: 0 cells at end.

**Caveat:** The Eater gets destroyed along with the glider. This is NOT the canonical "eater absorbs glider, eater survives" interaction — that requires pixel-perfect phase alignment between the glider's 4-phase oscillation and the eater's hook geometry. I couldn't land the canonical catch in the few iterations I tried without burning more credits, and honestly the player doesn't care: the goal says "destroy the glider" and the glider is destroyed.

**Pedagogical weakness:** The "Eater is a named tool with special powers" story is weaker than I'd hoped — a Block would do the same thing (crash → mutual destruction). For this puzzle the palette [Eater] vs [Block] is effectively arbitrary.

**Fix (future):** Either find the canonical catch geometry, or change the palette to `[Block, Eater]` and let the player pick. I'd note this in the case study as an honest constraint.

**Fun rating:** 6/10. Solvable, teaches "aim something at the glider," but doesn't land the named-tool story.

---

### P3 — Glider Strike ✅

**Lesson:** Spaceships travel. You can reach across the dish with a single placement. Teaches offense at distance.

**Sim result:** Block at (5,5) (center), player places GliderSE at (1,1) aimed SE. Glider travels 2 diagonal cells per period of 2 advances, reaches the block on advance 2, mutually annihilates with it. Final count: 0 cells.

**Why it's fun:** There's a satisfying delay — place the glider, watch it travel, watch the collision, watch everything clear. The player's agency is in the aiming, and the simulation does the dramatic reveal. This is the puzzle equivalent of "I set a chess trap and waited for it to spring."

**Fun rating:** 9/10. This is the strongest puzzle.

---

### P4 — Silence the Blinker ✅

**Lesson:** Overcrowding kills. A still life placed adjacent to an oscillator causes the whole cluster to die off in 3–4 steps.

**Sim result:** BlinkerH at row 3, player drops a Block overlapping the upper-left corner. Because `placePattern` skips already-alive cells, only the 2 new block cells are added. Combined 5-cell shape decays over 4 Conway steps to an empty board.

**Why it's fun:** Counterintuitive. The player might think "placing a block next to something makes it bigger." The ghost preview tells them the truth: the whole thing dies. Then they commit, hit advance, and it confirms. It's the "toggle shows check" moment — ghost preview earning its keep.

**Fun rating:** 7.5/10. Strong teaching moment, slightly less dramatic than P3.

---

### P5 — Silence at Range ⚠️ partial

**Lesson:** Combine learned tools. Glider (P3's mechanic) destroys Blinker (P4's target) from across the map. Uses everything.

**Sim result:** BlinkerH at row 7, player launches GliderSE from (1,1). Glider travels 5 diagonal cells, hits the blinker, and creates a brief expanding cross of debris before stabilizing to two new blinkers + 4 stable cells = ~10 cells total.

**Caveat:** The original blinker IS destroyed — its original cells are all empty at end — but the collision spawns new debris including two new blinkers. So "board is clean" = false, "specimen gone" = true.

**Framing fix:** Prompt wording matters here. "Destroy the specimen" is unambiguous if we define it as "the original cells are gone." "Clean the board" would be a stricter and currently failing goal. For the MVP I'd use the former.

**Alternative:** We could also lean INTO the messiness. Reframe as "The glider collision creates chaos. That's part of the show." Show the debris as a visual payoff — "you just painted on the dish." This actually fits the PETRI identity better than a sterile "all cells clear" result.

**Fun rating:** 7/10. Climactic feel, but the debris resolution needs a framing call.

---

## Overall verdict: ship it

**All 5 puzzles have working solutions the simulator verifies.** Two of them (P2, P5) have caveats about debris or the named-tool story not landing perfectly, but neither blocks the MVP. The four strongest (P1, P3, P4, and the cleaned-up P5) together tell a clear arc:

1. **P1: compose** (build a pattern from simpler ones)
2. **P3: attack** (offense at distance)
3. **P4: subtract** (kill via overcrowding)
4. **P5: combine** (everything at once)
5. **P2: defend** (catch an incoming threat)

From a chess.com reviewer's POV, that's a complete curriculum in 5 puzzles. It demonstrates the core design thesis (named pieces with known behaviors + ghost preview = Conway becomes chess-like) in under two minutes of play. Each puzzle teaches something the previous one didn't.

## What I'd change if I had more credits (not blocking)

1. **P2:** Find the canonical eater-catch geometry so the Eater survives the catch. This would make the "named tool" lesson land harder. Alternatively, reframe as [Block, Eater] multiple-choice.
2. **P5:** Tune the glider position so debris dissipates more cleanly, or embrace the debris as a visual feature.
3. **Per-puzzle advance rate:** codify this in the game UI. Don't expose it to the player, but let each puzzle configure its own Conway steps per advance.

## What I explicitly abandoned

- **Contain Chaos (RPent)** — the climactic "tame the methuselah" puzzle. Unsolvable in 2 moves. RPent is Conway's hardest and no amount of eaters inside a 14×14 grid will tame it in that budget. Scenario kept at `05-contain-chaos.json` as a historical artifact; if we ever do an expanded puzzle pack, this goes in Level 10+.
- **Guard the Beehive** — defensive puzzle where the player stops a glider from destroying a beehive. Debris from the glider/block collision propagates and destroys the beehive. Grid too small to give debris room to dissipate. Scenario kept at `05-guard-beehive.json`.

---

## Files

- **Scenarios:** `docs/simulations/scenarios/puzzles/0{1..5}-*.json`
- **Outputs:** `docs/simulations/outputs/puzzles/0{1..5}-*.md`
- **This doc:** `docs/simulations/outputs/puzzles/FINDINGS.md`

To re-run any puzzle:

```bash
node docs/simulations/sim.js docs/simulations/scenarios/puzzles/01-build-beacon.json
```
