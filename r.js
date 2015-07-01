var app = angular.module('app',['ngResource']);                    
app.factory('$User',['$resource',function($resource){
    return $resource('/user_:id.json',{'id':'@id'},{
        query : {
            method:"GET",
            url:"/users.json",
            isArray:true
        }
    });
}]);
app.factory('$users',['User',function(User){
    return User.query();
}]);
