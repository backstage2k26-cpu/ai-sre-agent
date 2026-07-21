from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.repositories.incident_repository import IncidentRepository
from app.repositories.investigation_repository import InvestigationRepository

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("")
def get_dashboard(
    db: Session = Depends(get_db),
):
    incident_repo = IncidentRepository(db)
    investigation_repo = InvestigationRepository(db)

    running = investigation_repo.get_running()
    completed = investigation_repo.get_completed()
    failed = investigation_repo.get_failed()

    return {
        "total_incidents": incident_repo.count_all(),
        "running_investigations": len(running),
        "resolved": len(completed),
        "failed": len(failed),
        "high_priority": incident_repo.count_high_priority(),
        "avg_investigation_time": investigation_repo.get_average_investigation_time(),
        "avg_confidence": investigation_repo.get_average_confidence(),
    }


@router.get("/running")
async def get_running_investigations():
    return [
        {
            "investigation_id": "INV-001",
            "incident_number": "INC0010004",
            "service": "market-qa",
            "progress": 45,
            "current_step": "Collecting Kubernetes Events",
        },
        {
            "investigation_id": "INV-002",
            "incident_number": "INC0010005",
            "service": "payment",
            "progress": 72,
            "current_step": "AI Reasoning",
        },
    ]

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

@router.get("/recent")
def get_recent_incidents(
    db: Session = Depends(get_db),
):
    repo = IncidentRepository(db)

    incidents = repo.list_recent(5)

    return [
        {
            "number": incident.number,
            "short_description": incident.short_description,
            "priority": incident.priority,
            "state": incident.state,
            "opened_at": incident.opened_at,
        }
        for incident in incidents
    ]