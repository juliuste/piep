'use strict'

const fs = require('fs')
const filter = require('through2-filter').obj
const ndjson = require('ndjson')

// const id = "58070443"
// const id = "2501645457"
// const id = "54038170"
// const id = "54068045"
const id = "54157822"

const positionStream = (inputFile, outputFile) =>
    fs.createReadStream(inputFile)
    .pipe(ndjson.parse())
    .pipe(filter((x) => x.id === id))
    .pipe(ndjson.stringify())
    .pipe(fs.createWriteStream(outputFile))

positionStream('./sorted.ndjson', './train5.ndjson')
