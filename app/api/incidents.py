from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.repositories.incident_repository import IncidentRepository
from app.repositories.investigation_repository import InvestigationRepository

router = APIRouter()


@router.get("/incidents")
def get_incidents(
    db: Session = Depends(get_db),
):
    incident_repo = IncidentRepository(db)
    investigation_repo = InvestigationRepository(db)

    incidents = incident_repo.list_all()

    response = []

    for incident in incidents:

        latest = investigation_repo.get_latest_by_incident(
            incident.number
        )

        response.append(
            {
                "number": incident.number,
                "short_description": incident.short_description,
                "service": incident.service,
                "priority": incident.priority,
                "state": incident.state,
                "opened_at": incident.opened_at,
                "investigation_status": (
                    latest.status if latest else None
                ),
                "investigation_id": (
                    latest.investigation_id if latest else None
                ),
            }
        )

    return response

@router.get("/incidents/{incident_number}")
def get_incident_details(
    incident_number: str,
    db: Session = Depends(get_db),
):
    incident_repo = IncidentRepository(db)
    investigation_repo = InvestigationRepository(db)

    incident = incident_repo.get_by_number(
        incident_number
    )

    if incident is None:
        return {"message": "Incident not found"}

    investigations = investigation_repo.list_by_incident(
        incident_number
    )

    latest_ai = None

    for inv in investigations:
        if inv.report:
            latest_ai = inv.report
            break

    return {
        "incident": {
            "number": incident.number,
            "short_description": incident.short_description,
            "application_name": (
                getattr(incident, "cmdb_ci", None)
                or getattr(incident, "business_service", None)
                or getattr(incident, "service", None)
                or getattr(incident, "configuration_item", None)
            ),
            "service": getattr(incident, "service", None),
            "configuration_item": getattr(incident, "configuration_item", None),
            "cmdb_ci": getattr(incident, "cmdb_ci", None),
            "business_service": getattr(incident, "business_service", None),
            "priority": incident.priority,
            "state": incident.state,
            "caller": getattr(incident, "caller", None),
            "assignment_group": getattr(incident, "assignment_group", None),
            "opened_at": getattr(incident, "opened_at", None),
            "updated_at": getattr(incident, "updated_at", None),
        },
        "investigations": [
            {
                "investigation_id": i.investigation_id,
                "status": i.status,
                "progress": i.progress,
                "current_step": i.current_step,
                "started_at": i.started_at,
                "completed_at": i.completed_at,
            }
            for i in investigations
        ],
        "latest_ai": latest_ai,
    }
