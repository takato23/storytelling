"use client"

import React, { useRef, useState, useEffect } from "react"
import { Canvas, useFrame, useThree } from "@react-three/fiber"
import {
    Float,
    PresentationControls,
    ContactShadows,
    useTexture,
} from "@react-three/drei"
import * as THREE from "three"

// Responsive Camera Controller
function ResponsiveCamera() {
    const { camera, size } = useThree()

    useEffect(() => {
        const aspect = size.width / size.height
        if (aspect < 1) { // Portrait/Mobile
            camera.position.z = 10
            // @ts-ignore
            camera.fov = 50
        } else { // Landscape/Desktop
            camera.position.z = 8
            // @ts-ignore
            camera.fov = 45
        }
        // @ts-ignore
        camera.updateProjectionMatrix()
    }, [size, camera])

    return null
}

// Book cover component
function BookCover({
    isOpen,
    coverColor = "#FF6B6B",
    coverImage
}: {
    isOpen: boolean
    coverColor?: string
    coverImage?: string
}) {
    const coverRef = useRef<THREE.Group>(null)
    const targetRotation = useRef(0)
    // Load texture if coverImage is provided, otherwise null
    // We use a try-catch pattern or conditional hook usage implicitly by passing the url
    // However, hooks must be unconditional. safe approach: pass a valid url or empty string
    // better: useTexture only if image exists. But hooks rules...
    // simpler: Let's assume coverImage is always valid or handle it in the material.
    // robust: useTexture(coverImage || "/placeholder.png") - avoiding for now to keep it simple,
    // we will check inside the return.

    // Actually, hooks can't be conditional. We'll use a TextureLoader inside standard material or useTexture at top level if we can.
    // Better approach for dynamic prop:
    // const texture = useTexture(coverImage || "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7") 
    // This is a 1x1 transparent pixel to satisfy the hook.

    // Since we are modifying an existing component, let's just use standard material with map if texture is loaded.
    // NOTE: useTexture suspends. We should handle that or use a loader.
    // For simplicity in this iteration, I'll stick to a colored cover if no image, or try to load if image.
    // The cleanest way in R3F with dynamic textures is often just passing it to <meshStandardMaterial map={texture} />
    // But we need the texture object.

    // Let's use useLoader with TextureLoader.
    // import { useLoader } from "@react-three/fiber"
    // import { TextureLoader } from "three"
    // const texture = useLoader(TextureLoader, coverImage) 
    // This suspends. That's fine as we have Suspense in parent.

    // BUT coverImage might be undefined.
    // We will conditionally render the texture material.

    useEffect(() => {
        targetRotation.current = isOpen ? -Math.PI * 0.85 : 0
    }, [isOpen])

    useFrame(() => {
        if (coverRef.current) {
            coverRef.current.rotation.y = THREE.MathUtils.lerp(
                coverRef.current.rotation.y,
                targetRotation.current,
                0.08
            )
        }
    })

    return (
        <group
            ref={coverRef}
            position={[-1.55, 0, 0.15]}
        >
            <group position={[1.55, 0, 0]}>
                {/* Main cover base */}
                <mesh position={[0, 0, 0]}>
                    <boxGeometry args={[3.1, 4.3, 0.1]} />
                    <meshStandardMaterial
                        color={coverColor}
                        roughness={0.2}
                        metalness={0.1}
                    />
                </mesh>

                {/* Cover Image on the FRONT side (positive Z - exterior) */}
                {coverImage && (
                    <mesh position={[0, 0, 0.051]} rotation={[0, 0, 0]}>
                        <planeGeometry args={[3.0, 4.2]} />
                        <CoverImageMaterial url={coverImage} />
                    </mesh>
                )}

                {/* Gold border frame - only show if no cover image */}
                {!coverImage && (
                    <>
                        <mesh position={[0, 0, 0.051]}>
                            <boxGeometry args={[2.8, 4.0, 0.01]} />
                            <meshStandardMaterial
                                color="#D4AF37"
                                roughness={0.1}
                                metalness={0.9}
                            />
                        </mesh>

                        {/* Inner panel */}
                        <mesh position={[0, 0, 0.055]}>
                            <boxGeometry args={[2.5, 3.7, 0.01]} />
                            <meshStandardMaterial
                                color={coverColor}
                                roughness={0.4}
                                metalness={0.1}
                            />
                        </mesh>

                        {/* Star decoration */}
                        <mesh position={[0, 0.5, 0.06]}>
                            <circleGeometry args={[0.4, 5]} />
                            <meshStandardMaterial
                                color="#FFE66D"
                                roughness={0.1}
                                metalness={0.8}
                            />
                        </mesh>
                    </>
                )}
            </group>
        </group>
    )
}


// Helper to load texture safely within the material
function TextureAttachment({ url }: { url: string }) {
    const texture = useTexture(url)
    return <primitive object={texture} attach="map" />
}

// Cover image material with proper texture loading
function CoverImageMaterial({ url }: { url: string }) {
    const texture = useTexture(url)
    return (
        <meshStandardMaterial
            map={texture}
            roughness={0.3}
            metalness={0.05}
        />
    )
}

// Book spine
function BookSpine({ coverColor = "#FF6B6B" }: { coverColor?: string }) {
    return (
        <group position={[-1.6, 0, 0]}>
            <mesh>
                <boxGeometry args={[0.25, 4.3, 0.35]} />
                <meshStandardMaterial
                    color={coverColor}
                    roughness={0.2}
                    metalness={0.3}
                />
            </mesh>
        </group>
    )
}

// Back cover
function BookBack({ coverColor = "#FF6B6B" }: { coverColor?: string }) {
    return (
        <mesh position={[0, 0, -0.1]}>
            <boxGeometry args={[3.1, 4.3, 0.1]} />
            <meshStandardMaterial
                color={coverColor}
                roughness={0.2}
                metalness={0.3}
            />
        </mesh>
    )
}

// Page block
function PageBlock({ isOpen }: { isOpen: boolean }) {
    const ref = useRef<THREE.Mesh>(null)

    useFrame(() => {
        if (ref.current) {
            const targetScale = isOpen ? 0.2 : 1
            ref.current.scale.x = THREE.MathUtils.lerp(ref.current.scale.x, targetScale, 0.08)
        }
    })

    return (
        <mesh ref={ref} position={[0, 0, 0]}>
            <boxGeometry args={[2.9, 4.1, 0.25]} />
            <meshStandardMaterial
                color="#FFFDF5"
                roughness={0.8}
            />
        </mesh>
    )
}

// First page interior - visible when book opens
function FirstPage({ isOpen }: { isOpen: boolean }) {
    const groupRef = useRef<THREE.Group>(null)

    useFrame(() => {
        if (groupRef.current) {
            // Fade in/out based on open state
            const targetOpacity = isOpen ? 1 : 0
            groupRef.current.children.forEach((child) => {
                if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshStandardMaterial) {
                    child.material.opacity = THREE.MathUtils.lerp(child.material.opacity, targetOpacity, 0.1)
                }
            })
        }
    })

    return (
        <group ref={groupRef} position={[0, 0, 0.14]}>
            {/* Page background - cream colored */}
            <mesh position={[0, 0, 0]}>
                <planeGeometry args={[2.8, 4.0]} />
                <meshStandardMaterial
                    color="#FFF8E7"
                    roughness={0.9}
                    transparent
                    opacity={isOpen ? 1 : 0}
                />
            </mesh>

            {/* Decorative border */}
            <mesh position={[0, 0, 0.001]}>
                <planeGeometry args={[2.6, 3.8]} />
                <meshStandardMaterial
                    color="#F5E6D3"
                    roughness={0.85}
                    transparent
                    opacity={isOpen ? 1 : 0}
                />
            </mesh>

            {/* Gold corner decorations - top left */}
            <mesh position={[-1.1, 1.7, 0.002]}>
                <circleGeometry args={[0.15, 16]} />
                <meshStandardMaterial
                    color="#D4AF37"
                    roughness={0.2}
                    metalness={0.7}
                    transparent
                    opacity={isOpen ? 1 : 0}
                />
            </mesh>

            {/* Gold corner - top right */}
            <mesh position={[1.1, 1.7, 0.002]}>
                <circleGeometry args={[0.15, 16]} />
                <meshStandardMaterial
                    color="#D4AF37"
                    roughness={0.2}
                    metalness={0.7}
                    transparent
                    opacity={isOpen ? 1 : 0}
                />
            </mesh>

            {/* Gold corner - bottom left */}
            <mesh position={[-1.1, -1.7, 0.002]}>
                <circleGeometry args={[0.15, 16]} />
                <meshStandardMaterial
                    color="#D4AF37"
                    roughness={0.2}
                    metalness={0.7}
                    transparent
                    opacity={isOpen ? 1 : 0}
                />
            </mesh>

            {/* Gold corner - bottom right */}
            <mesh position={[1.1, -1.7, 0.002]}>
                <circleGeometry args={[0.15, 16]} />
                <meshStandardMaterial
                    color="#D4AF37"
                    roughness={0.2}
                    metalness={0.7}
                    transparent
                    opacity={isOpen ? 1 : 0}
                />
            </mesh>

            {/* Central star/sparkle decoration */}
            <mesh position={[0, 0.8, 0.003]}>
                <circleGeometry args={[0.25, 6]} />
                <meshStandardMaterial
                    color="#FFD700"
                    roughness={0.1}
                    metalness={0.8}
                    transparent
                    opacity={isOpen ? 1 : 0}
                />
            </mesh>

            {/* Decorative lines - horizontal */}
            <mesh position={[0, 0.3, 0.002]}>
                <planeGeometry args={[1.8, 0.02]} />
                <meshStandardMaterial
                    color="#D4AF37"
                    roughness={0.2}
                    metalness={0.6}
                    transparent
                    opacity={isOpen ? 1 : 0}
                />
            </mesh>

            <mesh position={[0, -0.3, 0.002]}>
                <planeGeometry args={[1.8, 0.02]} />
                <meshStandardMaterial
                    color="#D4AF37"
                    roughness={0.2}
                    metalness={0.6}
                    transparent
                    opacity={isOpen ? 1 : 0}
                />
            </mesh>

            {/* Text placeholder area - cream rectangle */}
            <mesh position={[0, 0, 0.002]}>
                <planeGeometry args={[1.6, 0.4]} />
                <meshStandardMaterial
                    color="#FFF5E1"
                    roughness={0.95}
                    transparent
                    opacity={isOpen ? 0.8 : 0}
                />
            </mesh>

            {/* Bottom decoration - small book icon area */}
            <mesh position={[0, -1.2, 0.003]}>
                <circleGeometry args={[0.12, 4]} />
                <meshStandardMaterial
                    color="#8B4513"
                    roughness={0.4}
                    transparent
                    opacity={isOpen ? 1 : 0}
                />
            </mesh>
        </group>
    )
}

// Main interactive book
function InteractiveBook({
    isOpen,
    onToggle,
    coverColor = "#FF6B6B",
    coverImage
}: {
    isOpen: boolean
    onToggle: () => void
    coverColor?: string
    coverImage?: string
}) {
    return (
        <group onClick={onToggle}>
            <BookBack coverColor={coverColor} />
            <PageBlock isOpen={isOpen} />
            <FirstPage isOpen={isOpen} />
            <BookSpine coverColor={coverColor} />
            <BookCover isOpen={isOpen} coverColor={coverColor} coverImage={coverImage} />
        </group>
    )
}

// Scene component
function BookScene({
    isOpen,
    onToggle,
    coverColor,
    coverImage
}: {
    isOpen: boolean
    onToggle: () => void
    coverColor: string
    coverImage?: string
}) {
    return (
        <>
            <ResponsiveCamera />
            {/* Main book with controls */}
            <PresentationControls
                global
                rotation={[0.15, 0.3, 0]}
                polar={[-0.3, 0.3]}
                azimuth={[-0.6, 0.6]}
                snap
            >
                <Float
                    speed={2}
                    rotationIntensity={0.2}
                    floatIntensity={0.4}
                >
                    <InteractiveBook
                        isOpen={isOpen}
                        onToggle={onToggle}
                        coverColor={coverColor}
                        coverImage={coverImage}
                    />
                </Float>
            </PresentationControls>

            {/* Premium Lighting */}
            <ambientLight intensity={0.8} />
            <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1} castShadow />
            <directionalLight
                position={[5, 5, 5]}
                intensity={0.5}
                color="#FFFFFF"
            />
            <pointLight position={[-5, 5, 5]} intensity={0.3} color="#FF6B6B" />

            <ContactShadows
                position={[0, -3.5, 0]}
                opacity={0.4}
                scale={10}
                blur={2.5}
                far={4}
            />
        </>
    )
}

// Exported Book3D component
interface Book3DProps {
    className?: string
    coverColor?: string
    coverImage?: string
    onOpenChange?: (isOpen: boolean) => void
}

export function Book3D({
    className = "",
    coverColor = "#FF6B6B",
    coverImage,
    onOpenChange
}: Book3DProps) {
    const [isOpen, setIsOpen] = useState(false)

    const handleToggle = () => {
        const newState = !isOpen
        setIsOpen(newState)
        onOpenChange?.(newState)
    }

    return (
        <div className={`relative w-full h-full ${className} select-none`}>
            <Canvas
                shadows
                camera={{ position: [0, 0, 8], fov: 45 }}
                dpr={[1, 2]}
                gl={{
                    antialias: true,
                    alpha: true,
                }}
                style={{ background: 'transparent' }}
            >
                <BookScene
                    isOpen={isOpen}
                    onToggle={handleToggle}
                    coverColor={coverColor}
                    coverImage={coverImage}
                />
            </Canvas>

            {/* Overlay instruction */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 pointer-events-none">
                <div className={`
                    px-5 py-2.5 rounded-full transition-all duration-500
                    ${isOpen
                        ? 'bg-coral-50 border border-coral-200 text-coral-600 shadow-lg shadow-coral-500/10'
                        : 'bg-white/90 border border-slate-200 text-slate-600 shadow-sm'
                    }
                    backdrop-blur-md
                `}>
                    <p className="text-sm font-bold flex items-center gap-2">
                        {isOpen ? (
                            <>
                                <span className="animate-pulse">✨</span>
                                ¡Tu aventura ha comenzado!
                            </>
                        ) : (
                            <>
                                <span className="animate-bounce">👆</span>
                                Toca para abrir la magia
                            </>
                        )}
                    </p>
                </div>
            </div>
        </div>
    )
}

export default Book3D
