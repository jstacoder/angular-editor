'use strict';
var app;

app = angular.module('editor.app', []);

app.factory('login', function($http) {
  return function(id) {
    var payload;
    payload = {
      id: id
    };
    return $http.post('/api/v1/login', payload);
  };
});

app.factory('projects', function($q, $http, login) {
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
});

app.factory('users', function($http) {
  return $http.get('/api/v1/user');
});

app.controller('MainCtrl', function($q, users, projects) {
  var self;
  self = this;
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
    projects(oid).then(function(res) {
      self.projects = res.map(function(itm) {
        return angular.fromJson(itm);
      });
    });
  };
});
