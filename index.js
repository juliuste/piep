'use strict'

const say = require('./lib/say')
const wikitext = require('./lib/wikitext')
const nearby = require('./lib/nearby')
const position = require('./lib/position')
const timeout = require('p-timeout')
const prompt = require('prompt-promise')

const interval = 15*1000

const vectorAngle = (x1, y1, x2, y2) =>
    Math.acos((x1*x2+y1*y2) / (Math.sqrt(Math.pow(x1, 2)+Math.pow(y1, 2)) * Math.sqrt(Math.pow(x2, 2)+Math.pow(y2, 2))))

const main = () => {
    const locationStream = position('./train6.ndjson')
    let isReading = false
    let lastPage
    let location
    let lastLocation = {coordinates: {longitude: 50, latitude: -50}}

    let networkWarning = false

    // delay
    let lastDelay
    let delay = 0

    const run = async () => {

        // sights
        const pageNearby = await nearby(location.coordinates)
        const text = await wikitext(pageNearby.title)//.catch(() => null)
        if(text && pageNearby.title !== lastPage && !isReading && pageNearby.score > 0){
            // delay
            let delayText = ''
            if(delay && (!lastDelay || Math.abs(lastDelay-delay) >= 10)){
                delayText = 'Unser Zug hat leider '+Math.round(delay)+' Minuten Verspätung... [[slnc 5000]]'
                console.log('Unser Zug hat leider '+Math.round(delay)+' Minuten Verspätung...')
                lastDelay = delay
            }
            delay += 25 + Math.random()*10

            // network
            let networkText = ''
            if(networkWarning){
                // mockup, simply replace with logic from routesNearTunnel.js, which already solves this
                const tunnelLength = 10
                const tunnelDistance = 15
                networkText = 'Vorsicht, Netzabdeckung: Tunnel in circa '+tunnelDistance+' Minuten, die Durchfahrt wird etwa '+tunnelLength+' Minuten dauern. [[slnc 5000]]'
                console.log('Vorsicht, Netzabdeckung: Tunnel in circa '+tunnelDistance+' Minuten, die Durchfahrt wird etwa '+tunnelLength+' Minuten dauern.')
            }
            if(delay > 40){
                networkWarning = true
            }

            console.log('Title: ', pageNearby.title)
            console.log('Text: ', text.summary)

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

                const clock = Math.round((angle * (-1)/360 + 0.5)*12) || 0 // todo, NaN

                if(clock > 0 && clock < 6) direction = 'Auf der rechten Seite: '
                else if(clock > 6 && clock < 12) direction = 'Auf der linken Seite: '
                else if(clock === 0 || clock === 12) direction = 'Vor uns: '
                else direction = 'Hinter uns: '

                console.log('Direction: '+clock+'/12\n')

                // dir = `Auf ${clock} Uhr, ${direction}: `
                dir = direction

            }


            const said = await say(delayText+networkText+dir+text.summary)
                .then(() => say('Für mehr Informationen bitte das Gerät schütteln!'))
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
