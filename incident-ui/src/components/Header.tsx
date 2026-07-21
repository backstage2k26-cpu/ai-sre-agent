import {
  Search,
  Bell,
  ShieldCheck,
  Activity,
} from "lucide-react";

export default function Header() {
  return (
    <header className="hero">

      <div className="hero-left">

        <div className="hero-badge">
          AI Powered
        </div>

        <h1>AI SRE Investigator</h1>

        <p>
          Autonomous Incident Analysis Platform
        </p>

      </div>

      <div className="hero-right">

        <div className="hero-search">

          <Search size={18} />

          <input
            placeholder="Search incidents, services, metrics..."
          />

        </div>

        <button className="hero-icon">
          <Bell size={18} />
        </button>

        <div className="hero-status">

          <ShieldCheck
            size={18}
            color="#22c55e"
          />

          Healthy

        </div>

      </div>

    </header>
  );
}