from fastapi import APIRouter, Depends, HTTPException, status

from app.integrations.servicenow.mapper import ServiceNowMapper
from app.schemas.servicenow import ServiceNowWebhookRequest
from app.services.investigation_manager import InvestigationManager
from app.dependencies import get_investigation_manager
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.repositories.incident_repository import IncidentRepository
import traceback

router = APIRouter(prefix="/webhooks", tags=["Webhooks"])


@router.post(
    "/servicenow",
    status_code=status.HTTP_202_ACCEPTED,
)
async def servicenow_webhook(
    payload: ServiceNowWebhookRequest,
    db: Session = Depends(get_db),
    manager: InvestigationManager = Depends(get_investigation_manager),
):
    try:

        if payload.event_type != "incident.created":
            return {
                "status": "ignored",
                "reason": payload.event_type,
            }

        request = ServiceNowMapper.to_investigation_request(payload)

        incident_repo = IncidentRepository(db)
        incident_repo.create_or_update(request.incident)

        existing = incident_repo.get_active_investigation(
            request.incident.incident_number
        )

        if existing:
            return {
                "status": "ignored",
                "reason": "Investigation already running",
            }

        await manager.submit_incident(request)

        return {
            "status": "accepted",
            "investigation_id": request.investigation_id,
        }

    except Exception as exc:
        traceback.print_exc()      # <-- prints full stack trace
        print("ERROR:", repr(exc)) # <-- prints exception
        raise