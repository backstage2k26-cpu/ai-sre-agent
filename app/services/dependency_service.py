import re

from kubernetes import client
from kubernetes.client.exceptions import ApiException

from app.clients.deployment_client import DeploymentClient
from app.schemas.dependency_summary import (
    Dependency,
    DependencySummary,
)


class DependencyService:

    def __init__(self):

        self.core = client.CoreV1Api()
        self.deployments = DeploymentClient()

    async def investigate(self, context):

        namespace = context.namespace

        deployment = self.deployments.get_deployment(
            namespace,
            context.application_name,
        )

        dependency_names = set()

        containers = deployment.spec.template.spec.containers

        for container in containers:

            for env in container.env or []:

                value = env.value or ""

                if re.search(
                    r"(postgres|mysql|redis|kafka|rabbitmq|mongo|elastic)",
                    value,
                    re.IGNORECASE,
                ):
                    dependency_names.add(value)

        print("=" * 80)
        print("Dependencies discovered:")
        print(dependency_names)
        print("=" * 80)

        dependencies = []
        overall = True

        for service in dependency_names:

            try:

                endpoints = self.core.read_namespaced_endpoints(
                    service,
                    namespace,
                )

                healthy = (
                    endpoints.subsets is not None
                    and len(endpoints.subsets) > 0
                )

                dependencies.append(
                    Dependency(
                        name=service,
                        kind="Service",
                        namespace=namespace,
                        exists=True,
                        healthy=healthy,
                        message=(
                            "Reachable"
                            if healthy
                            else "No endpoints"
                        ),
                    )
                )

                overall &= healthy

            except ApiException:

                dependencies.append(
                    Dependency(
                        name=service,
                        kind="Service",
                        namespace=namespace,
                        exists=False,
                        healthy=False,
                        message="Not Found",
                    )
                )

                overall = False

        if not dependency_names:

            return DependencySummary(
                dependencies=[],
                healthy=True,
                assessment="No dependencies discovered from Deployment.",
            )

        return DependencySummary(
            dependencies=dependencies,
            healthy=overall,
            assessment=(
                "All discovered dependencies are healthy."
                if overall
                else "One or more discovered dependencies are unhealthy."
            ),
        )