"use client"

import React, { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronDown, HelpCircle } from "lucide-react"

interface FAQItem {
    question: string
    answer: string
}

const FAQ_ITEMS: FAQItem[] = [
    {
        question: "¿Cómo funciona la tecnología de IA?",
        answer: "Nuestra IA avanzada analiza la foto del rostro de tu hijo y la integra de forma natural en cada ilustración del cuento. El proceso es automático y produce resultados increíblemente realistas que mantienen la esencia y características del pequeño."
    },
    {
        question: "¿Cuánto tiempo tarda en crearse mi libro?",
        answer: "El proceso digital es instantáneo. Una vez completes el formulario, recibirás tu cuento digital en PDF en menos de 5 minutos. Si eliges la versión impresa, el tiempo de producción es de 24-48 horas más el tiempo de envío."
    },
    {
        question: "¿Es segura la foto de mi hijo?",
        answer: "Absolutamente. Utilizamos encriptación de grado bancario para proteger todas las imágenes. Las fotos solo se usan para generar el cuento y se eliminan automáticamente de nuestros servidores después de 24 horas. Nunca compartimos datos con terceros."
    },
    {
        question: "¿Puedo pedir cambios después de ver la vista previa?",
        answer: "¡Por supuesto! Antes de finalizar tu compra, tendrás acceso a una vista previa completa. Si algo no te convence, puedes solicitar ajustes sin costo adicional hasta que quedes 100% satisfecho."
    },
    {
        question: "¿Qué formatos de impresión ofrecen?",
        answer: "Ofrecemos libros de tapa dura premium con papel satinado de 170g. El tamaño estándar es 21x21cm, perfecto para las manitos de los pequeños. También disponemos de tamaño grande (28x28cm) para un impacto visual mayor."
    },
    {
        question: "¿Hacen envíos internacionales?",
        answer: "Sí, enviamos a toda América Latina y España. El envío a Argentina, México, Chile y Colombia es gratuito en la versión Premium. Para otros países, el costo de envío se calcula al finalizar la compra."
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
        <section className={`py-24 bg-purple-50 relative ${className}`}>
            <div className="container mx-auto px-6 relative z-10">
                <motion.div
                    className="text-center mb-16"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                >
                    <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-purple-100 text-purple-700 text-sm font-bold mb-6 shadow-sm">
                        <HelpCircle className="w-4 h-4 text-purple-500" />
                        Preguntas Frecuentes
                    </span>
                    <h2 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold text-[#2D1B4E] mb-6">
                        ¿Tienes <span className="text-purple-600">dudas</span>?
                    </h2>
                    <p className="text-charcoal-600 text-xl max-w-2xl mx-auto font-medium">
                        Aquí respondemos las preguntas más comunes de nuestros clientes mágicos.
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
                        <a href="#" className="text-purple-600 font-medium hover:text-purple-700 underline">
                            Contáctanos
                        </a>
                    </p>
                </motion.div>
            </div>
        </section>
    )
}

export default FAQSection
