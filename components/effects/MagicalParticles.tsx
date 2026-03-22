"use client"

import React, { useRef, useMemo, useEffect, useState } from "react"
import { Canvas, useFrame } from "@react-three/fiber"
import * as THREE from "three"

// Particle configurations
const PARTICLE_COUNT = 150
const COLORS = ["#FF6B6B", "#4ECDC4", "#FFE66D", "#FF8080", "#5EEAD4", "#FFFFFF"]

function Particles() {
    const meshRef = useRef<THREE.Points>(null)
    const mouseRef = useRef({ x: 0, y: 0 })

    const { positions, colors, geometry } = useMemo(() => {
        const positions = new Float32Array(PARTICLE_COUNT * 3)
        const colors = new Float32Array(PARTICLE_COUNT * 3)

        for (let i = 0; i < PARTICLE_COUNT; i++) {
            // Random position in a wider area
            positions[i * 3] = (Math.random() - 0.5) * 20
            positions[i * 3 + 1] = (Math.random() - 0.5) * 15
            positions[i * 3 + 2] = (Math.random() - 0.5) * 10

            // Random color from palette
            const color = new THREE.Color(COLORS[Math.floor(Math.random() * COLORS.length)])
            colors[i * 3] = color.r
            colors[i * 3 + 1] = color.g
            colors[i * 3 + 2] = color.b
        }

        // Create geometry with attributes
        const geometry = new THREE.BufferGeometry()
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))

        return { positions, colors, geometry }
    }, [])

    // Track mouse movement
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            mouseRef.current.x = (e.clientX / window.innerWidth) * 2 - 1
            mouseRef.current.y = -(e.clientY / window.innerHeight) * 2 + 1
        }
        window.addEventListener("mousemove", handleMouseMove)
        return () => window.removeEventListener("mousemove", handleMouseMove)
    }, [])

    useFrame((state) => {
        if (!meshRef.current) return

        const positionAttr = meshRef.current.geometry.attributes.position
        const positions = positionAttr.array as Float32Array
        const time = state.clock.elapsedTime

        for (let i = 0; i < PARTICLE_COUNT; i++) {
            // Add gentle floating motion
            positions[i * 3] += Math.sin(time * 0.5 + i * 0.1) * 0.003
            positions[i * 3 + 1] += 0.008 // Drift upward

            // Slight attraction to mouse
            const dx = mouseRef.current.x * 5 - positions[i * 3]
            const dy = mouseRef.current.y * 5 - positions[i * 3 + 1]
            positions[i * 3] += dx * 0.0003
            positions[i * 3 + 1] += dy * 0.0003

            // Reset particles that go too far
            if (positions[i * 3 + 1] > 10) {
                positions[i * 3 + 1] = -10
                positions[i * 3] = (Math.random() - 0.5) * 20
            }
        }

        positionAttr.needsUpdate = true
    })

    return (
        <points ref={meshRef} geometry={geometry}>
            <pointsMaterial
                size={0.12}
                vertexColors
                transparent
                opacity={0.7}
                sizeAttenuation
                blending={THREE.AdditiveBlending}
                depthWrite={false}
            />
        </points>
    )
}

// Sparkle stars component
function SparkleStars() {
    const count = 50
    const meshRef = useRef<THREE.Points>(null)

    const geometry = useMemo(() => {
        const positions = new Float32Array(count * 3)

        for (let i = 0; i < count; i++) {
            positions[i * 3] = (Math.random() - 0.5) * 25
            positions[i * 3 + 1] = (Math.random() - 0.5) * 18
            positions[i * 3 + 2] = -5 + Math.random() * 5
        }

        const geom = new THREE.BufferGeometry()
        geom.setAttribute('position', new THREE.BufferAttribute(positions, 3))
        return geom
    }, [])

    useFrame((state) => {
        if (!meshRef.current) return
        const time = state.clock.elapsedTime

        // Animate opacity through material
        const material = meshRef.current.material as THREE.PointsMaterial
        material.opacity = 0.5 + Math.sin(time * 2) * 0.3
    })

    return (
        <points ref={meshRef} geometry={geometry}>
            <pointsMaterial
                size={0.2}
                color="#FFE66D"
                transparent
                opacity={0.8}
                sizeAttenuation
                blending={THREE.AdditiveBlending}
                depthWrite={false}
            />
        </points>
    )
}

// Main component
interface MagicalParticlesProps {
    className?: string
    intensity?: "low" | "medium" | "high"
}

export function MagicalParticles({
    className = "",
}: MagicalParticlesProps) {
    const [isClient, setIsClient] = useState(false)

    useEffect(() => {
        setIsClient(true)
    }, [])

    if (!isClient) return null

    return (
        <div className={`absolute inset-0 pointer-events-none ${className}`}>
            <Canvas
                camera={{ position: [0, 0, 10], fov: 60 }}
                dpr={[1, 1.5]}
                gl={{ antialias: true, alpha: true }}
                style={{ background: "transparent" }}
            >
                <Particles />
                <SparkleStars />
            </Canvas>
        </div>
    )
}

export default MagicalParticles
