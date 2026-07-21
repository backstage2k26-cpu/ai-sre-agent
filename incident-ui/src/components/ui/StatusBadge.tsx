interface Props {
  text: string;
  type: "success" | "warning" | "danger" | "info";
}

const styles = {
  success: {
    color: "#22C55E",
    background: "rgba(34,197,94,.12)",
    border: "1px solid rgba(34,197,94,.25)",
    shadow: "0 0 18px rgba(34,197,94,.18)",
  },

  warning: {
    color: "#F59E0B",
    background: "rgba(245,158,11,.12)",
    border: "1px solid rgba(245,158,11,.25)",
    shadow: "0 0 18px rgba(245,158,11,.18)",
  },

  danger: {
    color: "#EF4444",
    background: "rgba(239,68,68,.12)",
    border: "1px solid rgba(239,68,68,.25)",
    shadow: "0 0 18px rgba(239,68,68,.18)",
  },

  info: {
    color: "#60A5FA",
    background: "rgba(96,165,250,.12)",
    border: "1px solid rgba(96,165,250,.25)",
    shadow: "0 0 18px rgba(96,165,250,.18)",
  },
};

export default function StatusBadge({
  text,
  type,
}: Props) {

  const s = styles[type];

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,

        padding: "8px 16px",

        borderRadius: 999,

        color: s.color,

        background: s.background,

        border: s.border,

        boxShadow: s.shadow,

        fontSize: 13,

        fontWeight: 600,

        letterSpacing: ".2px",

        backdropFilter: "blur(10px)",

        WebkitBackdropFilter: "blur(10px)",
      }}
    >
      <span
        style={{
          width: 8,
          height: 8,
          borderRadius: "50%",
          background: s.color,
          boxShadow: `0 0 10px ${s.color}`,
        }}
      />

      {text}
    </span>
  );
}