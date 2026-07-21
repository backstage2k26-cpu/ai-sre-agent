from sqlalchemy.orm import Session

from app.integrations.servicenow.models import IncidentContext
from app.models.incident import Incident


class IncidentRepository:

    def __init__(self, db: Session):
        self.db = db

    def create_or_update(
        self,
        incident: IncidentContext,
    ) -> Incident:

        existing = self.find_by_number(
            incident.incident_number
        )

        if existing:

            existing.sys_id = incident.incident_id
            existing.short_description = incident.short_description
            existing.service = incident.configuration_item
            existing.priority = incident.priority
            existing.severity = incident.severity
            existing.state = incident.state
            existing.assignment_group = incident.assignment_group
            existing.configuration_item = incident.configuration_item
            existing.caller = incident.caller
            existing.opened_at = incident.opened_at
            existing.updated_at = incident.updated_at

            self.db.commit()
            self.db.refresh(existing)

            return existing

        new_incident = Incident(
            number=incident.incident_number,
            sys_id=incident.incident_id,
            short_description=incident.short_description,
            service=incident.configuration_item,
            priority=incident.priority,
            severity=incident.severity,
            state=incident.state,
            assignment_group=incident.assignment_group,
            configuration_item=incident.configuration_item,
            caller=incident.caller,
            opened_at=incident.opened_at,
            updated_at=incident.updated_at,
        )

        self.db.add(new_incident)
        self.db.commit()
        self.db.refresh(new_incident)

        return new_incident

    def find_by_number(
        self,
        incident_number: str,
    ) -> Incident | None:

        return (
            self.db.query(Incident)
            .filter(
                Incident.number == incident_number
            )
            .first()
        )

    def list_recent(
        self,
        limit: int = 5,
    ) -> list[Incident]:

        return (
            self.db.query(Incident)
            .order_by(Incident.opened_at.desc())
            .limit(limit)
            .all()
        )

    def count_all(self) -> int:

        return self.db.query(Incident).count()

    def count_high_priority(self) -> int:

        return (
            self.db.query(Incident)
            .filter(
                Incident.priority.in_(
                    [
                        "1",
                        "2",
                        "P1",
                        "P2",
                        "Critical",
                        "High",
                    ]
                )
            )
            .count()
        )

    def list_all(self) -> list[Incident]:
        return (
            self.db.query(Incident)
            .order_by(Incident.opened_at.desc())
            .all()
        )

    def get_by_number(
        self,
        incident_number: str,
    ) -> Incident | None:

        return (
            self.db.query(Incident)
            .filter(
                Incident.number == incident_number
            )
            .first()
        )