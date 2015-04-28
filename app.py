from mongoengine import Document,EmbeddedDocument,ReferenceField,EmbeddedDocumentField,StringField,ListField,connect,queryset
from flask import Flask,request,session,send_file,make_response,Blueprint,jsonify,g
import jwt
import json

app = Flask(__name__,static_folder='./',template_folder='./',static_url_path='')
app.config['SECRET_KEY'] = 'shhh'


api = Blueprint('api',__name__,url_prefix='/api/v1')


connect('newdb')

def login(oid):
    session['user_id'] = oid

def logout():
    session.pop('user_id',None)

class User(Document):
    username = StringField(max_length=255,required=True)
    projects = ListField(ReferenceField('Project'))

    def add_project(self,proj=None,**kwargs):
        if not proj in self.projects:
            if type(proj) == dict:
                proj = Project(**proj)
            self.projects.append(proj)
        return self.save()

def get_user():
    oid = session.get('user_id',None)
    return oid if oid is None else User.objects.get(id=oid)

@app.route('/')
def index():
    return send_file('index.html')


class File(Document):
    name = StringField(max_length=255,required=True)
    content = StringField()
    project = ReferenceField('Project')

class Project(Document):
    name = StringField(max_length=255,required=True,unique=True)
    files = ListField(ReferenceField('File'))

    def add_file(self,_file):
        f = File(**_file)
        f.save()
        f.project = self        
        self.files.append(f)
        return self.save()

@api.route('/files/<pid>',methods=['GET'])
def _files(pid):
    rtn = []
    project = Project.objects.get(id=pid)
    for fle in project.files:
        rtn.append(fle)
    return jsonify(files=[f.to_json() for f in rtn])
        
@api.route('/save',methods=['POST'])
def save():
    data = json.loads(request.data)
    fle = File.objects.get(id=data['id'])
    print data['content']
    fle.content = data['content']
    fle = fle.save()
    return jsonify(result='success',fle=fle.to_json())

@api.route('/<obj_type>',methods=['GET'])
def obj_type(obj_type):
    model = dict(
        user=User,
        project=Project,
        file=File,
    )[obj_type]
    objects = model.objects.all()
    return jsonify(objects=[x.to_json() for x in objects])

@api.route('/user',methods=['POST'])
def _user():
    data = json.loads(request.data)
    try:
        u = User.objects.get(username=data['username'])
    except:
        u = User(**data)
        u.save()
    return jsonify(user=u.to_json())

@api.route('/user/<_id>',methods=['POST','GET'])
def _get_user(_id):
    u = User.objects.get(id=_id)
    return jsonify(user=u.to_json())

@api.route('/project',methods=['POST'])
def _project():
    data = json.loads(request.data)
    try:
        p = Project.objects.get(name=data['name'])
    except:
        p = Project(**data)
        p.save()
    return jsonify(project=p.to_json())

@api.route('/projects',methods=['GET'])
def _projects():
    user = get_user()
    if user is not None:
        print [dir(p) for p in user.projects]
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


if __name__ == "__main__":
    app.run(host='0.0.0.0',port=5555,debug=True)
