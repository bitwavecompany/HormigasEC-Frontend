import { useEffect, useRef, useState } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import type { Hormiga, ParroquiaProperties } from '../types'

const MAP_CENTER: [number, number] = [-79.5, -1.5] 
const MAP_ZOOM = 4.8 
const MAP_BOUNDS: maplibregl.LngLatBoundsLike = [[-92.0, -6.5], [-73.0, 3.0]]

interface ProvinciaProperties {
  NAME_1: string
}

class HomeControl {
  _map: maplibregl.Map | null = null
  _container: HTMLElement | null = null
  onAdd(map: maplibregl.Map) {
    this._map = map
    this._container = document.createElement('div')
    this._container.className = 'maplibregl-ctrl maplibregl-ctrl-group'
    const btn = document.createElement('button')
    btn.title = 'Vista completa del Ecuador'
    btn.style.cssText =
      'font-size:16px;cursor:pointer;width:29px;height:29px;display:flex;align-items:center;justify-content:center;'
    btn.innerHTML = '&#8962;'
    btn.onclick = () => map.flyTo({ center: MAP_CENTER, zoom: MAP_ZOOM, duration: 800 })
    this._container.appendChild(btn)
    return this._container
  }
  onRemove() {
    this._container?.remove()
    this._map = null
  }
}

interface Props {
  hormigas: Hormiga[]
  onProvinciaClick: (provincia: string, hormigas: Hormiga[]) => void
  provinciaSeleccionada: string | null
  onParroquiaClick: (codigo: string | null, nombre: string | null, canton: string | null) => void
  parroquiaSeleccionada: string | null
  parroquiaNombre: string | null
}

export default function MapaEcuador({
  hormigas,
  onProvinciaClick,
  provinciaSeleccionada,
  onParroquiaClick,
  parroquiaSeleccionada,
  parroquiaNombre,
}: Props) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<maplibregl.Map | null>(null)
  const [listo, setListo] = useState(false)
  const [tooltipHover, setTooltipHover] = useState<{
    x: number; y: number; nombre: string; cantidadHormigas: number
    tipo?: 'provincia' | 'parroquia'; canton?: string
  } | null>(null)

  const hormigasRef = useRef<Hormiga[]>(hormigas)
  const onProvinciaClickRef = useRef(onProvinciaClick)
  const onParroquiaClickRef = useRef(onParroquiaClick)
  const provinciasDataRef = useRef<GeoJSON.FeatureCollection | null>(null)
  const provinciaSeleccionadaRef = useRef<string | null>(provinciaSeleccionada)
  const parroquiaSeleccionadaRef = useRef<string | null>(parroquiaSeleccionada)
  const parroquiasCacheRef = useRef<GeoJSON.FeatureCollection | null>(null)
  
  const hoveredParroquiaIdRef = useRef<number | null>(null)
  const selectedParroquiaIdRef = useRef<number | null>(null)
  const hoveredProvinciaIdRef = useRef<number | null>(null)
  const selectedProvinciaIdRef = useRef<number | null>(null)

  useEffect(() => { hormigasRef.current = hormigas }, [hormigas])
  useEffect(() => { onProvinciaClickRef.current = onProvinciaClick }, [onProvinciaClick])
  useEffect(() => { onParroquiaClickRef.current = onParroquiaClick }, [onParroquiaClick])
  useEffect(() => { provinciaSeleccionadaRef.current = provinciaSeleccionada }, [provinciaSeleccionada])
  useEffect(() => { parroquiaSeleccionadaRef.current = parroquiaSeleccionada }, [parroquiaSeleccionada])

  useEffect(() => {
    if (map.current || !mapContainer.current) return

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        glyphs: '/fonts/{fontstack}/{range}.pbf',
        sources: {},
        layers: [
          {
            id: 'background',
            type: 'background',
            paint: { 'background-color': '#cce8f4' },
          },
        ],
      },
      center: MAP_CENTER,
      zoom: MAP_ZOOM,
      minZoom: MAP_ZOOM,
      maxZoom: 14,
      maxBounds: MAP_BOUNDS,
    })

    const ajustarZoomResponsive = () => {
      if (!map.current) return
      const ancho = window.innerWidth
      if (ancho < 768) {
        map.current.setMinZoom(4.0)
        map.current.flyTo({ center: MAP_CENTER, zoom: 4.0, duration: 0 })
      } else if (ancho < 1024) {
        map.current.setMinZoom(4.4)
        map.current.flyTo({ center: MAP_CENTER, zoom: 4.4, duration: 0 })
      } else {
        map.current.setMinZoom(MAP_ZOOM)
        map.current.flyTo({ center: MAP_CENTER, zoom: MAP_ZOOM, duration: 0 })
      }
    }

    ajustarZoomResponsive()
    window.addEventListener('resize', ajustarZoomResponsive)
    map.current.addControl(new maplibregl.NavigationControl(), 'top-right')
    map.current.addControl(new HomeControl() as maplibregl.IControl, 'top-right')

    map.current.on('load', async () => {
      if (!map.current) return

      if (!parroquiasCacheRef.current || !provinciasDataRef.current) {
        const [resParroquias, resProvincias] = await Promise.all([
          fetch('/data/ecuador-parroquias.json'),
          fetch('/data/provincias.json') 
        ])
        
        const dataParroquias = await resParroquias.json() as GeoJSON.FeatureCollection
        const dataProvincias = await resProvincias.json() as GeoJSON.FeatureCollection
        
        dataParroquias.features.forEach((f, i) => { f.id = i })
        dataProvincias.features.forEach((f, i) => { f.id = i }) 
        
        parroquiasCacheRef.current = dataParroquias
        provinciasDataRef.current = dataProvincias
      }
      if (!map.current) return

      const centroidesFeatures = provinciasDataRef.current.features.map((feature) => {
        const nombre = (feature.properties as ProvinciaProperties).NAME_1
        const geom = feature.geometry as GeoJSON.Polygon | GeoJSON.MultiPolygon
        let sumLng = 0, sumLat = 0, count = 0
        
        if (geom.type === 'Polygon') {
          geom.coordinates[0].forEach(([lng, lat]) => { sumLng += lng; sumLat += lat; count++ })
        } else if (geom.type === 'MultiPolygon') {
          geom.coordinates.forEach(poly => poly[0].forEach(([lng, lat]) => { sumLng += lng; sumLat += lat; count++ }))
        }

        return {
          type: 'Feature' as const,
          properties: { NAME_1: nombre },
          geometry: { type: 'Point' as const, coordinates: [sumLng / count, sumLat / count] },
        }
      })

      const centroidesParroquiasGlobal = parroquiasCacheRef.current!.features.map(f => {
        const geom = f.geometry as GeoJSON.Polygon | GeoJSON.MultiPolygon
        const ring: number[][] = geom.type === 'Polygon' ? geom.coordinates[0] : geom.coordinates[0][0]
        let sumLng = 0, sumLat = 0
        ring.forEach(([lng, lat]) => { sumLng += lng; sumLat += lat })
        return {
          type: 'Feature' as const,
          properties: f.properties,
          geometry: { type: 'Point' as const, coordinates: [sumLng / ring.length, sumLat / ring.length] },
        }
      })

      map.current.addSource('parroquias-global', { type: 'geojson', data: parroquiasCacheRef.current })
      map.current.addSource('provincias-contornos', { type: 'geojson', data: provinciasDataRef.current }) 
      map.current.addSource('centroides-provincias', { type: 'geojson', data: { type: 'FeatureCollection', features: centroidesFeatures } })
      map.current.addSource('centroides-parroquias', { type: 'geojson', data: { type: 'FeatureCollection', features: centroidesParroquiasGlobal } })

            map.current.addLayer({
        id: 'provincias-fill',
        type: 'fill',
        source: 'provincias-contornos',
        maxzoom: 6.5,
        paint: {
          'fill-color': [
            'case',
            ['boolean', ['feature-state', 'selected'], false], 'rgba(22,163,74,0.20)',
            ['boolean', ['feature-state', 'hover'], false],    'rgba(22,163,74,0.08)',
            'rgba(255,255,255,0.60)',
          ],
          'fill-opacity': 1,
        },
      })

      map.current.addLayer({
        id: 'parroquias-global-fill',
        type: 'fill',
        source: 'parroquias-global',
        minzoom: 6.5,
        paint: {
          'fill-color': [
            'case',
            ['boolean', ['feature-state', 'selected'], false], 'rgba(22,163,74,0.20)',
            ['boolean', ['feature-state', 'hover'], false],    'rgba(22,163,74,0.08)',
            'rgba(255,255,255,0.60)',
          ],
          'fill-opacity': 1,
        },
      })

      map.current.addLayer({
        id: 'parroquias-global-border',
        type: 'line',
        source: 'parroquias-global',
        minzoom: 6.5,
        paint: {
          'line-color': [
            'case',
            ['boolean', ['feature-state', 'selected'], false], '#16a34a',
            ['boolean', ['feature-state', 'hover'], false],    '#15803d',
            'rgba(71,85,105,0.30)',
          ],
          'line-width': [
            'case',
            ['boolean', ['feature-state', 'selected'], false], 2.0,
            ['boolean', ['feature-state', 'hover'], false],    1.5,
            0.5,
          ],
          'line-dasharray': [2, 2],
        },
      })

      map.current.addLayer({
        id: 'provincias-border',
        type: 'line',
        source: 'provincias-contornos',
        paint: {
          'line-color': 'rgba(71,85,105,0.60)',
          'line-width': 1.8,
        },
      })

      map.current.addLayer({
        id: 'provincias-label',
        type: 'symbol',
        source: 'centroides-provincias',
        maxzoom: 6.5,
        layout: {
          'text-field': ['get', 'NAME_1'],
          'text-font': ['Noto Sans Regular'],
          'text-size': ['interpolate', ['linear'], ['zoom'], 5, 9, 8, 13, 12, 15],
          'text-anchor': 'center',
          'symbol-placement': 'point',
        },
        paint: {
          'text-color': '#374151',
          'text-halo-color': 'rgba(255,255,255,0.9)',
          'text-halo-width': 1.5,
        },
      })

      map.current.addLayer({
        id: 'parroquias-label-auto',
        type: 'symbol',
        source: 'centroides-parroquias',
        minzoom: 6.5,
        layout: {
          'text-field': ['coalesce', ['get', 'NAME_3'], ''],
          'text-font': ['Noto Sans Regular'],
          'text-size': ['interpolate', ['linear'], ['zoom'], 6.5, 9, 10, 11, 12, 13],
          'text-anchor': 'center',
          'symbol-placement': 'point',
        },
        paint: {
          'text-color': '#374151',
          'text-halo-color': 'rgba(255,255,255,0.92)',
          'text-halo-width': 1.5,
        },
      })

      setListo(true)

      const isMicroRef = { current: map.current.getZoom() >= 6.5 }
      map.current.on('zoom', () => {
        const isMicro = map.current!.getZoom() >= 6.5
        if (isMicroRef.current !== isMicro) {
          isMicroRef.current = isMicro
          if (!isMicro && parroquiaSeleccionadaRef.current !== null) {
            onParroquiaClickRef.current(null, null, null)
          }
        }
      })
      
      map.current.on('mousemove', 'provincias-fill', (e) => {
        if (!map.current) return
        map.current.getCanvas().style.cursor = 'pointer'
        if (e.features && e.features.length > 0) {
          const featureId = e.features[0].id as number
          if (hoveredProvinciaIdRef.current !== null && hoveredProvinciaIdRef.current !== featureId) {
            map.current.setFeatureState({ source: 'provincias-contornos', id: hoveredProvinciaIdRef.current }, { hover: false })
          }
          hoveredProvinciaIdRef.current = featureId
          map.current.setFeatureState({ source: 'provincias-contornos', id: featureId }, { hover: true })
          
          const props = e.features[0].properties as ProvinciaProperties
          const cantidad = hormigasRef.current.filter(h => h.provincia === props.NAME_1).length
          
          setTooltipHover({
            x: e.point.x + 16, y: e.point.y - 16, 
            nombre: props.NAME_1, 
            cantidadHormigas: cantidad, 
            tipo: 'provincia'
          })
        }
      })

      map.current.on('mouseleave', 'provincias-fill', () => {
        if (!map.current) return
        map.current.getCanvas().style.cursor = ''
        if (hoveredProvinciaIdRef.current !== null) {
          map.current.setFeatureState({ source: 'provincias-contornos', id: hoveredProvinciaIdRef.current }, { hover: false })
        }
        hoveredProvinciaIdRef.current = null
        setTooltipHover(null)
      })

      map.current.on('click', 'provincias-fill', (e) => {
        if (!e.features || !e.features.length) return
        const props = e.features[0].properties as ProvinciaProperties
        const clickedProvincia = props.NAME_1

        if (provinciaSeleccionadaRef.current === clickedProvincia) {
          map.current?.easeTo({ zoom: 7.5, duration: 800 })
        } else {
          const hormigasEnProvincia = hormigasRef.current.filter(h => h.provincia === clickedProvincia)
          onProvinciaClickRef.current(clickedProvincia, hormigasEnProvincia)
        }
      })
      
      map.current.on('mousemove', 'parroquias-global-fill', (e) => {
        if (!map.current) return
        map.current.getCanvas().style.cursor = 'pointer'
        if (e.features && e.features.length > 0) {
          const featureId = e.features[0].id as number
          if (hoveredParroquiaIdRef.current !== null && hoveredParroquiaIdRef.current !== featureId) {
            map.current.setFeatureState({ source: 'parroquias-global', id: hoveredParroquiaIdRef.current }, { hover: false })
          }
          hoveredParroquiaIdRef.current = featureId
          map.current.setFeatureState({ source: 'parroquias-global', id: featureId }, { hover: true })
          
          const props = e.features[0].properties as ParroquiaProperties
          const cantidad = hormigasRef.current.filter(h => h.parroquia === props.NAME_3).length
          
          setTooltipHover({
            x: e.point.x + 16, y: e.point.y - 16, 
            nombre: props.NAME_3, 
            cantidadHormigas: cantidad, 
            tipo: 'parroquia', 
            canton: props.NAME_2 
          })
        }
      })

      map.current.on('mouseleave', 'parroquias-global-fill', () => {
        if (!map.current) return
        map.current.getCanvas().style.cursor = ''
        if (hoveredParroquiaIdRef.current !== null) {
          map.current.setFeatureState({ source: 'parroquias-global', id: hoveredParroquiaIdRef.current }, { hover: false })
        }
        hoveredParroquiaIdRef.current = null
        setTooltipHover(null)
      })

      map.current.on('click', 'parroquias-global-fill', (e) => {
        if (!e.features || !e.features.length) return
        const props = e.features[0].properties as ParroquiaProperties
        const clickedProvincia = props.NAME_1
        const clickedParroquia = props.CC_3

        if (parroquiaSeleccionadaRef.current === clickedParroquia) {
          onParroquiaClickRef.current(null, null, null)
          return
        }

        if (provinciaSeleccionadaRef.current !== clickedProvincia) {
          const hormigasEnProvincia = hormigasRef.current.filter(h => h.provincia === clickedProvincia)
          onProvinciaClickRef.current(clickedProvincia, hormigasEnProvincia)
        }
        
        setTimeout(() => {
          onParroquiaClickRef.current(props.CC_3, props.NAME_3, props.NAME_2)
        }, 0)
      })
    })

    return () => {
      window.removeEventListener('resize', ajustarZoomResponsive)
      map.current?.remove()
      map.current = null
    }
  }, [])

  useEffect(() => {
    if (!map.current || !listo || !provinciasDataRef.current) return

    if (selectedProvinciaIdRef.current !== null) {
      map.current.setFeatureState({ source: 'provincias-contornos', id: selectedProvinciaIdRef.current }, { selected: false })
      selectedProvinciaIdRef.current = null
    }

    if (provinciaSeleccionada) {
      const feature = provinciasDataRef.current.features.find(
        (f: GeoJSON.Feature) => (f.properties as ProvinciaProperties).NAME_1 === provinciaSeleccionada
      )
      if (feature) {
        if (feature.id !== undefined) {
          map.current.setFeatureState({ source: 'provincias-contornos', id: feature.id as number }, { selected: true })
          selectedProvinciaIdRef.current = feature.id as number
        }

        const geom = feature.geometry as GeoJSON.Polygon | GeoJSON.MultiPolygon
        const allPoints: number[][] = []
        if (geom.type === 'Polygon') {
          geom.coordinates[0].forEach(c => allPoints.push(c))
        } else if (geom.type === 'MultiPolygon') {
          geom.coordinates.forEach(poly => poly[0].forEach(c => allPoints.push(c)))
        }
        
        const lngs = allPoints.map(c => c[0])
        const lats = allPoints.map(c => c[1])
        const centerLng = (Math.min(...lngs) + Math.max(...lngs)) / 2
        const centerLat = (Math.min(...lats) + Math.max(...lats)) / 2

        map.current.flyTo({ center: [centerLng, centerLat], zoom: 7.5, duration: 1000, essential: true })
      }
    } else {
      map.current.flyTo({ center: MAP_CENTER, zoom: MAP_ZOOM, duration: 800 })
    }
  }, [provinciaSeleccionada, listo])

  useEffect(() => {
    if (!map.current || !listo || !parroquiasCacheRef.current) return
    
    if (selectedParroquiaIdRef.current !== null) {
      map.current.setFeatureState({ source: 'parroquias-global', id: selectedParroquiaIdRef.current }, { selected: false })
      selectedParroquiaIdRef.current = null
    }

    if (parroquiaSeleccionada) {
      const feature = parroquiasCacheRef.current.features.find(
        f => (f.properties as ParroquiaProperties).CC_3 === parroquiaSeleccionada
      )
      if (feature && feature.id !== undefined) {
        map.current.setFeatureState({ source: 'parroquias-global', id: feature.id }, { selected: true })
        selectedParroquiaIdRef.current = feature.id as number
      }
    }
  }, [parroquiaSeleccionada, listo])

  useEffect(() => {
    if (!map.current || !listo || !provinciaSeleccionada) return

    const hormigasFiltradas = parroquiaSeleccionada && parroquiaNombre
      ? hormigas.filter(h => h.parroquia === parroquiaNombre)
      : hormigas.filter(h => h.provincia === provinciaSeleccionada)

    if (map.current.getLayer('hormigas-points')) map.current.removeLayer('hormigas-points')
    if (map.current.getSource('hormigas')) map.current.removeSource('hormigas')

    if (hormigasFiltradas.length === 0) return

    const geojson: GeoJSON.FeatureCollection = {
      type: 'FeatureCollection',
      features: hormigasFiltradas.map(h => ({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [h.longitud, h.latitud] },
        properties: { nombre: h.nombre_comun, cientifico: h.nombre_cientifico, color: h.color_hex },
      })),
    }

    map.current.addSource('hormigas', { type: 'geojson', data: geojson })

    map.current.addLayer({
      id: 'hormigas-points',
      type: 'circle',
      source: 'hormigas',
      paint: {
        'circle-radius': 10,
        'circle-color': ['get', 'color'],
        'circle-opacity': 0.9,
        'circle-stroke-width': 2,
        'circle-stroke-color': '#fff',
      },
    })

    const popup = new maplibregl.Popup({ closeButton: false, closeOnClick: false })

    map.current.on('mouseenter', 'hormigas-points', (e) => {
      if (!map.current || !e.features?.length) return
      map.current.getCanvas().style.cursor = 'pointer'
      const props = e.features[0].properties
      const coords = (e.features[0].geometry as GeoJSON.Point).coordinates as [number, number]
      popup
        .setLngLat(coords)
        .setHTML(`
          <div style="font-family:'DM Sans',sans-serif;padding:6px 10px;background:white;
            border:1px solid #e5e7eb;border-radius:8px;color:#1f2937;box-shadow:0 2px 8px rgba(0,0,0,0.12)">
            <strong style="color:#15803d;font-size:13px">${props.nombre}</strong><br/>
            <em style="font-size:11px;color:#6b7280">${props.cientifico}</em>
          </div>
        `)
        .addTo(map.current)
    })

    map.current.on('mouseleave', 'hormigas-points', () => {
      if (!map.current) return
      map.current.getCanvas().style.cursor = ''
      popup.remove()
    })
  }, [provinciaSeleccionada, parroquiaSeleccionada, parroquiaNombre, hormigas, listo])

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainer} className="w-full h-full rounded-xl" />
      {tooltipHover && (
        <div
          className="absolute pointer-events-none z-20 transition-all duration-100"
          style={{ left: tooltipHover.x, top: tooltipHover.y }}
        >
          <div className="bg-white/95 backdrop-blur border border-gray-200 rounded-xl px-4 py-3 shadow-2xl min-w-[180px]">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-gray-900 font-semibold text-sm">{tooltipHover.nombre}</span>
            </div>
            {tooltipHover.tipo === 'parroquia' ? (
              <>
                {tooltipHover.canton && <p className="text-gray-500 text-xs">Cantón {tooltipHover.canton}</p>}
                {tooltipHover.cantidadHormigas > 0 ? (
                  <p className="text-green-700 text-xs mt-1">
                    {tooltipHover.cantidadHormigas} especie{tooltipHover.cantidadHormigas !== 1 ? 's' : ''} registrada{tooltipHover.cantidadHormigas !== 1 ? 's' : ''}
                  </p>
                ) : (
                  <p className="text-gray-400 text-xs mt-1">Sin registros aún</p>
                )}
              </>
            ) : (
              tooltipHover.cantidadHormigas > 0 ? (
                <p className="text-green-700 text-xs">
                  {tooltipHover.cantidadHormigas} especie{tooltipHover.cantidadHormigas !== 1 ? 's' : ''} registrada{tooltipHover.cantidadHormigas !== 1 ? 's' : ''}
                </p>
              ) : (
                <p className="text-gray-400 text-xs">Sin registros aún</p>
              )
            )}
          </div>
        </div>
      )}
      {!listo && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/80 rounded-xl z-30">
          <svg className="animate-spin h-5 w-5 text-green-700 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <p className="text-green-700 text-sm font-medium">Cargando mapa interactivo...</p>
        </div>
      )}
      {!provinciaSeleccionada && (
        <div className="absolute bottom-4 right-4 z-10 bg-white/90 backdrop-blur-sm text-gray-500 text-xs px-3 py-2 rounded-lg shadow-sm border border-gray-200 pointer-events-none">
          Selecciona una provincia para explorar
        </div>
      )}
    </div>
  )
}