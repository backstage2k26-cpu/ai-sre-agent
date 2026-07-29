from kubernetes import client, config


class KubernetesClient:

    async def get_events(
        self,
        namespace: str,
    ):
        ...

    async def get_pods(
        self,
        namespace: str,
    ):
        ...

class KubernetesClient:

    def __init__(self):

        config.load_kube_config()

        self.core = client.CoreV1Api()
        self.apps = client.AppsV1Api()

    async def get_pods(
        self,
        namespace: str,
    ):

        pods = self.core.list_namespaced_pod(namespace)

        result = []

        for pod in pods.items:

            restart_count = sum(
                c.restart_count
                for c in (
                    pod.status.container_statuses or []
                )
            )

            ready = all(
                c.ready
                for c in (
                    pod.status.container_statuses or []
                )
            )

            waiting_reason = None

            for status in (
                pod.status.container_statuses or []
            ):

                if (
                    status.state
                    and status.state.waiting
                ):

                    waiting_reason = (
                        status.state.waiting.reason
                    )

                    break

            result.append(
                {
                    "name": pod.metadata.name,
                    "phase": pod.status.phase,
                    "ready": ready,
                    "restart_count": restart_count,
                    "node": pod.spec.node_name,
                    "waiting_reason": waiting_reason,
                }
            )

        return result
    
    async def get_events(
        self,
        namespace: str,
    ):

        events = self.core.list_namespaced_event(namespace)

        result = []

        for event in events.items:

            result.append(
                {
                    "type": event.type,
                    "reason": event.reason,
                    "message": event.message,
                    "object": event.involved_object.name,
                    "time": (
                        str(event.last_timestamp)
                        if event.last_timestamp
                        else None
                    ),
                }
            )

        return result
    async def list_deployments(
        self,
    ):

        deployments = self.apps.list_deployment_for_all_namespaces()

        return [
            {
                "name": deployment.metadata.name,
                "namespace": deployment.metadata.namespace,
            }
            for deployment in deployments.items
        ]
    
    async def list_services(
        self,
    ):

        services = self.core.list_service_for_all_namespaces()

        return [
            {
                "name": service.metadata.name,
                "namespace": service.metadata.namespace,
            }
            for service in services.items
        ]
    
    async def list_namespaces(
        self,
    ):

        namespaces = self.core.list_namespace()

        return [
            namespace.metadata.name
            for namespace in namespaces.items
        ]