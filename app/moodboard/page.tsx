"use client"

import { useEffect, useState } from "react"
import { stepConway } from "../../petri-dish"

// ─── Conway patterns ──────────────────────────────────────────────────────────

function makeGrid(r: number, c: number): boolean[][] {
  return Array(r).fill(null).map(() => Array(c).fill(false))
}

const PULSAR_SEED = (() => {
  const g = makeGrid(17, 17)
  const coords = [
    [2,4],[2,5],[2,6],[2,10],[2,11],[2,12],
    [4,2],[4,7],[4,9],[4,14],[5,2],[5,7],[5,9],[5,14],[6,2],[6,7],[6,9],[6,14],
    [7,4],[7,5],[7,6],[7,10],[7,11],[7,12],
    [9,4],[9,5],[9,6],[9,10],[9,11],[9,12],
    [10,2],[10,7],[10,9],[10,14],[11,2],[11,7],[11,9],[11,14],[12,2],[12,7],[12,9],[12,14],
    [14,4],[14,5],[14,6],[14,10],[14,11],[14,12],
  ]
  coords.forEach(([r,c]) => { g[r][c] = true })
  return g
})()

const GLIDER_SEED = (() => {
  const g = makeGrid(14, 14)
  g[1][2] = true; g[2][3] = true
  g[3][1] = g[3][2] = g[3][3] = true
  return g
})()

const BEACON_SEED = (() => {
  const g = makeGrid(8, 8)
  g[1][1] = g[1][2] = g[2][1] = true
  g[4][5] = g[5][5] = g[5][4] = true
  return g
})()

function useLiveGrid(seed: boolean[][], interval = 140) {
  const [grid, setGrid] = useState(seed)
  useEffect(() => {
    const t = setInterval(() => setGrid(g => stepConway(g)), interval)
    return () => clearInterval(t)
  }, [interval])
  return grid
}

// ─── Tiny dish renderers per style ───────────────────────────────────────────

function DishDark({ grid, size = 160 }: { grid: boolean[][], size?: number }) {
  const rows = grid.length, cols = grid[0]?.length ?? rows
  const CX = 100, CY = 100
  const sp = Math.min(160 / Math.max(rows, cols), 14)
  const cellR = sp * 0.36
  return (
    <svg viewBox="0 0 200 200" style={{ width: size, height: size, display: "block" }}>
      <circle cx={CX} cy={CY} r={90} fill="#111109" />
      <circle cx={CX} cy={CY} r={90} fill="none" stroke="#00FF6A" strokeWidth="0.8" opacity="0.25" />
      <circle cx={CX} cy={CY} r={82} fill="none" stroke="#00FF6A" strokeWidth="0.4" opacity="0.12" />
      {Array.from({ length: 36 }).map((_, i) => {
        const a = (i * 10 * Math.PI) / 180
        return <line key={i} x1={CX+Math.cos(a)*86} y1={CY+Math.sin(a)*86} x2={CX+Math.cos(a)*90} y2={CY+Math.sin(a)*90} stroke="#00FF6A" strokeWidth={i%3===0?"0.9":"0.3"} opacity={i%3===0?"0.5":"0.15"} />
      })}
      <defs>
        <clipPath id="clip-dark"><circle cx={CX} cy={CY} r="82" /></clipPath>
        <filter id="glow-dark"><feGaussianBlur stdDeviation="2.5" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
      </defs>
      <g clipPath="url(#clip-dark)" filter="url(#glow-dark)">
        {grid.map((row, ri) => row.map((cell, ci) => {
          const cx = CX + (ci - (cols-1)/2) * sp
          const cy = CY + (ri - (rows-1)/2) * sp
          if (!cell) return <circle key={`${ri}-${ci}`} cx={cx} cy={cy} r={sp*0.08} fill="#00FF6A" opacity="0.06" />
          return <g key={`${ri}-${ci}`}>
            <circle cx={cx} cy={cy} r={cellR*2.2} fill="#00FF6A" opacity="0.08" />
            <circle cx={cx} cy={cy} r={cellR} fill="#00FF6A" opacity="0.95" />
          </g>
        }))}
      </g>
    </svg>
  )
}

function DishRiso({ grid, size = 160, color = "#00A896" }: { grid: boolean[][], size?: number, color?: string }) {
  const rows = grid.length, cols = grid[0]?.length ?? rows
  const CX = 100, CY = 100
  const sp = Math.min(160 / Math.max(rows, cols), 14)
  const cellR = sp * 0.38
  return (
    <svg viewBox="0 0 200 200" style={{ width: size, height: size, display: "block" }}>
      {/* Slight registration offset shadow */}
      <circle cx={CX+1.5} cy={CY+1.5} r={90} fill="#E63946" opacity="0.18" />
      <circle cx={CX} cy={CY} r={90} fill="#F5F0E6" stroke="#1A1209" strokeWidth="2" />
      {/* Halftone-ish dots on bg */}
      {Array.from({length:12}).map((_,i)=>Array.from({length:12}).map((_,j)=>{
        const dx=(i-5.5)*16, dy=(j-5.5)*16
        if(Math.hypot(dx,dy)>82) return null
        return <circle key={`${i}-${j}`} cx={CX+dx} cy={CY+dy} r="1" fill={color} opacity="0.08" />
      }))}
      <defs><clipPath id="clip-riso"><circle cx={CX} cy={CY} r="88" /></clipPath></defs>
      <g clipPath="url(#clip-riso)">
        {grid.map((row, ri) => row.map((cell, ci) => {
          const cx = CX + (ci - (cols-1)/2) * sp
          const cy = CY + (ri - (rows-1)/2) * sp
          if (!cell) return null
          return <g key={`${ri}-${ci}`}>
            {/* riso offset */}
            <circle cx={cx+1.2} cy={cy+1.2} r={cellR} fill="#E63946" opacity="0.5" />
            <circle cx={cx} cy={cy} r={cellR} fill={color} opacity="0.9" />
          </g>
        }))}
      </g>
      <circle cx={CX} cy={CY} r={90} fill="none" stroke="#1A1209" strokeWidth="2" />
    </svg>
  )
}

function DishClinical({ grid, size = 160 }: { grid: boolean[][], size?: number }) {
  const rows = grid.length, cols = grid[0]?.length ?? rows
  const CX = 100, CY = 100
  const sp = Math.min(160 / Math.max(rows, cols), 14)
  const cellR = sp * 0.35
  return (
    <svg viewBox="0 0 200 200" style={{ width: size, height: size, display: "block" }}>
      <circle cx={CX} cy={CY} r={90} fill="white" stroke="#CCCCCC" strokeWidth="0.5" />
      {[75,55,35].map(r=><circle key={r} cx={CX} cy={CY} r={r} fill="none" stroke="#EEEEEE" strokeWidth="0.5" />)}
      {Array.from({length:8}).map((_,i)=>{
        const a=(i*45*Math.PI)/180
        return <line key={i} x1={CX+Math.cos(a)*35} y1={CY+Math.sin(a)*35} x2={CX+Math.cos(a)*90} y2={CY+Math.sin(a)*90} stroke="#EEEEEE" strokeWidth="0.5" />
      })}
      <defs><clipPath id="clip-clin"><circle cx={CX} cy={CY} r="90" /></clipPath></defs>
      <g clipPath="url(#clip-clin)">
        {grid.map((row, ri) => row.map((cell, ci) => {
          const cx = CX + (ci - (cols-1)/2) * sp
          const cy = CY + (ri - (rows-1)/2) * sp
          if (!cell) return <circle key={`${ri}-${ci}`} cx={cx} cy={cy} r={sp*0.1} fill="#DDDDDD" />
          return <g key={`${ri}-${ci}`}>
            <circle cx={cx} cy={cy} r={cellR+2} fill="none" stroke="#000" strokeWidth="0.5" opacity="0.15" />
            <circle cx={cx} cy={cy} r={cellR} fill="none" stroke="#000" strokeWidth="1.2" />
          </g>
        }))}
      </g>
    </svg>
  )
}

function DishVictorian({ grid, size = 160 }: { grid: boolean[][], size?: number }) {
  const rows = grid.length, cols = grid[0]?.length ?? rows
  const CX = 100, CY = 100
  const sp = Math.min(160 / Math.max(rows, cols), 14)
  const cellR = sp * 0.35
  const id = "v" + Math.random().toString(36).slice(2,6)
  return (
    <svg viewBox="0 0 200 200" style={{ width: size, height: size, display: "block" }}>
      <defs>
        <pattern id={`hatch-${id}`} x="0" y="0" width="4" height="4" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="4" stroke="#2C1810" strokeWidth="0.6" opacity="0.3" />
        </pattern>
        <clipPath id={`clip-vic-${id}`}><circle cx={CX} cy={CY} r="88" /></clipPath>
      </defs>
      <circle cx={CX} cy={CY} r={90} fill="#F2EAD3" stroke="#2C1810" strokeWidth="1.5" />
      <circle cx={CX} cy={CY} r={84} fill="none" stroke="#2C1810" strokeWidth="0.6" opacity="0.5" />
      <circle cx={CX} cy={CY} r={78} fill="none" stroke="#2C1810" strokeWidth="0.3" opacity="0.3" />
      {Array.from({length:36}).map((_,i)=>{
        const a=(i*10*Math.PI)/180
        const isMaj=i%3===0
        return <line key={i} x1={CX+Math.cos(a)*(isMaj?80:84)} y1={CY+Math.sin(a)*(isMaj?80:84)} x2={CX+Math.cos(a)*90} y2={CY+Math.sin(a)*90} stroke="#2C1810" strokeWidth={isMaj?"0.9":"0.4"} opacity={isMaj?"0.6":"0.3"} />
      })}
      <g clipPath={`url(#clip-vic-${id})`}>
        {grid.map((row, ri) => row.map((cell, ci) => {
          const cx = CX + (ci - (cols-1)/2) * sp
          const cy = CY + (ri - (rows-1)/2) * sp
          if (!cell) return <circle key={`${ri}-${ci}`} cx={cx} cy={cy} r={sp*0.1} fill="#2C1810" opacity="0.15" />
          return <g key={`${ri}-${ci}`}>
            <circle cx={cx} cy={cy} r={cellR+1} fill={`url(#hatch-${id})`} />
            <circle cx={cx} cy={cy} r={cellR} fill="none" stroke="#2C1810" strokeWidth="1.2" />
            <circle cx={cx} cy={cy} r={cellR*0.3} fill="#2C1810" opacity="0.5" />
          </g>
        }))}
      </g>
    </svg>
  )
}

function DishBrutalist({ grid, size = 160 }: { grid: boolean[][], size?: number }) {
  const rows = grid.length, cols = grid[0]?.length ?? rows
  const CX = 100, CY = 100
  const sp = Math.min(160 / Math.max(rows, cols), 14)
  const cellR = sp * 0.4
  return (
    <svg viewBox="0 0 200 200" style={{ width: size, height: size, display: "block" }}>
      <rect x="10" y="10" width="180" height="180" fill="white" stroke="black" strokeWidth="3" />
      {/* Grid lines */}
      {Array.from({length:9}).map((_,i)=>(
        <line key={`h${i}`} x1="10" y1={10+i*20} x2="190" y2={10+i*20} stroke="black" strokeWidth="0.3" opacity="0.15" />
      ))}
      {Array.from({length:9}).map((_,i)=>(
        <line key={`v${i}`} x1={10+i*20} y1="10" x2={10+i*20} y2="190" stroke="black" strokeWidth="0.3" opacity="0.15" />
      ))}
      <defs><clipPath id="clip-brut"><rect x="13" y="13" width="174" height="174" /></clipPath></defs>
      <g clipPath="url(#clip-brut)">
        {grid.map((row, ri) => row.map((cell, ci) => {
          const cx = CX + (ci - (cols-1)/2) * sp
          const cy = CY + (ri - (rows-1)/2) * sp
          if (!cell) return null
          return <rect key={`${ri}-${ci}`} x={cx-cellR} y={cy-cellR} width={cellR*2} height={cellR*2} fill="black" />
        }))}
      </g>
      <rect x="10" y="10" width="180" height="180" fill="none" stroke="black" strokeWidth="3" />
    </svg>
  )
}

// ─── Phone frame wrapper ──────────────────────────────────────────────────────

function PhoneFrame({ children, bg = "#FAFAF7", label, width = 220 }: {
  children: React.ReactNode
  bg?: string
  label: string
  width?: number
}) {
  const height = Math.round(width * 2.05)
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
      <div style={{
        width, height,
        background: bg,
        borderRadius: 32,
        border: "2.5px solid rgba(0,0,0,0.18)",
        overflow: "hidden",
        position: "relative",
        boxShadow: "0 24px 60px -12px rgba(0,0,0,0.22), 0 0 0 0.5px rgba(0,0,0,0.08)",
        display: "flex",
        flexDirection: "column",
      }}>
        {/* Notch */}
        <div style={{ position: "absolute", top: 10, left: "50%", transform: "translateX(-50%)", width: 60, height: 6, background: "rgba(0,0,0,0.14)", borderRadius: 4, zIndex: 10 }} />
        <div style={{ flex: 1, overflow: "hidden" }}>{children}</div>
      </div>
      <div style={{ fontFamily: "'SF Mono', monospace", fontSize: 10, letterSpacing: "0.2em", color: "#666", textTransform: "uppercase" }}>{label}</div>
    </div>
  )
}

// ─── STYLE 1: Dark Biohazard ──────────────────────────────────────────────────

function DarkBiohazardScreen({ grid }: { grid: boolean[][] }) {
  return (
    <div style={{ height: "100%", background: "#0C0C0A", display: "flex", flexDirection: "column", fontFamily: "'SF Mono', monospace", color: "white", padding: "28px 0 0" }}>
      <style>{`
        @keyframes neon-pulse { 0%,100%{opacity:1;text-shadow:0 0 8px #00FF6A,0 0 20px #00FF6A40} 50%{opacity:0.7;text-shadow:0 0 4px #00FF6A50} }
        @keyframes scan { 0%{transform:translateY(-100%)} 100%{transform:translateY(800%)} }
      `}</style>
      {/* Scan line */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: "linear-gradient(90deg, transparent, #00FF6A40, transparent)", animation: "scan 3s linear infinite", zIndex: 5 }} />
      {/* Top bar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 16px 16px", borderBottom: "1px solid #00FF6A18" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#00FF6A", boxShadow: "0 0 6px #00FF6A" }} />
          <span style={{ fontSize: 8, letterSpacing: "0.3em", color: "#00FF6A", textTransform: "uppercase" }}>Petri v2.1</span>
        </div>
        <span style={{ fontSize: 7, letterSpacing: "0.2em", color: "#00FF6A50", textTransform: "uppercase" }}>BIO-HAZ LEVEL 2</span>
      </div>
      {/* Main content */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 20, padding: "0 20px" }}>
        <div style={{ fontSize: 8, letterSpacing: "0.35em", color: "#00FF6A80", textTransform: "uppercase", animation: "neon-pulse 2.5s infinite" }}>Specimen isolation active</div>
        <DishDark grid={grid} size={170} />
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#fff", textShadow: "0 0 20px #00FF6A40", lineHeight: 1.1 }}>STILL LIFE</div>
          <div style={{ fontSize: 8, letterSpacing: "0.25em", color: "#00FF6A60", marginTop: 6, textTransform: "uppercase" }}>Chapter 01</div>
        </div>
        <div style={{ fontSize: 9, letterSpacing: "0.12em", color: "#ffffff50", textAlign: "center", lineHeight: 1.7, maxWidth: 170 }}>
          Some patterns survive unchanged. Forever.
        </div>
      </div>
      {/* CTA */}
      <div style={{ borderTop: "1px solid #00FF6A20", padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ background: "#00FF6A", color: "#0C0C0A", padding: "10px 20px", fontSize: 9, fontWeight: 700, letterSpacing: "0.25em", textTransform: "uppercase", cursor: "pointer" }}>
          Enter lab
        </div>
        <span style={{ fontSize: 8, color: "#00FF6A40", letterSpacing: "0.2em" }}>01 / 05</span>
      </div>
    </div>
  )
}

// ─── STYLE 2: Risograph Print ─────────────────────────────────────────────────

function RisographScreen({ grid }: { grid: boolean[][] }) {
  return (
    <div style={{ height: "100%", background: "#F5F0E6", display: "flex", flexDirection: "column", fontFamily: "'SF Mono', monospace", position: "relative", overflow: "hidden" }}>
      {/* Grain overlay */}
      <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.04, pointerEvents: "none" }}>
        <filter id="grain"><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="4" /><feColorMatrix type="saturate" values="0" /></filter>
        <rect width="100%" height="100%" filter="url(#grain)" />
      </svg>
      {/* Registration mark offset layer */}
      <div style={{ position: "absolute", inset: 0, background: "transparent", border: "none" }}>
        <div style={{ position: "absolute", top: 28, left: 18, fontSize: 32, fontWeight: 900, letterSpacing: "-0.02em", textTransform: "uppercase", color: "#E63946", opacity: 0.18, transform: "translate(2px, 2px)" }}>PETRI</div>
      </div>
      {/* Top bar */}
      <div style={{ padding: "28px 18px 14px", borderBottom: "2px solid #1A1209" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div style={{ fontSize: 32, fontWeight: 900, letterSpacing: "-0.02em", textTransform: "uppercase", color: "#1A1209", lineHeight: 1 }}>PETRI</div>
          <div style={{ fontSize: 7.5, letterSpacing: "0.2em", color: "#1A1209", textTransform: "uppercase", opacity: 0.6, paddingBottom: 4 }}>NO. 01</div>
        </div>
      </div>
      {/* Content */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, padding: "0 18px" }}>
        {/* Chapter tag */}
        <div style={{ alignSelf: "stretch", display: "flex", gap: 6, alignItems: "center" }}>
          <div style={{ background: "#00A896", padding: "4px 10px", fontSize: 8, fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", color: "#F5F0E6" }}>CH. 01</div>
          <div style={{ height: 2, flex: 1, background: "#1A1209" }} />
        </div>
        <DishRiso grid={grid} size={160} color="#00A896" />
        <div style={{ alignSelf: "stretch" }}>
          <div style={{ fontSize: 24, fontWeight: 900, textTransform: "uppercase", letterSpacing: "-0.01em", color: "#1A1209", lineHeight: 1.05 }}>STILL<br />LIFE</div>
          <div style={{ fontSize: 9, letterSpacing: "0.12em", color: "#1A1209", opacity: 0.55, lineHeight: 1.7, marginTop: 8 }}>Some patterns never change. They hold their form across infinite time.</div>
        </div>
      </div>
      {/* CTA */}
      <div style={{ padding: "14px 18px 20px", display: "flex", gap: 10 }}>
        <div style={{ flex: 1, background: "#1A1209", color: "#F5F0E6", padding: "12px", fontSize: 9, fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", textAlign: "center", position: "relative" }}>
          <div style={{ position: "absolute", inset: 0, background: "#E63946", transform: "translate(2.5px, 2.5px)", zIndex: -1 }} />
          Begin
        </div>
        <div style={{ border: "2px solid #1A1209", padding: "12px 16px", fontSize: 9, letterSpacing: "0.18em", textTransform: "uppercase", color: "#1A1209", textAlign: "center" }}>Skip</div>
      </div>
    </div>
  )
}

// ─── STYLE 3: Clinical Minimal ────────────────────────────────────────────────

function ClinicalScreen({ grid }: { grid: boolean[][] }) {
  return (
    <div style={{ height: "100%", background: "#FFFFFF", display: "flex", flexDirection: "column", fontFamily: "'SF Mono', monospace" }}>
      {/* Header rule */}
      <div style={{ padding: "32px 24px 20px", borderBottom: "0.5px solid #E5E5E5" }}>
        <div style={{ fontSize: 7, letterSpacing: "0.35em", color: "#999", textTransform: "uppercase", marginBottom: 4 }}>Petri / Chapter 01</div>
        <div style={{ fontSize: 7, letterSpacing: "0.25em", color: "#CCC", textTransform: "uppercase" }}>Specimen analysis</div>
      </div>
      {/* Large number */}
      <div style={{ padding: "20px 24px 0", display: "flex", alignItems: "flex-start", gap: 12 }}>
        <div style={{ fontSize: 64, fontWeight: 300, letterSpacing: "-0.04em", color: "#F0F0F0", lineHeight: 1 }}>01</div>
        <div style={{ paddingTop: 12 }}>
          <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#000" }}>Still Life</div>
          <div style={{ fontSize: 8, letterSpacing: "0.15em", color: "#AAA", textTransform: "uppercase", marginTop: 3 }}>Conway class A</div>
        </div>
      </div>
      {/* Dish centered */}
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <DishClinical grid={grid} size={180} />
      </div>
      {/* Rule line + note */}
      <div style={{ padding: "0 24px 14px", borderTop: "0.5px solid #E5E5E5" }}>
        <div style={{ padding: "14px 0", display: "flex", flexDirection: "column", gap: 8, borderBottom: "0.5px solid #F0F0F0" }}>
          <div style={{ fontSize: 9, letterSpacing: "0.08em", color: "#333", lineHeight: 1.75 }}>
            Some patterns never change. They hold their form across infinite time.
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 14 }}>
          <button style={{ background: "black", color: "white", border: "none", padding: "10px 20px", fontSize: 8, letterSpacing: "0.25em", textTransform: "uppercase", cursor: "pointer", fontFamily: "inherit" }}>Begin →</button>
          <span style={{ fontSize: 7.5, letterSpacing: "0.18em", color: "#CCC", textTransform: "uppercase" }}>01 of 05</span>
        </div>
      </div>
    </div>
  )
}

// ─── STYLE 4: Victorian Scientific ───────────────────────────────────────────

function VictorianScreen({ grid }: { grid: boolean[][] }) {
  const INK = "#2C1810"
  return (
    <div style={{ height: "100%", background: "#F2EAD3", display: "flex", flexDirection: "column", fontFamily: "'SF Mono', monospace", color: INK, position: "relative" }}>
      {/* Decorative border */}
      <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}>
        {/* Double border */}
        <rect x="8" y="8" width="calc(100%-16)" height="calc(100%-16)" fill="none" stroke={INK} strokeWidth="1.5" />
        <rect x="12" y="12" width="calc(100%-24)" height="calc(100%-24)" fill="none" stroke={INK} strokeWidth="0.5" opacity="0.5" />
        {/* Corner ornaments */}
        {[[16,16],[0,16],[16,0],[0,0]].map(([ox,oy],i)=>{
          const px=i%2===0?14:186, py=i<2?14:436
          return <g key={i} transform={`translate(${i%2===0?14:186-10},${i<2?14:424-10})`}>
            <rect width="10" height="10" fill="none" stroke={INK} strokeWidth="1" />
            <line x1="5" y1="0" x2="5" y2="10" stroke={INK} strokeWidth="0.5" />
            <line x1="0" y1="5" x2="10" y2="5" stroke={INK} strokeWidth="0.5" />
          </g>
        })}
      </svg>
      {/* Header */}
      <div style={{ padding: "32px 24px 16px", textAlign: "center", borderBottom: `1px solid ${INK}40` }}>
        <div style={{ fontSize: 7, letterSpacing: "0.4em", textTransform: "uppercase", opacity: 0.5, marginBottom: 6 }}>Philosophical Transactions</div>
        <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase" }}>PETRI</div>
        <div style={{ fontSize: 7, letterSpacing: "0.3em", textTransform: "uppercase", opacity: 0.5, marginTop: 4 }}>Cellular Life Studies · Vol. I</div>
      </div>
      {/* Chapter heading */}
      <div style={{ padding: "14px 24px 0", display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ height: "0.5px", flex: 1, background: INK, opacity: 0.25 }} />
        <div style={{ fontSize: 7.5, letterSpacing: "0.3em", textTransform: "uppercase", opacity: 0.6 }}>Chapter I</div>
        <div style={{ height: "0.5px", flex: 1, background: INK, opacity: 0.25 }} />
      </div>
      {/* Dish */}
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <DishVictorian grid={grid} size={168} />
      </div>
      {/* Description */}
      <div style={{ padding: "0 24px 20px", textAlign: "center" }}>
        <div style={{ fontSize: 16, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 8 }}>Still Life</div>
        <div style={{ fontSize: 8.5, letterSpacing: "0.08em", opacity: 0.65, lineHeight: 1.8 }}>
          Cellular formations exhibiting complete resistance to external perturbation. Observed to persist indefinitely.
        </div>
        <div style={{ marginTop: 16, display: "flex", alignItems: "center", gap: 8, justifyContent: "center" }}>
          <div style={{ height: "0.5px", width: 30, background: INK, opacity: 0.3 }} />
          <div style={{ border: `1px solid ${INK}`, padding: "9px 20px", fontSize: 8, letterSpacing: "0.28em", textTransform: "uppercase", cursor: "pointer" }}>Commence</div>
          <div style={{ height: "0.5px", width: 30, background: INK, opacity: 0.3 }} />
        </div>
      </div>
    </div>
  )
}

// ─── STYLE 5: Brutalist ───────────────────────────────────────────────────────

function BrutalistScreen({ grid }: { grid: boolean[][] }) {
  return (
    <div style={{ height: "100%", background: "#FFFFFE", display: "flex", flexDirection: "column", fontFamily: "'SF Mono', monospace", color: "#000" }}>
      {/* Top bar — thick border */}
      <div style={{ borderBottom: "4px solid black", padding: "28px 16px 12px" }}>
        <div style={{ fontSize: 8, letterSpacing: "0.3em", textTransform: "uppercase", color: "#FF0000", marginBottom: 2 }}>01 / STILL LIFE</div>
        <div style={{ fontSize: 9, letterSpacing: "0.2em", textTransform: "uppercase", color: "#999" }}>Conway's Game of Life</div>
      </div>
      {/* Big type */}
      <div style={{ padding: "16px 16px 8px", borderBottom: "2px solid black" }}>
        <div style={{ fontSize: 38, fontWeight: 900, letterSpacing: "-0.03em", textTransform: "uppercase", lineHeight: 0.9, color: "#000" }}>
          STILL<br /><span style={{ color: "#FF0000" }}>LIFE</span>
        </div>
      </div>
      {/* Dish in a box */}
      <div style={{ margin: "14px 16px", border: "2px solid black", background: "white", display: "flex", alignItems: "center", justifyContent: "center", padding: 10 }}>
        <DishBrutalist grid={grid} size={155} />
      </div>
      {/* Data table */}
      <div style={{ margin: "0 16px", border: "2px solid black" }}>
        {[["TYPE","Still life"],["PERIOD","1 (static)"],["CELLS","4 min"]].map(([k,v],i)=>(
          <div key={k} style={{ display: "flex", borderBottom: i<2?"1px solid #E0E0E0":"none" }}>
            <div style={{ width: 80, padding: "8px 10px", borderRight: "1px solid #E0E0E0", fontSize: 7.5, letterSpacing: "0.18em", textTransform: "uppercase", color: "#999" }}>{k}</div>
            <div style={{ padding: "8px 10px", fontSize: 8, letterSpacing: "0.12em", fontWeight: 700 }}>{v}</div>
          </div>
        ))}
      </div>
      {/* CTA */}
      <div style={{ margin: "14px 16px 20px", display: "flex", gap: 8 }}>
        <div style={{ flex: 1, background: "black", color: "white", padding: "14px", fontSize: 10, fontWeight: 900, letterSpacing: "0.2em", textTransform: "uppercase", textAlign: "center", cursor: "pointer" }}>BEGIN</div>
        <div style={{ border: "2px solid black", padding: "14px 16px", fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", cursor: "pointer" }}>→</div>
      </div>
    </div>
  )
}

// ─── STYLE 6: Blueprint ──────────────────────────────────────────────────────

function DishBlueprint({ grid, size = 160 }: { grid: boolean[][], size?: number }) {
  const rows = grid.length, cols = grid[0]?.length ?? rows
  const CX = 100, CY = 100
  const sp = Math.min(160 / Math.max(rows, cols), 14)
  const cellR = sp * 0.34
  return (
    <svg viewBox="0 0 200 200" style={{ width: size, height: size, display: "block" }}>
      <circle cx={CX} cy={CY} r={90} fill="#0D2B6E" />
      {/* Grid lines inside dish */}
      {Array.from({length:20}).map((_,i)=>(
        <line key={`h${i}`} x1={10} y1={10+i*9} x2={190} y2={10+i*9} stroke="white" strokeWidth="0.3" opacity="0.08" />
      ))}
      {Array.from({length:20}).map((_,i)=>(
        <line key={`v${i}`} x1={10+i*9} y1={10} x2={10+i*9} y2={190} stroke="white" strokeWidth="0.3" opacity="0.08" />
      ))}
      {/* Concentric guide circles */}
      {[30,55,78].map(r=><circle key={r} cx={CX} cy={CY} r={r} fill="none" stroke="white" strokeWidth="0.4" strokeDasharray="3 3" opacity="0.2" />)}
      {/* Cross hairs */}
      <line x1={CX} y1={10} x2={CX} y2={190} stroke="white" strokeWidth="0.4" opacity="0.15" />
      <line x1={10} y1={CY} x2={190} y2={CY} stroke="white" strokeWidth="0.4" opacity="0.15" />
      {/* Rim */}
      <circle cx={CX} cy={CY} r={90} fill="none" stroke="white" strokeWidth="1.2" opacity="0.6" />
      <circle cx={CX} cy={CY} r={84} fill="none" stroke="white" strokeWidth="0.5" opacity="0.2" />
      {/* Tick marks */}
      {Array.from({length:36}).map((_,i)=>{
        const a=(i*10*Math.PI)/180, isMaj=i%9===0
        return <line key={i} x1={CX+Math.cos(a)*(isMaj?80:86)} y1={CY+Math.sin(a)*(isMaj?80:86)} x2={CX+Math.cos(a)*90} y2={CY+Math.sin(a)*90} stroke="white" strokeWidth={isMaj?"1":"0.4"} opacity={isMaj?"0.7":"0.3"} />
      })}
      <defs><clipPath id="clip-bp"><circle cx={CX} cy={CY} r="82" /></clipPath></defs>
      <g clipPath="url(#clip-bp)">
        {grid.map((row, ri) => row.map((cell, ci) => {
          const cx = CX + (ci - (cols-1)/2) * sp
          const cy = CY + (ri - (rows-1)/2) * sp
          if (!cell) return <circle key={`${ri}-${ci}`} cx={cx} cy={cy} r={sp*0.1} fill="white" opacity="0.07" />
          return <g key={`${ri}-${ci}`}>
            <circle cx={cx} cy={cy} r={cellR+2} fill="none" stroke="#62A8FF" strokeWidth="0.6" opacity="0.5" />
            <circle cx={cx} cy={cy} r={cellR} fill="#62A8FF" opacity="0.9" />
            <circle cx={cx-cellR*0.3} cy={cy-cellR*0.3} r={cellR*0.28} fill="white" opacity="0.4" />
          </g>
        }))}
      </g>
    </svg>
  )
}

function BlueprintScreen({ grid }: { grid: boolean[][] }) {
  const BG = "#0D2B6E", ACC = "#62A8FF", WHITE = "#E8F0FF"
  return (
    <div style={{ height: "100%", background: BG, display: "flex", flexDirection: "column", fontFamily: "'SF Mono', monospace", color: WHITE, position: "relative", overflow: "hidden" }}>
      {/* Blueprint grid bg */}
      <svg style={{ position:"absolute",inset:0,width:"100%",height:"100%",pointerEvents:"none" }}>
        {Array.from({length:30}).map((_,i)=><line key={`h${i}`} x1="0" y1={i*16} x2="220" y2={i*16} stroke={WHITE} strokeWidth="0.3" opacity="0.06" />)}
        {Array.from({length:15}).map((_,i)=><line key={`v${i}`} x1={i*16} y1="0" x2={i*16} y2="500" stroke={WHITE} strokeWidth="0.3" opacity="0.06" />)}
      </svg>
      {/* Header */}
      <div style={{ padding: "28px 18px 12px", borderBottom: `1px solid ${ACC}30`, display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div>
          <div style={{ fontSize: 7, letterSpacing: "0.35em", color: ACC, textTransform: "uppercase", marginBottom: 3, opacity: 0.8 }}>Drawing No. B-001</div>
          <div style={{ fontSize: 16, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" }}>PETRI</div>
        </div>
        <div style={{ fontSize: 7, color: WHITE, opacity: 0.3, letterSpacing: "0.15em" }}>REV. A</div>
      </div>
      {/* Title block */}
      <div style={{ margin: "12px 18px 0", border: `0.5px solid ${ACC}40`, padding: "10px 12px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 0" }}>
        {[["SPECIMEN","Still Life"],["CLASS","Conway A"],["SCALE","40×"],["STATUS","Active"]].map(([k,v])=>(
          <div key={k}>
            <div style={{ fontSize: 6.5, letterSpacing: "0.25em", color: ACC, textTransform: "uppercase", opacity: 0.6 }}>{k}</div>
            <div style={{ fontSize: 8.5, letterSpacing: "0.12em", fontWeight: 700 }}>{v}</div>
          </div>
        ))}
      </div>
      {/* Dish */}
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <DishBlueprint grid={grid} size={172} />
      </div>
      {/* Notes */}
      <div style={{ margin: "0 18px", padding: "10px 12px", border: `0.5px solid ${ACC}30`, fontSize: 8, letterSpacing: "0.08em", color: WHITE, opacity: 0.5, lineHeight: 1.7 }}>
        Note: Pattern exhibits zero state change across observed cycle. Stable formation confirmed.
      </div>
      {/* CTA */}
      <div style={{ padding: "14px 18px 20px", display: "flex", gap: 8 }}>
        <div style={{ flex: 1, background: ACC, color: BG, padding: "11px", fontSize: 9, fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", textAlign: "center" }}>Proceed →</div>
        <div style={{ border: `0.5px solid ${ACC}50`, padding: "11px 14px", fontSize: 9, letterSpacing: "0.15em", color: ACC, opacity: 0.6 }}>Skip</div>
      </div>
    </div>
  )
}

// ─── STYLE 7: CRT Terminal ────────────────────────────────────────────────────

function DishCRT({ grid, size = 160 }: { grid: boolean[][], size?: number }) {
  const rows = grid.length, cols = grid[0]?.length ?? rows
  const CX = 100, CY = 100
  const sp = Math.min(160 / Math.max(rows, cols), 14)
  const cellR = sp * 0.38
  const PHOS = "#FFB000"
  return (
    <svg viewBox="0 0 200 200" style={{ width: size, height: size, display: "block" }}>
      <defs>
        <filter id="crt-blur"><feGaussianBlur stdDeviation="1.8" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
        <clipPath id="clip-crt"><circle cx={CX} cy={CY} r="88" /></clipPath>
      </defs>
      <circle cx={CX} cy={CY} r={90} fill="#0A0800" />
      {/* Scanlines */}
      {Array.from({length:45}).map((_,i)=><line key={i} x1="10" y1={10+i*4} x2="190" y2={10+i*4} stroke={PHOS} strokeWidth="0.4" opacity="0.04" />)}
      <circle cx={CX} cy={CY} r={90} fill="none" stroke={PHOS} strokeWidth="1" opacity="0.3" />
      <g clipPath="url(#clip-crt)" filter="url(#crt-blur)">
        {grid.map((row, ri) => row.map((cell, ci) => {
          const cx = CX + (ci - (cols-1)/2) * sp
          const cy = CY + (ri - (rows-1)/2) * sp
          if (!cell) return <circle key={`${ri}-${ci}`} cx={cx} cy={cy} r={sp*0.09} fill={PHOS} opacity="0.08" />
          return <g key={`${ri}-${ci}`}>
            <circle cx={cx} cy={cy} r={cellR*1.8} fill={PHOS} opacity="0.12" />
            <circle cx={cx} cy={cy} r={cellR} fill={PHOS} />
          </g>
        }))}
      </g>
    </svg>
  )
}

function CRTScreen({ grid }: { grid: boolean[][] }) {
  const PHOS = "#FFB000", BG = "#080600"
  return (
    <div style={{ height: "100%", background: BG, display: "flex", flexDirection: "column", fontFamily: "'SF Mono', monospace", color: PHOS, position: "relative", overflow: "hidden" }}>
      <style>{`@keyframes blink{0%,100%{opacity:1}49%{opacity:1}50%{opacity:0}99%{opacity:0}}`}</style>
      {/* Scanline overlay */}
      <div style={{ position:"absolute",inset:0,pointerEvents:"none",background:"repeating-linear-gradient(0deg,transparent,transparent 3px,rgba(0,0,0,0.08) 3px,rgba(0,0,0,0.08) 4px)",zIndex:10 }} />
      {/* CRT vignette */}
      <div style={{ position:"absolute",inset:0,pointerEvents:"none",background:"radial-gradient(ellipse at center, transparent 60%, rgba(0,0,0,0.5) 100%)",zIndex:11 }} />
      {/* Content */}
      <div style={{ padding: "28px 16px 12px", borderBottom: `1px solid ${PHOS}30` }}>
        <div style={{ fontSize: 8, letterSpacing: "0.2em", opacity: 0.5, marginBottom: 4 }}>PETRI OS v2.1 — READY</div>
        <div style={{ fontSize: 8, letterSpacing: "0.15em", opacity: 0.4 }}>{'>'} LOAD SPECIMEN_001.DAT</div>
      </div>
      <div style={{ padding: "12px 16px 0" }}>
        <div style={{ fontSize: 7.5, letterSpacing: "0.15em", opacity: 0.6, marginBottom: 2 }}>{'>'} CLASS: STILL_LIFE</div>
        <div style={{ fontSize: 7.5, letterSpacing: "0.15em", opacity: 0.6, marginBottom: 2 }}>{'>'} PERIOD: 1</div>
        <div style={{ fontSize: 7.5, letterSpacing: "0.15em", opacity: 0.6 }}>{'>'} STATUS: STABLE <span style={{ animation: "blink 1s infinite" }}>_</span></div>
      </div>
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <DishCRT grid={grid} size={168} />
      </div>
      <div style={{ padding: "0 16px 8px" }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 6 }}>STILL LIFE</div>
        <div style={{ fontSize: 7.5, letterSpacing: "0.1em", opacity: 0.55, lineHeight: 1.7 }}>
          Pattern exhibits no change across observed cycles. Formation locked.
        </div>
      </div>
      <div style={{ padding: "10px 16px 20px" }}>
        <div style={{ border: `1px solid ${PHOS}50`, padding: "11px 16px", fontSize: 9, letterSpacing: "0.2em", textAlign: "center", cursor: "pointer" }}>
          {'> '}EXECUTE<span style={{ animation: "blink 1s infinite" }}>_</span>
        </div>
      </div>
    </div>
  )
}

// ─── STYLE 8: Bauhaus ─────────────────────────────────────────────────────────

function DishBauhaus({ grid, size = 160 }: { grid: boolean[][], size?: number }) {
  const rows = grid.length, cols = grid[0]?.length ?? rows
  const CX = 100, CY = 100
  const sp = Math.min(160 / Math.max(rows, cols), 14)
  const cellR = sp * 0.42
  const BLUE = "#0047AB"
  return (
    <svg viewBox="0 0 200 200" style={{ width: size, height: size, display: "block" }}>
      {/* White square background */}
      <rect x="5" y="5" width="190" height="190" fill="white" stroke="black" strokeWidth="3" />
      {/* Red circle behind dish */}
      <circle cx={CX} cy={CY} r={78} fill="#E30613" />
      {/* Yellow quarter */}
      <path d={`M${CX} ${CY} L${CX+78} ${CY} A78 78 0 0 0 ${CX} ${CY-78} Z`} fill="#FDD835" />
      {/* Dish overlay */}
      <circle cx={CX} cy={CY} r={78} fill="white" opacity="0.88" />
      <defs><clipPath id="clip-bh"><circle cx={CX} cy={CY} r="78" /></clipPath></defs>
      <g clipPath="url(#clip-bh)">
        {grid.map((row, ri) => row.map((cell, ci) => {
          const cx = CX + (ci - (cols-1)/2) * sp
          const cy = CY + (ri - (rows-1)/2) * sp
          if (!cell) return null
          return <rect key={`${ri}-${ci}`} x={cx-cellR} y={cy-cellR} width={cellR*2} height={cellR*2} fill={BLUE} />
        }))}
      </g>
      <circle cx={CX} cy={CY} r={78} fill="none" stroke="black" strokeWidth="3" />
    </svg>
  )
}

function BauhausScreen({ grid }: { grid: boolean[][] }) {
  const RED = "#E30613", BLUE = "#0047AB", YELLOW = "#FDD835"
  return (
    <div style={{ height: "100%", background: "white", display: "flex", flexDirection: "column", fontFamily: "'SF Mono', monospace", color: "black" }}>
      {/* Thick top stripe */}
      <div style={{ background: "black", padding: "20px 18px 14px", display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div style={{ fontSize: 22, fontWeight: 900, letterSpacing: "-0.02em", textTransform: "uppercase", color: "white", lineHeight: 1 }}>PETRI</div>
        <div style={{ display: "flex", gap: 5 }}>
          <div style={{ width: 14, height: 14, background: RED, borderRadius: "50%" }} />
          <div style={{ width: 14, height: 14, background: YELLOW }} />
          <div style={{ width: 14, height: 14, background: BLUE }} />
        </div>
      </div>
      {/* Color band */}
      <div style={{ display: "flex", height: 6 }}>
        <div style={{ flex: 1, background: RED }} />
        <div style={{ flex: 1, background: YELLOW }} />
        <div style={{ flex: 1, background: BLUE }} />
      </div>
      {/* Chapter */}
      <div style={{ padding: "14px 18px 0", display: "flex", alignItems: "baseline", gap: 10 }}>
        <div style={{ fontSize: 48, fontWeight: 900, letterSpacing: "-0.04em", color: "#F0F0F0", lineHeight: 1 }}>01</div>
        <div style={{ paddingBottom: 4 }}>
          <div style={{ fontSize: 13, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.04em" }}>Still Life</div>
          <div style={{ fontSize: 7.5, letterSpacing: "0.2em", textTransform: "uppercase", color: "#999", marginTop: 2 }}>Conway A · Static</div>
        </div>
      </div>
      {/* Dish */}
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 18px" }}>
        <DishBauhaus grid={grid} size={170} />
      </div>
      {/* Copy */}
      <div style={{ padding: "0 18px 14px" }}>
        <div style={{ height: 3, background: "black", marginBottom: 10 }} />
        <div style={{ fontSize: 8.5, letterSpacing: "0.08em", lineHeight: 1.75, color: "#333" }}>
          Some patterns never change. Form follows function — and the function of this form is permanence.
        </div>
      </div>
      {/* CTA */}
      <div style={{ display: "flex" }}>
        <div style={{ flex: 1, background: RED, color: "white", padding: "14px 18px", fontSize: 10, fontWeight: 900, letterSpacing: "0.18em", textTransform: "uppercase", textAlign: "center" }}>Begin</div>
        <div style={{ background: YELLOW, color: "black", padding: "14px 16px", fontSize: 10, fontWeight: 900 }}>→</div>
      </div>
    </div>
  )
}

// ─── STYLE 9: Synthwave ───────────────────────────────────────────────────────

function DishSynthwave({ grid, size = 160 }: { grid: boolean[][], size?: number }) {
  const rows = grid.length, cols = grid[0]?.length ?? rows
  const CX = 100, CY = 100
  const sp = Math.min(160 / Math.max(rows, cols), 14)
  const cellR = sp * 0.36
  return (
    <svg viewBox="0 0 200 200" style={{ width: size, height: size, display: "block" }}>
      <defs>
        <radialGradient id="synth-bg" cx="50%" cy="50%"><stop offset="0%" stopColor="#2D0A4E" /><stop offset="100%" stopColor="#0D0020" /></radialGradient>
        <filter id="synth-glow"><feGaussianBlur stdDeviation="3" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
        <clipPath id="clip-sw"><circle cx={CX} cy={CY} r="88" /></clipPath>
      </defs>
      <circle cx={CX} cy={CY} r={90} fill="url(#synth-bg)" />
      {/* Neon rim */}
      <circle cx={CX} cy={CY} r={90} fill="none" stroke="#FF2EC4" strokeWidth="1.5" opacity="0.8" />
      <circle cx={CX} cy={CY} r={87} fill="none" stroke="#FF2EC4" strokeWidth="0.5" opacity="0.3" />
      {/* Horizon grid lines */}
      {Array.from({length:8}).map((_,i)=>{
        const y = CY + 20 + i*10
        if(y > CY+88) return null
        const pct = i/8
        return <line key={i} x1={CX-88+pct*30} y1={y} x2={CX+88-pct*30} y2={y} stroke="#FF2EC4" strokeWidth="0.5" opacity={0.12+pct*0.08} />
      })}
      {/* Vertical lines */}
      {Array.from({length:9}).map((_,i)=>{
        const x = CX - 80 + i*20
        return <line key={i} x1={x} y1={CY+20} x2={x} y2={CY+88} stroke="#FF2EC4" strokeWidth="0.5" opacity="0.12" />
      })}
      <g clipPath="url(#clip-sw)" filter="url(#synth-glow)">
        {grid.map((row, ri) => row.map((cell, ci) => {
          const cx = CX + (ci - (cols-1)/2) * sp
          const cy = CY + (ri - (rows-1)/2) * sp
          if (!cell) return <circle key={`${ri}-${ci}`} cx={cx} cy={cy} r={sp*0.09} fill="#FF2EC4" opacity="0.07" />
          const isTop = cy < CY
          const color = isTop ? "#00F5FF" : "#FF2EC4"
          return <g key={`${ri}-${ci}`}>
            <circle cx={cx} cy={cy} r={cellR*2} fill={color} opacity="0.12" />
            <circle cx={cx} cy={cy} r={cellR} fill={color} opacity="0.95" />
          </g>
        }))}
      </g>
    </svg>
  )
}

function SynthwaveScreen({ grid }: { grid: boolean[][] }) {
  const PINK = "#FF2EC4", CYAN = "#00F5FF", PURPLE = "#7B2FBE"
  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", fontFamily: "'SF Mono', monospace", color: "white", position: "relative", overflow: "hidden", background: "#0D0020" }}>
      {/* Gradient bg */}
      <div style={{ position:"absolute",inset:0,background:"linear-gradient(180deg,#1A0035 0%,#0D0020 60%,#000510 100%)",pointerEvents:"none" }} />
      {/* Top bar */}
      <div style={{ padding: "28px 18px 12px", position: "relative", zIndex: 1 }}>
        <div style={{ fontSize: 7.5, letterSpacing: "0.3em", textTransform: "uppercase", marginBottom: 4, background: `linear-gradient(90deg,${PINK},${CYAN})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Petri · Chapter 01</div>
        <div style={{ fontSize: 20, fontWeight: 900, letterSpacing: "0.06em", textTransform: "uppercase", textShadow: `0 0 20px ${PINK}80, 0 0 40px ${PINK}40` }}>STILL LIFE</div>
      </div>
      {/* Dish */}
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", position: "relative", zIndex: 1 }}>
        <DishSynthwave grid={grid} size={174} />
      </div>
      {/* Copy */}
      <div style={{ padding: "0 18px 14px", position: "relative", zIndex: 1 }}>
        <div style={{ height: 1, background: `linear-gradient(90deg,${PINK},${CYAN})`, marginBottom: 12, opacity: 0.5 }} />
        <div style={{ fontSize: 8.5, letterSpacing: "0.1em", lineHeight: 1.75, color: "rgba(255,255,255,0.55)" }}>
          Some patterns never change. They hold their form across infinite time.
        </div>
      </div>
      {/* CTA */}
      <div style={{ padding: "0 18px 22px", position: "relative", zIndex: 1 }}>
        <div style={{ background: `linear-gradient(90deg,${PINK},${PURPLE})`, padding: "13px", fontSize: 10, fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", textAlign: "center", cursor: "pointer", boxShadow: `0 0 24px ${PINK}50` }}>
          Enter →
        </div>
      </div>
    </div>
  )
}

// ─── STYLE 10: Wabi-Sabi ──────────────────────────────────────────────────────

function DishWabi({ grid, size = 160 }: { grid: boolean[][], size?: number }) {
  const rows = grid.length, cols = grid[0]?.length ?? rows
  const CX = 100, CY = 100
  const sp = Math.min(160 / Math.max(rows, cols), 14)
  const cellR = sp * 0.3
  return (
    <svg viewBox="0 0 200 200" style={{ width: size, height: size, display: "block" }}>
      <defs>
        <filter id="wabi-rough">
          <feTurbulence type="turbulence" baseFrequency="0.04" numOctaves="3" seed="8" result="noise"/>
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="1.5" xChannelSelector="R" yChannelSelector="G"/>
        </filter>
        <clipPath id="clip-wabi"><circle cx={CX} cy={CY} r="88" /></clipPath>
      </defs>
      {/* Slightly imperfect circle */}
      <circle cx={CX} cy={CY} r={90} fill="#F7F4EE" filter="url(#wabi-rough)" />
      <circle cx={CX} cy={CY} r={90} fill="none" stroke="#3D3028" strokeWidth="1.2" opacity="0.7" filter="url(#wabi-rough)" />
      {/* Very faint inner ring */}
      <circle cx={CX} cy={CY} r={75} fill="none" stroke="#3D3028" strokeWidth="0.4" opacity="0.15" />
      <g clipPath="url(#clip-wabi)">
        {grid.map((row, ri) => row.map((cell, ci) => {
          const cx = CX + (ci - (cols-1)/2) * sp
          const cy = CY + (ri - (rows-1)/2) * sp
          if (!cell) return null
          return <g key={`${ri}-${ci}`} filter="url(#wabi-rough)">
            <circle cx={cx} cy={cy} r={cellR*1.6} fill="#3D3028" opacity="0.07" />
            <circle cx={cx} cy={cy} r={cellR} fill="#3D3028" opacity="0.85" />
          </g>
        }))}
      </g>
    </svg>
  )
}

function WabiScreen({ grid }: { grid: boolean[][] }) {
  const INK = "#2A201A", MUTED = "#7A6A60"
  return (
    <div style={{ height: "100%", background: "#F7F4EE", display: "flex", flexDirection: "column", fontFamily: "'SF Mono', monospace", color: INK }}>
      {/* Very minimal header */}
      <div style={{ padding: "36px 24px 0", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div style={{ fontSize: 7, letterSpacing: "0.4em", textTransform: "uppercase", color: MUTED }}>Petri</div>
        <div style={{ fontSize: 7, letterSpacing: "0.3em", textTransform: "uppercase", color: MUTED, opacity: 0.5 }}>一</div>
      </div>
      {/* Dish — dominant, centered, lots of space */}
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
        <DishWabi grid={grid} size={180} />
      </div>
      {/* Bottom — spare */}
      <div style={{ padding: "0 24px 32px" }}>
        <div style={{ width: 28, height: 0.5, background: INK, opacity: 0.2, marginBottom: 16 }} />
        <div style={{ fontSize: 14, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 10, lineHeight: 1.2 }}>Still<br />Life</div>
        <div style={{ fontSize: 8.5, letterSpacing: "0.08em", color: MUTED, lineHeight: 2, marginBottom: 20 }}>
          Some patterns never change.
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ fontSize: 7.5, letterSpacing: "0.28em", textTransform: "uppercase", color: INK, cursor: "pointer" }}>Begin</div>
          <div style={{ flex: 1, height: 0.5, background: INK, opacity: 0.15 }} />
          <div style={{ fontSize: 7.5, letterSpacing: "0.2em", textTransform: "uppercase", color: MUTED, opacity: 0.5 }}>Skip</div>
        </div>
      </div>
    </div>
  )
}

// ─── "How many neighbors?" — Option A: Periodic Table ────────────────────────

function NeighborPeriodicScreen() {
  const PETRI_BG = "#FAFAF7", PETRI_INK = "#0A0A0A", PETRI_MUTED = "#57534E"
  const PETRI_BORDER = "#E7E5E0", PETRI_LIFE = "#059669", PETRI_WARN = "#DC2626"
  const PETRI_BORN = "#7C3AED"
  const MONO = `ui-monospace, "SF Mono", monospace`

  type Outcome = "starves" | "thrives" | "born-rule" | "suffocates"
  const cells: { n: number; symbol: string; outcome: Outcome; label: string }[] = [
    { n: 0, symbol: "Is", outcome: "starves",    label: "Isolation" },
    { n: 1, symbol: "Ls", outcome: "starves",    label: "Lonesome" },
    { n: 2, symbol: "Sv", outcome: "thrives",    label: "Survival" },
    { n: 3, symbol: "Th", outcome: "thrives",    label: "Thriving" },
    { n: 3, symbol: "Br", outcome: "born-rule",  label: "Birth" },
    { n: 4, symbol: "Ov", outcome: "suffocates", label: "Overcrowd" },
    { n: 5, symbol: "Sf", outcome: "suffocates", label: "Suffocate" },
    { n: 6, symbol: "Sf", outcome: "suffocates", label: "Suffocate" },
    { n: 7, symbol: "Sf", outcome: "suffocates", label: "Suffocate" },
    { n: 8, symbol: "Sf", outcome: "suffocates", label: "Suffocate" },
  ]

  const color = (o: Outcome) =>
    o === "thrives" ? PETRI_LIFE : o === "born-rule" ? PETRI_BORN : PETRI_WARN
  const bg = (o: Outcome) =>
    o === "thrives" ? "#05966910" : o === "born-rule" ? "#7C3AED10" : "#DC262608"

  // Deduplicate for display — keep n=3 twice (survival + birth)
  const displayCells = [
    { n: 0, symbol: "Is", outcome: "starves" as Outcome,    label: "Isolation" },
    { n: 1, symbol: "Ls", outcome: "starves" as Outcome,    label: "Lonesome" },
    { n: 2, symbol: "Sv", outcome: "thrives" as Outcome,    label: "Survival" },
    { n: 3, symbol: "Th", outcome: "thrives" as Outcome,    label: "Thriving" },
    { n: 4, symbol: "Ov", outcome: "suffocates" as Outcome, label: "Overcrowd" },
    { n: 5, symbol: "Sf", outcome: "suffocates" as Outcome, label: "Suffocat." },
    { n: 6, symbol: "Sf", outcome: "suffocates" as Outcome, label: "Suffocat." },
    { n: 7, symbol: "Sf", outcome: "suffocates" as Outcome, label: "Suffocat." },
    { n: 8, symbol: "Sf", outcome: "suffocates" as Outcome, label: "Suffocat." },
  ]

  return (
    <div style={{ height: "100%", background: PETRI_BG, display: "flex", flexDirection: "column", fontFamily: MONO }}>
      {/* Top bar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 20px", borderBottom: `1px solid ${PETRI_BORDER}`, minHeight: 50 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: PETRI_LIFE }} />
          <span style={{ fontSize: 9, letterSpacing: "0.3em", color: PETRI_MUTED, textTransform: "uppercase" }}>Step 3</span>
        </div>
        <span style={{ fontSize: 9, letterSpacing: "0.2em", color: PETRI_MUTED, textTransform: "uppercase" }}>Skip</span>
      </div>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "20px 18px 0", overflow: "hidden" }}>
        {/* Title */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 8, letterSpacing: "0.36em", color: PETRI_MUTED, textTransform: "uppercase", marginBottom: 4 }}>The neighbor rule</div>
          <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: "0.08em", color: PETRI_INK, textTransform: "uppercase", lineHeight: 1.1 }}>Periodic<br />Table of n</div>
        </div>

        {/* Element grid — 3-col */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6, marginBottom: 10 }}>
          {displayCells.map((cell, i) => {
            const c = color(cell.outcome), b = bg(cell.outcome)
            const isLife = cell.outcome === "thrives"
            return (
              <div key={i} style={{
                background: b, border: `1.5px solid ${isLife ? c : PETRI_BORDER}`,
                borderRadius: 8, padding: "8px 10px", position: "relative",
                boxShadow: isLife ? `0 2px 10px ${PETRI_LIFE}20` : "none",
              }}>
                <div style={{ fontSize: 7, letterSpacing: "0.2em", color: c, textTransform: "uppercase", fontWeight: 700, marginBottom: 1 }}>{cell.label}</div>
                <div style={{ fontSize: 26, fontWeight: 700, color: c, lineHeight: 1 }}>{cell.n}</div>
                <div style={{ fontSize: 7, letterSpacing: "0.14em", color: PETRI_MUTED, textTransform: "uppercase", marginTop: 2 }}>{cell.symbol}</div>
              </div>
            )
          })}
          {/* Birth special card — spans full width */}
          <div style={{
            background: "#7C3AED0D", border: `1.5px solid ${PETRI_BORN}`,
            borderRadius: 8, padding: "8px 10px", gridColumn: "span 3",
            display: "flex", alignItems: "center", gap: 12,
          }}>
            <div>
              <div style={{ fontSize: 7, letterSpacing: "0.2em", color: PETRI_BORN, textTransform: "uppercase", fontWeight: 700 }}>Empty + 3 neighbors</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: PETRI_BORN, lineHeight: 1.1, marginTop: 1 }}>BIRTH</div>
            </div>
            <div style={{ fontSize: 10, color: PETRI_MUTED, letterSpacing: "0.04em", lineHeight: 1.6, flex: 1 }}>
              A dead cell surrounded by exactly 3 live neighbors comes alive.
            </div>
          </div>
        </div>

        {/* Legend */}
        <div style={{ display: "flex", gap: 14, justifyContent: "center", paddingBottom: 10 }}>
          {([["thrives", "Survives"] as const, ["born-rule", "Born"] as const, ["starves", "Dies"] as const]).map(([o, label]) => (
            <div key={o} style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <div style={{ width: 7, height: 7, borderRadius: "50%", background: color(o) }} />
              <span style={{ fontSize: 8, letterSpacing: "0.12em", color: PETRI_MUTED, textTransform: "uppercase" }}>{label}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding: "12px 18px 20px", borderTop: `1px solid ${PETRI_BORDER}` }}>
        <div style={{ width: "100%", padding: "16px", background: PETRI_INK, color: PETRI_BG, fontSize: 11, fontWeight: 700, letterSpacing: "0.26em", textTransform: "uppercase", textAlign: "center" }}>
          Build →
        </div>
      </div>
    </div>
  )
}

// ─── "How many neighbors?" — Option B: The Big Number ────────────────────────

function NeighborBigNumberScreen() {
  const PETRI_BG = "#FAFAF7", PETRI_INK = "#0A0A0A", PETRI_MUTED = "#57534E"
  const PETRI_BORDER = "#E7E5E0", PETRI_LIFE = "#059669", PETRI_WARN = "#DC2626"
  const PETRI_BORN = "#7C3AED"
  const MONO = `ui-monospace, "SF Mono", monospace`

  type Case = { n: string; from: string; outcome: string; word: string; color: string; sub: string }
  const CASES: Case[] = [
    { n: "0–1", from: "alive", outcome: "STARVES", word: "dies",  color: PETRI_WARN, sub: "Too few neighbors. Isolation kills." },
    { n: "2–3", from: "alive", outcome: "THRIVES", word: "lives", color: PETRI_LIFE, sub: "The sweet spot. Cell survives to next gen." },
    { n: "  3", from: "empty", outcome: "BORN",    word: "born",  color: PETRI_BORN, sub: "Empty space, 3 live neighbors. New life." },
    { n: "4+",  from: "alive", outcome: "DIES",    word: "dies",  color: PETRI_WARN, sub: "Too many. Overcrowding. Cell suffocates." },
  ]
  // For static moodboard — show case index 1 (thrives) as the "active" state
  const active = CASES[1]

  return (
    <div style={{ height: "100%", background: PETRI_BG, display: "flex", flexDirection: "column", fontFamily: MONO }}>
      {/* Top bar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 20px", borderBottom: `1px solid ${PETRI_BORDER}`, minHeight: 50 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: PETRI_LIFE }} />
          <span style={{ fontSize: 9, letterSpacing: "0.3em", color: PETRI_MUTED, textTransform: "uppercase" }}>Step 3</span>
        </div>
        <span style={{ fontSize: 9, letterSpacing: "0.2em", color: PETRI_MUTED, textTransform: "uppercase" }}>Skip</span>
      </div>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "16px 28px", gap: 0 }}>
        {/* From label */}
        <div style={{ fontSize: 8, letterSpacing: "0.3em", color: PETRI_MUTED, textTransform: "uppercase", marginBottom: 12 }}>
          {active.from} cell · neighbors =
        </div>

        {/* Giant n */}
        <div style={{ fontSize: 100, fontWeight: 700, color: active.color, lineHeight: 1, letterSpacing: "-0.02em", textShadow: `0 0 60px ${active.color}30` }}>
          {active.n}
        </div>

        {/* Divider */}
        <div style={{ width: 40, height: 1.5, background: active.color, margin: "18px 0", opacity: 0.4 }} />

        {/* Outcome word */}
        <div style={{ fontSize: 36, fontWeight: 700, letterSpacing: "0.18em", color: active.color, textTransform: "uppercase", marginBottom: 10 }}>
          {active.outcome}
        </div>

        {/* Sub-copy */}
        <div style={{ fontSize: 12, color: PETRI_MUTED, letterSpacing: "0.06em", lineHeight: 1.7, textAlign: "center", maxWidth: 220 }}>
          {active.sub}
        </div>

        {/* Progress pips */}
        <div style={{ display: "flex", gap: 7, marginTop: 28 }}>
          {CASES.map((c, i) => (
            <div key={i} style={{
              width: i === 1 ? 22 : 7, height: 7, borderRadius: 4,
              background: i === 1 ? active.color : PETRI_BORDER,
              transition: "all 0.3s",
            }} />
          ))}
        </div>
      </div>

      {/* Mini rule strip at bottom */}
      <div style={{ borderTop: `1px solid ${PETRI_BORDER}`, display: "flex" }}>
        {CASES.map((c, i) => (
          <div key={i} style={{
            flex: 1, padding: "8px 4px", textAlign: "center",
            borderRight: i < CASES.length - 1 ? `1px solid ${PETRI_BORDER}` : "none",
            background: i === 1 ? `${c.color}08` : "transparent",
          }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: i === 1 ? c.color : PETRI_BORDER }}>{c.n}</div>
            <div style={{ fontSize: 7, letterSpacing: "0.1em", color: i === 1 ? c.color : PETRI_MUTED, textTransform: "uppercase", marginTop: 1, opacity: i === 1 ? 1 : 0.5 }}>{c.word}</div>
          </div>
        ))}
      </div>

      <div style={{ padding: "12px 18px 20px" }}>
        <div style={{ width: "100%", padding: "16px", background: PETRI_INK, color: PETRI_BG, fontSize: 11, fontWeight: 700, letterSpacing: "0.26em", textTransform: "uppercase", textAlign: "center" }}>
          Build →
        </div>
      </div>
    </div>
  )
}

// ─── "How many neighbors?" — Option C: Spectrum Bar ──────────────────────────

function NeighborSpectrumScreen() {
  const PETRI_BG = "#FAFAF7", PETRI_INK = "#0A0A0A", PETRI_MUTED = "#57534E"
  const PETRI_BORDER = "#E7E5E0", PETRI_LIFE = "#059669", PETRI_WARN = "#DC2626"
  const PETRI_BORN = "#7C3AED"
  const MONO = `ui-monospace, "SF Mono", monospace`

  return (
    <div style={{ height: "100%", background: PETRI_BG, display: "flex", flexDirection: "column", fontFamily: MONO }}>
      <style>{`
        @keyframes bar3-glow {
          0%,100% { box-shadow: inset 0 0 0 0 rgba(5,150,105,0), background-color: rgba(5,150,105,0.18); }
          50%      { box-shadow: inset 0 0 14px 2px rgba(5,150,105,0.28), background-color: rgba(5,150,105,0.30); }
        }
        @keyframes bar3-num {
          0%,100% { transform: scale(1); }
          50%      { transform: scale(1.18); }
        }
        @keyframes birth-ripple {
          0%   { transform: scale(1);   opacity: 0.55; }
          100% { transform: scale(3.2); opacity: 0; }
        }
        @keyframes birth-circle-pulse {
          0%,100% { box-shadow: 0 0 0 0 rgba(124,58,237,0.3); }
          60%      { box-shadow: 0 0 0 8px rgba(124,58,237,0); }
        }
      `}</style>

      {/* Top bar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 20px", borderBottom: `1px solid ${PETRI_BORDER}`, minHeight: 50 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: PETRI_LIFE }} />
          <span style={{ fontSize: 9, letterSpacing: "0.3em", color: PETRI_MUTED, textTransform: "uppercase" }}>Step 3</span>
        </div>
        <span style={{ fontSize: 9, letterSpacing: "0.2em", color: PETRI_MUTED, textTransform: "uppercase" }}>Skip</span>
      </div>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "22px 22px 0", minHeight: 0 }}>
        {/* Heading */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 8, letterSpacing: "0.36em", color: PETRI_MUTED, textTransform: "uppercase", marginBottom: 4 }}>The sweet spot</div>
          <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: "0.08em", color: PETRI_INK, textTransform: "uppercase", lineHeight: 1.1 }}>How many<br />neighbors?</div>
        </div>

        {/* Spectrum instrument */}
        <div style={{ marginBottom: 8 }}>
          {/* Zone labels above */}
          <div style={{ display: "flex", marginBottom: 6, fontSize: 7.5, letterSpacing: "0.16em", textTransform: "uppercase", fontWeight: 700 }}>
            <div style={{ flex: 2, color: PETRI_WARN, opacity: 0.7 }}>Starves</div>
            <div style={{ flex: 2, color: PETRI_LIFE, textAlign: "center" }}>Thrives</div>
            <div style={{ flex: 5, color: PETRI_WARN, opacity: 0.7, textAlign: "right" }}>Suffocates</div>
          </div>

          {/* The bar */}
          <div style={{ position: "relative", height: 44, display: "flex", borderRadius: 6, overflow: "hidden", border: `1px solid ${PETRI_BORDER}` }}>
            {/* 0 */}
            <div style={{ flex: 1, background: `${PETRI_WARN}18`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: PETRI_WARN, opacity: 0.5 }}>0</span>
            </div>
            {/* 1 */}
            <div style={{ flex: 1, background: `${PETRI_WARN}12`, display: "flex", alignItems: "center", justifyContent: "center", borderLeft: `1px solid ${PETRI_BORDER}` }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: PETRI_WARN, opacity: 0.5 }}>1</span>
            </div>
            {/* 2 — life zone */}
            <div style={{ flex: 1, background: `${PETRI_LIFE}18`, display: "flex", alignItems: "center", justifyContent: "center", borderLeft: `2px solid ${PETRI_LIFE}40` }}>
              <span style={{ fontSize: 15, fontWeight: 700, color: PETRI_LIFE }}>2</span>
            </div>
            {/* 3 — life zone + birth, animated */}
            <div style={{
              flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
              borderRight: `2px solid ${PETRI_LIFE}60`,
              animation: "bar3-glow 1.8s ease-in-out infinite",
              position: "relative",
            }}>
              {/* tiny born indicator dot */}
              <div style={{
                position: "absolute", top: 5, right: 5,
                width: 5, height: 5, borderRadius: "50%",
                background: PETRI_BORN,
                boxShadow: `0 0 4px ${PETRI_BORN}`,
              }} />
              <span style={{
                fontSize: 18, fontWeight: 700, color: PETRI_LIFE,
                animation: "bar3-num 1.8s ease-in-out infinite",
                display: "inline-block",
              }}>3</span>
            </div>
            {/* 4–8 */}
            {[4,5,6,7,8].map((n) => (
              <div key={n} style={{ flex: 1, background: `${PETRI_WARN}${n > 5 ? "10" : "15"}`, display: "flex", alignItems: "center", justifyContent: "center", borderLeft: `1px solid ${PETRI_BORDER}` }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: PETRI_WARN, opacity: Math.max(0.25, 0.55 - (n-4) * 0.07) }}>{n}</span>
              </div>
            ))}
          </div>

          {/* Range labels below bar */}
          <div style={{ display: "flex", marginTop: 5, fontSize: 7, letterSpacing: "0.1em", color: PETRI_MUTED, textTransform: "uppercase" }}>
            <div style={{ flex: 2 }}>0 – 1</div>
            <div style={{ flex: 2, textAlign: "center", color: PETRI_LIFE, fontWeight: 700 }}>2 – 3</div>
            <div style={{ flex: 5, textAlign: "right" }}>4 – 8</div>
          </div>
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: PETRI_BORDER, margin: "16px 0" }} />

        {/* Birth rule — special callout with ripple animation */}
        <div style={{ border: `1.5px solid ${PETRI_BORN}40`, borderRadius: 10, padding: "14px 16px", background: "#7C3AED08", marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {/* Animated birth circle */}
            <div style={{ position: "relative", width: 36, height: 36, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
              {/* ripple 1 */}
              <div style={{
                position: "absolute", inset: 0, borderRadius: "50%",
                background: PETRI_BORN,
                animation: "birth-ripple 2s ease-out infinite",
              }} />
              {/* ripple 2 — offset */}
              <div style={{
                position: "absolute", inset: 0, borderRadius: "50%",
                background: PETRI_BORN,
                animation: "birth-ripple 2s ease-out 0.7s infinite",
              }} />
              {/* core circle */}
              <div style={{
                position: "relative", width: 30, height: 30, borderRadius: "50%",
                background: `${PETRI_BORN}18`, border: `1.5px solid ${PETRI_BORN}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                animation: "birth-circle-pulse 2s ease-out infinite",
              }}>
                <span style={{ fontSize: 15, fontWeight: 700, color: PETRI_BORN }}>3</span>
              </div>
            </div>
            <div>
              <div style={{ fontSize: 9, letterSpacing: "0.22em", color: PETRI_BORN, textTransform: "uppercase", fontWeight: 700, marginBottom: 3 }}>Birth rule</div>
              <div style={{ fontSize: 11, color: PETRI_MUTED, letterSpacing: "0.04em", lineHeight: 1.55 }}>
                An <span style={{ color: PETRI_INK, fontWeight: 700 }}>empty</span> cell with exactly 3 live neighbors comes alive.
              </div>
            </div>
          </div>
        </div>

        {/* Three rule pills */}
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {[
            { range: "n = 0, 1", label: "Starves — too few neighbors", color: PETRI_WARN },
            { range: "n = 2, 3", label: "Survives — alive cell persists", color: PETRI_LIFE },
            { range: "n ≥ 4",   label: "Suffocates — too crowded", color: PETRI_WARN },
          ].map(r => (
            <div key={r.range} style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 38, textAlign: "center", fontSize: 9, fontWeight: 700, color: r.color, letterSpacing: "0.05em", flexShrink: 0 }}>{r.range}</div>
              <div style={{ width: 1, height: 18, background: PETRI_BORDER, flexShrink: 0 }} />
              <div style={{ fontSize: 9, color: PETRI_MUTED, letterSpacing: "0.06em" }}>{r.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding: "16px 22px 20px", borderTop: `1px solid ${PETRI_BORDER}`, marginTop: 16 }}>
        <div style={{ width: "100%", padding: "16px", background: PETRI_INK, color: PETRI_BG, fontSize: 11, fontWeight: 700, letterSpacing: "0.26em", textTransform: "uppercase", textAlign: "center" }}>
          Build →
        </div>
      </div>
    </div>
  )
}

// ─── Color chips ──────────────────────────────────────────────────────────────

function Chips({ colors }: { colors: { color: string; label: string }[] }) {
  return (
    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "center" }}>
      {colors.map(({ color, label }) => (
        <div key={color} style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <div style={{ width: 12, height: 12, background: color, border: "1px solid rgba(0,0,0,0.12)", borderRadius: 2, flexShrink: 0 }} />
          <span style={{ fontFamily: "'SF Mono', monospace", fontSize: 8, color: "#666", letterSpacing: "0.1em" }}>{label}</span>
        </div>
      ))}
    </div>
  )
}

// ─── Section label ────────────────────────────────────────────────────────────

function StyleLabel({ name, desc }: { name: string; desc: string }) {
  return (
    <div style={{ textAlign: "center", maxWidth: 220 }}>
      <div style={{ fontFamily: "'SF Mono', monospace", fontSize: 11, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: "#111", marginBottom: 4 }}>{name}</div>
      <div style={{ fontFamily: "'SF Mono', monospace", fontSize: 8.5, letterSpacing: "0.08em", color: "#888", lineHeight: 1.6 }}>{desc}</div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const TOAD_SEED = (() => {
  const g = makeGrid(10, 10)
  g[4][3] = g[4][4] = g[4][5] = true
  g[5][2] = g[5][3] = g[5][4] = true
  return g
})()

const LWSS_SEED = (() => {
  const g = makeGrid(12, 16)
  g[3][1] = g[3][4] = true
  g[4][5] = true
  g[5][1] = g[5][5] = true
  g[6][2] = g[6][3] = g[6][4] = g[6][5] = true
  return g
})()

export default function MoodboardPage() {
  const pulsar = useLiveGrid(PULSAR_SEED, 180)
  const glider = useLiveGrid(GLIDER_SEED, 120)
  const beacon = useLiveGrid(BEACON_SEED, 150)
  const toad   = useLiveGrid(TOAD_SEED, 140)
  const lwss   = useLiveGrid(LWSS_SEED, 130)

  return (
    <div style={{ minHeight: "100vh", background: "#1A1A18", padding: "56px 32px 80px", fontFamily: "'SF Mono', monospace" }}>
      <style>{`* { box-sizing: border-box; } body { margin: 0; }`}</style>

      {/* Header */}
      <div style={{ maxWidth: 1100, margin: "0 auto 64px" }}>
        <div style={{ fontSize: 9, letterSpacing: "0.3em", color: "#666", textTransform: "uppercase", marginBottom: 10 }}>PETRI — Art direction explorations</div>
        <div style={{ fontSize: 32, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "#fff", marginBottom: 12 }}>10 Visual Directions</div>
        <div style={{ fontSize: 10, letterSpacing: "0.1em", color: "#777", lineHeight: 1.7, maxWidth: 480 }}>
          Same screen — chapter title + live dish + CTA — rendered in ten completely different art directions. Each shows a consistent, shippable visual world.
        </div>
      </div>

      {/* Grid of mockups */}
      <div style={{ maxWidth: 1100, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 48, justifyItems: "center" }}>

        {/* 01 Dark Biohazard */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
          <PhoneFrame bg="#0C0C0A" label="01 — Dark Lab">
            <DarkBiohazardScreen grid={pulsar} />
          </PhoneFrame>
          <StyleLabel name="Dark Lab" desc="Neon green on near-black. Surveillance aesthetic. Glow effects. Feels like looking through a microscope in a dark room." />
          <Chips colors={[{color:"#0C0C0A",label:"void"},{color:"#00FF6A",label:"neon"},{color:"#F5C842",label:"hazard"},{color:"#FF3A3A",label:"alert"}]} />
        </div>

        {/* 02 Risograph */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
          <PhoneFrame bg="#F5F0E6" label="02 — Riso Print">
            <RisographScreen grid={glider} />
          </PhoneFrame>
          <StyleLabel name="Riso Print" desc="Aged cream paper, teal + red two-color print. Deliberate misregistration. Bold bold type. Zine / indie game energy." />
          <Chips colors={[{color:"#F5F0E6",label:"cream"},{color:"#00A896",label:"teal"},{color:"#E63946",label:"red"},{color:"#1A1209",label:"ink"}]} />
        </div>

        {/* 03 Clinical Minimal */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
          <PhoneFrame bg="#FFFFFF" label="03 — Clinical">
            <ClinicalScreen grid={pulsar} />
          </PhoneFrame>
          <StyleLabel name="Clinical Minimal" desc="Pure white. Hairline rules. No fills, only strokes. Type does all the work. Cells are outlines, not filled circles." />
          <Chips colors={[{color:"#FFFFFF",label:"white"},{color:"#000000",label:"black"},{color:"#E5E5E5",label:"rule"},{color:"#AAAAAA",label:"dim"}]} />
        </div>

        {/* 04 Victorian */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
          <PhoneFrame bg="#F2EAD3" label="04 — Victorian">
            <VictorianScreen grid={beacon} />
          </PhoneFrame>
          <StyleLabel name="Victorian Scientific" desc="Aged parchment. Sepia ink. Cross-hatch cell fill. Ornate double borders. Feels like a 19th century naturalist atlas." />
          <Chips colors={[{color:"#F2EAD3",label:"parchment"},{color:"#2C1810",label:"sepia"},{color:"#8B6B3D",label:"warm"},{color:"#C9A96E",label:"gold"}]} />
        </div>

        {/* 05 Brutalist */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
          <PhoneFrame bg="#FFFFFE" label="05 — Brutalist">
            <BrutalistScreen grid={glider} />
          </PhoneFrame>
          <StyleLabel name="Brutalist" desc="Raw grid. Thick black borders. Compressed type. Square cells. Red as single accent. No decoration — only structure." />
          <Chips colors={[{color:"#FFFFFE",label:"raw white"},{color:"#000000",label:"black"},{color:"#FF0000",label:"red"},{color:"#E0E0E0",label:"rule"}]} />
        </div>

        {/* 06 Blueprint */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
          <PhoneFrame bg="#0D2B6E" label="06 — Blueprint">
            <BlueprintScreen grid={toad} />
          </PhoneFrame>
          <StyleLabel name="Blueprint" desc="Technical drawing on prussian blue. White drafting lines, crosshairs, title blocks. Engineering / CAD aesthetic." />
          <Chips colors={[{color:"#0D2B6E",label:"prussian"},{color:"#62A8FF",label:"sky"},{color:"#E8F0FF",label:"white"},{color:"#1A3A8F",label:"rule"}]} />
        </div>

        {/* 07 CRT Terminal */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
          <PhoneFrame bg="#080600" label="07 — CRT Terminal">
            <CRTScreen grid={glider} />
          </PhoneFrame>
          <StyleLabel name="CRT Terminal" desc="Amber phosphor on void black. Scanlines, blinking cursor, command-line vocabulary. Like an Apple II running a life simulation." />
          <Chips colors={[{color:"#080600",label:"void"},{color:"#FFB000",label:"phosphor"},{color:"#FF8C00",label:"warm"},{color:"#3A2800",label:"dim"}]} />
        </div>

        {/* 08 Bauhaus */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
          <PhoneFrame bg="white" label="08 — Bauhaus">
            <BauhausScreen grid={pulsar} />
          </PhoneFrame>
          <StyleLabel name="Bauhaus" desc="Primary colors only. Bold geometric shapes. Red, yellow, blue in strict bands. Form follows function — aggressively." />
          <Chips colors={[{color:"#E30613",label:"red"},{color:"#FDD835",label:"yellow"},{color:"#0047AB",label:"blue"},{color:"#000000",label:"black"}]} />
        </div>

        {/* 09 Synthwave */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
          <PhoneFrame bg="#0D0020" label="09 — Synthwave">
            <SynthwaveScreen grid={lwss} />
          </PhoneFrame>
          <StyleLabel name="Synthwave" desc="Deep purple gradient, neon pink and cyan. Perspective grid horizon. Cells split cyan/pink by position. 80s retro-future." />
          <Chips colors={[{color:"#0D0020",label:"void"},{color:"#FF2EC4",label:"neon pink"},{color:"#00F5FF",label:"cyan"},{color:"#7B2FBE",label:"purple"}]} />
        </div>

        {/* 10 Wabi-Sabi */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
          <PhoneFrame bg="#F7F4EE" label="10 — Wabi-Sabi">
            <WabiScreen grid={beacon} />
          </PhoneFrame>
          <StyleLabel name="Wabi-Sabi" desc="Rice paper white. Ink-wash cells with deliberate imperfection. Extreme negative space. One line of copy. Nothing extra." />
          <Chips colors={[{color:"#F7F4EE",label:"rice paper"},{color:"#2A201A",label:"ink"},{color:"#7A6A60",label:"muted"},{color:"#D8D0C4",label:"border"}]} />
        </div>

      </div>

      {/* ── "How many neighbors?" explorations ── */}
      <div style={{ maxWidth: 1100, margin: "80px auto 0 " }}>
        <div style={{ paddingBottom: 32, borderBottom: "1px solid #333", marginBottom: 48 }}>
          <div style={{ fontSize: 9, letterSpacing: "0.3em", color: "#666", textTransform: "uppercase", marginBottom: 10 }}>PETRI — Onboarding screen explorations</div>
          <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "#fff", marginBottom: 10 }}>«How many neighbors?» — 3 directions</div>
          <div style={{ fontSize: 10, letterSpacing: "0.1em", color: "#777", lineHeight: 1.7, maxWidth: 480 }}>
            The current rules screen is too generic. Three redesign proposals — same content, completely different treatment. Pick one to ship.
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 48, justifyItems: "center" }}>

          {/* A — Periodic Table */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
            <PhoneFrame bg="#FAFAF7" label="A — Periodic Table">
              <NeighborPeriodicScreen />
            </PhoneFrame>
            <StyleLabel name="A · Periodic Table" desc="Each neighbor count is an element card. Scientific / chemistry aesthetic. Scannable at a glance — you see all 9 cases at once." />
            <Chips colors={[{color:"#059669",label:"thrives"},{color:"#7C3AED",label:"born"},{color:"#DC2626",label:"dies"},{color:"#FAFAF7",label:"bg"}]} />
          </div>

          {/* B — Big Number */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
            <PhoneFrame bg="#FAFAF7" label="B — Big Number">
              <NeighborBigNumberScreen />
            </PhoneFrame>
            <StyleLabel name="B · The Big Number" desc="One case at a time. Giant n fills the screen. Tap to advance through all 4 rules. Dramatic, editorial, matches Count screen rhythm." />
            <Chips colors={[{color:"#059669",label:"thrives"},{color:"#7C3AED",label:"born"},{color:"#DC2626",label:"dies"},{color:"#E7E5E0",label:"inactive"}]} />
          </div>

          {/* C — Spectrum Bar */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
            <PhoneFrame bg="#FAFAF7" label="C — Spectrum Bar">
              <NeighborSpectrumScreen />
            </PhoneFrame>
            <StyleLabel name="C · Spectrum Bar" desc="The 0–8 range as a scientific instrument readout. Dead zones in muted red, life zone glowing green. Birth rule gets its own callout." />
            <Chips colors={[{color:"#059669",label:"life zone"},{color:"#7C3AED",label:"birth"},{color:"#DC2626",label:"dead zones"},{color:"#E7E5E0",label:"bar"}]} />
          </div>

        </div>
      </div>

      {/* Footer note */}
      <div style={{ maxWidth: 1100, margin: "72px auto 0", paddingTop: 24, borderTop: "1px solid #333", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontSize: 8, letterSpacing: "0.2em", color: "#555", textTransform: "uppercase" }}>PETRI · Direction explorations · 2026</div>
        <div style={{ fontSize: 8, letterSpacing: "0.15em", color: "#444" }}>All dishes are live Conway simulations</div>
      </div>
    </div>
  )
}
