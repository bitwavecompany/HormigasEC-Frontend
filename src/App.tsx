import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import MapaEcuador from './components/MapaEcuador'
import type { Hormiga } from './types'

export default function App() {
  const [hormigas, setHormigas] = useState<Hormiga[]>([])
  const [provinciaSeleccionada, setProvinciaSeleccionada] = useState<string | null>(null)
  const [hormigasEnProvincia, setHormigasEnProvincia] = useState<Hormiga[]>([])
  const [hormigaDetalle, setHormigaDetalle] = useState<Hormiga | null>(null)

  useEffect(() => {
    fetch('/data/hormigas.json')
      .then(r => r.json())
      .then(data => setHormigas(data.hormigas))
  }, [])

  const handleProvinciaClick = (provincia: string, encontradas: Hormiga[]) => {
    setProvinciaSeleccionada(provincia)
    setHormigasEnProvincia(encontradas)
    setHormigaDetalle(null)
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50 text-gray-900">

      {/* Header */}
      <header className="flex items-center justify-between px-6 py-3 border-b border-gray-200 bg-white shadow-sm flex-shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🐜</span>
          <div>
            <h1 className="text-xl font-bold text-green-800" style={{ fontFamily: 'Playfair Display, serif' }}>
              Hormigas del Ecuador
            </h1>
            <p className="text-xs text-gray-400">Haz clic en una provincia para explorar</p>
          </div>
        </div>
        {provinciaSeleccionada && (
          <div className="flex items-center gap-3">
            <span className="text-green-800 text-sm font-medium">{provinciaSeleccionada}</span>
            <span className="text-xs px-2 py-1 rounded-full bg-green-50 text-green-700 border border-green-300">
              {hormigasEnProvincia.length} especie{hormigasEnProvincia.length !== 1 ? 's' : ''}
            </span>
            <button
              onClick={() => { setProvinciaSeleccionada(null); setHormigasEnProvincia([]); setHormigaDetalle(null) }}
              className="text-xs text-gray-400 hover:text-red-600 transition-colors ml-2"
            >
              ✕ Limpiar
            </button>
          </div>
        )}
      </header>

      {/* Contenido principal */}
      <div className="flex flex-1 overflow-hidden">

        {/* Mapa */}
        <div className="flex-1 p-3">
          <MapaEcuador
            hormigas={hormigas}
            onProvinciaClick={handleProvinciaClick}
            provinciaSeleccionada={provinciaSeleccionada}
          />
        </div>

        {/* Panel lateral */}
        <aside className="w-72 border-l border-gray-200 flex flex-col overflow-hidden bg-white">
          <AnimatePresence mode="wait">
            {!provinciaSeleccionada ? (
              /* Estado vacío */
              <motion.div
                key="empty"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
                className="flex-1 flex flex-col items-center justify-center p-6 text-center"
              >
                <div className="text-5xl mb-4 opacity-30">🗺️</div>
                <p className="text-gray-500 text-sm">
                  Haz clic en cualquier provincia del mapa para ver las hormigas registradas
                </p>
              </motion.div>
            ) : hormigasEnProvincia.length === 0 ? (
              /* Sin hormigas en esta provincia */
              <motion.div
                key="no-hormigas"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
                className="flex-1 flex flex-col items-center justify-center p-6 text-center"
              >
                <div className="text-5xl mb-4 opacity-30">🐜</div>
                <p className="text-gray-600 font-medium mb-1">{provinciaSeleccionada}</p>
                <p className="text-gray-500 text-sm">
                  No hay hormigas registradas en esta provincia todavía.
                </p>
              </motion.div>
            ) : hormigaDetalle ? (
              /* Detalle de hormiga */
              <motion.div
                key="detalle"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
                className="flex-1 overflow-y-auto p-4"
              >
                <button
                  onClick={() => setHormigaDetalle(null)}
                  className="text-xs text-gray-500 hover:text-green-700 mb-4 flex items-center gap-1 transition-colors"
                >
                  ← Volver a {provinciaSeleccionada}
                </button>

                {hormigaDetalle.imagen_url ? (
                  <img
                    src={hormigaDetalle.imagen_url}
                    alt={hormigaDetalle.nombre_comun}
                    className="w-full h-36 object-cover rounded-lg mb-4"
                  />
                ) : (
                  <div
                    className="w-full h-36 rounded-lg mb-4 flex items-center justify-center text-4xl"
                    style={{ background: hormigaDetalle.color_hex + '22' }}
                  >
                    🐜
                  </div>
                )}

                <h2
                  className="text-lg font-bold mb-1"
                  style={{ color: hormigaDetalle.color_hex, fontFamily: 'Playfair Display, serif' }}
                >
                  {hormigaDetalle.nombre_comun}
                </h2>
                <p className="text-gray-400 italic text-xs mb-3">{hormigaDetalle.nombre_cientifico}</p>
                <p className="text-gray-500 text-sm leading-relaxed mb-4">{hormigaDetalle.descripcion}</p>

                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: 'Subfamilia', value: hormigaDetalle.subfamilia },
                    { label: 'Altitud', value: `${hormigaDetalle.altitud_m} m` },
                    { label: 'Latitud', value: hormigaDetalle.latitud.toFixed(3) },
                    { label: 'Longitud', value: hormigaDetalle.longitud.toFixed(3) },
                  ].map(({ label, value }) => (
                    <div key={label} className="rounded-lg p-2 bg-gray-50 border border-gray-200">
                      <p className="text-gray-500 text-xs uppercase tracking-wide mb-0.5">{label}</p>
                      <p className="text-gray-800 text-xs font-medium">{value}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            ) : (
              /* Lista de hormigas en la provincia */
              <motion.div
                key="lista"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
                className="flex-1 overflow-y-auto"
              >
                <div className="p-4 border-b border-gray-200 bg-gray-50">
                  <p className="text-gray-800 font-semibold text-sm">{provinciaSeleccionada}</p>
                  <p className="text-gray-500 text-xs mt-0.5">
                    {hormigasEnProvincia.length} especie{hormigasEnProvincia.length !== 1 ? 's' : ''} registrada{hormigasEnProvincia.length !== 1 ? 's' : ''}
                  </p>
                </div>

                {hormigasEnProvincia.map((h, i) => (
                  <motion.button
                    key={h.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.07, duration: 0.2 }}
                    onClick={() => setHormigaDetalle(h)}
                    className="w-full text-left px-4 py-3 border-b border-gray-200 hover:bg-green-50 transition-colors duration-150 flex items-center gap-3"
                    style={{ borderLeft: `3px solid ${h.color_hex}` }}
                  >
                    <span
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ background: h.color_hex }}
                    />
                    <div>
                      <p className="text-gray-800 text-sm">{h.nombre_comun}</p>
                      <p className="text-gray-500 text-xs italic">{h.nombre_cientifico}</p>
                    </div>
                    <span className="ml-auto text-gray-300 text-lg">→</span>
                  </motion.button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </aside>
      </div>
    </div>
  )
}