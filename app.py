from mongoengine import Document,EmbeddedDocument,ReferenceField,EmbeddedDocumentField,StringField,ListField
from flask import Flask,request,session,send_file,make_response

app = Flask(__name__,static_folder='./',template_folder='./')


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


app.run(host='0.0.0.0',port=5555)
