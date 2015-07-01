from mongoengine import connect
import json
import os
from app import User,Project,File


def load_data():
    connect('editor_app',host='ds055110.mongolab.com',port=55110,username='editor',password='editorpw')
    users = [
        'joe',
        'jill',
        'jessica',
        'tom',
    ]
    projects = [
        "not-sec proj4",
        "lamoooro5",
        "dumb p\j6",
        "last p",
    ]
    files = [
        "file1.py",
        "file2.py",
        "file3.py",
        "file4.py",
        "file5.py",
        "file6.py",
    ]
    _projs = []
    for p in projects:
        proj,created = Project.objects.get_or_create(name=p)        
        print proj
        print created
        if created:
            proj.save()
        map(lambda x: proj.add_file(dict(name=x)),files)
        _projs.append(proj)


    for u in users:
        user = User(username=u)
        user.save()
        proj = _projs[users.index(u)]
        print proj
        user.add_project(proj)

if __name__ == "__main__":
    load_data()

