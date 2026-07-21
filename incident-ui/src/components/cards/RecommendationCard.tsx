import { Lightbulb } from "lucide-react";
import type { Investigation } from "../../types/investigation";
import GlassCard from "../ui/GlassCard";

interface Props {
  investigation: Investigation;
}

export default function RecommendationCard({
  investigation,
}: Props) {

  const data = investigation.recommendations;

  return (

    <GlassCard>

      <h2 className="card-title">
        <Lightbulb size={20}/>
        Recommended Actions
      </h2>

      {data.recommendations.map((r:any)=>(
        <div
          key={r.priority}
          className="assessment-box"
          style={{marginBottom:16}}
        >

          <strong>
            Priority {r.priority}
          </strong>

          <p>{r.action}</p>

          <small>{r.reason}</small>

        </div>
      ))}

      <div className="divider"/>

      <strong>

        Estimated Time

      </strong>

      <p>{data.estimated_time}</p>

    </GlassCard>

  );
}