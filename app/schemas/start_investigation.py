from pydantic import BaseModel


class StartInvestigationRequest(BaseModel):
    incident_number: str