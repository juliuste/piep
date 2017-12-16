'use strict'

const wiki = require('wikijs').default
const replace = require('lodash.replace')
const querystring = require('querystring').unescape


const clone = (x) => JSON.parse(JSON.stringify(x))

const text = async (page) => {
    const p = await wiki({apiUrl: 'http://de.wikipedia.org/w/api.php'}).page(querystring(page))
    const summary = await p.summary()
    const content = (await p.content())
    .split('== Weblinks ==')[0]
    .split('== Einzelnachweise ==')[0]
    const tail = content.split(summary)[1]

    return {
        summary: summary.replace(/=/g, " ").trim(),
        tail: tail.replace(/=\n/g, ". ").replace(/=/g, " ").trim(),
    }
}

module.exports = text
