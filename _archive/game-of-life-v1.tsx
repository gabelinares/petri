"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import PetriOnboarding from "./petri-onboarding"
import { PETRI, MONO, PetriDishGrid } from "./petri-dish"

const ONBOARDING_KEY = "petri_onboarding_complete"

const GRID_SIZE = 8
const INITIAL_TIME = 300
const MAX_SIM_STEPS = 2000

// ---------- Conway helpers ----------

function countNeighbors(grid: boolean[][], row: number, col: number) {
  let count = 0
  for (let i = -1; i <= 1; i++) {
    for (let j = -1; j <= 1; j++) {
      if (i === 0 && j === 0) continue
      const r = row + i, c = col + j
      if (r >= 0 && r < GRID_SIZE && c >= 0 && c < GRID_SIZE && grid[r][c]) count++
    }
  }
  return count
}

function stepGrid(grid: boolean[][]): boolean[][] {
  return grid.map((row, r) =>
    row.map((cell, c) => {
      const n = countNeighbors(grid, r, c)
      return cell ? n === 2 || n === 3 : n === 3
    })
  )
}

function encodeGrid(grid: boolean[][]): string {
  return grid.flat().map(c => (c ? "1" : "0")).join("")
}

function classifyPattern(grid: boolean[][]): { label: string; steps: number } {
  const alive = grid.flat().filter(c => c).length
  if (alive === 0) return { label: "extinct", steps: 0 }

  const visited = new Map<string, number>()
  let current = grid
  let step = 0

  while (step < MAX_SIM_STEPS) {
    const key = encodeGrid(current)
    if (current.flat().every(c => !c)) return { label: "dies", steps: step }
    if (visited.has(key)) {
      const period = step - visited.get(key)!
      return period === 0
        ? { label: "stable", steps: Infinity }
        : { label: "loops", steps: Infinity }
    }
    visited.set(key, step)
    current = stepGrid(current)
    step++
  }
  return { label: "loops", steps: Infinity }
}

// ---------- Component ----------

type Status = "ready" | "playing" | "player1_won" | "player2_won"

export default function GameOfLife() {
  // Onboarding gate — default true to avoid a flash of onboarding for returning users
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [onboardingChecked, setOnboardingChecked] = useState(false)

  useEffect(() => {
    if (typeof window !== "undefined") {
      const done = localStorage.getItem(ONBOARDING_KEY)
      setShowOnboarding(!done)
      setOnboardingChecked(true)
    }
  }, [])

  const finishOnboarding = () => {
    if (typeof window !== "undefined") {
      localStorage.setItem(ONBOARDING_KEY, "true")
    }
    setShowOnboarding(false)
  }

  const [grid, setGrid] = useState<boolean[][]>(() =>
    Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(false))
  )
  const [generation, setGeneration] = useState(0)
  const [currentPlayer, setCurrentPlayer] = useState<1 | 2>(1)
  const [p1Time, setP1Time] = useState(INITIAL_TIME)
  const [p2Time, setP2Time] = useState(INITIAL_TIME)
  const [status, setStatus] = useState<Status>("ready")
  const [toggledCell, setToggledCell] = useState<[number, number] | null>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  const [pattern, setPattern] = useState({ label: "extinct", steps: 0 })
  useEffect(() => { setPattern(classifyPattern(grid)) }, [grid])

  const randomizeGrid = useCallback(() => {
    let g: boolean[][]
    do {
      g = Array(GRID_SIZE).fill(null).map(() =>
        Array(GRID_SIZE).fill(false).map(() => Math.random() > 0.55)
      )
    } while (g.flat().filter(c => c).length < 16)
    setGrid(g)
    setToggledCell(null)
  }, [])

  useEffect(() => { randomizeGrid() }, [randomizeGrid])

  const handleCellClick = (row: number, col: number) => {
    if (status !== "ready" && status !== "playing") return

    if (status === "ready") {
      setGrid(prev => prev.map((r, ri) => r.map((c, ci) => (ri === row && ci === col ? !c : c))))
      return
    }

    if (toggledCell) {
      const [tr, tc] = toggledCell
      if (tr === row && tc === col) {
        setGrid(prev => prev.map((r, ri) => r.map((c, ci) => (ri === row && ci === col ? !c : c))))
        setToggledCell(null)
      } else {
        setGrid(prev => prev.map((r, ri) => r.map((c, ci) => {
          if (ri === tr && ci === tc) return !c
          if (ri === row && ci === col) return !c
          return c
        })))
        setToggledCell([row, col])
      }
    } else {
      setGrid(prev => prev.map((r, ri) => r.map((c, ci) => (ri === row && ci === col ? !c : c))))
      setToggledCell([row, col])
    }
  }

  const advance = (player: 1 | 2) => {
    if (status !== "playing" || player !== currentPlayer) return
    const next = stepGrid(grid)
    setGrid(next)
    setGeneration(g => g + 1)
    setToggledCell(null)
    if (next.flat().every(c => !c)) {
      setStatus(player === 1 ? "player1_won" : "player2_won")
      if (timerRef.current) clearInterval(timerRef.current)
    } else {
      setCurrentPlayer(player === 1 ? 2 : 1)
    }
  }

  const startGame = () => { if (status === "ready") { setToggledCell(null); setStatus("playing") } }

  const resetGame = () => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
    randomizeGrid()
    setGeneration(0)
    setCurrentPlayer(1)
    setP1Time(INITIAL_TIME)
    setP2Time(INITIAL_TIME)
    setStatus("ready")
  }

  const fmt = (s: number) =>
    `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`

  useEffect(() => {
    if (status !== "playing") return
    timerRef.current = setInterval(() => {
      if (currentPlayer === 1) {
        setP1Time(prev => {
          if (prev <= 1) { clearInterval(timerRef.current!); setStatus("player2_won"); return 0 }
          return prev - 1
        })
      } else {
        setP2Time(prev => {
          if (prev <= 1) { clearInterval(timerRef.current!); setStatus("player1_won"); return 0 }
          return prev - 1
        })
      }
    }, 1000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [currentPlayer, status])

  // ---------- Derived ----------
  const alive = grid.flat().filter(c => c).length
  const hasToggle = toggledCell !== null
  const patternText =
    pattern.label === "extinct" ? "Extinct"
    : pattern.label === "stable" ? "Immortal"
    : pattern.label === "loops" ? "Looping"
    : `Dies in ${pattern.steps}`

  // ---------- Render ----------

  const petriButtonStyle = (disabled: boolean, filled: boolean): React.CSSProperties => ({
    padding: "10px 20px",
    background: disabled ? "transparent" : filled ? PETRI.ink : "transparent",
    color: disabled ? PETRI.muted : filled ? PETRI.bg : PETRI.ink,
    border: `1px solid ${disabled ? PETRI.border : PETRI.ink}`,
    fontSize: 10,
    letterSpacing: "0.22em",
    textTransform: "uppercase",
    fontWeight: 700,
    cursor: disabled ? "not-allowed" : "pointer",
    fontFamily: MONO,
    transition: "all 0.15s",
  })

  const renderPlayerBar = (player: 1 | 2) => {
    const time = player === 1 ? p1Time : p2Time
    const isActive = status === "playing" && currentPlayer === player
    const isWinner = status === (player === 1 ? "player1_won" : "player2_won")
    const lowTime = isActive && time <= 30

    return (
      <div
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "16px 24px",
          borderTop: `1px solid ${PETRI.border}`,
          opacity: isActive || isWinner || status === "ready" ? 1 : 0.4,
          transition: "opacity 0.3s",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              fontSize: 34,
              fontWeight: 500,
              letterSpacing: "-0.01em",
              fontVariantNumeric: "tabular-nums",
              fontFamily: MONO,
              color: lowTime ? PETRI.warn : isWinner ? PETRI.life : PETRI.ink,
            }}
          >
            {fmt(time)}
          </div>
          {isWinner && (
            <div
              style={{
                fontSize: 9,
                letterSpacing: "0.2em",
                color: PETRI.life,
                textTransform: "uppercase",
                fontFamily: MONO,
                fontWeight: 700,
                padding: "3px 8px",
                border: `1px solid ${PETRI.life}`,
              }}
            >
              Winner
            </div>
          )}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {isActive && (
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: hasToggle ? PETRI.amber : "transparent",
                border: `1.5px solid ${hasToggle ? PETRI.amber : PETRI.ink}`,
                transition: "all 0.2s",
                animation: hasToggle ? "none" : "petri-pulse 1.6s infinite",
              }}
            />
          )}
          <button
            onClick={() => advance(player)}
            disabled={!isActive}
            style={petriButtonStyle(!isActive, isActive && hasToggle)}
          >
            ▸ Advance
          </button>
        </div>
      </div>
    )
  }

  // ---------- Gate: onboarding ----------
  if (!onboardingChecked) return null
  if (showOnboarding) return <PetriOnboarding onComplete={finishOnboarding} />

  const smallLinkStyle: React.CSSProperties = {
    fontSize: 9,
    fontFamily: MONO,
    letterSpacing: "0.2em",
    textTransform: "uppercase",
    color: PETRI.muted,
    background: "transparent",
    border: "none",
    cursor: "pointer",
  }

  return (
    <>
      <style>{`
        @keyframes petri-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>

      {/* Outer wrapper: centered on desktop, full on mobile */}
      <div
        style={{
          minHeight: "100dvh",
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: PETRI.bgFrame,
          padding: 0,
        }}
      >
        {/* Phone-shaped frame */}
        <div
          className="petri-game-frame"
          style={{
            width: "100%",
            maxWidth: 440,
            height: "100dvh",
            maxHeight: "min(100dvh, 900px)",
            background: PETRI.bg,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            fontFamily: MONO,
            color: PETRI.ink,
            backgroundImage:
              "radial-gradient(circle at 20% 10%, rgba(180, 160, 120, 0.04), transparent 60%), radial-gradient(circle at 80% 90%, rgba(120, 180, 160, 0.03), transparent 60%)",
          }}
        >
          <style>{`
            @media (min-width: 640px) {
              .petri-game-frame {
                border-radius: 32px !important;
                box-shadow: 0 40px 80px -20px rgba(0,0,0,0.15), 0 0 0 1px ${PETRI.border} !important;
              }
            }
          `}</style>

          {/* PLAYER 2 ZONE (top, rotated) */}
          <div style={{ transform: "rotate(180deg)" }}>
            {renderPlayerBar(2)}
          </div>

          {/* CENTER ZONE: status + grid + controls */}
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "8px 16px",
              gap: 16,
              minHeight: 0,
            }}
          >
            {/* Status line */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                fontSize: 10,
                letterSpacing: "0.22em",
                color: PETRI.muted,
                textTransform: "uppercase",
                fontFamily: MONO,
              }}
            >
              <span>Gen {String(generation).padStart(2, "0")}</span>
              <span>·</span>
              <span>{alive} alive</span>
              <span>·</span>
              <span style={{ color: PETRI.ink, fontWeight: 600 }}>{patternText}</span>
            </div>

            {/* THE DISH */}
            <PetriDishGrid
              grid={grid}
              onCellClick={handleCellClick}
              toggledCell={toggledCell}
              maxWidth={420}
              bottomLabel={`cycle · ${String(generation).padStart(3, "0")}`}
            />

            {/* Controls below grid */}
            {status === "ready" && (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, marginTop: 4 }}>
                <div style={{ display: "flex", gap: 10 }}>
                  <button onClick={startGame} style={{ ...petriButtonStyle(false, true), padding: "12px 28px" }}>
                    ▸ Start Game
                  </button>
                  <button onClick={() => randomizeGrid()} style={{ ...petriButtonStyle(false, false), padding: "12px 20px" }}>
                    Shuffle
                  </button>
                </div>
                <button
                  onClick={() => {
                    if (typeof window !== "undefined") localStorage.removeItem(ONBOARDING_KEY)
                    setShowOnboarding(true)
                  }}
                  style={smallLinkStyle}
                >
                  Replay Tutorial
                </button>
              </div>
            )}

            {(status === "player1_won" || status === "player2_won") && (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
                <p
                  style={{
                    fontSize: 14,
                    letterSpacing: "0.22em",
                    textTransform: "uppercase",
                    fontWeight: 700,
                    color: PETRI.life,
                    margin: 0,
                  }}
                >
                  {status === "player1_won" ? "Bottom" : "Top"} Player Wins
                </p>
                <button onClick={resetGame} style={{ ...petriButtonStyle(false, false), padding: "12px 24px" }}>
                  ▸ Play Again
                </button>
              </div>
            )}

            {status === "playing" && (
              <button onClick={resetGame} style={smallLinkStyle}>
                Reset
              </button>
            )}
          </div>

          {/* PLAYER 1 ZONE (bottom) */}
          {renderPlayerBar(1)}
        </div>
      </div>
    </>
  )
}
