from app.schemas.application_context import ApplicationContext
from app.schemas.incident_intent import IncidentIntent


class ApplicationResolver:

    def __init__(self):

        self.cache = {
            "market": {
                "dev": "market-dev",
                "qa": "market-qa",
                "stage": "market-stage",
                "prod": "market-prod",
            },
            "payment": {
                "dev": "payment-dev",
                "stage": "payment-stage",
                "prod": "payment-prod",
            },
            "inventory": {
                "dev": "inventory-dev",
                "qa": "inventory-qa",
            },
        }

    def resolve(
        self,
        intent: IncidentIntent,
    ) -> ApplicationContext:

        service = (
            intent.service_name.lower()
            .replace("service", "")
            .replace("application", "")
            .replace("app", "")
            .replace("api", "")
            .replace("backend", "")
            .replace("frontend", "")
            .replace("web", "")
            .replace("microservice", "")
            .strip()
        )

        env = intent.environment.lower().strip()

        if service not in self.cache:
            raise ValueError(f"Unknown service: {service}")

        if env not in self.cache[service]:
            raise ValueError(
                f"Unable to resolve application "
                f"for service='{service}' "
                f"environment='{env}'"
            )

        app = self.cache[service][env]

        return ApplicationContext(
            service_name=intent.service_name,
            environment=env,
            application_name=app,
            namespace=app,
            problem_type=intent.problem_type,
            keywords=intent.keywords,
        )