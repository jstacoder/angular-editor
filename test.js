module.exports = function() {
  var app, test;
  require('./vendor/main/main.min.js');
  require('./vendor/angular-resource/angular-resource.js');
  require('./vendor/angular-route/angular-route.js');
  require('./vendor/angular-ui-ace/ui-ace.js');
  require('./vendor/angular-ui-bootstrap/dist/ui-bootstrap-tpls-0.13.0.js');
  require('./r.js');
  app = angular.module('app');
  app.config([
    '$locationProvider', function($locationProvider) {
      return $locationProvider.html5Mode(false);
    }
  ]);
  test = function(name, args, testcb) {
    ng_bootstrap('app');
    console.log("running " + name);
    return testcb(args);
  };
  return test('test_get_all_users', {}, function() {
    var $q, User;
    User = ng_load('$User', ['app']);
    $q = ng_load('$q');
    return $q.when(User.query()).then(function(res) {
      return console.log(res.$promise);
    });
  });
};
