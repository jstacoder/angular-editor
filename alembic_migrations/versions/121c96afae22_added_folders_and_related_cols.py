"""added folders and related cols

Revision ID: 121c96afae22
Revises: 39db2dd4b09b
Create Date: 2015-05-13 16:22:00.889246

"""

# revision identifiers, used by Alembic.
revision = '121c96afae22'
down_revision = '39db2dd4b09b'

from alembic import op
import sqlalchemy as sa
from sqlalchemy.sql.expression import table,column,select
from sqlalchemy import exc
import sys
import sql_app
from bcrypt import hashpw,gensalt
execute = lambda stmt,*args: op.get_bind().execute(stmt,*args)

def add_default_folders():
    
    stmt = select([column('id')],from_obj=table('projects'))
    pids = op.get_bind().execute(stmt).fetchall()
    stmt = table('folders',
            column('name'),
            column('project_id')).\
                         insert().\
                    values({
                        'name':sa.bindparam('name'),
                        'project_id':sa.bindparam('pid')
    })    
    [op.get_bind().execute(stmt,[dict(name='default',pid=pid[0])]) for pid in pids]



def upgrade():
    ### commands auto generated by Alembic - please adjust! ###
    op.create_table('folders',
    sa.Column('name', sa.String(length=255), nullable=False),
    sa.Column('project_id', sa.Integer(), nullable=True),
    sa.Column('parent_id', sa.Integer(), nullable=True),
    sa.Column('id', sa.Integer(), nullable=False),
    sa.ForeignKeyConstraint(['parent_id'], ['folders.id'], ),
    sa.ForeignKeyConstraint(['project_id'], ['projects.id'], ),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('name', 'project_id')
    )
    op.add_column(u'documents', sa.Column('folder_id', sa.Integer(), nullable=True))
    try:
        sql_app.seed_db()
        add_default_folders()
    except exc.IntegrityError:
        pass
    ### end Alembic commands ###


def downgrade():
    ### commands auto generated by Alembic - please adjust! ###
    op.drop_column(u'documents', 'folder_id')
    op.drop_table('folders')
    ### end Alembic commands ###
