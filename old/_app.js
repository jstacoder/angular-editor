'use strict';

var app, equals, forEach, fromJson;

fromJson = angular.fromJson;

equals = angular.equals;

forEach = angular.forEach;

app = angular.module('editor.app', []);

app.factory('login', ["$http", function($http) {
  return function(id) {
    var payload;
    payload = {
      id: id
    };
    return $http.post('/api/v1/login', payload);
  };
}]);

app.factory('files', ["$http", function($http) {
  return function(pid) {
    return $http.get("/api/v1/files/" + pid);
  };
}]);

app.factory('saveFile', ["$http", function($http) {
  return function(file, content) {
    var payload;
    payload = {
      id: file._id,
      content: content
    };
    return $http.post('/api/v1/save', payload);
  };
}]);

app.factory('projects', ["$q", "$http", "login", function($q, $http, login) {
  return function(id) {
    var def;
    def = $q.defer();
    login(id).then(function(res) {
      if (angular.fromJson(res.data).result === 'success') {
        return $http.get('/api/v1/projects').then(function(res) {
          return def.resolve(res.data);
        });
      } else {
        return def.reject(res.data);
      }
    });
    return def.promise;
  };
}]);

app.factory('createFile', ["$http", function($http) {
  return function(data) {
    return $http.post('/api/v1/files/create', data);
  };
}]);

app.service('allProjects', ["$q", "projects", "users", function($q, projects, users) {
  var projs, self;
  projs = [];
  self = this;
  users.then(function(res) {
    $q.when(self.users = res.data.objects.map(function(itm) {
      return fromJson(itm);
    })).then(function() {
      self.users.map(function(itm) {
        var oid, _id;
        _id = itm._id;
        if (_id) {
          oid = _id.$oid;
        } else {
          oid = false;
        }
        if (oid) {
          projects(oid).then(function(res) {
            projs.push(res.projects);
          });
        }
      });
    });
  });
  self.getProjects = function() {
    return projs.map(function(itm) {
      return fromJson(itm[0]);
    });
  };
  self.getProject = function(pid) {
    return projs.filter(function(itm) {
      var id;
      if (itm._id) {
        if (itm._id.$oid) {
          id = itm._id.$oid;
        } else {
          id = itm._id;
        }
      } else {
        id = itm.id;
      }
      return id === pid;
    });
  };
  self.addFileToProject = function(file, proj) {
    return forEach(projs, function(itm) {
      if (equals(itm._id, proj._id)) {
        itm.files.push(file);
      }
    });
  };
  self.getUsers = function() {
    return self.users;
  };
}]);

app.factory('makeFile', ["createFile", "allProjects", function(createFile, allProjects) {
  return function(name, project) {
    console.log(project);
    createFile({
      name: name,
      project: {
        "$oid": project._id.$oid
      }
    }).then(function(res) {
      var file;
      console.log(res);
      file = angular.fromJson(res.data.obj);
      console.log(file);
      project.files.push(file);
      console.log(project);
      allProjects.addFileToProject(file, project);
    });
  };
}]);

app.factory('users', ["$http", function($http) {
  return $http.get('/api/v1/user');
}]);

app.service('currentFile', function() {
  var content, name, project, self, _id;
  name = '';
  content = '';
  project = '';
  _id = '';
  self = this;
  self.set_current = function(fle) {
    name = fle.name;
    content = fle.content;
    project = fle.project;
    if (angular.isString(fle._id)) {
      _id = fle._id;
    } else {
      _id = fle._id.$oid;
    }
  };
  self.get_current = function() {
    var rtn;
    rtn = {
      name: name,
      content: content,
      project: project,
      _id: _id
    };
    return rtn;
  };
});

app.controller('MainCtrl', ["$window", "$scope", "$q", "$rootScope", "users", "projects", "files", "currentFile", "saveFile", "makeFile", "allProjects", function($window, $scope, $q, $rootScope, users, projects, files, currentFile, saveFile, makeFile, allProjects) {
  var self, update;
  self = this;
  $scope.editorData = {};
  update = function() {
    return $scope.projects = forEach(allProjects.getProjects(), function(itm) {
      return fromJson(itm[0]);
    });
  };
  $scope.$watchCollection('projects', function(o, n) {
    console.log('watching');
    self.projects = n;
    return update();
  });
  /*    
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
  */

  self.updateProjects = function() {
    self.projects = allProjects.getProjects().map(function(itm) {
      return fromJson(itm);
    });
    return self.users = allProjects.getUsers();
  };
  self.updateProjects();
  self.get_projects = function(oid) {
    $q.when(projects(oid)).then(function(res) {
      $q.when(res).then(function() {
        self.projects = res.projects.map(function(itm) {
          return fromJson(itm);
        });
      });
    });
  };
  self.get_files = function(oid) {
    files(oid).then(function(res) {
      return self.files = res.data.files.map(function(itm) {
        return angular.fromJson(itm);
      });
    });
  };
  self.set_file = function(file) {
    currentFile.set_current(file);
    $scope.editorData.content = file.content;
    self.showEditor = true;
  };
  self.get_all_files = function() {
    self.projects.map(function(itm) {
      self.get_files(itm._id.$oid).then(function(res) {
        itm.files = res;
        console.log(res);
      });
    });
  };
  self.close = function() {
    return self.showEditor = false;
  };
  self.save = function(c) {
    var current, idx, itm, _i, _len, _ref;
    current = currentFile.get_current();
    saveFile(current, c);
    $scope.editorData.content = c;
    current.content = c;
    idx = -1;
    _ref = self.files;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      itm = _ref[_i];
      if (itm._id) {
        if (itm._id.$oid === current.id) {
          idx = self.files.indexOf(itm);
          self.files.splice(idx, 1);
          self.files.push(current);
        }
      } else {
        if (itm.id) {
          if (itm.id === current.id) {
            idx = self.files.indexOf(itm);
            self.files.splice(idx, 1);
            self.files.push(current);
          }
        }
      }
    }
    self.get_all_files();
  };
  self.add_file = function(project) {
    var name;
    console.log('hmmm');
    name = $window.prompt("What name:");
    makeFile(name, project);
    console.log("made " + name + ", and added to " + project.name);
  };
}]);
