# PETRI — Simulation Findings

> **Rolling findings document.** Updated as new scenarios run. Reads the most recent runs first, oldest at the bottom. Each finding cites the scenario(s) that produced it.

---

## Round 1 (2026-04-10) — First comparison: grid size, advance speed, palette composition

Ran 5 scenarios varying three dimensions. Goal: establish a feel profile for each combination and identify which configurations are viable.

### The scenarios

| # | Scenario | Grid | Advance | Palette | Turns | Final (P1/P2) | Peak cells |
|---|---|---|---|---|---|---|---|
| 02 | [baseline](./outputs/02-baseline.md) | 12×12 | 4 | mixed | 8 | **6 / 10** | 41 |
| 03 | [tiny-fast](./outputs/03-tiny-fast.md) | 8×8 | 4 | mixed | 6 | **0 / 12** | 19 |
| 04 | [huge-slow](./outputs/04-huge-slow.md) | 20×20 | 4 | mixed | 12 | **7 / 34** | 56 |
| 05 | [chaos](./outputs/05-chaos.md) | 12×12 | 8 | offense-only | 8 | **0 / 11** | 37 |
| 06 | [stalemate](./outputs/06-stalemate.md) | 12×12 | 4 | defense-only | 8 | **0 / 0** ⚠️ | 45 |

---

### 🚨 Finding 1 — Defense-only leads to total extinction, not stalemate

**Scenario:** [06-stalemate](./outputs/06-stalemate.md)

I hypothesized that a defense-only game (only still lifes: Blocks, Beehives, Boats, Tubs) would feel like a boring territory count — both players plant cells, nothing moves, whoever placed more wins. I was **completely wrong**.

**What actually happened:** By turn 4, the board had 45 cells. By turn 7, both players had zero cells. Pure extinction.

The reason: **still lifes are only stable in isolation.** The moment two players place patterns within a few cells of each other, the border creates reaction zones that generate births. Over 4 Conway steps per turn, these small reactions cascade into large, unstable shapes. Those shapes then collapse entirely.

A player whose entire strategy is "I'll plant defensive patterns" will **lose all their territory within 6-7 turns** while believing they're playing safely. This is the same footgun as scenario 01's "adjacent blocks" — but worse, because it happens even when you space your own patterns apart, due to opponent proximity.

**Design implication:** A pure defensive strategy cannot be allowed to be the naive "safe" choice that actually loses. Either:
- **The game must not offer defense-only palettes** — every palette must include something that interacts meaningfully, so players are forced to engage, OR
- **The preview system must show the imminent extinction** so players can see their stable-looking patterns are about to cascade, OR
- **Placement rules must enforce a minimum distance** between friendly patterns to preserve stability

This is probably the most important finding from Round 1. The "just place blocks and wait" strategy has to lose catastrophically in playtest, not in the design doc.

---

### 🚨 Finding 2 — 8x8 is too small for pattern-based play

**Scenario:** [03-tiny-fast](./outputs/03-tiny-fast.md)

On an 8×8 grid, P1 went from **11 cells to 0 in three turns** (T3→T5). The problem isn't strategy — the problem is that 8×8 has no room for patterns to exist without interfering. By T3, both players had placed their starter patterns and the board was already saturated. Every subsequent Conway advance turned the overcrowded mess into rapid extinction on P1's side.

This confirms Agent 4's original critique: small grids don't support Conway's emergent behavior. Patterns crash into walls, crash into each other, and can't develop.

**Design implication:** **Minimum grid size for the standoff mode is 12×12.** Anything smaller is pedagogically and mechanically broken. Solo puzzles may use smaller grids for constraint-focused design, but competitive play needs room to breathe.

---

### 🚨 Finding 3 — 20x20 is too sparse early and runaway late

**Scenario:** [04-huge-slow](./outputs/04-huge-slow.md)

On a 20×20 grid, the first 4 turns were completely inactive — both players placed patterns far from each other, gliders slowly traveled, nothing interacted. Then around turn 7, P2's accumulated 4 gliders suddenly started crossing each other's paths and multiplying cells rapidly. The peak was 56 cells at T7. P2 ended with 34 cells, P1 with 7.

**The problem:** too much space early, uncontrollable explosion late. The player who deploys more mobile patterns in the opening dominates by the time patterns meet, because their "fleet" is larger. P1's defensive play couldn't respond fast enough.

Large grids also make **decision load worse** — the player has to reason about 400 cells instead of 144. That doesn't make the game deeper, it makes it harder to read.

**Design implication:** **20x20 is too big for the standoff mode.** 12×12 is probably the sweet spot. 16×16 might work with a limited palette. Larger grids should be reserved for solo puzzle modes where the player has time to reason without clock pressure.

---

### 🚨 Finding 4 — advance=8 is cognitive overload, advance=4 is correct

**Scenario:** [05-chaos](./outputs/05-chaos.md)

The offense-only + advance=8 scenario had **huge cell-count swings**: 20 → 22 → 29 → 37 → 31 → 16 → 11. Each turn the board looked dramatically different from the previous turn. Gliders moved 2 cells per turn (vs 1 at advance=4), R-pentominos erupted into 40+ cell methuselah chains.

As pure spectacle, this is visually exciting. As strategic play, it's **unreadable**. A human can't predict what will happen when the system advances 8 Conway steps at once. The meaningful play test fails.

Compare to baseline (advance=4), where cell counts swung more gradually (15 → 20 → 20 → 25 → 30 → 24 → 28 → 26 → 31 → 41 → 22 → 16). Still volatile, but each step is readable.

**Design implication:** **Locked. advance = 4 is the right default.** Higher values are playground for visual spectacle (sandbox mode, solo demos) but not competitive play. This was already locked from scenario 01 but this round confirms it empirically on a larger sample.

---

### ✅ Finding 5 — 12x12 with mixed palette is the baseline sweet spot

**Scenario:** [02-baseline](./outputs/02-baseline.md)

The baseline had the most **balanced cell dynamics** across all scenarios. Turn-by-turn totals:

| Turn | P1 | P2 | Total |
|---|---|---|---|
| 1 | 4 | 5 | 9 |
| 2 | 9 | 11 | 20 |
| 3 | 12 | 12 | 24 |
| 4 | 19 | 7 | 26 |
| 5 | 24 | 7 | 31 |
| 6 | 32 | 9 | 41 |
| 7 | 9 | 13 | 22 |
| 8 | 6 | 10 | 16 |

Notice the **momentum swings**: P1 leads from T4-T6 with up to 32 cells, then suddenly collapses while P2 recovers. This is the first scenario where **both players had lead and counter-lead moments**. The final is relatively close (6 vs 10) compared to the routs in other scenarios.

This is what a competitive game looks like: mid-game comebacks, position losses and recoveries, a final score that doesn't tell the whole story of the game. Compare to tiny-fast and stalemate, where one player's early death sealed the outcome.

**Design implication:** **12×12 grid + mixed palette + advance=4 is the canonical format** for standoff mode. All other variants are tests against this baseline.

---

### 🚨 Finding 6 — P1 lost every single scenario

Across all 5 scenarios, Player 1 (the defensive-leaning player in my designs) lost:

| Scenario | P1 Final | P2 Final | Margin |
|---|---|---|---|
| baseline | 6 | 10 | -4 |
| tiny-fast | 0 | 12 | -12 (wipeout) |
| huge-slow | 7 | 34 | -27 (rout) |
| chaos | 0 | 11 | -11 (wipeout) |
| stalemate | 0 | 0 | tie by extinction |

This could mean three things, and I can't tell which without more scenarios:

1. **I'm a bad P1 player** — my designed moves for P1 were systematically suboptimal
2. **Second-mover advantage is real** — going second lets you respond to the board state
3. **Aggressive/mobile patterns systematically beat static/defensive patterns** in pattern-based Conway play

If (3) is true, the pattern-based game has a fundamental **offense bias** that needs to be corrected through either rule design or palette design. A game where defense always loses isn't a game, it's a speedrun.

**Next scenario to run:** Re-run the baseline with **reversed strategies** — P1 plays aggressive gliders, P2 plays defensive blocks + eaters. If P1 wins this time, it's a player-skill issue. If P2 wins again, it confirms offense bias, and we need to rebalance the palette or add defense buffs.

---

### 🎯 Fun ranking (subjective, based on dynamics)

Ranked from most to least fun, with reasoning:

1. **🏆 02-baseline (12×12, advance=4, mixed)** — Actual momentum swings, both players led at different points, final was decisive but not a rout. This is what the game should feel like.

2. **05-chaos (12×12, advance=8, offense-only)** — Visually intense, big cell counts, but unreadable. Would be fun to WATCH as a demo or sandbox mode, but not to play seriously. Good as a solo demo mode.

3. **04-huge-slow (20×20, mixed)** — First half boring (everything too far apart), second half runaway (one player snowballs). Uneven pacing. Might work as a "tournament match" length format with more pattern variety, but not as a default.

4. **03-tiny-fast (8×8, mixed)** — Player elimination by turn 5. Game ends before it started. Not competitive.

5. **06-stalemate (12×12, defense-only)** — **Actively traps beginners into losing**. The "safe" strategy cascades into total extinction. If a beginner played this they'd conclude the game is broken. Must prevent.

---

## Locked design decisions (after Round 1)

These move from "open" to "locked" based on empirical evidence from this round:

- ✅ **Grid size: 12×12 default** for standoff mode (confirmed by baseline; smaller fails, larger drags)
- ✅ **advance = 4 Conway steps per turn** (confirmed; higher is chaos, lower is molasses)
- ✅ **Palette must be mixed** — defense-only leads to extinction cascades, offense-only is unreadable chaos
- ✅ **Minimum palette must include at least one defensive pattern AND one mobile pattern** — neither extreme is playable
- ✅ **Placement collision detection is essential** — the current `allowOverwrite: false` default prevents overlap silently, which is correct but also the source of Finding 2's "P1's pattern becomes garbage when placed in enemy territory." We need a UI that warns before placement.

## Still open after Round 1

- **Ownership propagation:** none of these scenarios had mixed-parent births (no contested color cells). Needs a targeted scenario where patterns are placed close enough to cross-color births.
- **Offense bias:** Finding 6 suggests defense loses systematically. Needs a reversed-strategy scenario to confirm.
- **Game length:** 8 turns worked for 12×12 baseline. 12 turns on 20×20 felt too long. 6 turns on 8×8 was irrelevant due to early death. Need to test 10-turn 12×12 games specifically.
- **Economy system:** none of these tested turn costs or energy. Every scenario had free per-turn placement. Worth testing if constraints improve play.
- **Preview effectiveness:** still untested. We know it's needed but haven't quantified the improvement.

## Suggested Round 2

1. **07-reversed-strategy** — baseline but P1 plays aggressive, P2 plays defensive. Test Finding 6.
2. **08-contested-birth** — patterns placed close across the color line to force mixed births. Test ownership rule legibility.
3. **09-balanced-palette-v2** — same 12×12 but with a different mixed palette (swap in Toad, Beacon, Eater). Test whether baseline is specifically good or generic mixed works.
4. **10-game-length** — run a 16-turn baseline to see if the game keeps being interesting past turn 8.
5. **11-placement-distance** — run scenarios where players must place patterns at least 3 cells apart from any existing cell. Does it prevent the stalemate-extinction problem?
