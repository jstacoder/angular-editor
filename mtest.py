from mongoengine import Document,StringField,ListField,ReferenceField,connect


connect('editor_app',host='ds055110.mongolab.com',port=55110,username='editor',password='editorpw')


class User(Document):
    name = StringField(max_length=255)


class Post(Document):
    content = StringField()
    authors = ListField(ReferenceField(User))
    similar = ListField(ReferenceField('self'))

bob = User(name='bob').save()
joe = User(name='joe').save()

p1 = Post(content='page1',authors=[bob,joe]).save()
p2 = Post(content='page2',authors=[bob]).save()

print Post.objects(authors__in=[bob])

print Post.objects(authors__all=[bob,joe])

print Post.objects(authors__any=joe)

Post.objects(id=p1.id).update_one(pull__authors=bob)
Post.objects(id=p2.id).update_one(pull__authors=bob)
Post.objects(id=p2.id).update_one(push__authors=joe)

print Post.objects(authors__in=[joe])

print Post.objects(authors__all=[joe])


print bob.id
print joe.id

for itm in Post.objects.all():
    print itm.to_json()
    print itm.authors
