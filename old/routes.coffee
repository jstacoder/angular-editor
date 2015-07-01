app = angular.module 'route.app',['ngRoute']

app.config ($routeProvider,$locationProvider)->
    $locationProvider.html5Mode true

    $routeProvider.when '/',
        templateUrl:"home.html"
    return

