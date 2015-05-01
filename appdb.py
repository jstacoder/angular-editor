import sqlalchemy as sa
from hashlib import new
from inflection import pluralize, underscore
from sqlalchemy import orm
from sqlalchemy.ext.declarative import declarative_base,declared_attr

ALG = 'sha256'

def load_db(uri):
    base = declarative_base()
    engine = sa.create_engine(uri)
    session = orm.scoped_session(orm.sessionmaker(bind=engine))
    base.engine = engine
    base.session = session
    return base

_Model = load_db('mysql+pymysql://edit:edit@localhost:3306/editor')

class Model(_Model):
    __abstract__ = True
    @declared_attr
    def __tablename__(self):
        return underscore(pluralize(self.__name__))

    @declared_attr
    def id(self):
        return sa.Column(sa.Integer,primary_key=True)

    def save(self):
        self.session.add(self)
        self.session.commit()
        return self

    def save_all(self,*args):
        self.session.add_all([self] + list(args) or [])
        self.session.commit()
        return self

class Document(Model):
    __table_args__ = (
        (sa.UniqueConstraint('title','project_id')),
    )
    title = sa.Column(sa.String(255))
    project_id = sa.Column(sa.Integer,sa.ForeignKey('projects.id'))
    project = orm.relationship('Project')                                
    content = sa.Column(sa.Text)
    content_hash = sa.Column(sa.Text)
    contributors = orm.relationship('User',secondary='users_documents',lazy='dynamic')


    def __init__(self,*args,**kwargs):
        if 'content' in kwargs:
            c = kwargs.pop('content')
            self._set_hash(c)
            self.content = c
        super(Document,self).__init__(*args,**kwargs)
    
    def _set_hash(self,content):
        hsh = new(ALG,c).hexdigest()
        self.content_hash = hsh

    @property
    def name(self):
        return self.title

    def to_json(self):
        return dict(
            name=self.title,
            project_id=self.project_id,
            content=self.content,
            content_hash=self.content_hash,
            contributors=[c.to_json() for c in self.contributors],
            _id={'$oid':self.id},
        )

class User(Model):

    username = sa.Column(sa.String(255),unique=True)
    projects = orm.relationship('Project',secondary='users_projects',lazy='dynamic')
    documents = orm.relationship('Document',secondary='users_documents',lazy='dynamic')

    def to_json(self):
        return dict(
            name=self.username,
            projects=[p.to_json() for p in self.projects],
            documents=[x.title for x in self.documents],
            _id={'$oid':self.id},
        )


class Project(Model):
    name = sa.Column(sa.String(255))
    users = orm.relationship('User',secondary='users_projects',lazy='dynamic')
    files = orm.relationship('Document',lazy='dynamic')

    def to_json(self):
        return dict(
            name=self.name,
            users=[u.username for u in self.users],
            files=[f.title for f in self.files],
            _id={'$oid':self.id},
        )
    

users_projects = sa.Table('users_projects',Model.metadata,
    sa.Column('user_id',sa.Integer,sa.ForeignKey('users.id')),
    sa.Column('project_id',sa.Integer,sa.ForeignKey('projects.id')),
)

users_documents = sa.Table('users_documents',Model.metadata,
    sa.Column('user_id',sa.Integer,sa.ForeignKey('users.id')),
    sa.Column('document_id',sa.Integer,sa.ForeignKey('documents.id')),
)

