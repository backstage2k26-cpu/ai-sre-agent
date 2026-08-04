from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.clients.servicenow_client import ServiceNowClient
from app.database.session import get_db
from app.repositories.incident_repository import IncidentRepository
from app.repositories.investigation_repository import InvestigationRepository
from app.services.dashboard_service import DashboardService

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

@router.get("")
async def get_dashboard(
    db: Session = Depends(get_db),
):
    incident_repo = IncidentRepository(db)
    investigation_repo = InvestigationRepository(db)

    service = DashboardService(
        incident_repo,
        investigation_repo,
    )

    return await service.get_dashboard_metrics()

@router.get("/running")
def get_running_investigations(
    db: Session = Depends(get_db),
):
    repo = InvestigationRepository(db)

    investigations = repo.get_running()

    return [
        {
            "investigation_id": i.investigation_id,
            "incident_number": i.incident_number,
            "status": i.status,
            "progress": i.progress,
            "current_step": i.current_step,
            "started_at": i.started_at,
        }
        for i in investigations
    ]

@router.get("/incident-trend")
async def get_incident_trend():

    service = DashboardService(
        None,
        None,
    )

    return await service.get_incident_trend()

@router.get("/recent")
def get_recent_incidents(
    db: Session = Depends(get_db),
):
    repo = IncidentRepository(db)
    investigation_repo = InvestigationRepository(db)

    incidents = repo.list_recent(5)

    recent = []

    for incident in incidents:
        latest = investigation_repo.get_latest_by_incident(
            incident.number
        )

        recent.append(
            {
                "number": incident.number,
                "short_description": incident.short_description,
                "priority": incident.priority,
                "state": incident.state,
                "opened_at": incident.opened_at,
                "service": incident.service,
                "investigation_status": (
                    latest.status if latest else None
                ),
                "investigation_id": (
                    latest.investigation_id if latest else None
                ),
            }
        )

    return recent


@router.get("/servicenow/status")
async def get_servicenow_status():
    client = ServiceNowClient()

    try:
        await client.get_incident_list(limit=1)
        return {"online": True}
    except Exception:
        return {"online": False}
