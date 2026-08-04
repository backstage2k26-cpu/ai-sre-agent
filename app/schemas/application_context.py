from pydantic import BaseModel


class ApplicationContext(BaseModel):
    service_name: str
    environment: str
    application_name: str
    argocd_application: str
    application_name: str
    namespace: str
    problem_type: str
    keywords: list[str]