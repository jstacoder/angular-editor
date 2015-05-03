'use strict'

app = angular.module 'editor.app',['ngRoute','ui.ace','mgcrea.ngStrap','ui.bootstrap','auth.app']

app.constant 'apiPrefix','/api/v1'

app.factory 'aceLoaded',()->
    return (_editor)->
        _sess = _editor.getSession()
        _rend = _editor.renderer
        _rend.setFontSize 20
        console.log _rend,_sess,_editor
        return


app.factory 'aceCfg',(aceLoaded)->
    rtn =
      onload:aceLoaded
      require: ['ace/ext/language_tools']
      advanced:
          enableSnippets: true
          enableBasicAutocompletion: true
          enableLiveAutocompletion: true
          rendererOptions:
                fontSize:20
      useWrapMode:true
      lineNumbers:true
      showGutter:true
      theme:'twilight'
      mode:'javascript'
    return rtn

app.value 'editorModes',
    'js':'javascript'
    'coffee':'coffeescript'
    'py':'python'
    'html':'html'
    'php':'php'
    'c':'c'
    'h':'c'

app.factory 'getMode',(editorModes)->
    return (ext)->
        return editorModes[ext]

app.directive 'size',()->
    restrict:"A"
    scope:
        size:"@"
    link:(scope,ele,attrs)->
        angular.element(document.getElementsByClassName('ace_editor')).css({'font-size':"#{attrs.size}px"})

app.directive 'tzFooter',()->
    restrict:"E"
    templateUrl:"footer.html"
    controller:($scope,viewCount)->
        viewCount.then (res)->
            $scope.vc = res.data.count

app.directive 'tzNav',()->
    restrict:"E"
    templateUrl:"navbar.html"
    replace:true


app.factory 'viewCount',($http,apiPrefix)->
    return $http.get "#{apiPrefix}/viewcount"

app.factory 'collections',(collectUsers,collectProjects)->
    return (itm)->
        rtn =
            user:collectUsers
            project:collectProjects
        return rtn[itm]()


app.factory 'back',($location,$window)->
    return ()->
        $location.state([
            $window.history.back()
        ]).replace()
        return

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
            collectUsers().then (res)->
                console.log res
                $scope.users = res
                return
            collectProjects().then (res)->
                console.log res
                $scope.projects = res
                return
            return
    ).when('/:item/list',
        templateUrl:'list.html'
        controller:($uiModal,$scope,$routeParams,collectProjects,collectUsers,collections,addProject)->
            console.log $routeParams
            console.log $routeParams.item
            $scope.item = $routeParams.item
            $scope.checkMode = ($event)->
                console.log($event)
                if $scope.removeMode
                    $event.preventDefault()
                    $event.stopPropagation()
                    modal = $uiModal.open
                        controller:($scope,$modalInstance)->
                            $scope.project = {}
                            $scope.project.name = $event.srcElement.innerText
                            $scope.title = 'Confirm Delete'
                        templateUrl: 'deleteProjectModal.html'
                    modal.result.then( (res)->
                        console.log res
                        angular.element($event.srcElement).remove()
                        $scope.removeMode = false
                        return
                    ,(err)->
                        console.log err
                        $scope.removeMode = false
                        return
                    )
                return
            $scope.removeProjectMode = ()->
                $scope.removeMode = true
                return
            $scope.testVar = 'testing 1,2,3'
            $scope.items = ['x','y','a']
            collections($scope.item).then (res)->
                console.log res
                $scope.coll = res
            $scope.getUrl = (itm)->
                return "#{$scope.item}/profile/#{itm._id.$oid}"
            $scope.addProject = ()->
                _s = $scope.$new({testVar:'cccccc'})
                _s.testVar = 'ttttttttt'
                modal = $uiModal.open
                    controller:($scope,$modalInstance)->
                        $scope.project = {}
                        $scope.project.name = ''
                        
                    controllerAs:'ng-controller as ctrl'
                    title:'testModal'
                    templateUrl: 'myModalContent.html'
                    resolve:
                        items:()->
                            return $scope.items
                modal.result.then( (res)->
                    console.log res
                    addProject(res).then (r)->
                        console.log r
                        $scope.coll.push r.data.object
                        return
                    return
                ,(err)->
                    console.log err
                    return
                )
                return
            return
    ).when('/:item/profile/:id',
        templateUrl:'profile.html'
        controller:($uiModal,$scope,$routeParams,collections,collectUsers,collectProjects,addFile,back)->
            colls =
                user:collectUsers
                project:collectProjects
            $scope.back = back
            $scope.item = $routeParams.item
            console.log $scope.item
            $scope.route_id = $routeParams.id
            console.log $scope.route_id
            $scope.addFile = ()->
                modal = $uiModal.open
                    controller:($scope,$modalInstance)->
                        $scope.file = {}
                        $scope.file.name = ''
                    title:'testModal'
                    templateUrl: 'myFileModal.html'
                modal.result.then( (res)->
                    console.log res
                    addFile($scope.route_id,res).then (r)->
                        console.log r
                        $scope.profile.files.push r.data.object
                        return
                    return
                ,(err)->
                    console.log err
                    return
                )
                    
            $scope.getProjectName = (p)->
                project(p.$oid).then (res)->

            if $scope.item == 'user'
                collectUsers().then (res)->
                    console.log res
                    $scope.coll = res
                    console.log $scope.coll
                    angular.forEach $scope.coll, (itm)->
                        console.log itm,$scope.route_id
                        if itm._id.$oid == parseInt $scope.route_id
                            $scope.profile = itm
                        return
                return
            else
                collectProjects().then (res)->
                    console.log res
                    $scope.coll = res
                    angular.forEach $scope.coll, (itm)->
                        console.log itm,$scope.route_id
                        if itm._id.$oid == parseInt $scope.route_id
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
    ).when('/file/:id/edit',
        templateUrl:'edit.html'
        controller:($alert,$scope,$routeParams,fileService,$q,File,saveFile,getMode,aceCfg)->
            $scope.save = (content)->
                data =
                    content : content
                    name : $scope.file.name
                saveFile($scope.file._id.$oid,data).then (res)->
                    console.log(res.data)
                    alert = $alert
                        title: 'Saved'
                        content: "You successfully saved #{res.data.obj.name}"
                        placement: 'top'
                        type: 'success'
                        show: true
                        duration:3
                        container:angular.element(document.getElementsByClassName('container')[0])
            setCfg = (opts)->
                angular.extend aceCfg, opts
                $scope.cfg = aceCfg
            
            File($routeParams.id).then (res)->
                    console.log res.data
                    $scope.file = res.data
                    name = $scope.file.name
                    ext = name.split('.')[name.split('.').length-1]
                    mode = getMode ext
                    setCfg
                        mode:mode
                    $scope.editorData = $scope.file.content
                return
            return
    )
    $locationProvider.html5Mode true
    return


app.factory 'addFile',($http,apiPrefix)->
    return (pid,name)->
        return $http.post "#{apiPrefix}/create/document",
            name:name
            project_id:pid

app.factory 'addProject',($http,apiPrefix)->
    return (name)->
        return $http.post "#{apiPrefix}/create/project",
            name:name



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

app.service 'fileService',(File)->
    self = @
    self.file = {}
    self.loadFile = (oid)->
        File(oid).then (res)->
            self.file = res.data
            return
        return
    self.getFile = ()->
        return self.file
    return

app.factory 'saveFile',($http,apiPrefix)->
    return (oid,data)->
        data['id'] = oid
        return $http.post "#{apiPrefix}/save" , data
            
app.factory 'File',($http,apiPrefix)->
    return (oid)->
        return $http.get "#{apiPrefix}/file/#{oid}"

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




