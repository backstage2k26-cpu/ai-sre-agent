from pydantic import BaseModel


class SimilarIncident(BaseModel):
    incident: str
    application: str
    root_cause: str
    resolution: str
    status: str
    similarity: float