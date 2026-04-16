"use client"

import React, { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronDown, HelpCircle } from "lucide-react"
import Link from "next/link"

interface FAQItem {
    question: string
    answer: string
}

const FAQ_ITEMS: FAQItem[] = [
    {
        question: "¿Cómo se personaliza el libro con la foto?",
        answer: "Tomamos la foto, adaptamos los rasgos principales y creamos ilustraciones personalizadas consistentes con el estilo del cuento."
    },
    {
        question: "¿Cuánto tiempo tarda en crearse mi libro?",
        answer: "La preview se genera primero. El libro final se procesa después del pago. Si elegís impreso, el plazo depende de producción y envío."
    },
    {
        question: "¿Es segura la foto de mi hijo?",
        answer: "Sí. La foto se usa solo para generar el cuento, se protege durante el proceso y no se comparte con terceros."
    },
    {
        question: "¿Puedo pedir cambios después de ver la vista previa?",
        answer: "Sí. La preview sirve para validar la dirección general. Si hace falta un ajuste, lo revisamos antes de producir la versión final."
    },
    {
        question: "¿Qué formatos de impresión ofrecen?",
        answer: "Ofrecemos libro impreso a color con opciones de terminación. El detalle final se confirma antes de pagar."
    },
    {
        question: "¿Hacen envíos internacionales?",
        answer: "Hoy trabajamos con envíos dentro de Argentina. El costo y plazo se calculan al avanzar con la compra según la dirección de entrega."
    },
]

function FAQItemComponent({ item, isOpen, onToggle }: { item: FAQItem; isOpen: boolean; onToggle: () => void }) {
    return (
        <motion.div
            className={`border-b border-purple-100/50 last:border-0 ${isOpen ? "bg-purple-50/30" : ""}`}
            initial={false}
        >
            <button
                onClick={onToggle}
                className="w-full py-5 px-6 flex items-center justify-between text-left hover:bg-charcoal-50/50 transition-colors"
            >
                <span className="font-semibold text-charcoal-900 pr-4">{item.question}</span>
                <motion.div
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                    className="flex-shrink-0"
                >
                    <ChevronDown className={`w-5 h-5 ${isOpen ? "text-purple-500" : "text-charcoal-400"}`} />
                </motion.div>
            </button>

            <AnimatePresence initial={false}>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                    >
                        <div className="px-6 pb-5 text-charcoal-600 leading-relaxed">
                            {item.answer}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    )
}

export function FAQSection({ className = "" }: { className?: string }) {
    const [openIndex, setOpenIndex] = useState<number | null>(0)

    return (
        <section className={`relative py-16 ${className}`}>
            <div className="container mx-auto px-6 relative z-10">
                <motion.div
                    className="mb-12 text-center"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                >
                    <span className="section-kicker mb-5">
                        <HelpCircle className="w-4 h-4 text-purple-500" />
                        Preguntas frecuentes
                    </span>
                    <h2 className="section-heading mb-4 text-3xl md:text-4xl lg:text-5xl">
                        ¿Tenés <span className="text-purple-600">dudas</span>?
                    </h2>
                    <p className="section-copy mx-auto max-w-2xl text-lg font-medium">
                        Respondemos lo más importante antes de comprar.
                    </p>
                </motion.div>

                <motion.div
                    className="max-w-3xl mx-auto bg-white rounded-[32px] shadow-[0_20px_60px_-15px_rgba(147,51,234,0.15)] overflow-hidden border border-purple-100 relative"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                >
                    {FAQ_ITEMS.map((item, index) => (
                        <FAQItemComponent
                            key={index}
                            item={item}
                            isOpen={openIndex === index}
                            onToggle={() => setOpenIndex(openIndex === index ? null : index)}
                        />
                    ))}
                </motion.div>

                <motion.div
                    className="mt-10 text-center"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                >
                    <p className="text-charcoal-500">
                        ¿No encontraste lo que buscabas?{" "}
                        <Link href="/soporte" className="text-purple-600 font-medium hover:text-purple-700 underline">
                            Revisá soporte
                        </Link>
                    </p>
                </motion.div>
            </div>
        </section>
    )
}

export default FAQSection
