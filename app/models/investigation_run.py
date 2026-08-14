from datetime import datetime, timezone

from sqlalchemy import Column, Integer, String, DateTime, ForeignKey

from app.database.base import Base


class InvestigationRun(Base):
    __tablename__ = "investigation_runs"

    id = Column(Integer, primary_key=True, index=True)

    investigation_id = Column(
        String,
        ForeignKey("investigations.investigation_id"),
        nullable=False,
        index=True,
    )

    run_number = Column(Integer, nullable=False)

    run_type = Column(
        String,
        nullable=False,
    )
    # initial | restart

    tokens_consumed = Column(
        Integer,
        nullable=False,
        default=0,
    )

    created_at = Column(
        DateTime,
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )
