import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { useSelector, useDispatch } from 'react-redux'
import ProjectSettingsCard from 'src/views/pages/project-settings-components/ProjectSettingsCard'
import { useAuth } from 'src/authentication/useAuth'
import { fetchOrganization } from 'src/store/activeOrganization/activeOrganization'
import { fetchProject } from 'src/store/activeProject/activeProject'
import { ResponsiveCardContent } from 'src/utils/responsiveCardContent'
import Tooltip from '@mui/material/Tooltip'
import IconButton from '@mui/material/IconButton'
import Icon from 'src/views/custom-components/mui/icon/icon'
import Card from '@mui/material/Card'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import { localStorageConstants } from 'src/utils/generalConstants'

const ProjectSettings = () => {
  const auth = useAuth()
  const dispatch = useDispatch()
  const router = useRouter()
  const { organizationId, projectId } = router.query
  const [isBlurring, setIsBlurring] = useState(false)
  const handleGoBack = () => {
    router.push(`/gendox/home/?organizationId=${organizationId}&projectId=${projectId}`)
  }
  const project = useSelector(state => state.activeProject.projectDetails)

  const token = window.localStorage.getItem(localStorageConstants.accessTokenKey)

  useEffect(() => {
    if (organizationId && projectId && token) {
      dispatch(fetchOrganization({ organizationId, token }))
      dispatch(fetchProject({ organizationId, projectId, token }))
    }
  }, [organizationId, projectId, token, dispatch])

  useEffect(() => {
    const loadProjectDetails = async () => {
      if (projectId && organizationId) {
        setIsBlurring(true)
        const activeOrganization = auth.user.organizations.find(org => org.id === organizationId)
        const selectedProject = activeOrganization.projects.find(proj => proj.id === projectId)

        if (!selectedProject) {
          setTimeout(() => {
            setIsBlurring(false) // Remove blur effect after 300ms
          }, 300)
          return
        } else {
          setTimeout(() => {
            setIsBlurring(false) // Remove blur effect after 300ms
          }, 300)
        }
      }
    }
    loadProjectDetails()
  }, [auth, organizationId, projectId])

  return (
    <Card
      sx={{
        backgroundColor: 'transparent',
        boxShadow: 'none',
        filter: isBlurring ? 'blur(6px)' : 'none',
        transition: 'filter 0.3s ease'
      }}
    >
      <ResponsiveCardContent sx={{ backgroundColor: 'background.paper' }}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <Box>
            <Typography
              variant='h4'
              sx={{
                fontWeight: 600,
                color: 'text.secondary',
                mb: 2
              }}
            >
              Project Settings
            </Typography>
            <Typography variant='h6' sx={{ fontWeight: 400, color: 'primary.main' }}>
              {project?.name || 'No Selected'}
            </Typography>
          </Box>
          <Box sx={{ display: 'inline-flex', gap: 1 }}>
            {' '}
            {/* Adjusts the gap between the icons */}
            <Tooltip title='Back'>
              <IconButton
                onClick={handleGoBack}
                sx={{
                  mb: 6,
                  width: 'auto',
                  height: 'auto',
                  color: 'primary.main'
                }}
              >
                <Icon icon='mdi:arrow-left-bold' />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
      </ResponsiveCardContent>
      <Box sx={{ mt: '1.5rem' }}>
        <ProjectSettingsCard />
      </Box>
    </Card>
  )
}

export default ProjectSettings
