"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import PetriOnboarding from "./petri-onboarding"
import { PETRI, MONO, PetriDishGrid, stepConway } from "./petri-dish"

const ONBOARDING_KEY = "petri_rogue_v1"
const GRID = 12
const SPACING = 14  // matches petri-dish geometry for size 12

// ============================================================
// Helpers
// ============================================================

function makeGrid(r: number, c: number): boolean[][] {
  return Array(r).fill(null).map(() => Array(c).fill(false))
}

function cloneGrid(g: boolean[][]): boolean[][] {
  return g.map(r => r.slice())
}

function stepN(g: boolean[][], n: number): boolean[][] {
  for (let i = 0; i < n; i++) g = stepConway(g)
  return g
}

function isBreach(board: boolean[][], safeRadius: number): boolean {
  const cr = (GRID - 1) / 2
  const cc = (GRID - 1) / 2
  for (let r = 0; r < GRID; r++)
    for (let c = 0; c < GRID; c++)
      if (board[r][c] && Math.sqrt((r - cr) ** 2 + (c - cc) ** 2) > safeRadius)
        return true
  return false
}

function aliveCells(board: boolean[][]): number {
  return board.flat().filter(Boolean).length
}

// ============================================================
// Wave definitions
// ============================================================

interface Wave {
  name: string
  tag: string
  tip: string
  seed: boolean[][]
  safeRadius: number      // grid cells from center
  toggleBudget: number
  seedTicks: number       // ticks shown before player's turn
  resultTicks: number     // ticks shown after player's turn
  stepsPerTick: number    // Conway steps per tick
  tickInterval: number    // ms per tick
}

const WAVES: Wave[] = [
  // Wave 1 — BlinkerH. Observe. No threat, just learn the interface.
  {
    name: "Wave 1",
    tag: "Observe",
    tip: "The ring is your boundary. Watch.",
    seed: (() => {
      const g = makeGrid(GRID, GRID)
      g[5][4] = g[5][5] = g[5][6] = true
      return g
    })(),
    safeRadius: 5.0,
    toggleBudget: 1,
    seedTicks: 8,
    resultTicks: 8,
    stepsPerTick: 1,
    tickInterval: 300,
  },

  // Wave 2 — GliderSE from (3,3). Will breach after player's turn if not stopped.
  // Lesson: isolation. Remove a cell from the glider → isolated cells die.
  {
    name: "Wave 2",
    tag: "Isolation",
    tip: "Cells with < 2 neighbors die. Break the glider apart.",
    seed: (() => {
      const g = makeGrid(GRID, GRID)
      // GliderSE pattern top-left at (3,3)
      g[3][4] = true
      g[4][5] = true
      g[5][3] = g[5][4] = g[5][5] = true
      return g
    })(),
    safeRadius: 4.5,
    toggleBudget: 2,
    seedTicks: 3,
    resultTicks: 5,
    stepsPerTick: 4,
    tickInterval: 350,
  },

  // Wave 3 — Two blinkers close together. They'll interact and create a glider.
  // Lesson: understand oscillators and their interactions.
  {
    name: "Wave 3",
    tag: "Interference",
    tip: "Oscillators near each other create new patterns.",
    seed: (() => {
      const g = makeGrid(GRID, GRID)
      // Two blinkers offset to create interaction
      g[4][3] = g[4][4] = g[4][5] = true  // BlinkerH top
      g[7][4] = g[7][5] = g[7][6] = true  // BlinkerH bottom-right
      return g
    })(),
    safeRadius: 4.3,
    toggleBudget: 2,
    seedTicks: 6,
    resultTicks: 10,
    stepsPerTick: 2,
    tickInterval: 280,
  },

  // Wave 4 — R-pentomino. Classic methuselah. Will spread far.
  // Lesson: overcrowding. Add cells to cause cascade deaths.
  {
    name: "Wave 4",
    tag: "Overcrowding",
    tip: "Cells with > 3 neighbors die. Jam a cell into a dense cluster.",
    seed: (() => {
      const g = makeGrid(GRID, GRID)
      // R-pentomino centered
      g[4][5] = g[4][6] = true
      g[5][4] = g[5][5] = true
      g[6][5] = true
      return g
    })(),
    safeRadius: 4.0,
    toggleBudget: 3,
    seedTicks: 8,
    resultTicks: 20,
    stepsPerTick: 3,
    tickInterval: 200,
  },

  // Wave 5 — Two gliders from opposite corners. Collision course.
  {
    name: "Wave 5",
    tag: "Collision",
    tip: "Two threats. One boundary. Two moves.",
    seed: (() => {
      const g = makeGrid(GRID, GRID)
      // GliderSE from NW area (2,2)
      g[2][3] = true; g[3][4] = true; g[4][2] = g[4][3] = g[4][4] = true
      // GliderNW from SE area (9,9)
      g[9][8] = true; g[8][7] = true; g[7][8] = g[7][9] = g[7][10] = true
      return g
    })(),
    safeRadius: 4.2,
    toggleBudget: 2,
    seedTicks: 4,
    resultTicks: 10,
    stepsPerTick: 4,
    tickInterval: 280,
  },

  // Wave 6 — Acorn. 5206 generations to stabilize in open space.
  {
    name: "Wave 6",
    tag: "Methuselah",
    tip: "Acorn. It runs for 5206 generations. Contain it.",
    seed: (() => {
      const g = makeGrid(GRID, GRID)
      // Acorn centered
      g[5][5] = true
      g[6][7] = true
      g[7][4] = g[7][5] = g[7][8] = g[7][9] = g[7][10] = true
      return g
    })(),
    safeRadius: 3.8,
    toggleBudget: 3,
    seedTicks: 10,
    resultTicks: 30,
    stepsPerTick: 3,
    tickInterval: 160,
  },
]

// ============================================================
// Main component — onboarding gate
// ============================================================

export default function PetriRogue() {
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (typeof window !== "undefined") {
      setShowOnboarding(!localStorage.getItem(ONBOARDING_KEY))
      setReady(true)
    }
  }, [])

  const finish = () => {
    if (typeof window !== "undefined") localStorage.setItem(ONBOARDING_KEY, "1")
    setShowOnboarding(false)
  }

  if (!ready) return null
  if (showOnboarding) return <PetriOnboarding onComplete={finish} />
  return <RogueGame onGuide={() => {
    if (typeof window !== "undefined") localStorage.removeItem(ONBOARDING_KEY)
    setShowOnboarding(true)
  }} />
}

// ============================================================
// Game state
// ============================================================

type Phase =
  | "wave-intro"    // brief intro before seed drops
  | "seed-watch"    // bacteria auto-advances, player observes
  | "player-move"   // player toggles cells
  | "result-watch"  // bacteria auto-advances after player's turn
  | "wave-clear"    // bacteria contained — success overlay
  | "wave-breach"   // bacteria escaped — failure overlay
  | "run-over"      // game over screen
  | "run-clear"     // all waves survived

interface RunState {
  phase: Phase
  waveIdx: number
  board: boolean[][]
  togglesLeft: number
  ticksDone: number
  bestRun: number   // best wave count reached
}

// ============================================================
// Rogue game
// ============================================================

function RogueGame({ onGuide }: { onGuide: () => void }) {
  const [bestRun, setBestRun] = useState(() => {
    if (typeof window !== "undefined") return parseInt(localStorage.getItem("petri_best") ?? "0")
    return 0
  })
  const [runKey, setRunKey] = useState(0)

  const startNewRun = useCallback(() => setRunKey(k => k + 1), [])

  return (
    <ActiveRun
      key={runKey}
      bestRun={bestRun}
      onRunEnd={(wavesCleared) => {
        if (wavesCleared > bestRun) {
          setBestRun(wavesCleared)
          if (typeof window !== "undefined") localStorage.setItem("petri_best", String(wavesCleared))
        }
      }}
      onNewRun={startNewRun}
      onGuide={onGuide}
    />
  )
}

// ============================================================
// Active run — one run lifecycle
// ============================================================

function ActiveRun({
  bestRun,
  onRunEnd,
  onNewRun,
  onGuide,
}: {
  bestRun: number
  onRunEnd: (wavesCleared: number) => void
  onNewRun: () => void
  onGuide: () => void
}) {
  const wave = WAVES[0]
  const [state, setState] = useState<RunState>({
    phase: "wave-intro",
    waveIdx: 0,
    board: cloneGrid(WAVES[0].seed),
    togglesLeft: WAVES[0].toggleBudget,
    ticksDone: 0,
    bestRun,
  })

  const tickRef = useRef<NodeJS.Timeout | null>(null)
  const stopTick = () => { if (tickRef.current) clearInterval(tickRef.current) }

  // Auto-advance logic
  useEffect(() => {
    const { phase, waveIdx, ticksDone } = state
    const w = WAVES[waveIdx]

    if (phase !== "seed-watch" && phase !== "result-watch") return

    const target = phase === "seed-watch" ? w.seedTicks : w.resultTicks

    tickRef.current = setInterval(() => {
      setState(prev => {
        if (prev.phase !== "seed-watch" && prev.phase !== "result-watch") return prev
        const pw = WAVES[prev.waveIdx]

        // Apply N Conway steps
        const nextBoard = stepN(cloneGrid(prev.board), pw.stepsPerTick)

        // Check breach
        if (isBreach(nextBoard, pw.safeRadius)) {
          onRunEnd(prev.waveIdx)
          return { ...prev, board: nextBoard, phase: "wave-breach" }
        }

        const newTicks = prev.ticksDone + 1
        const ptarget = prev.phase === "seed-watch" ? pw.seedTicks : pw.resultTicks

        // Phase complete
        if (newTicks >= ptarget) {
          if (prev.phase === "seed-watch") {
            return { ...prev, board: nextBoard, phase: "player-move", ticksDone: 0 }
          } else {
            // result-watch done — evaluate
            onRunEnd(prev.waveIdx + 1)
            const nextWaveIdx = prev.waveIdx + 1
            if (nextWaveIdx >= WAVES.length) {
              return { ...prev, board: nextBoard, phase: "run-clear", ticksDone: 0 }
            }
            return { ...prev, board: nextBoard, phase: "wave-clear", ticksDone: 0 }
          }
        }

        return { ...prev, board: nextBoard, ticksDone: newTicks }
      })
    }, w.tickInterval)

    return stopTick
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.phase, state.waveIdx])

  // Intro: auto-start seed-watch after brief pause
  useEffect(() => {
    if (state.phase !== "wave-intro") return
    const t = setTimeout(() => {
      setState(prev => ({ ...prev, phase: "seed-watch" }))
    }, 1200)
    return () => clearTimeout(t)
  }, [state.phase, state.waveIdx])

  const handleToggle = (r: number, c: number) => {
    if (state.phase !== "player-move" || state.togglesLeft <= 0) return
    setState(prev => {
      if (prev.phase !== "player-move" || prev.togglesLeft <= 0) return prev
      const next = cloneGrid(prev.board)
      next[r][c] = !next[r][c]
      const newToggles = prev.togglesLeft - 1
      return { ...prev, board: next, togglesLeft: newToggles }
    })
  }

  const handleDone = () => {
    if (state.phase !== "player-move") return
    setState(prev => ({ ...prev, phase: "result-watch", ticksDone: 0 }))
  }

  const handleNextWave = () => {
    const nextIdx = state.waveIdx + 1
    setState({
      phase: "wave-intro",
      waveIdx: nextIdx,
      board: cloneGrid(WAVES[nextIdx].seed),
      togglesLeft: WAVES[nextIdx].toggleBudget,
      ticksDone: 0,
      bestRun,
    })
  }

  const currentWave = WAVES[state.waveIdx]
  const boundaryRSvg = currentWave.safeRadius * SPACING
  const alert = isBreach(state.board, currentWave.safeRadius)
  const alive = aliveCells(state.board)

  return (
    <Shell>
      {/* Top bar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 20px", borderBottom: `1px solid ${PETRI.border}` }}>
        <span style={{ fontSize: 10, letterSpacing: "0.22em", color: PETRI.muted, fontFamily: MONO, textTransform: "uppercase" }}>PETRI</span>

        {/* Wave progress dots */}
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          {WAVES.map((_, i) => (
            <div key={i} style={{
              width: i === state.waveIdx ? 16 : 6,
              height: 6,
              borderRadius: 3,
              background: i < state.waveIdx ? PETRI.life : i === state.waveIdx ? PETRI.ink : PETRI.border,
              transition: "all 0.3s",
            }} />
          ))}
        </div>

        <button onClick={onGuide} style={{ background: "transparent", border: "none", fontFamily: MONO, fontSize: 9, letterSpacing: "0.18em", color: PETRI.muted, textTransform: "uppercase", cursor: "pointer" }}>
          Guide
        </button>
      </div>

      {/* Phase indicator */}
      <div style={{
        padding: "10px 20px",
        borderBottom: `1px solid ${PETRI.border}`,
        background: state.phase === "player-move" ? `${PETRI.amber}10` : state.phase === "wave-breach" ? `${PETRI.warn}10` : state.phase === "wave-clear" || state.phase === "run-clear" ? `${PETRI.life}08` : "transparent",
        transition: "background 0.3s",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.14em", fontFamily: MONO, textTransform: "uppercase", color: phaseColor(state.phase) }}>
            {phaseLabel(state.phase, state.togglesLeft)}
          </div>
          <div style={{ fontSize: 9, letterSpacing: "0.2em", color: PETRI.muted, fontFamily: MONO, textTransform: "uppercase" }}>
            {currentWave.name} · {currentWave.tag}
          </div>
        </div>
        {state.phase === "player-move" && (
          <div style={{ fontSize: 10, color: PETRI.muted, fontFamily: MONO, marginTop: 3 }}>
            {currentWave.tip}
          </div>
        )}
        {state.phase === "seed-watch" && (
          <div style={{ fontSize: 10, color: PETRI.muted, fontFamily: MONO, marginTop: 3 }}>
            {currentWave.tip}
          </div>
        )}
      </div>

      {/* Dish */}
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "8px 16px", minHeight: 0, position: "relative" }}>
        <PetriDishGrid
          grid={state.board}
          onCellClick={state.phase === "player-move" ? handleToggle : undefined}
          topLabel={currentWave.name.toUpperCase()}
          bottomLabel={`alive · ${String(alive).padStart(3, "0")}`}
          maxWidth={380}
          boundaryRSvg={boundaryRSvg}
          boundaryAlert={alert}
        />

        {/* Wave result overlay */}
        {(state.phase === "wave-clear" || state.phase === "wave-breach" || state.phase === "run-clear") && (
          <WaveOverlay
            phase={state.phase}
            waveNumber={state.waveIdx + 1}
            totalWaves={WAVES.length}
            onNext={state.phase === "wave-clear" ? handleNextWave : onNewRun}
            onRetry={onNewRun}
          />
        )}
      </div>

      {/* Controls */}
      <div style={{ padding: "12px 20px 20px", borderTop: `1px solid ${PETRI.border}` }}>
        {state.phase === "player-move" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ display: "flex", gap: 8 }}>
              {Array.from({ length: currentWave.toggleBudget }).map((_, i) => (
                <div key={i} style={{ width: 32, height: 8, borderRadius: 4, background: i < (currentWave.toggleBudget - state.togglesLeft) ? PETRI.amber : PETRI.border, transition: "background 0.2s" }} />
              ))}
            </div>
            <button
              onClick={handleDone}
              style={{ width: "100%", padding: "15px 24px", background: PETRI.ink, color: PETRI.bg, border: "none", fontSize: 12, letterSpacing: "0.26em", textTransform: "uppercase", fontWeight: 700, cursor: "pointer", fontFamily: MONO }}
            >
              ▸ Done — Advance
            </button>
          </div>
        )}

        {(state.phase === "seed-watch" || state.phase === "result-watch" || state.phase === "wave-intro") && (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontSize: 9, letterSpacing: "0.2em", color: PETRI.muted, fontFamily: MONO, textTransform: "uppercase" }}>
              {state.phase === "seed-watch" ? "Observing..." : state.phase === "result-watch" ? "Running..." : ""}
            </div>
            <button onClick={onGuide} style={{ background: "transparent", border: "none", fontFamily: MONO, fontSize: 9, letterSpacing: "0.2em", color: PETRI.muted, textTransform: "uppercase", cursor: "pointer" }}>
              Rules ↗
            </button>
          </div>
        )}

        {state.phase === "run-over" && (
          <button onClick={onNewRun} style={{ width: "100%", padding: "15px 24px", background: PETRI.ink, color: PETRI.bg, border: "none", fontSize: 12, letterSpacing: "0.26em", textTransform: "uppercase", fontWeight: 700, cursor: "pointer", fontFamily: MONO }}>
            ▸ New Run
          </button>
        )}
      </div>
    </Shell>
  )
}

// ============================================================
// Wave overlay (success / fail)
// ============================================================

function WaveOverlay({
  phase,
  waveNumber,
  totalWaves,
  onNext,
  onRetry,
}: {
  phase: "wave-clear" | "wave-breach" | "run-clear"
  waveNumber: number
  totalWaves: number
  onNext: () => void
  onRetry: () => void
}) {
  const success = phase === "wave-clear" || phase === "run-clear"

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: success ? `${PETRI.bg}e0` : `${PETRI.bg}e8`,
        backdropFilter: "blur(2px)",
        animation: "petri-fade-in 0.25s ease-out",
        gap: 16,
      }}
    >
      {phase === "run-clear" ? (
        <>
          <div style={{ fontSize: 10, letterSpacing: "0.4em", color: PETRI.life, fontFamily: MONO, textTransform: "uppercase" }}>All Waves</div>
          <div style={{ fontSize: 52, fontWeight: 700, letterSpacing: "0.06em", color: PETRI.ink, fontFamily: MONO }}>CLEARED</div>
          <div style={{ fontSize: 11, color: PETRI.muted, fontFamily: MONO, letterSpacing: "0.2em", textTransform: "uppercase" }}>You contained everything.</div>
          <button onClick={onRetry} style={overlayBtn(PETRI.ink)}>▸ Run Again</button>
        </>
      ) : phase === "wave-clear" ? (
        <>
          <div style={{ fontSize: 10, letterSpacing: "0.4em", color: PETRI.life, fontFamily: MONO, textTransform: "uppercase" }}>Wave {waveNumber} / {totalWaves}</div>
          <div style={{ fontSize: 40, fontWeight: 700, letterSpacing: "0.06em", color: PETRI.life, fontFamily: MONO }}>CONTAINED</div>
          <button onClick={onNext} style={overlayBtn(PETRI.ink)}>▸ Next Wave</button>
        </>
      ) : (
        <>
          <div style={{ fontSize: 10, letterSpacing: "0.4em", color: PETRI.warn, fontFamily: MONO, textTransform: "uppercase" }}>Wave {waveNumber} / {totalWaves}</div>
          <div style={{ fontSize: 40, fontWeight: 700, letterSpacing: "0.06em", color: PETRI.warn, fontFamily: MONO }}>BREACH</div>
          <div style={{ fontSize: 11, color: PETRI.muted, fontFamily: MONO, letterSpacing: "0.2em", textTransform: "uppercase" }}>Specimen escaped the boundary.</div>
          <button onClick={onRetry} style={overlayBtn(PETRI.ink)}>▸ New Run</button>
        </>
      )}
    </div>
  )
}

const overlayBtn = (bg: string): React.CSSProperties => ({
  padding: "13px 36px",
  background: bg,
  color: PETRI.bg,
  border: "none",
  fontSize: 11,
  letterSpacing: "0.28em",
  textTransform: "uppercase",
  fontWeight: 700,
  cursor: "pointer",
  fontFamily: MONO,
})

// ============================================================
// Shell (phone frame)
// ============================================================

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <style>{`
        @keyframes petri-fade-in { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes petri-pulse   { 0%,100% { opacity: 1; } 50% { opacity: 0.3; } }
        @media (min-width: 640px) { .petri-rogue-shell { border-radius: 32px !important; box-shadow: 0 40px 80px -20px rgba(0,0,0,0.15), 0 0 0 1px ${PETRI.border} !important; } }
      `}</style>
      <div style={{ minHeight: "100dvh", width: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: PETRI.bgFrame }}>
        <div className="petri-rogue-shell" style={{ width: "100%", maxWidth: 440, height: "100dvh", maxHeight: "min(100dvh, 900px)", background: PETRI.bg, display: "flex", flexDirection: "column", overflow: "hidden", fontFamily: MONO, color: PETRI.ink, backgroundImage: "radial-gradient(circle at 20% 10%, rgba(180,160,120,0.04), transparent 60%)" }}>
          {children}
        </div>
      </div>
    </>
  )
}

// ============================================================
// Helpers
// ============================================================

function phaseLabel(phase: Phase, togglesLeft: number): string {
  switch (phase) {
    case "wave-intro":    return "Specimen incoming..."
    case "seed-watch":    return "Specimen spreading"
    case "player-move":   return togglesLeft > 0 ? `Your move · ${togglesLeft} toggle${togglesLeft === 1 ? "" : "s"}` : "Press done"
    case "result-watch":  return "Observing outcome"
    case "wave-clear":    return "Contained"
    case "wave-breach":   return "Boundary breach"
    case "run-clear":     return "All waves cleared"
    case "run-over":      return "Run over"
  }
}

function phaseColor(phase: Phase): string {
  if (phase === "player-move") return PETRI.amber
  if (phase === "wave-breach" || phase === "run-over") return PETRI.warn
  if (phase === "wave-clear" || phase === "run-clear") return PETRI.life
  return PETRI.ink
}
