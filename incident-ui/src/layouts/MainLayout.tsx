import { Box } from "@mui/material";
import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";

export default function MainLayout() {
  return (
    <Box sx={{ display: "flex", minHeight: "100vh", background: "var(--app-bg)" }}>
      <Sidebar />

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          minWidth: 0,
          overflow: "auto",
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
}
