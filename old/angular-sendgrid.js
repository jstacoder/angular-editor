'use strict';

var app;

app = angular.module('sendgrid.app', []);

app.provider('credential', function() {
  var rtn, self;
  self = this;
  self.username = '';
  self.password = '';
  self.getUsername = function() {
    return self.username;
  };
  self.getPassword = function() {
    return self.password;
  };
  rtn = {
    $get: function() {
      var inner_self;
      inner_self = this;
      inner_self.getCredentials = function() {
        return {
          api_user: self.getUsername(),
          api_password: self.getPassword()
        };
      };
      return inner_self;
    },
    setPassword: function(pw) {
      self.password = pw;
    },
    setUsername: function(name) {
      self.username = name;
    }
  };
  return rtn;
});

app.factory('createData', ["credential", function(credential) {
  return function(cfg) {
    var count, creds, rtn;
    rtn = '';
    creds = credential.getCredentials();
    angular.extend(cfg, creds);
    count = 1;
    angular.forEach(cfg, function(itm, key) {
      console.log('key', key);
      console.log('val', itm);
      rtn += "" + key + "=" + itm;
      count += 1;
      if ((Object.keys(cfg).length + 1) > count) {
        return rtn += '&';
      }
    });
    return rtn;
  };
}]);

app.factory('sendEmail', ["$http", "createData", function($http, createData) {
  return function(cfg) {
    return $http.post('https://api.sendgrid.com/api/mail.send.json', createData(cfg));
  };
}]);

app.config(["credentialProvider", function(credentialProvider) {
  credentialProvider.setPassword('jstacoder');
  credentialProvider.setUsername('1414wp8888');
}]);

app.run(["sendEmail", function(sendEmail) {
  var cfg;
  cfg = {
    from: 'kyle@level2designs.com',
    fromname: 'kyle',
    to: 'jstacoder@gmail.com',
    toname: 'kyle',
    subject: 'test',
    html: '<h1>Hi</h1>'
  };
  return sendEmail(cfg).then(function(res) {
    return console.log(res.data);
  });
}]);
