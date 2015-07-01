(function() {
  'use strict';
  var app,
    indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  app = angular.module('auth.app', ['mgcrea.ngStrap']);

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

  app.factory('logout', ["$http", "sessionStorage", function($http, sessionStorage) {
    return function() {
      sessionStorage.remove('token');
      return $http.post('/api/v1/logout');
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
        if (res.data.token) {
          sessionStorage.set('token', res.data.token);
          def.resolve(res.data.token);
        } else {
          def.reject('err');
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

  app.directive('accessControl', ["$dropdown", function($dropdown) {
    return {
      restrict: "E",
      require: "?dropdown",
      link: function(scope, ele, attrs, ctrl) {
        var dpdn;
        console.log('here', ctrl);
        return dpdn = $dropdown(ele, {
          scope: {
            content: {
              text: 'foo',
              href: '',
              click: ''
            }
          }
        });
      }
    };
  }]);

}).call(this);
