"""create investigation runs table

Revision ID: 9c8f1d2a6b4e
Revises: 72a643570393
Create Date: 2026-08-11 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "9c8f1d2a6b4e"
down_revision: Union[str, Sequence[str], None] = "72a643570393"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "investigation_runs",
        sa.Column("id", sa.Integer(), primary_key=True, nullable=False),
        sa.Column("investigation_id", sa.String(), nullable=False),
        sa.Column("run_number", sa.Integer(), nullable=False),
        sa.Column("run_type", sa.String(), nullable=False),
        sa.Column("tokens_consumed", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(
            ["investigation_id"],
            ["investigations.investigation_id"],
        ),
    )
    op.create_index(
        op.f("ix_investigation_runs_id"),
        "investigation_runs",
        ["id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_investigation_runs_investigation_id"),
        "investigation_runs",
        ["investigation_id"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(op.f("ix_investigation_runs_investigation_id"), table_name="investigation_runs")
    op.drop_index(op.f("ix_investigation_runs_id"), table_name="investigation_runs")
    op.drop_table("investigation_runs")
