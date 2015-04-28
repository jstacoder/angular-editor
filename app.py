from mongoengine import Document,EmbeddedDocument,ReferenceField,EmbeddedDocumentField,StringField,ListField,connect,queryset
from flask import Flask,request,session,send_file,make_response,Blueprint,jsonify
import json

app = Flask(__name__,static_folder='./',template_folder='./',static_url_path='')


api = Blueprint('api',__name__,url_prefix='/api/v1')


connect('newdb')

@app.route('/')
def index():
    return send_file('index.html')

class User(Document):
    username = StringField(max_length=255,required=True)
    projects = ListField(ReferenceField('Project'))


class Project(Document):
    name = StringField(max_length=255,required=True,unique=True)
    files = ListField(ReferenceField('File'))

class File(Document):
    name = StringField(max_length=255,required=True)
    content = StringField()


@api.route('/user',methods=['GET','POST'])
def user():
    if request.method.upper() == 'GET':
        objects = User.objects.all()
        return jsonify(o=[x.to_json() for x in objects])
        
    else:
        data = json.loads(request.data)
        try:
            u = User.objects.get(username=data['username'])
        except:
            u = User(**data)
            u.save()
        return jsonify(user=u.to_json())

app.register_blueprint(api)

app.run(host='0.0.0.0',port=5555,debug=True)
