from app.schemas.start_investigation import StartInvestigationRequest
from app.services.incident_service import IncidentService
from app.services.investigation_manager import InvestigationManager
import traceback

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy.exc import ProgrammingError

from app.database.session import get_db
from app.repositories.investigation_repository import InvestigationRepository
from app.services.similar_incident_service import SimilarIncidentService

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

        investigation_request = ServiceNowMapper.from_incident(
            incident
        )

        investigation = await manager.submit_incident(
            investigation_request
        )

        return {
            "investigation_id": investigation.investigation_id,
            "status": investigation.status,
        }

    except ValueError as ex:
        raise HTTPException(
            status_code=404,
            detail=str(ex),
        )

    except Exception as ex:
        import traceback
        traceback.print_exc()

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
async def get_investigation(
    investigation_id: str,
    db: Session = Depends(get_db),
):

    repository = InvestigationRepository(db)
    job = repository.find_by_id(investigation_id)

    if not job:
        raise HTTPException(
            status_code=404,
            detail="Investigation not found",
        )

    try:
        runs = repository.list_runs(investigation_id)
    except ProgrammingError as ex:
        db.rollback()
        if "investigation_runs" in str(ex).lower():
            runs = []
        else:
            raise

    report = job.report or {}
    if (
        job.status == "COMPLETED"
        and not report.get("similar_incidents")
    ):
        try:
            similar_service = SimilarIncidentService(repository)
            incidents = await similar_service.find_similar_incidents(
                investigation_id=investigation_id,
                limit=5,
            )

            report = dict(report)
            report["similar_incidents"] = [
                item.model_dump() if hasattr(item, "model_dump") else item
                for item in incidents
            ]

            updated = repository.update_report(
                investigation_id,
                report,
            )
            if updated is not None:
                job = updated
        except Exception:
            traceback.print_exc()

    return {
        "id": job.id,
        "investigation_id": job.investigation_id,
        "incident_number": job.incident_number,
        "incident_sys_id": job.incident_sys_id,
        "status": job.status,
        "progress": job.progress,
        "current_step": job.current_step,
        "started_at": job.started_at,
        "completed_at": job.completed_at,
        "report": report,
        "error": job.error,
        "investigation_runs": [
            {
                "id": run.id,
                "investigation_id": run.investigation_id,
                "run_number": run.run_number,
                "run_type": run.run_type,
                "tokens_consumed": run.tokens_consumed,
                "created_at": run.created_at,
            }
            for run in runs
        ],
    }


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

@router.get(
    "/investigations/{investigation_id}/similar-incidents"
)
async def get_similar_incidents(
    investigation_id: str,
    db: Session = Depends(get_db),
):
    try:
        repository = InvestigationRepository(db)

        service = SimilarIncidentService(
            repository
        )

        incidents = await service.find_similar_incidents(
            investigation_id=investigation_id,
            limit=3,
        )

        return incidents

    except ValueError as ex:
        raise HTTPException(
            status_code=404,
            detail=str(ex),
        )

    except Exception as ex:
        import traceback
        traceback.print_exc()

        raise HTTPException(
            status_code=500,
            detail=str(ex),
        )


@router.post(
    "/investigations/{investigation_id}/similar-incidents/refresh"
)
async def refresh_similar_incidents(
    investigation_id: str,
    db: Session = Depends(get_db),
):
    try:
        repository = InvestigationRepository(db)
        service = SimilarIncidentService(repository)

        incidents = await service.find_similar_incidents(
            investigation_id=investigation_id,
            limit=5,
        )

        investigation = repository.find_by_id(investigation_id)
        if investigation is not None:
            report = dict(investigation.report or {})
            report["similar_incidents"] = [
                item.model_dump() if hasattr(item, "model_dump") else item
                for item in incidents
            ]
            repository.update_report(investigation_id, report)

        return incidents

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
