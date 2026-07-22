import {
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Box,
} from "@mui/material";

import DashboardIcon from "@mui/icons-material/Dashboard";
import ReportIcon from "@mui/icons-material/Description";
import BugReportIcon from "@mui/icons-material/BugReport";
import SettingsIcon from "@mui/icons-material/Settings";
import LayersOutlinedIcon from "@mui/icons-material/LayersOutlined";

import { useLocation, useNavigate } from "react-router-dom";

const drawerWidth = 255;

const menus = [
  {
    text: "Dashboard",
    icon: <DashboardIcon />,
    path: "/dashboard",
  },
  {
    text: "Incidents",
    icon: <BugReportIcon />,
    path: "/incidents",
  },
  {
    text: "Reports",
    icon: <ReportIcon />,
    path: "/reports",
  },
  {
    text: "Settings",
    icon: <SettingsIcon />,
    path: "/settings",
  },
];

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        "& .MuiDrawer-root": {
          width: drawerWidth,
        },
        "& .MuiDrawer-paper": {
          width: drawerWidth,
          left: 0,
          top: 0,
          height: "100vh",
          m: 0,
          boxSizing: "border-box",
          borderRight: "none",
          background:
            "linear-gradient(180deg, #1E2F59 0%, #1D2C53 35%, #162447 100%)",
          color: "#fff",
          padding: 0,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-start",
        },
      }}
    >
      <Box sx={{ px: 2.25, pt: 2, pb: 0 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.6 }}>
          <Box
            sx={{
              width: 52,
              height: 52,
              borderRadius: "16px",
              display: "grid",
              placeItems: "center",
              background: "linear-gradient(180deg, #FF7A3D 0%, #FF5B1F 100%)",
              boxShadow: "0 18px 30px rgba(255, 91, 31, .28)",
            }}
          >
            <LayersOutlinedIcon sx={{ fontSize: 26, color: "#fff" }} />
          </Box>

          <Box>
            <Typography sx={{ fontSize: 24, fontWeight: 800, lineHeight: 1 }}>
              AI SRE
            </Typography>

            <Typography
              sx={{
                mt: 0.35,
                fontSize: 12,
                letterSpacing: "0.16em",
                color: "rgba(255,255,255,.45)",
              }}
            >
              INCIDENT AGENT
            </Typography>
          </Box>
        </Box>
      </Box>

      <List
        sx={{
          px: 2,
          pt: 2,
          mt: 0,
        }}
      >
        {menus.map((menu) => (
          <ListItemButton
            key={menu.text}
            selected={location.pathname === menu.path}
            onClick={() => navigate(menu.path)}
            sx={{
              mb: 1.1,
              borderRadius: "16px",
              px: 2,
              py: 1.5,
              color: "rgba(255,255,255,.6)",
              borderLeft: "4px solid transparent",
              "& .MuiListItemIcon-root": {
                minWidth: 32,
                color: "rgba(255,255,255,.45)",
              },
              "&.Mui-selected": {
                background: "rgba(255,255,255,.1)",
                borderLeftColor: "var(--accent)",
                color: "#fff",
                boxShadow: "inset 0 0 0 1px rgba(255,255,255,.1)",
              },
              "&.Mui-selected .MuiListItemIcon-root": {
                color: "var(--accent)",
              },
            }}
          >
            <ListItemIcon
              sx={{
                "& svg": {
                  fontSize: 23,
                },
              }}
            >
              {menu.icon}
            </ListItemIcon>

            <ListItemText
              primary={menu.text}
              primaryTypographyProps={{ fontSize: 17, fontWeight: 700 }}
            />
          </ListItemButton>
        ))}
      </List>
    </Drawer>
  );
}
