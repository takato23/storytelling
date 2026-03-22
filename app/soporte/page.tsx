import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRight, Clock3, Mail, ShieldCheck } from "lucide-react"

export const metadata: Metadata = {
    title: "Soporte | StoryMagic",
    description: "Página de soporte con tiempos de respuesta, canal de contacto y ayudas comunes.",
}

const supportItems = [
    {
        title: "Pedidos y pagos",
        description: "Te ayudamos si una orden quedó pendiente, si hubo un problema de cobro o si necesitas entender el estado de una compra.",
    },
    {
        title: "Vista previa y personalización",
        description: "Podemos revisar dudas sobre la foto, la historia elegida o la configuración del cuento antes de producirlo.",
    },
    {
        title: "Incidencias de entrega",
        description: "Si algo llegó incompleto, dañado o no coincide con lo esperado, lo revisamos desde aquí y te indicamos los pasos siguientes.",
    },
]

export default function SoportePage() {
    return (
        <main className="page-shell min-h-screen pt-24 pb-16">
            <section className="container mx-auto px-6">
                <div className="mx-auto mb-10 max-w-4xl rounded-[36px] border border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(255,246,238,0.88))] p-8 shadow-[0_28px_70px_-34px_rgba(62,42,79,0.28)] backdrop-blur-xl md:p-10">
                    <span className="section-kicker mb-4">Soporte</span>
                    <h1 className="section-heading text-4xl md:text-5xl">Centro de soporte</h1>
                    <p className="section-copy mt-5 max-w-3xl text-lg font-semibold">
                        Centralizamos aquí las dudas sobre pedidos, pagos, personalización, envíos y devoluciones para que no dependas del contacto genérico.
                    </p>
                    <div className="mt-6 flex flex-wrap items-center gap-3 text-sm font-semibold text-charcoal-500">
                        <span className="inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/70 px-4 py-2">
                            <Clock3 className="h-4 w-4 text-teal-600" />
                            Respuesta por email en horario laboral
                        </span>
                        <span className="inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/70 px-4 py-2">
                            <ShieldCheck className="h-4 w-4 text-teal-600" />
                            Ayuda para pedidos activos
                        </span>
                    </div>
                </div>

                <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
                    <div className="space-y-5">
                        <div className="page-panel rounded-[30px] p-7 md:p-8">
                            <h2 className="mb-4 text-2xl font-serif text-charcoal-900">En qué te ayudamos</h2>
                            <div className="space-y-4">
                                {supportItems.map((item) => (
                                    <div key={item.title} className="rounded-2xl border border-white/80 bg-white/75 p-4">
                                        <h3 className="text-lg font-bold text-charcoal-900">{item.title}</h3>
                                        <p className="mt-1 text-sm leading-relaxed text-charcoal-600">{item.description}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="page-panel rounded-[30px] p-7 md:p-8">
                            <h2 className="mb-4 text-2xl font-serif text-charcoal-900">Canal de contacto</h2>
                            <p className="text-charcoal-600 leading-relaxed">
                                Si necesitas abrir una consulta, usa el formulario de contacto. Desde allí respondemos por email y derivamos el caso al área correcta.
                            </p>
                            <div className="mt-5 flex flex-wrap gap-3">
                                <Link href="/contacto" className="inline-flex items-center gap-2 rounded-full bg-charcoal-900 px-5 py-3 text-sm font-bold text-white transition-all hover:-translate-y-0.5 hover:bg-purple-700">
                                    <Mail className="h-4 w-4" />
                                    Ir al formulario
                                </Link>
                            </div>
                        </div>
                    </div>

                    <aside className="space-y-5">
                        <div className="page-panel rounded-[30px] p-7 md:p-8">
                            <h2 className="mb-4 text-xl font-serif text-charcoal-900">Tiempos orientativos</h2>
                            <p className="text-sm leading-relaxed text-charcoal-600">
                                Revisamos los mensajes en horario laboral. Si tu consulta está vinculada a una orden, incluye el número de pedido para acelerar la respuesta.
                            </p>
                        </div>
                        <div className="page-panel rounded-[30px] p-7 md:p-8">
                            <h2 className="mb-4 text-xl font-serif text-charcoal-900">Si es urgente</h2>
                            <p className="text-sm leading-relaxed text-charcoal-600">
                                Si el problema afecta una entrega próxima o un cobro duplicado, indícalo en el asunto del mensaje para priorizarlo.
                            </p>
                            <div className="mt-4">
                                <Link href="/contacto" className="inline-flex items-center gap-2 rounded-full bg-charcoal-900 px-4 py-2.5 text-sm font-bold text-white transition-all hover:bg-purple-700">
                                    Contactar ahora
                                    <ArrowRight className="h-4 w-4" />
                                </Link>
                            </div>
                        </div>
                    </aside>
                </div>
            </section>
        </main>
    )
}
