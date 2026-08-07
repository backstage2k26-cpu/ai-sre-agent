from pydantic import BaseModel


class PlannerResult(BaseModel):
    logs: bool = True
    deployment: bool = True

    kubernetes: bool = False
    metrics: bool = False
    network: bool = False

    pubsub: bool = False
    redis: bool = False
    database: bool = False

    reason: str = ""
    confidence: float = 0.0