"""inital migration, users table,projects table, documents table

Revision ID: 2371a6d11a7d
Revises: None
Create Date: 2015-05-04 11:44:40.474848

"""

# revision identifiers, used by Alembic.
revision = '2371a6d11a7d'
down_revision = None

from alembic import op
import sqlalchemy as sa


def upgrade():
    ### commands auto generated by Alembic - please adjust! ###
    op.create_table('users',
        sa.Column('username', 
            sa.String(length=255), 
            nullable=True
        ),
        sa.Column('id', 
            sa.Integer(), 
            nullable=False
        ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('username')
    )
    op.create_table('projects',
        sa.Column('name', 
            sa.String(length=255), 
            nullable=True
        ),
        sa.Column('id', 
            sa.Integer(), 
            nullable=False
        ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_table('documents',
        sa.Column('id', 
            sa.Integer(), 
            nullable=False
        ),
        sa.Column('title', 
            sa.String(length=255), 
            nullable=True
        ),
        sa.Column('project_id', 
            sa.Integer(), 
            nullable=True
        ),
        sa.Column('content', 
            sa.Text(), 
            nullable=True
        ),
        sa.Column('content_hash', 
            sa.Text(), 
            nullable=True
        ),
        sa.ForeignKeyConstraint(
            ['project_id'], 
            ['projects.id'], 
        ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint(
            'title', 
            'project_id'
        )
    )
    op.create_table('users_projects',
        sa.Column('user_id', 
            sa.Integer(), 
            nullable=True
        ),
        sa.Column('project_id', 
            sa.Integer(), 
            nullable=True
        ),
        sa.ForeignKeyConstraint(['project_id'], ['projects.id'], ),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], )
    )
    op.create_table('users_documents',
        sa.Column('user_id', 
            sa.Integer(), 
            nullable=True
        ),
        sa.Column('document_id', 
            sa.Integer(), 
            nullable=True
        ),
        sa.ForeignKeyConstraint(
            ['document_id'], 
            ['documents.id'], 
        ),
        sa.ForeignKeyConstraint(
            ['user_id'], 
            ['users.id'], 
        )
    )
    ### end Alembic commands ###


def downgrade():
    ### commands auto generated by Alembic - please adjust! ###
    op.drop_table('users_documents')
    op.drop_table('users_projects')
    op.drop_table('documents')
    op.drop_table('projects')
    op.drop_table('users')
    ### end Alembic commands ###