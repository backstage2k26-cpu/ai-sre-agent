from pydantic import BaseModel


class PodMetrics(BaseModel):
    pod: str

    cpu_millicores: float | None = None
    memory_mb: float | None = None

    network_rx_bytes: float | None = None
    network_tx_bytes: float | None = None