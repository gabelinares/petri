# Tiny fast — 8x8 mixed palette

> Same mixed palette, but on an 8x8 grid. Hypothesis: small grid = immediate chaos, gliders crash on walls within 1-2 turns, placements overlap frequently. Will it feel frantic or broken?

## Setup

- **Grid:** 8 × 8
- **Palette:** Block, Beehive, Eater, GliderSE
- **Advance steps per turn:** 4
- **Rules:** Same as baseline except 8x8

### Design questions this scenario tests

- Do gliders reach the opposite wall before the player can think?
- Is there enough space to place multiple distinct patterns?
- Does the game feel fun-frantic or broken-cramped?


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
 2 ........
 3 ........
 4 ........
 5 ........
 6 ........
 7 ........
```
**Counts** · P1: **0** · P2: **0** · Neutral: 0 · Total: 0

### T1 — P1 plays `Block` @ (4,2)

> Central block, best defensive spot

```
   01234567
 0 ........
 1 ........
 2 ........
 3 ........
 4 ..XX....
 5 ..XX....
 6 ........
 7 ........
```
**Counts** · P1: **4** · P2: **0** · Neutral: 0 · Total: 4

### T1 — P2 plays `GliderSE` @ (0,0)

> NW glider, will reach opposite corner fast

```
   01234567
 0 .Y......
 1 ..Y.....
 2 YYY.....
 3 ........
 4 ..XX....
 5 ..XX....
 6 ........
 7 ........
```
**Counts** · P1: **4** · P2: **5** · Neutral: 0 · Total: 9

#### ⇢ T1 — Advance (4 Conway steps)

```
   01234567
 0 ..Y.....
 1 .Y.Y....
 2 YY......
 3 ...XX...
 4 ..X.X...
 5 ........
 6 ........
 7 ........
```
**Counts** · P1: **4** · P2: **5** · Neutral: 0 · Total: 9

### T2 — P1 plays `Eater` @ (3,4)

> Eater near block

```
   01234567
 0 ..Y.....
 1 .Y.Y....
 2 YY......
 3 ...XXX..
 4 ..X.X.X.
 5 .....X..
 6 .....X..
 7 ........
```
**Counts** · P1: **8** · P2: **5** · Neutral: 0 · Total: 13

#### ⇢ T2 — Advance (4 Conway steps)

> P2 observes — limited space to place more

```
   01234567
 0 ........
 1 .YX.....
 2 YY.X....
 3 .....X..
 4 .Y.X..X.
 5 ..X.X..X
 6 .....XX.
 7 ........
```
**Counts** · P1: **10** · P2: **4** · Neutral: 0 · Total: 14

### T3 — P2 plays `GliderSE` @ (0,4)

> Second glider from N-right

```
   01234567
 0 .....Y..
 1 .YX...Y.
 2 YY.XYYY.
 3 .....X..
 4 .Y.X..X.
 5 ..X.X..X
 6 .....XX.
 7 ........
```
**Counts** · P1: **10** · P2: **9** · Neutral: 0 · Total: 19

#### ⇢ T3 — Advance (4 Conway steps)

```
   01234567
 0 .Y..X...
 1 .Y...Y..
 2 ...X..Y.
 3 ....Y...
 4 ....XX.X
 5 ...X...X
 6 ...X..X.
 7 ...X..X.
```
**Counts** · P1: **11** · P2: **5** · Neutral: 0 · Total: 16

#### ⇢ T4 — Advance (4 Conway steps)

> Expect impact — glider vs wall/defense

```
   01234567
 0 ....YY..
 1 ...YX...
 2 ....Y.YX
 3 ........
 4 ........
 5 ..X.....
 6 .X.....X
 7 ..X....X
```
**Counts** · P1: **7** · P2: **5** · Neutral: 0 · Total: 12

#### ⇢ T5 — Advance (4 Conway steps)

> Debris forms

```
   01234567
 0 ...YYY..
 1 ..Y...Y.
 2 ..Y...Y.
 3 ...Y.Y..
 4 ....Y...
 5 ........
 6 ........
 7 ........
```
**Counts** · P1: **0** · P2: **10** · Neutral: 0 · Total: 10

#### ⇢ T6 — Advance (4 Conway steps)

> Settling

```
   01234567
 0 ...YYY..
 1 .Y.....Y
 2 .Y.....Y
 3 .Y.....Y
 4 ........
 5 ...YYY..
 6 ........
 7 ........
```
**Counts** · P1: **0** · P2: **12** · Neutral: 0 · Total: 12

---

## Final state

**Counts** · P1: **0** · P2: **12** · Neutral: 0 · Total: 12

**Winner by territory:** P2

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

