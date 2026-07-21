import type { ReactNode } from "react";

import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Typography,
  Box,
} from "@mui/material";

import CloseIcon from "@mui/icons-material/Close";

interface Props {
  open: boolean;
  title: string;
  icon?: ReactNode;
  children: ReactNode;
  onClose: () => void;
}

export default function InvestigationDialog({
  open,
  title,
  icon,
  children,
  onClose,
}: Props) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="lg"
    >
      <DialogTitle
        sx={{
          bgcolor: "#ffffff",
          borderBottom: "1px solid #e5e7eb",
          px: 3,
          py: 2,
        }}
      >
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.5,
            }}
          >
            {icon}

            <Typography
              variant="h5"
              sx={{
                fontWeight: 700,
                color: "#111827",
              }}
            >
              {title}
            </Typography>
          </Box>

          <IconButton
            onClick={onClose}
            sx={{
              color: "#111827",
            }}
          >
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent
        dividers
        sx={{
          bgcolor: "#111827",
          p: 3,
        }}
      >
        {children}
      </DialogContent>
    </Dialog>
  );
}