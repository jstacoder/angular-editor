'use strict';

var app;

app = angular.module('editor.app', ['ngRoute']);

app.constant('apiPrefix', '/api/v1');

app.factory('collections', function(collectUsers, collectProjects) {
  return function(itm) {
    var rtn;
    rtn = {
      user: collectUsers,
      project: collectProjects
    };
    return rtn[itm]();
  };
});

app.config(function($routeProvider, $locationProvider) {
  $routeProvider.when('/', {
    templateUrl: 'home.html',
    controller: function($scope) {}
  }).when('/test', {
    templateUrl: 'test.html',
    controller: function($scope, collectProjects, collectUsers) {
      $scope.users = [];
      $scope.projects = [];
      $scope.collectUsers = collectUsers;
      $scope.users = collectUsers();
      $scope.projects = collectProjects();
    }
  }).when('/:item/list', {
    templateUrl: 'list.html',
    controller: function($scope, $routeParams, collectProjects, collectUsers, collections) {
      console.log($routeParams);
      console.log($routeParams.item);
      $scope.item = $routeParams.item;
      $scope.coll = collections()[$scope.item]();
    }
  }).when('/:item/profile/:id', {
    templateUrl: 'profile.html',
    controller: function($scope, $routeParams, collections, collectUsers, collectProjects) {
      var colls;
      colls = {
        user: collectUsers,
        project: collectProjects
      };
      $scope.item = $routeParams.item;
      console.log($scope.item);
      $scope.route_id = $routeParams.id;
      console.log($scope.route_id);
      collectUsers().then(function(res) {
        return $scope.coll = res;
      });
      console.log($scope.coll);
      console.log(collectUsers());
      $scope.profile = $scope.coll.filter(function(itm) {
        console.log(itm, $scope._id);
        return itm._id.$oid === $scope._id;
      });
    }
  });
  $locationProvider.html5Mode(true);
});

app.factory('collectProjects', function($q, projects) {
  var def, _projs;
  _projs = [];
  def = $q.defer();
  projects().then(function(res) {
    console.log(res.data.objects);
    angular.forEach(res.data.objects, function(itm) {
      var _itm;
      _itm = angular.fromJson(itm);
      console.log(_itm);
      return _projs.push(_itm);
    });
    return def.resolve(_projs);
  });
  return function() {
    return def.promise;
  };
});

app.factory('collectUsers', function($q, users, User) {
  var def, _users;
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
});

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

app.factory('User', function($http, apiPrefix) {
  return function(oid) {
    return $http.get("" + apiPrefix + "/user/" + oid);
  };
});

app.factory('users', function($http, apiPrefix) {
  return function() {
    return $http.get("" + apiPrefix + "/user");
  };
});

app.factory('Project', function($http, apiPrefix) {
  return function(oid) {
    return $http.get("" + apiPrefix + "/project/" + oid);
  };
});

app.factory('projects', function($http, apiPrefix) {
  return function() {
    return $http.get("" + apiPrefix + "/project");
  };
});
