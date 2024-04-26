import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";

import { styled } from "@mui/material/styles";
import Typography from "@mui/material/Typography";
import CardContent from "@mui/material/CardContent";
import Card from "@mui/material/Card";
import Box from "@mui/material/Box";
import IconButton from '@mui/material/IconButton';
import Icon from "src/@core/components/icon"; 


import ProjectButtons from "src/views/gendox-components/home-page-components/project-buttons-components/ProjectButtons";
import Documents from "src/views/gendox-components/home-page-components/document-components/Documents";
import { useAuth } from "src/hooks/useAuth";
import documentService from "src/gendox-sdk/documentService";
import authConfig from "src/configs/auth";
import useRedirectOr404ForHome from "src/utils/redirectOr404";
import { useDispatch, useSelector } from "react-redux";

const StyledCardContent = styled(CardContent)(({ theme }) => ({
  paddingTop: `${theme.spacing(20)} !important`,
  paddingBottom: `${theme.spacing(20)} !important`,
  [theme.breakpoints.up("sm")]: {
    paddingLeft: `${theme.spacing(20)} !important`,
    paddingRight: `${theme.spacing(20)} !important`,
  },
}));





const GendoxHome = () => {
  const router = useRouter();
  const { organizationId, projectId } = router.query;
  const auth = useAuth();
  const [documents, setDocuments] = useState([]);
  const project = useSelector((state) => state.activeProject.projectDetails);

  if (!organizationId || !projectId) {
    useRedirectOr404ForHome();
  }

  const handleSettingsClick = () => {
    const path = `/gendox/project-settings?organizationId=${organizationId}&projectId=${projectId}`;
    router.push(path);
  };
  

  useEffect(() => {
    const initDocuments = async () => {
      if (projectId && organizationId) {
        const activeOrganization = auth.user.organizations.find(
          (org) => org.id === organizationId
        );
        const selectedProject = activeOrganization.projects.find(
          (proj) => proj.id === projectId
        );
        const storedToken = window.localStorage.getItem(
          authConfig.storageTokenKeyName
        );

        if (storedToken) {
          // auth.setLoading(true)
          documentService
            .getDocumentByProject(
              activeOrganization.id,
              selectedProject.id,
              storedToken
            )
            .then((response) => {
              setDocuments(response.data.content);
            })
            .catch((error) => {
              if (
                authConfig.onTokenExpiration === "logout" &&
                !router.pathname.includes("login")
              ) {
                router.replace("/login");
              }
            });
        } else {
          // auth.setLoading(false)
        }
      }
    };
    initDocuments();
  }, [auth, organizationId, projectId, router]);

  return (
    <Card>
      <>
        <StyledCardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>

          <Typography
            variant="h3"
            sx={{ mb: 6, fontWeight: 600, textAlign: "left" }}
          >
            {project?.name || "No Selected "} Project
          </Typography>
          <IconButton
            onClick={handleSettingsClick}
            sx={{ mb: 6 }}
          >
            <Icon icon="mdi:cog-outline" />
          </IconButton>
        </Box>
          <ProjectButtons />
        </StyledCardContent>
        <StyledCardContent sx={{ backgroundColor: "action.hover" }}>
          <Typography
            variant="h5"
            sx={{ mb: 6, fontWeight: 600, textAlign: "left" }}
          >
            Recent Documents
          </Typography>
          <Documents documents={documents} />
        </StyledCardContent>
      </>
    </Card>
  );
};

export default GendoxHome;
