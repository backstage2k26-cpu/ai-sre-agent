import { Navigate, Route, Routes } from "react-router-dom";

import MainLayout from "./layouts/MainLayout";

import Dashboard from "./pages/Dashboard";
import Incidents from "./pages/Incidents";
import InvestigationReport from "./pages/InvestigationReport";

function Settings() {
  return <h2>Settings (Coming Soon)</h2>;
}

function Reports() {
  return <h2>Reports (Coming Soon)</h2>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      <Route element={<MainLayout />}>
        <Route
          path="/dashboard"
          element={<Dashboard />}
        />

        <Route
          path="/incidents"
          element={<Incidents />}
        />

        <Route
          path="/reports"
          element={<Reports />}
        />

        <Route
          path="/reports/:investigationId"
          element={<InvestigationReport />}
        />

        <Route
          path="/settings"
          element={<Settings />}
        />
      </Route>
    </Routes>
  );
}