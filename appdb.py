import sqlalchemy as sa
from hashlib import new
from inflection import pluralize, underscore
from sqlalchemy import orm
from bcrypt import gensalt,hashpw,checkpw
from sqlalchemy.ext.declarative import declarative_base,declared_attr

ALG = 'sha256'

def load_db(uri):
    base = declarative_base()
    engine = sa.create_engine(uri,echo=True)
    session = orm.scoped_session(orm.sessionmaker(bind=engine))
    base.engine = engine
    base.session = session
    return base

_Model = load_db('mysql+pymysql://editor:editor@localhost:3306/editor_test')
#_Model = load_db('postgresql://ang:editor@localhost:5432/editor')
#_Model = load_db('sqlite:///test.db')


# classproperty decorator
class classproperty(object):
    def __init__(self, getter):
        self.getter = getter

    def __get__(self, instance, owner):
        return self.getter(owner)


class Model(_Model):
    __abstract__ = True

    def __init__(self,*args,**kwargs):
        super(Model,self).__init__(*args,**kwargs)
        self.save()

    @classproperty
    def query(cls):
        return cls.session.query(cls)

    @classmethod
    def get_all(cls):
        return cls.query.all()

    @classmethod
    def get_by_id(cls,_id):
        return cls.query.get(_id)

    @classmethod
    def get(cls,_id):
        return cls.get_by_id(_id)

    @declared_attr
    def __tablename__(self):
        return underscore(pluralize(self.__name__))

    @declared_attr
    def id(self):
        return sa.Column(sa.Integer,primary_key=True)

    @property
    def _id(self):
        return {
            '$oid':self.id
        }

    def delete(self):
        self.session.delete(self)
        self.session.commit()
        del self
        return True

    def save(self):
        self.session.add(self)
        self.session.commit()
        return self

    def save_all(self,*args):
        self.session.add_all([self] + list(args) or [])
        self.session.commit()
        return self

class Task(Model):
    __table_args__ = (
        (sa.UniqueConstraint('name','project_id')),
    )
    name = sa.Column(sa.String(255),nullable=False)
    project_id = sa.Column(sa.Integer,sa.ForeignKey('projects.id'))
    project = orm.relationship('Project',backref=orm.backref('project',lazy='dynamic'))
    subject = sa.Column(sa.String(500))
    content = sa.Column(sa.Text)
    due_date = sa.Column(sa.DateTime,default='null',nullable=True)

class Project(Model):
    name = sa.Column(sa.String(255))
    users = orm.relationship('User',secondary='users_projects',lazy='dynamic')
    files = orm.relationship('Document',lazy='dynamic')

    def __init__(self,*args,**kwargs):
        if 'users' in kwargs:
            user_ids = kwargs.pop('users')
            for _id in user_ids:
                self.users.append(User.get(_id))
        if 'user' in kwargs or 'user_id' in kwargs:
            self.users.append(User.get(kwargs.pop('user','user_id')))
        super(Project,self).__init__(*args,**kwargs)

    def add_file(self,doc):
        self.files.append(doc)
        for u in self.users.all():
            u.documents.append(doc)
        return self.save()

    def to_json(self):
        return dict(
            name=self.name,
            users=[u.username for u in self.users],
            files=[{'name':f.title,'oid':f.id} for f in self.files],
            _id=self._id,
        )

class Folder(Model):
    __table_args__ = (
        (sa.UniqueConstraint('name','project_id')),
    )

    name = sa.Column(sa.String(255),nullable=False)
    project_id = sa.Column(sa.Integer,sa.ForeignKey('projects.id'))
    project = orm.relationship('Project',backref=orm.backref(
        'folders',lazy='dynamic'))
    files = orm.relationship('Document',lazy='dynamic')
    parent = orm.relationship('Folder',backref=orm.backref('children',lazy='dynamic'),remote_side='folders.c.id')
    parent_id = sa.Column(sa.Integer,sa.ForeignKey('folders.id'))

    
    @classmethod
    def add_default_dir(cls,proj_id,**kwargs):
        if not 'name' in kwargs:
            kwargs['name'] = 'default'
        i = cls(**kwargs)
        i.project_id = proj_id
        i.save()

        

    

class Document(Model):
    __table_args__ = (
        (sa.UniqueConstraint('title','project_id')),
    )
    id = sa.Column(sa.Integer,primary_key=True)
    folder_id = sa.Column(sa.Integer,sa.ForeignKey('folders.id'))
    folder = orm.relationship('Folder')
    title = sa.Column(sa.String(255))
    project_id = sa.Column(sa.Integer,sa.ForeignKey('projects.id'))
    project = orm.relationship('Project')
    content = sa.Column(sa.Text)
    content_hash = sa.Column(sa.Text)
    contributors = orm.relationship('User',secondary='users_documents',lazy='dynamic')

    @property
    def text(self):
        return self.content

    @text.setter
    def text(self,data):
        self.content = data
        self._set_hash(data)
        self.save()


    @property
    def changed(self):
        return new(ALG,self.content).hexdigest() != self.content_hash


    def __init__(self,*args,**kwargs):
        if 'content' in kwargs:
            c = kwargs.pop('content')
            self._set_hash(c)
            self.content = c
        if 'project_id' in kwargs:
            print 'setting project'
            Project.get(kwargs.pop('project_id')).add_file(self)
        super(Document,self).__init__(*args,**kwargs)

    @property
    def oid(self):
        return self.id

    def _set_hash(self,content):
        hsh = new(ALG,c).hexdigest()
        self.content_hash = hsh

    @property
    def name(self):
        return self.title

    @name.setter
    def name(self,data):
        self.title = data

    def to_json(self):
        return dict(
            name=self.title,
            project_id=self.project_id,
            content=self.content,
            content_hash=self.content_hash,
            contributors=[c.to_json() for c in self.contributors],
            _id=self._id,
        )

class Email(Model):

    address = sa.Column(sa.String(255),nullable=False,unique=True)
    user_id = sa.Column(sa.Integer,sa.ForeignKey('users.id'))
    user = orm.relationship('User')

class Role(Model):

    name = sa.Column(sa.String(255),nullable=False)
    auth_level = sa.Column(sa.Integer,nullable=False,unique=True)
    can_authenticate = sa.Column(sa.Boolean,default=False)

class User(Model):

    username = sa.Column(sa.String(255),unique=True)
    projects = orm.relationship('Project',secondary='users_projects',lazy='dynamic')
    documents = orm.relationship('Document',secondary='users_documents',lazy='dynamic')
    _password_hash = sa.Column(sa.Text)
    emails = orm.relationship('Email',lazy='dynamic')
    role_id = sa.Column(sa.Integer,sa.ForeignKey('roles.id'))
    role = orm.relationship('Role')

    @property
    def _is_authenticated(self):
        return True

    @property
    def gravatar_url(self):
        return "http://www.gravatar.com/avatar/{}".format(new('md5',self.emails.all()[0].address.strip()).hexdigest()) if self.emails.all() else ''

    def __init__(self,*args,**kwargs):
        if 'email' in kwargs:
            emails = [kwargs.pop('email')]
            kwargs['emails'] = emails
        if 'emails' in kwargs:
            for addr in kwargs.pop('emails'):
                self.emails.append(Email(address=addr))
        if 'password' in kwargs:
            pw = kwargs.pop('password')
            self.set_password(pw)
        super(User,self).__init__(*args,**kwargs)

    @property
    def name(self):
        return self.username

    @name.setter
    def name(self,data):
        self.username = data
        self.save()

    def set_password(self,data):
        self._password_hash = hashpw(data,gensalt())

    def check_password(self,data):
        return checkpw(data,self._password_hash)

    def add_project(self,proj):
        self.projects.append(proj)
        if len(proj.files.all()):
            for f in proj.files.all():
                self.documents.append(f)
        return self.save()

    def to_json(self):
        return dict(
            name=self.username,
            projects=[p.to_json() for p in self.projects],
            documents=[x.title for x in self.documents],
            emails=[e.address for e in self.emails.all()],
            _id=self._id,
            avatar=self.gravatar_url,
        )


users_projects = sa.Table('users_projects',Model.metadata,
    sa.Column('user_id',sa.Integer,sa.ForeignKey('users.id')),
    sa.Column('project_id',sa.Integer,sa.ForeignKey('projects.id')),
)

users_documents = sa.Table('users_documents',Model.metadata,
    sa.Column('user_id',sa.Integer,sa.ForeignKey('users.id')),
    sa.Column('document_id',sa.Integer,sa.ForeignKey('documents.id')),
)
