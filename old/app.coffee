'use strict'

fromJson = angular.fromJson
equals = angular.equals
forEach = angular.forEach

app = angular.module 'editor.app',[]

app.factory 'login', ($http)->
    return (id)->
        payload =
            id : id
        return $http.post '/api/v1/login', payload

app.factory 'files',($http)->
    return (pid)->
        return $http.get "/api/v1/files/#{pid}"

app.factory 'saveFile',($http)->
    return (file,content)->
        payload =
            id:file._id
            content:content
        return $http.post '/api/v1/save',payload

app.factory 'projects',($q,$http,login)->
    return (id)->
        def = $q.defer()
        login(id).then (res)->
            if angular.fromJson(res.data).result == 'success'
                $http.get('/api/v1/projects').then (res)->
                    def.resolve res.data
            else
                def.reject res.data
        return def.promise

app.factory 'createFile',($http)->
    return (data)->
        return $http.post '/api/v1/files/create',data

app.service 'allProjects',($q,projects,users)->
    projs = []
    self = @
    users.then (res)->
        $q.when(self.users = res.data.objects.map (itm)->
            return fromJson itm
        ).then ()->
            self.users.map (itm)->
                _id = itm._id
                if _id
                    oid = _id.$oid
                else
                    oid = false
                if oid
                    projects(oid).then (res)->
                        projs.push res.projects
                        return
                return
            return
        return
    self.getProjects = ()->
        return projs.map (itm)->
            return fromJson itm[0]

    self.getProject = (pid)->
        return projs.filter (itm)->
            if itm._id
                if itm._id.$oid
                    id = itm._id.$oid
                else
                    id = itm._id
            else
                id = itm.id
            return id == pid
    self.addFileToProject = (file,proj)->
        forEach projs,(itm)->
            if equals(itm._id,proj._id)
                itm.files.push file
                return
    self.getUsers = ()->
        return self.users
    return





app.factory 'makeFile',(createFile,allProjects)->
    return (name,project)->
        console.log project
        createFile
            name:name
            project:
                "$oid":project._id.$oid
        .then (res)->
            console.log res
            file = angular.fromJson res.data.obj
            console.log file
            project.files.push file
            console.log project
            allProjects.addFileToProject file,project
            return
        return

        

app.factory 'users',($http)->
    return $http.get '/api/v1/user'

app.service 'currentFile',()->
    name = ''
    content = ''
    project = ''
    _id = ''

    self = @
    self.set_current = (fle)->
        name = fle.name
        content = fle.content
        project = fle.project
        if angular.isString fle._id
            _id = fle._id
        else
            _id = fle._id.$oid
        return
    self.get_current = ()->
        rtn =
            name:name
            content:content
            project:project
            _id:_id
        return rtn
    return

app.controller 'MainCtrl',($window,$scope,$q,$rootScope,users,projects,files,currentFile,saveFile,makeFile,allProjects)->
    self = @
    $scope.editorData = {}
    update = ()->
        $scope.projects = forEach allProjects.getProjects(),(itm)->
            return fromJson itm[0]
    $scope.$watchCollection 'projects',(o,n)->
        console.log 'watching'
        self.projects = n
        update()
    ###    
    users.then (res)->
        $q.when(self.users = res.data.objects.map (itm)->
            return angular.fromJson itm
        ).then ()->
            _id = self.users[0]._id
            if _id
                oid = _id.$oid
            else
                oid = false
            if oid
                projects(oid).then (res)->
                    self.projects = res.data
                    return
            return
        return
    ###
    self.updateProjects = ()->
        self.projects = allProjects.getProjects().map (itm)->
            return fromJson itm
        self.users = allProjects.getUsers()
    self.updateProjects()
    self.get_projects = (oid)->
        $q.when(projects(oid)).then (res)->
            $q.when(res).then ()->
                self.projects = res.projects.map (itm)->
                    return fromJson itm
                return
            return
        return
    self.get_files = (oid)->
        files(oid).then (res)->
            return self.files = res.data.files.map (itm)->
                return angular.fromJson itm
        return
    self.set_file = (file)->
        currentFile.set_current file
        $scope.editorData.content = file.content
        self.showEditor = true
        return
    self.get_all_files = ()->
        self.projects.map (itm)->
            self.get_files(itm._id.$oid).then (res)->
                itm.files = res
                console.log res
                return
            return
        return
    self.close = ()->
        self.showEditor = false

    self.save = (c)->
        current = currentFile.get_current()
        saveFile(current,c)
        $scope.editorData.content = c
        current.content = c
        idx = -1
        for itm in self.files
            if itm._id
                if itm._id.$oid == current.id
                    idx = self.files.indexOf itm
                    self.files.splice idx,1
                    self.files.push current
            else
                if itm.id
                    if itm.id == current.id
                        idx = self.files.indexOf itm
                        self.files.splice idx,1
                        self.files.push current
        self.get_all_files()
        return
    self.add_file = (project)->
        console.log 'hmmm'
        name = $window.prompt "What name:"
        makeFile name,project
        console.log "made #{name}, and added to #{project.name}"

        return
    return
            

