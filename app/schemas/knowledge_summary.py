from pydantic import BaseModel

from app.schemas.knowledge_match import KnowledgeMatch


class KnowledgeSummary(BaseModel):

    found: bool

    matches: list[KnowledgeMatch]