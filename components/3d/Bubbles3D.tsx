"use client"

import React, { useRef, useMemo, useEffect } from "react"
import { Canvas, useFrame } from "@react-three/fiber"
import * as THREE from "three"

const BUBBLE_COUNT = 100
const TEMP_OBJECT = new THREE.Object3D()
const TEMP_COLOR = new THREE.Color()

function InstancedBubbles({ count = BUBBLE_COUNT }) {
    const meshRef = useRef<THREE.InstancedMesh>(null)

    // Initialize random data
    const particles = useMemo(() => {
        return Array.from({ length: count }, () => ({
            x: (Math.random() - 0.5) * 20, // Spread X
            y: Math.random() * 20 - 10,    // Spread Y
            z: (Math.random() - 0.5) * 10 - 5, // Spread Z
            scale: 0.2 + Math.random() * 0.5,
            speed: 0.01 + Math.random() * 0.03,
            offset: Math.random() * Math.PI * 2
        }))
    }, [count])

    useFrame((state) => {
        if (!meshRef.current) return

        const time = state.clock.elapsedTime

        particles.forEach((particle, i) => {
            // Float upward logic
            let y = particle.y + time * particle.speed

            // Reset if too high
            if (y > 10) {
                y = -10
            } else {
                // Seamless loop simulation using modulus would be better but simple reset works for background
                y = ((y + 10) % 20) - 10
            }

            // Wiggle
            const x = particle.x + Math.sin(time * 0.5 + particle.offset) * 0.5

            TEMP_OBJECT.position.set(x, y, particle.z)
            TEMP_OBJECT.scale.setScalar(particle.scale)
            TEMP_OBJECT.rotation.x = Math.sin(time + particle.offset)
            TEMP_OBJECT.rotation.y = Math.cos(time + particle.offset)

            TEMP_OBJECT.updateMatrix()
            meshRef.current!.setMatrixAt(i, TEMP_OBJECT.matrix)
        })

        meshRef.current.instanceMatrix.needsUpdate = true
    })

    return (
        <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
            <sphereGeometry args={[1, 32, 32]} />
            <meshPhysicalMaterial
                transparent
                opacity={0.4}
                transmission={0.6} // Glass-like
                roughness={0}
                thickness={1}
                color="#ffffff"
                emissive="#4ECDC4"
                emissiveIntensity={0.2}
            />
        </instancedMesh>
    )
}

export default function Bubbles3D() {
    return (
        <div className="absolute inset-0 pointer-events-none">
            <Canvas camera={{ position: [0, 0, 15], fov: 60 }} gl={{ alpha: true }}>
                <ambientLight intensity={1} />
                <pointLight position={[10, 10, 10]} intensity={1.5} color="#FF6B6B" />
                <pointLight position={[-10, -5, -10]} intensity={1} color="#4ECDC4" />
                <InstancedBubbles />
            </Canvas>
        </div>
    )
}
