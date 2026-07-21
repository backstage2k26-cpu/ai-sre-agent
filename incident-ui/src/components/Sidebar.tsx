import {
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  Box,
} from "@mui/material";

import DashboardIcon from "@mui/icons-material/Dashboard";
import ReportIcon from "@mui/icons-material/Description";
import BugReportIcon from "@mui/icons-material/BugReport";
import SettingsIcon from "@mui/icons-material/Settings";

import { useLocation, useNavigate } from "react-router-dom";

const drawerWidth = 240;

const menus = [
  {
    text: "Dashboard",
    icon: <DashboardIcon />,
    path: "/",
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
        "& .MuiDrawer-paper": {
          width: drawerWidth,
          boxSizing: "border-box",
          borderRight: "1px solid #ddd",
        },
      }}
    >
      <Toolbar>
        <Box>
          <Typography variant="h6">
            AI SRE
          </Typography>

          <Typography
            variant="caption"
            color="text.secondary"
          >
            Incident Agent
          </Typography>
        </Box>
      </Toolbar>

      <List>
        {menus.map((menu) => (
          <ListItemButton
            key={menu.text}
            selected={location.pathname === menu.path}
            onClick={() => navigate(menu.path)}
          >
            <ListItemIcon>{menu.icon}</ListItemIcon>

            <ListItemText primary={menu.text} />
          </ListItemButton>
        ))}
      </List>
    </Drawer>
  );
}