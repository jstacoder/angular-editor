'use strict'

app = angular.module 'sendgrid.app',[]

app.provider 'credential',()->
    self = @
    self.username = ''
    self.password = ''

    self.getUsername = ()->
        return self.username
    self.getPassword = ()->
        return self.password
    rtn =
        $get:()->
            inner_self = @
            inner_self.getCredentials = ()->
                api_user:self.getUsername()
                api_password:self.getPassword()
            return inner_self
        setPassword:(pw)->
            self.password = pw
            return
        setUsername:(name)->
            self.username = name
            return
    return rtn

app.factory 'createData',(credential)->
    return (cfg)->
        rtn = ''
        creds = credential.getCredentials()
        angular.extend(cfg,creds)
        count = 1
        angular.forEach cfg,(itm,key)->
            console.log 'key',key
            console.log 'val',itm
            rtn += "#{key}=#{itm}"
            count += 1
            if (Object.keys(cfg).length+1) > count
                rtn += '&'
        return rtn

app.factory 'sendEmail',($http,createData)->
    return (cfg)->
        return $http.post('https://api.sendgrid.com/api/mail.send.json',createData(cfg))

app.config (credentialProvider)->
    credentialProvider.setPassword 'jstacoder'
    credentialProvider.setUsername '1414wp8888'
    return

app.run (sendEmail)->
    cfg =
        from:'kyle@level2designs.com'
        fromname:'kyle'
        to:'jstacoder@gmail.com'
        toname:'kyle'
        subject:'test'
        html:'<h1>Hi</h1>'
    sendEmail(cfg).then (res)->
            console.log res.data
