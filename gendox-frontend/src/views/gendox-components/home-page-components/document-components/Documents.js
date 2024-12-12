import React, { useState, useEffect } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Grid from "@mui/material/Grid";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import Divider from "@mui/material/Divider";
import Icon from "src/@core/components/icon";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useTheme } from "@mui/material/styles";

import DocumentsGrid from "./DocumentsGrid";
import DocumentsList from "./DocumentsList";

const Documents = ({ documents, showAll, setShowAll, onDocumentsUpdated }) => {
  const [viewMode, setViewMode] = useState("grid");
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const toggleViewMode = (mode) => {
    setViewMode(mode);
  };

  return (
    <>
      <Box
        sx={{
          display: "flex",
          justifyContent: "flex-end",
          mb: 2,
        }}
      >
        <Tooltip title="Grid View">
          <IconButton
            onClick={() => toggleViewMode("grid")}
            color={viewMode === "grid" ? "primary" : "default"}
            sx={{ fontSize: "3rem" }}
          >
            <Icon icon="mdi:view-grid-outline" fontSize="inherit" />
          </IconButton>
        </Tooltip>
        {!isMobile && (
          <Tooltip title="List View">
            <IconButton
              onClick={() => toggleViewMode("list")}
              color={viewMode === "list" ? "primary" : "default"}
              sx={{ fontSize: "3rem" }}
            >
              <Icon icon="mdi:view-list-outline" fontSize="inherit" />
            </IconButton>
          </Tooltip>
        )}
      </Box>

      {viewMode === "grid" ? (
        <DocumentsGrid
          documents={documents}
          showAll={showAll}
          setShowAll={setShowAll}
          onDocumentsUpdated={onDocumentsUpdated}
        />
      ) : (
        <DocumentsList
          documents={documents}
          showAll={showAll}
          setShowAll={setShowAll}
          onDocumentsUpdated={onDocumentsUpdated}
        />
      )}
    </>
  );
};

export default Documents;
