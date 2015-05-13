(function() {
  'use strict';
  var app;

  app = angular.module('editor.app', ['ngRoute', 'ui.ace', 'mgcrea.ngStrap', 'ui.bootstrap', 'auth.app']);

  app.constant('apiPrefix', '/api/v1');

  app.factory('aceLoaded', function() {
    return function(_editor) {
      var _rend, _sess;
      _sess = _editor.getSession();
      _rend = _editor.renderer;
      _rend.setFontSize(20);
      console.log(_rend, _sess, _editor);
    };
  });

  app.directive('modalContent', function() {
    return {
      require: ["^$uiModal", "modalContent"],
      restrict: "E",
      scope: {
        content: "@"
      },
      link: function(scope, ele, attrs, ctrls) {
        return console.log(attrs);
      }
    };
  });

  app.directive('closeBtn', ["removeFile", function(removeFile) {
    return {
      restrict: 'E',
      template: "<span class='close'>X</span>",
      link: function(scope, ele, attrs) {
        var proj_id;
        console.log(attrs);
        proj_id = attrs['projId'];
        ele.on('click', function() {
          ele.parent().remove();
          removeFile(proj_id);
        });
      }
    };
  }]);

  app.filter('update', function() {
    return function(data) {
      return data;
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

  app.factory('getMode', ["editorModes", function(editorModes) {
    return function(ext) {
      return editorModes[ext];
    };
  }]);

  app.directive('size', function() {
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

  app.directive('tzNav', function() {
    return {
      restrict: "E",
      templateUrl: "navbar.html",
      replace: true,
      require: "tzNav",
      controller: ["$scope", "$element", "$attrs", "authService", function($scope, $element, $attrs, authService) {
        $scope.status = {};
        $scope.status.isopen = false;
        $scope.authenticated = authService.hasData();
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
      }],
      link: function(scope, ele, attrs, ctrl) {}
    };
  });

  app.factory('viewCount', ["$http", "apiPrefix", function($http, apiPrefix) {
    return $http.get(apiPrefix + "/viewcount");
  }]);

  app.factory('collections', ["collectUsers", "projectService", function(collectUsers, projectService) {
    return function(itm) {
      var rtn;
      rtn = {
        user: collectUsers,
        project: projectService.getProjects
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
      controller: ["logout", function(logout) {
        return logout();
      }]
    }).when('/login', {
      templateUrl: 'auth.html',
      controller: ["$scope", "login", "$uiModal", function($scope, login, $uiModal) {
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
        $scope.login = function() {
          return login($scope.user.email, $scope.user.password).then(function(res) {
            var modal;
            modal = $uiModal.open({
              templateUrl: 'myLoginModal.html',
              scope: $scope.$new()
            });
            return modal.result.then(function(res) {
              console.log(res);
            });
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
      controller: ["$uiModal", "$scope", "$routeParams", "collectProjects", "collectUsers", "collections", "addProject", "removeProject", "authService", "projectService", function($uiModal, $scope, $routeParams, collectProjects, collectUsers, collections, addProject, removeProject, authService, projectService) {
        var updateColl;
        console.log($routeParams);
        console.log($routeParams.item);
        $scope.item = $routeParams.item;
        updateColl = function() {
          $scope.coll = projectService.getProjects();
        };
        updateColl();
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
        $scope.testVar = 'testing 1,2,3';
        $scope.items = ['x', 'y', 'a'];
        $scope.getUrl = function(itm) {
          return $scope.item + "/profile/" + itm._id.$oid;
        };
        $scope.addProject = function() {
          var _s, modal, userData;
          userData = authService.getData();
          console.log('User:--->', userData);
          _s = $scope.$new({
            testVar: 'cccccc'
          });
          _s.testVar = 'ttttttttt';
          modal = $uiModal.open({
            controller: function($scope, $modalInstance) {
              $scope.project = {};
              return $scope.project.name = '';
            },
            controllerAs: 'ng-controller as ctrl',
            title: 'testModal',
            templateUrl: 'myModalContent.html',
            resolve: {
              items: function() {
                return $scope.items;
              }
            }
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
      controller: ["$uiModal", "$scope", "$routeParams", "collections", "collectUsers", "collectProjects", "addFile", "back", "removeFile", function($uiModal, $scope, $routeParams, collections, collectUsers, collectProjects, addFile, back, removeFile) {
        var colls;
        colls = {
          user: collectUsers,
          project: collectProjects
        };
        $scope.back = back;
        $scope.item = $routeParams.item;
        console.log($scope.item);
        $scope.route_id = $routeParams.id;
        console.log($scope.route_id);
        $scope.deleteConfirm = function(file_id) {
          removeFile(file_id).then(function(res) {
            if (res) {
              collectProjects().then(function(r) {
                $scope.coll = r;
                return angular.forEach($scope.coll, function(itm) {
                  if (itm._id.$oid === parseInt($scope.route_id)) {
                    $scope.profile = itm;
                  }
                });
              });
            }
          });
        };
        $scope.addFile = function() {
          var modal;
          modal = $uiModal.open({
            controller: function($scope, $modalInstance) {
              $scope.file = {};
              return $scope.file.name = '';
            },
            title: 'testModal',
            templateUrl: 'myFileModal.html'
          });
          return modal.result.then(function(res) {
            console.log(res);
            addFile($scope.route_id, res).then(function(r) {
              console.log(r);
              $scope.profile.files.push(r.data.object);
            });
          }, function(err) {
            console.log(err);
          });
        };
        $scope.getProjectName = function(p) {
          return project(p._id.$oid).then(function(res) {});
        };
        if ($scope.item === 'user') {
          collectUsers().then(function(res) {
            console.log(res);
            $scope.coll = res;
            console.log($scope.coll);
            return angular.forEach($scope.coll, function(itm) {
              console.log(itm, $scope.route_id);
              if (itm._id.$oid === parseInt($scope.route_id)) {
                $scope.profile = itm;
              }
            });
          });
        } else {
          collectProjects().then(function(res) {
            console.log(res);
            $scope.coll = res;
            return angular.forEach($scope.coll, function(itm) {
              console.log(itm, $scope.route_id);
              if (itm._id.$oid === parseInt($scope.route_id)) {
                $scope.profile = itm;
              }
            });
          });
        }
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
      controller: ["$alert", "$scope", "$routeParams", "fileService", "$q", "File", "saveFile", "getMode", "aceCfg", function($alert, $scope, $routeParams, fileService, $q, File, saveFile, getMode, aceCfg) {
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
            return alert = $alert({
              title: 'Saved',
              content: "You successfully saved " + res.data.obj.name,
              placement: 'top',
              type: 'success',
              show: true,
              duration: 3,
              container: angular.element(document.getElementsByClassName('container')[0])
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
      return $http.get(apiPrefix + "/user");
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

}).call(this);
