import type { ReactNode } from "react";

interface Props {
  label: string;
  value: ReactNode;
}

export default function InfoRow({
  label,
  value,
}: Props) {
  return (
    <div className="info-row">
      <span className="info-label">
        {label}
      </span>

      <span className="info-value">
        {value}
      </span>
    </div>
  );
}