'use strict'

const say = require('./lib/say')
const wikitext = require('./lib/wikitext')
const nearby = require('./lib/nearby')
const position = require('./lib/position')
const timeout = require('p-timeout')
const prompt = require('prompt-promise')

const interval = 5*1000

const vectorAngle = (x1, y1, x2, y2) =>
    Math.acos((x1*x2+y1*y2) / (Math.sqrt(Math.pow(x1, 2)+Math.pow(y1, 2)) * Math.sqrt(Math.pow(x2, 2)+Math.pow(y2, 2))))

const main = () => {
    const locationStream = position('./train3.ndjson')
    let isReading = false
    let lastPage
    let location
    let lastLocation = {coordinates: {longitude: 50, latitude: -50}}

    const run = async () => {
        const pageNearby = await nearby(location.coordinates)
        console.log(pageNearby.title)
        const text = await wikitext(pageNearby.title)//.catch(() => null)
        console.log(text.summary)
        if(text && pageNearby.title !== lastPage && !isReading && pageNearby.score > 0){
            lastPage = pageNearby.title
            isReading = true

            let dir = ''

            if(lastLocation){
                const dx = location.coordinates.longitude - lastLocation.coordinates.longitude
                const dy = location.coordinates.latitude - lastLocation.coordinates.latitude

                const ex = pageNearby.coordinates.longitude - location.coordinates.longitude
                const ey = pageNearby.coordinates.latitude - location.coordinates.latitude

                const dangle = Math.atan2(dy, dx)/(Math.PI/180)
                const eangle = Math.atan2(ey, ex)/(Math.PI/180)

                let angle = vectorAngle(dx, dy, ex, ey)/(Math.PI/180)

                if(dangle >= 180){
                    if(eangle >= dangle - 180 && eangle <= dangle) angle *= (-1)
                }
                else{
                    if(!(eangle >= dangle && eangle <= dangle + 180)) angle *= (-1)
                }

                let direction

                console.log(angle)


                const clock = Math.round((angle * (-1)/360 + 0.5)*12) // todo

                if(clock > 0 && clock < 6) direction = 'rechts'
                else if(clock > 6 && clock < 12) direction = 'links'
                else if(clock === 0 || clock === 12) direction = 'vor uns'
                else direction = 'hinter uns'

                dir = `Auf ${clock} Uhr, ${direction}: `
            }

            const said = await say(dir+text.summary)
                .then(() => say('Um mehr zu hören bitte das Gerät schütteln!'))
                .then(() => timeout(prompt(''), 5000))
                .then(() => say(text.tail))
                .catch(() => null)

            isReading = false
        }
        lastLocation = JSON.parse(JSON.stringify(location))
    }

    locationStream.on('data', (d) => {location = d})

    locationStream.once('data', () => {
        // run()
        setInterval(run, interval)
    })
}

main()
