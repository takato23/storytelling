"use client"

import React, { useRef, useMemo } from "react"
import { Canvas, useFrame } from "@react-three/fiber"
import { Float, Environment, MeshTransmissionMaterial, Stars } from "@react-three/drei"
import * as THREE from "three"

// Colors per step (approximate)
const STEP_COLORS = [
    "#93C5FD", // Step 0 (Start)
    "#67E8F9", // Step 1 (Photo)
    "#86EFAC", // Step 2 (Character)
    "#A5B4FC", // Step 3 (Family)
    "#C4B5FD", // Step 4 (Story)
    "#F9A8D4", // Step 5 (Style)
    "#7DD3FC", // Step 6 (Gift)
    "#FCD34D", // Step 7 (Preview)
]

const ORB_COLORS = ["#67E8F9", "#A5B4FC", "#C4B5FD", "#F9A8D4"] as const

const pseudoNoise = (seed: number) => {
    const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453
    return x - Math.floor(x)
}

function MagicalOrbs({ step }: { step: number }) {
    const mainOrbRef = useRef<THREE.Mesh>(null)
    const targetColor = new THREE.Color(STEP_COLORS[step] || STEP_COLORS[0])
    const smallOrbs = useMemo(() => {
        return Array.from({ length: 5 }, (_, i) => {
            const speed = 1.4 + pseudoNoise(i + 1) * 1.1
            const position: [number, number, number] = [
                (pseudoNoise(i + 11) - 0.5) * 15,
                (pseudoNoise(i + 23) - 0.5) * 10,
                -8 + pseudoNoise(i + 37) * 4
            ]
            const scale = 0.5 + pseudoNoise(i + 47) * 0.8
            const color = ORB_COLORS[Math.floor(pseudoNoise(i + 59) * ORB_COLORS.length)]
            return { speed, position, scale, color }
        })
    }, [])

    useFrame((state, delta) => {
        if (mainOrbRef.current) {
            const material = mainOrbRef.current.material as THREE.MeshPhysicalMaterial
            material.color.lerp(targetColor, delta * 2)
        }
    })

    return (
        <group>
            {/* Main large crystal orb */}
            <Float speed={2} rotationIntensity={0.5} floatIntensity={1}>
                <mesh ref={mainOrbRef} position={[4, 1, -5]} scale={2.5}>
                    <sphereGeometry args={[1, 64, 64]} />
                    <MeshTransmissionMaterial
                        backside
                        thickness={2}
                        roughness={0}
                        transmission={1}
                        ior={1.5}
                        chromaticAberration={0.4}
                        anisotropy={0.5}
                        distortion={0.5}
                        distortionScale={0.5}
                        temporalDistortion={0.2}
                        background={new THREE.Color("#08182d")}
                    />
                </mesh>
            </Float>

            {/* Smaller floating orbs */}
            {smallOrbs.map((orb, i) => (
                <Float key={i} speed={orb.speed} rotationIntensity={1} floatIntensity={2} position={orb.position}>
                    <mesh scale={orb.scale}>
                        <sphereGeometry args={[1, 32, 32]} />
                        <MeshTransmissionMaterial
                            thickness={1.5}
                            roughness={0.1}
                            transmission={0.9}
                            ior={1.2}
                            chromaticAberration={0.2}
                            color={orb.color}
                        />
                    </mesh>
                </Float>
            ))}
        </group>
    )
}

function StarField() {
    return (
        <Stars
            radius={100}
            depth={50}
            count={3200}
            factor={3}
            saturation={0}
            fade
            speed={1}
        />
    )
}

function AmbientParticipes() {
    const count = 200
    const mesh = useRef<THREE.Points>(null)

    const [positions, colors] = useMemo(() => {
        const positions = new Float32Array(count * 3)
        const colors = new Float32Array(count * 3)
        const color = new THREE.Color()

        for (let i = 0; i < count; i++) {
            const nx = pseudoNoise(i * 3 + 1)
            const ny = pseudoNoise(i * 3 + 2)
            const nz = pseudoNoise(i * 3 + 3)
            const nh = pseudoNoise(i * 3 + 4)
            positions[i * 3] = (nx - 0.5) * 20
            positions[i * 3 + 1] = (ny - 0.5) * 20
            positions[i * 3 + 2] = (nz - 0.5) * 10 - 5

            color.setHSL(0.5 + nh * 0.2, 0.8, 0.8) // Blue/Purple/Pink range
            colors[i * 3] = color.r
            colors[i * 3 + 1] = color.g
            colors[i * 3 + 2] = color.b
        }
        return [positions, colors]
    }, [])

    useFrame((state) => {
        if (!mesh.current) return
        const time = state.clock.getElapsedTime()

        // Gentle rotation
        mesh.current.rotation.y = time * 0.05
        mesh.current.rotation.x = Math.sin(time * 0.1) * 0.05
    })

    return (
        <points ref={mesh}>
            <bufferGeometry>
                <bufferAttribute
                    attach="attributes-position"
                    count={count}
                    args={[positions, 3]}
                />
                <bufferAttribute
                    attach="attributes-color"
                    count={count}
                    args={[colors, 3]}
                />
            </bufferGeometry>
            <pointsMaterial
                size={0.1}
                vertexColors
                transparent
                opacity={0.6}
                sizeAttenuation
                blending={THREE.AdditiveBlending}
                depthWrite={false}
            />
        </points>
    )
}

export function WizardBackground3D({ step = 0 }: { step?: number }) {
    return (
        <div className="fixed inset-0 w-full h-full -z-10 bg-gradient-to-b from-slate-950 via-indigo-950/95 to-slate-900 transition-colors duration-1000">
            <Canvas camera={{ position: [0, 0, 10], fov: 45 }}>
                <ambientLight intensity={0.45} />
                <pointLight position={[10, 10, 10]} intensity={0.85} color="#93c5fd" />
                <pointLight position={[-10, -10, -5]} intensity={0.45} color="#818cf8" />

                <MagicalOrbs step={step} />
                <AmbientParticipes />
                <StarField />

                <Environment preset="night" />
                {/* Fog to blend distant objects */}
                <fog attach="fog" args={['#0b1a30', 5, 25]} />
            </Canvas>
        </div>
    )
}
