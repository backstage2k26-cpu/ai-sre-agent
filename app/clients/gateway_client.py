from kubernetes import client

class GatewayClient:

    def __init__(self):
        self.api = client.CustomObjectsApi()

    def get_gateways(self):

        return self.api.list_cluster_custom_object(
            group="gateway.networking.k8s.io",
            version="v1",
            plural="gateways",
        )

    def get_http_routes(self, namespace):

        return self.api.list_namespaced_custom_object(
            group="gateway.networking.k8s.io",
            version="v1",
            namespace=namespace,
            plural="httproutes",
        )