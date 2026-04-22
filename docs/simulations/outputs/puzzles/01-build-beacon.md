# Puzzle 01 — Build a Beacon

> SOLO PUZZLE. Player has a Block already on the dish. Goal: create a Beacon (period-2 oscillator) in 1 move by placing a second Block diagonally adjacent to the existing one. Teaches that named Conway patterns can be built from simpler ones.

## Setup

- **Grid:** 8 × 8
- **Palette:** Block
- **Advance steps per turn:** 1
- **Rules:** Solo mode. Prompt: 'Build a period-2 oscillator in 1 move.' advanceSteps=1 per turn so player visibly sees the beacon flipping between its two states. Win check: final state has 6 or 8 cells in beacon configuration.

### Design questions this scenario tests

- With advanceSteps=1, does the oscillation feel legible?
- Is the aha moment (two blocks → beacon) discoverable via ghost preview?
- Is this a satisfying 'first puzzle' or too trivial?


---

## Legend

- `.` dead (empty agar)
- `X` Player 1
- `Y` Player 2
- `*` neutral (contested birth)

---

## Initial state

```
   01234567
 0 ........
 1 ........
 2 ..XX....
 3 ..XX....
 4 ........
 5 ........
 6 ........
 7 ........
```
**Counts** · P1: **4** · P2: **0** · Neutral: 0 · Total: 4

### T1 — P2 plays `Block` @ (4,4)

> Player places a second Block diagonally adjacent to the given one.

```
   01234567
 0 ........
 1 ........
 2 ..XX....
 3 ..XX....
 4 ....YY..
 5 ....YY..
 6 ........
 7 ........
```
**Counts** · P1: **4** · P2: **4** · Neutral: 0 · Total: 8

#### ⇢ T1 — Advance (1 Conway step)

> Step 1: inner corner cells die. Beacon now in state B (6 cells).

```
   01234567
 0 ........
 1 ........
 2 ..XX....
 3 ..X.....
 4 .....Y..
 5 ....YY..
 6 ........
 7 ........
```
**Counts** · P1: **3** · P2: **3** · Neutral: 0 · Total: 6

#### ⇢ T2 — Advance (1 Conway step)

> Step 2: state A returns (8 cells). Period-2 oscillation visible.

```
   01234567
 0 ........
 1 ........
 2 ..XX....
 3 ..XX....
 4 ....YY..
 5 ....YY..
 6 ........
 7 ........
```
**Counts** · P1: **4** · P2: **4** · Neutral: 0 · Total: 8

#### ⇢ T3 — Advance (1 Conway step)

> Step 3: back to state B.

```
   01234567
 0 ........
 1 ........
 2 ..XX....
 3 ..X.....
 4 .....Y..
 5 ....YY..
 6 ........
 7 ........
```
**Counts** · P1: **3** · P2: **3** · Neutral: 0 · Total: 6

---

## Final state

**Counts** · P1: **3** · P2: **3** · Neutral: 0 · Total: 6

**Winner by territory:** Tie

---

## Strategic analysis

_This section is for the LLM to annotate after reading the simulation output. Leave empty until analyzed._

### Feel notes

_TODO_

### Decision time per move (estimated)

_TODO_

### What worked

_TODO_

### What broke

_TODO_

### Verdict

_TODO_

