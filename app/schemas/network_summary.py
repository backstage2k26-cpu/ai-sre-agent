from pydantic import BaseModel

class NetworkSummary(BaseModel):
    gateway_count: int
    route_count: int
    service_endpoints: int

    gateway_ok: bool
    route_ok: bool
    endpoint_ok: bool

    gateway_name: str | None = None
    gateway_namespace: str | None = None

    route_name: str | None = None
    route_accepted: bool = False
    route_programmed: bool = False

    service_name: str | None = None

    assessment: str = ""