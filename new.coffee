'use strict'

app = angular.module 'editor.app',[
  'ngRoute'
  'ui.ace'
  'ui.bootstrap'
  'auth.app'
]

app.constant 'apiPrefix','/api/v1'

app.service '$uiModal',($modal)->
    return $modal

app.controller 'CollapseCtrl',($scope)->
    self = @
    self.oneAtATime = true
    group1 =
        title: 'Dynamic Group Header - 1'
        content: 'Dynamic Group Body - 1'
    group2 =
        title: 'Dynamic Group Header - 2'
        content: 'Dynamic Group Body - 2'
    self.groups = [
        group1
        group2
    ]
    self.items = [
        'Item 1'
        'Item 2'
        'Item 3'
    ]
    self.addItem = ->
        newItemNo = $scope.items.length + 1
        $scope.items.push 'Item ' + newItemNo
        return
        
    self.status =
        isFirstOpen: true
        isFirstDisabled: false
    return
        


app.factory 'profile',()->
    return (type)->
        self = @
        collType = "#{type}s"
        self[collType] = {}
        self.collection = self[collType]
        self.type = type

        self.addItem = (itm)->
            self.collection.push itm
            return
        self.removeItem = (itm)->
            if itm in self.collection
                idx = self.collection.indexOf itm
                self.collection.splice idx,1
            return
        self.getType = ()->
            return self.type
        return self

app.factory 'aceLoaded',()->
    return (_editor)->
        _sess = _editor.getSession()
        _rend = _editor.renderer
        _rend.setFontSize 20
        console.log _rend,_sess,_editor
        return

app.directive 'closeBtn',(removeFile)->
    require:"closeBtn"
    restrict:'E'
    template:"<span class='close'>X</span>"
    controller:($scope,$element,$attrs)->
        self = @
        self.removeItem = ()->
            $element.parent().parent().parent().remove()
            console.log 'starting removal of file:',$attrs['projId']
            removeFile($attrs['projId']).then (res)->
                console.log 'received confirmation of file removal'
                $scope.$emit('item:delete:file',parseInt($attrs['projId']))
            return
        return
    link:(scope,ele,attrs,ctrl)->
        console.log attrs
        proj_id = attrs['projId']
        ele.on 'click', ()->
            ctrl.removeItem()
            return
        return

app.directive 'ngHover',()->
    require:"closeBtn"
    restrict:"A"
    link:(scope,ele,attrs,ctrl)->
        console.log ele
        ele.on('mouseenter',(e)->
            console.log 'entering',e
            _e = ele.children().children()[0]
            console.log _e
            ele.addClass 'hover'
            #_e.focus()
            return
        )
        ele.on('mouseleave',(e)->
            console.log 'leaving',e
            ele.removeClass 'hover'
            return
        )
        ele.on('click',(e)->
            #_e = ele.children().children()[0]
            #_e.trigger('click')
            ctrl.removeItem()
            return
        )
        return


app.filter 'update',()->
    return (data)->
        return data

app.filter 'count',()->
    return (data)->
        if angular.isObject(data) then Object.keys(data).length else data.length

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

app.filter 'fileType',(editorModes)->
    return (name)->
        _ext = name.split('.')[-1..][0]
        rtn = 'unkknown'
        angular.forEach editorModes,(val,key)->
            ext = key
            console.log ext
            console.log _ext
            console.log val
            console.log name
            if ext == _ext
                rtn = val
            return
        return rtn

app.factory 'getMode',(editorModes)->
    return (ext)->
        return editorModes[ext]

app.directive 'changeSize',()->
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

app.directive 'tzNav',(authService)->
    restrict:"E"
    templateUrl:"navbar.html"
    replace:true
    require:"?tzNav"
    link:($scope,ele,attrs,ctrl)->
      $scope.$on('auth:logout',()->
          authService.reset()
          return
      )
      $scope.status = {}
      $scope.status.isopen = false
      $scope.updateAuth = ()->
          $scope.authenticated = authService.hasData()
          return
      $scope.updateAuth()
      $scope.getUserName = ()->
        return authService.getData().username
      $scope.getEmail = ()->
          if authService.getData().emails and authService.getData().emails.length > 0
              return authService.getData().emails[0]
      $scope.getAvatar = ()->
        return authService.getData().avatar
      return


app.factory 'updateCollection',($q,collections)->
    return (scope)->
        def = $q.defer()
        collections(scope.item).then (res)->
            scope.coll = res
            return def.resolve scope
        return def.promise

app.factory 'processLogin',($q,login)->
    return (creds)->
        def = $q.defer()
        login(creds.username,creds.password).then (res)->
            console.log 'loggin in',res
            if res and not angular.isObject(res)
                def.resolve res
            else
                def.reject 'error'
            return
        ,(err)->
            console.log 'Rejecting again@!'
            return def.reject err
        return def.promise
        

app.factory 'viewCount',($http,apiPrefix)->
    return $http.get "#{apiPrefix}/viewcount"

app.factory 'collections',(collectUsers,projectService)->
  return (itm)->
        rtn =
            user:collectUsers
            project:projectService.getProjectsPromise
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
    ).when('/logout',
            controller:($rootScope,logout)->
                $rootScope.$broadcast 'auth:logout'
                return logout()
    ).when('/login',
      templateUrl:'auth.html'
      controller:($scope,processLogin,$uiModal,$window,$location)->
        $scope.resetForm = ()->
            $scope.newuser =
                username:''
                email:''
                password:''
                confirm:''
              $scope.user =
                email:''
                password:''
            return
        $scope.resetForm()
        $scope.login = ()->
            processLogin({username:$scope.user.email,password:$scope.user.password}).then (res)->
                console.log 'logging ???',res
                if res
                    template = 'myLoginModal.html'
                else
                    template = 'myLoginErrorModal.html'

                modal = $uiModal().open
                    templateUrl: template
                    scope:$scope.$new()
                modal.result.then (res)->
                    $location.path('/project/list').replace()
                    $window.location.href = $location.path()
                    console.log res
                    return
                  ,(err)->
                    console.log 'ERROR:=-->',err
                    return
                return
            ,(err)->
                template = 'myLoginErrorModal.html'
                modal = $uiModal.open
                    templateUrl: template
                    scope:$scope.$new()
                modal.result.then (res)->
                    $scope.resetForm()
                    console.log res
                    return
                ,(err)->
                    console.log 'ERROR:=-->',err
                    return
                console.log 'NewError-0->',err
                return
            return
               
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
      controller:($scope,register)->
          $scope.register = ()->
              register($scope.newuser.username,$scope.newuser.password,$scope.newuser.email).then (res)->
                  console.log res
                  return
              return
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
        controller:($uiModal,$scope,$routeParams,addProject,removeProject,authService,projectService,updateCollection)->
            console.log $routeParams
            console.log $routeParams.item
            $scope.item = $routeParams.item
            updateColl = ()->
              updateCollection($scope)
              return
            updateColl()
            $scope.$watch('coll',(newColl)->
                updateColl()
            )
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
            $scope.getUrl = (itm)->
                return "#{$scope.item}/profile/#{itm._id.$oid}"
            $scope.addProject = ()->
                userData = authService.getData()
                console.log('User:--->',userData)
                _s = $scope.$new(false,$scope)
                _s.testVar = 'ttttttttt'
                modal = $uiModal.open
                    controller:($scope,$modalInstance)->
                        $scope.project = {}
                        $scope.project.name = ''
                    controllerAs:'ng-controller as ctrl'
                    title:'Add a project'
                    templateUrl: 'myModalContent.html'
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
        controller:($q,$rootScope,$modal,$scope,$routeParams,updateCollection,addFile,back,removeFile)->
            $rootScope.$on 'item:delete:file',(e,file_id)->
                console.log "deleting file ##{file_id}"
                $scope.removeFileFromProfile file_id
                return

            $scope.removeFileFromProfile = (file_id)->
                idx = -1
                angular.forEach $scope.profile.files,(itm)->
                    console.log "#{file_id} vs #{itm._id.$oid}"
                    if file_id == itm._id.$oid
                        idx = $scope.profile.files.indexOf itm
                    return
                if idx > -1 then (($scope.profile.files.splice(idx,1) and true) or 'error removing file')  else false
            $scope.back = back
            $scope.item = $routeParams.item
            $scope.route_id = $routeParams.id
            $scope.deleteConfirm = (file_id)->
                removeFile(file_id).then (res)->
                    $scope.removeFileFromProfile file_id
                    if res
                        $q.when(updateCollection($scope)).then ()->
                            angular.forEach $scope.coll, (itm)->
                                if itm._id.$oid == parseInt $scope.route_id
                                    console.log "setting profile to item ##{itm._id.$oid}"
                                    $scope.profile = itm
                                return
                            return
                        
                    return
                return
            $scope.addFile = ()->
                modal = $modal.open
                    controller:($scope,$modalInstance)->
                        $scope.file = {}
                        $scope.file.name = ''
                    title:'Add a new file'
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
                return
            $q.when(updateCollection($scope)).then ()->
            #if $scope.item == 'user'
            #    collectUsers().then (res)->
            #        console.log res
            #        $scope.coll = res
                angular.forEach $scope.coll, (itm)->
                    if itm._id.$oid == parseInt $scope.route_id
                        $scope.profile = itm
                        console.log "setting profile to item##{$scope.route_id}"
                    return
                return
            #else
            #    collectProjects().then (res)->
            #        console.log res
            #        $scope.coll = res
            #        angular.forEach $scope.coll, (itm)->
            #            console.log itm,$scope.route_id
            #            if itm._id.$oid == parseInt $scope.route_id
            #                $scope.profile = itm
            #                console.log "setting profile to item##{$scope.route_id}"
            #            return
            #    return
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
        controller:(ngAlert,$scope,$routeParams,fileService,$q,File,saveFile,getMode,aceCfg)->
            $scope.save = (content)->
                data =
                    content : content
                    name : $scope.file.name
                saveFile($scope.file._id.$oid,data).then (res)->
                    console.log(res.data)
                    alert = ngAlert
                        title: 'Saved'
                        content: "You successfully saved #{res.data.obj.name}"
                        placement: 'top'
                        type: 'success'
                        show: true
                        duration:9
                        container:angular.element(document.getElementById('alert-container'))
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
        return $http.get "#{apiPrefix}/get/user"

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
  self.getProjectsPromise = ()->
    def = $q.defer()
    def.resolve self.getProjects()
    return def.promise
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
