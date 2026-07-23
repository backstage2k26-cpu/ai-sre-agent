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

    incidents = incident_repo.list_all()

    running = 0
    completed = 0
    failed = 0

    for incident in incidents:
        latest = investigation_repo.get_latest_by_incident(
            incident.number
        )

        if latest is None:
            continue

        if latest.status == "RUNNING":
            running += 1
        elif latest.status == "COMPLETED":
            completed += 1
        elif latest.status == "FAILED":
            failed += 1

    return {
        "total_incidents": incident_repo.count_all(),
        "high_priority_incidents": incident_repo.count_high_priority(),
        "running_investigations": running,
        "resolved": completed,
        "failed": failed,
        "avg_investigation_time": investigation_repo.get_average_investigation_time(),
        "avg_confidence": investigation_repo.get_average_confidence(),
    }


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
