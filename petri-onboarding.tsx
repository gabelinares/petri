"use client"

import { useState, useEffect, useId } from "react"
import { PETRI, MONO, PetriDishGrid, stepConway } from "./petri-dish"

interface Props {
  onComplete: () => void
}

type Screen = "main" | "rules" | "colony"

// ============================================================
// Helpers
// ============================================================

function makeGrid(rows: number, cols: number): boolean[][] {
  return Array(rows).fill(null).map(() => Array(cols).fill(false))
}

function stepTorus(grid: boolean[][]): boolean[][] {
  const R = grid.length, C = grid[0].length
  return grid.map((row, r) =>
    row.map((cell, c) => {
      let n = 0
      for (let dr = -1; dr <= 1; dr++)
        for (let dc = -1; dc <= 1; dc++) {
          if (dr === 0 && dc === 0) continue
          if (grid[((r + dr) % R + R) % R][((c + dc) % C + C) % C]) n++
        }
      return cell ? n === 2 || n === 3 : n === 3
    })
  )
}

function freshSeed(): boolean[][] {
  const R = 12, C = 12
  const g = makeGrid(R, C)
  const dr = Math.floor(Math.random() * R), dc = Math.floor(Math.random() * C)
  const set = (r: number, c: number) => { g[(r + dr) % R][(c + dc) % C] = true }
  set(0, 1); set(0, 2); set(1, 0); set(1, 1); set(2, 1)
  return g
}

// Pulsar — period-3 oscillator, 4-fold symmetry, the most beautiful standard GoL pattern
function makePulsar(): boolean[][] {
  const g: boolean[][] = Array.from({ length: 15 }, () => Array(15).fill(false))
  const s = (r: number, c: number) => { g[r + 1][c + 1] = true }
  ;[[0,3],[0,4],[0,5],[0,7],[0,8],[0,9],
    [2,0],[2,6],[2,12],[3,0],[3,6],[3,12],[4,0],[4,6],[4,12],
    [5,3],[5,4],[5,5],[5,7],[5,8],[5,9],
    [7,3],[7,4],[7,5],[7,7],[7,8],[7,9],
    [8,0],[8,6],[8,12],[9,0],[9,6],[9,12],[10,0],[10,6],[10,12],
    [11,3],[11,4],[11,5],[11,7],[11,8],[11,9],
    [12,3],[12,4],[12,5],[12,7],[12,8],[12,9],
  ].forEach(([r, c]) => s(r, c))
  return g
}

// ============================================================
// Eval board — 6x6 pattern demonstrating all four rules
//
//   F T F F F F   ← (0,1) isolated cell
//   F F F F F F
//   F T T T F F   ← cluster row 1
//   F T T T F F   ← cluster row 2
//   F F F F F F
//   F F F F F F
//
// Cells scanned in order:
//   (0,1)  n=0  → DIES     isolation
//   (2,1)  n=3  → LIVES    survival
//   (2,2)  n=5  → DIES     overcrowding
//   (1,1)  n=3  → BORN     birth (empty cell)
// ============================================================

const EVAL_BOARD: boolean[][] = (() => {
  const g = makeGrid(6, 6)
  g[0][1] = true
  g[2][1] = g[2][2] = g[2][3] = true
  g[3][1] = g[3][2] = g[3][3] = true
  return g
})()

type ScanOutcome = 'lives' | 'dies' | 'born'
type ScanPhase = 'neighbors' | 'outcome'

interface EvalCell {
  r: number; c: number; neighbors: number; outcome: ScanOutcome
  title: string
  captionN: string
  captionOutcome: string
}

const EVAL_CELLS: EvalCell[] = [
  {
    r: 0, c: 1, neighbors: 0, outcome: 'dies',
    title: "ALONE",
    captionN: "A lone cell. No neighbors anywhere near it.",
    captionOutcome: "Zero is not enough. It starves and disappears.",
  },
  {
    r: 2, c: 1, neighbors: 3, outcome: 'lives',
    title: "BALANCED",
    captionN: "Three neighbors surround it.",
    captionOutcome: "Three neighbors. It lives.",
  },
  {
    r: 2, c: 2, neighbors: 5, outcome: 'dies',
    title: "CROWDED",
    captionN: "Five neighbors packed around it.",
    captionOutcome: "Five is too many. No room. It suffocates.",
  },
  {
    r: 1, c: 1, neighbors: 3, outcome: 'born',
    title: "CREATION",
    captionN: "Empty. Nothing here. Count what surrounds it.",
    captionOutcome: "Three neighbors. An empty space becomes alive.",
  },
]

// ============================================================
// Eval state machine
// ============================================================

type EvalState =
  | { phase: 'intro' }
  | { phase: 'neighbors'; idx: number }
  | { phase: 'outcome'; idx: number }
  | { phase: 'done' }

// ============================================================
// Main
// ============================================================

export default function PetriOnboarding({ onComplete }: Props) {
  const [screen, setScreen] = useState<Screen>("main")
  const go = (s: Screen) => setScreen(s)

  return (
    <PetriShell>
      {screen === "main"   && <MainOnboarding onNext={() => go("rules")} onSkip={onComplete} />}
      {screen === "rules"  && <RulesScreen onNext={() => go("colony")} />}
      {screen === "colony" && <ColonyScreen onComplete={onComplete} />}
    </PetriShell>
  )
}

// ============================================================
// Shell
// ============================================================

function PetriShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <style>{`
        @media (min-width: 640px) {
          .petri-shell { border-radius: 32px !important; box-shadow: 0 40px 80px -20px rgba(0,0,0,0.18), 0 0 0 1px ${PETRI.border} !important; }
        }
        @keyframes petri-fade-in  { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes dish-in { from { opacity: 0; } to { opacity: 1; } }
        @keyframes petri-fade-up  { from { opacity: 0; transform: translateY(24px) scale(0.97); } to { opacity: 1; transform: translateY(0) scale(1); } }
        @keyframes petri-pulse    { 0%,100% { opacity: 1; } 50% { opacity: 0.3; } }
        @keyframes scan-ring-pulse { 0%,100% { opacity: 0.9; } 50% { opacity: 0.3; } }
        @keyframes pop-in { from { opacity: 0; transform: scale(0.82); } to { opacity: 1; transform: scale(1); } }
        @keyframes fade-in-up { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes cell-born { 0% { opacity: 0; transform: scale(0.2); } 40% { opacity: 1; transform: scale(1.3); } 70% { opacity: 0.8; transform: scale(1); } 100% { opacity: 0; transform: scale(0.2); } }
        .fade-in     { animation: petri-fade-in 0.35s ease-out; }
        .fade-up     { animation: petri-fade-up 0.5s cubic-bezier(0.16,1,0.3,1); }
        .scan-ring   { animation: scan-ring-pulse 0.75s ease-in-out infinite; }
        .pop-in      { animation: pop-in 0.28s cubic-bezier(0.34,1.56,0.64,1); }
        .fade-in-up  { animation: fade-in-up 0.4s ease-out both; }
      `}</style>
      <div style={{ minHeight: "100dvh", width: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: PETRI.bgFrame }}>
        <div
          className="petri-shell"
          style={{ width: "100%", maxWidth: 440, height: "100dvh", maxHeight: "min(100dvh, 900px)", background: PETRI.bg, display: "flex", flexDirection: "column", overflow: "hidden", fontFamily: MONO, color: PETRI.ink, position: "relative" }}
        >
          {children}
        </div>
      </div>
    </>
  )
}

// ============================================================
// Shared atoms
// ============================================================

function TopBar({ onSkip }: { onSkip?: () => void }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 20px", borderBottom: `1px solid ${PETRI.border}`, minHeight: 52, flexShrink: 0 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ width: 7, height: 7, borderRadius: "50%", background: PETRI.life, animation: "petri-pulse 2s infinite" }} />
        <span style={{ fontSize: 11, letterSpacing: "0.18em", color: PETRI.muted, textTransform: "uppercase" }}>Petri</span>
      </div>
      {onSkip && (
        <button onClick={onSkip} style={{ background: "transparent", border: `1px solid ${PETRI.border}`, color: PETRI.muted, fontFamily: MONO, fontSize: 11, letterSpacing: "0.14em", cursor: "pointer", textTransform: "uppercase", padding: "5px 12px", borderRadius: 6 }}>
          Skip
        </button>
      )}
    </div>
  )
}

function PrimaryBtn({ children, onClick, disabled }: { children: React.ReactNode; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      onClick={onClick} disabled={disabled}
      style={{ width: "100%", padding: "19px 24px", background: disabled ? "#EDEBE5" : PETRI.ink, color: disabled ? PETRI.muted : PETRI.bg, border: "none", fontSize: 15, letterSpacing: "0.24em", textTransform: "uppercase", fontWeight: 700, cursor: disabled ? "not-allowed" : "pointer", fontFamily: MONO, transition: "background 0.15s", flexShrink: 0, borderRadius: 6 }}
    >
      {children}
    </button>
  )
}


// ============================================================
// Arc Transition
// ============================================================

function ArcTransition({ num, name, copy, cta, onNext, accent = PETRI.life, dishGrid, dishColor, staticDish = false }: { num: string; name: string; copy: string; cta: string; onNext: () => void; accent?: string; dishGrid?: boolean[][]; dishColor?: string; staticDish?: boolean }) {
  return (
    <div className="fade-in" style={{ flex: 1, display: "flex", flexDirection: "column", padding: "0 28px" }}>

      {/* Title */}
      <div className="fade-up" style={{ paddingTop: 28, paddingBottom: 18, borderBottom: `1px solid ${PETRI.border}` }}>
        <div style={{ fontSize: 9, letterSpacing: "0.38em", color: accent, textTransform: "uppercase", fontFamily: MONO, marginBottom: 8 }}>
          Level {num}
        </div>
        <div style={{ fontSize: 54, fontWeight: 700, letterSpacing: "0.04em", color: PETRI.ink, fontFamily: MONO, lineHeight: 0.92 }}>
          {name}
        </div>
      </div>

      {/* Dish — flex:1 so it fills all dead space */}
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", paddingTop: 16, paddingBottom: 16 }}>
        <PetriDishGrid grid={dishGrid ?? makeGrid(9, 9)} maxWidth={230} cellColor={dishColor} showLabels={false} />
      </div>

      {/* Copy */}
      <p style={{ fontSize: 13, color: PETRI.muted, letterSpacing: "0.05em", fontFamily: MONO, margin: "0 0 24px", lineHeight: 1.75 }}>
        {copy}
      </p>

      {/* CTA */}
      <div style={{ paddingBottom: 32 }}>
        <div style={{ height: "1px", background: PETRI.border, marginBottom: 18 }} />
        <button
          onClick={onNext}
          style={{ width: "100%", padding: "17px 24px", background: PETRI.ink, color: PETRI.bg, border: "none", fontFamily: MONO, fontSize: 13, letterSpacing: "0.22em", textTransform: "uppercase", fontWeight: 700, cursor: "pointer", borderRadius: 6 }}
        >
          {cta} →
        </button>
      </div>
    </div>
  )
}

// ============================================================
// Logo screen
// ============================================================


// ============================================================
// Persistent dish — chrome never remounts, only interior fades
// ============================================================

const DISH_CX = 120, DISH_CY = 120
const DISH_TICKS = Array.from({ length: 36 }, (_, i) => {
  const a = (i * 10 * Math.PI) / 180
  return { x1: DISH_CX + Math.cos(a) * 96, y1: DISH_CY + Math.sin(a) * 96, x2: DISH_CX + Math.cos(a) * 100, y2: DISH_CY + Math.sin(a) * 100, major: i % 3 === 0 }
})

// Count interior constants
const COUNT_SPACING = 26, COUNT_CELL_R = 9, COUNT_HALO_R = 14
const COUNT_NEIGHBORS_POS = [
  { r: 1, c: 1 }, { r: 1, c: 2 }, { r: 1, c: 3 },
  { r: 2, c: 1 },                  { r: 2, c: 3 },
  { r: 3, c: 1 }, { r: 3, c: 2 }, { r: 3, c: 3 },
]
const COUNT_LIVE_NEIGHBORS = [{ r: 1, c: 1 }, { r: 2, c: 3 }, { r: 3, c: 1 }]

// Eval interior constants
const EVAL_SPACING = 19, EVAL_CELL_R = 6, EVAL_HALO_R = 10, EVAL_ROWS = 6, EVAL_COLS = 6

const LOGO_SPACING = 14, LOGO_CELL_R = 4.5, LOGO_HALO_R = 7

function PersistentDish({ interiorKey, phase, count, evalState, showPlayback, logoGrid, extincting, playbackGrid, playbackPrev, playbackExtinct, playbackGen }: {
  interiorKey: string
  phase: 'logo' | 'intro' | 'count' | 'eval'
  count: number
  evalState: EvalState
  showPlayback: boolean
  logoGrid: boolean[][]
  extincting: boolean
  playbackGrid: boolean[][]
  playbackPrev: boolean[][]
  playbackExtinct: boolean
  playbackGen: number
}) {
  const CX = DISH_CX, CY = DISH_CY

  const activeCell = (evalState.phase === 'neighbors' || evalState.phase === 'outcome') ? EVAL_CELLS[evalState.idx] : null
  const evalPhase: ScanPhase | null = evalState.phase === 'neighbors' || evalState.phase === 'outcome' ? evalState.phase : null

  // Scan ring (outside clip path — stays visible across interior fades)
  const scanRing = (() => {
    if (phase === 'count') {
      const cx = CX, cy = CY
      return <circle cx={cx} cy={cy} r={COUNT_HALO_R + 10} fill="none" stroke={count === 3 ? PETRI.life : PETRI.ink} strokeWidth="2" className="scan-ring" style={{ transition: "stroke 0.3s" }} />
    }
    if (phase === 'eval' && !showPlayback && activeCell) {
      const cx = CX + (activeCell.c - (EVAL_COLS - 1) / 2) * EVAL_SPACING
      const cy = CY + (activeCell.r - (EVAL_ROWS - 1) / 2) * EVAL_SPACING
      const color = evalPhase === 'outcome' ? (activeCell.outcome === 'dies' ? PETRI.warn : PETRI.life) : PETRI.ink
      return <circle cx={cx} cy={cy} r={EVAL_HALO_R + 9} fill="none" stroke={color} strokeWidth="2" className="scan-ring" />
    }
    return null
  })()

  const label = showPlayback
    ? `GEN · ${String(playbackGen).padStart(3, "0")}`
    : phase === 'logo' ? 'LIVE CULTURE'
    : phase === 'count' ? 'NEIGHBOR POSITIONS'
    : phase === 'eval' ? 'COLONY · 6 × 6'
    : 'COLONY · EMPTY'

  return (
    <svg viewBox="0 0 240 256" style={{ width: "min(260px, 88vw)", height: "auto", display: "block" }}>
      <defs><clipPath id="pd-clip"><circle cx={CX} cy={CY} r="98" /></clipPath></defs>

      {/* Chrome — always rendered, never changes */}
      <ellipse cx={CX} cy={230} rx="80" ry="4" fill="#00000012" />
      <circle cx={CX} cy={CY} r="100" fill={PETRI.dishBg} stroke={PETRI.ink} strokeWidth="2" />
      <circle cx={CX} cy={CY} r="92" fill="none" stroke={PETRI.ink} strokeWidth="0.8" opacity="0.25" />
      {DISH_TICKS.map((t, i) => (
        <line key={i} x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2} stroke={PETRI.ink} strokeWidth={t.major ? "1" : "0.5"} opacity={t.major ? "0.5" : "0.25"} />
      ))}

      {/* Interior — key change triggers fade-in; chrome stays visible */}
      <g key={interiorKey} clipPath="url(#pd-clip)" style={{ animation: "dish-in 0.4s ease-out" }}>
        {phase === 'logo' && (() => {
          const lRows = logoGrid.length, lCols = logoGrid[0]?.length ?? lRows
          const cellColor = extincting ? PETRI.warn : PETRI.life
          return logoGrid.map((row, ri) => row.map((cell, ci) => {
            const lcx = CX + (ci - (lCols - 1) / 2) * LOGO_SPACING
            const lcy = CY + (ri - (lRows - 1) / 2) * LOGO_SPACING
            if (!cell) return <circle key={`${ri}${ci}`} cx={lcx} cy={lcy} r={1.4} fill={PETRI.ink} opacity="0.1" />
            return (
              <g key={`${ri}${ci}`}>
                <circle cx={lcx} cy={lcy} r={LOGO_HALO_R} fill={cellColor} opacity="0.14" />
                <circle cx={lcx} cy={lcy} r={LOGO_CELL_R} fill={cellColor} />
                <circle cx={lcx - LOGO_CELL_R * 0.28} cy={lcy - LOGO_CELL_R * 0.28} r={LOGO_CELL_R * 0.3} fill="white" opacity="0.45" />
              </g>
            )
          }))
        })()}
        {phase === 'count' && (() => {
          const ccx = (c: number) => CX + (c - 2) * COUNT_SPACING
          const ccy = (r: number) => CY + (r - 2) * COUNT_SPACING
          return <>
            {COUNT_NEIGHBORS_POS.map(({ r, c }) => (
              <circle key={`g${r}${c}`} cx={ccx(c)} cy={ccy(r)} r={COUNT_CELL_R * 0.55} fill="none" stroke={PETRI.muted} strokeWidth="1" opacity="0.2" strokeDasharray="2,2" />
            ))}
            {COUNT_LIVE_NEIGHBORS.slice(0, count).map(({ r, c }) => (
              <g key={`l${r}${c}`}>
                <circle cx={ccx(c)} cy={ccy(r)} r={COUNT_HALO_R} fill={PETRI.amber} opacity="0.2" />
                <circle cx={ccx(c)} cy={ccy(r)} r={COUNT_CELL_R} fill={PETRI.amber} />
                <circle cx={ccx(c) - COUNT_CELL_R * 0.28} cy={ccy(r) - COUNT_CELL_R * 0.28} r={COUNT_CELL_R * 0.3} fill="white" opacity="0.5" />
              </g>
            ))}
            <circle cx={ccx(2)} cy={ccy(2)} r={COUNT_HALO_R} fill={PETRI.life} opacity={count === 3 ? "0.22" : "0.15"} />
            <circle cx={ccx(2)} cy={ccy(2)} r={COUNT_CELL_R} fill={PETRI.life} />
            <circle cx={ccx(2) - COUNT_CELL_R * 0.28} cy={ccy(2) - COUNT_CELL_R * 0.28} r={COUNT_CELL_R * 0.3} fill="white" opacity="0.5" />
          </>
        })()}

        {phase === 'eval' && !showPlayback && (() => {
          const neighborSet = new Set<string>()
          if (activeCell && evalPhase === 'neighbors') {
            for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
              if (dr === 0 && dc === 0) continue
              const nr = activeCell.r + dr, nc = activeCell.c + dc
              if (nr >= 0 && nr < EVAL_ROWS && nc >= 0 && nc < EVAL_COLS) neighborSet.add(`${nr},${nc}`)
            }
          }
          return EVAL_BOARD.map((row, ri) => row.map((cell, ci) => {
            const ecx = CX + (ci - (EVAL_COLS - 1) / 2) * EVAL_SPACING
            const ecy = CY + (ri - (EVAL_ROWS - 1) / 2) * EVAL_SPACING
            const isActive = activeCell?.r === ri && activeCell?.c === ci
            const isNeighbor = neighborSet.has(`${ri},${ci}`)
            const dying = isActive && evalPhase === 'outcome' && activeCell!.outcome === 'dies'
            const born = isActive && evalPhase === 'outcome' && activeCell!.outcome === 'born'
            if (cell) {
              if (isActive) return (
                <g key={`${ri}${ci}`}>
                  <circle cx={ecx} cy={ecy} r={EVAL_HALO_R} fill={PETRI.life} opacity={dying ? "0.03" : "0.22"} />
                  <circle cx={ecx} cy={ecy} r={EVAL_CELL_R} fill={dying ? PETRI.muted : PETRI.life} opacity={dying ? "0.3" : "1"} />
                  {!dying && <circle cx={ecx - EVAL_CELL_R * 0.28} cy={ecy - EVAL_CELL_R * 0.28} r={EVAL_CELL_R * 0.3} fill="white" opacity="0.5" />}
                </g>
              )
              if (isNeighbor) return (
                <g key={`${ri}${ci}`}>
                  <circle cx={ecx} cy={ecy} r={EVAL_HALO_R} fill={PETRI.amber} opacity="0.2" />
                  <circle cx={ecx} cy={ecy} r={EVAL_CELL_R} fill={PETRI.amber} />
                  <circle cx={ecx - EVAL_CELL_R * 0.28} cy={ecy - EVAL_CELL_R * 0.28} r={EVAL_CELL_R * 0.3} fill="white" opacity="0.5" />
                </g>
              )
              return (
                <g key={`${ri}${ci}`}>
                  <circle cx={ecx} cy={ecy} r={EVAL_HALO_R} fill={PETRI.life} opacity="0.12" />
                  <circle cx={ecx} cy={ecy} r={EVAL_CELL_R} fill={PETRI.life} opacity={evalPhase === 'neighbors' ? "0.45" : "1"} />
                  {evalPhase !== 'neighbors' && <circle cx={ecx - EVAL_CELL_R * 0.28} cy={ecy - EVAL_CELL_R * 0.28} r={EVAL_CELL_R * 0.3} fill="white" opacity="0.5" />}
                </g>
              )
            } else if (born) {
              return (
                <g key={`${ri}${ci}`}>
                  <circle cx={ecx} cy={ecy} r={EVAL_HALO_R} fill={PETRI.born} opacity="0.22" />
                  <circle cx={ecx} cy={ecy} r={EVAL_CELL_R * 0.8} fill={PETRI.born} opacity="0.85" />
                </g>
              )
            } else if (isNeighbor) {
              return <circle key={`${ri}${ci}`} cx={ecx} cy={ecy} r={2.5} fill="none" stroke={PETRI.amber} strokeWidth="1" strokeDasharray="2,2" opacity="0.5" />
            } else {
              return <circle key={`${ri}${ci}`} cx={ecx} cy={ecy} r={isActive && evalPhase === 'neighbors' ? 2.2 : 1.4} fill={PETRI.muted} opacity="0.18" />
            }
          }))
        })()}

        {phase === 'eval' && showPlayback && (() => {
          const nextGrid = stepConway(playbackGrid)
          const bornSet = new Set<string>(), dyingSet = new Set<string>()
          for (let r = 0; r < EVAL_ROWS; r++) for (let c = 0; c < EVAL_COLS; c++) {
            const key = `${r},${c}`
            if (!playbackPrev[r][c] && playbackGrid[r][c]) bornSet.add(key)
            if (playbackGrid[r][c] && !nextGrid[r][c]) dyingSet.add(key)
          }
          return playbackGrid.map((row, ri) => row.map((cell, ci) => {
            const ecx = CX + (ci - (EVAL_COLS - 1) / 2) * EVAL_SPACING
            const ecy = CY + (ri - (EVAL_ROWS - 1) / 2) * EVAL_SPACING
            const key = `${ri},${ci}`
            if (!cell) return <circle key={key} cx={ecx} cy={ecy} r={1.4} fill={PETRI.muted} opacity="0.18" />
            const isBorn = bornSet.has(key), isDying = dyingSet.has(key)
            const color = isBorn ? PETRI.born : isDying ? PETRI.warn : PETRI.life
            return (
              <g key={key}>
                <circle cx={ecx} cy={ecy} r={EVAL_HALO_R} fill={color} opacity={isDying ? "0.08" : "0.18"} />
                <circle cx={ecx} cy={ecy} r={EVAL_CELL_R} fill={color} opacity={isDying ? "0.45" : "1"} />
                {!isDying && <circle cx={ecx - EVAL_CELL_R * 0.28} cy={ecy - EVAL_CELL_R * 0.28} r={EVAL_CELL_R * 0.3} fill="white" opacity="0.5" />}
              </g>
            )
          }))
        })()}

        {playbackExtinct && (
          <>
            <circle cx={CX} cy={CY} r="98" fill={PETRI.dishBg} opacity="0.92" />
            <text x={CX} y={CY - 8} textAnchor="middle" fill={PETRI.muted} fontSize="13" fontFamily={MONO} letterSpacing="0.22em" fontWeight="700">ERADICATED</text>
            <text x={CX} y={CY + 10} textAnchor="middle" fill={PETRI.muted} fontSize="8" fontFamily={MONO} letterSpacing="0.14em" opacity="0.6">gen · {String(playbackGen).padStart(3, "0")}</text>
          </>
        )}
      </g>

      {scanRing}

      <text x={CX} y="243" textAnchor="middle" fill={PETRI.muted} fontSize="8.5" fontFamily={MONO} letterSpacing="1.5">
        {label.toUpperCase()}
      </text>
    </svg>
  )
}

// ============================================================
// Main onboarding — logo + flow in one persistent layout
// ============================================================

type FlowPhase = 'intro' | 'count' | 'eval'
type OverallPhase = 'logo' | 'flow'

function MainOnboarding({ onNext, onSkip }: { onNext: () => void; onSkip: () => void }) {
  const [overall, setOverall] = useState<OverallPhase>('logo')
  const [extincting, setExtincting] = useState(false)

  // Logo colony grid (hydration-safe: start empty, seed on client)
  const [logoGrid, setLogoGrid] = useState<boolean[][]>(() => makeGrid(12, 12))
  useEffect(() => { setLogoGrid(freshSeed()) }, [])

  // Normal Conway torus animation for logo
  useEffect(() => {
    if (overall !== 'logo' || extincting) return
    const t = setInterval(() => {
      setLogoGrid(g => {
        const next = stepTorus(g)
        return next.flat().some(Boolean) ? next : freshSeed()
      })
    }, 110)
    return () => clearInterval(t)
  }, [overall, extincting])

  // Extinction drain — each tick kills ~35% of alive cells
  useEffect(() => {
    if (!extincting) return
    const t = setInterval(() => {
      setLogoGrid(g => {
        const next = g.map(row => row.map(cell => cell ? Math.random() > 0.35 : false))
        if (!next.flat().some(Boolean)) {
          clearInterval(t)
          setTimeout(() => { setOverall('flow'); setExtincting(false) }, 350)
        }
        return next
      })
    }, 90)
    return () => clearInterval(t)
  }, [extincting])

  // Flow state
  const [flowPhase, setFlowPhase] = useState<FlowPhase>('intro')
  const [count, setCount] = useState(0)
  const countDone = count >= 3
  const [evalState, setEvalState] = useState<EvalState>({ phase: 'intro' })
  const [showPlayback, setShowPlayback] = useState(false)
  const evalDone = evalState.phase === 'done'
  const [playback, setPlayback] = useState(() => ({
    prev: EVAL_BOARD.map(r => r.map(() => false as boolean)),
    grid: EVAL_BOARD, gen: 0, extinct: false,
  }))

  useEffect(() => {
    if (!evalDone) return
    const t = setTimeout(() => setShowPlayback(true), 700)
    return () => clearTimeout(t)
  }, [evalDone])

  useEffect(() => {
    if (!showPlayback || playback.extinct) return
    const t = setInterval(() => {
      setPlayback(s => {
        if (s.extinct) return s
        const next = stepConway(s.grid)
        if (!next.flat().some(Boolean)) return { ...s, extinct: true }
        return { prev: s.grid, grid: next, gen: s.gen + 1, extinct: false }
      })
    }, 1100)
    return () => clearInterval(t)
  }, [showPlayback, playback.extinct])

  const advanceEval = () => setEvalState(prev => {
    if (prev.phase === 'intro') return { phase: 'neighbors', idx: 0 }
    if (prev.phase === 'neighbors') return { phase: 'outcome', idx: prev.idx }
    if (prev.phase === 'outcome') {
      if (prev.idx < EVAL_CELLS.length - 1) return { phase: 'neighbors', idx: prev.idx + 1 }
      return { phase: 'done' }
    }
    return prev
  })

  const handlePrimary = () => {
    if (overall === 'logo') { setExtincting(true); return }
    if (flowPhase === 'intro') { setFlowPhase('count'); return }
    if (flowPhase === 'count') {
      if (!countDone) setCount(c => c + 1)
      else setFlowPhase('eval')
      return
    }
    if (flowPhase === 'eval') {
      if (evalDone) { onNext(); return }
      advanceEval()
    }
  }

  const activeCell = (evalState.phase === 'neighbors' || evalState.phase === 'outcome') ? EVAL_CELLS[evalState.idx] : null

  const btnLabel = (() => {
    if (overall === 'logo') return extincting ? '\u00a0' : 'Begin Experiment \u2192'
    if (flowPhase === 'intro') return 'What are the rules? \u2192'
    if (flowPhase === 'count') return countDone ? 'The rules \u2192' : 'Count \u2192'
    if (evalDone) return 'The full picture \u2192'
    if (evalState.phase === 'intro') return 'Check the first cell \u2192'
    if (evalState.phase === 'neighbors') return 'What happens to it? \u2192'
    if (evalState.phase === 'outcome') return evalState.idx < EVAL_CELLS.length - 1 ? 'Next cell \u2192' : 'The pattern \u2192'
    return 'Next \u2192'
  })()

  const flowTitle = (() => {
    if (overall === 'logo') return null
    if (flowPhase === 'count') return 'NEIGHBORS'
    if (flowPhase === 'eval') return activeCell?.title ?? (evalDone ? 'PLAYING' : 'OBSERVE')
    return null
  })()

  const copyContent = (() => {
    if (overall === 'logo') return (
      <div key="logo" className="fade-in" style={{ textAlign: "center" }}>
        <p style={{ fontSize: 13, letterSpacing: "0.18em", color: PETRI.muted, textTransform: "uppercase", margin: 0 }}>A cellular puzzle game</p>
      </div>
    )
    if (flowPhase === 'intro') return (
      <div key="intro" className="fade-in" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <p style={{ fontSize: 20, fontWeight: 700, letterSpacing: "0.02em", color: PETRI.ink, fontFamily: MONO, margin: 0, lineHeight: 1.3 }}>The dish is empty.</p>
        <p style={{ fontSize: 14, color: PETRI.muted, fontFamily: MONO, margin: 0, lineHeight: 1.75, letterSpacing: "0.02em" }}>
          In a moment, a single cell will appear inside it. That cell will live or die by four rules. The same rules that govern every cell in this universe.
        </p>
      </div>
    )
    if (flowPhase === 'count') {
      if (count === 0) return (
        <div key="count-0" className="fade-in" style={{ fontSize: 14, letterSpacing: "0.12em", color: PETRI.muted, textAlign: "center", textTransform: "uppercase" }}>
          Every cell counts the live cells around it.
        </div>
      )
      return (
        <div key={`count-${count}`} className="pop-in" style={{ textAlign: "center" }}>
          <div style={{ fontSize: 11, letterSpacing: "0.35em", color: PETRI.muted, textTransform: "uppercase", marginBottom: 2 }}>neighbors =</div>
          <div style={{ fontSize: 88, fontWeight: 700, color: countDone ? PETRI.life : PETRI.ink, lineHeight: 1, fontFamily: MONO, transition: "color 0.3s" }}>{count}</div>
          {countDone && <div style={{ fontSize: 13, letterSpacing: "0.16em", color: PETRI.muted, textTransform: "uppercase", marginTop: 8 }}>This number determines everything.</div>}
        </div>
      )
    }
    if (showPlayback) return (
      <div key="playback" className="fade-in" style={{ textAlign: "center" }}>
        <div style={{ display: "flex", gap: 16, justifyContent: "center", marginBottom: 10 }}>
          <span style={{ fontSize: 12, color: PETRI.born, letterSpacing: "0.1em", fontFamily: MONO }}>● born</span>
          <span style={{ fontSize: 12, color: PETRI.life, letterSpacing: "0.1em", fontFamily: MONO }}>● alive</span>
          <span style={{ fontSize: 12, color: PETRI.warn, letterSpacing: "0.1em", fontFamily: MONO }}>● dying</span>
        </div>
        <p style={{ fontSize: 13, lineHeight: 1.6, color: PETRI.muted, margin: 0, letterSpacing: "0.04em" }}>The same four rules. Playing out every generation.</p>
      </div>
    )
    if (evalState.phase === 'intro') return (
      <p key="eval-intro" className="fade-in" style={{ fontSize: 14, lineHeight: 1.65, textAlign: "center", color: PETRI.inkSoft, margin: 0, fontFamily: MONO, letterSpacing: "0.04em" }}>
        A frozen colony. For each cell: does it live or die next generation?
      </p>
    )
    if (evalState.phase === 'neighbors' && activeCell) return (
      <div key={`n-${evalState.idx}`} className="pop-in" style={{ textAlign: "center" }}>
        <div style={{ fontSize: 11, letterSpacing: "0.35em", color: PETRI.muted, textTransform: "uppercase", marginBottom: 2 }}>n =</div>
        <div style={{ fontSize: 84, fontWeight: 700, color: PETRI.ink, lineHeight: 1, fontFamily: MONO }}>{activeCell.neighbors}</div>
        <div style={{ fontSize: 13, letterSpacing: "0.1em", color: PETRI.muted, marginTop: 8, lineHeight: 1.5 }}>{activeCell.captionN}</div>
      </div>
    )
    if (evalState.phase === 'outcome' && activeCell) {
      const color = activeCell.outcome !== 'dies' ? (activeCell.outcome === 'born' ? PETRI.born : PETRI.life) : PETRI.warn
      const word = activeCell.outcome === 'lives' ? 'LIVES' : activeCell.outcome === 'dies' ? 'DIES' : 'BORN'
      return (
        <div key={`o-${evalState.idx}`} className="pop-in" style={{ textAlign: "center" }}>
          <div style={{ fontSize: 64, fontWeight: 700, color, lineHeight: 1, fontFamily: MONO, letterSpacing: "0.04em" }}>{word}</div>
          <div style={{ fontSize: 13, letterSpacing: "0.1em", color: PETRI.muted, marginTop: 10, lineHeight: 1.5 }}>{activeCell.captionOutcome}</div>
        </div>
      )
    }
    return null
  })()

  const interiorKey = overall === 'logo' ? 'logo' : showPlayback ? 'playback' : flowPhase
  const dishPhase = overall === 'logo' ? 'logo' : flowPhase

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>

      {/* Fixed-height header zone — dish is always the same distance from the top */}
      <div style={{ height: 110, flexShrink: 0, display: "flex", flexDirection: "column" }}>
        {overall === 'logo' ? (
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <h1 style={{ fontSize: 52, fontWeight: 700, letterSpacing: "0.14em", color: PETRI.ink, margin: 0, fontFamily: MONO, lineHeight: 1 }}>PETRI</h1>
          </div>
        ) : (
          <>
            <TopBar onSkip={onSkip} />
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
              {flowTitle && (
                <h2 key={flowTitle} className="fade-in" style={{ fontSize: 22, letterSpacing: "0.18em", margin: 0, textTransform: "uppercase", fontWeight: 700, color: PETRI.ink }}>
                  {flowTitle}
                </h2>
              )}
            </div>
          </>
        )}
      </div>

      {/* Dish — never remounts, same position on every step including logo */}
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", minHeight: 0 }}>
        <PersistentDish
          interiorKey={interiorKey}
          phase={dishPhase}
          count={count}
          evalState={evalState}
          showPlayback={showPlayback}
          logoGrid={logoGrid}
          extincting={extincting}
          playbackGrid={playback.grid}
          playbackPrev={playback.prev}
          playbackExtinct={playback.extinct}
          playbackGen={playback.gen}
        />
      </div>

      {/* Copy zone */}
      <div style={{ minHeight: 150, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 28px" }}>
        {copyContent}
      </div>

      {/* Button */}
      <div style={{ padding: "12px 28px 32px" }}>
        <PrimaryBtn onClick={handlePrimary} disabled={extincting}>{btnLabel}</PrimaryBtn>
      </div>
    </div>
  )
}

// ============================================================
// Rules screen — visual n-spectrum + warm cards
// ============================================================

function RulesScreen({ onNext }: { onNext: () => void }) {
  return (
    <div className="fade-in" style={{ flex: 1, display: "flex", flexDirection: "column" }}>
      <style>{`
        @keyframes bar3-glow {
          0%,100% { background-color: rgba(5,150,105,0.18); }
          50%      { background-color: rgba(5,150,105,0.26); }
        }
        @keyframes bar3-num {
          0%,100% { transform: scale(1); }
          50%      { transform: scale(1.08); }
        }
        @keyframes birth-ripple {
          0%   { transform: scale(1);   opacity: 0; }
          12%  { opacity: 0.18; }
          100% { transform: scale(2.2); opacity: 0; }
        }
        @keyframes birth-circle-pulse {
          0%,100% { box-shadow: 0 0 0 0 rgba(124,58,237,0.2); }
          60%      { box-shadow: 0 0 0 5px rgba(124,58,237,0); }
        }
      `}</style>

      <TopBar />

      <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "22px 24px 0", minHeight: 0 }}>

        {/* Heading */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 11, letterSpacing: "0.28em", color: PETRI.muted, textTransform: "uppercase", marginBottom: 5 }}>Rules recap</div>
          <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: "0.08em", color: PETRI.ink, textTransform: "uppercase", lineHeight: 1.1, marginBottom: 6 }}>The sweet spot</div>
          <div style={{ fontSize: 13, color: PETRI.muted, letterSpacing: "0.02em", lineHeight: 1.5 }}>How many neighbors for each cell?</div>
        </div>

        {/* Spectrum bar */}
        <div style={{ marginBottom: 6 }}>
          <div style={{ display: "flex", marginBottom: 7, fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", fontWeight: 700 }}>
            <div style={{ flex: 2, color: PETRI.warn, opacity: 0.7 }}>Starves</div>
            <div style={{ flex: 2, color: PETRI.life, textAlign: "center" }}>Thrives</div>
            <div style={{ flex: 5, color: PETRI.warn, opacity: 0.7, textAlign: "right" }}>Suffocates</div>
          </div>

          <div style={{ height: 52, display: "flex", borderRadius: 6, overflow: "hidden", border: `1px solid ${PETRI.border}` }}>
            <div style={{ flex: 1, background: `${PETRI.warn}18`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontSize: 15, fontWeight: 700, color: PETRI.warn, opacity: 0.5 }}>0</span>
            </div>
            <div style={{ flex: 1, background: `${PETRI.warn}12`, display: "flex", alignItems: "center", justifyContent: "center", borderLeft: `1px solid ${PETRI.border}` }}>
              <span style={{ fontSize: 15, fontWeight: 700, color: PETRI.warn, opacity: 0.5 }}>1</span>
            </div>
            <div style={{ flex: 1, background: `${PETRI.life}18`, display: "flex", alignItems: "center", justifyContent: "center", borderLeft: `2px solid ${PETRI.life}40` }}>
              <span style={{ fontSize: 17, fontWeight: 700, color: PETRI.life }}>2</span>
            </div>
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", borderRight: `2px solid ${PETRI.life}60`, animation: "bar3-glow 2.8s ease-in-out infinite", position: "relative" }}>
              <div style={{ position: "absolute", top: 6, right: 6, width: 5, height: 5, borderRadius: "50%", background: PETRI.born, opacity: 0.7 }} />
              <span style={{ fontSize: 20, fontWeight: 700, color: PETRI.life, animation: "bar3-num 2.8s ease-in-out infinite", display: "inline-block" }}>3</span>
            </div>
            {[4,5,6,7,8].map(n => (
              <div key={n} style={{ flex: 1, background: `${PETRI.warn}${n > 5 ? "10" : "15"}`, display: "flex", alignItems: "center", justifyContent: "center", borderLeft: `1px solid ${PETRI.border}` }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: PETRI.warn, opacity: Math.max(0.25, 0.55 - (n - 4) * 0.07) }}>{n}</span>
              </div>
            ))}
          </div>

          <div style={{ display: "flex", marginTop: 6, fontSize: 10, letterSpacing: "0.1em", color: PETRI.muted, textTransform: "uppercase" }}>
            <div style={{ flex: 2 }}>0 – 1</div>
            <div style={{ flex: 2, textAlign: "center", color: PETRI.life, fontWeight: 700 }}>2 – 3</div>
            <div style={{ flex: 5, textAlign: "right" }}>4 – 8</div>
          </div>
        </div>

        <div style={{ height: 1, background: PETRI.border, margin: "18px 0" }} />

        {/* Two rule cards */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>

          {/* Survival card */}
          <div style={{ border: `1.5px solid ${PETRI.life}40`, borderRadius: 10, padding: "16px 18px", background: `${PETRI.life}06`, display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 44, height: 44, borderRadius: "50%", background: `${PETRI.life}15`, border: `1.5px solid ${PETRI.life}50`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <span style={{ fontSize: 17, fontWeight: 700, color: PETRI.life, letterSpacing: "-0.02em" }}>2–3</span>
            </div>
            <div>
              <div style={{ fontSize: 11, letterSpacing: "0.2em", color: PETRI.life, textTransform: "uppercase", fontWeight: 700, marginBottom: 4 }}>Survival</div>
              <div style={{ fontSize: 13, color: PETRI.muted, lineHeight: 1.5 }}>
                An <span style={{ color: PETRI.ink, fontWeight: 700 }}>alive</span> cell with 2 or 3 neighbors survives.
              </div>
            </div>
          </div>

          {/* Birth card with ripple */}
          <div style={{ border: `1.5px solid ${PETRI.born}40`, borderRadius: 10, padding: "16px 18px", background: `${PETRI.born}06`, display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ position: "relative", width: 44, height: 44, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div style={{ position: "absolute", inset: 0, borderRadius: "50%", background: PETRI.born, animation: "birth-ripple 3s ease-out infinite both" }} />
              <div style={{ position: "absolute", inset: 0, borderRadius: "50%", background: PETRI.born, animation: "birth-ripple 3s ease-out 1.2s infinite both" }} />
              <div style={{ position: "relative", width: 44, height: 44, borderRadius: "50%", background: `${PETRI.born}15`, border: `1.5px solid ${PETRI.born}`, display: "flex", alignItems: "center", justifyContent: "center", animation: "birth-circle-pulse 3s ease-out infinite" }}>
                <span style={{ fontSize: 17, fontWeight: 700, color: PETRI.born }}>3</span>
              </div>
            </div>
            <div>
              <div style={{ fontSize: 11, letterSpacing: "0.2em", color: PETRI.born, textTransform: "uppercase", fontWeight: 700, marginBottom: 4 }}>Birth</div>
              <div style={{ fontSize: 13, color: PETRI.muted, lineHeight: 1.5 }}>
                An <span style={{ color: PETRI.ink, fontWeight: 700 }}>empty</span> cell with exactly 3 neighbors comes alive.
              </div>
            </div>
          </div>

        </div>

      </div>

      <div style={{ padding: "20px 24px 28px" }}>
        <PrimaryBtn onClick={onNext}>Build →</PrimaryBtn>
      </div>
    </div>
  )
}

// ============================================================
// Colony screen — level one title screen
// ============================================================

function makeDigit1(): boolean[][] {
  const _ = false, X = true
  return [
    [_,_,_,_,_,_,_],
    [_,_,_,X,_,_,_],
    [_,_,X,X,_,_,_],
    [_,_,_,X,_,_,_],
    [_,_,_,X,_,_,_],
    [_,_,_,X,_,_,_],
    [_,_,_,X,_,_,_],
    [_,_,X,X,X,_,_],
    [_,_,_,_,_,_,_],
  ]
}

function ColonyScreen({ onComplete }: { onComplete: () => void }) {
  return (
    <ArcTransition
      num="01"
      name="STILL LIFES"
      copy="Four rules. Now prove you understand them."
      cta="Begin"
      onNext={onComplete}
      dishGrid={makeDigit1()}
      dishColor={PETRI.life}
      staticDish
    />
  )
}
