# Baseline — 12x12 mixed palette

> Reference scenario. 12x12 grid, mixed defensive/offensive palette, 4 Conway steps per turn. Everything else compares against this.

## Setup

- **Grid:** 12 × 12
- **Palette:** Block, Beehive, Eater, GliderSE
- **Advance steps per turn:** 4
- **Rules:** Standard Conway + majority-of-parents ownership, advanceSteps=4

### Design questions this scenario tests

- Does a balanced game feel like a proper chess-length match?
- Do patterns meet and interact at a reasonable pace?
- Is the final outcome decisive or close?


---

## Legend

- `.` dead (empty agar)
- `X` Player 1
- `Y` Player 2
- `*` neutral (contested birth)

---

## Initial state

```
   012345678901
 0 ............
 1 ............
 2 ............
 3 ............
 4 ............
 5 ............
 6 ............
 7 ............
 8 ............
 9 ............
10 ............
11 ............
```
**Counts** · P1: **0** · P2: **0** · Neutral: 0 · Total: 0

### T1 — P1 plays `Block` @ (6,3)

> P1 central-left defensive anchor

```
   012345678901
 0 ............
 1 ............
 2 ............
 3 ............
 4 ............
 5 ............
 6 ...XX.......
 7 ...XX.......
 8 ............
 9 ............
10 ............
11 ............
```
**Counts** · P1: **4** · P2: **0** · Neutral: 0 · Total: 4

### T1 — P2 plays `GliderSE` @ (0,0)

> P2 launches NW glider toward center

```
   012345678901
 0 .Y..........
 1 ..Y.........
 2 YYY.........
 3 ............
 4 ............
 5 ............
 6 ...XX.......
 7 ...XX.......
 8 ............
 9 ............
10 ............
11 ............
```
**Counts** · P1: **4** · P2: **5** · Neutral: 0 · Total: 9

#### ⇢ T1 — Advance (4 Conway steps)

```
   012345678901
 0 ............
 1 ..Y.........
 2 ...Y........
 3 .YYY........
 4 ............
 5 ............
 6 ...XX.......
 7 ...XX.......
 8 ............
 9 ............
10 ............
11 ............
```
**Counts** · P1: **4** · P2: **5** · Neutral: 0 · Total: 9

### T2 — P1 plays `Eater` @ (8,8)

> P1 plants an eater — the natural glider counter

```
   012345678901
 0 ............
 1 ..Y.........
 2 ...Y........
 3 .YYY........
 4 ............
 5 ............
 6 ...XX.......
 7 ...XX.......
 8 ........XX..
 9 ........X.X.
10 .........X..
11 .........X..
```
**Counts** · P1: **10** · P2: **5** · Neutral: 0 · Total: 15

### T2 — P2 plays `GliderSE` @ (0,6)

> Second glider from N-center

```
   012345678901
 0 .......Y....
 1 ..Y.....Y...
 2 ...Y..YYY...
 3 .YYY........
 4 ............
 5 ............
 6 ...XX.......
 7 ...XX.......
 8 ........XX..
 9 ........X.X.
10 .........X..
11 .........X..
```
**Counts** · P1: **10** · P2: **10** · Neutral: 0 · Total: 20

#### ⇢ T2 — Advance (4 Conway steps)

```
   012345678901
 0 ............
 1 ........Y...
 2 ...Y.....Y..
 3 ..Y.Y..YYY..
 4 ...YY.......
 5 ...Y........
 6 ...X........
 7 ...X........
 8 ........XX..
 9 .......X..X.
10 ........X.X.
11 .........X..
```
**Counts** · P1: **9** · P2: **11** · Neutral: 0 · Total: 20

### T3 — P1 plays `Beehive` @ (3,8)

> P1 territory grab in NE

```
   012345678901
 0 ............
 1 ........Y...
 2 ...Y.....Y..
 3 ..Y.Y..YYYX.
 4 ...YY...X..X
 5 ...Y.....XX.
 6 ...X........
 7 ...X........
 8 ........XX..
 9 .......X..X.
10 ........X.X.
11 .........X..
```
**Counts** · P1: **14** · P2: **11** · Neutral: 0 · Total: 25

### T3 — P2 plays `GliderSE` @ (5,0)

> Third glider from W, flanking

```
   012345678901
 0 ............
 1 ........Y...
 2 ...Y.....Y..
 3 ..Y.Y..YYYX.
 4 ...YY...X..X
 5 .Y.Y.....XX.
 6 ..YX........
 7 YYYX........
 8 ........XX..
 9 .......X..X.
10 ........X.X.
11 .........X..
```
**Counts** · P1: **14** · P2: **16** · Neutral: 0 · Total: 30

#### ⇢ T3 — Advance (4 Conway steps)

```
   012345678901
 0 ............
 1 ............
 2 .......YY...
 3 .......YYYXX
 4 .......YY..X
 5 .........XX.
 6 ............
 7 Y.Y.........
 8 Y.Y.....XX..
 9 .Y.....X..X.
10 ........X.X.
11 .........X..
```
**Counts** · P1: **12** · P2: **12** · Neutral: 0 · Total: 24

### T4 — P1 plays `Block` @ (9,2)

> P1 SW corner defense

```
   012345678901
 0 ............
 1 ............
 2 .......YY...
 3 .......YYYXX
 4 .......YY..X
 5 .........XX.
 6 ............
 7 Y.Y.........
 8 Y.Y.....XX..
 9 .YXX...X..X.
10 ..XX....X.X.
11 .........X..
```
**Counts** · P1: **16** · P2: **12** · Neutral: 0 · Total: 28

#### ⇢ T4 — Advance (4 Conway steps)

> P2 observes, no placement

```
   012345678901
 0 ............
 1 ............
 2 .......YYXX.
 3 ......YYYX.X
 4 ......Y..XX.
 5 .......YX.XX
 6 .......X..X.
 7 .......X....
 8 .......X..X.
 9 .......X..X.
10 ........X.X.
11 .........X..
```
**Counts** · P1: **19** · P2: **7** · Neutral: 0 · Total: 26

#### ⇢ T5 — Advance (4 Conway steps)

> Turn 5 — gliders converging on defenses

```
   012345678901
 0 .........X..
 1 ........X.X.
 2 ......YY..X.
 3 ......YY....
 4 ....Y.Y.....
 5 ...Y..X.XXX.
 6 ....X.XXX..X
 7 .....X...X..
 8 ........X...
 9 .......X.X..
10 .......X...X
11 .......XXXX.
```
**Counts** · P1: **24** · P2: **7** · Neutral: 0 · Total: 31

#### ⇢ T6 — Advance (4 Conway steps)

> Turn 6 — impact zone

```
   012345678901
 0 ........XX..
 1 .......Y..X.
 2 .......YYX..
 3 .......XXX..
 4 ....YYXXXX..
 5 ...Y.YXX.XXX
 6 ...YY.....X.
 7 .........XX.
 8 .........XX.
 9 ........XXX.
10 .....X.X.XX.
11 ......XXXX..
```
**Counts** · P1: **32** · P2: **9** · Neutral: 0 · Total: 41

#### ⇢ T7 — Advance (4 Conway steps)

> Turn 7 — debris settles

```
   012345678901
 0 .......XX...
 1 ...........X
 2 ......YYXX.X
 3 .....YYYX.XX
 4 ....YY......
 5 ...Y.Y......
 6 ..YY.YY.....
 7 ............
 8 ............
 9 ............
10 ............
11 ............
```
**Counts** · P1: **9** · P2: **13** · Neutral: 0 · Total: 22

#### ⇢ T8 — Advance (4 Conway steps)

> Turn 8 — final state

```
   012345678901
 0 ............
 1 .........XX.
 2 .........X.X
 3 ...Y......XX
 4 ...YY.......
 5 ..Y..Y......
 6 ...YYY......
 7 ...YY.......
 8 ............
 9 ............
10 ............
11 ............
```
**Counts** · P1: **6** · P2: **10** · Neutral: 0 · Total: 16

---

## Final state

**Counts** · P1: **6** · P2: **10** · Neutral: 0 · Total: 16

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

