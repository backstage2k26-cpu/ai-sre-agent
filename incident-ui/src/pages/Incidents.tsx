import { useEffect, useMemo, useState } from "react";
import type { Incident } from "../types/incident";
import { getIncidents } from "../services/incidentService";
import { useNavigate } from "react-router-dom";
import IncidentDetailsDialog from "../components/IncidentDetailsDialog";

import {
  Box,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  IconButton,
  TextField,
  Typography,
  Button,
  Tooltip,
} from "@mui/material";

import { DataGrid, GridToolbarContainer } from "@mui/x-data-grid";
import type { GridColDef } from "@mui/x-data-grid";
import RefreshIcon from "@mui/icons-material/Refresh";
import VisibilityIcon from "@mui/icons-material/Visibility";

export default function Incidents() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");

  const [selectedIncident, setSelectedIncident] =
    useState<string | null>(null);

  const [dialogOpen, setDialogOpen] = useState(false);

  const navigate = useNavigate();

  const openIncident = (number: string) => {
    setSelectedIncident(number);
    setDialogOpen(true);
  };

  const loadIncidents = async () => {
    try {
      const data = await getIncidents();
      setIncidents(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadIncidents();

    const timer = window.setInterval(loadIncidents, 5000);

    return () => clearInterval(timer);
  }, []);

  const filteredIncidents = useMemo(() => {
    return incidents.filter((i) => {
      const q = search.toLowerCase();

      return (
        i.number.toLowerCase().includes(q) ||
        i.service.toLowerCase().includes(q) ||
        i.short_description.toLowerCase().includes(q)
      );
    });
  }, [incidents, search]);

  function InvestigationChip({
    status,
  }: {
    status?: string;
  }) {
    switch (status) {
      case "RUNNING":
        return (
          <Chip
            label="Investigating"
            color="info"
            size="small"
          />
        );

      case "COMPLETED":
        return (
          <Chip
            label="Completed"
            color="success"
            size="small"
          />
        );

      case "FAILED":
        return (
          <Chip
            label="Failed"
            color="error"
            size="small"
          />
        );

      default:
        return (
          <Chip
            label="New"
            color="warning"
            size="small"
          />
        );
    }
  }

  function PriorityChip({
    priority,
  }: {
    priority: string;
  }) {
    switch (priority) {
      case "P1":
        return (
          <Chip
            label="P1"
            color="error"
            size="small"
          />
        );

      case "P2":
        return (
          <Chip
            label="P2"
            color="warning"
            size="small"
          />
        );

      case "P3":
        return (
          <Chip
            label="P3"
            color="info"
            size="small"
          />
        );

      default:
        return (
          <Chip
            label={priority}
            size="small"
          />
        );
    }
  }

  function Toolbar() {
    return (
      <GridToolbarContainer
        sx={{
          p: 2,
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        <TextField
          size="small"
          placeholder="Search incidents..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <Tooltip title="Refresh">
          <IconButton onClick={loadIncidents}>
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      </GridToolbarContainer>
    );
  }

  const columns: GridColDef[] = [
    {
      field: "number",
      headerName: "Incident",
      width: 150,
    },

    {
      field: "service",
      headerName: "Service",
      width: 140,
    },

    {
      field: "priority",
      headerName: "Priority",
      width: 90,

      renderCell: (params) => (
        <PriorityChip priority={params.value} />
      ),
    },

    {
      field: "state",
      headerName: "Status",
      width: 110,
    },

    {
      field: "investigation_status",
      headerName: "Investigation",
      width: 140,

      renderCell: (params) => (
        <InvestigationChip status={params.value} />
      ),
    },

    {
      field: "short_description",
      headerName: "Description",
      flex: 1,
      minWidth: 180,
    },
    {
      field: "actions",
      headerName: "Actions",
      width: 140,
      sortable: false,
      filterable: false,

      renderCell: (params) => {
        const row = params.row as Incident;

        if (row.investigation_status === "RUNNING") {
          return (
            <Button
              variant="contained"
              disabled
              size="small"
            >
              Investigating...
            </Button>
          );
        }

        if (row.investigation_status === "COMPLETED") {
          return (
            <Button
              variant="contained"
              color="success"
              size="small"
              startIcon={<VisibilityIcon />}
              onClick={(e) => {
                e.stopPropagation();

                navigate(`/reports/${row.investigation_id}`);
              }}
            >
              Report
            </Button>
          );
        }

        return (
          <Typography
            variant="body2"
            color="text.secondary"
          >
            —
          </Typography>
        );
      },
    },
    ];

    return (
    <Box sx={{ p: 2 }}>
      <Card elevation={3}>
        <CardContent>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 3,
            }}
          >
            <Box>
              <Typography
                variant="h4"
                sx={{ fontWeight: 700 }}
              >
                Incidents
              </Typography>

              <Typography
                variant="body2"
                color="text.secondary"
              >
                Monitor all ServiceNow incidents and AI investigations.
              </Typography>
            </Box>

            <Chip
              color="primary"
              label={`${filteredIncidents.length} Incidents`}
            />
          </Box>

          {loading ? (
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                py: 8,
              }}
            >
              <CircularProgress />
            </Box>
          ) : (
            <Box
              sx={{
                height: 650,
                width: "100%",
              }}
            >
              <DataGrid
                rows={filteredIncidents}
                columns={columns}
                getRowId={(row) => row.number}
                                loading={loading}
                disableRowSelectionOnClick

                pageSizeOptions={[10, 25, 50]}

                initialState={{
                  pagination: {
                    paginationModel: {
                      pageSize: 10,
                      page: 0,
                    },
                  },
                }}

                onRowClick={(params) =>
                  openIncident(params.row.number)
                }

                slots={{
                  toolbar: Toolbar,
                }}

                sx={{
                  border: 0,

                  "& .MuiDataGrid-columnHeaders": {
                    fontWeight: 700,
                    fontSize: 15,
                  },

                  "& .MuiDataGrid-row": {
                    cursor: "pointer",
                  },

                  "& .MuiDataGrid-cell:focus": {
                    outline: "none",
                  },

                  "& .MuiDataGrid-columnHeader:focus": {
                    outline: "none",
                  },
                }}
              />
            </Box>
          )}
        </CardContent>
      </Card>

      <IncidentDetailsDialog
        open={dialogOpen}
        incidentNumber={selectedIncident}
        onClose={() => {
          setDialogOpen(false);
          setSelectedIncident(null);
        }}
      />
    </Box>
  );
}