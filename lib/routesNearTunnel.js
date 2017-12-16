'use strict'

const turf = require('@turf/turf')
const fs = require('fs')
const filter = require('through2-filter').obj
const ndjson = require('ndjson')

const tunnels = require('../tunnel.geo.json').features

const nearTunnel = (d) => {
    const point = turf.point([d.coordinates.longitude, d.coordinates.latitude])
    const results = []
    for(let tunnel of tunnels.filter((x) => x.properties.laenge > 5000)){
        const distances = tunnel.geometry.coordinates.map((x) => turf.point([x[0], x[1]])).map((x) => turf.distance(point, x)).sort()
        if(distances[0] < 1) return true
    }
    return false
}

const find = () =>
    fs.createReadStream('./sorted.ndjson')
    .pipe(ndjson.parse())
    .pipe(filter(nearTunnel))
    .pipe(ndjson.stringify())
    .pipe(fs.createWriteStream('./withTunnel.ndjson'))


find()
