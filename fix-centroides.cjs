const { readFileSync, writeFileSync } = require('fs')

const data = JSON.parse(readFileSync('public/data/provincias.json', 'utf8'))

const centroides = {
  type: 'FeatureCollection',
  features: data.features.map(feature => {
    const aplanar = (arr) => {
      if (typeof arr[0] === 'number') return [arr]
      return arr.flatMap(aplanar)
    }

    const puntos = aplanar(feature.geometry.coordinates)
    const lngs = puntos.map(p => p[0])
    const lats = puntos.map(p => p[1])
    const cx = (Math.min(...lngs) + Math.max(...lngs)) / 2
    const cy = (Math.min(...lats) + Math.max(...lats)) / 2

    return {
      type: 'Feature',
      properties: { NAME_1: feature.properties.NAME_1 },
      geometry: { type: 'Point', coordinates: [cx, cy] }
    }
  })
}

writeFileSync('public/data/centroides.json', JSON.stringify(centroides, null, 2))
console.log('✅ Centroides generados — 1 punto por provincia')