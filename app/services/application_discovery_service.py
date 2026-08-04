from app.clients.argocd_client import ArgoCDClient
from app.clients.kubernetes_client import KubernetesClient


class ApplicationDiscoveryService:

    def __init__(self):

        self.argocd = ArgoCDClient()
        self.kubernetes = KubernetesClient()

    async def discover_from_argocd(self):

        return await self.argocd.list_applications()

    async def discover_from_kubernetes(self):

        deployments = await self.kubernetes.list_deployments()
        services = await self.kubernetes.list_services()

        applications = {}

        for deployment in deployments:

            key = (
                deployment["name"],
                deployment["namespace"],
            )

            applications[key] = {
                "name": deployment["name"],
                "namespace": deployment["namespace"],
                "source": "Kubernetes",
            }

        for service in services:

            key = (
                service["name"],
                service["namespace"],
            )

            if key not in applications:

                applications[key] = {
                    "name": service["name"],
                    "namespace": service["namespace"],
                    "source": "Kubernetes",
                }

        return list(applications.values())