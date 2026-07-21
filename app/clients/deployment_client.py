from kubernetes import client


class DeploymentClient:

    def __init__(self):
        self.apps = client.AppsV1Api()

    def get_deployment(self, namespace: str, name: str):
        return self.apps.read_namespaced_deployment(
            name=name,
            namespace=namespace,
        )