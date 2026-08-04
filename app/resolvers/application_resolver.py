from difflib import SequenceMatcher
from app.schemas.application_context import ApplicationContext
from app.schemas.incident_intent import IncidentIntent
from app.services.application_discovery_service import (
    ApplicationDiscoveryService,
)


class ApplicationResolver:

    def __init__(self):

        self.discovery = ApplicationDiscoveryService()

    async def resolve(
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

        # ---------------------------------------
        # Fetch applications from ArgoCD
        # ---------------------------------------

        applications = await self.discovery.discover_from_argocd()

        if not applications:

            print("No ArgoCD applications found. Falling back to Kubernetes.")

            applications = await self.discovery.discover_from_kubernetes()

        candidates = []

        for application in applications:

            if "metadata" in application:
                app_name = application["metadata"]["name"].lower()
                namespace = (
                    application["spec"]["destination"]["namespace"].lower()
                )
            else:
                app_name = application["name"].lower()
                namespace = application["namespace"].lower()

            if env in namespace or env in app_name:
                candidates.append(
                    {
                        "name": app_name,
                        "namespace": namespace,
                    }
                )
        if not candidates:
            raise ValueError(
                f"No applications found for environment '{env}'"
            )

        # ---------------------------------------
        # Find the best matching application
        # ---------------------------------------

        best_match = None
        best_score = 0.0

        for candidate in candidates:

            score = SequenceMatcher(
                None,
                service,
                candidate["name"].lower(),
            ).ratio()

            print(
                f"Matching '{service}' -> '{candidate['name']}': {score:.2f}"
            )

            if score > best_score:
                best_score = score
                best_match = candidate

        if best_match is None or best_score < 0.55:
            raise ValueError(
                f"No matching application found for "
                f"service '{service}'"
            )

        print(
            f"Resolved application: "
            f"{best_match['name']} "
            f"(namespace={best_match['namespace']}, "
            f"score={best_score:.2f})"
        )

        # ---------------------------------------
        # Return Application Context
        # ---------------------------------------

        print("\n========== APPLICATION RESOLUTION ==========")
        print(f"Service      : {service}")
        print(f"Environment  : {env}")
        print(f"Candidates   : {candidates}")
        print(f"Best Match   : {best_match}")
        print(f"Score        : {best_score:.2f}")
        print("============================================\n")

        # ---------------------------------------------------
        # Normalize application name
        # ---------------------------------------------------

        application_name = best_match["name"]

        # If ArgoCD app names follow <app>-<env>, strip the env suffix
        suffix = f"-{env}"

        if application_name.endswith(suffix):
            application_name = application_name[: -len(suffix)]

        return ApplicationContext(
            service_name=service,
            application_name=application_name,
            argocd_application=best_match["name"],
            environment=env,
            namespace=best_match["namespace"],
            problem_type=intent.problem_type,
            keywords=intent.keywords,
        )