from flask import Flask,request,session,send_file,make_response,Blueprint,jsonify,g,redirect
from redis import Redis
from functools import partial,wraps
import os
import jwt
import json
import pickle
import requests
from shortuuid import uuid
from bcrypt import hashpw, gensalt
from appdb import User,Project,Document,Email,Model,Task,Folder

cache = Redis()

#
# 60 min * 24 hrs * 7 days
#
TOKEN_VALID_FOR = 60*24*7
EXP_ARG = dict(ex=TOKEN_VALID_FOR)



MODEL_DICT = dict(
    file=Document,
    document=Document,
    project=Project,
    user=User,
    email=Email,
)

class Name(object):
    name = 'Fail'



auth = Blueprint('auth',__name__,url_prefix='/auth')

def make_session(user):
    key = getattr(user,'uuid',None) or uuid(name=user.id)
    val = True
    cache.set(key,val,**EXP_ARG)


_id_by_name = lambda name: User.query.filter(
                                User.username == name
                            ).first().id
pw = lambda data: hashpw(data,gensalt())
def seed_db():
    Model.metadata.bind = Model.engine
    Model.metadata.bind.execute(
            User.__table__.insert().values([
                dict(
                    username='jstacoder',_password_hash=pw('jstacoder')
                ),
                dict(
                    username='jessicarrr',_password_hash=pw('jessicarrr')
                ),
            ])
    )
    users = [
        _id_by_name('jstacoder'),
        _id_by_name('jessicarrr')
    ]
    Project(name='projA',users=users).save()
    Project(name='projB',users=users).save()
    Project(name='projC',users=[users[0]]).save()
    Project(name='projD',users=[users[1]]).save()
    Email(address='jstacoder@gmail.com',user_id=_id_by_name('jstacoder')).save()
    Email(address='jessicarrr@gmail.com',user_id=_id_by_name('jessicarrr')).save()



nme = Name()
def secure_route(f):
    @wraps(f)
    def wrapper(*args,**kwargs):
        headers = request.headers
        auth = headers.get('Authorization',None)
        if auth is not None:
            print auth
            token = auth.split(' ')[-1]
            if not token == 'null':
                user_data = jwt.decode(token,str(session.get('user_id',None)))
                if int(user_data.get('id')) == session.get('user_id'):
                    g.user = User.get(user_data.get('id'))
                    print g.get('user',nme).name
        return f(*args,**kwargs)
    return wrapper

def get_token(user):
    return jwt.encode(
                    dict(
                        username = user.name,
                        id = user.id,
                        emails = [
                            x.address for x in user.emails
                        ],
                        avatar = user.gravatar_url,
                        uuid = uuid(name=user.id),
                    ),
                    uuid(name=user.id)
    )




def verify_token(uid,token):
    return jwt.decode(token,uid)
    
def read_token(token,key):
    return jwt.decode(token,key)

def _read_token(token,key):
    return jwt.decode(token,key,verify=False)

def safe_read_token(token,key):
    try:
        return read_token(token,key)
    except jwt.exceptions.DecodeError:
        return _read_token(token,key)


class RequestCache(object):
    _cache = cache

    def _make_key(self,data):
        data = data[1:] if data[0] is '/' else data
        return data.replace('/',':').replace('?','')

    def _set(self,key,val,ex):
        key = self._make_key(key)
        self._cache.hset('cache_map',key,val)
        self._cache.set(key,val)
        self._cache.expire(key,ex)

    def _get(self,key):
        key = self._make_key(key)
        return self._cache.get(key)

    def get(self,key):
        if self._has(key):
            rtn = self._get(key) or False
        return False

    def set(self,key,val,ex=5000):
        if not self._has(key):
            return self._set(key,val,ex)
        else:
            pass

    def _has(self,key):
        return key in self._cache.hkeys("cache_map")

_c = RequestCache()


_inc_cache = lambda key: cache.incr(key)
_get_cache = lambda key: cache.get(key)

CACHE_KEY = 'AGEDITCOUNT'

inc_cache = partial(_inc_cache,CACHE_KEY)
get_cache = partial(_get_cache,CACHE_KEY)
set_cache = lambda key,val,**kwargs: cache.set(key,val,**kwargs)


app = Flask(__name__,static_folder='./',template_folder='./',static_url_path='')
app.config['SECRET_KEY'] = 'shhh'


frontend = Blueprint('front',__name__,url_prefix='')
api = Blueprint('api',__name__,url_prefix='/api/v1')


'''
@app.route('/<catch>')
@app.route('/<catch>/<path:more>')
@app.route('/<catch>/<more>/<mmore>')
def catch(catch,more=None,mmore=None):
    if more is None or (
            '.json' in catch or 
            '.html' in catch or 
            '.js' in catch or 
            '.css' in catch or 
            '.ttf' in catch or 
            '.woff' in catch):
        try:
            return send_file(catch)
        except IOError,e:
            pass
    return make_response(open('index2.html').read())
'''

#@app.before_request
def check_request_cache():
    session['CACHE_REQUEST'] = False
    CACHE_KEY_PREFIX = 'AEA:CACHE:{}'
    res = None
    if request.method.lower() == 'get':
        cache_key = CACHE_KEY_PREFIX.format(
                request.full_path
        )
    else:
        cache_key = CACHE_KEY_PREFIX.format(
                request.data
        )
    if not _c._has(cache_key):
        session['CACHE_REQUEST'] = True
        session['CACHE_KEY'] = cache_key
    else:
        res = _c.get(cache_key)
        if not res:
            session['CACHE_REQUEST'] = True
            session['CACHE_KEY'] = cache_key
        else:
            pass
    if res and res is not None:
        print '*****using cache******'
        return make_response(res)

#@app.after_request
def af(r):
    
    from coffeescript import compile as coffee
    r.direct_passthrough = False
    #r.implicit_sequence_conversion = True
    data = r.data
    if len(request.url.split('.')) > 1 and request.path.endswith('.coffee'):
        data = coffee(data)
        r = make_response(data)
    if session.get('CACHE_REQUEST',False):
        print 'setting cache for {}'.format(session.get('CACHE_KEY'))
        _c.set(session.get('CACHE_KEY'),data)
    res = r.__dict__.pop('response')
    fields = r.__dict__.copy()
    r.__dict__['response'] = res
    p = pickle.dumps(data)
    #print p
    x = pickle.loads(p)
    assert x == data
    return r


@app.before_first_request
def increment_cache():
    #print request.environ
    ip_key = CACHE_KEY+':remoteip'
    current_ip = request.environ.get('HTTP_X_FORWARDED_FOR',None) or request.environ.get('HTTP_X_REAL_IP')
    last_ip = _get_cache(ip_key) or 'save'
    if last_ip == 'save' or last_ip != current_ip:
        set_cache(ip_key,current_ip)
        #print current_ip
        inc_cache()
    session['current_view_count'] = get_cache()

@api.route('/viewcount')
def vc():
    session['current_view_count'] = get_cache()
    return jsonify(count=session.get('current_view_count',0))


@app.errorhandler(404)
def error(err):
    if not session.get('just_sent',False):
        rtn = send_file('index2.html')
        session.just_sent = True
    else:
        rtn = (make_response(''),200)
    return rtn

def login(oid):
    session['user_id'] = oid

def logout():
    session.pop('user_id',None)

class AnonymuousUser(object):
    _is_authenticated = False
    
    @property
    def is_authenticated(self):
        return self._is_authenticated
    
    def __init__(self,authenticated=False):
        self._is_authenticated = authenticated
    

def get_user():
    oid = session.get('user_id',None)
    return AnonymuousUser() if oid is None else User.get(oid)

@api.route('/logout',methods=['POST'])
def _logout():
    logout()
    return jsonify(success=True)


@api.route('/register',methods=['POST'])
def reg():
    data = json.loads(request.data)
    print data
    email = data.get('email',False)
    pw = data.get('password',False)
    username = data.get('username',False)
    user_exists = User.query.filter(User.username==username).first() and User.query.join(Email).filter(Email.address==email).first()
    if user_exists:
        rtn = dict(result='Error',success=False,reason='user exists')
    else:
        user = User(username=username,password=pw,emails=[email])
        user.save()
        rtn = dict(result='Success',success=True,reason='user created',obj=user.to_json())
    return jsonify(rtn)




@api.route('/authenticate',methods=['POST'])
def _auth_login():
    data = json.loads(request.data)
    email = data.get('email',False)
    pw = data.get('password',False)
    user = User.query.join(Email).\
                        filter(Email.address==email).\
                        first()
    if user is not None:
        if user.check_password(pw):
            login(user.id)
            rtn = jsonify(token=get_token(user))
        else:
            rtn = make_response(json.dumps(dict(success=False,error=True)))
            rtn.headers['Content-Type'] = 'Application/Json'
            # jsonify(token=False,error="incorrect authentication"),301
    else:
        rtn = make_response(json.dumps(dict(success=False,error=True)))
        rtn.headers['Content-Type'] = 'Application/Json'
        # jsonify(token=False,error="incorrect authentication"),301
        #rtn = False #jsonify(token=False,error="incorrect authentication"), 301
    return rtn

@app.route('/')
def index():
    return send_file('index2.html')

@api.route('/file/create',methods=['POST'])
def _create_file():
    print request.data
    f = Document()
    data = json.loads(request.data)
    f.title = data.get('name',None)
    Project.get(data['project']).add_file(f)
    f.save()
    print 'created file'
    return jsonify(result='success',obj=f.to_json())

@api.route('/file/<oid>')
def _file2(oid):
    fle = Document.session.query(Document).get(int(oid))
    return jsonify(fle.to_json())

@api.route('/files/<pid>',methods=['GET'])
def _files(pid):
    rtn = []
    project = Project.session.query(Project).get(pid)
    for fle in project.files:
    #    print dir(fle)
    #    print File.objects.get(id=fle.id)
        rtn.append(fle)
    return jsonify(objects=[f.to_json() for f in rtn])


@api.route('/delete/<obj_type>',methods=['POST'])
def delete(obj_type):
    result = MODEL_DICT[obj_type].get(json.loads(request.data)['object_id']).delete()
    return jsonify(result=result or 'fail')

@api.route('/create/<obj_type>',methods=['POST'])
def create(obj_type):
    model = MODEL_DICT[obj_type](
            **json.loads(
                request.data
            )
    ).save()
    return jsonify(object=model.to_json())


@api.route('/save',methods=['POST'])
def save():
    data = json.loads(request.data)
    print data
    #fle = Project._get_file(data['id'])
    projs =  Project.get_all()
    save_content = 'content' in data
    save_name = 'name' in data
    fle = Document.session.query(Document).get(data['id'])
    _p = fle.project
    #p = Project.objects.get(id=json.loads(fle.to_json())['project']['$oid'])
    print fle,_p
    if save_content:
        fle.content = data['content']
    if save_name:
        fle.name = data['name']
    fle.save()
    return jsonify(result='success',obj=fle.to_json())


@api.route('/project',methods=['GET'])
@secure_route
def _projects():
    print g.get('user',nme).name
    user = get_user()
    print user.projects.all() if user._is_authenticated else ''
    if user._is_authenticated:
        #print [dir(p) for p in user.projects]
        projects = [p.to_json() for p in user.projects.all()]# else Project.objects.get(id=p.id).to_json()]
    else:
        projects = []
    return jsonify(projects=projects)


inner_api = Blueprint('inner_api',__name__,url_prefix='/api/v1/get')

@inner_api.route('/<obj_type>',methods=['GET'])
@secure_route
def obj_type(obj_type):
    model = dict(
        user=User,
        project=Project,
        document=Document,
    )[obj_type]
    objects = model.get_all()
    res = make_response(
            json.dumps(
                dict(objects=[o.to_json() for o in objects])
            )
    )
    res.headers['Content-Type'] = 'application/json'
    res.headers['X-Sent-From'] = 'this dammn functuiobn'
    res.set_cookie('damnFuncCookie','ahhhhh')
    return res
    #return jsonify(objects=[x.to_json() for x in objects])


@api.route('/user',methods=['POST'])
@secure_route
def _user():
    data = json.loads(request.data)
    u = User.session.query(User).filter(User.username==data['username'])
    if u is None:
        u = User(**data)
        u.save()
    return jsonify(user=u.to_json())



@api.route('/user/<_id>',methods=['POST','GET'])
@secure_route
def _get_user(_id):
    u = User.session.query(User).get(_id)
    return jsonify(user=u.to_json())



@api.route('/project',methods=['POST'])
@secure_route
def _project():

    data = json.loads(request.data)
    p = Project.session.query(Project).filter(Project.name==data['name'])
    if p is None:
        p = Project(**data)
        p.save()
    return jsonify(project=p.to_json())


def login(data):
    user = User.get_by_email(data.get('email'))
    if user:
        return user.check_password(data.get('password')) and user

@api.route('/login',methods=['POST'])
def _login():
    data = json.loads(request.data)
    user = login(data)
    if user:
        make_session(user)
        token = get_token(user)        
        rtn = jsonify(result='success',token=token)
    else:
        rtn = (jsonify(result='error',error='failed auth'),403)
    return rtn



app.register_blueprint(api)
assets = Blueprint('assets',__name__,url_prefix='/vendor/<asset_dir>/<path:asset>')

@assets.route('/')
def _assets(asset_dir,asset=None):
    if asset is None:
        asset = asset_dir       
        asset_dir = None
    _asset = os.path.join(app.root_path,'vendor',asset_dir,asset)
    print _asset
    if os.path.exists(_asset):
        print _asset,'is good'
        return send_file(_asset)



@app.before_first_request
def bf():
    if request.path == '/login':
        return send_file('index2.html')

@app.before_request
def add_auth():
    print request.blueprint
    print request.endpoint
    print request.path
    if len(request.path.split('.')) == 2:
        _asset = os.path.join(os.path.realpath(os.getcwd()),request.path)
        print _asset
        if os.path.exists(_asset):
            return send_file(_asset)
    else:
        if request.path == '/login':
            return send_file('index2.html')
        return make_response('')
        if request.headers.get('Authentication',None) is not None:
            token = request.headers['Authentication'].split(' ')[-1]
            _uuid = jwt.decode(token,verify=False).get('uuid')
            session['user_id'] = verify_token(token,_uuid).get('id')
        else:
            if not request.path == '/login' and (request.blueprint is None or request.blueprint == 'api') and request.blueprint != 'assets':
                pass
                return redirect('/login')


app.register_blueprint(inner_api)
app.register_blueprint(assets)


if __name__ == "__main__":
    app.run(host='127.0.0.1',port=4555,debug=True)
