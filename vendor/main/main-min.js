'use strict';
var app,
  indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

app = angular.module('editor.app', ['ngRoute', 'ui.ace', 'ui.bootstrap', 'auth.app']);

app.constant('apiPrefix', '/api/v1');

app.service('$uiModal', ["$modal", function($modal) {
  return $modal;
}]);

app.controller('CollapseCtrl', ["$scope", function($scope) {
  var group1, group2, self;
  self = this;
  self.oneAtATime = true;
  group1 = {
    title: 'Dynamic Group Header - 1',
    content: 'Dynamic Group Body - 1'
  };
  group2 = {
    title: 'Dynamic Group Header - 2',
    content: 'Dynamic Group Body - 2'
  };
  self.groups = [group1, group2];
  self.items = ['Item 1', 'Item 2', 'Item 3'];
  self.addItem = function() {
    var newItemNo;
    newItemNo = $scope.items.length + 1;
    $scope.items.push('Item ' + newItemNo);
  };
  self.status = {
    isFirstOpen: true,
    isFirstDisabled: false
  };
}]);

app.factory('profile', function() {
  return function(type) {
    var collType, self;
    self = this;
    collType = type + "s";
    self[collType] = {};
    self.collection = self[collType];
    self.type = type;
    self.addItem = function(itm) {
      self.collection.push(itm);
    };
    self.removeItem = function(itm) {
      var idx;
      if (indexOf.call(self.collection, itm) >= 0) {
        idx = self.collection.indexOf(itm);
        self.collection.splice(idx, 1);
      }
    };
    self.getType = function() {
      return self.type;
    };
    return self;
  };
});

app.factory('aceLoaded', function() {
  return function(_editor) {
    var _rend, _sess;
    _sess = _editor.getSession();
    _rend = _editor.renderer;
    _rend.setFontSize(20);
    console.log(_rend, _sess, _editor);
  };
});

app.directive('closeBtn', ["removeFile", function(removeFile) {
  return {
    require: "closeBtn",
    restrict: 'E',
    template: "<span class='close'>X</span>",
    controller: ["$scope", "$element", "$attrs", function($scope, $element, $attrs) {
      var self;
      self = this;
      self.removeItem = function() {
        $element.parent().parent().parent().remove();
        console.log('starting removal of file:', $attrs['projId']);
        removeFile($attrs['projId']).then(function(res) {
          console.log('received confirmation of file removal');
          return $scope.$emit('item:delete:file', parseInt($attrs['projId']));
        });
      };
    }],
    link: function(scope, ele, attrs, ctrl) {
      var proj_id;
      console.log(attrs);
      proj_id = attrs['projId'];
      ele.on('click', function() {
        ctrl.removeItem();
      });
    }
  };
}]);

app.directive('ngHover', function() {
  return {
    require: "closeBtn",
    restrict: "A",
    link: function(scope, ele, attrs, ctrl) {
      console.log(ele);
      ele.on('mouseenter', function(e) {
        var _e;
        console.log('entering', e);
        _e = ele.children().children()[0];
        console.log(_e);
        ele.addClass('hover');
      });
      ele.on('mouseleave', function(e) {
        console.log('leaving', e);
        ele.removeClass('hover');
      });
      ele.on('click', function(e) {
        ctrl.removeItem();
      });
    }
  };
});

app.filter('update', function() {
  return function(data) {
    return data;
  };
});

app.filter('count', function() {
  return function(data) {
    if (angular.isObject(data)) {
      return Object.keys(data).length;
    } else {
      return data.length;
    }
  };
});

app.factory('removeProject', ["$http", "apiPrefix", function($http, apiPrefix) {
  return function(proj_id) {
    return $http.post(apiPrefix + "/delete/project", {
      object_id: proj_id
    });
  };
}]);

app.factory('removeFile', ["$http", "apiPrefix", function($http, apiPrefix) {
  return function(file_id) {
    return $http.post(apiPrefix + "/delete/document", {
      object_id: file_id
    });
  };
}]);

app.factory('aceCfg', ["aceLoaded", function(aceLoaded) {
  var rtn;
  rtn = {
    onload: aceLoaded,
    require: ['ace/ext/language_tools'],
    advanced: {
      enableSnippets: true,
      enableBasicAutocompletion: true,
      enableLiveAutocompletion: true,
      rendererOptions: {
        fontSize: 20
      }
    },
    useWrapMode: true,
    lineNumbers: true,
    showGutter: true,
    theme: 'twilight',
    mode: 'javascript'
  };
  return rtn;
}]);

app.value('editorModes', {
  'js': 'javascript',
  'coffee': 'coffeescript',
  'py': 'python',
  'html': 'html',
  'php': 'php',
  'c': 'c',
  'h': 'c'
});

app.filter('fileType', ["editorModes", function(editorModes) {
  return function(name) {
    var _ext, rtn;
    _ext = name.split('.').slice(-1)[0];
    rtn = 'unkknown';
    angular.forEach(editorModes, function(val, key) {
      var ext;
      ext = key;
      console.log(ext);
      console.log(_ext);
      console.log(val);
      console.log(name);
      if (ext === _ext) {
        rtn = val;
      }
    });
    return rtn;
  };
}]);

app.factory('getMode', ["editorModes", function(editorModes) {
  return function(ext) {
    return editorModes[ext];
  };
}]);

app.directive('changeSize', function() {
  return {
    restrict: "A",
    scope: {
      size: "@"
    },
    link: function(scope, ele, attrs) {
      return angular.element(document.getElementsByClassName('ace_editor')).css({
        'font-size': attrs.size + "px"
      });
    }
  };
});

app.directive('tzFooter', function() {
  return {
    restrict: "E",
    templateUrl: "footer.html",
    controller: ["$scope", "viewCount", function($scope, viewCount) {
      return viewCount.then(function(res) {
        return $scope.vc = res.data.count;
      });
    }]
  };
});

app.directive('tzNav', ["authService", function(authService) {
  return {
    restrict: "E",
    templateUrl: "navbar.html",
    replace: true,
    require: "?tzNav",
    link: function($scope, ele, attrs, ctrl) {
      $scope.$on('auth:logout', function() {
        authService.reset();
      });
      $scope.status = {};
      $scope.status.isopen = false;
      $scope.updateAuth = function() {
        $scope.authenticated = authService.hasData();
      };
      $scope.updateAuth();
      $scope.getUserName = function() {
        return authService.getData().username;
      };
      $scope.getEmail = function() {
        if (authService.getData().emails && authService.getData().emails.length > 0) {
          return authService.getData().emails[0];
        }
      };
      $scope.getAvatar = function() {
        return authService.getData().avatar;
      };
    }
  };
}]);

app.factory('updateCollection', ["$q", "collections", function($q, collections) {
  return function(scope) {
    var def;
    def = $q.defer();
    collections(scope.item).then(function(res) {
      scope.coll = res;
      return def.resolve(scope);
    });
    return def.promise;
  };
}]);

app.factory('processLogin', ["$q", "login", function($q, login) {
  return function(creds) {
    var def;
    def = $q.defer();
    login(creds.username, creds.password).then(function(res) {
      console.log('loggin in', res);
      if (res && !angular.isObject(res)) {
        def.resolve(res);
      } else {
        def.reject('error');
      }
    }, function(err) {
      console.log('Rejecting again@!');
      return def.reject(err);
    });
    return def.promise;
  };
}]);

app.factory('viewCount', ["$http", "apiPrefix", function($http, apiPrefix) {
  return $http.get(apiPrefix + "/viewcount");
}]);

app.factory('collections', ["collectUsers", "projectService", function(collectUsers, projectService) {
  return function(itm) {
    var rtn;
    rtn = {
      user: collectUsers,
      project: projectService.getProjectsPromise
    };
    return rtn[itm]();
  };
}]);

app.factory('back', ["$location", "$window", function($location, $window) {
  return function() {
    $location.state([$window.history.back()]).replace();
  };
}]);

app.config(["$routeProvider", "$locationProvider", function($routeProvider, $locationProvider) {
  $routeProvider.when('/', {
    templateUrl: 'home.html',
    controller: ["$scope", function($scope) {}]
  }).when('/logout', {
    controller: ["$rootScope", "logout", function($rootScope, logout) {
      $rootScope.$broadcast('auth:logout');
      return logout();
    }]
  }).when('/login', {
    templateUrl: 'auth.html',
    controller: ["$scope", "processLogin", "$uiModal", "$window", "$location", function($scope, processLogin, $uiModal, $window, $location) {
      $scope.resetForm = function() {
        $scope.newuser = {
          username: '',
          email: '',
          password: '',
          confirm: ''
        };
        $scope.user = {
          email: '',
          password: ''
        };
      };
      $scope.resetForm();
      $scope.login = function() {
        processLogin({
          username: $scope.user.email,
          password: $scope.user.password
        }).then(function(res) {
          var modal, template;
          console.log('logging ???', res);
          if (res) {
            template = 'myLoginModal.html';
          } else {
            template = 'myLoginErrorModal.html';
          }
          modal = $uiModal().open({
            templateUrl: template,
            scope: $scope.$new()
          });
          modal.result.then(function(res) {
            $location.path('/project/list').replace();
            $window.location.href = $location.path();
            console.log(res);
          }, function(err) {
            console.log('ERROR:=-->', err);
          });
        }, function(err) {
          var modal, template;
          template = 'myLoginErrorModal.html';
          modal = $uiModal.open({
            templateUrl: template,
            scope: $scope.$new()
          });
          modal.result.then(function(res) {
            $scope.resetForm();
            console.log(res);
          }, function(err) {
            console.log('ERROR:=-->', err);
          });
          console.log('NewError-0->', err);
        });
      };
      $scope.loginMode = true;
      $scope.setLoginMode = function() {
        $scope.registerMode = false;
        $scope.loginMode = true;
      };
      $scope.setRegisterMode = function() {
        $scope.registerMode = true;
        $scope.loginMode = false;
      };
      $scope.isActiveClass = function(type) {
        var map;
        map = {
          register: $scope.registerMode,
          login: $scope.loginMode
        };
        return map[type];
      };
    }]
  }).when('/register', {
    templateUrl: 'auth.html',
    controller: ["$scope", "register", function($scope, register) {
      $scope.register = function() {
        register($scope.newuser.username, $scope.newuser.password, $scope.newuser.email).then(function(res) {
          console.log(res);
        });
      };
      $scope.newuser = {
        username: '',
        email: '',
        password: '',
        confirm: ''
      };
      $scope.user = {
        email: '',
        password: ''
      };
      $scope.registerMode = true;
      $scope.setLoginMode = function() {
        $scope.registerMode = false;
        $scope.loginMode = true;
      };
      $scope.setRegisterMode = function() {
        $scope.registerMode = true;
        $scope.loginMode = false;
      };
      $scope.isActiveClass = function(type) {
        var map;
        map = {
          register: $scope.registerMode,
          login: $scope.loginMode
        };
        return map[type];
      };
    }]
  }).when('/test', {
    templateUrl: 'test.html',
    controller: ["$scope", "collectProjects", "collectUsers", function($scope, collectProjects, collectUsers) {
      $scope.users = [];
      $scope.projects = [];
      $scope.collectUsers = collectUsers;
      collectUsers().then(function(res) {
        console.log(res);
        $scope.users = res;
      });
      collectProjects().then(function(res) {
        console.log(res);
        $scope.projects = res;
      });
    }]
  }).when('/:item/list', {
    templateUrl: 'list.html',
    controller: ["$uiModal", "$scope", "$routeParams", "addProject", "removeProject", "authService", "projectService", "updateCollection", function($uiModal, $scope, $routeParams, addProject, removeProject, authService, projectService, updateCollection) {
      var updateColl;
      console.log($routeParams);
      console.log($routeParams.item);
      $scope.item = $routeParams.item;
      updateColl = function() {
        updateCollection($scope);
      };
      updateColl();
      $scope.$watch('coll', function(newColl) {
        return updateColl();
      });
      $scope.checkMode = function($event, proj_id) {
        var modal;
        console.log($event);
        if ($scope.removeMode) {
          $event.preventDefault();
          $event.stopPropagation();
          modal = $uiModal.open({
            controller: function($scope, $modalInstance) {
              $scope.project = {};
              $scope.project.name = $event.srcElement.innerText;
              return $scope.title = 'Confirm Delete';
            },
            templateUrl: 'deleteProjectModal.html'
          });
          modal.result.then(function(res) {
            console.log(res);
            angular.element($event.srcElement).remove();
            projectService.removeProject(proj_id).then(function(res) {
              if (!res) {
                $scope.removeError = true;
              }
            });
            $scope.removeMode = false;
            updateColl();
            console.log(projectService.getProjects());
          }, function(err) {
            console.log(err);
            $scope.removeMode = false;
          });
        }
      };
      $scope.removeProjectMode = function() {
        $scope.removeMode = true;
      };
      $scope.getUrl = function(itm) {
        return $scope.item + "/profile/" + itm._id.$oid;
      };
      $scope.addProject = function() {
        var _s, modal, userData;
        userData = authService.getData();
        console.log('User:--->', userData);
        _s = $scope.$new(false, $scope);
        _s.testVar = 'ttttttttt';
        modal = $uiModal.open({
          controller: function($scope, $modalInstance) {
            $scope.project = {};
            return $scope.project.name = '';
          },
          controllerAs: 'ng-controller as ctrl',
          title: 'Add a project',
          templateUrl: 'myModalContent.html'
        });
        modal.result.then(function(res) {
          console.log('proj data--->', res);
          addProject(res).then(function(r) {
            console.log(r);
            $scope.coll.push(r.data.object);
          });
        }, function(err) {
          console.log(err);
        });
      };
    }]
  }).when('/:item/profile/:id', {
    templateUrl: 'profile.html',
    controller: ["$q", "$rootScope", "$modal", "$scope", "$routeParams", "updateCollection", "addFile", "back", "removeFile", function($q, $rootScope, $modal, $scope, $routeParams, updateCollection, addFile, back, removeFile) {
      $rootScope.$on('item:delete:file', function(e, file_id) {
        console.log("deleting file #" + file_id);
        $scope.removeFileFromProfile(file_id);
      });
      $scope.removeFileFromProfile = function(file_id) {
        var idx;
        idx = -1;
        angular.forEach($scope.profile.files, function(itm) {
          console.log(file_id + " vs " + itm._id.$oid);
          if (file_id === itm._id.$oid) {
            idx = $scope.profile.files.indexOf(itm);
          }
        });
        if (idx > -1) {
          return ($scope.profile.files.splice(idx, 1) && true) || 'error removing file';
        } else {
          return false;
        }
      };
      $scope.back = back;
      $scope.item = $routeParams.item;
      $scope.route_id = $routeParams.id;
      $scope.deleteConfirm = function(file_id) {
        removeFile(file_id).then(function(res) {
          $scope.removeFileFromProfile(file_id);
          if (res) {
            $q.when(updateCollection($scope)).then(function() {
              angular.forEach($scope.coll, function(itm) {
                if (itm._id.$oid === parseInt($scope.route_id)) {
                  console.log("setting profile to item #" + itm._id.$oid);
                  $scope.profile = itm;
                }
              });
            });
          }
        });
      };
      $scope.addFile = function() {
        var modal;
        modal = $modal.open({
          controller: ["$scope", "$modalInstance", function($scope, $modalInstance) {
            $scope.file = {};
            return $scope.file.name = '';
          }],
          title: 'Add a new file',
          templateUrl: 'myFileModal.html'
        });
        modal.result.then(function(res) {
          console.log(res);
          addFile($scope.route_id, res).then(function(r) {
            console.log(r);
            $scope.profile.files.push(r.data.object);
          });
        }, function(err) {
          console.log(err);
        });
      };
      return $q.when(updateCollection($scope)).then(function() {
        angular.forEach($scope.coll, function(itm) {
          if (itm._id.$oid === parseInt($scope.route_id)) {
            $scope.profile = itm;
            console.log("setting profile to item#" + $scope.route_id);
          }
        });
      });
    }]
  }).when('/dash', {
    templateUrl: "dash.html",
    controller: ["$q", "$scope", "collectProjects", "collectUsers", function($q, $scope, collectProjects, collectUsers) {
      $q.when([collectProjects(), collectUsers()]).then(function(r1, r2) {
        $scope.users = r2;
        $scope.projects = r1;
      });
    }]
  }).when('/file/:id/edit', {
    templateUrl: 'edit.html',
    controller: ["ngAlert", "$scope", "$routeParams", "fileService", "$q", "File", "saveFile", "getMode", "aceCfg", function(ngAlert, $scope, $routeParams, fileService, $q, File, saveFile, getMode, aceCfg) {
      var setCfg;
      $scope.save = function(content) {
        var data;
        data = {
          content: content,
          name: $scope.file.name
        };
        return saveFile($scope.file._id.$oid, data).then(function(res) {
          var alert;
          console.log(res.data);
          return alert = ngAlert({
            title: 'Saved',
            content: "You successfully saved " + res.data.obj.name,
            placement: 'top',
            type: 'success',
            show: true,
            duration: 9,
            container: angular.element(document.getElementById('alert-container'))
          });
        });
      };
      setCfg = function(opts) {
        angular.extend(aceCfg, opts);
        return $scope.cfg = aceCfg;
      };
      File($routeParams.id).then(function(res) {
        var ext, mode, name;
        console.log(res.data);
        $scope.file = res.data;
        name = $scope.file.name;
        ext = name.split('.')[name.split('.').length - 1];
        mode = getMode(ext);
        setCfg({
          mode: mode
        });
        return $scope.editorData = $scope.file.content;
      });
      return;
    }]
  });
  $locationProvider.html5Mode(true);
}]);

app.factory('addFile', ["$http", "apiPrefix", function($http, apiPrefix) {
  return function(pid, name) {
    return $http.post(apiPrefix + "/create/document", {
      name: name,
      project_id: pid
    });
  };
}]);

app.factory('addProject', ["$http", "apiPrefix", "authService", function($http, apiPrefix, authService) {
  var user_id;
  user_id = authService.getData().id;
  return function(name) {
    return $http.post(apiPrefix + "/create/project", {
      name: name,
      user: user_id
    });
  };
}]);

app.factory('collectProjects', ["$q", "projects", function($q, projects) {
  var _projs, def;
  _projs = [];
  def = $q.defer();
  projects().then(function(res) {
    console.log('projects', res.data.projects);
    angular.forEach(res.data.projects, function(itm) {
      var _itm;
      _itm = angular.fromJson(itm);
      console.log('fixed: ', _itm);
      _projs.push(_itm);
    });
    if (_projs.length > 0) {
      return def.resolve(_projs);
    } else {
      return def.reject('no projects');
    }
  });
  return function() {
    return def.promise;
  };
}]);

app.factory('collectUsers', ["$q", "users", "User", function($q, users, User) {
  var _users, def;
  _users = [];
  def = $q.defer();
  users().then(function(res) {
    console.log(res.data);
    angular.forEach(angular.fromJson(res.data.objects), function(itm) {
      _users.push(angular.fromJson(itm));
      console.log(itm);
      if (itm._id) {
        return User(itm._id.$oid).then(function(res) {
          console.log(res.data);
        });
      }
    });
    return def.resolve(_users);
  });
  return function() {
    return def.promise;
  };
}]);

app.filter('count', function() {
  return function(data) {
    if (angular.isObject(data)) {
      return Object.keys(data).length;
    } else {
      if (data && data.length) {
        return data.length;
      }
    }
    return 0;
  };
});

app.service('fileService', ["File", function(File) {
  var self;
  self = this;
  self.file = {};
  self.loadFile = function(oid) {
    File(oid).then(function(res) {
      self.file = res.data;
    });
  };
  self.getFile = function() {
    return self.file;
  };
}]);

app.factory('saveFile', ["$http", "apiPrefix", function($http, apiPrefix) {
  return function(oid, data) {
    data['id'] = oid;
    return $http.post(apiPrefix + "/save", data);
  };
}]);

app.factory('File', ["$http", "apiPrefix", function($http, apiPrefix) {
  return function(oid) {
    return $http.get(apiPrefix + "/file/" + oid);
  };
}]);

app.factory('User', ["$http", "apiPrefix", function($http, apiPrefix) {
  return function(oid) {
    return $http.get(apiPrefix + "/user/" + oid);
  };
}]);

app.factory('users', ["$http", "apiPrefix", function($http, apiPrefix) {
  return function() {
    return $http.get(apiPrefix + "/get/user");
  };
}]);

app.factory('Project', ["$http", "apiPrefix", function($http, apiPrefix) {
  return function(oid) {
    return $http.get(apiPrefix + "/project/" + oid);
  };
}]);

app.factory('projects', ["$http", "apiPrefix", function($http, apiPrefix) {
  return function() {
    return $http.get(apiPrefix + "/project");
  };
}]);

app.service('projectService', ["$q", "Project", "projects", "addProject", "removeProject", function($q, Project, projects, addProject, removeProject) {
  var _projects, self;
  self = this;
  _projects = [];
  projects().then(function(res) {
    angular.forEach(res.data.projects, function(itm) {
      _projects.push(itm);
    });
  });
  self.getProjects = function() {
    return _projects;
  };
  self.getProjectsPromise = function() {
    var def;
    def = $q.defer();
    def.resolve(self.getProjects());
    return def.promise;
  };
  self.getProject = function(pid) {
    return Project(pid);
  };
  self.addProject = function(name) {
    addProject(name).then(function(res) {
      var obj;
      if (obj = res.data.object) {
        _projects.push(obj);
      }
    });
  };
  self.removeProject = function(pid) {
    var def;
    def = $q.defer();
    removeProject(pid).then(function(res) {
      var idx;
      if (res.data.result) {
        idx = void 0;
        angular.forEach(_projects, function(itm, _idx) {
          if (itm._id.$oid === pid) {
            return idx = _idx;
          }
        });
        if (!angular.isUndefined(idx)) {
          console.log('splicing idx', idx);
          _projects.splice(idx, 1);
          console.log(_projects);
        }
        def.resolve(res.data.result);
      }
    });
    return def.promise;
  };
  return self;
}]);
'use strict';
var app,
  indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

app = angular.module('auth.app', ['ui.bootstrap']);

app.run(["$rootScope", "authService", "$route", function($rootScope, authService, $route) {
  return $rootScope.$on('$routeChangeStart', function(e, nroute, oroute) {
    console.log(e);
    console.log(nroute);
    console.log(oroute);
    return console.log($route.current);
  });
}]);

app.factory('authInterceptor', ["$rootScope", "$q", "$window", "authService", "getToken", function($rootScope, $q, $window, authService, getToken) {
  return {
    request: function(cfg) {
      cfg.headers = cfg.headers || {};
      if (authService.hasData()) {
        cfg.headers.Authorization = "Bearer " + (getToken());
      }
      return cfg;
    },
    response: function(res) {
      console.log(res);
      if (res.status === 401) {
        console.log('error');
      }
      return res;
    }
  };
}]);

app.config(["$httpProvider", function($httpProvider) {
  return $httpProvider.interceptors.push('authInterceptor');
}]);

app.factory('getToken', ["sessionStorage", function(sessionStorage) {
  return function() {
    return sessionStorage.get('token');
  };
}]);

app.factory('logout', ["$http", "sessionStorage", "authService", function($http, sessionStorage, authService) {
  return function() {
    sessionStorage.remove('token');
    return $http.post('/api/v1/logout').then(function() {
      return authService.reset();
    });
  };
}]);

app.factory('register', ["$http", function($http) {
  return function(username, password, email) {
    return $http.post('/api/v1/register', {
      username: username,
      email: email,
      password: password
    });
  };
}]);

app.factory('login', ["$http", "sessionStorage", "$q", function($http, sessionStorage, $q) {
  return function(email, pw) {
    var def;
    def = $q.defer();
    $http.post('/api/v1/authenticate', {
      email: email,
      password: pw
    }).then(function(res) {
      console.log('starting@@@ ', res);
      if (res.data.token) {
        sessionStorage.set('token', res.data.token);
        return def.resolve(res.data.token);
      } else {
        console.log('Rejecting! -->');
        return def.reject(res.data);
      }
    });
    return def.promise;
  };
}]);

app.factory('base64Encode', ["$window", function($window) {
  return function(data) {
    var output;
    output = data.replace(/-/g, '+').replace(/_/g, '/');
    if (output.length % 4 === 0) {
      console.log('pass');
    } else if (output.length % 4 === 2) {
      output += '==';
    } else if (output.length % 4 === 3) {
      output += '=';
    } else {
      console.error('Illegal base64url string!');
      return false;
    }
    return decodeURIComponent(escape($window.atob(output)));
  };
}]);

app.factory('decodeToken', ["$window", function($window) {
  return function(tkn) {
    var header, parts, payload;
    parts = tkn.split('.');
    header = parts[0];
    payload = parts[1];
    console.log(payload);
    return angular.fromJson(window.atob(payload));
  };
}]);

app.service('authService', ["$rootScope", "tokenService", function($rootScope, tokenService) {
  var self, userData;
  userData = {};
  self = this;
  tokenService().then(function(res) {
    return userData = res;
  });
  self.reset = function() {
    return userData = {};
  };
  self.hasData = function() {
    return userData !== {};
  };
  self.getData = function() {
    if (self.hasData()) {
      return userData;
    }
    return false;
  };
  self.getUsername = function() {
    return userData.username;
  };
  self.getEmail = function() {
    return userData.emails[0].address;
  };
  self.getAvatar = function() {
    return userData.avatar;
  };
}]);

app.factory('sessionStorage', ["$window", function($window) {
  var storage;
  storage = $window.sessionStorage;
  return {
    get: function(key) {
      return storage.getItem(key);
    },
    set: function(key, val) {
      return storage.setItem(key, val);
    },
    has: function(key) {
      return indexOf.call(Object.keys(storage), key) >= 0;
    },
    remove: function(key) {
      delete storage[key];
    }
  };
}]);

app.factory('tokenService', ["$q", "sessionStorage", "decodeToken", function($q, sessionStorage, decodeToken) {
  return function() {
    var def, token;
    def = $q.defer();
    if (sessionStorage.has('token')) {
      token = sessionStorage.get('token');
      def.resolve(decodeToken(token));
    } else {
      def.reject('no token');
    }
    return def.promise;
  };
}]);

app.directive('tstDir', function() {
  return {
    restrict: "E",
    link: function(scope, ele, attrs) {
      var createLi, e;
      createLi = function(data) {
        return angular.element(document.createElement('li')).text(data);
      };
      e = angular.element(document.createElement('ul'));
      angular.forEach(Object.keys(attrs.$attr), function(itm) {
        e.append(createLi(attrs[itm]));
      });
      ele.html(e.html());
      console.log(attrs);
    }
  };
});

app.directive('confirmConfirm', function() {
  return {
    restrict: "A",
    require: "ngModel",
    link: function(scope, ele, attrs, ctrl) {
      var conf;
      conf = angular.element(document.getElementById('password_confirm')).val();
      ctrl.$validators.confirm = function(data) {
        return data === conf;
      };
    }
  };
});

app.directive('passwordConfirm', function() {
  return {
    restrict: "A",
    require: "ngModel",
    link: function(scope, ele, attrs, ctrl) {
      var pw;
      pw = angular.element(document.getElementById('new_password')).val();
      ctrl.$validators.confirm = function(data) {
        return data === pw;
      };
    }
  };
});
var t = '{"templates": {"dash.html": "<div class=row><div class=col-md-8><div class=row><div class=col-md-6><a href=/user/list class=\\"btn btn-default\\">Users</a></div><div class=col-md-6><a href=/project/list class=\\"btn btn-default\\">Projects</a></div></div></div></div>", "x.html": "", "edit.html": "<style>.ace_editor{height:200px}</style><div id=alert-container></div><div class=\\"col-md-10 col-md-offset-1\\"><div class=thumbnail><section><div ui-ace=cfg ng-model=editorData size=20>Ace here </div></section><div class=caption><div class=\\"btn-group btn-group-justified\\"><div class=btn-group><button class=\\"btn btn-default\\" ng-click=save(editorData)>Save &amp;Edit</button></div><div class=btn-group><button class=\\"btn btn-default\\" ng-click=saveAndClose(editorData)>Save &amp;Close</button></div><div class=btn-group><a class=\\"btn btn-default\\" ng-href=\\"/project/profile/{{file.project_id}}\\">Close</a></div></div></div><!-- <a class=\\"btn btn-default\\" ng-href=\\"/project/profile/{{file.project_id}}\\">Go to Project</a><a class=\\"btn btn-info\\" ng-click=\\"back()\\">back</a>--></div></div>", "home.html": "<h1>Home</h1>", "auth.html": "<style>.panel-login{border-color:#ccc;-webkit-box-shadow:0 2px 3px 0 rgba(0,0,0,0.2);-moz-box-shadow:0 2px 3px 0 rgba(0,0,0,0.2);box-shadow:0 2px 3px 0 rgba(0,0,0,0.2)}.panel-login>.panel-heading{color:#00415d;background-color:#fff;border-color:#fff;text-align:center}.panel-login>.panel-heading a{text-decoration:none;color:#666;font-weight:bold;font-size:15px;-webkit-transition:all .1s linear;-moz-transition:all .1s linear;transition:all .1s linear}.panel-login>.panel-heading a.active{color:#029f5b;font-size:18px}.panel-login>.panel-heading hr{margin-top:10px;margin-bottom:0;clear:both;border:0;height:1px;background-image:-webkit-linear-gradient(left,rgba(0,0,0,0),rgba(0,0,0,0.15),rgba(0,0,0,0));background-image:-moz-linear-gradient(left,rgba(0,0,0,0),rgba(0,0,0,0.15),rgba(0,0,0,0));background-image:-ms-linear-gradient(left,rgba(0,0,0,0),rgba(0,0,0,0.15),rgba(0,0,0,0));background-image:-o-linear-gradient(left,rgba(0,0,0,0),rgba(0,0,0,0.15),rgba(0,0,0,0))}.panel-login input[type=\\"text\\"],.panel-login input[type=\\"email\\"],.panel-login input[type=\\"password\\"]{height:45px;border:1px solid #ddd;font-size:16px;-webkit-transition:all .1s linear;-moz-transition:all .1s linear;transition:all .1s linear}.panel-login input:hover,.panel-login input:focus{outline:none;-webkit-box-shadow:none;-moz-box-shadow:none;box-shadow:none;border-color:#ccc}.btn-login{background-color:#59B2E0;outline:none;color:#fff;font-size:14px;height:auto;font-weight:normal;padding:14px 0;text-transform:uppercase;border-color:#59B2E6}.btn-login:hover,.btn-login:focus{color:#fff;background-color:#53A3CD;border-color:#53A3CD}.forgot-password{text-decoration:underline;color:#888}.forgot-password:hover,.forgot-password:focus{text-decoration:underline;color:#666}.btn-register{background-color:#1CB94E;outline:none;color:#fff;font-size:14px;height:auto;font-weight:normal;padding:14px 0;text-transform:uppercase;border-color:#1CB94A}.btn-register:hover,.btn-register:focus{color:#fff;background-color:#1CA347;border-color:#1CA347}</style><div class=row><div class=\\"col-md-6 col-md-offset-3\\"><div class=\\"panel panel-login\\"><div class=panel-heading><style>.cls{font-size:100px}</style><div class=row><div class=col-xs-6><a href=# class=\\"{{isActiveClass(\'login\')&amp;&amp;\'active\'}}\\" ng-click=setLoginMode() id=login-form-link>Login</a></div><div class=col-xs-6><a href=# class=\\"{{isActiveClass(\'register\')&amp;&amp;\'active\'}}\\" ng-click=setRegisterMode() id=register-form-link>Register</a></div></div><hr></div><button ng-click=\\"isCollapsed =!isCollapsed\\">collapse</button><div class=panel-body collapse=isCollapsed><div class=row><div class=col-lg-12><div ng-show=loginMode><form role=form name=loginForm ng-submit=login()><div class=form-group><input type=text tabindex=1 class=form-control placeholder=email value name=email ng-model=user.email></div><div class=form-group><input type=password name=password tabindex=2 class=form-control placeholder=Password ng-model=user.password></div><div class=\\"form-group text-center\\"><input type=checkbox tabindex=3 class=checkbox name=remember id=remember><label for=remember>Remember Me</label></div><div class=form-group><div class=row><div class=\\"col-sm-6 col-sm-offset-3\\"><input type=submit name=login-submit id=login-submit tabindex=4 class=\\"form-control btn btn-login\\" value=\\"Log In\\"></div></div></div><div class=form-group><div class=row><div class=col-lg-12><div class=text-center><a href=# tabindex=5 class=forgot-password>Forgot Password?</a></div></div></div></div></form></div><div ng-show=registerMode><form name=registerForm action method=post role=form ng-submit=register()><div class=form-group><input type=text name=username tabindex=1 class=form-control placeholder=Username value ng-model=newuser.name></div><div class=form-group><input type=email name=email tabindex=1 class=form-control placeholder=\\"Email Address\\" value ng-model=newuser.email></div><div class=form-group><input type=password name=password tabindex=2 class=form-control placeholder=Password ng-model=newuser.password id=new_password confirm-confirm></div><div class=form-group><input type=password name=confirm tabindex=2 class=form-control placeholder=\\"Confirm Password\\" ng-model=newuser.confirm password-confirm id=password_confirm><div ng-show=\\" registerForm.confirm.$error.confirm || registerForm.password.$error.confirm\\" class=\\"help-block&quot;\\"><p>Password and confirmation dont match</p></div></div><div class=form-group><div class=row><div class=\\"col-sm-6 col-sm-offset-3\\"><input type=submit name=register-submit id=register-submit tabindex=4 class=\\"form-control btn btn-register\\" value=\\"Register Now\\"></div></div></div></form></div></div></div></div></div></div></div><style>.panel-login{border-color:#ccc;-webkit-box-shadow:0 2px 3px 0 rgba(0,0,0,0.2);-moz-box-shadow:0 2px 3px 0 rgba(0,0,0,0.2);box-shadow:0 2px 3px 0 rgba(0,0,0,0.2)}.panel-login>.panel-heading{color:#00415d;background-color:#fff;border-color:#fff;text-align:center}.panel-login>.panel-heading a{text-decoration:none;color:#666;font-weight:bold;font-size:15px;-webkit-transition:all .1s linear;-moz-transition:all .1s linear;transition:all .1s linear}.panel-login>.panel-heading a.active{color:#029f5b;font-size:18px}.panel-login>.panel-heading hr{margin-top:10px;margin-bottom:0;clear:both;border:0;height:1px;background-image:-webkit-linear-gradient(left,rgba(0,0,0,0),rgba(0,0,0,0.15),rgba(0,0,0,0));background-image:-moz-linear-gradient(left,rgba(0,0,0,0),rgba(0,0,0,0.15),rgba(0,0,0,0));background-image:-ms-linear-gradient(left,rgba(0,0,0,0),rgba(0,0,0,0.15),rgba(0,0,0,0));background-image:-o-linear-gradient(left,rgba(0,0,0,0),rgba(0,0,0,0.15),rgba(0,0,0,0))}.panel-login input[type=\\"text\\"],.panel-login input[type=\\"email\\"],.panel-login input[type=\\"password\\"]{height:45px;border:1px solid #ddd;font-size:16px;-webkit-transition:all .1s linear;-moz-transition:all .1s linear;transition:all .1s linear}.panel-login input:hover,.panel-login input:focus{outline:none;-webkit-box-shadow:none;-moz-box-shadow:none;box-shadow:none;border-color:#ccc}.btn-login{background-color:#59B2E0;outline:none;color:#fff;font-size:14px;height:auto;font-weight:normal;padding:14px 0;text-transform:uppercase;border-color:#59B2E6}.btn-login:hover,.btn-login:focus{color:#fff;background-color:#53A3CD;border-color:#53A3CD}.forgot-password{text-decoration:underline;color:#888}.forgot-password:hover,.forgot-password:focus{text-decoration:underline;color:#666}.btn-register{background-color:#1CB94E;outline:none;color:#fff;font-size:14px;height:auto;font-weight:normal;padding:14px 0;text-transform:uppercase;border-color:#1CB94A}.btn-register:hover,.btn-register:focus{color:#fff;background-color:#1CA347;border-color:#1CA347}</style>", "profile.html": "<h2>{{item}}</h2><h3>{{profile.name ? profile.name:profile.username}}</h3><div class=list-group ng-init=\\"profileType =(profile.files &amp;&amp;\'project\' || false) ||(profile.projects &amp;&amp;\'user\')\\"><div class=list-group-item><div class=row><div class=col-md-10><p>Name:{{profile.name}}</p></div><div class=col-md-2><a ng-if=profile.files class=\\"btn btn-success\\" ng-click=addFile()>Add File</a></div></div></div><div class=\\"col-md-offset-3 col-md-5\\"><div class=list-group-item><div ng-init=\\"items=profile.projects||profile.files\\"><div ng-if=!((profile.projects||profile.files)|count)>no{{profile.files && \'files\' || \'projects\'}}</div><div ng-if=\\"((profile.projects||profile.files)|count)&gt;=2\\"><span class=badge>{{(profile.projects || profile.files) | count | update}}</span>{{profile.projects && \'projects\' || \'files\'}}</div><div ng-if=\\"((profile.projects||profile.files)|count)==1\\"><span class=badge>{{(profile.projects || profile.files) | count | update}}</span>{{profile.projects && \'project\' || \'file\'}}</div><ul ng-if=profile.projects class=\\"list-unstyled list-inline\\"><li ng-repeat=\\"proj in profile.projects\\"><a ng-href=/project/profile/{{proj._id.$oid}}class=\\"btn btn-link btn-lg\\">{{proj.name}}</a></li></ul><table ng-if=profile.files class=\\"table table-condensed table-hover\\"><thead><tr><th></th><th>name</th><th>type</th><th>edit</th><th>remove</th></tr></thead><tbody><tr ng-repeat=\\"file in profile.files\\"><td><button class=\\"btn btn-sm itm-num btn-default\\" ng-disabled=1>{{$index+1}}</button></td><td>{{file.name}}</td><td><p><span>[{{file.name | fileType}}] </span></p></td><td><a ng-href=\\"/file/{{file.oid || file._id.$oid}}/edit\\" class=\\"btn btn-default btn-sm\\">Edit </a></td><td><button class=\\"inline-block close-box btn-danger btn btn-xs\\" ng-hover><close-btn proj-id=\\"{{(file.oid || file._id.$oid)}}\\"></close-btn></button></td></tr></tbody></table></div></div></div></div><a ng-href=\\"/{{item}}/list\\" class=\\"btn btn-default\\">back</a>", "navbar.html": "<nav class=\\"navbar navbar-default\\"><div class=container-fluid><div class=navbar-header><button type=button class=\\"navbar-toggle collapsed\\" data-toggle=collapse data-target=#bs-example-navbar-collapse-1><span class=sr-only>Toggle navigation</span><span class=icon-bar></span><span class=icon-bar></span><span class=icon-bar></span></button><a class=navbar-brand href=# ng-bind=sitelogo></a></div><div class=\\"collapse navbar-collapse\\" id=bs-example-navbar-collapse-1><ul class=\\"nav navbar-nav\\"><li class=active><a href=#>Link <span class=sr-only>(current)</span></a></li><li><a href=#>Link</a></li></ul><form class=\\"navbar-form navbar-left\\" role=search><div class=form-group><input type=text class=form-control placeholder=Search></div><button type=submit class=\\"btn btn-default\\">Submit</button></form><ul class=\\"nav navbar-nav navbar-right\\"><li><p class=navbar-text ng-show=authenticated ng-cloak>{{getUserName()}}</p></li><li class=dropdown is-open=status.isopen ng-hide=authenticated><a class=dropdown-toggle ng-disabled=disabled>Login <span class=caret></span></a><ul class=dropdown-menu role=menu><li><a href=/login>Login</a></li><li><a href=/register>Register</a></li><li><a href=/about>About</a></li><li class=divider></li><li><a href=/support>Support</a></li></ul></li><li class=dropdown ng-show=authenticated><a class=dropdown-toggle><span class=\\"glyphicon glyphicon-user\\"></span>\\u00a0 <strong>Account</strong><span class=\\"glyphicon glyphicon-chevron-down\\"></span></a><ul class=dropdown-menu><li><div class=navbar-login><div class=row><div class=col-lg-4><p ng-if=!getAvatar() class=text-center><span class=\\"glyphicon glyphicon-user icon-size\\"></span></p><img ng-if=getAvatar() ng-src=\\"{{getAvatar()}}\\"></div><div class=col-lg-8><p class=text-left><strong>{{getUserName()}}</strong></p><p class=\\"text-left small\\">{{getEmail()}}</p><p class=text-left><a href=# class=\\"btn btn-primary btn-block btn-sm\\">Profile</a></p></div></div></div></li><li class=divider></li><li><div class=\\"navbar-login navbar-login-session\\"><div class=row><div class=col-lg-12><p><a href=# class=\\"btn btn-danger btn-block\\">Logout</a></p></div></div></div></li></ul></li></ul></div><!-- /.navbar-collapse --></div><!-- /.container-fluid --></nav>", "footer.html": "<footer><div class=col-md-12><hr>&copy;-2015 count -{{vc}}</div></footer>", "test.html": "<h1 class=page-header>test</h1><code><div class=row><div class=\\"col-md-3 col-md-offset-3\\"><h2>Users</h2><ul class=list-unstyled><li ng-repeat=\\"user in users\\"><p>Name:{{user.username || user.name}}</p><p>Projects:{{user.projects | count}}</p></li></ul></div>{{collectUsers()}}<div class=col-md-5><h2>Projects</h2><ul class=list-unstyled><li ng-repeat=\\"proj in projects\\"><p>Name:{{proj.name}}</p><p>Files:{{proj.files | count}}</p></li></ul></div></code>", "list.html": "<div class=row><div class=col-md-12><h2>{{item}}\'s</h2><div class=row><div ng-if=\\"item==\'project\'\\" class=col-md-4><a ng-click=addProject() class=\\"btn btn-primary btn-square\\">add project</a><a ng-click=removeProjectMode() class=\\"btn btn-danger btn-square\\">Remove project</a></div><div class=col-md-4><h1 class=lead ng-show=removeMode>Select projects to remove</h1><h1 class=lead ng-show=removeError>There was an error removing the project</h1><ul class=\\"inline-block list-group\\"><li ng-repeat=\\"itm in coll\\" class=\\"inline-block list-group-item\\"><a ng-click=checkMode($event,itm._id.$oid) ng-href=\\"{{getUrl(itm)}}\\" class=\\"btn btn-square btn-default btn-lg\\">{{itm.name ? itm.name:itm.username}}</a><div ng-if=\\"item == \'project\'\\" class=row><div class=col-md-12><p>Files:{{itm.files | count}}</p></div></div></li></ul><a href=/dash class=\\"btn btn-default\\">Back</a></div><div class=col-md-4></div></div></div></div>"}}';angular.module('editor.app').run(['$templateCache',function($templateCache){    var templates = JSON.parse(t).templates;    angular.forEach(templates,function(val,key){        $templateCache.put(key,val);    });}]);