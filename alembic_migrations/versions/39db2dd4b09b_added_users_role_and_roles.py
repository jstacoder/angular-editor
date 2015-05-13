"""added users.role and roles

Revision ID: 39db2dd4b09b
Revises: 2d039bfaa689
Create Date: 2015-05-13 00:41:09.699266

"""

# revision identifiers, used by Alembic.
revision = '39db2dd4b09b'
down_revision = '2d039bfaa689'

from alembic import op
from sqlalchemy.sql.expression import column,table
import sqlalchemy as sa

def add_roles():
    stmt = table('roles',
        column('name',sa.String(255)),
        column('auth_level',sa.Integer),
        column('can_authenticate',sa.Boolean)
    ).insert().values(
            name=sa.bindparam('name'),
            auth_level=sa.bindparam('auth_level'),
            can_authenticate=sa.bindparam('can_authenticate'),
    )
    
    arg_list = [
            dict(name='admin',auth_level=5,can_authenticate=True),
            dict(name='member',auth_level=3,can_authenticate=True),
            dict(name='guest',auth_level=0,can_authenticate=False),
    ]
    op.get_bind().execute(stmt,arg_list) 

def upgrade():
    ### commands auto generated by Alembic - please adjust! ###
    op.create_table('roles',
    sa.Column('name', sa.String(length=255), nullable=False),
    sa.Column('auth_level', sa.Integer(), nullable=False),
    sa.Column('can_authenticate', sa.Boolean(), nullable=True),
    sa.Column('id', sa.Integer(), nullable=False),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('auth_level')
    )

    op.add_column(u'users', sa.Column('role_id', sa.Integer(), nullable=True))

    add_roles()
    ### end Alembic commands ###


def downgrade():
    ### commands auto generated by Alembic - please adjust! ###
    op.drop_column(u'users', 'role_id')
    op.drop_table('roles')
    ### end Alembic commands ###
