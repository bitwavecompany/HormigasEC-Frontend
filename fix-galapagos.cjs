const { readFileSync, writeFileSync } = require('fs')

const OFFSET_LNG = -0.8 

const data = JSON.parse(readFileSync('public/data/provincias.json', 'utf8'))

data.features = data.features.map(feature => {
  if (feature.properties.NAME_1 !== 'Galápagos') return feature

  const shiftCoords = (coords) => {
    if (typeof coords[0] === 'number') {
      return [coords[0] + OFFSET_LNG, coords[1]]
    }
    return coords.map(shiftCoords)
  }

  return {
    ...feature,
    geometry: {
      ...feature.geometry,
      coordinates: feature.geometry.coordinates.map(shiftCoords)
    }
  }
})

writeFileSync('public/data/provincias.json', JSON.stringify(data, null, 2))
console.log('✅ Galápagos movido -0.8 grados al oeste')