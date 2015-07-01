module.exports = ()->
    require './vendor/main/main.min.js'
    require './vendor/angular-resource/angular-resource.js'
    require './vendor/angular-route/angular-route.js'
    require './vendor/angular-ui-ace/ui-ace.js'
    require './vendor/angular-ui-bootstrap/dist/ui-bootstrap-tpls-0.13.0.js'
    require './r.js'
    
    app = angular.module 'app'

    app.config ['$locationProvider',($locationProvider)->
        $locationProvider.html5Mode(false)
    ]


    test = (name,args,testcb)->
        ng_bootstrap('app')
        console.log "running #{name}"
        testcb(args)

    test 'test_get_all_users',{},()->
        User = ng_load '$User',['app']
        $q = ng_load('$q')

        $q.when(User.query()).then (res)->
            console.log res.$promise
            



