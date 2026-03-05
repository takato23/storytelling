"use client"

import React, { useRef, useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Eraser, RotateCcw, Download, Palette, Brush, Check, X, Trash2, Image as ImageIcon, Save } from "lucide-react"
import { useIllustratorGallery } from "./useIllustratorGallery"

export function IllustratorCanvas() {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const containerRef = useRef<HTMLDivElement>(null)
    const [isDrawing, setIsDrawing] = useState(false)
    const [color, setColor] = useState("#ec4899") // Default pink
    const [brushSize, setBrushSize] = useState(5)
    const [tool, setTool] = useState<"brush" | "eraser">("brush")
    const [history, setHistory] = useState<ImageData[]>([])
    const [historyStep, setHistoryStep] = useState(-1)
    const [showGallery, setShowGallery] = useState(false)

    const { drawings, saveDrawing, deleteDrawing } = useIllustratorGallery()

    const COLORS = [
        "#000000", // Black
        "#ef4444", // Red
        "#f97316", // Orange
        "#eab308", // Yellow
        "#22c55e", // Green
        "#3b82f6", // Blue
        "#a855f7", // Purple
        "#ec4899", // Pink
    ]

    // Initialize canvas
    useEffect(() => {
        const canvas = canvasRef.current
        const container = containerRef.current
        if (!canvas || !container) return

        const ctx = canvas.getContext("2d")
        if (!ctx) return

        const resizeCanvas = () => {
            canvas.width = container.offsetWidth
            canvas.height = container.offsetHeight

            // Set default styles
            ctx.lineCap = "round"
            ctx.lineJoin = "round"
            ctx.fillStyle = "#ffffff"
            ctx.fillRect(0, 0, canvas.width, canvas.height)
        }

        resizeCanvas()
        window.addEventListener("resize", resizeCanvas)

        return () => window.removeEventListener("resize", resizeCanvas)
    }, [])

    const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
        const canvas = canvasRef.current
        if (!canvas) return

        setIsDrawing(true)
        const ctx = canvas.getContext("2d")
        if (!ctx) return

        // Save history state before new stroke
        if (historyStep < history.length - 1) {
            const newHistory = history.slice(0, historyStep + 1)
            setHistory(newHistory)
        }

        const { offsetX, offsetY } = getCoordinates(e, canvas)
        ctx.beginPath()
        ctx.moveTo(offsetX, offsetY)
        ctx.strokeStyle = tool === "eraser" ? "#ffffff" : color
        ctx.lineWidth = brushSize
    }

    const draw = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isDrawing) return
        const canvas = canvasRef.current
        if (!canvas) return

        const ctx = canvas.getContext("2d")
        if (!ctx) return

        const { offsetX, offsetY } = getCoordinates(e, canvas)
        ctx.lineTo(offsetX, offsetY)
        ctx.stroke()
    }

    const stopDrawing = () => {
        if (!isDrawing) return
        setIsDrawing(false)
        const canvas = canvasRef.current
        if (!canvas) return

        const ctx = canvas.getContext("2d")
        if (!ctx) return
        ctx.closePath()

        // Save to history
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
        const newHistory = [...history.slice(0, historyStep + 1), imageData]
        setHistory(newHistory)
        setHistoryStep(newHistory.length - 1)
    }

    const getCoordinates = (e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) => {
        let clientX, clientY
        if ('touches' in e) {
            clientX = e.touches[0].clientX
            clientY = e.touches[0].clientY
        } else {
            clientX = (e as React.MouseEvent).clientX
            clientY = (e as React.MouseEvent).clientY
        }

        const rect = canvas.getBoundingClientRect()
        return {
            offsetX: clientX - rect.left,
            offsetY: clientY - rect.top
        }
    }

    const clearCanvas = () => {
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext("2d")
        if (!ctx) return

        ctx.fillStyle = "#ffffff"
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        setHistory([])
        setHistoryStep(-1)
    }

    const undo = () => {
        if (historyStep < 0) return
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext("2d")
        if (!ctx) return

        if (historyStep === 0) {
            // Clear if last step
            ctx.fillStyle = "#ffffff"
            ctx.fillRect(0, 0, canvas.width, canvas.height)
            setHistoryStep(-1)
        } else {
            const previousState = history[historyStep - 1]
            ctx.putImageData(previousState, 0, 0)
            setHistoryStep(historyStep - 1)
        }
    }

    const handleSaveToGallery = () => {
        const canvas = canvasRef.current
        if (!canvas) return
        const dataUrl = canvas.toDataURL()
        saveDrawing(dataUrl)
        setShowGallery(true) // Open gallery to show result
    }

    const downloadDrawing = () => {
        const canvas = canvasRef.current
        if (!canvas) return
        const link = document.createElement('a')
        link.download = 'mi-dibujo-magico.png'
        link.href = canvas.toDataURL()
        link.click()
    }

    return (
        <div className="flex flex-col h-[600px] bg-white/80 backdrop-blur-md rounded-3xl overflow-hidden shadow-2xl border border-white/50 ring-1 ring-charcoal-100/50">
            {/* Toolbar */}
            <div className="bg-white/50 border-b border-charcoal-100/50 p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    {/* Tools */}
                    <div className="flex gap-2 bg-white/60 p-1.5 rounded-2xl border border-charcoal-100/50 shadow-sm">
                        <button
                            onClick={() => setTool("brush")}
                            className={`p-2.5 rounded-xl transition-all ${tool === "brush" ? "bg-coral-100/50 text-coral-600 shadow-sm ring-1 ring-coral-200" : "text-charcoal-400 hover:bg-charcoal-50"}`}
                        >
                            <Brush className="w-5 h-5" />
                        </button>
                        <button
                            onClick={() => setTool("eraser")}
                            className={`p-2.5 rounded-xl transition-all ${tool === "eraser" ? "bg-teal-100/50 text-teal-600 shadow-sm ring-1 ring-teal-200" : "text-charcoal-400 hover:bg-charcoal-50"}`}
                        >
                            <Eraser className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Colors */}
                    <div className="h-8 w-px bg-charcoal-200/50 mx-2" />

                    <div className="flex gap-1.5">
                        {COLORS.map((c) => (
                            <button
                                key={c}
                                onClick={() => { setColor(c); setTool("brush") }}
                                className={`w-8 h-8 rounded-full border-2 transition-all ${color === c && tool === "brush" ? "border-charcoal-300 scale-110 shadow-sm" : "border-white/50 hover:scale-105"}`}
                                style={{ backgroundColor: c }}
                            />
                        ))}
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={undo}
                        disabled={historyStep === -1}
                        className="p-3 rounded-xl border border-charcoal-100 bg-white/50 text-charcoal-500 hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                    >
                        <RotateCcw className="w-5 h-5" />
                    </button>
                    <button
                        onClick={clearCanvas}
                        className="p-3 rounded-xl border border-red-100 bg-red-50/30 text-red-500 hover:bg-red-50 transition-all"
                    >
                        <X className="w-5 h-5" />
                    </button>
                    <button
                        onClick={downloadDrawing}
                        className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-teal-400 to-teal-500 text-white rounded-xl font-bold hover:shadow-lg hover:shadow-teal-500/20 transition-all"
                    >
                        <Download className="w-5 h-5" />
                        Guardar
                    </button>
                    <button
                        onClick={handleSaveToGallery}
                        className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-xl font-bold hover:shadow-lg hover:shadow-purple-500/20 transition-all"
                    >
                        <Save className="w-5 h-5" />
                        Guardar en Galería
                    </button>
                    <button
                        onClick={() => setShowGallery(!showGallery)}
                        className={`p-3 rounded-xl border transition-all ${showGallery ? 'bg-purple-100 border-purple-200 text-purple-700' : 'bg-white/50 border-charcoal-100 text-charcoal-600'}`}
                    >
                        <ImageIcon className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Gallery Sidebar */}
            <AnimatePresence>
                {showGallery && (
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className="absolute top-[80px] right-4 bottom-[80px] w-64 bg-white/95 backdrop-blur shadow-2xl rounded-2xl border border-white/50 p-4 flex flex-col z-10"
                    >
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-charcoal-800">Mis Dibujos</h3>
                            <button onClick={() => setShowGallery(false)} className="text-charcoal-400 hover:text-charcoal-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto space-y-4 pr-1 custom-scrollbar">
                            {drawings.length === 0 ? (
                                <p className="text-center text-sm text-charcoal-400 py-8">No hay dibujos guardados aún.</p>
                            ) : (
                                drawings.map((drawing) => (
                                    <div key={drawing.id} className="relative group bg-white rounded-xl border border-charcoal-100 p-2 shadow-sm">
                                        <img src={drawing.dataUrl} alt={drawing.title} className="w-full h-auto rounded-lg bg-white" />
                                        <div className="mt-2 flex justify-between items-center">
                                            <div>
                                                <p className="font-bold text-xs text-charcoal-700 truncate w-32">{drawing.title}</p>
                                                <p className="text-[10px] text-charcoal-400">{drawing.date}</p>
                                            </div>
                                            <button
                                                onClick={() => deleteDrawing(drawing.id)}
                                                className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Canvas Area */}
            <div
                ref={containerRef}
                className="flex-1 relative cursor-crosshair bg-[url('/textures/paper.png')] bg-repeat" // Optional texture
            >
                <canvas
                    ref={canvasRef}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                    className="touch-none block w-full h-full"
                />
            </div>

            {/* Size Slider Bottom */}
            <div className="px-6 py-4 bg-white border-t border-charcoal-100 flex items-center justify-center">
                <span className="text-xs text-charcoal-500 mr-4 font-bold uppercase tracking-wider">Tamaño del trazo</span>
                <input
                    type="range"
                    min="1"
                    max="30"
                    value={brushSize}
                    onChange={(e) => setBrushSize(parseInt(e.target.value))}
                    className="w-64 h-2 bg-charcoal-200 rounded-lg appearance-none cursor-pointer accent-coral-500"
                />
                <div
                    className="ml-4 rounded-full bg-charcoal-900"
                    style={{ width: brushSize, height: brushSize }}
                />
            </div>
        </div>
    )
}
