'use strict'
$q = require 'q'


doLoop = (num)->
    def = $q.defer()
    cancel = setInterval( ()->
        console.log 'hi'
        return
    ,20)
    setTimeout( ()->
        def.resolve num+num
        clearInterval cancel
    ,parseInt(num)*1000)
    return def.promise

loop2 = (num)->
    def = $q.defer()
    setTimeout(()->
        console.log 'all done'
        def.resolve num+num
    ,parseInt(num)*1000)
    return def.promise


make_timeout = (num)->
    def = $q.defer()
    $q.when(setTimeout(()->
        console.log num
        def.resolve num+1
    ,1000))
    return def.promise



wait = (num)->
    timeouts = []
    for x in [1..num]
        timeouts.push(make_timeout(x))
    




#$q.all([doLoop(3)].concat([loop2(3),wait(5)])).then (res)->
#   console.log res
#

$q.when(make_timeout(1)).then(make_timeout).then(make_timeout).then(make_timeout)

    

