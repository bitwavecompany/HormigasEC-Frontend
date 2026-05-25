import { useEffect, useRef, useState } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import type { Hormiga } from '../types'

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
}

export default function MapaEcuador({ hormigas, onProvinciaClick, provinciaSeleccionada }: Props) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<maplibregl.Map | null>(null)
  const [listo, setListo] = useState(false)
  const [tooltipHover, setTooltipHover] = useState<{
    x: number; y: number; nombre: string; cantidadHormigas: number
  } | null>(null)
  const hormigasRef = useRef<Hormiga[]>(hormigas)
  const onProvinciaClickRef = useRef(onProvinciaClick)
  const provinciasDataRef = useRef<GeoJSON.FeatureCollection | null>(null)
  
  useEffect(() => { hormigasRef.current = hormigas }, [hormigas])
  useEffect(() => { onProvinciaClickRef.current = onProvinciaClick }, [onProvinciaClick])

  useEffect(() => {
    if (map.current || !mapContainer.current) return

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        glyphs: 'https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf',
        sources: {},
        layers: [
          {
            id: 'background',
            type: 'background',
            paint: {
              'background-color': '#cce8f4',
            },
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

    map.current.on('load', () => {
      fetch('/data/provincias.json')
        .then(r => r.json())
        .then(geojson => {
          if (!map.current) return

          provinciasDataRef.current = geojson

          map.current.addSource('provincias', {
            type: 'geojson',
            data: geojson,
            generateId: true,
          })

          map.current.addLayer({
            id: 'provincias-fill',
            type: 'fill',
            source: 'provincias',
            paint: {
              'fill-color': [
                'case',
                ['boolean', ['feature-state', 'selected'], false], 'rgba(22,163,74,0.15)', // --color-brand-selected
                ['boolean', ['feature-state', 'hover'], false],    'rgba(22,163,74,0.08)', // --color-brand-subtle
                'rgba(255,255,255,0.60)',
              ],
              'fill-opacity': 1,
            },
          })

          map.current.addLayer({
            id: 'provincias-border',
            type: 'line',
            source: 'provincias',
            paint: {
              'line-color': [
                'case',
                ['boolean', ['feature-state', 'selected'], false], '#16a34a', // --color-brand
                ['boolean', ['feature-state', 'hover'], false],    '#15803d', // --color-brand-dark
                'rgba(71,85,105,0.50)',
              ],
              'line-width': [
                'case',
                ['boolean', ['feature-state', 'selected'], false], 2.5,
                ['boolean', ['feature-state', 'hover'], false],    1.8,
                0.8,
              ],
            },
          })

          fetch('/data/centroides.json')
            .then(r => r.json())
            .then(centroides => {
              if (!map.current) return

              map.current.addSource('centroides', {
                type: 'geojson',
                data: centroides,
              })

              map.current.addLayer({
                id: 'provincias-label',
                type: 'symbol',
                source: 'centroides',
                layout: {
                  'text-field': ['get', 'NAME_1'],
                  'text-font': ['Open Sans Regular'],
                  'text-size': [
                    'interpolate', ['linear'], ['zoom'],
                    5, 9,
                    8, 13,
                    12, 15,
                  ],
                  'text-anchor': 'center',
                  'symbol-placement': 'point',
                  'text-allow-overlap': false,
                  'text-ignore-placement': false,
                  'text-max-width': 8,
                  'text-padding': 10,
                },
                paint: {
                  'text-color': '#374151',
                  'text-halo-color': 'rgba(255,255,255,0.9)',
                  'text-halo-width': 1.5,
                },
              })
            })

          setListo(true)

          let hoveredId: number | string | null = null

          map.current.on('mousemove', 'provincias-fill', (e) => {
            if (!map.current) return
            map.current.getCanvas().style.cursor = 'pointer'
            if (e.features && e.features.length > 0) {
              if (hoveredId !== null) {
                map.current.setFeatureState(
                  { source: 'provincias', id: hoveredId },
                  { hover: false }
                )
              }
              hoveredId = e.features[0].id ?? null
              if (hoveredId !== null) {
                map.current.setFeatureState(
                  { source: 'provincias', id: hoveredId },
                  { hover: true }
                )
              }
            }
            const nombre = e.features?.[0]?.properties?.NAME_1 ?? ''
            const cantidad = hormigasRef.current.filter(h => h.provincia === nombre).length
            setTooltipHover({ x: e.point.x + 16, y: e.point.y - 16, nombre, cantidadHormigas: cantidad })
          })

          map.current.on('mouseleave', 'provincias-fill', () => {
            if (!map.current) return
            map.current.getCanvas().style.cursor = ''
            if (hoveredId !== null) {
              map.current.setFeatureState(
                { source: 'provincias', id: hoveredId },
                { hover: false }
              )
            }
            hoveredId = null
            setTooltipHover(null)
          })

          map.current.on('click', 'provincias-fill', (e) => {
            if (!e.features || !e.features.length) return
            const provincia = e.features[0].properties?.NAME_1 as string
            const hormigasEnProvincia = hormigasRef.current.filter(h => h.provincia === provincia)
            onProvinciaClickRef.current(provincia, hormigasEnProvincia)
          })
        })
    })

    return () => {
      window.removeEventListener('resize', ajustarZoomResponsive)
      map.current?.remove()
      map.current = null
    }
  }, [])

  useEffect(() => {
    if (!map.current || !listo) return
    const data = provinciasDataRef.current
    if (!data?.features) return

    map.current.stop()

    data.features.forEach((_: GeoJSON.Feature, i: number) => {
      map.current?.setFeatureState({ source: 'provincias', id: i }, { selected: false })
    })

    if (provinciaSeleccionada) {
      const idx = data.features.findIndex(
        (f: GeoJSON.Feature) =>
          (f.properties as ProvinciaProperties).NAME_1 === provinciaSeleccionada
      )
      if (idx !== -1 && map.current) {
        map.current.setFeatureState({ source: 'provincias', id: idx }, { selected: true })

        const feature = data.features[idx]
        const coords = (feature.geometry as GeoJSON.Polygon).coordinates[0]
        const lngs = coords.map((c: number[]) => c[0])
        const lats = coords.map((c: number[]) => c[1])
        const centerLng = (Math.min(...lngs) + Math.max(...lngs)) / 2
        const centerLat = (Math.min(...lats) + Math.max(...lats)) / 2

        map.current.flyTo({
          center: [centerLng, centerLat],
          zoom: 7.5,
          duration: 1000,
          essential: true,
        })
      }
    } else {
      map.current.flyTo({ center: MAP_CENTER, zoom: MAP_ZOOM, duration: 800 })
    }
  }, [provinciaSeleccionada, listo])

  useEffect(() => {
    if (!map.current || !listo || !provinciaSeleccionada) return

    const hormigasFiltradas = hormigas.filter(h => h.provincia === provinciaSeleccionada)

    if (map.current.getLayer('hormigas-points')) map.current.removeLayer('hormigas-points')
    if (map.current.getSource('hormigas')) map.current.removeSource('hormigas')

    if (hormigasFiltradas.length === 0) return

    const geojson: GeoJSON.FeatureCollection = {
      type: 'FeatureCollection',
      features: hormigasFiltradas.map(h => ({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [h.longitud, h.latitud] },
        properties: {
          nombre: h.nombre_comun,
          cientifico: h.nombre_cientifico,
          color: h.color_hex,
        },
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
  }, [provinciaSeleccionada, hormigas, listo])

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
            {tooltipHover.cantidadHormigas > 0 ? (
              <p className="text-green-700 text-xs">
                {tooltipHover.cantidadHormigas} especie{tooltipHover.cantidadHormigas !== 1 ? 's' : ''} registrada{tooltipHover.cantidadHormigas !== 1 ? 's' : ''}
              </p>
            ) : (
              <p className="text-gray-400 text-xs">Sin registros aún</p>
            )}
          </div>
        </div>
      )}
      {!listo && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/80 rounded-xl">
          <svg
            className="animate-spin h-5 w-5 text-green-700 mr-2"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <p className="text-green-700 text-sm">Cargando mapa...</p>
        </div>
      )}
      {!provinciaSeleccionada && (
        <div className="absolute bottom-4 right-4 z-10 bg-white/90 backdrop-blur-sm text-gray-500 text-xs px-3 py-2 rounded-lg shadow-sm border border-gray-200 pointer-events-none">
          Haz clic en una provincia para explorar
        </div>
      )}
    </div>
  )
}