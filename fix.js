var app = angular.module('fix.modal',['mgcrea.ngStrap']);
app.service('ngModal',['$modal',function($modal){
    return $modal;
}]);
app.service('ngAlert',['$alert',function($alert){
    return $alert;
}]);
