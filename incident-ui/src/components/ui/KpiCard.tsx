interface Props {
  title: string;
  value: string;
  color?: string;
}

export default function KpiCard({
  title,
  value,
  color = "#3B82F6",
}: Props) {
  return (
    <div
      style={{
        flex: 1,
        minWidth: 180,
        padding: 24,
        borderRadius: 22,
        background: "rgba(17,24,39,.72)",
        backdropFilter: "blur(22px)",
        border: "1px solid rgba(255,255,255,.08)",
        boxShadow: "0 15px 40px rgba(0,0,0,.35)",
      }}
    >
      <div
        style={{
          color: "#94A3B8",
          fontSize: 13,
          textTransform: "uppercase",
          letterSpacing: 1,
        }}
      >
        {title}
      </div>

      <div
        style={{
          marginTop: 12,
          fontSize: 30,
          fontWeight: 700,
          color,
        }}
      >
        {value}
      </div>
    </div>
  );
}