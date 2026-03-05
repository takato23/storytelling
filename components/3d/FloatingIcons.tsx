"use client"

import React, { useRef, useState } from "react"
import { Canvas, useFrame } from "@react-three/fiber"
import { Float, Environment } from "@react-three/drei"

// 3D Implementations of the icons
function Camera3D(props: any) {
    return (
        <group {...props}>
            {/* Body */}
            <mesh position={[0, 0, 0]}>
                <boxGeometry args={[1.5, 1, 0.4]} />
                <meshStandardMaterial color="#FF6B6B" />
            </mesh>
            {/* Lens */}
            <mesh position={[0, 0, 0.3]} rotation={[1.57, 0, 0]}>
                <cylinderGeometry args={[0.35, 0.35, 0.2, 32]} />
                <meshStandardMaterial color="#333" />
            </mesh>
            {/* Flash */}
            <mesh position={[0.5, 0.6, 0]}>
                <boxGeometry args={[0.3, 0.2, 0.3]} />
                <meshStandardMaterial color="#4ECDC4" />
            </mesh>
        </group>
    )
}

function Palette3D(props: any) {
    return (
        <group {...props}>
            {/* Palette board */}
            <mesh rotation={[0.2, 0, 0]}>
                <cylinderGeometry args={[1, 1, 0.1, 32]} />
                <meshStandardMaterial color="#FFD93D" />
            </mesh>
            {/* Paints */}
            <mesh position={[0.4, 0.06, 0.4]} scale={0.2}>
                <sphereGeometry />
                <meshStandardMaterial color="#FF6B6B" />
            </mesh>
            <mesh position={[-0.4, 0.06, 0.4]} scale={0.2}>
                <sphereGeometry />
                <meshStandardMaterial color="#4ECDC4" />
            </mesh>
            <mesh position={[0, 0.06, 0.6]} scale={0.2}>
                <sphereGeometry />
                <meshStandardMaterial color="#6C5CE7" />
            </mesh>
            {/* Brush handle */}
            <mesh position={[0.8, 0.3, -0.2]} rotation={[0, 0, -0.5]}>
                <cylinderGeometry args={[0.05, 0.05, 1.5]} />
                <meshStandardMaterial color="#8B4513" />
            </mesh>
        </group>
    )
}

function Wand3D(props: any) {
    return (
        <group {...props} rotation={[0, 0, 0.8]}>
            {/* Handle */}
            <mesh position={[0, -0.5, 0]}>
                <cylinderGeometry args={[0.08, 0.1, 1.5, 16]} />
                <meshStandardMaterial color="#333" />
            </mesh>
            {/* Tip */}
            <mesh position={[0, 0.25, 0]}>
                <cylinderGeometry args={[0.1, 0.08, 0.5, 16]} />
                <meshStandardMaterial color="#fff" />
            </mesh>
            {/* Star */}
            <mesh position={[0, 0.6, 0]}>
                <icosahedronGeometry args={[0.4, 0]} />
                <meshStandardMaterial color="#FFD93D" emissive="#FFD93D" emissiveIntensity={0.5} />
            </mesh>
        </group>
    )
}

function Gift3D(props: any) {
    return (
        <group {...props}>
            {/* Box */}
            <mesh>
                <boxGeometry args={[1.2, 1.2, 1.2]} />
                <meshStandardMaterial color="#FF6B6B" />
            </mesh>
            {/* Ribbon Vertical */}
            <mesh scale={[1.22, 1.22, 0.2]}>
                <boxGeometry args={[1, 1, 1]} />
                <meshStandardMaterial color="#fff" />
            </mesh>
            {/* Ribbon Horizontal */}
            <mesh scale={[0.2, 1.22, 1.22]}>
                <boxGeometry args={[1, 1, 1]} />
                <meshStandardMaterial color="#fff" />
            </mesh>
        </group>
    )
}

interface FloatingIconProps {
    type: "camera" | "palette" | "wand" | "gift"
}

export default function FloatingIcon({ type }: FloatingIconProps) {
    const IconComponent = {
        camera: Camera3D,
        palette: Palette3D,
        wand: Wand3D,
        gift: Gift3D
    }[type]

    return (
        <div className="w-full h-full">
            <Canvas camera={{ position: [0, 0, 4], fov: 45 }} gl={{ alpha: true }}>
                <ambientLight intensity={1} />
                <directionalLight position={[5, 10, 5]} intensity={1.5} />
                <Float speed={3} rotationIntensity={1} floatIntensity={1}>
                    <IconComponent />
                </Float>
            </Canvas>
        </div>
    )
}
