from pydantic import BaseModel


class IncidentIntent(BaseModel):
    service_name: str
    environment: str
    problem_type: str
    keywords: list[str]