// ** MUI Imports
import Grid from '@mui/material/Grid'

// ** Icon Imports
import Icon from 'src/@core/components/icon'

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
import DocAndTemplButtons from 'src/views/gendox-components/DocAndTemplButtons'
import DocumentComponent from 'src/views/gendox-components/DocumentComponent'
import { useAuth } from 'src/hooks/useAuth'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'

const GendoxDashboard = () => {
  const routerFromUrl = useRouter()
  const { query } = routerFromUrl
  const { organizationId, projectId } = query

  const auth = useAuth()
  
  // let activeProject = useSelector(state => state.activeProject.activeProject)
  const [documents, setDocuments] = useState([])
  const [activeProject, setActiveProject] = useState([])


  useEffect(() => {
    const initDocuments = async () => {
      if (projectId && organizationId) {
        const activeOrganization = auth.user.organizations.find(org => org.id === organizationId)
        const selectedProject = activeOrganization.projects.find(proj => proj.id === projectId)

        const storedToken = window.localStorage.getItem(authConfig.storageTokenKeyName)

        if (storedToken) {
          // auth.setLoading(true)
          await axios
            .get(apiRequests.getDocumentsByProject(activeOrganization.id, selectedProject.id), {
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
              setDocuments(response.data.content)
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
    initDocuments()
  }, [auth, organizationId, projectId, routerFromUrl, activeProject])




  return (
    <ApexChartWrapper>
      <Grid container spacing={6} className='match-height'>
        <Grid item xs={12} md={12}>
          <DocAndTemplButtons  project={activeProject}/>
        </Grid>
        {documents.map(document => (
          <Grid key={document.id} item xs={6} md={4}>
            <DocumentComponent document={document} />
          </Grid>
        ))}
      </Grid>
    </ApexChartWrapper>
  )
}

export default GendoxDashboard
