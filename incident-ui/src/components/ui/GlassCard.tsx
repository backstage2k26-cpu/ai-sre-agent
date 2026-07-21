import type { ReactNode } from "react";

interface Props {
  children: ReactNode;
}

export default function GlassCard({
  children,
}: Props) {

  return (
    <div className="card">
      {children}
    </div>
  );
}