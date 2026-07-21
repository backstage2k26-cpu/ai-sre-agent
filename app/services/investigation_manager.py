from __future__ import annotations

from app.database.session import get_db
from app.models.investigation import Investigation, InvestigationStatus
from app.repositories.investigation_repository import InvestigationRepository
from app.integrations.servicenow.models import InvestigationRequest
from app.queue.manager import queue


class InvestigationManager:

    def __init__(self):
        db = next(get_db())

        self.repository = InvestigationRepository(db)
        self.queue = queue

    def update_progress(
        self,
        investigation_id: str,
        progress: int,
        step: str,
    ):
        self.repository.update_progress(
            investigation_id,
            progress,
            step,
        )

    def get(
        self,
        investigation_id: str,
    ):
        return self.repository.find_by_id(
            investigation_id
        )

    def get_by_incident(
        self,
        incident_number: str,
    ):
        return self.repository.find_by_incident(
            incident_number
        )

    def list(self):
        return self.repository.list_all()

    def delete(
        self,
        investigation_id: str,
    ):
        return self.repository.delete(
            investigation_id
        )

    async def submit(
        self,
        request: InvestigationRequest,
    ) -> Investigation:

        investigation = self.repository.create(
            investigation_id=request.investigation_id,
            incident_number=request.incident.incident_number,
            incident_sys_id=request.incident.incident_id,
            status=InvestigationStatus.RECEIVED,
            progress=0,
            current_step="Received",
        )

        await self.queue.submit(request)

        return investigation

    async def submit_incident(
        self,
        request: InvestigationRequest,
    ) -> Investigation:

        existing = self.repository.find_by_incident(
            request.incident.incident_number,
        )

        if (
            existing
            and existing.status
            in {
                InvestigationStatus.RECEIVED,
                InvestigationStatus.QUEUED,
                InvestigationStatus.RUNNING,
            }
        ):
            return existing

        return await self.submit(request)

    async def restart(
        self,
        request: InvestigationRequest,
    ) -> Investigation:

        investigation = self.repository.restart(
            request.incident.incident_number,
        )
        request.investigation_id = investigation.investigation_id
        print("================================")
        print("Restarting DB Investigation:", investigation.investigation_id)
        print("Queued Investigation:", request.investigation_id)
        print("================================")

        if investigation is None:
            raise ValueError(
                f"Investigation not found for incident "
                f"{request.incident.incident_number}"
            )

        await self.queue.submit(request)

        return investigation