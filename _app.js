'use strict';
var app;

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

app.controller('MainCtrl', ["$scope", "$q", "$rootScope", "users", "projects", "files", "currentFile", "saveFile", function($scope, $q, $rootScope, users, projects, files, currentFile, saveFile) {
  var self;
  self = this;
  $scope.editorData = {};
  users.then(function(res) {
    $q.when(self.users = res.data.objects.map(function(itm) {
      return angular.fromJson(itm);
    })).then(function() {
      var oid, _id;
      _id = self.users[0]._id;
      if (_id) {
        oid = _id.$oid;
      } else {
        oid = false;
      }
      if (oid) {
        projects(oid).then(function(res) {
          self.projects = res.data;
        });
      }
    });
  });
  self.get_projects = function(oid) {
    $q.when(projects(oid)).then(function(res) {
      $q.when(res).then(function() {
        self.projects = res.projects.map(function(itm) {
          return angular.fromJson(itm);
        });
      });
    });
  };
  self.get_files = function(oid) {
    files(oid).then(function(res) {
      self.files = res.data.files.map(function(itm) {
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
      self.get_files(itm._id.$oid);
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
}]);
