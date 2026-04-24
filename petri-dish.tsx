"use client"

import { useRef } from "react"

// ============================================================
// PETRI — Shared Design Tokens
// ============================================================

export const PETRI = {
  bg: "#FAFAF7",
  bgFrame: "#F0EFE9",
  dishBg: "#F4F4EE",
  ink: "#0A0A0A",
  inkSoft: "#1A1A1A",
  muted: "#57534E",
  mutedLight: "#78716C",
  border: "#E7E5E0",
  life: "#059669",
  lifeGlow: "#05966915",
  amber: "#D97706",
  warn: "#DC2626",
  born: "#7C3AED",
}

export const MONO = `ui-monospace, "SF Mono", "Monaco", "Cascadia Code", "Source Code Pro", Menlo, Consolas, monospace`

// ============================================================
// Conway step helper
// ============================================================

export function stepConway(grid: boolean[][]): boolean[][] {
  const rows = grid.length
  const cols = grid[0]?.length ?? 0
  return grid.map((row, r) =>
    row.map((cell, c) => {
      let count = 0
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (dr === 0 && dc === 0) continue
          const nr = r + dr, nc = c + dc
          if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && grid[nr][nc]) count++
        }
      }
      return cell ? count === 2 || count === 3 : count === 3
    })
  )
}

// ============================================================
// Petri Dish Grid — interactive SVG with Voronoi click detection
// ============================================================

interface PetriDishGridProps {
  grid: boolean[][]
  onCellClick?: (row: number, col: number) => void
  toggledCell?: [number, number] | null
  topLabel?: string
  bottomLabel?: string
  maxWidth?: number
  showLabels?: boolean
  /** Cells that will appear after next advance — shown as dim ghost circles */
  ghostCells?: [number, number][]
  /** Cells that were just placed by the player — shown as amber highlight ring */
  highlightCells?: [number, number][]
  /** Cells born this generation — shown in purple for one step */
  bornCells?: [number, number][]
  /** Draw a containment boundary ring at this SVG-unit radius from center */
  boundaryRSvg?: number
  /** Turn the boundary ring red (bacteria in danger zone) */
  boundaryAlert?: boolean
  /** Apply organic turbulence displacement to cells for a wabi-sabi look */
  organic?: boolean
  /** Override the live-cell color (defaults to PETRI.life green) */
  cellColor?: string
}

export function PetriDishGrid({
  grid,
  onCellClick,
  toggledCell,
  topLabel = "⊹ 40x",
  bottomLabel,
  maxWidth = 340,
  showLabels = true,
  ghostCells = [],
  highlightCells = [],
  bornCells = [],
  boundaryRSvg,
  boundaryAlert = false,
  organic = false,
  cellColor = PETRI.life,
}: PetriDishGridProps) {
  const rows = grid.length
  const cols = grid[0]?.length ?? rows
  const size = Math.max(rows, cols)
  const CX = 120
  const CY = 120
  const containerRef = useRef<HTMLDivElement>(null)

  // Geometry scales with grid size so cells stay inside the dish rim (r=96)
  // Constraint: max corner distance + haloR ≤ 96
  const geometry = (() => {
    if (size <= 3) return { spacing: 42, cellR: 13, haloR: 20, deadR: 3 }
    if (size === 4) return { spacing: 30, cellR: 10, haloR: 15, deadR: 2.5 }
    if (size === 5) return { spacing: 24, cellR: 8, haloR: 12, deadR: 2 }
    if (size === 6) return { spacing: 19, cellR: 6, haloR: 9, deadR: 2 }
    if (size === 7) return { spacing: 22, cellR: 6.5, haloR: 9, deadR: 1.8 }
    if (size === 8) return { spacing: 20, cellR: 6, haloR: 8.5, deadR: 1.7 }
    if (size === 9) return { spacing: 17, cellR: 5.5, haloR: 8, deadR: 1.5 }
    if (size === 10) return { spacing: 16, cellR: 5, haloR: 7.5, deadR: 1.5 }
    if (size === 11) return { spacing: 15, cellR: 4.5, haloR: 7, deadR: 1.4 }
    return { spacing: 14, cellR: 4.5, haloR: 7, deadR: 1.4 } // 12+
  })()

  const { spacing, cellR, haloR, deadR } = geometry
  const defaultLabel = `agar · ${rows}x${cols}`
  const labelText = bottomLabel ?? defaultLabel

  // Build fast lookup sets for ghost and highlight cells
  const ghostSet = new Set(ghostCells.map(([r, c]) => `${r},${c}`))
  const highlightSet = new Set(highlightCells.map(([r, c]) => `${r},${c}`))
  const bornSet = new Set(bornCells.map(([r, c]) => `${r},${c}`))

  // Voronoi click: any click inside the dish maps to nearest cell
  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!onCellClick || !containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const relX = e.clientX - rect.left
    const relY = e.clientY - rect.top
    const vx = (relX / rect.width) * 240
    const vy = (relY / rect.height) * 256 // viewBox is 240×256

    const distFromCenter = Math.hypot(vx - CX, vy - CY)
    if (distFromCenter > 100) return

    let minDist = Infinity
    let closest: [number, number] | null = null
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const ccx = CX + (c - (cols - 1) / 2) * spacing
        const ccy = CY + (r - (rows - 1) / 2) * spacing
        const d = Math.hypot(vx - ccx, vy - ccy)
        if (d < minDist) {
          minDist = d
          closest = [r, c]
        }
      }
    }

    if (closest && minDist <= spacing * 0.9) {
      onCellClick(closest[0], closest[1])
    }
  }

  return (
    <div
      ref={containerRef}
      onClick={onCellClick ? handleClick : undefined}
      style={{
        position: "relative",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: onCellClick ? "pointer" : "default",
      }}
    >
      {/* viewBox is 240×256 — 16px extra at bottom clears shadow for label */}
      <svg
        viewBox="0 0 240 256"
        style={{
          width: `min(${maxWidth}px, 85vw)`,
          height: "auto",
          display: "block",
        }}
      >
        <defs>
          {/* Clip cells to stay inside the dish glass wall */}
          <clipPath id="dish-clip">
            <circle cx={CX} cy={CY} r="98" />
          </clipPath>
          {/* Organic cell displacement — wabi-sabi uneven edges */}
          {organic && (
            <filter id="petri-organic" x="-30%" y="-30%" width="160%" height="160%">
              <feTurbulence type="turbulence" baseFrequency="0.55" numOctaves="3" seed="7" result="noise" />
              <feDisplacementMap in="SourceGraphic" in2="noise" scale={cellR * 0.55} xChannelSelector="R" yChannelSelector="G" />
            </filter>
          )}
        </defs>

        {/* Cast shadow under the dish */}
        <ellipse cx={CX} cy={230} rx="80" ry="4" fill="#00000012" />

        {/* Dish background */}
        <circle cx={CX} cy={CY} r="100" fill={PETRI.dishBg} stroke={PETRI.ink} strokeWidth="2" />

        {/* Inner lip ring */}
        <circle cx={CX} cy={CY} r="92" fill="none" stroke={PETRI.ink} strokeWidth="0.8" opacity="0.25" />

        {/* Rim tick marks — every 10° */}
        {Array.from({ length: 36 }).map((_, i) => {
          const angle = (i * 10 * Math.PI) / 180
          const x1 = CX + Math.cos(angle) * 96
          const y1 = CY + Math.sin(angle) * 96
          const x2 = CX + Math.cos(angle) * 100
          const y2 = CY + Math.sin(angle) * 100
          return (
            <line
              key={i}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke={PETRI.ink}
              strokeWidth={i % 3 === 0 ? "1" : "0.5"}
              opacity={i % 3 === 0 ? "0.5" : "0.25"}
            />
          )
        })}

        {/* Containment boundary ring */}
        {boundaryRSvg && (
          <circle
            cx={CX} cy={CY} r={boundaryRSvg}
            fill="none"
            stroke={boundaryAlert ? PETRI.warn : PETRI.muted}
            strokeWidth={boundaryAlert ? "1.5" : "0.8"}
            strokeDasharray="4 3"
            opacity={boundaryAlert ? "0.9" : "0.4"}
          />
        )}

        {/* All cells clipped to dish interior */}
        <g clipPath="url(#dish-clip)">
          {grid.map((row, ri) =>
            row.map((cell, ci) => {
              const cx = CX + (ci - (cols - 1) / 2) * spacing
              const cy = CY + (ri - (rows - 1) / 2) * spacing
              const key = `${ri},${ci}`
              const isToggled = !!toggledCell && toggledCell[0] === ri && toggledCell[1] === ci
              const isHighlight = highlightSet.has(key)
              const isGhost = ghostSet.has(key)
              const isBorn = bornSet.has(key)

              return (
                <g key={key} pointerEvents="none" filter={organic && cell ? "url(#petri-organic)" : undefined}>
                  {cell ? (
                    <>
                      {/* Glow halo */}
                      <circle cx={cx} cy={cy} r={haloR} fill={isBorn ? PETRI.born : cellColor} opacity="0.14" />
                      {/* Cell body */}
                      <circle
                        cx={cx}
                        cy={cy}
                        r={cellR}
                        fill={isBorn ? PETRI.born : isHighlight ? PETRI.amber : cellColor}
                      >
                        <animate
                          attributeName="r"
                          from={cellR * 0.4}
                          to={cellR}
                          dur="0.2s"
                          begin="0s"
                          fill="freeze"
                        />
                      </circle>
                      {/* Specular highlight */}
                      <circle
                        cx={cx - cellR * 0.28}
                        cy={cy - cellR * 0.28}
                        r={cellR * 0.3}
                        fill="white"
                        opacity="0.45"
                      />
                    </>
                  ) : isGhost ? (
                    /* Ghost cell: will appear after next advance */
                    <>
                      <circle cx={cx} cy={cy} r={cellR * 0.85} fill={PETRI.life} opacity="0.2" />
                      <circle
                        cx={cx}
                        cy={cy}
                        r={cellR * 0.85}
                        fill="none"
                        stroke={PETRI.life}
                        strokeWidth="0.8"
                        strokeDasharray="2 1.5"
                        opacity="0.5"
                      />
                    </>
                  ) : (
                    /* Dead cell = tiny agar dot */
                    <circle cx={cx} cy={cy} r={deadR} fill={PETRI.ink} opacity="0.12" />
                  )}

                  {/* Toggled cell marker */}
                  {isToggled && (
                    <circle
                      cx={cx}
                      cy={cy}
                      r={haloR + 3}
                      fill="none"
                      stroke={PETRI.amber}
                      strokeWidth="1.5"
                      strokeDasharray="3 2.5"
                    />
                  )}

                  {/* Highlight ring for newly placed cells */}
                  {isHighlight && cell && (
                    <circle
                      cx={cx}
                      cy={cy}
                      r={haloR}
                      fill={PETRI.amber}
                      opacity="0.18"
                    />
                  )}
                </g>
              )
            })
          )}
        </g>

        {/* Bottom label inside SVG, below the shadow (y=250 in 256-height viewBox) */}
        {showLabels && labelText && (
          <text
            x="238"
            y="252"
            textAnchor="end"
            fontFamily={MONO}
            fontSize="8.5"
            letterSpacing="1.5"
            fill={PETRI.muted}
            style={{ textTransform: "uppercase" }}
          >
            {labelText.toUpperCase()}
          </text>
        )}
      </svg>

      {/* Top-left label (outside SVG, overlay) */}
      {showLabels && topLabel && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            fontSize: 9,
            letterSpacing: "0.15em",
            color: PETRI.muted,
            textTransform: "uppercase",
            fontFamily: MONO,
            pointerEvents: "none",
          }}
        >
          {topLabel}
        </div>
      )}
    </div>
  )
}
