from pydantic import BaseModel


class Dependency(BaseModel):
    name: str
    kind: str
    namespace: str
    exists: bool
    healthy: bool
    message: str


class DependencySummary(BaseModel):
    dependencies: list[Dependency]
    healthy: bool
    assessment: str