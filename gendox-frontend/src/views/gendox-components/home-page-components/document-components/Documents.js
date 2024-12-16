import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useDispatch, useSelector } from "react-redux";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import Icon from "src/@core/components/icon";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useTheme } from "@mui/material/styles";
import { StyledCardContent } from "src/utils/styledCardsContent";
import DocumentsGrid from "./DocumentsGrid";
import DocumentsList from "./DocumentsList";
import authConfig from "src/configs/auth";
import { fetchProjectDocuments } from "src/store/apps/activeProject/activeProject";

const Documents = () => {
  const router = useRouter();
  const dispatch = useDispatch();

  const { organizationId, projectId } = router.query;
  const storedToken = window.localStorage.getItem(
    authConfig.storageTokenKeyName
  );
  const { projectDocuments, isBlurring } = useSelector(
    (state) => state.activeProject
  );
  const { content: documents, totalPages } = projectDocuments;

  const [viewMode, setViewMode] = useState("grid");
  const [currentPage, setCurrentPage] = useState(0);
  const [showAll, setShowAll] = useState(false); 

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  useEffect(() => {
    setCurrentPage(0);
  }, [projectId]);

  useEffect(() => {
    if (organizationId && projectId) {
      dispatch(
        fetchProjectDocuments({
          organizationId,
          projectId,
          storedToken,
          page: currentPage,
        })
      );
    }
  }, [organizationId, projectId, currentPage, dispatch]);

  useEffect(() => {
    if (!documents.length) {
      setViewMode("grid");
    }
  }, [documents]);

  useEffect(() => {
    if (viewMode !== "grid") {
      setShowAll(true);
    }
  }, [viewMode]);

  const handlePageChange = (newPage) => {
    if (newPage >= 0 && newPage < totalPages) {
      setCurrentPage(newPage);
    }
  };

  const toggleViewMode = (mode) => {
    setViewMode(mode);
  };

  return (
    <StyledCardContent
      sx={{
        backgroundColor: "action.hover",
        filter: isBlurring ? "blur(6px)" : "none",
        transition: "filter 0.3s ease",
      }}
    >
      {/* Header Section */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: documents.length ? 4 : 0, // Add margin only if documents exist
        }}
      >
        <Typography variant="h5" sx={{ fontWeight: 600, textAlign: "left" }}>
          Recent Documents
        </Typography>
        {documents.length > 0 && (
          <Box
            sx={{
              display: "flex",
              gap: 2,
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
        )}
      </Box>

      {viewMode === "grid" ? (
        <DocumentsGrid
          documents={documents}
          showAll={showAll}
          setShowAll={setShowAll}
          page={currentPage}
        />
      ) : (
        <DocumentsList documents={documents} page={currentPage} />
      )}

      {showAll && (
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            mt: 4,
          }}
        >
          <Button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 0}
            sx={{ mr: 2 }}
          >
            Previous
          </Button>
          <Typography sx={{ mt: 1.5 }}>{`Page ${
            currentPage + 1
          } of ${totalPages}`}</Typography>
          <Button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages - 1}
            sx={{ ml: 2 }}
          >
            Next
          </Button>
        </Box>
      )}

      {/* Empty State */}
      {!documents.length && (
        <Typography
          variant="body2"
          sx={{ textAlign: "center", mt: 40, color: "text.secondary" }}
        >
          No documents available. Please create or upload new documents.
        </Typography>
      )}
    </StyledCardContent>
  );
};

export default Documents;
