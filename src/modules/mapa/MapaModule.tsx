import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import MapaEcuador from '../../components/MapaEcuador'
import type { Hormiga } from '../../types'
import { fadeSlideRight, fadeSlideRightTransition, listItemVariants, staggerItemTransition } from '../../lib/motion'

export default function MapaModule() {
  const [hormigas, setHormigas] = useState<Hormiga[]>([])
  const [provinciaSeleccionada, setProvinciaSeleccionada] = useState<string | null>(null)
  const [hormigasEnProvincia, setHormigasEnProvincia] = useState<Hormiga[]>([])
  const [hormigaDetalle, setHormigaDetalle] = useState<Hormiga | null>(null)
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)
  const [parroquiaSeleccionada, setParroquiaSeleccionada] = useState<string | null>(null)
  const [parroquiaNombre, setParroquiaNombre] = useState<string | null>(null)
  const [cantonNombre, setCantonNombre] = useState<string | null>(null)

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  useEffect(() => {
    fetch('/data/hormigas.json')
      .then(r => r.json())
      .then(data => setHormigas(data.hormigas))
  }, [])

  const handleProvinciaClick = (provincia: string, encontradas: Hormiga[]) => {
    if (provinciaSeleccionada === provincia) {
      setProvinciaSeleccionada(null)
      setHormigasEnProvincia([])
      setHormigaDetalle(null)
      setParroquiaSeleccionada(null)
      setParroquiaNombre(null)
      setCantonNombre(null)
      return
    }
    setProvinciaSeleccionada(provincia)
    setHormigasEnProvincia(encontradas)
    setHormigaDetalle(null)
    setParroquiaSeleccionada(null)
    setParroquiaNombre(null)
    setCantonNombre(null)
  }

  const handleParroquiaClick = (codigo: string | null, nombre: string | null, canton: string | null) => {
    setParroquiaSeleccionada(codigo)
    setParroquiaNombre(nombre)
    setCantonNombre(canton)
    setHormigaDetalle(null)
    
    if (nombre) {
      const encontradas = hormigas.filter(h => h.parroquia === nombre)
      setHormigasEnProvincia(encontradas)
    } else if (provinciaSeleccionada) {
      // Si se deselecciona la parroquia (ej. al hacer zoom out), mostramos todas las de la provincia
      const encontradas = hormigas.filter(h => h.provincia === provinciaSeleccionada)
      setHormigasEnProvincia(encontradas)
    }
  }

  const handleVolverAProvincia = () => {
    setParroquiaSeleccionada(null)
    setParroquiaNombre(null)
    setCantonNombre(null)
    setHormigaDetalle(null)
    const encontradas = hormigas.filter(h => h.provincia === provinciaSeleccionada)
    setHormigasEnProvincia(encontradas)
  }

  return (
    <div className="flex flex-1 overflow-hidden h-full relative">
      <div className="flex-1 p-3">
        <MapaEcuador
          hormigas={hormigas}
          onProvinciaClick={handleProvinciaClick}
          provinciaSeleccionada={provinciaSeleccionada}
          onParroquiaClick={handleParroquiaClick}
          parroquiaSeleccionada={parroquiaSeleccionada}
          parroquiaNombre={parroquiaNombre}
        />
      </div>

      {!isMobile && (
      <aside className="w-72 border-l border-border flex flex-col overflow-hidden bg-surface-card">
        <AnimatePresence mode="wait">
          {!provinciaSeleccionada ? (
            <motion.div
              key="empty"
              variants={fadeSlideRight}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={fadeSlideRightTransition}
              className="flex-1 flex flex-col items-center justify-center p-6 text-center"
            >
              <p className="text-gray-500 text-sm">
                Haz clic en cualquier provincia del mapa para ver las hormigas registradas
              </p>
            </motion.div>
          ) : hormigasEnProvincia.length === 0 ? (
            <motion.div
              key="no-hormigas"
              variants={fadeSlideRight}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={fadeSlideRightTransition}
              className="flex-1 flex flex-col items-center justify-center p-6 text-center"
            >
              <p className="text-gray-600 font-medium mb-1">{provinciaSeleccionada}</p>
              <p className="text-gray-500 text-sm">
                No hay hormigas registradas en esta provincia todavía.
              </p>
            </motion.div>
          ) : hormigaDetalle ? (
            <motion.div
              key="detalle"
              variants={fadeSlideRight}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={fadeSlideRightTransition}
              className="flex-1 overflow-y-auto p-4"
            >
              <button
                onClick={() => setHormigaDetalle(null)}
                className="text-xs text-gray-500 hover:text-green-700 mb-4 flex items-center gap-1 transition-colors"
              >
                ← Volver a {parroquiaNombre ?? provinciaSeleccionada}
              </button>

              {hormigaDetalle.imagen_url ? (
                <img
                  src={hormigaDetalle.imagen_url}
                  alt={hormigaDetalle.nombre_comun}
                  className="w-full h-36 object-cover rounded-lg mb-4"
                />
              ) : (
                <div
                  className="w-full h-36 rounded-lg mb-4"
                  style={{ background: hormigaDetalle.color_hex + '22' }}
                />
              )}

              <h2
                className="text-lg font-bold mb-1 font-display"
                style={{ color: hormigaDetalle.color_hex }}
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
                  <div key={label} className="data-card">
                    <p className="text-gray-500 text-xs uppercase tracking-wide mb-0.5">{label}</p>
                    <p className="text-gray-800 text-xs font-medium">{value}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="lista"
              variants={fadeSlideRight}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={fadeSlideRightTransition}
              className="flex-1 overflow-y-auto"
            >
              <div className="p-4 border-b border-border bg-surface-muted">
                {parroquiaNombre ? (
                  <>
                    <button
                      onClick={handleVolverAProvincia}
                      className="text-xs text-gray-500 hover:text-green-700 mb-2 flex items-center gap-1 transition-colors"
                    >
                      ← {provinciaSeleccionada}
                    </button>
                    <p className="text-gray-800 font-semibold text-sm">{parroquiaNombre}</p>
                    {cantonNombre && (
                      <p className="text-gray-500 text-xs mt-0.5">Cantón {cantonNombre}</p>
                    )}
                  </>
                ) : (
                  <p className="text-gray-800 font-semibold text-sm">{provinciaSeleccionada}</p>
                )}
                <p className="text-gray-500 text-xs mt-0.5">
                  {hormigasEnProvincia.length} especie{hormigasEnProvincia.length !== 1 ? 's' : ''} registrada{hormigasEnProvincia.length !== 1 ? 's' : ''}
                </p>
              </div>

              {hormigasEnProvincia.map((h, i) => (
                <motion.button
                  key={h.id}
                  variants={listItemVariants}
                  initial="initial"
                  animate="animate"
                  transition={staggerItemTransition(i)}
                  onClick={() => setHormigaDetalle(h)}
                  className="w-full text-left px-4 py-3 border-b border-border hover:bg-brand-light transition-colors duration-150 flex items-center gap-3"
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
      )}

      {isMobile && !provinciaSeleccionada && (
        <div className="fixed bottom-[72px] left-1/2 -translate-x-1/2 z-40 px-4 py-2 rounded-full bg-white/90 shadow-md text-xs text-gray-500 border border-border pointer-events-none whitespace-nowrap">
          Toca una provincia para explorar
        </div>
      )}

      {isMobile && provinciaSeleccionada && (
        <div
          className="fixed bottom-[60px] left-0 right-0 z-40 bg-surface-card rounded-t-2xl shadow-2xl overflow-y-auto flex flex-col"
          style={{ maxHeight: '55vh' }}
        >
          <div className="w-10 h-1 bg-border rounded mx-auto mt-2 mb-1 flex-shrink-0" />
          <AnimatePresence mode="wait">
            {hormigasEnProvincia.length === 0 ? (
              <motion.div
                key="no-hormigas-mobile"
                variants={fadeSlideRight}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={fadeSlideRightTransition}
                className="flex-1 flex flex-col items-center justify-center p-6 text-center"
              >
                <p className="text-gray-600 font-medium mb-1">{provinciaSeleccionada}</p>
                <p className="text-gray-500 text-sm">
                  No hay hormigas registradas en esta provincia todavía.
                </p>
              </motion.div>
            ) : hormigaDetalle ? (
              <motion.div
                key="detalle-mobile"
                variants={fadeSlideRight}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={fadeSlideRightTransition}
                className="flex-1 overflow-y-auto p-4"
              >
                <button
                  onClick={() => setHormigaDetalle(null)}
                  className="text-xs text-gray-500 hover:text-green-700 mb-4 flex items-center gap-1 transition-colors"
                >
                  ← Volver a {parroquiaNombre ?? provinciaSeleccionada}
                </button>

                {hormigaDetalle.imagen_url ? (
                  <img
                    src={hormigaDetalle.imagen_url}
                    alt={hormigaDetalle.nombre_comun}
                    className="w-full h-36 object-cover rounded-lg mb-4"
                  />
                ) : (
                  <div
                    className="w-full h-36 rounded-lg mb-4"
                    style={{ background: hormigaDetalle.color_hex + '22' }}
                  />
                )}

                <h2
                  className="text-lg font-bold mb-1 font-display"
                  style={{ color: hormigaDetalle.color_hex }}
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
                    <div key={label} className="data-card">
                      <p className="text-gray-500 text-xs uppercase tracking-wide mb-0.5">{label}</p>
                      <p className="text-gray-800 text-xs font-medium">{value}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="lista-mobile"
                variants={fadeSlideRight}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={fadeSlideRightTransition}
                className="flex-1 overflow-y-auto"
              >
                <div className="p-4 border-b border-border bg-surface-muted">
                  {parroquiaNombre ? (
                    <>
                      <button
                        onClick={handleVolverAProvincia}
                        className="text-xs text-gray-500 hover:text-green-700 mb-2 flex items-center gap-1 transition-colors"
                      >
                        ← {provinciaSeleccionada}
                      </button>
                      <p className="text-gray-800 font-semibold text-sm">{parroquiaNombre}</p>
                      {cantonNombre && (
                        <p className="text-gray-500 text-xs mt-0.5">Cantón {cantonNombre}</p>
                      )}
                    </>
                  ) : (
                    <p className="text-gray-800 font-semibold text-sm">{provinciaSeleccionada}</p>
                  )}
                  <p className="text-gray-500 text-xs mt-0.5">
                    {hormigasEnProvincia.length} especie{hormigasEnProvincia.length !== 1 ? 's' : ''} registrada{hormigasEnProvincia.length !== 1 ? 's' : ''}
                  </p>
                </div>

                {hormigasEnProvincia.map((h, i) => (
                  <motion.button
                    key={h.id}
                    variants={listItemVariants}
                    initial="initial"
                    animate="animate"
                    transition={staggerItemTransition(i)}
                    onClick={() => setHormigaDetalle(h)}
                    className="w-full text-left px-4 py-3 border-b border-border hover:bg-brand-light transition-colors duration-150 flex items-center gap-3"
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
        </div>
      )}
    </div>
  )
}