from kubernetes import client

from app.clients.gateway_client import GatewayClient
from app.schemas.network_summary import NetworkSummary


class NetworkService:

    def __init__(self):

        self.gateway = GatewayClient()
        self.core = client.CoreV1Api()

    async def investigate(self, context):

        namespace = context.namespace

        routes = self.gateway.get_http_routes(namespace)
        route_items = routes.get("items", [])
        gateways = self.gateway.get_gateways()

        services = self.core.list_namespaced_service(namespace)

        service_name = None

        for svc in services.items:
            if svc.spec.selector:
                service_name = svc.metadata.name
                break

        service = service_name or context.namespace

        from kubernetes.client.rest import ApiException

        try:
            endpoints = self.core.read_namespaced_endpoints(
                service,
                namespace,
            )
        except ApiException:
            endpoints = None

        gateway_items = gateways.get("items", [])

        gateway_name = (
            gateway_items[0]["metadata"]["name"]
            if gateway_items else None
        )

        gateway_namespace = (
            gateway_items[0]["metadata"]["namespace"]
            if gateway_items else None
        )

        route_name = (
            route_items[0]["metadata"]["name"]
            if route_items else None
        )

        accepted = False
        programmed = False

        if route_items:
            parents = route_items[0].get("status", {}).get("parents", [])

            if parents:
                conditions = parents[0].get("conditions", [])

                accepted = any(
                    c["type"] == "Accepted"
                    and c["status"] == "True"
                    for c in conditions
                )

                programmed = any(
                    c["type"] in ["Programmed", "Reconciled"]
                    and c["status"] == "True"
                    for c in conditions
                )

        endpoint_count = (
            len(endpoints.subsets)
            if endpoints and endpoints.subsets
            else 0
        )

        gateway_ok = len(gateway_items) > 0
        route_ok = len(route_items) > 0
        endpoint_ok = endpoint_count > 0

        if not gateway_ok:
            assessment = "Gateway not found."

        elif not route_ok:
            assessment = "HTTPRoute not found."

        elif not accepted:
            assessment = "HTTPRoute is not accepted."

        elif not endpoint_ok:
            assessment = "No Service Endpoints found."

        else:
            assessment = "Gateway, Route and Endpoints are healthy."

        return NetworkSummary(
            gateway_count=len(gateway_items),
            route_count=len(route_items),
            service_endpoints=endpoint_count,

            gateway_ok=gateway_ok,
            route_ok=route_ok,
            endpoint_ok=endpoint_ok,

            gateway_name=gateway_name,
            gateway_namespace=gateway_namespace,
            route_name=route_name,
            route_accepted=accepted,
            route_programmed=programmed,
            service_name=service,

            assessment=assessment,
        )