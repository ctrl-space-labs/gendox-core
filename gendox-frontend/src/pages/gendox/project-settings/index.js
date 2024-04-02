// ** MUI Imports
import Grid from '@mui/material/Grid'

// ** Icon Imports
import Icon from 'src/@core/components/icon'

// ** project settings components import
import ProjectSettingsComponent from 'src/views/gendox-components/project-settings-components/ProjectSettingsCard'

// ** Axios
import axios from 'axios'

// ** Custom Component Import
import CardStatisticsVertical from 'src/@core/components/card-statistics/card-stats-vertical'

// ** Styled Component Import
import ApexChartWrapper from 'src/@core/styles/libs/react-apexcharts'

// ** Redux
import { useSelector, useDispatch } from 'react-redux'

// ** Config
import authConfig from 'src/configs/auth'
import apiRequests from 'src/configs/apiRequest'

// ** Demo Components Imports
import { useAuth } from 'src/hooks/useAuth'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'



const ProjectSettings = () => {
  const auth = useAuth()
  const routerFromUrl = useRouter()
  const { query } = routerFromUrl
  const { organizationId, projectId } = query
  const dispatch = useDispatch();

  // const project = useSelector((state) => state.activeProject.activeProject); // Adjust selector according to your state structure

  // useEffect(() => {
  //   if (projectId && organizationId) {
  //     dispatch(fetchActiveProject({ organizationId, projectId }));
  //   }
  // }, [dispatch, organizationId, projectId]);


  const [project, setProject] = useState()
  const [activeProject, setActiveProject] = useState([])

  useEffect(() => {
    const initProject = async () => {
      if (projectId && organizationId) {
        const activeOrganization = auth.user.organizations.find(org => org.id === organizationId)
        const selectedProject = activeOrganization.projects.find(proj => proj.id === projectId)

        const storedToken = window.localStorage.getItem(authConfig.storageTokenKeyName)

        if (storedToken) {

          await axios
            .get(apiRequests.getProjectById(activeOrganization.id, selectedProject.id), {
              headers: {
                'Content-Type': 'application/json',
                Authorization: 'Bearer ' + storedToken
              },
                 params: {
                projectId: selectedProject.id
              }
            })
            .then(async response => {
              // auth.setLoading(false)
              setProject(response.data)
              console.log("!!!!!!!!!!!!!", response.data)
              setActiveProject(selectedProject)
            })
            .catch(() => {
              auth.setLoading(false)
              if (authConfig.onTokenExpiration === 'logout' && !router.pathname.includes('login')) {
                router.replace('/login')
              }
            })
        } else {
          // auth.setLoading(false)
        }
      }
    }
    initProject()
  }, [auth, organizationId, projectId, routerFromUrl, activeProject])




  return (
    <>
      {project ? (
        <ProjectSettingsComponent project={project} />
      ) : (
        <div>Loading...</div>  // Or any other loading state representation
      )}
    </>
  );

}

export default ProjectSettings
