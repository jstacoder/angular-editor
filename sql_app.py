#from mongoengine import Document,EmbeddedDocument,ReferenceField,EmbeddedDocumentField,StringField,ListField,connect,queryset,DictField,IntField
from flask import Flask,request,session,send_file,make_response,Blueprint,jsonify,g
from redis import Redis
from functools import partial
import os
import jwt
import json
import pickle
import requests
from appdb import User,Project,Document

cache = Redis()

class RequestCache(object):
    _cache = cache

    def _set(self,key,val,ex):
        self._cache.hset('cache_map',key,val)
        self._cache.set(key,val)
        self._cache.expire(key,ex)

    def _get(self,key):
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


frontend = Blueprint('front',__name__,url_prefix='/test',subdomain='test-domain')
api = Blueprint('api',__name__,url_prefix='/api/v1')


@app.before_request
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

@app.after_request
def af(r):
    r.make_sequence()
    r.implicit_sequence_conversion = True
    data = r.get_data(as_text=True)
    if session.get('CACHE_REQUEST',False):
        print 'setting cache for {}'.format(session.get('CACHE_KEY'))
        _c.set(session.get('CACHE_KEY'),data)
    #res = r.__dict__.pop('response')
    #fields = r.__dict__.copy()
    #r.__dict__['response'] = res
    #p = pickle.dumps(fields)
    #print p
    #x = pickle.loads(p)
    #assert x == p
    return r


@app.before_first_request
def increment_cache():
    print request.environ
    ip_key = CACHE_KEY+':remoteip'
    current_ip = request.environ.get('HTTP_X_FORWARDED_FOR',None) or request.environ.get('HTTP_X_REAL_IP')
    last_ip = _get_cache(ip_key) or 'save'
    if last_ip == 'save' or last_ip != current_ip:
        set_cache(ip_key,current_ip)
        print current_ip
        inc_cache()
    session['current_view_count'] = get_cache()

@api.route('/viewcount')
def vc():
    session['current_view_count'] = get_cache()
    return jsonify(count=session.get('current_view_count',0))

            
@frontend.route('/')
def i():
    return 'hi'

#connect('editor_app2',host='ds055200.mongolab.com',port=55200,username='editor',password=os.environ.get('MONGOHQ_DB_PASSWORD'))

@app.errorhandler(404)
def error(err):
    if not session.get('just_sent',False):
        rtn = send_file('index2.html')
        session.just_sent = True
    else:
        rtn = make_response('')
    return make_response(''),200


def login(oid):
    session['user_id'] = oid

def logout():
    session.pop('user_id',None)

'''
class User(Document):
    username = StringField(max_length=255,required=True)
    projects = ListField(ReferenceField('Project'))
    name = StringField()

    def __init__(self,*args,**kwargs):
        if not 'name' in kwargs:
            kwargs.setdefault('name',kwargs.get('username',''))
        super(Document,self).__init__(*args,**kwargs)



    def add_project(self,proj=None,**kwargs):
        if not proj in self.projects:
            if proj is None:
                proj = kwargs.pop('project')
            if type(proj) == dict:
                proj = Project(**proj)
            self.projects.append(proj)
        return self.save()
'''

def get_user():
    oid = session.get('user_id',None)
    return oid if oid is None else User.session.get(oid)

@app.route('/')
def index():
    return send_file('index2.html')


'''
class File(EmbeddedDocument):
    name = StringField(max_length=255,required=True)
    content = StringField()
    project = ReferenceField('Project')
    oid = IntField()    
   
class Project(Document):
    name = StringField(max_length=255,required=True,unique=True)
    files = ListField(EmbeddedDocumentField('File'))
    _file_map = DictField()
    
    @classmethod
    def _get_file(cls,oid):
        
            get file with referenced oid regardless of project
        
        try:
            rtn = filter(None,map(lambda x: filter(lambda y: y.oid == int(oid),x.files),cls.objects.all()))[0][0]
        except IndexError,e:
            rtn = None
        return rtn 
    
    def has_file(self,name):
        return name in self._file_map.values()

    def get_file(self,idx=None,name=None):
        if idx is not None:
            return self.files[idx]
        return self.files[self._file_map.values().index(name)]

    def add_file(self,_file):
        idx = len(self._file_map.keys())
        if type(_file) == dict:
            f = File(**_file)
        else:
            f = _file
        self._file_map[str(idx)] = f.name
        self.update(push__files=f)
        self.save()
        #f.project = self
        self.files.append(f)
        f.oid = self._get_oid()
        return self.save()
    
    def _get_oid(self):
        return sum(map(lambda x: len(x.files),list(self.__class__.objects)))    
'''

@api.route('/file/create',methods=['POST'])
def _create_file():
    print request.data
    f = Document()
    data = json.loads(request.data)
    f.title = data.get('name',None)
    f.project = Project.session.query(Project).get(data['project'])
    print f.project
    f.save()
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
        
        
@api.route('/create/<obj_type>',methods=['POST'])
def create(obj_type):
    model = dict(
        document=Document,
        project=Project,
        user=User,
    )[obj_type](**json.loads(request.data))
    model.save()
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

@api.route('/<obj_type>',methods=['GET'])
def obj_type(obj_type):
    model = dict(
        user=User,
        project=Project,        
        document=Document,
    )[obj_type]
    objects = model.session.query(model).all()
    res = make_response(
            json.dumps(
                dict(objects=[o.to_json() for o in objects])
            )
    )
    res.headers['Content-Type'] = 'application/json'
    return res
    #return jsonify(objects=[x.to_json() for x in objects])

@api.route('/user',methods=['POST'])
def _user():
    data = json.loads(request.data)
    u = User.session.query(User).filter(User.username==data['username'])
    if u is None:
        u = User(**data)
        u.save()
    return jsonify(user=u.to_json())

@api.route('/user/<_id>',methods=['POST','GET'])
def _get_user(_id):
    u = User.session.query(User).get(_id)
    return jsonify(user=u.to_json())

@api.route('/project',methods=['POST'])
def _project():
    data = json.loads(request.data)
    p = Project.session.query(Project).filter(Project.name==data['name'])
    if p is None:
        p = Project(**data)
        p.save()
    return jsonify(project=p.to_json())

@api.route('/projects',methods=['GET'])
def _projects():
    user = get_user()
    if user is not None:
        #print [dir(p) for p in user.projects]
        projects = [p.to_json() for p in user.projects if hasattr(p,'to_json')]# else Project.objects.get(id=p.id).to_json()]
    else:
        projects = []
    return jsonify(projects=projects)

@api.route('/login',methods=['POST'])
def _login():
    data = json.loads(request.data)
    login(data['id'])
    return jsonify(result='success')

app.register_blueprint(api)

@app.route('/<catch>')
@app.route('/<catch>/<path:more>')
@app.route('/<catch>/<more>/<mmore>')
def catch(catch,more=None,mmore=None):
    if more is None or ('.html' in catch or '.js' in catch or '.css' in catch):
        try:
            return send_file(catch)
        except IOError,e:
            pass
    return send_file('index2.html')

if __name__ == "__main__":
    app.run(host='127.0.0.1',port=4555,debug=True)
