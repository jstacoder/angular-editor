'use strict'

app = angular.module 'auth.app',['mgcrea.ngStrap']

app.run ($rootScope,authService,$route)->
        $rootScope.$on '$routeChangeStart',(e,nroute,oroute)->
            console.log e
            console.log nroute
            console.log oroute
            console.log $route.current


app.factory 'authInterceptor',($rootScope,$q,$window,authService,getToken)->
    request:(cfg)->
        cfg.headers = cfg.headers or {}
        if authService.hasData()
            cfg.headers.Authorization = "Bearer #{getToken()}"
        return cfg
    response:(res)->
        if res.status == 401
            console.log 'error'
            #send to login
        return res

app.config ($httpProvider)->
    $httpProvider.interceptors.push 'authInterceptor'

app.factory 'getToken',(sessionStorage)->
    return ()->
        return sessionStorage.get 'token'


app.factory 'logout',($http,sessionStorage)->
    return ()->
        sessionStorage.remove 'token'
        return $http.post('/api/v1/logout')


app.factory 'login',($http,sessionStorage,$q)->
    return (email,pw)->
        def = $q.defer()
        $http.post('/api/v1/authenticate',
            email:email
            password:pw
        ).then (res)->
            if res.data.token
                sessionStorage.set 'token',res.data.token
                def.resolve res.data.token
            else
                def.reject 'err'
            return
        return def.promise

app.factory 'base64Encode',($window)->
    return (data)->
        output = data.replace(/-/g, '+').replace(/_/g, '/')
        if output.length % 4 == 0
            console.log('pass')
        else if output.length % 4 == 2
             output += '=='
        else if output.length % 4 == 3
             output += '='
        else
            console.error 'Illegal base64url string!'
            return false
        return decodeURIComponent(escape($window.atob(output)))

app.factory 'decodeToken',($window)->
    return (tkn)->
        parts = tkn.split('.')
        header = parts[0]
        payload = parts[1]
        console.log payload
        return angular.fromJson(window.atob(payload))

app.service 'authService',($rootScope,tokenService)->
    userData = {}
    self = @

    tokenService().then (res)->
        userData = res

    self.hasData = ()->
        return userData != {}
    self.getData = ()->
        if self.hasData()
            return userData
        return false
    self.getUsername = ()->
        return userData.username
    self.getEmail = ()->
        return userData.emails[0].address
    self.getAvatar = ()->
        return userData.avatar
    return

app.factory 'sessionStorage',($window)->
    storage = $window.sessionStorage
    get : (key)->
        return storage.getItem key
    set : (key,val)->
        return storage.setItem key,val
    has : (key)->
        return key in Object.keys(storage)
    remove : (key)->
        delete storage[key]
        return

app.factory 'tokenService',($q,sessionStorage,decodeToken)->
    return ()->
        def = $q.defer()
        if sessionStorage.has 'token'
            token = sessionStorage.get 'token'
            def.resolve(decodeToken(token))
        else
            def.reject 'no token'
        return def.promise

app.directive 'tstDir',()->
    restrict:"E"
    link:(scope,ele,attrs)->
        createLi = (data)->
            return angular.element(document.createElement('li')).text data
        e = angular.element(document.createElement('ul'))
        angular.forEach Object.keys(attrs.$attr),(itm)->
            e.append(createLi(attrs[itm]))
            return
        ele.html e.html()
        console.log attrs
        return

app.directive 'confirmConfirm',()->
    restrict:"A"
    require:"ngModel"
    link:(scope,ele,attrs,ctrl)->
        conf = angular.element(document.getElementById('password_confirm')).val()
        ctrl.$validators.confirm = (data)->
            return data == conf
        return

app.directive 'passwordConfirm',()->
    restrict:"A"
    require:"ngModel"
    link:(scope,ele,attrs,ctrl)->
        pw = angular.element(document.getElementById('new_password')).val()
        ctrl.$validators.confirm = (data)->
            return data == pw
        return

app.directive 'accessControl',($dropdown)->
    restrict:"E"
    require:"?dropdown"
    link:(scope,ele,attrs,ctrl)->
        console.log 'here',ctrl
        dpdn = $dropdown ele,
            scope :
                content:
                    text:'foo'
                    href:''
                    click:''
