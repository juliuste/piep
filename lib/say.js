'use strict'

const say = require('say')
const pify = require('pify')

const txt = 'Der Hainich ist ein ausgedehnter, bewaldeter Höhenrücken im Nordwesten Thüringens. Er nimmt einen großen Teil der nordwestthüringischen Muschelkalk-Randplatten ein, eines Abschnitts der Umrahmung des Thüringer Keuperbeckens und Ackerhügellandes. Im Osten hebt sich der Hainich durch seine fast lückenlose Bewaldung stark vom intensiv landwirtschaftlich genutzten Mühlhäuser Becken ab, einem Teilbereich des Thüringer Beckens. Die im Namen enthaltene Vorsilbe Hain- lässt sich vom mittelhochdeutschen hagen für „gehegter Wald“ ableiten. Mit dem Begriff wurden heilige, mit einer Hainbuchenhecke umzäunte Wäldchen bezeichnet. Mit dem Nationalpark Hainich befindet sich im Süden des Höhenrückens nicht nur der bislang einzige Nationalpark Thüringens, sondern die größte nutzungsfreie Waldfläche Deutschlands. Zentrale Bereiche des Nationalparks Hainich wurden von der UNESCO 2011 zum Weltnaturerbe erklärt.'

const readText = pify((text, cb) => say.speak(text, 'Yannick', 0.4, cb))

module.exports = readText
