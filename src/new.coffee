'use strict'

app = angular.module 'editor.app',[
  'ngRoute'
  'ui.ace'
  'mgcrea.ngStrap'
  'ui.bootstrap'
  'auth.app'
]

app.constant 'apiPrefix','/api/v1'

app.factory 'aceLoaded',()->
    return (_editor)->
        _sess = _editor.getSession()
        _rend = _editor.renderer
        _rend.setFontSize 20
        console.log _rend,_sess,_editor
        return


app.directive 'closeBtn',(removeFile)->
    restrict:'E'
    template:"<span class='close'>X</span>"
    link:(scope,ele,attrs)->
        console.log attrs
        proj_id = attrs['projId']
        ele.on 'click', ()->
            ele.parent().remove()
            removeFile proj_id
            return
        return

app.filter 'update',()->
    return (data)->
        return data

app.factory 'removeProject',($http,apiPrefix)->
    return (proj_id)->
        return $http.post "#{apiPrefix}/delete/project",
            object_id:proj_id

app.factory 'removeFile',($http,apiPrefix)->
    return (file_id)->
        return $http.post "#{apiPrefix}/delete/document",
            object_id:file_id

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
    require:"tzNav"
    controller:($scope,$element,$attrs,authService)->
      $scope.status = {}
      $scope.status.isopen = false
      $scope.authenticated = authService.hasData()
      $scope.getUserName = ()->
        return authService.getData().username
      $scope.getEmail = ()->
        return authService.getData().emails[0]
      $scope.getAvatar = ()->
        return authService.getData().avatar
      return
    link:(scope,ele,attrs,ctrl)->
      return


app.factory 'viewCount',($http,apiPrefix)->
    return $http.get "#{apiPrefix}/viewcount"

app.factory 'collections',(collectUsers,projectService)->
  return (itm)->
        rtn =
            user:collectUsers
            project:projectService.getProjects
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
    ).when('/login',
      templateUrl:'auth.html'
      controller:($scope,login,$uiModal)->
        $scope.newuser =
            username:''
            email:''
            password:''
            confirm:''
          $scope.user =
            email:''
            password:''
        $scope.login = ()->
          login($scope.user.email,$scope.user.password).then (res)->
            modal = $uiModal.open

        $scope.loginMode = true
        $scope.setLoginMode = ()->
            $scope.registerMode = false
            $scope.loginMode = true
            return
        $scope.setRegisterMode = ()->
            $scope.registerMode = true
            $scope.loginMode = false
            return
          $scope.isActiveClass = (type)->
            map =
              register:$scope.registerMode
              login:$scope.loginMode
            return map[type]
        return
    ).when('/register',
      templateUrl:'auth.html'
      controller:($scope)->
          $scope.newuser =
            username:''
            email:''
            password:''
            confirm:''
          $scope.user =
            email:''
            password:''
          $scope.registerMode = true
          $scope.setLoginMode = ()->
            $scope.registerMode = false
            $scope.loginMode = true
            return
          $scope.setRegisterMode = ()->
            $scope.registerMode = true
            $scope.loginMode = false
            return
          $scope.isActiveClass = (type)->
            map =
              register:$scope.registerMode
              login:$scope.loginMode
            return map[type]
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
        controller:($uiModal,$scope,$routeParams,collectProjects,collectUsers,collections,addProject,removeProject,authService,projectService)->
            console.log $routeParams
            console.log $routeParams.item
            $scope.item = $routeParams.item
            #collectProjects().then (r)->
            #  console.log('result---->',r)
            #  $scope.coll = r
            #  return
            updateColl = ()->
              $scope.coll = projectService.getProjects()
              return
            updateColl()
            $scope.checkMode = ($event,proj_id)->
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
                        projectService.removeProject(proj_id).then (res)->
                            if not res
                                $scope.removeError = true
                            return
                        $scope.removeMode = false
                        
                        updateColl()
                        console.log projectService.getProjects()
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
            #collections($scope.item).then (res)->
            #    console.log res
            #    $scope.coll = res
            $scope.getUrl = (itm)->
                return "#{$scope.item}/profile/#{itm._id.$oid}"
            $scope.addProject = ()->
                userData = authService.getData()
                console.log('User:--->',userData)
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
                    console.log('proj data--->',res)
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
        controller:($uiModal,$scope,$routeParams,collections,collectUsers,collectProjects,addFile,back,removeFile)->
            colls =
                user:collectUsers
                project:collectProjects
            $scope.back = back
            $scope.item = $routeParams.item
            console.log $scope.item
            $scope.route_id = $routeParams.id
            console.log $scope.route_id
            $scope.deleteConfirm = (file_id)->
                removeFile(file_id).then (res)->
                    if res
                        collectProjects().then (r)->
                            $scope.coll = r
                            angular.forEach $scope.coll, (itm)->
                                if itm._id.$oid == parseInt $scope.route_id
                                    $scope.profile = itm
                                return
                    return
                return
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
                project(p._id.$oid).then (res)->

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

app.factory 'addProject',($http,apiPrefix,authService)->
    user_id = authService.getData().id
    return (name)->      
        return $http.post "#{apiPrefix}/create/project",
            name:name
            user:user_id



app.factory 'collectProjects',($q,projects)->
    _projs = []
    def = $q.defer()
    projects().then (res)->

        console.log('projects',res.data.projects)
        angular.forEach res.data.projects,(itm)->
            _itm = angular.fromJson itm
            console.log('fixed: ', _itm)
            _projs.push _itm
            return
        if _projs.length > 0
          def.resolve _projs
        else
          def.reject 'no projects'
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

app.service 'projectService',($q,Project,projects,addProject,removeProject)->
  self = @  
  _projects = []
    
  projects().then (res)->
    angular.forEach res.data.projects,(itm)->
      _projects.push itm
      return
    return
  self.getProjects = ()->
    return _projects
  self.getProject = (pid)->
    return Project pid
  self.addProject = (name)->
    addProject(name).then (res)->
      if obj = res.data.object
        _projects.push obj
      return
    return
  self.removeProject = (pid)->
    def = $q.defer()
    removeProject(pid).then( (res)->
      if res.data.result
        idx = undefined
        angular.forEach _projects,(itm,_idx)->
          if itm._id.$oid == pid
            idx = _idx
        if not angular.isUndefined(idx)
          console.log('splicing idx',idx)
          _projects.splice(idx,1)
          console.log _projects
        def.resolve(res.data.result)
        return
    )    
    return def.promise
  return self
