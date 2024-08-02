import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useSelector } from "react-redux";
import { useAuth } from "src/hooks/useAuth";
import documentService from "src/gendox-sdk/documentService";
import authConfig from "src/configs/auth";

// MUI components
import Typography from "@mui/material/Typography";
import CardContent from "@mui/material/CardContent";
import Card from "@mui/material/Card";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Icon from "src/@core/components/icon";
import Tooltip from "@mui/material/Tooltip";
import Link from "next/link";



// Custom components
import ProjectButtons from "src/views/gendox-components/home-page-components/project-buttons-components/ProjectButtons";
import Documents from "src/views/gendox-components/home-page-components/document-components/Documents";
import useRedirectOr404ForHome from "src/utils/useRedirectOr404ForHome";
import { StyledCardContent }  from "src/utils/styledCardsContent";



const GendoxHome = () => {
  const router = useRouter();
  const { organizationId, projectId } = router.query;
  const auth = useAuth();
  const [documents, setDocuments] = useState([]);
  
  const project = useSelector((state) => state.activeProject.projectDetails);
  useRedirectOr404ForHome(organizationId, projectId);

  const storedToken = window.localStorage.getItem(
    authConfig.storageTokenKeyName
  );

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
    

    if (storedToken && selectedProject) {
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
            mb: 6,
          }}
        >
          <Box sx={{ flexGrow: 1, display: "flex", flexDirection: "column" }}>
            <Typography
              variant="h3"
              sx={{ mb: 3, fontWeight: 600, textAlign: "left" }}
            >
              {project?.name || "No Selected "} Project
            </Typography>
            <Box sx={{ mt: 3 }}>
            <ProjectButtons />
            </Box>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center" }}>
          <Tooltip title="Project Settings">
          <Link href={`/gendox/project-settings?organizationId=${organizationId}&projectId=${projectId}`} passHref>

            <IconButton onClick={handleSettingsClick} sx={{ ml: 2, fontSize: "2rem" }}>
              <Icon icon="mdi:cog-outline" fontSize="inherit"/>
            </IconButton>
            </Link>
            </Tooltip>
            
          </Box>
        </Box>
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
