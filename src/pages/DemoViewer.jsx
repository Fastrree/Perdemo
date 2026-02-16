import { useState, useRef, useMemo, useCallback, useEffect, Suspense } from 'react'
import { useLocation } from 'react-router-dom'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import { getAtmosphereRecipe } from '../utils/aiProxy'

/* ═══════════════════════════════════════════════════
   FABRIC DATA — PBR + SSS + Physics Parameters
   ═══════════════════════════════════════════════════ */
const fabrics = [
    {
        id: 'velvet-red', name: 'Kadife Bordo', color: '#8B1A1A',
        roughness: 0.85, metalness: 0.02,
        sheen: 0.8, sheenColor: '#D44A4A',
        clearcoat: 0.05, clearcoatRoughness: 0.8,
        transmission: 0.02, thickness: 2.5, attenuationColor: '#3D0808',
        // cloth physics
        weight: 1.0, stiffness: 0.6, damping: 0.85,
        normalType: 'velvet', normalStrength: 0.6,
    },
    {
        id: 'silk-cream', name: 'İpek Krem', color: '#F5E6D3',
        roughness: 0.2, metalness: 0.08,
        sheen: 0.3, sheenColor: '#FFF8F0',
        clearcoat: 0.35, clearcoatRoughness: 0.3,
        transmission: 0.15, thickness: 0.8, attenuationColor: '#E8D5BF',
        weight: 0.3, stiffness: 0.2, damping: 0.55,
        normalType: 'silk', normalStrength: 0.25,
    },
    {
        id: 'linen-navy', name: 'Keten Lacivert', color: '#1B2A4A',
        roughness: 0.78, metalness: 0.0,
        sheen: 0.1, sheenColor: '#3A4F70',
        clearcoat: 0.0, clearcoatRoughness: 1.0,
        transmission: 0.06, thickness: 1.8, attenuationColor: '#0D1525',
        weight: 0.7, stiffness: 0.75, damping: 0.7,
        normalType: 'linen', normalStrength: 0.8,
    },
    {
        id: 'cotton-grey', name: 'Pamuk Gri', color: '#7A7D82',
        roughness: 0.65, metalness: 0.0,
        sheen: 0.05, sheenColor: '#9A9DA2',
        clearcoat: 0.0, clearcoatRoughness: 1.0,
        transmission: 0.08, thickness: 1.2, attenuationColor: '#4A4D52',
        weight: 0.5, stiffness: 0.5, damping: 0.65,
        normalType: 'cotton', normalStrength: 0.5,
    },
    {
        id: 'blackout-black', name: 'Blackout Siyah', color: '#1A1A2E',
        roughness: 0.95, metalness: 0.0,
        sheen: 0.0, sheenColor: '#1A1A2E',
        clearcoat: 0.0, clearcoatRoughness: 1.0,
        transmission: 0.005, thickness: 3.5, attenuationColor: '#000000',
        weight: 0.9, stiffness: 0.7, damping: 0.8,
        normalType: 'cotton', normalStrength: 0.35,
    },
    {
        id: 'sheer-white', name: 'Tül Beyaz', color: '#F8F8FF',
        roughness: 0.12, metalness: 0.0,
        sheen: 0.0, sheenColor: '#FFFFFF',
        clearcoat: 0.0, clearcoatRoughness: 1.0,
        transmission: 0.72, thickness: 0.2, attenuationColor: '#F0F0FF',
        weight: 0.12, stiffness: 0.08, damping: 0.35,
        normalType: 'sheer', normalStrength: 0.15,
    },
    {
        id: 'jacquard-gold', name: 'Jakar Altın', color: '#B8860B',
        roughness: 0.5, metalness: 0.12,
        sheen: 0.5, sheenColor: '#D4A829',
        clearcoat: 0.15, clearcoatRoughness: 0.5,
        transmission: 0.04, thickness: 2.0, attenuationColor: '#6B4E06',
        weight: 0.8, stiffness: 0.65, damping: 0.75,
        normalType: 'jacquard', normalStrength: 0.9,
    },
    {
        id: 'velvet-emerald', name: 'Kadife Zümrüt', color: '#1B5E3B',
        roughness: 0.85, metalness: 0.02,
        sheen: 0.75, sheenColor: '#3AAF6B',
        clearcoat: 0.05, clearcoatRoughness: 0.8,
        transmission: 0.02, thickness: 2.5, attenuationColor: '#0D2E1D',
        weight: 1.0, stiffness: 0.6, damping: 0.85,
        normalType: 'velvet', normalStrength: 0.6,
    },
]

const curtainStyles = [
    { id: 'rod-pocket', name: 'Büzgülü', icon: '≋' },
    { id: 'grommet', name: 'Halkalı', icon: '◎' },
    { id: 'tab-top', name: 'Kulaklı', icon: '⊓' },
]

/* ═══════════════════════════════════════════════════
   PROCEDURAL NORMAL MAP GENERATOR (Cached per type)
   One-time canvas operation, zero per-frame cost
   ═══════════════════════════════════════════════════ */
const normalMapCache = {}

function generateNormalMap(type) {
    if (normalMapCache[type]) return normalMapCache[type]

    const size = 256
    const canvas = document.createElement('canvas')
    canvas.width = size
    canvas.height = size
    const ctx = canvas.getContext('2d')

    // Base neutral normal (128,128,255 = flat)
    ctx.fillStyle = 'rgb(128,128,255)'
    ctx.fillRect(0, 0, size, size)

    const imgData = ctx.getImageData(0, 0, size, size)
    const data = imgData.data

    switch (type) {
        case 'velvet': {
            // Dense short pile pattern
            for (let i = 0; i < data.length; i += 4) {
                const px = (i / 4) % size
                const py = Math.floor((i / 4) / size)
                const noise = Math.sin(px * 0.8) * Math.cos(py * 0.8) * 15
                const fine = (Math.random() - 0.5) * 10
                data[i] = 128 + noise + fine
                data[i + 1] = 128 + Math.cos(px * 0.6) * Math.sin(py * 0.6) * 15 + fine
            }
            break
        }
        case 'silk': {
            // Subtle horizontal weave
            for (let i = 0; i < data.length; i += 4) {
                const py = Math.floor((i / 4) / size)
                const wave = Math.sin(py * 0.5) * 8
                data[i] = 128 + wave
                data[i + 1] = 128 + Math.cos(py * 1.2) * 5
            }
            break
        }
        case 'linen': {
            // Coarse cross-hatch weave
            for (let i = 0; i < data.length; i += 4) {
                const px = (i / 4) % size
                const py = Math.floor((i / 4) / size)
                const hWeave = Math.sin(py * 1.5) * 20
                const vWeave = Math.sin(px * 1.5) * 20
                data[i] = 128 + hWeave + (Math.random() - 0.5) * 8
                data[i + 1] = 128 + vWeave + (Math.random() - 0.5) * 8
            }
            break
        }
        case 'cotton': {
            // Medium regular weave
            for (let i = 0; i < data.length; i += 4) {
                const px = (i / 4) % size
                const py = Math.floor((i / 4) / size)
                const grid = Math.sin(px * 1.0) * Math.sin(py * 1.0) * 12
                data[i] = 128 + grid + (Math.random() - 0.5) * 6
                data[i + 1] = 128 + grid + (Math.random() - 0.5) * 6
            }
            break
        }
        case 'sheer': {
            // Very fine, almost invisible mesh
            for (let i = 0; i < data.length; i += 4) {
                const px = (i / 4) % size
                const py = Math.floor((i / 4) / size)
                data[i] = 128 + Math.sin(px * 2.5) * 4
                data[i + 1] = 128 + Math.sin(py * 2.5) * 4
            }
            break
        }
        case 'jacquard': {
            // Ornate repeating pattern
            for (let i = 0; i < data.length; i += 4) {
                const px = (i / 4) % size
                const py = Math.floor((i / 4) / size)
                const pattern =
                    Math.sin(px * 0.15) * Math.cos(py * 0.15) * 25 +
                    Math.sin(px * 0.4 + py * 0.4) * 12
                data[i] = 128 + pattern
                data[i + 1] = 128 + Math.cos(px * 0.15 + Math.PI * 0.25) * Math.sin(py * 0.15) * 25
            }
            break
        }
    }

    ctx.putImageData(imgData, 0, 0)

    const texture = new THREE.CanvasTexture(canvas)
    texture.wrapS = THREE.RepeatWrapping
    texture.wrapT = THREE.RepeatWrapping
    texture.repeat.set(3, 4)
    normalMapCache[type] = texture
    return texture
}

/* ═══════════════════════════════════════════════════
   WINDOW FRAME
   ═══════════════════════════════════════════════════ */
function WindowFrame() {
    const frameMaterial = useMemo(() => new THREE.MeshStandardMaterial({
        color: '#8B7355', roughness: 0.45, metalness: 0.15,
    }), [])

    const glassMaterial = useMemo(() => new THREE.MeshPhysicalMaterial({
        color: '#87CEEB', transparent: true, opacity: 0.12,
        roughness: 0.02, metalness: 0.0, transmission: 0.92,
    }), [])

    return (
        <group>
            <mesh position={[0, 0, -0.05]}>
                <planeGeometry args={[3, 3.5]} />
                <primitive object={glassMaterial} attach="material" />
            </mesh>
            {/* Frame pieces */}
            <mesh position={[0, 1.85, 0]} material={frameMaterial}>
                <boxGeometry args={[3.4, 0.15, 0.15]} />
            </mesh>
            <mesh position={[0, -1.85, 0]} material={frameMaterial}>
                <boxGeometry args={[3.4, 0.15, 0.15]} />
            </mesh>
            <mesh position={[-1.6, 0, 0]} material={frameMaterial}>
                <boxGeometry args={[0.15, 3.85, 0.15]} />
            </mesh>
            <mesh position={[1.6, 0, 0]} material={frameMaterial}>
                <boxGeometry args={[0.15, 3.85, 0.15]} />
            </mesh>
            <mesh position={[0, 0, 0]} material={frameMaterial}>
                <boxGeometry args={[0.08, 3.7, 0.12]} />
            </mesh>
            <mesh position={[0, 0.3, 0]} material={frameMaterial}>
                <boxGeometry args={[3.2, 0.08, 0.12]} />
            </mesh>
            {/* Rod */}
            <mesh position={[0, 2.15, 0.2]}>
                <cylinderGeometry args={[0.04, 0.04, 4, 16]} rotation={[0, 0, Math.PI / 2]} />
                <meshStandardMaterial color="#5C4033" roughness={0.3} metalness={0.4} />
            </mesh>
            <mesh position={[-2.05, 2.15, 0.2]}>
                <sphereGeometry args={[0.08, 8, 8]} />
                <meshStandardMaterial color="#5C4033" roughness={0.3} metalness={0.4} />
            </mesh>
            <mesh position={[2.05, 2.15, 0.2]}>
                <sphereGeometry args={[0.08, 8, 8]} />
                <meshStandardMaterial color="#5C4033" roughness={0.3} metalness={0.4} />
            </mesh>
        </group>
    )
}

/* ═══════════════════════════════════════════════════
   CURTAIN PANEL — PBR + High-Performance Cloth Engine
   
   Perf Strategy:
   ✅ 28×28 grid (841 vertices vs 2401)
   ✅ Pre-baked drape & AO (computed once, not per frame)
   ✅ Typed array direct access (no getX/setX overhead)
   ✅ Sin lookup table for wind (no Math.sin per vertex)
   ✅ Adaptive frame skip (3 for wind, 5 for static)
   ✅ computeVertexNormals every 6th update only
   ═══════════════════════════════════════════════════ */

// Pre-compute sin lookup table for wind simulation
const SIN_TABLE_SIZE = 256
const SIN_TABLE = new Float32Array(SIN_TABLE_SIZE)
for (let i = 0; i < SIN_TABLE_SIZE; i++) {
    SIN_TABLE[i] = Math.sin((i / SIN_TABLE_SIZE) * Math.PI * 2)
}
function fastSin(x) {
    const idx = ((x % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2)
    return SIN_TABLE[(idx / (Math.PI * 2) * SIN_TABLE_SIZE) | 0]
}

function CurtainPanel({ side, fabric, openAmount, style, windEnabled }) {
    const meshRef = useRef()
    const timeRef = useRef(0)
    const frameCount = useRef(0)
    const normalCounter = useRef(0)

    const SEGMENTS = 28 // 841 vertices — sweet spot for visual quality vs perf

    const width = 2.0 - openAmount * 0.8
    const height = 4.0
    const w = SEGMENTS + 1 // vertices per row

    // Geometry: cached, only rebuilt on dimension change
    const geometry = useMemo(() => {
        const geo = new THREE.PlaneGeometry(width, height, SEGMENTS, SEGMENTS)
        const count = w * w
        const colors = new Float32Array(count * 3)
        colors.fill(1.0)
        geo.setAttribute('color', new THREE.BufferAttribute(colors, 3))
        return geo
    }, [width, height])

    // Pre-bake static drape pattern + fold AO (computed ONCE, reused every frame)
    const bakeData = useMemo(() => {
        const drapeFreq = 6 + fabric.stiffness * 4
        const drapeAmp = 0.07 * fabric.weight
        const gravityPull = fabric.weight * 0.03
        const count = w * w
        const staticZ = new Float32Array(count)
        const aoValues = new Float32Array(count)

        // We need position X and Y from the geometry to compute drape
        const posArr = geometry.attributes.position.array

        for (let i = 0; i < count; i++) {
            const x = posArr[i * 3]
            const y = posArr[i * 3 + 1]
            const yNorm = 1 - (y + height / 2) / height

            // Static drape fold
            const drape = Math.sin(x * drapeFreq) * drapeAmp * (0.4 + yNorm * 0.6)

            // Gravity at bottom
            const gravity = yNorm > 0.85 ? gravityPull * ((yNorm - 0.85) / 0.15) * ((yNorm - 0.85) / 0.15) : 0

            // Gather at top when open
            const gatherX = openAmount > 0.1 && yNorm < 0.15
                ? Math.sin(x * 12) * 0.03 * openAmount * (1 - yNorm / 0.15)
                : 0

            staticZ[i] = drape + gravity + gatherX + 0.15

            // AO: darker in fold creases
            const foldDepth = Math.abs(drape) + Math.abs(gatherX)
            aoValues[i] = 1.0 - Math.min(foldDepth * 3.5, 0.35)
        }

        return { staticZ, aoValues }
    }, [geometry, fabric.stiffness, fabric.weight, openAmount, height])

    // Apply baked AO once (not per frame)
    useMemo(() => {
        const colors = geometry.attributes.color
        const count = w * w
        for (let i = 0; i < count; i++) {
            const ao = bakeData.aoValues[i]
            colors.setXYZ(i, ao, ao, ao)
        }
        colors.needsUpdate = true
    }, [geometry, bakeData])

    // PBR material (cached per fabric)
    const material = useMemo(() => {
        const normalMap = generateNormalMap(fabric.normalType)
        return new THREE.MeshPhysicalMaterial({
            color: fabric.color,
            roughness: fabric.roughness,
            metalness: fabric.metalness,
            side: THREE.DoubleSide,
            vertexColors: true,
            sheen: fabric.sheen,
            sheenRoughness: 0.4,
            sheenColor: new THREE.Color(fabric.sheenColor),
            clearcoat: fabric.clearcoat,
            clearcoatRoughness: fabric.clearcoatRoughness,
            transmission: fabric.transmission,
            thickness: fabric.thickness,
            attenuationColor: new THREE.Color(fabric.attenuationColor),
            attenuationDistance: 0.5,
            normalMap: normalMap,
            normalScale: new THREE.Vector2(fabric.normalStrength, fabric.normalStrength),
        })
    }, [fabric])

    // Wind parameters (cached)
    const windParams = useMemo(() => ({
        waveAmp: 0.04 * fabric.weight,
        breezeAmp: windEnabled ? 0.06 / Math.max(fabric.weight, 0.15) : 0.015,
        breezeSpeed: windEnabled ? 2.0 / Math.max(fabric.weight, 0.15) : 0.6,
    }), [fabric.weight, windEnabled])

    // Frame skip rate: wind ON = every 3 frames, OFF = every 5 frames
    const skipRate = windEnabled ? 3 : 5

    useFrame((_, delta) => {
        if (!meshRef.current) return
        frameCount.current++

        // Adaptive frame skip
        if (frameCount.current % skipRate !== 0) return

        timeRef.current += delta * skipRate // compensate for skipped frames
        const t = timeRef.current

        const posArr = meshRef.current.geometry.attributes.position.array
        const count = w * w
        const { staticZ, aoValues } = bakeData
        const { waveAmp, breezeAmp, breezeSpeed } = windParams

        // Wind modulator (computed once per frame, not per vertex)
        const windPulse = windEnabled ? 1 + fastSin(t * 0.3) * 0.5 : 1

        // Direct typed array access — no getX/setX overhead
        for (let i = 0; i < count; i++) {
            const x = posArr[i * 3]
            const y = posArr[i * 3 + 1]
            const yNorm = 1 - (y + height / 2) / height
            const yWeight = 0.3 + yNorm * 0.7

            // Dynamic: wave + breeze (using fast sin lookup)
            const wave = fastSin(x * 4 + t * 0.4) * waveAmp * (0.5 + yNorm * 0.5)
            const breeze = fastSin(t * breezeSpeed + x * 2.5 + y * 0.8) * breezeAmp * yWeight * windPulse

            posArr[i * 3 + 2] = staticZ[i] + wave + breeze
        }

        meshRef.current.geometry.attributes.position.needsUpdate = true

        // computeVertexNormals is expensive — only do it every 6th physics update
        normalCounter.current++
        if (normalCounter.current % 6 === 0) {
            meshRef.current.geometry.computeVertexNormals()
        }
    })

    const xPos = side === 'left' ? -0.8 - openAmount * 0.4 : 0.8 + openAmount * 0.4

    return (
        <mesh ref={meshRef} geometry={geometry} material={material} position={[xPos, 0, 0.15]} />
    )
}

/* ═══════════════════════════════════════════════════
   PROCEDURAL BACKDROP GENERATOR (cached)
   ═══════════════════════════════════════════════════ */
const backdropTextureCache = {}

function generateBackdropTexture(type) {
    if (backdropTextureCache[type]) return backdropTextureCache[type]

    const w = 512, h = 384
    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')

    if (type === 'city') {
        // Sky gradient — golden hour
        const skyGrad = ctx.createLinearGradient(0, 0, 0, h * 0.6)
        skyGrad.addColorStop(0, '#1a1a3e')
        skyGrad.addColorStop(0.3, '#2d1b4e')
        skyGrad.addColorStop(0.6, '#e87550')
        skyGrad.addColorStop(0.85, '#f4a460')
        skyGrad.addColorStop(1, '#ffd89b')
        ctx.fillStyle = skyGrad
        ctx.fillRect(0, 0, w, h)

        // Sun glow
        const sunGrad = ctx.createRadialGradient(w * 0.65, h * 0.55, 5, w * 0.65, h * 0.55, 100)
        sunGrad.addColorStop(0, 'rgba(255,220,150,0.8)')
        sunGrad.addColorStop(0.3, 'rgba(255,180,100,0.3)')
        sunGrad.addColorStop(1, 'rgba(255,150,80,0)')
        ctx.fillStyle = sunGrad
        ctx.fillRect(0, 0, w, h)

        // City skyline silhouettes
        const buildings = [
            { x: 0, w: 35, h: 160 }, { x: 30, w: 25, h: 120 },
            { x: 55, w: 40, h: 200 }, { x: 90, w: 30, h: 140 },
            { x: 115, w: 50, h: 250 }, { x: 160, w: 35, h: 180 },
            { x: 190, w: 28, h: 130 }, { x: 215, w: 55, h: 280 },
            { x: 265, w: 30, h: 150 }, { x: 290, w: 45, h: 220 },
            { x: 330, w: 35, h: 170 }, { x: 360, w: 60, h: 300 },
            { x: 415, w: 30, h: 140 }, { x: 440, w: 45, h: 240 },
            { x: 480, w: 35, h: 190 },
        ]
        buildings.forEach(b => {
            // Building body
            ctx.fillStyle = `rgba(15,15,35,${0.7 + Math.random() * 0.3})`
            ctx.fillRect(b.x, h - b.h, b.w, b.h)
            // Window lights
            ctx.fillStyle = 'rgba(255,220,130,0.6)'
            for (let wy = h - b.h + 8; wy < h - 5; wy += 12) {
                for (let wx = b.x + 4; wx < b.x + b.w - 4; wx += 8) {
                    if (Math.random() > 0.35) {
                        ctx.fillRect(wx, wy, 3, 4)
                    }
                }
            }
        })
    } else if (type === 'garden') {
        // Sky gradient — bright day
        const skyGrad = ctx.createLinearGradient(0, 0, 0, h * 0.55)
        skyGrad.addColorStop(0, '#4a9ae8')
        skyGrad.addColorStop(0.5, '#7ec8e3')
        skyGrad.addColorStop(1, '#c5e8f0')
        ctx.fillStyle = skyGrad
        ctx.fillRect(0, 0, w, h)

        // Clouds
        ctx.fillStyle = 'rgba(255,255,255,0.5)'
        const clouds = [[80, 50, 60], [200, 30, 45], [350, 60, 50], [450, 40, 35]]
        clouds.forEach(([cx, cy, r]) => {
            ctx.beginPath()
            ctx.ellipse(cx, cy, r, r * 0.5, 0, 0, Math.PI * 2)
            ctx.fill()
            ctx.beginPath()
            ctx.ellipse(cx + r * 0.6, cy + 5, r * 0.7, r * 0.4, 0, 0, Math.PI * 2)
            ctx.fill()
        })

        // Distant hills
        ctx.fillStyle = '#5a8a4a'
        ctx.beginPath()
        ctx.moveTo(0, h * 0.55)
        for (let x = 0; x <= w; x += 4) {
            ctx.lineTo(x, h * 0.55 - Math.sin(x * 0.015) * 25 - Math.sin(x * 0.008) * 15)
        }
        ctx.lineTo(w, h)
        ctx.lineTo(0, h)
        ctx.fill()

        // Green lawn
        const lawnGrad = ctx.createLinearGradient(0, h * 0.55, 0, h)
        lawnGrad.addColorStop(0, '#4a8a3a')
        lawnGrad.addColorStop(1, '#3d7a2e')
        ctx.fillStyle = lawnGrad
        ctx.fillRect(0, h * 0.6, w, h * 0.4)

        // Trees
        const trees = [[60, 0.5], [150, 0.6], [280, 0.45], [400, 0.55], [480, 0.5]]
        trees.forEach(([tx, s]) => {
            const ty = h * 0.58
            // Trunk
            ctx.fillStyle = '#6b4226'
            ctx.fillRect(tx - 3 * s, ty, 6 * s, 30 * s)
            // Canopy
            ctx.fillStyle = `rgb(${40 + Math.random() * 30},${100 + Math.random() * 40},${30 + Math.random() * 20})`
            ctx.beginPath()
            ctx.ellipse(tx, ty - 10 * s, 25 * s, 30 * s, 0, 0, Math.PI * 2)
            ctx.fill()
        })

        // Flowers (dots)
        const flowerColors = ['#e84393', '#fd79a8', '#fdcb6e', '#e17055', '#ffffff']
        for (let i = 0; i < 40; i++) {
            ctx.fillStyle = flowerColors[Math.floor(Math.random() * flowerColors.length)]
            ctx.beginPath()
            ctx.arc(Math.random() * w, h * 0.65 + Math.random() * h * 0.3, 2 + Math.random() * 2, 0, Math.PI * 2)
            ctx.fill()
        }
    } else {
        // 'none' — neutral grey exterior
        const grad = ctx.createLinearGradient(0, 0, 0, h)
        grad.addColorStop(0, '#87CEEB')
        grad.addColorStop(1, '#B0C4DE')
        ctx.fillStyle = grad
        ctx.fillRect(0, 0, w, h)
    }

    const texture = new THREE.CanvasTexture(canvas)
    backdropTextureCache[type] = texture
    return texture
}

/* ═══════════════════════════════════════════════════
   WINDOW BACKDROP
   ═══════════════════════════════════════════════════ */
function WindowBackdrop({ type }) {
    const texture = useMemo(() => generateBackdropTexture(type), [type])

    return (
        <mesh position={[0, 0, -0.15]}>
            <planeGeometry args={[2.9, 3.4]} />
            <meshBasicMaterial map={texture} />
        </mesh>
    )
}

/* ═══════════════════════════════════════════════════
   ROOM
   ═══════════════════════════════════════════════════ */
function Room() {
    return (
        <group>
            <mesh position={[0, 0, -0.5]}>
                <planeGeometry args={[12, 8]} />
                <meshStandardMaterial color="#E8DDD3" roughness={0.9} />
            </mesh>
            <mesh position={[0, -3.5, 1]} rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[12, 6]} />
                <meshStandardMaterial color="#8B7355" roughness={0.7} />
            </mesh>
        </group>
    )
}

/* ═══════════════════════════════════════════════════
   SCENE 
   ═══════════════════════════════════════════════════ */
function SceneContent({ fabric, openAmount, curtainStyle, windEnabled, backdrop }) {
    return (
        <>
            {/* Ambient fill */}
            <ambientLight intensity={0.4} />

            {/* Main sun from behind window — drives SSS transmission */}
            <directionalLight
                position={[0, 2, -3]}
                intensity={1.2}
                color="#FFF5E6"
            />

            {/* Single fill light (merged two into one for perf) */}
            <directionalLight position={[3, 4, 3]} intensity={0.5} />

            <Room />
            <WindowBackdrop type={backdrop} />
            <WindowFrame />
            <CurtainPanel
                side="left" fabric={fabric}
                openAmount={openAmount} style={curtainStyle}
                windEnabled={windEnabled}
            />
            <CurtainPanel
                side="right" fabric={fabric}
                openAmount={openAmount} style={curtainStyle}
                windEnabled={windEnabled}
            />

            <OrbitControls
                enablePan={false}
                minDistance={3}
                maxDistance={10}
                minPolarAngle={Math.PI / 6}
                maxPolarAngle={Math.PI / 1.5}
                target={[0, 0, 0]}
                enableDamping
                dampingFactor={0.08}
            />
        </>
    )
}

/* ═══════════════════════════════════════════════════
   AI RENDER MOCK FLOW
   ═══════════════════════════════════════════════════ */
function AIRenderOverlay({ visible, progress, resultUrl, onClose, onDownload }) {
    if (!visible) return null

    return (
        <div style={{
            position: 'absolute', inset: 0, zIndex: 20, display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            background: 'rgba(6,9,19,0.85)', backdropFilter: 'blur(12px)',
        }}>
            <div style={{
                background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)',
                borderRadius: 'var(--radius-xl)', padding: '32px', maxWidth: '420px',
                width: '90%', textAlign: 'center',
            }}>
                {resultUrl ? (
                    <>
                        <div style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '16px' }}>
                            ✨ AI Render Tamamlandı
                        </div>
                        <img
                            src={resultUrl}
                            alt="AI Render result"
                            style={{
                                width: '100%', borderRadius: 'var(--radius-md)',
                                marginBottom: '16px', border: '1px solid var(--border-primary)',
                            }}
                        />
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <button className="btn btn-secondary" style={{ flex: 1 }} onClick={onClose}>
                                Kapat
                            </button>
                            <button className="btn btn-primary" style={{ flex: 1 }} onClick={onDownload}>
                                ⬇️ İndir
                            </button>
                        </div>
                    </>
                ) : (
                    <>
                        <div style={{
                            width: '64px', height: '64px', margin: '0 auto 20px',
                            borderRadius: 'var(--radius-full)',
                            background: 'var(--gradient-brand)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '1.75rem', animation: 'pulse-glow 2s infinite',
                        }}>
                            ✨
                        </div>
                        <div style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '8px' }}>
                            Fotorealistik Render
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '20px' }}>
                            AI modeli sahneyi işliyor...
                        </div>
                        {/* Progress bar */}
                        <div className="progress-bar" style={{ marginBottom: '12px' }}>
                            <div className="progress-fill" style={{ width: `${progress}%`, transition: 'width 0.3s ease' }} />
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                            %{progress} tamamlandı
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}

/* ═══════════════════════════════════════════════════
   INLINE STYLES REMOVED - Using layout.css classes
   ═══════════════════════════════════════════════════ */

/* ═══════════════════════════════════════════════════
   COLLABORATIVE SHOWROOM — BroadcastChannel Sync
   Fixed: ref-based role tracking, unmount-only cleanup,
   initial sync on guest join, no stale closures
   ═══════════════════════════════════════════════════ */
function useCollabSync({ onReceive }) {
    const channelRef = useRef(null)
    const roleRef = useRef(null)
    const [role, setRole] = useState(null)
    const [roomCode, setRoomCode] = useState('')
    const [connected, setConnected] = useState(false)
    const [peerCount, setPeerCount] = useState(0)
    // Stores latest state for initial sync when guest joins
    const latestStateRef = useRef(null)

    const generateCode = useCallback(() => {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
        let code = ''
        for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)]
        return code
    }, [])

    const startHost = useCallback(() => {
        const code = generateCode()
        setRoomCode(code)
        setRole('host')
        roleRef.current = 'host'
        const ch = new BroadcastChannel(`perdemo-collab-${code}`)
        channelRef.current = ch
        ch.onmessage = (e) => {
            if (e.data.type === 'join') {
                setPeerCount(p => p + 1)
                // Send current state to newly joined guest
                if (latestStateRef.current) {
                    ch.postMessage({ type: 'sync', state: latestStateRef.current })
                }
            }
            if (e.data.type === 'leave') setPeerCount(p => Math.max(0, p - 1))
        }
        setConnected(true)
    }, [generateCode])

    const joinRoom = useCallback((code) => {
        const upperCode = code.toUpperCase().trim()
        setRoomCode(upperCode)
        setRole('guest')
        roleRef.current = 'guest'
        const ch = new BroadcastChannel(`perdemo-collab-${upperCode}`)
        channelRef.current = ch
        ch.onmessage = (e) => {
            if (e.data.type === 'sync' && onReceive) onReceive(e.data.state)
        }
        // Notify host that we joined (slight delay to ensure host listener is ready)
        setTimeout(() => ch.postMessage({ type: 'join' }), 100)
        setConnected(true)
    }, [onReceive])

    const broadcast = useCallback((state) => {
        latestStateRef.current = state
        if (roleRef.current === 'host' && channelRef.current) {
            try {
                channelRef.current.postMessage({ type: 'sync', state })
            } catch { /* channel may be closed */ }
        }
    }, [])

    const disconnect = useCallback(() => {
        if (channelRef.current) {
            if (roleRef.current === 'guest') {
                try { channelRef.current.postMessage({ type: 'leave' }) } catch { }
            }
            channelRef.current.close()
            channelRef.current = null
        }
        setRole(null)
        roleRef.current = null
        setRoomCode('')
        setConnected(false)
        setPeerCount(0)
    }, [])

    // Cleanup on unmount ONLY (empty deps — no role dependency!)
    useEffect(() => () => {
        if (channelRef.current) {
            if (roleRef.current === 'guest') {
                try { channelRef.current.postMessage({ type: 'leave' }) } catch { }
            }
            channelRef.current.close()
            channelRef.current = null
        }
    }, [])

    return { role, roomCode, connected, peerCount, startHost, joinRoom, broadcast, disconnect }
}

/* ═══════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════ */
export default function DemoViewer() {
    const location = useLocation()
    const [selectedFabric, setSelectedFabric] = useState(fabrics[0])
    const [openAmount, setOpenAmount] = useState(0.3)
    const [curtainStyle, setCurtainStyle] = useState('rod-pocket')
    const [windEnabled, setWindEnabled] = useState(false)
    const [backdrop, setBackdrop] = useState('city')
    const canvasRef = useRef(null)
    const [collabModalOpen, setCollabModalOpen] = useState(false)
    const [joinInput, setJoinInput] = useState('')

    // Collaborative Showroom
    const collab = useCollabSync({
        onReceive: useCallback((state) => {
            if (state.fabricId) {
                const f = fabrics.find(fb => fb.id === state.fabricId)
                if (f) setSelectedFabric(f)
            }
            if (state.openAmount != null) setOpenAmount(state.openAmount)
            if (state.backdrop) setBackdrop(state.backdrop)
            if (state.windEnabled != null) setWindEnabled(state.windEnabled)
        }, []),
    })

    // Broadcast state changes when host (broadcast is stable — no dep issues)
    useEffect(() => {
        collab.broadcast({
            fabricId: selectedFabric.id,
            openAmount,
            backdrop,
            windEnabled,
        })
    }, [selectedFabric.id, openAmount, backdrop, windEnabled, collab.broadcast])

    // Read combo from Moodboard URL params
    useEffect(() => {
        const params = new URLSearchParams(location.search)
        const mainFabric = params.get('main')
        if (mainFabric) {
            const found = fabrics.find(f => f.name === mainFabric)
            if (found) setSelectedFabric(found)
        }
    }, [location.search])

    // AI Render state
    const [aiRender, setAiRender] = useState({
        visible: false, progress: 0, resultUrl: null,
    })

    const handleAIRender = useCallback(() => {
        setAiRender({ visible: true, progress: 0, resultUrl: null })
        let p = 0
        const interval = setInterval(() => {
            p += Math.random() * 15 + 5
            if (p >= 100) {
                p = 100
                clearInterval(interval)
                setTimeout(() => {
                    const canvasEl = canvasRef.current?.querySelector('canvas')
                    if (canvasEl) {
                        try {
                            const url = canvasEl.toDataURL('image/png')
                            setAiRender(s => ({ ...s, progress: 100, resultUrl: url }))
                        } catch {
                            setAiRender(s => ({ ...s, progress: 100, resultUrl: null }))
                        }
                    }
                }, 400)
            } else {
                setAiRender(s => ({ ...s, progress: Math.min(Math.round(p), 95) }))
            }
        }, 300)
    }, [])

    const handleDownloadRender = useCallback(() => {
        if (!aiRender.resultUrl) return
        const a = document.createElement('a')
        a.href = aiRender.resultUrl
        a.download = `perdemo-render-${Date.now()}.png`
        a.click()
    }, [aiRender.resultUrl])

    // AI Atmosphere Recipe — debounced
    const [atmosphere, setAtmosphere] = useState(null)
    const [atmosphereLoading, setAtmosphereLoading] = useState(false)
    const atmosphereTimer = useRef(null)

    useEffect(() => {
        // Debounce: 2 saniye bekleme — her değişiklikte anında çağırma
        clearTimeout(atmosphereTimer.current)
        setAtmosphereLoading(true)
        atmosphereTimer.current = setTimeout(async () => {
            const openPercent = Math.round(openAmount * 100)
            const result = await getAtmosphereRecipe(selectedFabric.name, backdrop, openPercent)
            setAtmosphere(result)
            setAtmosphereLoading(false)
        }, 2000)
        return () => clearTimeout(atmosphereTimer.current)
    }, [selectedFabric.name, backdrop, openAmount])

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1 className="page-title">360° Perde Demo</h1>
                    <p className="page-subtitle">Kumaş ve renk seçerek perdenizi canlı deneyimleyin</p>
                </div>
                <div className="demo-actions">
                    <button className="btn btn-secondary" onClick={() => {
                        const canvasEl = canvasRef.current?.querySelector('canvas')
                        if (canvasEl) {
                            const a = document.createElement('a')
                            a.href = canvasEl.toDataURL('image/png')
                            a.download = `perdemo-${Date.now()}.png`
                            a.click()
                        }
                    }}>
                        📸 Ekran Görüntüsü
                    </button>
                    <button
                        className="btn btn-primary"
                        onClick={handleAIRender}
                    >
                        ✨ AI Render
                    </button>
                    <button
                        className="btn btn-secondary"
                        onClick={() => setCollabModalOpen(true)}
                        style={{
                            background: collab.connected ? 'rgba(231,76,60,0.15)' : undefined,
                            borderColor: collab.connected ? 'rgba(231,76,60,0.4)' : undefined,
                            color: collab.connected ? '#e74c3c' : undefined,
                        }}
                    >
                        {collab.connected ? '🔴 Canlı' : '🔗 Birlikte İzle'}
                    </button>
                </div>
            </div>

            {/* Collab Modal */}
            {collabModalOpen && (
                <div className="modal-overlay" onClick={() => setCollabModalOpen(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <h3 className="modal-title">🔗 Birlikte İzle</h3>
                        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '20px' }}>
                            Müşterinizle aynı anda 3D sahneyi izleyin
                        </p>

                        {!collab.connected ? (
                            <>
                                {/* Host */}
                                <div style={{
                                    padding: '16px', borderRadius: 'var(--radius-md)',
                                    background: 'var(--bg-tertiary)', marginBottom: '12px',
                                }}>
                                    <div style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '8px' }}>📡 Oturum Başlat (Perdeci)</div>
                                    <p style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', marginBottom: '12px' }}>
                                        Kod oluşturun ve müşterinize paylaşın
                                    </p>
                                    <button className="btn btn-primary" onClick={() => { collab.startHost(); }}
                                        style={{ width: '100%' }}>
                                        📡 Oturum Oluştur
                                    </button>
                                </div>

                                {/* Guest */}
                                <div style={{
                                    padding: '16px', borderRadius: 'var(--radius-md)',
                                    background: 'var(--bg-tertiary)',
                                }}>
                                    <div style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '8px' }}>👁️ Oturuma Katıl (Müşteri)</div>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <input className="input" placeholder="Kodu girin (örn: A3X9K2)"
                                            value={joinInput} onChange={e => setJoinInput(e.target.value)}
                                            style={{ flex: 1, letterSpacing: '3px', fontWeight: 700, textTransform: 'uppercase' }} />
                                        <button className="btn btn-secondary" onClick={() => { if (joinInput.length >= 4) collab.joinRoom(joinInput) }}
                                            disabled={joinInput.length < 4}>
                                            Katıl
                                        </button>
                                    </div>
                                </div>
                            </>
                        ) : (
                            /* Connected state */
                            <div style={{ textAlign: 'center' }}>
                                <div style={{
                                    padding: '24px', borderRadius: 'var(--radius-md)',
                                    background: 'rgba(46, 204, 113, 0.08)', border: '1px solid rgba(46, 204, 113, 0.25)',
                                    marginBottom: '20px',
                                }}>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', marginBottom: '6px' }}>
                                        {collab.role === 'host' ? '📡 Oturum Kodu' : '👁️ Bağlı Oturum'}
                                    </div>
                                    <div style={{
                                        fontSize: '2.5rem', fontWeight: 800, letterSpacing: '8px',
                                        color: '#2ecc71', fontFamily: "'Courier New', monospace",
                                    }}>
                                        {collab.roomCode}
                                    </div>
                                    {collab.role === 'host' && (
                                        <button className="btn btn-secondary" style={{ marginTop: '12px', fontSize: '0.8rem' }}
                                            onClick={() => navigator.clipboard.writeText(collab.roomCode)}>
                                            📋 Kodu Kopyala
                                        </button>
                                    )}
                                    {collab.role === 'host' && (
                                        <div style={{ marginTop: '12px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                            {collab.peerCount > 0 ? `👥 ${collab.peerCount} kişi izliyor` : '⏳ Bağlantı bekleniyor...'}
                                        </div>
                                    )}
                                </div>
                                <button className="btn btn-secondary" onClick={() => { collab.disconnect(); setCollabModalOpen(false) }}
                                    style={{ color: '#e74c3c', borderColor: 'rgba(231,76,60,0.3)', width: '100%' }}>
                                    ✕ Bağlantıyı Kes
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            <div className="demo-container">
                {/* 3D Canvas */}
                <div className="demo-canvas-area" ref={canvasRef}>
                    <Suspense fallback={
                        <div style={{
                            width: '100%', height: '100%', display: 'flex',
                            alignItems: 'center', justifyContent: 'center',
                            background: 'var(--bg-secondary)', color: 'var(--text-secondary)',
                        }}>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '2rem', marginBottom: '12px', animation: 'spin 2s linear infinite' }}>⚙️</div>
                                <div style={{ fontSize: '0.9rem' }}>3D Sahne yükleniyor...</div>
                            </div>
                        </div>
                    }>
                        <Canvas
                            camera={{ position: [0, 0.5, 5.5], fov: 50 }}
                            style={{ width: '100%', height: '100%' }}
                            gl={{
                                antialias: false,
                                alpha: false,
                                preserveDrawingBuffer: true,
                                powerPreference: 'high-performance',
                                stencil: false,
                                depth: true,
                            }}
                            dpr={1}
                        >
                            <color attach="background" args={['#0f1020']} />
                            <fog attach="fog" args={['#0f1020', 8, 16]} />
                            <SceneContent
                                fabric={selectedFabric}
                                openAmount={openAmount}
                                curtainStyle={curtainStyle}
                                backdrop={backdrop}
                                windEnabled={windEnabled}
                            />
                        </Canvas>
                    </Suspense>

                    {/* AI Render overlay */}
                    <AIRenderOverlay
                        visible={aiRender.visible}
                        progress={aiRender.progress}
                        resultUrl={aiRender.resultUrl}
                        onClose={() => setAiRender({ visible: false, progress: 0, resultUrl: null })}
                        onDownload={handleDownloadRender}
                    />

                    {/* Hints bar */}
                    <div style={{
                        position: 'absolute', bottom: '24px', left: '50%',
                        transform: 'translateX(-50%)', padding: '8px 16px',
                        background: 'rgba(0,0,0,0.6)', borderRadius: 'var(--radius-full)',
                        fontSize: '0.8rem', color: '#fff', backdropFilter: 'blur(8px)',
                        display: 'flex', alignItems: 'center', gap: '8px',
                        pointerEvents: 'none',
                        border: '1px solid rgba(255,255,255,0.1)'
                    }}>
                        🖱️ Döndür · 🔍 Yakınlaştır · {selectedFabric.transmission > 0.3 ? '☀️ Arkadan ışık geçişi aktif' : ''}
                    </div>

                    {/* Collab Live Badge */}
                    {collab.connected && (
                        <div style={{
                            position: 'absolute', top: '20px', left: '20px', zIndex: 10,
                        }}>
                            <div className="badge badge-danger" style={{ padding: '8px 12px', fontSize: '0.8rem' }}>
                                {collab.role === 'host'
                                    ? `🔴 CANLI — ${collab.peerCount > 0 ? `${collab.peerCount} kişi izliyor` : 'Bekleniyor...'}`
                                    : '🔴 CANLI — Perdeci kontrol ediyor'
                                }
                            </div>
                        </div>
                    )}
                </div>

                {/* ─── Control Panel ─── */}
                <div className="demo-controls-panel">
                    {/* Fabric Selection */}
                    <div className="card">
                        <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '4px' }}>Kumaş Seçimi</h3>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>Renk, doku ve ışık geçirgenliğini değiştirin</p>
                        <div className="swatch-grid">
                            {fabrics.map(f => (
                                <button
                                    key={f.id}
                                    className={`swatch-btn ${selectedFabric.id === f.id ? 'active' : ''}`}
                                    style={{ backgroundColor: f.color }}
                                    onClick={() => setSelectedFabric(f)}
                                    aria-label={`Kumaş: ${f.name}`}
                                    title={f.name}
                                />
                            ))}
                        </div>
                        <div style={{
                            marginTop: '16px', padding: '12px',
                            background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)',
                            fontSize: '0.85rem',
                        }}>
                            <span style={{ fontWeight: 600, display: 'block', marginBottom: '8px' }}>{selectedFabric.name}</span>
                            <div style={{
                                display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px',
                                color: 'var(--text-secondary)', fontSize: '0.75rem',
                            }}>
                                <span>Pürüzlülük: {(selectedFabric.roughness * 100).toFixed(0)}%</span>
                                <span>Sheen: {(selectedFabric.sheen * 100).toFixed(0)}%</span>
                                <span>Işık Geçişi: {(selectedFabric.transmission * 100).toFixed(0)}%</span>
                                <span>Ağırlık: {selectedFabric.weight < 0.3 ? 'Hafif' : selectedFabric.weight < 0.7 ? 'Orta' : 'Ağır'}</span>
                            </div>
                        </div>
                    </div>

                    {/* Curtain Style */}
                    <div className="card">
                        <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '4px' }}>Perde Stili</h3>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>Dikim modelini belirleyin</p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {curtainStyles.map(s => (
                                <button
                                    key={s.id}
                                    className={`btn btn-secondary ${curtainStyle === s.id ? 'active' : ''}`}
                                    style={{
                                        justifyContent: 'flex-start',
                                        backgroundColor: curtainStyle === s.id ? 'var(--bg-elevated)' : undefined,
                                        borderColor: curtainStyle === s.id ? 'var(--accent-blue)' : undefined
                                    }}
                                    onClick={() => setCurtainStyle(s.id)}
                                >
                                    <span style={{ fontSize: '1.2rem', opacity: 0.8 }}>{s.icon}</span>
                                    {s.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Open/Close */}
                    <div className="card">
                        <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '4px' }}>Açıklık</h3>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>Perdeyi aç/kapat</p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Kapalı</span>
                            <input
                                type="range" min="0" max="1" step="0.05"
                                value={openAmount}
                                onChange={e => setOpenAmount(parseFloat(e.target.value))}
                                className="demo-range"
                                aria-label="Perde açıklık miktarı"
                            />
                            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Açık</span>
                        </div>
                        <div style={{ textAlign: 'center', marginTop: '8px', fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                            {(openAmount * 100).toFixed(0)}%
                        </div>
                    </div>

                    {/* Environment */}
                    <div className="card">
                        <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '4px' }}>Ortam</h3>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>Manzara ve rüzgar efektleri</p>

                        {/* Backdrop selector */}
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', marginBottom: '10px', fontWeight: 600 }}>
                            Pencere Manzarası
                        </div>
                        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                            {[
                                { id: 'city', label: '🏙️ Şehir', desc: 'Lüks gökdelen manzarası' },
                                { id: 'garden', label: '🌳 Bahçe', desc: 'Yeşil bahçe manzarası' },
                                { id: 'none', label: '☁️ Gökyüzü', desc: 'Sade gökyüzü' },
                            ].map(b => (
                                <button
                                    key={b.id}
                                    className={`btn btn-sm ${backdrop === b.id ? 'btn-primary' : 'btn-secondary'}`}
                                    style={{ flex: 1, padding: '8px' }}
                                    onClick={() => setBackdrop(b.id)}
                                    title={b.desc}
                                >
                                    {b.label}
                                </button>
                            ))}
                        </div>

                        {/* Wind toggle */}
                        <button
                            className={`btn ${windEnabled ? 'btn-primary' : 'btn-secondary'}`}
                            onClick={() => setWindEnabled(w => !w)}
                            style={{ width: '100%', justifyContent: 'space-between' }}
                        >
                            <span>🌬️ Esinti Modu</span>
                            <div style={{
                                width: '36px', height: '20px', borderRadius: '10px',
                                background: 'rgba(0,0,0,0.2)',
                                position: 'relative', transition: 'background 0.2s',
                                border: '1px solid rgba(255,255,255,0.1)',
                            }}>
                                <div style={{
                                    position: 'absolute', top: '2px',
                                    left: windEnabled ? '18px' : '2px',
                                    width: '14px', height: '14px', borderRadius: '50%',
                                    background: '#fff', transition: 'left 0.2s',
                                    boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                                }} />
                            </div>
                        </button>
                    </div>

                    {/* AI Atmosphere Recipe */}
                    <div className="card" style={{
                        background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(139, 92, 246, 0.05) 100%)',
                        border: '1px solid rgba(59, 130, 246, 0.2)'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                            <span style={{ fontSize: '1.2rem' }}>🌅</span>
                            <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>AI Atmosfer Reçetesi</span>
                        </div>
                        <div style={{
                            fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6,
                            minHeight: '60px',
                        }}>
                            {atmosphereLoading ? (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-tertiary)' }}>
                                    <span>✨</span>
                                    Sahne analiz ediliyor...
                                </div>
                            ) : atmosphere ? (
                                <div style={{ animation: 'fadeIn 0.5s ease' }}>{atmosphere}</div>
                            ) : (
                                <div style={{ color: 'var(--text-tertiary)' }}>
                                    💡 Kumaş, manzara veya açıklığı değiştirin — AI ortam yorumu yapacak.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

