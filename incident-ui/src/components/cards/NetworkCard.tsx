import { Network } from "lucide-react";
import type { Investigation } from "../../types/investigation";
import GlassCard from "../ui/GlassCard";
import InfoRow from "../ui/InfoRow";
import StatusBadge from "../ui/StatusBadge";

interface Props {
  investigation: Investigation;
}

export default function NetworkCard({
  investigation,
}: Props) {

  const n = investigation.network;

  return (

    <GlassCard>

      <h2 className="card-title">
        <Network size={20}/>
        Network
      </h2>

      <InfoRow
        label="Gateway"
        value={n.gateway_name}
      />

      <InfoRow
        label="HTTP Route"
        value={n.route_name}
      />

      <InfoRow
        label="Service"
        value={n.service_name}
      />

      <InfoRow
        label="Endpoints"
        value={String(n.service_endpoints)}
      />

      <div className="divider"/>

      <div className="info-row">

        <span className="info-label">
          Gateway
        </span>

        <StatusBadge
          text={n.gateway_ok ? "Healthy" : "Failed"}
          type={n.gateway_ok ? "success" : "danger"}
        />

      </div>

      <div className="info-row">

        <span className="info-label">
          Route
        </span>

        <StatusBadge
          text={n.route_accepted ? "Accepted" : "Rejected"}
          type={n.route_accepted ? "success" : "danger"}
        />

      </div>

      <div className="divider"/>

      <p>{n.assessment}</p>

    </GlassCard>

  );
}