import { FileText } from "lucide-react";
import type { Investigation } from "../../types/investigation";

interface Props {
  investigation: Investigation;
}

export default function IncidentSummaryCard({
  investigation,
}: Props) {
  return (
    <div className="card">

      <h2 className="card-title">
        <FileText size={20} />
        Incident Summary
      </h2>

      <div className="info-row">
        <span className="info-label">Incident</span>
        <span className="info-value">
          {investigation.context.incident_number}
        </span>
      </div>

      <div className="info-row">
        <span className="info-label">Service</span>
        <span className="info-value">
          {investigation.context.service_name}
        </span>
      </div>

      <div className="info-row">
        <span className="info-label">Priority</span>
        <span className="info-value">
          P{investigation.context.priority}
        </span>
      </div>

      <div className="info-row">
        <span className="info-label">Problem Type</span>
        <span className="info-value">
          {investigation.context.problem_type}
        </span>
      </div>

    </div>
  );
}