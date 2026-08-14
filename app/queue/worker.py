from __future__ import annotations

import asyncio

from app.queue.manager import InvestigationQueue
from app.services.investigation_service import InvestigationService
from app.repositories.investigation_repository import InvestigationRepository
from app.database.session import get_db
from app.models.investigation import InvestigationStatus
from app.schemas.incident import Incident
from app.services.similar_incident_service import SimilarIncidentService


class InvestigationWorker:

    def __init__(
        self,
        queue: InvestigationQueue,
    ) -> None:
        self.queue = queue
        self.service = InvestigationService()

    async def start(self):
        import traceback

        print(">>> Worker started")

        try:
            while True:
                print(">>> Waiting for queue")

                request = await self.queue.get()

                investigation_id = request.investigation_id

                print(f">>> Got {investigation_id}")

                db = next(get_db())
                repository = InvestigationRepository(db)

                try:
                    repository.update_status(
                        investigation_id,
                        InvestigationStatus.RUNNING,
                    )

                    investigation = repository.find_by_id(
                        investigation_id,
                    )

                    incident = Incident(
                        sys_id=request.incident.incident_id,
                        number=request.incident.incident_number,
                        short_description=request.incident.short_description,
                        description=request.incident.description,
                        priority=request.incident.priority,
                        severity=request.incident.severity,
                        state=request.incident.state,
                        assignment_group=request.incident.assignment_group,
                        business_service=request.incident.configuration_item,
                        cmdb_ci=request.incident.configuration_item,
                        category=None,
                        subcategory=None,
                        opened_at=request.incident.opened_at,
                    )

                    result = await self.service.investigate(
                        incident,
                        progress_callback=lambda progress, step: repository.update_progress(
                            investigation_id,
                            progress,
                            step,
                        ),
                    )

                    run_number = _latest_run_number(repository, investigation_id)
                    tokens_consumed = estimate_tokens_from_payload(
                        result.model_dump(),
                    )

                    completed = repository.mark_completed(
                        investigation_id,
                        result.model_dump(),
                    )

                    if completed is not None:
                        similar_service = SimilarIncidentService(repository)
                        similar_incidents = await similar_service.find_similar_incidents(
                            investigation_id,
                            limit=5,
                        )

                        snapshot = dict(completed.report or {})
                        snapshot["similar_incidents"] = [
                            item.model_dump()
                            if hasattr(item, "model_dump")
                            else item
                            for item in similar_incidents
                        ]
                        repository.update_report(
                            investigation_id,
                            snapshot,
                        )

                    repository.update_run_tokens(
                        investigation_id=investigation_id,
                        run_number=run_number,
                        tokens_consumed=tokens_consumed,
                    )

                    if completed is None:
                        print("mark_completed returned None")
                    else:
                        print("================================")
                        print("Completed Investigation:", completed.investigation_id)
                        print("Status:", completed.status)
                        print("Progress:", completed.progress)
                        print("Completed At:", completed.completed_at)
                        print("================================")

                except Exception as ex:

                    traceback.print_exc()

                    repository.mark_failed(
                        investigation_id,
                        str(ex),
                    )

                    print(
                        f"❌ Investigation {investigation_id} failed"
                    )

                finally:
                    self.queue.task_done()
                    db.close()

        except Exception:
            traceback.print_exc()
            raise


def _latest_run_number(
    repository: InvestigationRepository,
    investigation_id: str,
) -> int:
    runs = repository.list_runs(investigation_id)
    return runs[-1].run_number if runs else 1


def estimate_tokens_from_payload(payload: dict) -> int:
    serialized = str(payload or {})
    return max(0, round(len(serialized) / 4))
