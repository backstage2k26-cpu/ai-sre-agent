from fastapi import APIRouter, HTTPException

from app.schemas.start_investigation import StartInvestigationRequest
from app.services.incident_service import IncidentService
from app.services.investigation_manager import InvestigationManager

router = APIRouter()

from app.services.state import investigation_manager as manager
from app.integrations.servicenow.mapper import ServiceNowMapper

incident_service = IncidentService()


@router.post("/investigations")
async def investigate(request: StartInvestigationRequest):

    try:
        incident = await incident_service.fetch_by_number(
            request.incident_number
        )

        request = ServiceNowMapper.to_investigation_request(payload)

        investigation = await manager.submit_incident(request)

        return {
            "investigation_id": investigation_id,
            "status": "RUNNING",
        }

    except ValueError as ex:
        raise HTTPException(
            status_code=404,
            detail=str(ex),
        )

    except Exception as ex:
        raise HTTPException(
            status_code=500,
            detail=str(ex),
        )

@router.post("/investigations/{incident_number}/restart")
async def restart_investigation(
    incident_number: str,
):
    try:
        incident = await incident_service.fetch_by_number(
            incident_number
        )

        print("Incident type:", type(incident))
        print("Incident value:", incident)

        request = ServiceNowMapper.from_incident(
            incident
        )

        print("Mapped request:", request)

        investigation = await manager.restart(
            request
        )

        return {
            "status": investigation.status,
        }

    except ValueError as ex:
        raise HTTPException(
            status_code=404,
            detail=str(ex),
        )

    except Exception as ex:
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail=str(ex),
        )


@router.get("/investigations/{investigation_id}")
async def get_investigation(investigation_id: str):

    job = manager.get(investigation_id)

    if not job:
        raise HTTPException(
            status_code=404,
            detail="Investigation not found",
        )

    return job


@router.get("/investigations")
async def list_investigations():

    return manager.list()

@router.delete("/investigations/{investigation_id}")
async def delete_investigation(
    investigation_id: str,
):

    deleted = manager.delete(investigation_id)

    if not deleted:
        raise HTTPException(
            status_code=404,
            detail="Investigation not found",
        )

    return {
        "message": "Investigation deleted"
    }