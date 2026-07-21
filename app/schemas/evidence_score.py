from pydantic import BaseModel


class EvidenceScore(BaseModel):

    deployment: int

    logs: int

    kubernetes: int

    metrics: int

    network: int

    knowledge: int

    overall: int