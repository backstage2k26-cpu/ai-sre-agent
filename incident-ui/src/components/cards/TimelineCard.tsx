import { Clock3 } from "lucide-react";
import type { Investigation } from "../../types/investigation";
import GlassCard from "../ui/GlassCard";

interface Props {
  investigation: Investigation;
}

export default function TimelineCard({
  investigation,
}: Props) {

  const timeline = investigation.timeline || [];

  return (

    <GlassCard>

      <h2 className="card-title">
        <Clock3 size={20}/>
        Timeline
      </h2>

      {timeline.map((item:any,index:number)=>(
        <div
          key={index}
          style={{
            padding:"14px 0",
            borderBottom:"1px solid rgba(255,255,255,.08)"
          }}
        >

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span
              style={{
                fontWeight: 600,
              }}
            >
              {item.event}
            </span>

            <span
              style={{
                color: "#888",
                fontSize: 13,
              }}
            >
              {item.time}
            </span>
          </div>

        </div>
      ))}

    </GlassCard>

  );
}