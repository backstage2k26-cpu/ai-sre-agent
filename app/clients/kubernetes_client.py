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

class KubernetesClient:

    def __init__(self):

        config.load_kube_config()

        self.core = client.CoreV1Api()

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

            result.append(
                {
                    "name": pod.metadata.name,
                    "phase": pod.status.phase,
                    "ready": ready,
                    "restart_count": restart_count,
                    "node": pod.spec.node_name,
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