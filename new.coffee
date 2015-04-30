'use strict'

app = angular.module 'editor.app',['ngRoute']

app.constant 'apiPrefix','/api/v1'


app.factory 'viewCount',($http,apiPrefix)->
    return $http.get "#{apiPrefix}/viewcount"

app.factory 'collections',(collectUsers,collectProjects)->
    return (itm)->
        rtn =
            user:collectUsers
            project:collectProjects
        return rtn[itm]()


app.config ($routeProvider,$locationProvider)->
    $routeProvider.when( '/',
        templateUrl:'home.html'
        controller:($scope)->
            return
    ).when('/test',
        templateUrl:'test.html'
        controller:($scope,collectProjects,collectUsers)->
            $scope.users = []
            $scope.projects = []
            $scope.collectUsers = collectUsers
            $scope.users = collectUsers()
            $scope.projects = collectProjects()
            return
    ).when('/:item/list',
        templateUrl:'list.html'
        controller:($scope,$routeParams,collectProjects,collectUsers,collections)->
            console.log $routeParams
            console.log $routeParams.item
            $scope.item = $routeParams.item
            collections($scope.item).then (res)->
                console.log res
                $scope.coll = res
            $scope.getUrl = (itm)->
                return "#{$scope.item}/profile/#{itm._id.$oid}"
            return
    ).when('/:item/profile/:id',
        templateUrl:'profile.html'
        controller:($scope,$routeParams,collections,collectUsers,collectProjects)->
            colls =
                user:collectUsers
                project:collectProjects
            $scope.item = $routeParams.item
            console.log $scope.item
            $scope.route_id = $routeParams.id
            console.log $scope.route_id
            $scope.getProjectName = (p)->
                project(p.$oid).then (res)->

                



            if $scope.item == 'user'
                collectUsers().then (res)->
                    console.log res
                    $scope.coll = res
                    console.log $scope.coll
                    angular.forEach $scope.coll, (itm)->
                        console.log itm,$scope.route_id
                        if itm._id.$oid == $scope.route_id
                            $scope.profile = itm
                        return
                return
            else
                collectProjects().then (res)->
                    console.log res
                    $scope.coll = res
                    angular.forEach $scope.coll, (itm)->
                        console.log itm,$scope.route_id
                        if itm._id.$oid == $scope.route_id
                            $scope.profile = itm
                        return
                return
    )
    .when('/dash',
        templateUrl:"dash.html"
        controller:($q,$scope,collectProjects,collectUsers)->
            $q.when([
                collectProjects(),
                collectUsers()
            ]).then (r1,r2)->
                $scope.users = r2
                $scope.projects = r1
                return
            return
    )
    $locationProvider.html5Mode true
    return

app.controller 'footerCtrl',($scope,viewCount)->
    viewCount.then (res)->
        $scope.vc = res.data.count


app.factory 'collectProjects',($q,projects)->
    _projs = []
    def = $q.defer()
    projects().then (res)->
        console.log(res.data.objects)
        angular.forEach res.data.objects,(itm)->
            _itm = angular.fromJson itm
            console.log _itm
            _projs.push _itm
        return def.resolve _projs
    return ()->
        def.promise

app.factory 'collectUsers',($q,users,User)->
    _users = []
    def = $q.defer()
    users().then (res)->
        console.log(res.data)
        angular.forEach angular.fromJson(res.data.objects),(itm)->
            _users.push(angular.fromJson(itm))
            console.log itm
            if itm._id
                User(itm._id.$oid).then (res)->
                    console.log(res.data)
                    return
        def.resolve _users
    return ()->
        return def.promise

app.filter 'count',()->
    return (data)->
        if angular.isObject data
            return Object.keys(data).length
        else
            if data and data.length
                return data.length
        return 0


app.factory 'User',($http,apiPrefix)->
    return (oid)->
        return $http.get "#{apiPrefix}/user/#{oid}"

app.factory 'users',($http,apiPrefix)->
    return ()->
        return $http.get "#{apiPrefix}/user"

app.factory 'Project',($http,apiPrefix)->
    return (oid)->
        return $http.get "#{apiPrefix}/project/#{oid}"

app.factory 'projects',($http,apiPrefix)->
    return ()->
        return $http.get "#{apiPrefix}/project"




