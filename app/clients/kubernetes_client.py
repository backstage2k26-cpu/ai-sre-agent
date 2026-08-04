from kubernetes import client, config

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
    
    async def discover_application_resources(
        self,
        application_name: str,
        environment: str,
    ):
        """
        Discover the actual Kubernetes resources for an application/environment.

        Example:
            application_name = inventory-batch
            environment = dev

        Resolves:
            namespace  = inventory-batch-dev
            deployment = inventory-batch-dev
            service    = inventory-batch-dev
            pod_selector = app.kubernetes.io/name=inventory-batch
        """

        application_name = application_name.lower().strip()
        environment = environment.lower().strip()

        expected_name = f"{application_name}-{environment}"

        deployments = self.apps.list_deployment_for_all_namespaces()

        matched_deployment = None

        # First: exact deployment match
        for deployment in deployments.items:
            name = deployment.metadata.name.lower()

            if name == expected_name:
                matched_deployment = deployment
                break

        # Fallback: application + environment must both match
        if not matched_deployment:
            for deployment in deployments.items:
                name = deployment.metadata.name.lower()
                namespace = deployment.metadata.namespace.lower()

                if (
                    application_name in name
                    and (
                        environment in name
                        or environment in namespace
                    )
                ):
                    matched_deployment = deployment
                    break

        if not matched_deployment:
            return None

        namespace = matched_deployment.metadata.namespace
        deployment_name = matched_deployment.metadata.name

        # Get the real selector directly from Deployment
        selector = (
            matched_deployment.spec.selector.match_labels
            or {}
        )

        # Find service in the discovered namespace
        services = self.core.list_namespaced_service(namespace)

        matched_service = None

        # Prefer exact service name
        for service in services.items:
            if service.metadata.name.lower() == deployment_name.lower():
                matched_service = service
                break

        # Otherwise find a service whose selector matches deployment labels
        if not matched_service:
            deployment_labels = (
                matched_deployment.spec.template.metadata.labels
                or {}
            )

            for service in services.items:
                service_selector = service.spec.selector or {}

                if (
                    service_selector
                    and all(
                        deployment_labels.get(key) == value
                        for key, value in service_selector.items()
                    )
                ):
                    matched_service = service
                    break

        return {
            "application_name": application_name,
            "environment": environment,
            "namespace": namespace,
            "deployment": deployment_name,
            "service": (
                matched_service.metadata.name
                if matched_service
                else None
            ),
            "pod_selector": selector,
        }