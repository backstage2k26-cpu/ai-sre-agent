from fastapi import APIRouter, Depends, HTTPException, status

from app.integrations.servicenow.mapper import ServiceNowMapper
from app.schemas.servicenow import ServiceNowWebhookRequest
from app.services.investigation_manager import InvestigationManager
from app.dependencies import get_investigation_manager
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.repositories.incident_repository import IncidentRepository

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
        request = ServiceNowMapper.to_investigation_request(payload)
        incident_repo = IncidentRepository(db)

        incident_repo.create_or_update(request.incident)

        await manager.submit_incident(request)

        return {
            "status": "accepted",
            "investigation_id": request.investigation_id,
        }

    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(exc),
        )