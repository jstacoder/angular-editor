from sqlalchemy.sql.expression import select,table,column
import sqlalchemy as sa

print select([column('id')],from_obj=table('projects'))
#pids = execute(stmt).fetchall()
stmt = table('folders',
            column('name'),
            column('project_id')).\
                         insert().\
                    values({
                        'name':sa.bindparam('name'),
                        'project_id':sa.bindparam('pid')
})
#    execute(stmt,[pids])
print stmt
