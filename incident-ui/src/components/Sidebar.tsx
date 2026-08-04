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
import BugReportIcon from "@mui/icons-material/BugReport";
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
      <Box sx={{ px: 2.25, pt: 1.6, pb: 0 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.15 }}>
          <Box
            sx={{
              width: 42,
              height: 42,
              borderRadius: "14px",
              display: "grid",
              placeItems: "center",
              background: "linear-gradient(180deg, #FF7A3D 0%, #FF5B1F 100%)",
              boxShadow: "0 14px 24px rgba(255, 91, 31, .24)",
            }}
          >
            <LayersOutlinedIcon sx={{ fontSize: 21, color: "#fff" }} />
          </Box>

          <Box>
            <Typography sx={{ fontSize: 18, fontWeight: 700, lineHeight: 1 }}>
              AI SRE
            </Typography>

            <Typography
              sx={{
                mt: 0.2,
                fontSize: 10.5,
                letterSpacing: "0.14em",
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
              px: 1.85,
              py: 1.25,
              color: "rgba(255,255,255,.6)",
              borderLeft: "4px solid transparent",
              "& .MuiListItemIcon-root": {
                minWidth: 28,
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
                  fontSize: 20,
                },
              }}
            >
              {menu.icon}
            </ListItemIcon>

            <ListItemText
              primary={menu.text}
              primaryTypographyProps={{ fontSize: 15, fontWeight: 600 }}
            />
          </ListItemButton>
        ))}
      </List>
    </Drawer>
  );
}
