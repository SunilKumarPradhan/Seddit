"""allow long image data for posts

Revision ID: 7d82d4f9f341
Revises: 382b9ef7d182
Create Date: 2025-11-30 15:25:00.000000
"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "7d82d4f9f341"
down_revision = "382b9ef7d182"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.alter_column("posts", "image_url", type_=sa.Text(), existing_nullable=True)


def downgrade() -> None:
    op.alter_column("posts", "image_url", type_=sa.String(length=500), existing_nullable=True)