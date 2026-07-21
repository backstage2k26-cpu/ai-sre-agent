from pydantic import BaseModel


class Verdict(BaseModel):
    status: str
    confidence: int
    root_cause: str
    owner: str
    investigation_time: str