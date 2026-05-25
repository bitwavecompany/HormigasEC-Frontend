import { useRef, useEffect, useState } from 'react'

interface LoginFieldCanvasProps {
  antCount?: number
  grassDensity?: number
  antOpacityMax?: number
  leafCount?: number
}

interface Blade {
  x: number
  baseY: number
  h: number
  color: string
  freq: number
  phase: number
  amp: number
  lean: number
  hasSide: boolean
  sideDir: 1 | -1
}

interface Leaf {
  x: number
  y: number
  size: number
  angle: number
  color: string
  opacity: number
}

type Behavior = 'walker' | 'climber' | 'wanderer' | 'ground'

class Ant {
  x: number
  y: number
  vx: number
  vy: number
  angle: number
  baseOpacity: number
  displayOpacity: number
  size: number
  legPhase: number
  legSpeed: number
  behavior: Behavior
  fixedY: number
  fixedX: number
  climbDir: number
  tx: number
  ty: number
  waitTimer: number

  constructor(
    x: number,
    y: number,
    vx: number,
    vy: number,
    behavior: Behavior,
    opacityMax: number,
  ) {
    this.x = x
    this.y = y
    this.vx = vx
    this.vy = vy
    this.angle = Math.atan2(vy, vx)
    this.baseOpacity = 0.14 + Math.random() * (opacityMax - 0.14)
    this.displayOpacity = this.baseOpacity
    this.size = 2.2 + Math.random() * 1.1
    this.legPhase = Math.random() * Math.PI * 2
    this.legSpeed = 0.12 + Math.random() * 0.08
    this.behavior = behavior
    this.fixedY = y
    this.fixedX = x
    this.climbDir = Math.random() > 0.5 ? 1 : -1
    this.tx = x
    this.ty = y
    this.waitTimer = 0
  }
}

function drawAnt(ctx: CanvasRenderingContext2D, ant: Ant): void {
  ctx.globalAlpha = ant.displayOpacity
  ctx.save()
  ctx.translate(ant.x, ant.y)
  ctx.rotate(ant.angle + Math.PI / 2)
  ctx.scale(ant.size, ant.size)

  const color = 'rgba(148, 187, 60, 0.9)'
  ctx.fillStyle = color
  ctx.strokeStyle = color
  ctx.lineWidth = 0.8

  ctx.beginPath()
  ctx.ellipse(0, 5, 3, 4.2, 0, 0, Math.PI * 2)
  ctx.fill()

  ctx.beginPath()
  ctx.arc(0, 0.5, 1.5, 0, Math.PI * 2)
  ctx.fill()

  ctx.beginPath()
  ctx.ellipse(0, -4.5, 2.2, 2.8, 0, 0, Math.PI * 2)
  ctx.fill()

  ctx.beginPath()
  ctx.ellipse(0, -9.5, 1.8, 2.2, 0, 0, Math.PI * 2)
  ctx.fill()

  ctx.beginPath()
  ctx.moveTo(-0.8, -11)
  ctx.quadraticCurveTo(-4, -15, -6, -13)
  ctx.stroke()

  ctx.beginPath()
  ctx.moveTo(0.8, -11)
  ctx.quadraticCurveTo(4, -15, 6, -13)
  ctx.stroke()

  const legOffsets = [-4.5, -2.5, -0.5]
  for (let i = 0; i < 3; i++) {
    const swing = i % 2 === 0
      ? Math.sin(ant.legPhase + i) * 3
      : Math.sin(ant.legPhase + Math.PI + i) * 3
    ctx.beginPath()
    ctx.moveTo(-2, legOffsets[i])
    ctx.lineTo(-7 + swing, legOffsets[i] + 4)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(2, legOffsets[i])
    ctx.lineTo(7 - swing, legOffsets[i] + 4)
    ctx.stroke()
  }

  ctx.restore()
  ctx.globalAlpha = 1
}

export default function LoginFieldCanvas({
  antCount = 18,
  grassDensity = 4.0,
  antOpacityMax = 0.45,
  leafCount = 16,
}: LoginFieldCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [resizeKey, setResizeKey] = useState(0)

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>
    const onResize = () => {
      clearTimeout(timer)
      timer = setTimeout(() => setResizeKey(k => k + 1), 150)
    }
    window.addEventListener('resize', onResize)
    return () => {
      window.removeEventListener('resize', onResize)
      clearTimeout(timer)
    }
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const width = window.innerWidth
    const height = window.innerHeight
    canvas.width = width
    canvas.height = height

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const groundY = height - 62

    const grassColors = ['#1e3a0a', '#25470d', '#1a3008', '#2d5210', '#182e08']
    const blades: Blade[] = []
    for (let x = 0; x <= width; x += grassDensity) {
      const rnd = Math.random()
      const h = rnd < 0.35
        ? 8 + Math.random() * 6
        : rnd < 0.7
          ? 14 + Math.random() * 8
          : 22 + Math.random() * 12
      blades.push({
        x: x + (Math.random() - 0.5) * 3,
        baseY: groundY + 2 + Math.random() * 4,
        h,
        color: grassColors[Math.floor(Math.random() * grassColors.length)],
        freq: 0.6 + Math.random() * 0.9,
        phase: Math.random() * Math.PI * 2,
        amp: 3 + Math.random() * 4,
        lean: (Math.random() - 0.5) * 0.3,
        hasSide: Math.random() > 0.55,
        sideDir: Math.random() > 0.5 ? 1 : -1,
      })
    }

    const leafColors = ['#1e4a08', '#2d6b10', '#3a7a15', '#4d8c1a', '#6b7a1a', '#8a6e12', '#7a5c0e', '#5c4a0a']
    const leaves: Leaf[] = []
    for (let i = 0; i < leafCount; i++) {
      let lx = Math.random() * width
      const ly = 10 + Math.random() * (groundY - 20)
      const inCenter = lx > width * 0.25 && lx < width * 0.75
        && ly > height * 0.25 && ly < height * 0.75
      if (inCenter) {
        lx = Math.random() > 0.5
          ? Math.random() * width * 0.2
          : width * 0.8 + Math.random() * width * 0.2
      }
      leaves.push({
        x: lx,
        y: ly,
        size: 6.0 + Math.random() * 8.0,
        angle: Math.random() * Math.PI * 2,
        color: leafColors[Math.floor(Math.random() * leafColors.length)],
        opacity: 0.20 + Math.random() * 0.18,
      })
    }

    const ants: Ant[] = []

    for (let i = 0; i < 6; i++) {
      const y = 20 + Math.random() * (groundY - 30)
      const fromLeft = i % 2 === 0
      const startX = fromLeft ? 0 : width
      const vx = fromLeft ? 0.4 + Math.random() * 0.4 : -(0.4 + Math.random() * 0.4)
      ants.push(new Ant(startX, y, vx, 0, 'walker', antOpacityMax))
    }

    const groundCount = Math.max(0, antCount - 15)
    for (let i = 0; i < groundCount; i++) {
      const x = Math.random() * width
      const y = groundY - 5 - Math.random() * 10
      const ant = new Ant(x, y, (Math.random() - 0.5) * 0.6, (Math.random() - 0.5) * 0.2, 'ground', antOpacityMax)
      ant.tx = Math.random() * width
      ant.ty = groundY - 5 - Math.random() * 15
      ants.push(ant)
    }

    for (let i = 0; i < 3; i++) {
      const onLeft = i % 2 === 0
      const fixedX = onLeft ? 4 : width - 4
      const y = Math.random() * groundY
      const ant = new Ant(fixedX, y, 0, 0, 'climber', antOpacityMax)
      ant.climbDir = Math.random() > 0.5 ? 1 : -1
      ants.push(ant)
    }

    for (let i = 0; i < 6; i++) {
      const x = Math.random() * width
      const y = Math.random() * height
      const ant = new Ant(x, y, (Math.random() - 0.5) * 0.6, (Math.random() - 0.5) * 0.6, 'wanderer', antOpacityMax)
      ant.tx = Math.random() * width
      ant.ty = Math.random() * height
      ants.push(ant)
    }

    let rafId: number
    let t = 0

    function drawGround(): void {
      ctx!.fillStyle = '#1c2a0c'
      ctx!.fillRect(0, groundY, width, height - groundY)

      ctx!.fillStyle = '#111a06'
      ctx!.beginPath()
      ctx!.moveTo(0, height)
      ctx!.lineTo(0, groundY + 10)
      for (let x = 0; x <= width; x += 6) {
        const waveY = groundY + 18 + Math.sin(x * 0.04 + 1.2) * 5
        ctx!.lineTo(x, waveY)
      }
      ctx!.lineTo(width, height)
      ctx!.closePath()
      ctx!.fill()

      ctx!.save()
      ctx!.strokeStyle = 'rgba(255,255,255,0.06)'
      ctx!.lineWidth = 1
      ctx!.setLineDash([3, 9])
      ctx!.beginPath()
      ctx!.moveTo(0, groundY - 2)
      ctx!.lineTo(width, groundY - 2)
      ctx!.stroke()
      ctx!.setLineDash([])
      ctx!.restore()
    }

    function drawBlades(time: number): void {
      for (const blade of blades) {
        const swing = Math.sin(time * blade.freq + blade.phase) * blade.amp + blade.lean * blade.h
        const tipX = blade.x + swing
        const tipY = blade.baseY - blade.h
        const cpX = blade.x + swing * 0.5 + blade.lean * blade.h * 0.4
        const cpY = blade.baseY - blade.h * 0.55

        ctx!.strokeStyle = blade.color
        ctx!.lineWidth = 1.1
        ctx!.beginPath()
        ctx!.moveTo(blade.x, blade.baseY)
        ctx!.quadraticCurveTo(cpX, cpY, tipX, tipY)
        ctx!.stroke()

        if (blade.hasSide && blade.h > 14) {
          const midX = blade.x + swing * 0.3
          const midY = blade.baseY - blade.h * 0.45
          const leafTipX = midX + blade.sideDir * 5
          const leafTipY = midY - 5
          ctx!.lineWidth = 0.9
          ctx!.beginPath()
          ctx!.moveTo(midX, midY)
          ctx!.quadraticCurveTo(
            midX + blade.sideDir * 3,
            midY - 3,
            leafTipX,
            leafTipY
          )
          ctx!.stroke()
        }
      }
    }

    function drawLeaves(): void {
      for (const leaf of leaves) {
        ctx!.save()
        ctx!.globalAlpha = leaf.opacity
        ctx!.translate(leaf.x, leaf.y)
        ctx!.rotate(leaf.angle)
        ctx!.scale(leaf.size, leaf.size)

        const tipY = -9
        const baseY = 4
        const lW = 7.5
        const rW = 4.5

        ctx!.fillStyle = leaf.color
        ctx!.beginPath()
        ctx!.moveTo(0, tipY)
        ctx!.bezierCurveTo(-lW, tipY * 0.3, -lW, baseY * 0.5, 0, baseY)
        ctx!.bezierCurveTo(rW, baseY * 0.5, rW, tipY * 0.3, 0, tipY)
        ctx!.fill()

        ctx!.strokeStyle = 'rgba(0,0,0,0.20)'
        ctx!.lineWidth = 0.6
        ctx!.beginPath()
        ctx!.moveTo(0, baseY)
        ctx!.lineTo(0, tipY)
        ctx!.stroke()

        ctx!.strokeStyle = 'rgba(0,0,0,0.15)'
        ctx!.lineWidth = 0.4
        const totalSpan = baseY - tipY
        const sin35 = Math.sin(35 * Math.PI / 180)
        const cos35 = Math.cos(35 * Math.PI / 180)
        for (let v = 0; v < 4; v++) {
          const frac = (v + 1) / 5
          const vy = baseY - frac * totalSpan
          const veinLen = 4.5 - frac * 2.5
          ctx!.beginPath()
          ctx!.moveTo(0, vy)
          ctx!.lineTo(-sin35 * veinLen, vy - cos35 * veinLen)
          ctx!.stroke()
          ctx!.beginPath()
          ctx!.moveTo(0, vy)
          ctx!.lineTo(sin35 * veinLen, vy - cos35 * veinLen)
          ctx!.stroke()
        }

        ctx!.restore()
        ctx!.globalAlpha = 1
      }
    }

    function updateAnt(ant: Ant): void {
      if (ant.behavior === 'walker') {
        ant.vx += (Math.random() - 0.5) * 0.04
        if (Math.abs(ant.vx) < 0.3) {
          ant.vx = ant.vx >= 0 ? 0.3 : -0.3
        }
        ant.vx = Math.max(-1.56, Math.min(1.56, ant.vx))
        ant.y += (ant.fixedY - ant.y) * 0.04 + (Math.random() - 0.5) * 0.15
        ant.x += ant.vx
        if (ant.x >= width) {
          ant.x = width
          ant.vx = -Math.abs(ant.vx)
        } else if (ant.x <= 0) {
          ant.x = 0
          ant.vx = Math.abs(ant.vx)
        }
        ant.angle = Math.atan2(0, ant.vx)

      } else if (ant.behavior === 'climber') {
        const climbSpeed = 0.35 + Math.random() * 0.1
        ant.y += ant.climbDir * climbSpeed
        ant.x += (ant.fixedX - ant.x) * 0.15 + (Math.random() - 0.5) * 0.3
        ant.x = Math.max(0, Math.min(width, ant.x))
        if (ant.y <= 5) {
          ant.y = 5
          ant.climbDir = 1
        } else if (ant.y >= groundY - 2) {
          ant.y = groundY - 2
          ant.climbDir = -1
        }
        ant.angle = Math.atan2(ant.climbDir, 0)

      } else if (ant.behavior === 'wanderer') {
        if (ant.waitTimer > 0) {
          ant.waitTimer--
          ant.vx *= 0.88
          ant.vy *= 0.88
        } else {
          const dx = ant.tx - ant.x
          const dy = ant.ty - ant.y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < 4) {
            ant.waitTimer = 30 + Math.floor(Math.random() * 60)
            ant.tx = 10 + Math.random() * (width - 20)
            ant.ty = 10 + Math.random() * (height - 20)
          } else {
            const speed = 0.4
            ant.vx += (dx / dist) * speed * 0.08
            ant.vy += (dy / dist) * speed * 0.08
            const maxSpd = 1.04
            const spd = Math.sqrt(ant.vx * ant.vx + ant.vy * ant.vy)
            if (spd > maxSpd) {
              ant.vx = (ant.vx / spd) * maxSpd
              ant.vy = (ant.vy / spd) * maxSpd
            }
          }
        }
        ant.x += ant.vx
        ant.y += ant.vy
        if (ant.x < 0) { ant.x = 0; ant.vx = Math.abs(ant.vx) }
        if (ant.x > width) { ant.x = width; ant.vx = -Math.abs(ant.vx) }
        if (ant.y < 0) { ant.y = 0; ant.vy = Math.abs(ant.vy) }
        if (ant.y > height) { ant.y = height; ant.vy = -Math.abs(ant.vy) }
        const spd = Math.sqrt(ant.vx * ant.vx + ant.vy * ant.vy)
        if (spd > 0.05) ant.angle = Math.atan2(ant.vy, ant.vx)

      } else {
        if (ant.waitTimer > 0) {
          ant.waitTimer--
          ant.vx *= 0.85
          ant.vy *= 0.85
        } else {
          const dx = ant.tx - ant.x
          const dy = ant.ty - ant.y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < 3) {
            ant.waitTimer = 40 + Math.floor(Math.random() * 80)
            ant.tx = Math.random() * width
            ant.ty = groundY - 5 - Math.random() * 15
          } else {
            const speed = 0.35 + Math.random() * 0.15
            ant.vx += (dx / dist) * speed * 0.08
            ant.vy += (dy / dist) * speed * 0.08
            const maxSpd = 0.7
            const spd = Math.sqrt(ant.vx * ant.vx + ant.vy * ant.vy)
            if (spd > maxSpd) {
              ant.vx = (ant.vx / spd) * maxSpd
              ant.vy = (ant.vy / spd) * maxSpd
            }
          }
        }
        ant.x += ant.vx
        ant.y += ant.vy
        ant.x = Math.max(0, Math.min(width, ant.x))
        ant.y = Math.max(groundY - 25, Math.min(groundY - 1, ant.y))
        const spd = Math.sqrt(ant.vx * ant.vx + ant.vy * ant.vy)
        if (spd > 0.05) ant.angle = Math.atan2(ant.vy, ant.vx)
      }

      ant.legPhase += ant.legSpeed
      ant.displayOpacity = ant.baseOpacity
    }

    function loop(): void {
      t += 0.016
      ctx!.clearRect(0, 0, width, height)
      drawGround()
      drawBlades(t)
      drawLeaves()
      for (const ant of ants) {
        updateAnt(ant)
        drawAnt(ctx!, ant)
      }
      rafId = requestAnimationFrame(loop)
    }

    rafId = requestAnimationFrame(loop)

    return () => {
      cancelAnimationFrame(rafId)
    }
  }, [antCount, grassDensity, antOpacityMax, leafCount, resizeKey])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 0,
        width: '100vw',
        height: '100vh',
      }}
    />
  )
}
