from typing import Optional


def extract_namespace(service_name: Optional[str]) -> Optional[str]:
    """
    Extract namespace/application name.

    Examples:
        market-dev     -> market
        payment-prod   -> payment
        banking-qa     -> banking

    Returns None if the input is empty or invalid.
    """

    if not service_name:
        return None

    if not isinstance(service_name, str):
        return None

    service_name = service_name.strip()

    if not service_name:
        return None

    if "-" not in service_name:
        return service_name

    return service_name.split("-")[0]


def get_search_window(priority: str) -> int:
    """
    ServiceNow priorities:
        1 -> P1
        2 -> P2
        3 -> P3
    """

    mapping = {
        "1": 60,
        "2": 45,
        "3": 30,
    }

    return mapping.get(priority, 30)