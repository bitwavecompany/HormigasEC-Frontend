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

type NivelEspecie = 'catalogo' | 'detalle-especie' | 'provincia-especie' | 'hormiga-especie'

type DetalleEspecieTerritorio = {
  scientific_name_ant: string
  genus: string
  species: string
  endemic: boolean
  color_hex: string
  count: number
  nombresComunes: string[]
} | null

export default function MapaModule() {
  const [hormigas, setHormigas] = useState<Hormiga[]>([])
  const [modoVista, setModoVista] = useState<'territorios' | 'especies'>('territorios')
  const [regionSeleccionada, setRegionSeleccionada] = useState<string | null>(null)
  const [provinciaSeleccionada, setProvinciaSeleccionada] = useState<string | null>(null)
  const [parroquiaSeleccionada, setParroquiaSeleccionada] = useState<string | null>(null)
  const [parroquiaNombre, setParroquiaNombre] = useState<string | null>(null)
  const [especieSeleccionada, setEspecieSeleccionada] = useState<string | null>(null)
  const [provinciaEspecie, setProvinciaEspecie] = useState<string | null>(null)
  const [hormigasEnProvincia, setHormigasEnProvincia] = useState<Hormiga[]>([])
  const [hormigaDetalle, setHormigaDetalle] = useState<Hormiga | null>(null)
  const [nivelEspecie, setNivelEspecie] = useState<NivelEspecie>('catalogo')
  const [detalleEspecieTerritorio, setDetalleEspecieTerritorio] = useState<DetalleEspecieTerritorio>(null)
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
      .catch(() => setHormigas([]))
  }, [])

  const handleProvinciaClick = (provincia: string, encontradas: Hormiga[]) => {
    setModoVista('territorios')
    setEspecieSeleccionada(null)
    setNivelEspecie('catalogo')
    setProvinciaEspecie(null)
    setDetalleEspecieTerritorio(null)

    if (provinciaSeleccionada === provincia) {
      setProvinciaSeleccionada(null)
      setHormigasEnProvincia([])
      setHormigaDetalle(null)
      setParroquiaSeleccionada(null)
      setParroquiaNombre(null)
      return
    }
    setProvinciaSeleccionada(provincia)
    setHormigasEnProvincia(encontradas)
    setHormigaDetalle(null)
    setParroquiaSeleccionada(null)
    setParroquiaNombre(null)
  }

  const handleProvinciaEspecieClick = (provincia: string) => {
    const grupoEspecie = (hormigas || []).filter(h => h.scientific_name_ant === especieSeleccionada)
    const hormigasDeEspecieEnProv = grupoEspecie.filter(h => norm(h.province) === norm(provincia))
    setProvinciaEspecie(provincia)
    setHormigasEnProvincia(hormigasDeEspecieEnProv)
    setHormigaDetalle(null)
    setNivelEspecie('provincia-especie')
  }

  const handleParroquiaClick = (codigo: string | null, nombre: string | null, provinciaPadre: string | null, encontradas: Hormiga[]) => {
    if (parroquiaSeleccionada === codigo && codigo !== null) {
      setParroquiaSeleccionada(null)
      setParroquiaNombre(null)
      setHormigaDetalle(null)
      setDetalleEspecieTerritorio(null)
      const hormigasProv = (hormigas || []).filter(h => norm(h.province) === norm(provinciaSeleccionada))
      setHormigasEnProvincia(hormigasProv)
      return
    }

    setParroquiaSeleccionada(codigo)
    setParroquiaNombre(nombre)
    setHormigaDetalle(null)
    setDetalleEspecieTerritorio(null)

    if (nombre) {
      setHormigasEnProvincia(encontradas)
    } else if (provinciaSeleccionada) {
      const hormigasProv = (hormigas || []).filter(h => norm(h.province) === norm(provinciaSeleccionada))
      setHormigasEnProvincia(hormigasProv)
    }
  }

  const handleResetMapa = () => {
    setRegionSeleccionada(null)
    setProvinciaSeleccionada(null)
    setParroquiaSeleccionada(null)
    setParroquiaNombre(null)
    setHormigaDetalle(null)
    setEspecieSeleccionada(null)
    setProvinciaEspecie(null)
    setHormigasEnProvincia([])
    setNivelEspecie('catalogo')
    setDetalleEspecieTerritorio(null)
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

  const RenderStatsEspecies = ({ lista }: { lista: Hormiga[] }) => {
    const totalRegistros = lista.length
    const totalEspecies = new Set(lista.map(h => h.scientific_name_ant)).size
    return (
      <div className="grid grid-cols-2 gap-2 mt-3 mb-2">
        <div className="bg-white rounded p-2 text-center border border-gray-100 shadow-sm">
          <p className="text-xl font-bold text-green-700 leading-none">{totalEspecies}</p>
          <p className="text-[10px] text-gray-500 uppercase mt-1 tracking-wider">Especies</p>
        </div>
        <div className="bg-white rounded p-2 text-center border border-gray-100 shadow-sm">
          <p className="text-xl font-bold text-green-700 leading-none">{totalRegistros}</p>
          <p className="text-[10px] text-gray-500 uppercase mt-1 tracking-wider">Hormigas</p>
        </div>
      </div>
    )
  }

  const RenderStatsDetalleEspecie = ({ lista }: { lista: Hormiga[] }) => {
    const totalRegistros = lista.length
    const totalNombresComunes = new Set(lista.map(h => h.comun_name_ant)).size
    return (
      <div className="grid grid-cols-2 gap-2 mt-3 mb-2">
        <div className="bg-white rounded p-2 text-center border border-gray-100 shadow-sm">
          <p className="text-xl font-bold text-green-700 leading-none">{totalRegistros}</p>
          <p className="text-[10px] text-gray-500 uppercase mt-1 tracking-wider">Hormigas</p>
        </div>
        <div className="bg-white rounded p-2 text-center border border-gray-100 shadow-sm">
          <p className="text-xl font-bold text-green-700 leading-none">{totalNombresComunes}</p>
          <p className="text-[10px] text-gray-500 uppercase mt-1 tracking-wider">N. Comunes</p>
        </div>
      </div>
    )
  }

  const RenderStatsTerritorio = ({ lista }: { lista: Hormiga[] }) => {
    const totalRegistros = lista.length
    const totalEspecies = new Set(lista.map(h => h.scientific_name_ant)).size
    return (
      <div className="grid grid-cols-2 gap-2 mt-3 mb-2">
        <div className="bg-white rounded p-2 text-center border border-gray-100 shadow-sm">
          <p className="text-xl font-bold text-green-700 leading-none">{totalRegistros}</p>
          <p className="text-[10px] text-gray-500 uppercase mt-1 tracking-wider">Registros</p>
        </div>
        <div className="bg-white rounded p-2 text-center border border-gray-100 shadow-sm">
          <p className="text-xl font-bold text-green-700 leading-none">{totalEspecies}</p>
          <p className="text-[10px] text-gray-500 uppercase mt-1 tracking-wider">Especies</p>
        </div>
      </div>
    )
  }

  const RenderStatsSoloHormigas = ({ lista }: { lista: Hormiga[] }) => (
    <div className="grid grid-cols-1 gap-2 mt-3 mb-2">
      <div className="bg-white rounded p-2 text-center border border-gray-100 shadow-sm">
        <p className="text-xl font-bold text-green-700 leading-none">{lista.length}</p>
        <p className="text-[10px] text-gray-500 uppercase mt-1 tracking-wider">Total de hormigas</p>
      </div>
    </div>
  )

  const RenderDetalleHormiga = ({ h, onBack, labelBack }: { h: Hormiga; onBack: () => void; labelBack: string }) => (
    <motion.div
      key="detalle-hormiga"
      variants={fadeSlideRight}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={fadeSlideRightTransition}
      className="flex-1 overflow-y-auto p-4"
    >
      <button
        onClick={onBack}
        className="text-xs text-gray-500 hover:text-green-700 mb-4 flex items-center gap-1 transition-colors"
      >
        ← {labelBack}
      </button>

      <div
        className="w-full py-6 rounded-lg mb-4 shadow-sm flex items-center justify-center border border-gray-100"
        style={{ background: `${h.color_hex}15` }}
      >
        <AnimatedAnt color={h.color_hex || '#16a34a'} />
      </div>

      <h2 className="text-lg font-bold mb-1 font-display" style={{ color: h.color_hex }}>
        {h.comun_name_ant}
      </h2>
      <p className="text-gray-400 italic text-xs mb-3">{h.scientific_name_ant}</p>

      <div className="grid grid-cols-2 gap-2 mb-4">
        {[
          { label: 'Género', value: h.genus },
          { label: 'Especie', value: h.species },
          { label: 'Nombre Científico', value: h.scientific_name_ant },
          { label: 'Región', value: h.region },
          { label: 'Provincia', value: h.province },
          { label: 'Endémica', value: h.endemic ? 'Sí' : 'No' },
          { label: 'Latitud', value: Number(h.latitude).toFixed(4) },
          { label: 'Longitud', value: Number(h.longitude).toFixed(4) },
        ].map(({ label, value }) => (
          <div key={label} className="data-card bg-gray-50 p-2 rounded-lg border border-gray-100">
            <p className="text-gray-500 text-xs uppercase tracking-wide mb-0.5">{label}</p>
            <p className="text-gray-800 text-xs font-medium truncate">{value}</p>
          </div>
        ))}
      </div>

      {h.location_description && (
        <div className="mb-4">
          <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wide mb-2">Descripción de Localidad</h3>
          <p className="text-gray-600 text-sm leading-relaxed">{h.location_description}</p>
        </div>
      )}

      {h.additional_information && (
        <div className="mb-4">
          <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wide mb-2">Información Adicional</h3>
          <p className="text-gray-600 text-sm leading-relaxed">{h.additional_information}</p>
        </div>
      )}

      {h.dataSource && (
        <div className="data-card bg-gray-50 p-2 rounded-lg border border-gray-100 mb-4">
          <p className="text-gray-500 text-xs uppercase tracking-wide mb-0.5">Fuente de Datos</p>
          {h.dataSource.startsWith('http') ? (
            <a href={h.dataSource} target="_blank" rel="noreferrer" className="text-blue-600 text-xs font-medium hover:underline break-all">
              {h.dataSource}
            </a>
          ) : (
            <p className="text-gray-700 text-xs italic">{h.dataSource}</p>
          )}
        </div>
      )}
    </motion.div>
  )

  const DetalleEspecieComunesCollapsible = ({ nombresComunes, colorHex }: { nombresComunes: string[]; colorHex: string }) => {
    const [open, setOpen] = useState(true)
    return (
      <>
        <button
          onClick={() => setOpen(o => !o)}
          className="w-full flex items-center justify-between mb-3 border-b pb-2 group"
        >
          <span className="text-xs font-bold text-gray-800 uppercase tracking-wide">Nombres Comunes</span>
          <svg
            className={`w-4 h-4 text-gray-400 group-hover:text-green-600 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        <AnimatePresence initial={false}>
          {open && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="flex flex-col gap-2 mb-4">
                {nombresComunes.map((nombre, idx) => (
                  <div key={idx} className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-lg border border-gray-100">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ background: colorHex }} />
                    <span className="text-sm text-gray-700">{nombre}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </>
    )
  }

  const DetalleEspecieView = ({
    hormigaData,
    grupoEspecie,
    provsConEspecie,
    nombresComunes,
    totalProvincias,
    onBack,
    onProvinciaClick,
  }: {
    hormigaData: Hormiga
    grupoEspecie: Hormiga[]
    provsConEspecie: string[]
    nombresComunes: string[]
    totalProvincias: number
    onBack: () => void
    onProvinciaClick: (p: string) => void
  }) => {
    const [distribOpen, setDistribOpen] = useState(true)
    const [comunesOpen, setComunesOpen] = useState(false)

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
            onClick={onBack}
            className="text-xs text-gray-500 hover:text-green-700 mb-3 flex items-center gap-1 transition-colors"
          >
            ← Catálogo de Especies
          </button>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg flex items-center justify-center shrink-0 border border-gray-200 shadow-sm bg-white">
              <AnimatedAnt color={hormigaData.color_hex || '#16a34a'} />
            </div>
            <div className="overflow-hidden">
              <p className="text-gray-500 text-[10px] uppercase tracking-wide mb-0.5">Nombre Científico</p>
              <h2 className="text-sm font-bold italic truncate" style={{ color: hormigaData.color_hex }}>
                {hormigaData.scientific_name_ant}
              </h2>
            </div>
          </div>
          <RenderStatsDetalleEspecie lista={grupoEspecie} />
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-2 gap-2 mb-4">
            <div className="data-card bg-gray-50 p-2 rounded-lg border border-gray-100">
              <p className="text-gray-500 text-xs uppercase tracking-wide mb-0.5">Género</p>
              <p className="text-gray-800 text-xs font-medium truncate">{hormigaData.genus}</p>
            </div>
            <div className="data-card bg-gray-50 p-2 rounded-lg border border-gray-100">
              <p className="text-gray-500 text-xs uppercase tracking-wide mb-0.5">Endémica</p>
              <p className="text-gray-800 text-xs font-medium truncate">{hormigaData.endemic ? 'Sí' : 'No'}</p>
            </div>
          </div>

          <button
            onClick={() => setDistribOpen(o => !o)}
            className="w-full flex items-center justify-between mb-3 border-b pb-2 group"
          >
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-gray-800 uppercase tracking-wide">Distribución Nacional</span>
              <span className="text-[10px] font-semibold text-green-700 bg-green-100 px-1.5 py-0.5 rounded-full">
                {provsConEspecie.length}/{totalProvincias}
              </span>
            </div>
            <svg
              className={`w-4 h-4 text-gray-400 group-hover:text-green-600 transition-transform duration-200 ${distribOpen ? 'rotate-180' : ''}`}
              fill="none" stroke="currentColor" viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          <AnimatePresence initial={false}>
            {distribOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="flex flex-col gap-2 mb-4">
                  {provsConEspecie.map(p => {
                    const count = grupoEspecie.filter(h => h.province === p).length
                    return (
                      <button
                        key={p}
                        onClick={() => onProvinciaClick(p)}
                        className="flex items-center justify-between bg-gray-50 hover:bg-green-50 px-3 py-2 rounded-lg border border-gray-100 transition-colors cursor-pointer"
                      >
                        <span className="text-sm font-medium text-gray-700">{p}</span>
                        <span className="text-xs font-bold text-green-700 bg-green-100 px-2 py-0.5 rounded-full">{count} registros</span>
                      </button>
                    )
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <button
            onClick={() => setComunesOpen(o => !o)}
            className="w-full flex items-center justify-between mb-3 border-b pb-2 group"
          >
            <span className="text-xs font-bold text-gray-800 uppercase tracking-wide">Nombres Comunes</span>
            <svg
              className={`w-4 h-4 text-gray-400 group-hover:text-green-600 transition-transform duration-200 ${comunesOpen ? 'rotate-180' : ''}`}
              fill="none" stroke="currentColor" viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          <AnimatePresence initial={false}>
            {comunesOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="flex flex-col gap-2 mb-4">
                  {nombresComunes.map((nombre, idx) => (
                    <div key={idx} className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-lg border border-gray-100">
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ background: hormigaData.color_hex }} />
                      <span className="text-sm text-gray-700">{nombre}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    )
  }

  const RenderSidebarContent = () => {
    if (modoVista === 'especies') {
      if (nivelEspecie === 'catalogo') {
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
              <RenderStatsEspecies lista={hormigas || []} />
            </div>
            <div className="flex-1 overflow-y-auto pb-4">
              <p className="text-[10px] text-gray-400 uppercase tracking-wider px-4 pt-3 pb-2 font-semibold">Lista de especies</p>
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
                    onClick={() => {
                      setEspecieSeleccionada(sp)
                      setNivelEspecie('detalle-especie')
                      setProvinciaEspecie(null)
                      setHormigaDetalle(null)
                    }}
                    className="w-full text-left px-4 py-3 border-b border-border hover:bg-brand-light transition-colors duration-150 flex items-center justify-between group"
                    style={{ borderLeft: `3px solid ${muestra.color_hex}` }}
                  >
                    <div className="overflow-hidden pr-3">
                      <p className="text-gray-800 text-sm font-medium italic truncate">{sp}</p>
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
      }

      if (nivelEspecie === 'detalle-especie' && especieSeleccionada) {
        const grupoEspecie = (hormigas || []).filter(h => h.scientific_name_ant === especieSeleccionada)
        const hormigaData = grupoEspecie[0]
        const provsConEspecie = Array.from(new Set(grupoEspecie.map(h => h.province))).sort()
        const nombresComunes = Array.from(new Set(grupoEspecie.map(h => h.comun_name_ant))).sort()
        const totalProvincias = 24

        return (
          <DetalleEspecieView
            key="especie-detalle"
            hormigaData={hormigaData}
            grupoEspecie={grupoEspecie}
            provsConEspecie={provsConEspecie}
            nombresComunes={nombresComunes}
            totalProvincias={totalProvincias}
            onBack={() => { setEspecieSeleccionada(null); setNivelEspecie('catalogo') }}
            onProvinciaClick={handleProvinciaEspecieClick}
          />
        )
      }

      if (nivelEspecie === 'provincia-especie' && especieSeleccionada && provinciaEspecie) {
        const grupoEspecie = (hormigas || []).filter(h => h.scientific_name_ant === especieSeleccionada)
        const hormigaData = grupoEspecie[0]

        if (hormigaDetalle) {
          return (
            <RenderDetalleHormiga
              h={hormigaDetalle}
              onBack={() => setHormigaDetalle(null)}
              labelBack={provinciaEspecie}
            />
          )
        }

        return (
          <motion.div
            key="provincia-especie"
            variants={fadeSlideRight}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={fadeSlideRightTransition}
            className="flex-1 overflow-hidden flex flex-col"
          >
            <div className="p-4 border-b border-border bg-surface-muted shrink-0 z-10">
              <button
                onClick={() => {
                  setNivelEspecie('detalle-especie')
                  setProvinciaEspecie(null)
                  setHormigaDetalle(null)
                  setHormigasEnProvincia([])
                }}
                className="text-xs text-gray-500 hover:text-green-700 mb-2 flex items-center gap-1 transition-colors"
              >
                ← {especieSeleccionada}
              </button>
              <p className="text-gray-500 text-[10px] uppercase tracking-wide mb-0.5">Nombre Científico</p>
              <p className="text-sm font-bold italic mb-0.5" style={{ color: hormigaData.color_hex }}>{especieSeleccionada}</p>
              <p className="text-gray-800 font-semibold text-sm">{provinciaEspecie}</p>
              <RenderStatsSoloHormigas lista={hormigasEnProvincia} />
            </div>
            <div className="flex-1 overflow-y-auto pb-4">
              <p className="text-[10px] text-gray-400 uppercase tracking-wider px-4 pt-3 pb-2 font-semibold">Lista de hormigas por nombre común</p>
              {hormigasEnProvincia.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-6 text-center h-full">
                  <p className="text-gray-500 text-sm">No hay registros en esta provincia.</p>
                </div>
              ) : (
                hormigasEnProvincia.map((h, i) => (
                  <motion.button
                    key={`${h.scientific_name_ant}-${h.latitude}-${i}`}
                    variants={listItemVariants}
                    initial="initial"
                    animate="animate"
                    transition={staggerItemTransition(i)}
                    onClick={() => setHormigaDetalle(h)}
                    className="w-full text-left px-4 py-3 border-b border-border hover:bg-brand-light transition-colors duration-150 flex items-center gap-3"
                    style={{ borderLeft: `3px solid ${h.color_hex}` }}
                  >
                    <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: h.color_hex }} />
                    <div className="overflow-hidden">
                      <p className="text-gray-800 text-sm font-medium truncate">{h.comun_name_ant}</p>
                    </div>
                    <span className="ml-auto text-gray-300 text-lg shrink-0">→</span>
                  </motion.button>
                ))
              )}
            </div>
          </motion.div>
        )
      }

      return null
    }

    if (!provinciaSeleccionada) {
      const listaGlobal = regionSeleccionada
        ? (hormigas || []).filter(h => provinciasVisibles.includes(h.province))
        : (hormigas || [])

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
            <div className="relative mb-3">
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
            <RenderStatsTerritorio lista={listaGlobal} />
          </div>
          <div className="flex-1 overflow-y-auto pb-4">
            <p className="text-[10px] text-gray-400 uppercase tracking-wider px-4 pt-3 pb-2 font-semibold">Lista de provincias</p>
            {provinciasVisibles.map((prov, i) => {
              const hormigasProv = (hormigas || []).filter(h => norm(h.province) === norm(prov))
              const count = hormigasProv.length
              return (
                <motion.button
                  key={prov}
                  variants={listItemVariants}
                  initial="initial"
                  animate="animate"
                  transition={staggerItemTransition(i)}
                  onClick={() => handleProvinciaClick(prov, hormigasProv)}
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

    const hormigasProvSeleccionada = (hormigas || []).filter(h => norm(h.province) === norm(provinciaSeleccionada))
    const especiesEnProvincia = Array.from(new Set(hormigasProvSeleccionada.map(h => h.scientific_name_ant))).sort()

    if (hormigasProvSeleccionada.length === 0) {
      return (
        <motion.div
          key="no-hormigas"
          variants={fadeSlideRight}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={fadeSlideRightTransition}
          className="flex-1 flex flex-col h-full"
        >
          <div className="p-4 border-b border-border bg-surface-muted shrink-0 z-10">
            <button
              onClick={() => setProvinciaSeleccionada(null)}
              className="text-xs text-gray-500 hover:text-green-700 mb-2 flex items-center gap-1 transition-colors"
            >
              ← Todas las provincias
            </button>
            <p className="text-gray-800 font-semibold text-sm">{provinciaSeleccionada}</p>
            <RenderStatsTerritorio lista={[]} />
          </div>
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
            <p className="text-gray-500 text-sm">No hay registros en esta ubicación.</p>
          </div>
        </motion.div>
      )
    }

    if (detalleEspecieTerritorio) {
      return (
        <motion.div
          key="detalle-especie-territorio"
          variants={fadeSlideRight}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={fadeSlideRightTransition}
          className="flex-1 overflow-hidden flex flex-col"
        >
          <div className="p-4 border-b border-border bg-surface-muted shrink-0 z-10">
            <button
              onClick={() => setDetalleEspecieTerritorio(null)}
              className="text-xs text-gray-500 hover:text-green-700 mb-2 flex items-center gap-1 transition-colors"
            >
              ← {provinciaSeleccionada}
            </button>
            <div className="flex items-center gap-3 mt-1">
              <span className="w-4 h-4 rounded-full shrink-0 border border-gray-200" style={{ background: detalleEspecieTerritorio.color_hex }} />
              <p className="text-sm font-bold italic truncate" style={{ color: detalleEspecieTerritorio.color_hex }}>
                {detalleEspecieTerritorio.scientific_name_ant}
              </p>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            <div className="grid grid-cols-2 gap-2 mb-4">
              <div className="data-card bg-gray-50 p-2 rounded-lg border border-gray-100">
                <p className="text-gray-500 text-xs uppercase tracking-wide mb-0.5">Nombre Científico</p>
                <p className="text-gray-800 text-xs font-medium">{detalleEspecieTerritorio.scientific_name_ant}</p>
              </div>
              <div className="data-card bg-gray-50 p-2 rounded-lg border border-gray-100">
                <p className="text-gray-500 text-xs uppercase tracking-wide mb-0.5">Hormigas</p>
                <p className="text-gray-800 text-xs font-medium">{detalleEspecieTerritorio.count}</p>
              </div>
              <div className="data-card bg-gray-50 p-2 rounded-lg border border-gray-100">
                <p className="text-gray-500 text-xs uppercase tracking-wide mb-0.5">Género</p>
                <p className="text-gray-800 text-xs font-medium">{detalleEspecieTerritorio.genus}</p>
              </div>
              <div className="data-card bg-gray-50 p-2 rounded-lg border border-gray-100">
                <p className="text-gray-500 text-xs uppercase tracking-wide mb-0.5">Endémica</p>
                <p className="text-gray-800 text-xs font-medium">{detalleEspecieTerritorio.endemic ? 'Sí' : 'No'}</p>
              </div>
            </div>
            <DetalleEspecieComunesCollapsible
              nombresComunes={detalleEspecieTerritorio.nombresComunes}
              colorHex={detalleEspecieTerritorio.color_hex}
            />
          </div>
        </motion.div>
      )
    }

    return (
      <motion.div
        key="lista-especies-provincia"
        variants={fadeSlideRight}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={fadeSlideRightTransition}
        className="flex-1 overflow-y-auto"
      >
        <div className="p-4 border-b border-border bg-surface-muted sticky top-0 z-10">
          <button
            onClick={() => setProvinciaSeleccionada(null)}
            className="text-xs text-gray-500 hover:text-green-700 mb-2 flex items-center gap-1 transition-colors"
          >
            ← Todas las provincias
          </button>
          <p className="text-gray-800 font-semibold text-sm">{provinciaSeleccionada}</p>
          <RenderStatsTerritorio lista={hormigasProvSeleccionada} />
        </div>
        <p className="text-[10px] text-gray-400 uppercase tracking-wider px-4 pt-3 pb-2 font-semibold">Lista de especies</p>
        {especiesEnProvincia.map((sp, i) => {
          const grupoSp = hormigasProvSeleccionada.filter(h => h.scientific_name_ant === sp)
          const muestra = grupoSp[0]
          return (
            <motion.button
              key={sp}
              variants={listItemVariants}
              initial="initial"
              animate="animate"
              transition={staggerItemTransition(i)}
              onClick={() => {
                setDetalleEspecieTerritorio({
                  scientific_name_ant: sp,
                  genus: muestra.genus,
                  species: muestra.species,
                  endemic: muestra.endemic,
                  color_hex: muestra.color_hex || '#16a34a',
                  count: grupoSp.length,
                  nombresComunes: Array.from(new Set(grupoSp.map(h => h.comun_name_ant))).sort(),
                })
              }}
              className="w-full text-left px-4 py-3 border-b border-border hover:bg-brand-light transition-colors duration-150 flex items-center gap-3 group"
              style={{ borderLeft: `3px solid ${muestra.color_hex}` }}
            >
              <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: muestra.color_hex }} />
              <div className="overflow-hidden flex-1">
                <p className="text-gray-800 text-sm font-medium italic truncate">{sp}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-medium">{grupoSp.length}</span>
                <span className="text-gray-300 text-lg group-hover:text-green-600 transition-colors">→</span>
              </div>
            </motion.button>
          )
        })}
      </motion.div>
    )
  }

  const hormigasParaMapa = modoVista === 'especies' && nivelEspecie === 'provincia-especie' && provinciaEspecie
    ? hormigasEnProvincia
    : modoVista === 'especies' && especieSeleccionada
      ? (hormigas || []).filter(h => h.scientific_name_ant === especieSeleccionada)
      : modoVista === 'territorios' && provinciaSeleccionada
        ? (hormigas || []).filter(h => norm(h.province) === norm(provinciaSeleccionada))
        : hormigas || []

  return (
    <div className="flex flex-1 overflow-hidden h-full relative">
      <div className="flex-1 p-3">
        <MapaEcuador
          hormigas={hormigasParaMapa}
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