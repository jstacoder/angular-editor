'use strict';

var app;

app = angular.module('editor.app', ['ngRoute']);

app.constant('apiPrefix', '/api/v1');

app.factory('viewCount', ["$http", "apiPrefix", function($http, apiPrefix) {
  return $http.get("" + apiPrefix + "/viewcount");
}]);

app.factory('collections', ["collectUsers", "collectProjects", function(collectUsers, collectProjects) {
  return function(itm) {
    var rtn;
    rtn = {
      user: collectUsers,
      project: collectProjects
    };
    return rtn[itm]();
  };
}]);

app.config(["$routeProvider", "$locationProvider", function($routeProvider, $locationProvider) {
  $routeProvider.when('/', {
    templateUrl: 'home.html',
    controller: ["$scope", function($scope) {}]
  }).when('/test', {
    templateUrl: 'test.html',
    controller: ["$scope", "collectProjects", "collectUsers", function($scope, collectProjects, collectUsers) {
      $scope.users = [];
      $scope.projects = [];
      $scope.collectUsers = collectUsers;
      $scope.users = collectUsers();
      $scope.projects = collectProjects();
    }]
  }).when('/:item/list', {
    templateUrl: 'list.html',
    controller: ["$scope", "$routeParams", "collectProjects", "collectUsers", "collections", function($scope, $routeParams, collectProjects, collectUsers, collections) {
      console.log($routeParams);
      console.log($routeParams.item);
      $scope.item = $routeParams.item;
      collections($scope.item).then(function(res) {
        console.log(res);
        return $scope.coll = res;
      });
      $scope.getUrl = function(itm) {
        return "" + $scope.item + "/profile/" + itm._id.$oid;
      };
    }]
  }).when('/:item/profile/:id', {
    templateUrl: 'profile.html',
    controller: ["$scope", "$routeParams", "collections", "collectUsers", "collectProjects", function($scope, $routeParams, collections, collectUsers, collectProjects) {
      var colls;
      colls = {
        user: collectUsers,
        project: collectProjects
      };
      $scope.item = $routeParams.item;
      console.log($scope.item);
      $scope.route_id = $routeParams.id;
      console.log($scope.route_id);
      $scope.getProjectName = function(p) {
        return project(p.$oid).then(function(res) {});
      };
      if ($scope.item === 'user') {
        collectUsers().then(function(res) {
          console.log(res);
          $scope.coll = res;
          console.log($scope.coll);
          return angular.forEach($scope.coll, function(itm) {
            console.log(itm, $scope.route_id);
            if (itm._id.$oid === $scope.route_id) {
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
            if (itm._id.$oid === $scope.route_id) {
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
  });
  $locationProvider.html5Mode(true);
}]);

app.controller('footerCtrl', ["$scope", "viewCount", function($scope, viewCount) {
  return viewCount.then(function(res) {
    return $scope.vc = res.data.count;
  });
}]);

app.factory('collectProjects', ["$q", "projects", function($q, projects) {
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
}]);

app.factory('collectUsers', ["$q", "users", "User", function($q, users, User) {
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

app.factory('User', ["$http", "apiPrefix", function($http, apiPrefix) {
  return function(oid) {
    return $http.get("" + apiPrefix + "/user/" + oid);
  };
}]);

app.factory('users', ["$http", "apiPrefix", function($http, apiPrefix) {
  return function() {
    return $http.get("" + apiPrefix + "/user");
  };
}]);

app.factory('Project', ["$http", "apiPrefix", function($http, apiPrefix) {
  return function(oid) {
    return $http.get("" + apiPrefix + "/project/" + oid);
  };
}]);

app.factory('projects', ["$http", "apiPrefix", function($http, apiPrefix) {
  return function() {
    return $http.get("" + apiPrefix + "/project");
  };
}]);
