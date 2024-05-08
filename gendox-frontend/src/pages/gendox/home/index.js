import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useSelector } from "react-redux";
import { useAuth } from "src/hooks/useAuth";
import documentService from "src/gendox-sdk/documentService";
import authConfig from "src/configs/auth";

// MUI components
import { styled } from "@mui/material/styles";
import Typography from "@mui/material/Typography";
import CardContent from "@mui/material/CardContent";
import Card from "@mui/material/Card";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Icon from "src/@core/components/icon";

// Custom components
import ProjectButtons from "src/views/gendox-components/home-page-components/project-buttons-components/ProjectButtons";
import Documents from "src/views/gendox-components/home-page-components/document-components/Documents";
import useRedirectOr404ForHome from "src/utils/useRedirectOr404ForHome";

const StyledCardContent = styled(CardContent)(({ theme }) => ({
  paddingTop: `${theme.spacing(10)} !important`,
  paddingBottom: `${theme.spacing(8)} !important`,
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
  useRedirectOr404ForHome(organizationId, projectId);

  useEffect(() => {    
    initDocuments();
  }, [organizationId, projectId]);
  

  const handleSettingsClick = () => {
    const path = `/gendox/project-settings?organizationId=${organizationId}&projectId=${projectId}`;
    router.push(path);
  };

  const initDocuments = async () => {
    const activeOrganization = auth.user.organizations.find(
      (org) => org.id === organizationId
    );
    if (!activeOrganization?.projects?.length) {
      return;
    }

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
            {project?.name || "No Selected "} Project
          </Typography>
          <IconButton onClick={handleSettingsClick} sx={{ mb: 6 }}>
            <Icon icon="mdi:cog-outline" />
          </IconButton>
        </Box>
        <ProjectButtons />
      </StyledCardContent>
      <Box sx={{ height: 20 }} />
      {documents.length > 0 ? (
        <StyledCardContent sx={{ backgroundColor: "action.hover" }}>
          <Typography
            variant="h5"
            sx={{ mb: 6, fontWeight: 600, textAlign: "left" }}
          >
            Recent Documents
          </Typography>
          <Documents documents={documents} />
        </StyledCardContent>
      ) : (
        <CardContent
          sx={{
            display: "flex",
            textAlign: "center",
            alignItems: "center",
            flexDirection: "column",
            backgroundSize: "cover",
            py: (theme) => `${theme.spacing(25)} !important`,
            backgroundImage: (theme) =>
              `url(/images/pages/pages-header-bg-${theme.palette.mode}.png)`,
          }}
        >
          <Typography
            variant="h5"
            sx={{
              fontWeight: 600,
              fontSize: "1.5rem !important",
              color: "primary.main",
            }}
          >
            Hello, would you like to create a new document?
          </Typography>
          <Box mt={10}>
            <Typography variant="body2">
              or choose an action from the buttons above
            </Typography>
          </Box>
        </CardContent>
      )}
    </Card>
  );
};

export default GendoxHome;
