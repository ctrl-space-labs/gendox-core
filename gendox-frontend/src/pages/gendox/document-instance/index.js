import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useSelector, useDispatch } from "react-redux";
import { styled } from "@mui/material/styles";
import Typography from "@mui/material/Typography";
import CardContent from "@mui/material/CardContent";
import Card from "@mui/material/Card";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import Icon from "src/@core/components/icon";
import { formatDocumentTitle } from "src/utils/documentUtils";
import { fetchDocument } from "src/store/apps/activeDocument/activeDocument";
import authConfig from "src/configs/auth";
import SectionCard from "src/views/gendox-components/documents-components/SectionCard";
import SectionEdit from "src/views/gendox-components/documents-components/SectionEdit";
import { is } from "date-fns/locale";
import { set } from "nprogress";

const StyledCardContent = styled(CardContent)(({ theme }) => ({
  paddingTop: `${theme.spacing(10)} !important`,
  paddingBottom: `${theme.spacing(8)} !important`,
  [theme.breakpoints.up("sm")]: {
    paddingLeft: `${theme.spacing(20)} !important`,
    paddingRight: `${theme.spacing(20)} !important`,
  },
}));

const DocumentSections = () => {
  const dispatch = useDispatch();
  const router = useRouter();
  const { documentId } = router.query;
  const [isLoading, setIsLoading] = useState(true);

  const [showSections, setShowSections] = useState(true);
  const [editMode, setEditMode] = useState(true);
  
  const document = useSelector((state) => state.activeDocument.document);
  const sections = useSelector((state) => state.activeDocument.sections);
  
  const storedToken = localStorage.getItem(authConfig.storageTokenKeyName);

  useEffect(() => {
    const loadData = () => {
      if (!document || document.id !== documentId) { 
        dispatch(fetchDocument({
          documentId,
          storedToken,
        }));
      }
      setIsLoading(false);
    };

    loadData();
  }, [documentId, document, dispatch, storedToken, sections]);

  if (isLoading) {
    return <div>Loading...</div>; 
  }

  

  const handleToggleEdit = () => {
    setShowSections(!showSections);
    setEditMode(!editMode);
  };

  return (
    <Card sx={{ backgroundColor: "transparent", boxShadow: "none" }}>
      <StyledCardContent sx={{ backgroundColor: "background.paper" }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Typography
            variant="h3"
            sx={{ mb: 6, fontWeight: 600, textAlign: "left" }}
          >
            {document
              ? formatDocumentTitle(document.remoteUrl)
              : "No Selected Document"}{" "}
            Document
          </Typography>
          {editMode ? (
            <Tooltip title="Edit">
              <IconButton
                onClick={handleToggleEdit}
                sx={{
                  mb: 6,
                  width: "auto",
                  height: "auto",
                  color: "primary.main",
                }}
              >
                <Icon icon="mdi:pencil-outline" />
              </IconButton>
            </Tooltip>
          ) : (
            <Box sx={{ display: "inline-flex", gap: 1 }}>
              {" "}
              {/* Adjusts the gap between the icons */}
              <Tooltip title="Back">
                <IconButton
                  onClick={handleToggleEdit}
                  sx={{
                    mb: 6,
                    width: "auto",
                    height: "auto",
                    color: "primary.main",
                  }}
                >
                  <Icon icon="mdi:arrow-left-bold" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Add new Section">
                <IconButton
                  onClick={() => {
                    /* add new section */
                  }}
                  sx={{
                    mb: 6,
                    width: "auto",
                    height: "auto",
                    color: "primary.main",
                  }}
                >
                  <Icon icon="mdi:tab-plus" />
                </IconButton>
              </Tooltip>
            </Box>
          )}
        </Box>
      </StyledCardContent>
      <Box sx={{ height: 20 }} />
      {showSections ? (
        <StyledCardContent
          sx={{ backgroundColor: "action.hover", pt: 3, pb: 3 }}
        >
          <SectionCard />
        </StyledCardContent>
      ) : (
        sections.map((section, index) => (
          <StyledCardContent
            key={section.id || index}
            sx={{ backgroundColor: "background.paper", pt: 3, pb: 3, mb: 6 }}
          >
            <SectionEdit section={section} />
          </StyledCardContent>
        ))
      )}
    </Card>
  );
};

export default DocumentSections;
