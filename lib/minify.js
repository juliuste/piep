'use strict'

const fs = require('fs')
const ndjson = require('ndjson')
const csv = require('csv-parse')
const moment = require('moment')
const turf = require('@turf/turf')
const sumBy = require('lodash.sumby')

const interval = 60*1000

const center = (points) => {
    const c = turf.center(turf.featureCollection(points.map((p) => turf.point([p.longitude, p.latitude]))))
    return {
        longitude: c.geometry.coordinates[0],
        latitude: c.geometry.coordinates[1]
    }
}

const dateAverage = (dates) => new Date(sumBy(dates, (x) => +x)/dates.length)

const transformRow = (r) => ({
    id: r[0],
    date: moment.utc(r[1], 'YYYY-MM-DD HH:mm:ss').toDate(),
    coordinates: {
        longitude: +r[3],
        latitude: +r[2]
    }
})

const minify = (inputPath, outputPath) => {
    const input = fs.createReadStream(inputPath).pipe(csv({delimiter: ';'}))
    const output = ndjson.stringify()

    output.pipe(fs.createWriteStream(outputPath))

    let id
    let group = []
    let date

    input.on('error', console.error)
    input.on('data', (data) => {
        const row = transformRow(data)
        if(!date) date = row.date
        if((!id || id === data[0]) && +row.date - +date <= interval){
            group.push(row)
        }
        else{
            const point = {
                coordinates: center(group.map((x) => x.coordinates)),
                date: dateAverage(group.map((x) => x.date)),
                id: group[0].id
            }
            output.write(point)
            id = data[0]
            group = [row]
            date = row.date
        }
    })

    input.on('end', () => {
        const point = {
            coordinates: center(group.map((x) => x.coordinates)),
            date: dateAverage(group.map((x) => x.date)),
            id: group[0].id
        }
        output.write(point)
        output.end()
    })
}

minify('../sorted.csv', '../sorted.ndjson')
