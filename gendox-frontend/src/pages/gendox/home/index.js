import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Grid from "@mui/material/Grid";
import ApexChartWrapper from "src/@core/styles/libs/react-apexcharts";
import ProjectButtons from "src/views/gendox-components/project-buttons-components/ProjectButtons";
import DocumentComponent from "src/views/gendox-components/DocumentComponent";
import { useAuth } from "src/hooks/useAuth";
import documentService from "src/gendox-sdk/documentService";
import authConfig from "src/configs/auth";
import useRedirectOr404ForHome from "src/utils/redirectOr404";

const GendoxDashboard = () => {
  const router = useRouter();
  const { organizationId, projectId } = router.query;
  const auth = useAuth();
  const [documents, setDocuments] = useState([]);
  const [activeProject, setActiveProject] = useState([]);

 
  if (!organizationId || !projectId) {
    useRedirectOr404ForHome();
  }

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
              setActiveProject(selectedProject);
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
    <ApexChartWrapper>
      <Grid container spacing={6} className="match-height">
        <Grid item xs={12} md={12}>
          <ProjectButtons project={activeProject} />
        </Grid>
        {documents.map((document) => (
          <Grid key={document.id} item xs={6} md={4}>
            <DocumentComponent document={document} />
          </Grid>
        ))}
      </Grid>
    </ApexChartWrapper>
  );
};

export default GendoxDashboard;
