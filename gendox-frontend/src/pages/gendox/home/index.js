import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useDispatch, useSelector } from "react-redux";
import Typography from "@mui/material/Typography";
import CardContent from "@mui/material/CardContent";
import Card from "@mui/material/Card";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Icon from "src/@core/components/icon";
import Tooltip from "@mui/material/Tooltip";
import Link from "next/link";
import ProjectButtons from "src/views/gendox-components/home-page-components/project-buttons-components/ProjectButtons";
import Documents from "src/views/gendox-components/home-page-components/document-components/Documents";
import useRedirectOr404ForHome from "src/utils/useRedirectOr404ForHome";
import { StyledCardContent } from "src/utils/styledCardsContent";

const GendoxHome = () => {
  const router = useRouter();
  const { organizationId, projectId } = router.query;

  const project = useSelector((state) => state.activeProject.projectDetails);
  const isBlurring = useSelector((state) => state.activeProject.isBlurring);

  console.log("GendoxHome -> project", project);

  useRedirectOr404ForHome(organizationId, projectId);

  const handleSettingsClick = () => {
    const path = `/gendox/project-settings?organizationId=${organizationId}&projectId=${projectId}`;
    router.push(path);
  };

  return (
    <Card
      sx={{
        backgroundColor: "transparent",
        boxShadow: "none",
      }}
    >
      <StyledCardContent sx={{ backgroundColor: "background.paper", mb: -7 }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          {organizationId && projectId && projectId !== "null" ? (
            <Box
              sx={{
                flexGrow: 1,
                display: "flex",
                flexDirection: "column",
                filter: isBlurring ? "blur(6px)" : "none",
                transition: "filter 0.3s ease",
              }}              
            >
              <Typography
                variant="h4"
                sx={{ fontWeight: 600, textAlign: "left" }}
              >
                {project?.name || "No Selected "} Project
              </Typography>
            </Box>
          ) : (
            <Typography
              variant="h4"
              sx={{ fontWeight: 600, textAlign: "left" }}
            >
              No Project Selected
            </Typography>
          )}

          <Box sx={{ display: "flex", alignItems: "center" }}>
            {organizationId && projectId && projectId !== "null" ? (
              <Tooltip title="Project Settings">
                <Link
                  href={`/gendox/project-settings?organizationId=${organizationId}&projectId=${projectId}`}
                  passHref
                >
                  <IconButton
                    onClick={handleSettingsClick}
                    sx={{ ml: 2, fontSize: "2rem" }}
                  >
                    <Icon icon="mdi:cog-outline" fontSize="inherit" />
                  </IconButton>
                </Link>
              </Tooltip>
            ) : (
              <Tooltip title="No Project Selected">
                <IconButton
                  sx={{
                    ml: 2,
                    fontSize: "2rem",
                    color: "grey.500",
                    cursor: "not-allowed",
                  }}
                >
                  <Icon icon="mdi:cog-outline" fontSize="inherit" />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        </Box>
      </StyledCardContent>

      {/* Project Buttons */}
      <StyledCardContent sx={{ backgroundColor: "background.paper" }}>
        {/* <ProjectButtons refreshDocuments={refreshDocuments} /> */}
        <ProjectButtons />
      </StyledCardContent>
      <Box sx={{ height: 20 }} />

      {/* Documents Section */}
      <Documents />
    </Card>
  );
};

export default GendoxHome;
