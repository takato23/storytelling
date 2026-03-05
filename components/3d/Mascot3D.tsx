"use client"

import React, { useRef, useState } from "react"
import { Canvas, useFrame } from "@react-three/fiber"
import { Float, useCursor } from "@react-three/drei"
import * as THREE from "three"

function MagiOwl(props: any) {
    const group = useRef<THREE.Group>(null)
    const hatRef = useRef<THREE.Group>(null)
    const [hovered, setHover] = useState(false)
    const [active, setActive] = useState(false)

    useCursor(hovered)

    // Animate: Look at mouse + idle float + jump
    useFrame((state) => {
        if (!group.current) return

        // Soft look-at mouse tracking
        const targetX = (state.mouse.x * 0.8)
        const targetY = (state.mouse.y * 0.6)

        // Smooth rotation interpolation
        group.current.rotation.y = THREE.MathUtils.lerp(group.current.rotation.y, targetX, 0.08)
        group.current.rotation.x = THREE.MathUtils.lerp(group.current.rotation.x, -targetY, 0.08)

        // Subtle breathing effect on the body
        const breathingScale = 1 + Math.sin(state.clock.elapsedTime * 2) * 0.02
        group.current.scale.set(breathingScale, breathingScale, breathingScale)

        // Gentle hat wiggle
        if (hatRef.current) {
            hatRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 1.5) * 0.05 - 0.1
        }

        // Jump animation when active (clicked)
        if (active) {
            group.current.position.y = Math.sin(state.clock.elapsedTime * 20) * 0.5
        } else {
            group.current.position.y = THREE.MathUtils.lerp(group.current.position.y, 0, 0.1)
        }
    })

    const handleInteract = () => {
        setActive(true)
        setTimeout(() => setActive(false), 400)
        props.onClick?.()
    }

    // Material definitions for a premium, cute look
    const whitePlushMaterial = new THREE.MeshStandardMaterial({
        color: "#ffffff",
        roughness: 0.8,
        metalness: 0.1
    })
    const bellyMaterial = new THREE.MeshStandardMaterial({
        color: "#f3e8ff", // Soft lavender belly
        roughness: 0.9,
        metalness: 0.0
    })
    const beakMaterial = new THREE.MeshStandardMaterial({
        color: "#FBBF24", // Premium gold/amber
        roughness: 0.4,
        metalness: 0.2
    })
    const darkEyeMaterial = new THREE.MeshStandardMaterial({
        color: "#0f172a", // Very dark slate (almost black)
        roughness: 0.1, // Shiny!
        metalness: 0.8
    })
    const catchlightMaterial = new THREE.MeshBasicMaterial({ color: "#ffffff" })

    return (
        <group
            ref={group}
            {...props}
            onPointerOver={() => setHover(true)}
            onPointerOut={() => setHover(false)}
            onClick={handleInteract}
        >
            {/* Main Body - Squishy sphere */}
            <mesh position={[0, -0.2, 0]}>
                <sphereGeometry args={[1.2, 64, 64]} />
                <primitive object={whitePlushMaterial} attach="material" />
            </mesh>

            {/* Soft Lavender Belly */}
            <mesh position={[0, -0.3, 0.95]} scale={[0.8, 0.75, 0.3]}>
                <sphereGeometry args={[1, 64, 64]} />
                <primitive object={bellyMaterial} attach="material" />
            </mesh>

            {/* Cute Oversized Eyes */}
            <group position={[0, 0.2, 1.05]}>
                {/* Left Eye */}
                <group position={[-0.45, 0, 0]}>
                    <mesh>
                        <sphereGeometry args={[0.35, 32, 32]} />
                        <primitive object={whitePlushMaterial} attach="material" />
                    </mesh>
                    <mesh position={[0, 0, 0.2]}>
                        <sphereGeometry args={[0.22, 32, 32]} />
                        <primitive object={darkEyeMaterial} attach="material" />
                    </mesh>
                    {/* Catchlight (Glint) makes it look alive and cute */}
                    <mesh position={[-0.08, 0.08, 0.38]}>
                        <sphereGeometry args={[0.06, 16, 16]} />
                        <primitive object={catchlightMaterial} attach="material" />
                    </mesh>
                    <mesh position={[0.05, -0.05, 0.4]}>
                        <sphereGeometry args={[0.02, 16, 16]} />
                        <primitive object={catchlightMaterial} attach="material" />
                    </mesh>
                </group>

                {/* Right Eye */}
                <group position={[0.45, 0, 0]}>
                    <mesh>
                        <sphereGeometry args={[0.35, 32, 32]} />
                        <primitive object={whitePlushMaterial} attach="material" />
                    </mesh>
                    <mesh position={[0, 0, 0.2]}>
                        <sphereGeometry args={[0.22, 32, 32]} />
                        <primitive object={darkEyeMaterial} attach="material" />
                    </mesh>
                    <mesh position={[-0.08, 0.08, 0.38]}>
                        <sphereGeometry args={[0.06, 16, 16]} />
                        <primitive object={catchlightMaterial} attach="material" />
                    </mesh>
                    <mesh position={[0.05, -0.05, 0.4]}>
                        <sphereGeometry args={[0.02, 16, 16]} />
                        <primitive object={catchlightMaterial} attach="material" />
                    </mesh>
                </group>
            </group>

            {/* Tiny Cute Beak */}
            <mesh position={[0, 0.05, 1.2]} rotation={[0.2, 0, 0]}>
                <coneGeometry args={[0.08, 0.15, 32]} />
                <primitive object={beakMaterial} attach="material" />
            </mesh>
            {/* Lower beak lip */}
            <mesh position={[0, -0.02, 1.18]} rotation={[-0.1, 0, 0]}>
                <coneGeometry args={[0.06, 0.08, 32]} />
                <primitive object={beakMaterial} attach="material" />
            </mesh>

            {/* Owl Ear Tufts */}
            <mesh position={[-0.6, 0.8, 0.2]} rotation={[0, 0, 0.4]}>
                <coneGeometry args={[0.15, 0.4, 32]} />
                <primitive object={whitePlushMaterial} attach="material" />
            </mesh>
            <mesh position={[0.6, 0.8, 0.2]} rotation={[0, 0, -0.4]}>
                <coneGeometry args={[0.15, 0.4, 32]} />
                <primitive object={whitePlushMaterial} attach="material" />
            </mesh>

            {/* Cute Little Wings folded on the sides */}
            <mesh position={[-1.1, -0.2, 0.2]} rotation={[0, 0, 0.3]} scale={[0.2, 0.6, 0.4]}>
                <sphereGeometry args={[1, 32, 32]} />
                <primitive object={whitePlushMaterial} attach="material" />
            </mesh>
            <mesh position={[1.1, -0.2, 0.2]} rotation={[0, 0, -0.3]} scale={[0.2, 0.6, 0.4]}>
                <sphereGeometry args={[1, 32, 32]} />
                <primitive object={whitePlushMaterial} attach="material" />
            </mesh>

            {/* Magical Glowing Wizard Hat */}
            <group ref={hatRef} position={[-0.3, 0.7, -0.2]} rotation={[-0.1, 0, 0.3]}>
                <mesh position={[0, 0.6, 0]}>
                    {/* Bent floppy tip of the hat */}
                    <coneGeometry args={[0.5, 1.4, 32]} />
                    <meshStandardMaterial color="#8B5CF6" roughness={0.3} metalness={0.1} />
                </mesh>
                <mesh position={[0, 0, 0]}>
                    {/* Hat brim */}
                    <cylinderGeometry args={[0.9, 0.9, 0.1, 32]} />
                    <meshStandardMaterial color="#6D28D9" roughness={0.4} />
                </mesh>

                {/* Glowing Star on Hat */}
                <mesh position={[0, 0.4, 0.45]} rotation={[0.4, 0.2, 0]}>
                    <icosahedronGeometry args={[0.12, 0]} />
                    <meshStandardMaterial color="#FDE047" emissive="#FDE047" emissiveIntensity={0.6} />
                </mesh>

                {/* Secondary Star */}
                <mesh position={[0.3, 0.7, 0.3]} rotation={[0.1, -0.2, 0.5]}>
                    <icosahedronGeometry args={[0.06, 0]} />
                    <meshStandardMaterial color="#FDE047" emissive="#FDE047" emissiveIntensity={0.8} />
                </mesh>
            </group>
        </group>
    )
}

interface Mascot3DProps {
    onClick?: () => void
    scale?: number
}

export default function Mascot3D({ onClick, scale = 2 }: Mascot3DProps) {
    return (
        <div className="w-full h-full">
            <Canvas camera={{ position: [0, 0, 5], fov: 50 }}>
                {/* Premium Lighting Setup for a softer, commercial 3D render look */}
                <ambientLight intensity={1.2} />
                <directionalLight position={[5, 5, 5]} intensity={1.5} color="#ffffff" castShadow />
                <pointLight position={[-5, 5, 5]} intensity={1.2} color="#c084fc" /> {/* Purple rim light */}
                <pointLight position={[0, -5, 5]} intensity={0.5} color="#818cf8" /> {/* Blue bounce light */}

                <Float speed={2.5} rotationIntensity={0.3} floatIntensity={0.8} floatingRange={[-0.1, 0.1]}>
                    {/* Push the owl slightly down so the hat doesn't clip the top container */}
                    <group position={[0, -0.4, 0]}>
                        <MagiOwl onClick={onClick} scale={scale} />
                    </group>
                </Float>
            </Canvas>
        </div>
    )
}
