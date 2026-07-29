from collections import OrderedDict
from datetime import datetime, timedelta

from app.clients.servicenow_client import ServiceNowClient


class DashboardService:

    def __init__(
        self,
        incident_repo,
        investigation_repo,
    ):
        self.incident_repo = incident_repo
        self.investigation_repo = investigation_repo
        self.client = ServiceNowClient()
    
    def calculate_delta(
        self,
        current: float,
        previous: float,
    ) -> float:
        if previous == 0:
            return 100.0 if current > 0 else 0.0

        return round(((current - previous) / previous) * 100, 1)
    
    async def get_dashboard_metrics(self):

        now = datetime.utcnow()

        current_start = now - timedelta(days=7)
        previous_start = now - timedelta(days=14)
        current_end = now
        previous_end = current_start

        total_incidents = await self.client.count_total_incidents()

        current_window_incidents = (
            await self.client.count_incidents_between(
                current_start,
                now,
            )
        )

        previous_window_incidents = (
            await self.client.count_incidents_between(
                previous_start,
                current_start,
            )
        )

        current_high = self.incident_repo.count_high_priority_between(
            current_start,
            now,
        )

        previous_high = self.incident_repo.count_high_priority_between(
            previous_start,
            current_start,
        )

        current_resolved = self.investigation_repo.count_completed_between(
            current_start,
            current_end,
        )

        previous_resolved = self.investigation_repo.count_completed_between(
            previous_start,
            previous_end,
        )

        current_failed = self.investigation_repo.count_failed_between(
            current_start,
            current_end,
        )

        previous_failed = self.investigation_repo.count_failed_between(
            previous_start,
            previous_end,
        )

        current_avg_time = (
            self.investigation_repo.get_average_investigation_time_between(
                current_start,
                current_end,
            )
        )

        current_avg_confidence = (
            self.investigation_repo.get_average_confidence_between(
                current_start,
                current_end,
            )
        )

        previous_avg_time = (
            self.investigation_repo.get_average_investigation_time_between(
                previous_start,
                previous_end,
            )
        )

        previous_avg_confidence = (
            self.investigation_repo.get_average_confidence_between(
                previous_start,
                previous_end,
            )
        )  

        return {
            "total_incidents": {
                "value": total_incidents,
                "delta": self.calculate_delta(
                    current_window_incidents,
                    previous_window_incidents,
                ),
            },
            "resolved": {
                "value": current_resolved,
                "delta": self.calculate_delta(
                    current_resolved,
                    previous_resolved,
                ),
            },
            "failed": {
                "value": current_failed,
                "delta": self.calculate_delta(
                    current_failed,
                    previous_failed,
                ),
            },
            "high_priority_incidents": {
                "value": current_high,
                "delta": self.calculate_delta(
                    current_high,
                    previous_high,
                ),
            },
            "running_investigations": {
                "value": 0,
                "delta": 0,
            },
            "avg_investigation_time": {
                "value": self.format_duration(current_avg_time),
                "delta": self.calculate_delta(
                    current_avg_time,
                    previous_avg_time,
                ),
            },
            "avg_confidence": {
                "value": current_avg_confidence,
                "delta": self.calculate_delta(
                    current_avg_confidence,
                    previous_avg_confidence,
                ),
            },
        }

    async def get_incident_trend(self):

        incidents = await self.client.get_incident_trend()

        print(type(incidents))
        print(incidents)

        today = datetime.utcnow()

        days = OrderedDict()

        for i in range(6, -1, -1):

            day = today - timedelta(days=i)

            days[day.strftime("%a")] = {
                "created": 0,
                "resolved": 0,
            }

        for incident in incidents:

            created = incident.get("sys_created_on")

            if created:

                created = datetime.strptime(
                    created,
                    "%Y-%m-%d %H:%M:%S",
                )

                label = created.strftime("%a")

                if label in days:
                    days[label]["created"] += 1

            resolved = incident.get("resolved_at")

            if resolved:

                resolved = datetime.strptime(
                    resolved,
                    "%Y-%m-%d %H:%M:%S",
                )

                label = resolved.strftime("%a")

                if label in days:
                    days[label]["resolved"] += 1

        return [
            {
                "day": day,
                "created": value["created"],
                "resolved": value["resolved"],
            }
            for day, value in days.items()
        ]
    
    def format_duration(
        self,
        seconds: float,
    ) -> str:

        if seconds <= 0:
            return "0m"

        if seconds < 60:
            return f"{round(seconds)}s"

        minutes = int(seconds // 60)

        if minutes < 60:
            return f"{minutes}m"

        hours = minutes // 60
        minutes = minutes % 60

        return f"{hours}h {minutes}m"