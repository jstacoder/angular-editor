angular.module('editor.app').run(['$templateCache',function($templateCache){    $templateCache.put('footer.html','<footer><div class="col-md-12"><hr>&copy;-2015 count - {{ vc }}</div></footer>');
}]);
angular.module('editor.app').run(['$templateCache',function($templateCache){    $templateCache.put('auth.html','<style>
    .panel-login {
	border-color: #ccc;
	-webkit-box-shadow: 0px 2px 3px 0px rgba(0,0,0,0.2);
	-moz-box-shadow: 0px 2px 3px 0px rgba(0,0,0,0.2);
	box-shadow: 0px 2px 3px 0px rgba(0,0,0,0.2);
}
.panel-login>.panel-heading {
	color: #00415d;
	background-color: #fff;
	border-color: #fff;
	text-align:center;
}
.panel-login>.panel-heading a{
	text-decoration: none;
	color: #666;
	font-weight: bold;
	font-size: 15px;
	-webkit-transition: all 0.1s linear;
	-moz-transition: all 0.1s linear;
	transition: all 0.1s linear;
}
.panel-login>.panel-heading a.active{
	color: #029f5b;
	font-size: 18px;
}
.panel-login>.panel-heading hr{
	margin-top: 10px;
	margin-bottom: 0px;
	clear: both;
	border: 0;
	height: 1px;
	background-image: -webkit-linear-gradient(left,rgba(0, 0, 0, 0),rgba(0, 0, 0, 0.15),rgba(0, 0, 0, 0));
	background-image: -moz-linear-gradient(left,rgba(0,0,0,0),rgba(0,0,0,0.15),rgba(0,0,0,0));
	background-image: -ms-linear-gradient(left,rgba(0,0,0,0),rgba(0,0,0,0.15),rgba(0,0,0,0));
	background-image: -o-linear-gradient(left,rgba(0,0,0,0),rgba(0,0,0,0.15),rgba(0,0,0,0));
}
.panel-login input[type="text"],.panel-login input[type="email"],.panel-login input[type="password"] {
	height: 45px;
	border: 1px solid #ddd;
	font-size: 16px;
	-webkit-transition: all 0.1s linear;
	-moz-transition: all 0.1s linear;
	transition: all 0.1s linear;
}
.panel-login input:hover,
.panel-login input:focus {
	outline:none;
	-webkit-box-shadow: none;
	-moz-box-shadow: none;
	box-shadow: none;
	border-color: #ccc;
}
.btn-login {
	background-color: #59B2E0;
	outline: none;
	color: #fff;
	font-size: 14px;
	height: auto;
	font-weight: normal;
	padding: 14px 0;
	text-transform: uppercase;
	border-color: #59B2E6;
}
.btn-login:hover,
.btn-login:focus {
	color: #fff;
	background-color: #53A3CD;
	border-color: #53A3CD;
}
.forgot-password {
	text-decoration: underline;
	color: #888;
}
.forgot-password:hover,
.forgot-password:focus {
	text-decoration: underline;
	color: #666;
}

.btn-register {
	background-color: #1CB94E;
	outline: none;
	color: #fff;
	font-size: 14px;
	height: auto;
	font-weight: normal;
	padding: 14px 0;
	text-transform: uppercase;
	border-color: #1CB94A;
}
.btn-register:hover,
.btn-register:focus {
	color: #fff;
	background-color: #1CA347;
	border-color: #1CA347;
}
</style><div class="row"><div class="col-md-6 col-md-offset-3"><div class="panel panel-login"><div class="panel-heading"><div class="row"><div class="col-xs-6"><a href="#" class="{{isActiveClass(\'login\')&&\'active\'}}" ng-click="setLoginMode()" id="login-form-link">Login</a></div><div class="col-xs-6"><a href="#" class="{{isActiveClass(\'register\')&&\'active\'}}" ng-click="setRegisterMode()" id="register-form-link">Register</a></div></div><hr></div><div class="panel-body"><div class="row"><div class="col-lg-12"><div ng-show="loginMode"><form role="form" name="loginForm" ng-submit="login()"><div class="form-group"><input type="text" tabindex="1" class="form-control" placeholder="email" value="" name="email" ng-model="user.email"></div><div class="form-group"><input type="password" name="password" tabindex="2" class="form-control" placeholder="Password" ng-model="user.password"></div><div class="form-group text-center"><input type="checkbox" tabindex="3" class="checkbox" name="remember" id="remember"> <label for="remember">Remember Me</label></div><div class="form-group"><div class="row"><div class="col-sm-6 col-sm-offset-3"><input type="submit" name="login-submit" id="login-submit" tabindex="4" class="form-control btn btn-login" value="Log In"></div></div></div><div class="form-group"><div class="row"><div class="col-lg-12"><div class="text-center"><a href="#" tabindex="5" class="forgot-password">Forgot Password?</a></div></div></div></div></form></div><div ng-show="registerMode"><form name="registerForm" action="" method="post" role="form" ng-submit="register()"><div class="form-group"><input type="text" name="username" tabindex="1" class="form-control" placeholder="Username" value="" ng-model="newuser.name"></div><div class="form-group"><input type="email" name="email" tabindex="1" class="form-control" placeholder="Email Address" value="" ng-model="newuser.email"></div><div class="form-group"><input type="password" name="password" tabindex="2" class="form-control" placeholder="Password" ng-model="newuser.password" id="new_password" confirm-confirm></div><div class="form-group"><input type="password" name="confirm" tabindex="2" class="form-control" placeholder="Confirm Password" ng-model="newuser.confirm" password-confirm id="password_confirm"><div ng-show="
                                                registerForm.confirm.$error.confirm
                                                ||
                                                registerForm.password.$error.confirm" class="help-block""><p>Password and confirmation dont match</p></div></div><div class="form-group"><div class="row"><div class="col-sm-6 col-sm-offset-3"><input type="submit" name="register-submit" id="register-submit" tabindex="4" class="form-control btn btn-register" value="Register Now"></div></div></div></form></div></div></div></div></div></div></div>');
}]);
angular.module('editor.app').run(['$templateCache',function($templateCache){    $templateCache.put('list.html','<div class="row"><div class="col-md-12"><h2>{{ item }}\'s</h2><div class="row"><div ng-if="item==\'project\'" class="col-md-4"><a ng-click="addProject()" class="btn btn-primary btn-square">add project</a> <a ng-click="removeProjectMode()" class="btn btn-danger btn-square">Remove project</a></div><div class="col-md-4"><h1 class="lead" ng-show="removeMode">Select projects to remove</h1><h1 class="lead" ng-show="removeError">There was an error removing the project</h1><ul class="inline-block list-group"><li ng-repeat="itm in coll" class="inline-block list-group-item"><a ng-click="checkMode($event,itm._id.$oid)" ng-href="{{ getUrl(itm) }}" class="btn btn-square btn-default btn-lg">{{ itm.name ? itm.name : itm.username }}</a><div ng-if="item == \'project\'" class="row"><div class="col-md-12"><p>Files: {{ itm.files | count }}</p></div></div></li></ul><a href="/dash" class="btn btn-default">Back</a></div><div class="col-md-4"></div></div></div></div>');
}]);
angular.module('editor.app').run(['$templateCache',function($templateCache){    $templateCache.put('test.html','<h1 class="page-header">test</h1><code><div class="row"><div class="col-md-3 col-md-offset-3"><h2>Users</h2><ul class="list-unstyled"><li ng-repeat="user in users"><p>Name: {{ user.username || user.name }}</p><p>Projects: {{ user.projects | count }}</p></li></ul></div>{{ collectUsers() }}<div class="col-md-5"><h2>Projects</h2><ul class="list-unstyled"><li ng-repeat="proj in projects"><p>Name: {{ proj.name }}</p><p>Files: {{ proj.files | count }}</p></li></ul></div></code>');
}]);
angular.module('editor.app').run(['$templateCache',function($templateCache){    $templateCache.put('dash.html','<div class="row"><div class="col-md-8"><div class="row"><div class="col-md-6"><a href="\'/user/list\'" class="btn btn-default">Users</a></div><div class="col-md-6"><a href="\'/project/list\'" class="btn btn-default">Projects</a></div></div></div></div>');
}]);
angular.module('editor.app').run(['$templateCache',function($templateCache){    $templateCache.put('profile.html','<h2>{{ item }}</h2><h3>{{ profile.name ? profile.name : profile.username }}</h3><div class="list-group" ng-init="profileType = (profile.files && \'project\' || false) || (profile.projects && \'user\')"><div class="list-group-item"><div class="row"><div class="col-md-10"><p>Name: {{profile.name}}</p></div><div class="col-md-2"><a ng-if="profile.files" class="btn btn-success" ng-click="addFile()">Add File</a></div></div></div><div class="col-md-offset-3 col-md-5"><div class="list-group-item"><div ng-init="items=profile.projects||profile.files"><div ng-if="!((profile.projects||profile.files)|count)">no {{ profile.files && \'files\' || \'projects\' }}</div><div ng-if="((profile.projects||profile.files)|count)>=2"><span class="badge">{{ (profile.projects || profile.files) | count | update }} </span>{{ profile.projects && \'projects\' || \'files\' }}</div><div ng-if="((profile.projects||profile.files)|count)==1"><span class="badge">{{ (profile.projects || profile.files) | count | update }} </span>{{ profile.projects && \'project\' || \'file\' }}</div><ul ng-if="profile.projects" class="list-unstyled list-inline"><li ng-repeat="proj in profile.projects"><a ng-href="/project/profile/{{proj._id.$oid}}" class="btn btn-link btn-lg">{{ proj.name }}</a></li></ul><table ng-if="profile.files" class="table table-condensed table-hover"><thead><tr><th>num</th><th>name</th><th>type</th><th>edit</th><th>remove</th></tr></thead><tbody><tr ng-repeat="file in profile.files"><td><button class="btn btn-xs itm-num btn-primary" ng-disabled="1">{{ $index+1 }}</button></td><td>{{ file.name }}</td><td><p><span class="label label-default">[{{ file.name | fileType }}]</span></p></td><td><a ng-href="/file/{{ file.oid || file._id.$oid }}/edit" class="btn btn-default btn-sm">Edit</a></td><td><button class="inline-block close-box btn-danger btn" ng-hover><close-btn proj-id="{{(file.oid || file._id.$oid)}}"></close-btn></button></td></tr></tbody></table></div></div></div></div><a ng-href="/{{ item }}/list" class="btn btn-default">back</a>');
}]);
angular.module('editor.app').run(['$templateCache',function($templateCache){    $templateCache.put('edit.html','<style>
            .ace_editor {
                height:200px;
            }
        </style><div class="col-md-10 col-md-offset-1"><div class="thumbnail"><section><div ui-ace="cfg" ng-model="editorData" size="20">Ace here</div></section><div class="caption"><div class="btn-group btn-group-justified"><div class="btn-group"><button class="btn btn-default" ng-click="save(editorData)">Save &amp; Edit</button></div><div class="btn-group"><button class="btn btn-default" ng-click="saveAndClose(editorData)">Save &amp; Close</button></div><div class="btn-group"><a class="btn btn-default" ng-href="/project/profile/{{ file.project_id }}">Close</a></div></div></div></div></div>');
}]);
angular.module('editor.app').run(['$templateCache',function($templateCache){    $templateCache.put('home.html','<h1>Home</h1>');
}]);
angular.module('editor.app').run(['$templateCache',function($templateCache){    $templateCache.put('x.html','');
}]);
