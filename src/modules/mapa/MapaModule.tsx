import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import MapaEcuador from '../../components/MapaEcuador'
import type { Hormiga } from '../../types'
import { fadeSlideRight, fadeSlideRightTransition, listItemVariants, staggerItemTransition } from '../../lib/motion'

const REGIONES: Record<string, string[]> = {
  'Costa': ['El Oro', 'Esmeraldas', 'Guayas', 'Los Ríos', 'Manabí', 'Santa Elena', 'Santo Domingo de los Tsáchilas'],
  'Sierra': ['Azuay', 'Bolívar', 'Cañar', 'Carchi', 'Chimborazo', 'Cotopaxi', 'Imbabura', 'Loja', 'Pichincha', 'Tungurahua'],
  'Oriente': ['Sucumbíos', 'Orellana', 'Napo', 'Pastaza', 'Morona Santiago', 'Zamora Chinchipe'],
  'Insular': ['Galápagos']
}

const PROVINCIAS = Object.values(REGIONES).flat().sort()

const generarColorHex = (str: string) => {
  let hash = 0
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash)
  const c = (hash & 0x00FFFFFF).toString(16).toUpperCase()
  return '#' + '00000'.substring(0, 6 - c.length) + c
}

const norm = (s: string | undefined | null) => s ? s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim() : ''

const AnimatedAnt = ({ color }: { color: string }) => (
  <svg viewBox="0 0 100 100" className="w-24 h-24 drop-shadow-md" style={{ color }}>
    <style>
      {`
        .ant-l1 { transform-origin: 45px 45px; animation: w1 0.15s infinite alternate ease-in-out; }
        .ant-l2 { transform-origin: 50px 45px; animation: w2 0.15s infinite alternate ease-in-out; }
        .ant-l3 { transform-origin: 55px 45px; animation: w1 0.15s infinite alternate ease-in-out; }
        .ant-l4 { transform-origin: 45px 55px; animation: w2 0.15s infinite alternate ease-in-out; }
        .ant-l5 { transform-origin: 50px 55px; animation: w1 0.15s infinite alternate ease-in-out; }
        .ant-l6 { transform-origin: 55px 55px; animation: w2 0.15s infinite alternate ease-in-out; }
        @keyframes w1 { 0% { transform: rotate(-20deg); } 100% { transform: rotate(20deg); } }
        @keyframes w2 { 0% { transform: rotate(20deg); } 100% { transform: rotate(-20deg); } }
      `}
    </style>
    <g fill="currentColor" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path className="ant-l1" d="M 45 45 L 35 25 L 20 20" fill="none" />
      <path className="ant-l2" d="M 50 45 L 50 20 L 40 15" fill="none" />
      <path className="ant-l3" d="M 55 45 L 65 25 L 80 20" fill="none" />
      <path className="ant-l4" d="M 45 55 L 35 75 L 20 80" fill="none" />
      <path className="ant-l5" d="M 50 55 L 50 80 L 40 85" fill="none" />
      <path className="ant-l6" d="M 55 55 L 65 75 L 80 80" fill="none" />
      <path d="M 72 45 Q 85 30 95 40" fill="none" strokeWidth="1.5" />
      <path d="M 72 55 Q 85 70 95 60" fill="none" strokeWidth="1.5" />
      <ellipse cx="25" cy="50" rx="16" ry="11" />
      <ellipse cx="50" cy="50" rx="10" ry="7" />
      <circle cx="70" cy="50" r="7" />
    </g>
  </svg>
)

export default function MapaModule() {
  const [hormigas, setHormigas] = useState<Hormiga[]>([])
  const [modoVista, setModoVista] = useState<'territorios' | 'especies'>('territorios')
  const [regionSeleccionada, setRegionSeleccionada] = useState<string | null>(null)
  const [provinciaSeleccionada, setProvinciaSeleccionada] = useState<string | null>(null)
  const [parroquiaSeleccionada, setParroquiaSeleccionada] = useState<string | null>(null)
  const [parroquiaNombre, setParroquiaNombre] = useState<string | null>(null)
  const [cantonNombre, setCantonNombre] = useState<string | null>(null)
  const [especieSeleccionada, setEspecieSeleccionada] = useState<string | null>(null)
  const [hormigasEnProvincia, setHormigasEnProvincia] = useState<Hormiga[]>([])
  const [hormigaDetalle, setHormigaDetalle] = useState<Hormiga | null>(null)
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  useEffect(() => {
    fetch('/data/hormigas.json')
      .then(r => r.json())
      .then(data => {
        const baseDatos = data.antsEc || []
        const formateado = baseDatos.map((h: Hormiga) => ({
          ...h,
          color_hex: generarColorHex(h.species || h.scientific_name_ant || 'default')
        }))
        setHormigas(formateado)
      })
      .catch(() => {
        setHormigas([])
      })
  }, [])

  const handleProvinciaClick = (provincia: string, encontradas: Hormiga[]) => {
    setModoVista('territorios')
    setEspecieSeleccionada(null)
    
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
      const encontradas = (hormigas || []).filter(h => norm(h.parish) === norm(nombre))
      setHormigasEnProvincia(encontradas)
    } else if (provinciaSeleccionada) {
      const encontradas = (hormigas || []).filter(h => norm(h.province) === norm(provinciaSeleccionada))
      setHormigasEnProvincia(encontradas)
    }
  }

  const handleVolverAProvincia = () => {
    setParroquiaSeleccionada(null)
    setParroquiaNombre(null)
    setCantonNombre(null)
    setHormigaDetalle(null)
    const encontradas = (hormigas || []).filter(h => norm(h.province) === norm(provinciaSeleccionada))
    setHormigasEnProvincia(encontradas)
  }

  const handleResetMapa = () => {
    setRegionSeleccionada(null)
    setProvinciaSeleccionada(null)
    setParroquiaSeleccionada(null)
    setParroquiaNombre(null)
    setCantonNombre(null)
    setHormigaDetalle(null)
    setEspecieSeleccionada(null)
    setHormigasEnProvincia([])
  }

  const handleToggleModo = (modo: 'territorios' | 'especies') => {
    setModoVista(modo)
    handleResetMapa()
  }

  const provinciasVisibles = regionSeleccionada ? REGIONES[regionSeleccionada] : PROVINCIAS
  const especiesUnicas = Array.from(new Set((hormigas || []).map(h => h.scientific_name_ant)))

  const RenderToggle = () => (
    <div className="flex bg-gray-100 p-1 rounded-lg mb-4">
      <button 
        onClick={() => handleToggleModo('territorios')}
        className={`flex-1 text-xs font-medium py-1.5 rounded-md transition-colors ${modoVista === 'territorios' ? 'bg-white text-green-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
      >
        Territorios
      </button>
      <button 
        onClick={() => handleToggleModo('especies')}
        className={`flex-1 text-xs font-medium py-1.5 rounded-md transition-colors ${modoVista === 'especies' ? 'bg-white text-green-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
      >
        Especies
      </button>
    </div>
  )

  const RenderSidebarContent = () => {
    if (modoVista === 'especies') {
      if (!especieSeleccionada) {
        return (
          <motion.div
            key="especies-list"
            variants={fadeSlideRight}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={fadeSlideRightTransition}
            className="flex-1 overflow-hidden flex flex-col"
          >
            <div className="p-4 border-b border-border bg-surface-muted shrink-0 z-10">
              <RenderToggle />
              <p className="text-gray-800 font-semibold text-sm mb-1">Catálogo de Especies</p>
              <p className="text-gray-500 text-xs">Selecciona una especie para ver su distribución</p>
            </div>
            <div className="flex-1 overflow-y-auto pb-4">
              {especiesUnicas.map((sp, i) => {
                const grupo = (hormigas || []).filter(h => h.scientific_name_ant === sp)
                const muestra = grupo[0]
                return (
                  <motion.button
                    key={sp}
                    variants={listItemVariants}
                    initial="initial"
                    animate="animate"
                    transition={staggerItemTransition(i)}
                    onClick={() => setEspecieSeleccionada(sp)}
                    className="w-full text-left px-4 py-3 border-b border-border hover:bg-brand-light transition-colors duration-150 flex items-center justify-between group"
                    style={{ borderLeft: `3px solid ${muestra.color_hex}` }}
                  >
                    <div className="overflow-hidden pr-3">
                      <p className="text-gray-800 text-sm font-medium truncate">{muestra.comun_name_ant}</p>
                      <p className="text-gray-500 text-xs italic truncate">{sp}</p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700 font-medium">
                        {grupo.length}
                      </span>
                      <span className="text-gray-300 text-lg group-hover:text-green-600 transition-colors">→</span>
                    </div>
                  </motion.button>
                )
              })}
            </div>
          </motion.div>
        )
      } else {
        const grupoEspecie = (hormigas || []).filter(h => h.scientific_name_ant === especieSeleccionada)
        const hormigaData = grupoEspecie[0]
        const provsConEspecie = Array.from(new Set(grupoEspecie.map(h => h.province))).sort()

        return (
          <motion.div
            key="especie-detalle"
            variants={fadeSlideRight}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={fadeSlideRightTransition}
            className="flex-1 overflow-hidden flex flex-col"
          >
            <div className="p-4 border-b border-border bg-surface-muted shrink-0 z-10">
              <button
                onClick={() => setEspecieSeleccionada(null)}
                className="text-xs text-gray-500 hover:text-green-700 mb-3 flex items-center gap-1 transition-colors"
              >
                ← Catálogo de Especies
              </button>
              <div className="flex items-center gap-3">
                <div
                  className="w-12 h-12 rounded-lg flex items-center justify-center shrink-0 border border-gray-200 shadow-sm bg-white"
                >
                  <AnimatedAnt color={hormigaData.color_hex || '#16a34a'} />
                </div>
                <div className="overflow-hidden">
                  <h2 className="text-sm font-bold text-gray-800 truncate" style={{ color: hormigaData.color_hex }}>
                    {hormigaData.comun_name_ant}
                  </h2>
                  <p className="text-gray-500 text-xs italic truncate">{hormigaData.scientific_name_ant}</p>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              <div className="grid grid-cols-2 gap-2 mb-4">
                <div className="data-card bg-gray-50 p-2 rounded-lg border border-gray-100">
                  <p className="text-gray-500 text-xs uppercase tracking-wide mb-0.5">Familia</p>
                  <p className="text-gray-800 text-xs font-medium truncate">{hormigaData.species}</p>
                </div>
                <div className="data-card bg-gray-50 p-2 rounded-lg border border-gray-100">
                  <p className="text-gray-500 text-xs uppercase tracking-wide mb-0.5">Endémica</p>
                  <p className="text-gray-800 text-xs font-medium truncate">{hormigaData.endemic ? 'Sí' : 'No'}</p>
                </div>
              </div>
              <p className="text-gray-600 text-sm leading-relaxed mb-6">{hormigaData.description}</p>
              
              <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wide mb-3 border-b pb-2">Distribución Nacional</h3>
              <div className="flex flex-col gap-2 mb-4">
                {provsConEspecie.map(p => {
                  const count = grupoEspecie.filter(h => h.province === p).length
                  const hormigasEnEstaProv = grupoEspecie.filter(h => h.province === p)
                  return (
                    <button 
                      key={p} 
                      onClick={() => handleProvinciaClick(p, hormigasEnEstaProv)}
                      className="flex items-center justify-between bg-gray-50 hover:bg-green-50 px-3 py-2 rounded-lg border border-gray-100 transition-colors cursor-pointer"
                    >
                      <span className="text-sm font-medium text-gray-700">{p}</span>
                      <span className="text-xs font-bold text-green-700 bg-green-100 px-2 py-0.5 rounded-full">{count} registros</span>
                    </button>
                  )
                })}
              </div>

              {hormigaData.dataSource && (
                <div className="data-card bg-gray-50 p-3 rounded-lg border border-gray-100 mb-4">
                  <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">Fuente Científica</p>
                  {hormigaData.dataSource.startsWith('http') ? (
                    <a href={hormigaData.dataSource} target="_blank" rel="noreferrer" className="text-blue-600 text-xs font-medium hover:underline break-all">
                      {hormigaData.dataSource}
                    </a>
                  ) : (
                    <p className="text-gray-700 text-xs italic">{hormigaData.dataSource}</p>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )
      }
    }

    if (!provinciaSeleccionada) {
      return (
        <motion.div
          key="provincias-list"
          variants={fadeSlideRight}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={fadeSlideRightTransition}
          className="flex-1 overflow-hidden flex flex-col"
        >
          <div className="p-4 border-b border-border bg-surface-muted shrink-0 z-10">
            <RenderToggle />
            <p className="text-gray-800 font-semibold text-sm mb-3">Filtro por Región</p>
            <div className="relative">
              <select
                value={regionSeleccionada || ''}
                onChange={(e) => setRegionSeleccionada(e.target.value === '' ? null : e.target.value)}
                className="w-full appearance-none bg-white border border-gray-200 text-gray-700 text-sm rounded-lg pl-3 pr-8 py-2 outline-none focus:border-green-600 focus:ring-1 focus:ring-green-600 transition-colors shadow-sm cursor-pointer"
              >
                <option value="">Todas las regiones</option>
                {Object.keys(REGIONES).map(reg => (
                  <option key={reg} value={reg}>{reg}</option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto pb-4">
            {provinciasVisibles.map((prov, i) => {
              const count = (hormigas || []).filter(h => norm(h.province) === norm(prov)).length
              return (
                <motion.button
                  key={prov}
                  variants={listItemVariants}
                  initial="initial"
                  animate="animate"
                  transition={staggerItemTransition(i)}
                  onClick={() => handleProvinciaClick(prov, (hormigas || []).filter(h => norm(h.province) === norm(prov)))}
                  className="w-full text-left px-4 py-3 border-b border-border hover:bg-brand-light transition-colors duration-150 flex items-center justify-between group"
                >
                  <span className="text-gray-800 text-sm font-medium">{prov}</span>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs px-2 py-1 rounded-full ${count > 0 ? 'bg-green-100 text-green-700 font-medium' : 'bg-gray-100 text-gray-500'}`}>
                      {count}
                    </span>
                    <span className="text-gray-300 text-lg group-hover:text-green-600 transition-colors">→</span>
                  </div>
                </motion.button>
              )
            })}
          </div>
        </motion.div>
      )
    }

    if (hormigasEnProvincia.length === 0) {
      return (
        <motion.div
          key="no-hormigas"
          variants={fadeSlideRight}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={fadeSlideRightTransition}
          className="flex-1 flex flex-col items-center justify-center p-6 text-center"
        >
          <button
            onClick={() => setProvinciaSeleccionada(null)}
            className="text-xs text-gray-500 hover:text-green-700 mb-4 flex items-center gap-1 transition-colors"
          >
            ← Todas las provincias
          </button>
          <p className="text-gray-600 font-medium mb-1">{provinciaSeleccionada}</p>
          <p className="text-gray-500 text-sm">
            No hay hormigas registradas en esta provincia todavía.
          </p>
        </motion.div>
      )
    }

    if (hormigaDetalle) {
      return (
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
            onClick={() => setProvinciaSeleccionada(null)}
            className="text-xs text-gray-500 hover:text-green-700 mb-2 flex items-center gap-1 transition-colors"
          >
            ← Todas las provincias
          </button>
          <button
            onClick={() => setHormigaDetalle(null)}
            className="text-xs text-gray-500 hover:text-green-700 mb-4 flex items-center gap-1 transition-colors"
          >
            ← Volver a {parroquiaNombre ?? provinciaSeleccionada}
          </button>

          <div
            className="w-full py-6 rounded-lg mb-4 shadow-sm flex items-center justify-center border border-gray-100"
            style={{ background: `${hormigaDetalle.color_hex}15` }}
          >
            <AnimatedAnt color={hormigaDetalle.color_hex || '#16a34a'} />
          </div>

          <h2
            className="text-lg font-bold mb-1 font-display"
            style={{ color: hormigaDetalle.color_hex }}
          >
            {hormigaDetalle.comun_name_ant}
          </h2>
          <p className="text-gray-400 italic text-xs mb-3">{hormigaDetalle.scientific_name_ant}</p>
          <p className="text-gray-500 text-sm leading-relaxed mb-4">{hormigaDetalle.description}</p>

          <div className="grid grid-cols-2 gap-2 mb-4">
            {[
              { label: 'Especie/Familia', value: hormigaDetalle.species },
              { label: 'Región', value: hormigaDetalle.region },
              { label: 'Provincia', value: hormigaDetalle.province },
              { label: 'Parroquia', value: hormigaDetalle.parish || 'N/A' },
              { label: 'Endémica', value: hormigaDetalle.endemic ? 'Sí' : 'No' },
              { label: 'Latitud', value: Number(hormigaDetalle.latitude).toFixed(4) },
              { label: 'Longitud', value: Number(hormigaDetalle.longitude).toFixed(4) },
            ].map(({ label, value }) => (
              <div key={label} className="data-card bg-gray-50 p-2 rounded-lg border border-gray-100">
                <p className="text-gray-500 text-xs uppercase tracking-wide mb-0.5">{label}</p>
                <p className="text-gray-800 text-xs font-medium truncate">{value}</p>
              </div>
            ))}
          </div>
          
          {hormigaDetalle.dataSource && (
            <div className="data-card bg-gray-50 p-2 rounded-lg border border-gray-100 mb-4">
              <p className="text-gray-500 text-xs uppercase tracking-wide mb-0.5">Fuente de Datos</p>
              {hormigaDetalle.dataSource.startsWith('http') ? (
                <a href={hormigaDetalle.dataSource} target="_blank" rel="noreferrer" className="text-blue-600 text-xs font-medium hover:underline break-all">
                  {hormigaDetalle.dataSource}
                </a>
              ) : (
                <p className="text-gray-700 text-xs italic">{hormigaDetalle.dataSource}</p>
              )}
            </div>
          )}
        </motion.div>
      )
    }

    return (
      <motion.div
        key="lista"
        variants={fadeSlideRight}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={fadeSlideRightTransition}
        className="flex-1 overflow-y-auto"
      >
        <div className="p-4 border-b border-border bg-surface-muted sticky top-0 z-10">
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
            <>
              <button
                onClick={() => setProvinciaSeleccionada(null)}
                className="text-xs text-gray-500 hover:text-green-700 mb-2 flex items-center gap-1 transition-colors"
              >
                ← Todas las provincias
              </button>
              <p className="text-gray-800 font-semibold text-sm">{provinciaSeleccionada}</p>
            </>
          )}
          <p className="text-gray-500 text-xs mt-0.5">
            {hormigasEnProvincia.length} especie{hormigasEnProvincia.length !== 1 ? 's' : ''} registrada{hormigasEnProvincia.length !== 1 ? 's' : ''}
          </p>
        </div>

        {hormigasEnProvincia.map((h, i) => (
          <motion.button
            key={`${h.scientific_name_ant}-${i}`}
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
            <div className="overflow-hidden">
              <p className="text-gray-800 text-sm font-medium truncate">{h.comun_name_ant}</p>
              <p className="text-gray-500 text-xs italic truncate">{h.scientific_name_ant}</p>
            </div>
            <span className="ml-auto text-gray-300 text-lg shrink-0">→</span>
          </motion.button>
        ))}
      </motion.div>
    )
  }

  return (
    <div className="flex flex-1 overflow-hidden h-full relative">
      <div className="flex-1 p-3">
        <MapaEcuador
          hormigas={hormigas || []}
          provinciasRegion={regionSeleccionada && modoVista === 'territorios' ? REGIONES[regionSeleccionada] : []}
          onProvinciaClick={handleProvinciaClick}
          provinciaSeleccionada={provinciaSeleccionada}
          onParroquiaClick={handleParroquiaClick}
          parroquiaSeleccionada={parroquiaSeleccionada}
          parroquiaNombre={parroquiaNombre}
          hormigaEnfocada={hormigaDetalle}
          especieSeleccionada={especieSeleccionada}
          onReset={handleResetMapa}
        />
      </div>

      {!isMobile && (
      <aside className="w-80 border-l border-border flex flex-col overflow-hidden bg-surface-card">
        <AnimatePresence mode="wait">
          {RenderSidebarContent()}
        </AnimatePresence>
      </aside>
      )}

      {isMobile && !provinciaSeleccionada && !especieSeleccionada && (
        <div className="fixed bottom-[72px] left-1/2 -translate-x-1/2 z-40 px-4 py-2 rounded-full bg-white/90 shadow-md text-xs text-gray-500 border border-border pointer-events-none whitespace-nowrap">
          Selecciona una opción para explorar
        </div>
      )}

      {isMobile && (provinciaSeleccionada || especieSeleccionada || modoVista === 'especies') && (
        <div
          className="fixed bottom-[60px] left-0 right-0 z-40 bg-surface-card rounded-t-2xl shadow-2xl overflow-hidden flex flex-col"
          style={{ maxHeight: '60vh' }}
        >
          <div className="w-10 h-1 bg-border rounded mx-auto mt-2 mb-2 flex-shrink-0" />
          <AnimatePresence mode="wait">
             {RenderSidebarContent()}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}