from datetime import UTC, datetime, timedelta

from sqlalchemy.orm import Session

from app.models.investigation import Investigation, InvestigationStatus


class InvestigationRepository:

    def __init__(self, db: Session):
        self.db = db

    def create(
        self,
        *,
        investigation_id: str,
        incident_number: str,
        incident_sys_id: str,
        status: InvestigationStatus,
        progress: int,
        current_step: str,
    ) -> Investigation:

        investigation = Investigation(
            investigation_id=investigation_id,
            incident_number=incident_number,
            incident_sys_id=incident_sys_id,
            status=status,
            progress=progress,
            current_step=current_step,
        )

        self.db.add(investigation)
        self.db.commit()
        self.db.refresh(investigation)

        return investigation

    def find_by_id(
        self,
        investigation_id: str,
    ) -> Investigation | None:

        return (
            self.db.query(Investigation)
            .filter(
                Investigation.investigation_id == investigation_id
            )
            .first()
        )

    def find_by_incident(
        self,
        incident_number: str,
    ) -> Investigation | None:

        return (
            self.db.query(Investigation)
            .filter(
                Investigation.incident_number == incident_number
            )
            .order_by(Investigation.started_at.desc())
            .first()
        )

    def list_all(self) -> list[Investigation]:

        return (
            self.db.query(Investigation)
            .order_by(Investigation.started_at.desc())
            .all()
        )

    def update_progress(
        self,
        investigation_id: str,
        progress: int,
        step: str,
    ) -> Investigation | None:

        investigation = self.find_by_id(investigation_id)

        if investigation is None:
            return None

        investigation.progress = progress
        investigation.current_step = step

        self.db.commit()
        self.db.refresh(investigation)

        return investigation

    def update_status(
        self,
        investigation_id: str,
        status: InvestigationStatus,
    ) -> Investigation | None:

        investigation = self.find_by_id(investigation_id)

        if investigation is None:
            return None

        investigation.status = status

        self.db.commit()
        self.db.refresh(investigation)

        return investigation

    def mark_completed(
        self,
        investigation_id: str,
        report: dict,
    ) -> Investigation | None:

        investigation = self.find_by_id(investigation_id)

        if investigation is None:
            return None

        investigation.status = InvestigationStatus.COMPLETED
        investigation.progress = 100
        investigation.current_step = "Completed"
        investigation.completed_at = datetime.now(UTC)
        investigation.report = report

        self.db.commit()
        self.db.refresh(investigation)

        return investigation

    def mark_failed(
        self,
        investigation_id: str,
        error: str,
    ) -> Investigation | None:

        investigation = self.find_by_id(investigation_id)

        if investigation is None:
            return None

        investigation.status = InvestigationStatus.FAILED
        investigation.error = error
        investigation.completed_at = datetime.now(UTC)

        self.db.commit()
        self.db.refresh(investigation)

        return investigation
    
    def restart(
        self,
        incident_number: str,
    ) -> Investigation | None:

        investigation = self.find_by_incident(
            incident_number
        )

        if investigation is None:
            return None

        investigation.status = InvestigationStatus.RECEIVED
        investigation.progress = 0
        investigation.current_step = "Received"

        investigation.started_at = datetime.now(UTC)
        investigation.completed_at = None

        investigation.error = None
        investigation.report = None

        self.db.commit()
        self.db.refresh(investigation)

        return investigation

    def delete(
        self,
        investigation_id: str,
    ) -> bool:

        investigation = self.find_by_id(investigation_id)

        if investigation is None:
            return False

        self.db.delete(investigation)
        self.db.commit()

        return True

    def get_running(self) -> list[Investigation]:
        return (
            self.db.query(Investigation)
            .filter(
                Investigation.status == InvestigationStatus.RUNNING
            )
            .order_by(Investigation.started_at.desc())
            .all()
        )


    def get_completed(self) -> list[Investigation]:
        return (
            self.db.query(Investigation)
            .filter(
                Investigation.status == InvestigationStatus.COMPLETED
            )
            .all()
        )


    def get_failed(self) -> list[Investigation]:
        return (
            self.db.query(Investigation)
            .filter(
                Investigation.status == InvestigationStatus.FAILED
            )
            .all()
        )

    def get_average_investigation_time(self) -> str:
        completed = (
            self.db.query(Investigation)
            .filter(
                Investigation.status == InvestigationStatus.COMPLETED,
                Investigation.completed_at.isnot(None),
            )
            .all()
        )

        if not completed:
            return "0m"

        total = timedelta()

        for investigation in completed:
            total += (
                investigation.completed_at - investigation.started_at
            )

        average = total / len(completed)

        minutes = int(average.total_seconds() // 60)

        if minutes < 60:
            return f"{minutes}m"

        hours = minutes // 60
        minutes = minutes % 60

        return f"{hours}h {minutes}m"

    def get_average_confidence(self) -> float:
        completed = (
            self.db.query(Investigation)
            .filter(
                Investigation.status == InvestigationStatus.COMPLETED,
                Investigation.report.isnot(None),
            )
            .all()
        )

        if not completed:
            return 0.0

        total = 0.0
        count = 0

        for investigation in completed:
            report = investigation.report or {}

            confidence = (
                report.get("logs", {})
                .get("assessment", {})
                .get("confidence")
            )

            if confidence is not None:
                total += float(confidence)
                count += 1

        if count == 0:
            return 0.0

        return round((total / count) * 100, 1)

    def get_latest_by_incident(
        self,
        incident_number: str,
    ) -> Investigation | None:

        return (
            self.db.query(Investigation)
            .filter(
                Investigation.incident_number == incident_number
            )
            .order_by(
                Investigation.started_at.desc()
            )
            .first()
        )

    def list_by_incident(
        self,
        incident_number: str,
    ) -> list[Investigation]:

        return (
            self.db.query(Investigation)
            .filter(
                Investigation.incident_number == incident_number
            )
            .order_by(
                Investigation.started_at.desc()
            )
            .all()
        )
    