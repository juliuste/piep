'use strict'

const views = require('wikimedia-page-views')
const articles = require('wikipedia-location-search')
const moment = require('moment')
const sumBy = require('lodash.sumby')
const sortBy = require('lodash.sortby')
const wikidata = require('wikidata-sdk')
const got = require('got')


const countViews = async (page) => {
    const startDate = moment.utc().subtract(50, 'day').startOf('day').toDate()
    const endDate = moment.utc().subtract(1, 'day').startOf('day').toDate()

    const articleViews = await views(page, 'de.wikipedia', startDate, endDate)
    const viewSum = sumBy(articleViews, (x) => x.views)
    return viewSum
}

const attributeFactor = async (page) => {
    const url = wikidata.getWikidataIdsFromSitelinks(page, 'dewiki')
    const request = await got(url, {json: true})
    const claims = request.body.entities[Object.keys(request.body.entities)[0]].claims
    const sitelinks = request.body.entities[Object.keys(request.body.entities)[0]].sitelinks

    let factor = 1

    if(page.toLowerCase().indexOf('bahnhof') >= 0) factor *= 0.1

    if(claims.P18) factor *= 1.5 // has an image
    if(claims.P149) factor *= 2 // has an architectural style
    if(claims.P238) factor *= 0.1 // has an IATA code
    if(claims.P935) factor *= 5 // has commons gallery
    if(claims.P1082) factor *= 0 // has population, likely to be a village
    if(claims.P1103) factor *= 0.2 // has number of platforms
    if(claims.P1435) factor *= 50 // has heritage status
    if(claims.P1566) factor *= 2 // has geonames id

    const numberOfLanguages = Math.log(Object.keys(sitelinks).length)
    factor *= numberOfLanguages

    return factor
}

const nearbySite = async (coordinates) => {
    const nearbyArticles = await articles(coordinates, {language: 'de', maxResults: 50})
    const articleScores = await Promise.all(nearbyArticles.map((x) => countViews(x.title).catch((x) => 1)))
    const attributeFactors = await Promise.all(nearbyArticles.map((x) => attributeFactor(x.title).catch((x) => 1)))

    for(let i = 0; i < nearbyArticles.length; i++){
        nearbyArticles[i].score = attributeFactors[i]*articleScores[i]
    }

    const articleList = sortBy(nearbyArticles, (x) => -x.score)

    return articleList[0]
}

module.exports = nearbySite

// nearbySite({latitude: 51.966692, longitude: 12.2115183})
// .then(console.log)
