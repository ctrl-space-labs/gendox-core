import React, { useState, useEffect } from "react";
import { formatDistanceToNow, parseISO } from "date-fns";

// ** MUI Imports
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Grid from "@mui/material/Grid";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import { styled } from "@mui/material/styles";
import { Button } from "@mui/material";
import Divider from "@mui/material/Divider";

// ** Next Import
import Link from "next/link";

// ** Icon Imports
import Icon from "src/@core/components/icon";
import CustomAvatar from "src/@core/components/mui/avatar";

import { useSelector, useDispatch } from "react-redux";
import { useRouter } from "next/router";
import { formatDocumentTitle } from "src/utils/documentUtils";
import authConfig from "src/configs/auth";

const Documents = ({ documents, showAll, setShowAll }) => {
  const router = useRouter();
  const dispatch = useDispatch();
  const { projectDetails, projectMembers } = useSelector(
    (state) => state.activeProject
  );
  const { id: projectId, organizationId } = projectDetails;
  const storedToken = localStorage.getItem(authConfig.storageTokenKeyName);


  useEffect(() => {
    setShowAll(false);
  }, [projectDetails]);

  const toggleShowAll = () => {
    setShowAll((prev) => !prev);
  };

  if (documents.length === 0) {
    return (
      <Box sx={{ m: 2, textAlign: "center" }}>
        <Typography variant="subtitle1">No documents found.</Typography>
      </Box>
    );
  }

  const renderDocuments = () => {
    const visibleDocuments = showAll ? documents : documents.slice(0, 3);

    return visibleDocuments.map((document) => {
      const documentAuthor = projectMembers.find(
        (projMem) => projMem.user.id === document.createdBy
      );
      const relativeDate = formatDistanceToNow(parseISO(document.createAt), {
        addSuffix: true,
      });

      return (
        <Grid item xs={12} sm={6} md={4} key={document.id}>
          <Box
            sx={{
              p: 5,
              boxShadow: 6,
              height: "100%",
              display: "flex",
              borderRadius: 1,
              flexDirection: "column",
              alignItems: "flex-start",
              backgroundColor: "background.paper",
            }}
          >
            <Box sx={{ mb: 5, display: "flex", alignItems: "center" }}>
              <CustomAvatar
                skin="light"
                variant="rounded"
                sx={{ mr: 3, height: 34, width: 34 }}
              >
                <Icon icon="mdi:file" />
              </CustomAvatar>
              <Typography
                variant="h6"
                component={Link}
                href={`/gendox/document-instance/?organizationId=${organizationId}&documentId=${document.id}&projectId=${projectId}`}
                sx={{
                  fontWeight: 600,
                  textDecoration: "none",
                  "&:hover": { color: "primary.main" },
                  cursor: "pointer",
                }}
              >
                {formatDocumentTitle(document.remoteUrl)}
              </Typography>
            </Box>
            <Box
              component="ul"
              sx={{
                mt: 0,
                mb: 5,
                pl: 6.75,
                "& li": { mb: 2, color: "primary.main" },
              }}
            >
              <li>
                <Typography
                  // component={Link}
                  sx={{ color: "inherit", textDecoration: "none" }}
                  // href={`/gendox/document-instance/?organizationId=${organizationId}&documentId=${document.id}`}
                >
                  {documentAuthor ? documentAuthor.user.name : "Unknown Author"}
                </Typography>
              </li>
              <li>
                <Typography
                  sx={{ color: "inherit", textDecoration: "none" }}
                  // component={Link}
                  // href={`/gendox/document-instance/?organizationId=${organizationId}&documentId=${document.id}`}
                >
                  {documentAuthor
                    ? documentAuthor.user.email
                    : "Unknown E-mail"}
                </Typography>
              </li>
            </Box>

            <Typography
              // component={Link}
              // href={`/gendox/document-instance/?organizationId=${organizationId}&documentId=${document.id}`}
              sx={{
                mt: "auto",
                textDecoration: "none",
                // "&:hover": { color: "primary.main" },
              }}
            >
              {`Created ${relativeDate}`}
            </Typography>
          </Box>
        </Grid>
      );
    });
  };

  return (
    <Grid container spacing={6}>
      {renderDocuments()}
      {documents.length > 3 && (
        <Grid item xs={12} style={{ textAlign: "center" }}>
          <Divider
            sx={{
              my: (theme) => {
                theme.spacing(3);
              },
            }}
          />
          <Tooltip title={showAll ? "Show Less" : "Show More"}>
            <IconButton onClick={toggleShowAll} sx={{ color: "primary.main" }} >
              <Icon
                icon={showAll ? "mdi:chevron-up" : "mdi:chevron-down"}
                
              />
            </IconButton>
          </Tooltip>
        </Grid>
      )}
    </Grid>
  );
};

export default Documents;
