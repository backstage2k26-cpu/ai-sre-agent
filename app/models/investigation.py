import uuid
from datetime import datetime

from sqlalchemy import DateTime, Integer, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.database.base import Base
from enum import Enum as PyEnum

from sqlalchemy import Enum as SQLEnum


class Investigation(Base):
    investigation_id: Mapped[str] = mapped_column(
        String(20),
        unique=True,
        nullable=False,
        index=True,
    )
    __tablename__ = "investigations"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    incident_number: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        index=True,
    )

    incident_sys_id: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
    )

    status: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
        default="PENDING",
    )

    progress: Mapped[int] = mapped_column(
        Integer,
        default=0,
    )

    current_step: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
    )

    started_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
    )

    completed_at: Mapped[datetime | None] = mapped_column(
        DateTime,
        nullable=True,
    )

    report: Mapped[dict | None] = mapped_column(
        JSONB,
        nullable=True,
    )

    error: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

class InvestigationStatus(str, PyEnum):
    RECEIVED = "RECEIVED"
    QUEUED = "QUEUED"
    RUNNING = "RUNNING"
    COLLECTING_EVIDENCE = "COLLECTING_EVIDENCE"
    AI_REASONING = "AI_REASONING"
    GENERATING_REPORT = "GENERATING_REPORT"
    UPDATING_SERVICENOW = "UPDATING_SERVICENOW"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"

status = mapped_column(
    SQLEnum(InvestigationStatus),
    nullable=False,
    default=InvestigationStatus.RECEIVED,
)