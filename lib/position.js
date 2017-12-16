'use strict'

const fs = require('fs')
const ndjson = require('ndjson')
const {PassThrough} = require('stream')
const floodgate = require('floodgate')

const interval = 5000

const positionStream = (inputFile) => {
    return fs.createReadStream(inputFile).pipe(ndjson.parse()).pipe(floodgate({interval: interval, objectMode: true}))
}

module.exports = positionStream
