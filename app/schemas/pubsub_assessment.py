from pydantic import BaseModel, Field


class PubSubAssessment(BaseModel):
    source: str = "Pub/Sub"

    status: str = "UNKNOWN"
    severity: str = "LOW"
    confidence: float = 0.0

    topic: str | None = None
    subscription: str | None = None

    backlog: int = 0
    oldest_unacked_age_seconds: float = 0.0

    ack_rate: float | None = None
    delivery_rate: float | None = None

    summary: str = "No Pub/Sub assessment available."

    findings: list[str] = Field(default_factory=list)