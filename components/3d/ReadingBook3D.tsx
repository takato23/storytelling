"use client"

import React, { useRef, useState, useEffect, useMemo } from "react"
import { Canvas, useFrame, useThree } from "@react-three/fiber"
import { Environment, Float, Html, ContactShadows, PresentationControls } from "@react-three/drei"
import * as THREE from "three"
import { motion, AnimatePresence } from "framer-motion"

// Book Themes configuration
const BOOK_THEMES: Record<string, any> = {
    pixar: {
        cover: "#4F46E5",
        spine: "#3730A3",
        particles: "#818CF8",
        bg: "#F5F7FF",
        glow: "#C7D2FE"
    },
    watercolor: {
        cover: "#EC4899",
        spine: "#BE185D",
        particles: "#F472B6",
        bg: "#FDF2F8",
        glow: "#FBCFE8"
    },
    vector: {
        cover: "#06B6D4",
        spine: "#0891B2",
        particles: "#22D3EE",
        bg: "#F0FDFA",
        glow: "#A5F3FC"
    },
    cartoon: {
        cover: "#F59E0B",
        spine: "#D97706",
        particles: "#FBBF24",
        bg: "#FFFBEB",
        glow: "#FDE68A"
    },
    default: {
        cover: "#8B5CF6",
        spine: "#6D28D9",
        particles: "#A78BFA",
        bg: "#F5F3FF",
        glow: "#DDD6FE"
    }
}

// Responsive Camera Controller
function ResponsiveCamera() {
    const { camera, size } = useThree()

    useEffect(() => {
        const aspect = size.width / size.height
        if (aspect < 1) { // Portrait/Mobile
            camera.position.z = 16
            // @ts-ignore
            camera.fov = 65
        } else { // Landscape/Desktop
            camera.position.z = 10
            // @ts-ignore
            camera.fov = 45
        }
        // @ts-ignore
        camera.updateProjectionMatrix()
    }, [size, camera])

    return null
}

// Page component with flip animation
function Page({
    position,
    rotation,
    content,
    illustration,
    onFlip
}: {
    position: [number, number, number]
    rotation: [number, number, number]
    content: string
    illustration: string
    isFront: boolean
    onFlip?: () => void
}) {
    const meshRef = useRef<THREE.Mesh>(null)
    const [hovered, setHovered] = useState(false)

    useFrame(() => {
        if (meshRef.current) {
            meshRef.current.scale.lerp(new THREE.Vector3(hovered ? 1.02 : 1, hovered ? 1.02 : 1, 1), 0.1)
        }
    })

    return (
        <group position={position} rotation={rotation}>
            <mesh
                ref={meshRef}
                onPointerEnter={() => setHovered(true)}
                onPointerLeave={() => setHovered(false)}
                onClick={(e) => {
                    e.stopPropagation()
                    onFlip?.()
                }}
            >
                <planeGeometry args={[2.8, 3.8]} />
                <meshStandardMaterial
                    color="#FFFDF5"
                    roughness={0.8}
                    metalness={0.05}
                    side={THREE.DoubleSide}
                />
            </mesh>

            {/* Content Overlay */}
            <Html
                position={[0, 0, 0.02]}
                transform
                distanceFactor={3}
                style={{
                    width: "240px",
                    pointerEvents: "none",
                }}
            >
                <div className="p-5 flex flex-col items-center justify-center select-none">
                    <div className="text-6xl mb-6 drop-shadow-sm">{illustration}</div>
                    <p className="text-slate-800 text-sm leading-relaxed font-serif text-center italic opacity-90">
                        {content}
                    </p>
                </div>
            </Html>
        </group>
    )
}

// Animated Book with page flip and premium materials
function AnimatedBook({
    story,
    currentPage,
    onPageChange,
    theme
}: {
    story: any
    currentPage: number
    onPageChange: (page: number) => void
    theme: any
}) {
    const groupRef = useRef<THREE.Group>(null)
    const [rightPageRotation, setRightPageRotation] = useState(0)

    const currentPageData = story.pages[currentPage]
    const nextPageData = story.pages[currentPage + 1]

    const handleNextPage = () => {
        if (currentPage < story.pages.length - 1) {
            let progress = 0
            const interval = setInterval(() => {
                progress += 0.08
                setRightPageRotation(-Math.PI * progress)

                if (progress >= 1) {
                    clearInterval(interval)
                    onPageChange(currentPage + 1)
                    setRightPageRotation(0)
                }
            }, 16)
        }
    }

    const handlePrevPage = () => {
        if (currentPage > 0) {
            onPageChange(currentPage - 1)
        }
    }

    useFrame((state) => {
        if (groupRef.current) {
            groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.2) * 0.03
            groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.05
        }
    })

    return (
        <group ref={groupRef}>
            {/* Book Base / Cover */}
            <mesh position={[0, 0, -0.1]}>
                <boxGeometry args={[6.2, 4.2, 0.2]} />
                <meshStandardMaterial
                    color={theme.cover}
                    roughness={0.3}
                    metalness={0.2}
                />
            </mesh>

            {/* Gold Edge / Details */}
            <mesh position={[0, 0, -0.05]}>
                <boxGeometry args={[6.1, 4.1, 0.22]} />
                <meshStandardMaterial
                    color="#D4AF37" // Gold
                    roughness={0.1}
                    metalness={0.8}
                />
            </mesh>

            {/* Left Page (Static) */}
            {currentPageData && (
                <Page
                    position={[-1.45, 0, 0.1]}
                    rotation={[0, 0, 0]}
                    content={currentPageData.content}
                    illustration={currentPageData.illustration}
                    isFront={true}
                    onFlip={handlePrevPage}
                />
            )}

            {/* Right Page (Flipping) */}
            {nextPageData && (
                <group rotation={[0, rightPageRotation, 0]} position={[1.45, 0, 0.1]}>
                    <Page
                        position={[0, 0, 0]}
                        rotation={[0, 0, 0]}
                        content={nextPageData.content}
                        illustration={nextPageData.illustration}
                        isFront={false}
                        onFlip={handleNextPage}
                    />
                </group>
            )}

            {/* Spine */}
            <mesh position={[0, 0, 0.05]} rotation={[0, 0, 0]}>
                <boxGeometry args={[0.15, 4.2, 0.4]} />
                <meshStandardMaterial
                    color={theme.spine}
                    roughness={0.2}
                    metalness={0.3}
                />
            </mesh>
        </group>
    )
}

// Magic Particles with theme awareness
function MagicParticles({ color = "#A78BFA" }: { color?: string }) {
    const particlesRef = useRef<THREE.Points>(null)
    const particleCount = 120

    const [positions, colors] = useMemo(() => {
        const pos = new Float32Array(particleCount * 3)
        const col = new Float32Array(particleCount * 3)
        const c = new THREE.Color(color)

        for (let i = 0; i < particleCount; i++) {
            pos[i * 3] = (Math.random() - 0.5) * 15
            pos[i * 3 + 1] = (Math.random() - 0.5) * 10
            pos[i * 3 + 2] = (Math.random() - 0.5) * 8

            col[i * 3] = c.r * (0.8 + Math.random() * 0.4)
            col[i * 3 + 1] = c.g * (0.8 + Math.random() * 0.4)
            col[i * 3 + 2] = c.b * (0.8 + Math.random() * 0.4)
        }
        return [pos, col]
    }, [color])

    useFrame((state) => {
        if (particlesRef.current) {
            particlesRef.current.rotation.y = state.clock.elapsedTime * 0.1
            particlesRef.current.rotation.z = state.clock.elapsedTime * 0.05
        }
    })

    return (
        <points ref={particlesRef}>
            <bufferGeometry>
                <bufferAttribute attach="attributes-position" count={particleCount} array={positions} itemSize={3} args={[positions, 3]} />
                <bufferAttribute attach="attributes-color" count={particleCount} array={colors} itemSize={3} args={[colors, 3]} />
            </bufferGeometry>
            <pointsMaterial size={0.08} vertexColors transparent opacity={0.6} sizeAttenuation blending={THREE.AdditiveBlending} />
        </points>
    )
}

// Main Premium Reading Book 3D Component
export default function ReadingBook3D({
    story,
    currentPage,
    onPageChange
}: {
    story: any
    currentPage: number
    onPageChange: (page: number) => void
}) {
    const theme = BOOK_THEMES[story?.artStyle] || BOOK_THEMES.default

    return (
        <div className="w-full h-full min-h-[500px] relative overflow-hidden bg-gradient-to-b from-white to-slate-50">
            <Canvas
                shadows
                camera={{ position: [0, 0, 10], fov: 45 }}
                dpr={[1, 2]}
            >
                <color attach="background" args={[theme.bg]} />
                <ResponsiveCamera />

                {/* Enhanced Lighting */}
                <ambientLight intensity={0.8} />
                <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1} castShadow />
                <pointLight position={[-10, -10, -10]} intensity={0.5} color={theme.glow} />
                <directionalLight position={[0, 5, 5]} intensity={0.5} />

                <Environment preset="city" />

                <PresentationControls
                    global
                    snap
                    rotation={[0, 0, 0]}
                    polar={[-Math.PI / 4, Math.PI / 4]}
                    azimuth={[-Math.PI / 6, Math.PI / 6]}
                >
                    <Float speed={2} rotationIntensity={0.2} floatIntensity={0.5}>
                        <AnimatedBook
                            story={story}
                            currentPage={currentPage}
                            onPageChange={onPageChange}
                            theme={theme}
                        />
                    </Float>
                </PresentationControls>

                <ContactShadows
                    position={[0, -3.5, 0]}
                    opacity={0.4}
                    scale={15}
                    blur={2}
                    far={4.5}
                />

                <MagicParticles color={theme.particles} />
            </Canvas>

            {/* Theme-aware Interaction UI */}
            <AnimatePresence>
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20"
                >
                    <div className="flex gap-4 items-center">
                        <button
                            onClick={() => onPageChange(Math.max(0, currentPage - 1))}
                            className="w-12 h-12 rounded-full border border-slate-200 bg-white shadow-lg flex items-center justify-center text-slate-400 hover:text-coral-500 hover:border-coral-200 transition-all hover:scale-110 active:scale-95 disabled:opacity-30"
                            disabled={currentPage === 0}
                        >
                            ←
                        </button>

                        <div className="px-6 py-2.5 rounded-full bg-white/90 backdrop-blur-md border border-slate-100 shadow-xl flex items-center gap-3">
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Página</span>
                            <span className="text-sm font-extrabold text-slate-800">{currentPage + 1} / {story.pages.length}</span>
                        </div>

                        <button
                            onClick={() => onPageChange(Math.min(story.pages.length - 1, currentPage + 1))}
                            className="w-12 h-12 rounded-full border border-slate-200 bg-white shadow-lg flex items-center justify-center text-slate-400 hover:text-coral-500 hover:border-coral-200 transition-all hover:scale-110 active:scale-95 disabled:opacity-30"
                            disabled={currentPage === story.pages.length - 1}
                        >
                            →
                        </button>
                    </div>
                </motion.div>
            </AnimatePresence>

            {/* Instruction tooltip */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 2 }}
                className="absolute top-8 left-1/2 -translate-x-1/2 pointer-events-none"
            >
                <div className="px-4 py-2 rounded-lg bg-slate-900/5 backdrop-blur-sm border border-slate-900/10">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
                        <span>✨</span>
                        Interactúa con el libro para explorar
                        <span>✨</span>
                    </p>
                </div>
            </motion.div>
        </div>
    )
}
