from typing import Literal
from pydantic import BaseModel

class InvestigationResult(BaseModel):
    status: Literal[
        "Confirmed",
        "Likely",
        "Inconclusive",
        "Rejected",
    ]
    confidence: int
    root_cause: str
    owner: str
    investigation_time: str