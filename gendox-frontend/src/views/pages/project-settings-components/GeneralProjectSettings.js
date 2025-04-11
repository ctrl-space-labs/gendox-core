import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { useSelector, useDispatch } from 'react-redux'
import Grid from '@mui/material/Grid'
import TextField from '@mui/material/TextField'
import FormControlLabel from '@mui/material/FormControlLabel'
import Checkbox from '@mui/material/Checkbox'
import Card from '@mui/material/Card'
import Button from '@mui/material/Button'
import Divider from '@mui/material/Divider'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import CardActions from '@mui/material/CardActions'
import Box from '@mui/material/Box'
import Icon from 'src/views/custom-components/mui/icon/icon'
import Tooltip from '@mui/material/Tooltip'
import documentService from 'src/gendox-sdk/documentService'
import DeleteConfirmDialog from 'src/utils/dialogs/DeleteConfirmDialog'
import { useAuth } from 'src/authentication/useAuth'
import { getErrorMessage } from 'src/utils/errorHandler'
import toast from 'react-hot-toast'
import { localStorageConstants } from 'src/utils/generalConstants'
import commonConfig from 'src/configs/common.config.js'
import { fetchProject, updateProject, deleteProject } from 'src/store/activeProject/activeProject'

const GeneralProjectSettings = () => {
  const router = useRouter()
  const dispatch = useDispatch()
  const token = window.localStorage.getItem(localStorageConstants.accessTokenKey)
  const { provenAiEnabled, provenAiUrl } = commonConfig

  const project = useSelector(state => state.activeProject.projectDetails)
  const isBlurring = useSelector(state => state.activeProject.isBlurring)
  const isUpdatingProject = useSelector(state => state.activeProject.isUpdating)
  const isDeletingProject = useSelector(state => state.activeProject.isDeleting)
  const [autoTraining, setAutoTraining] = useState(!!project.autoTraining)
  const [name, setName] = useState(project.name)
  const [description, setDescription] = useState(project.description)
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false)
  const auth = useAuth()

  useEffect(() => {
    if (project) {
      // Initialize state with project data when available
      setAutoTraining(!!project.autoTraining)
      setName(project.name)
      setDescription(project.description)
    }
  }, [project])

  const handleNameChange = event => setName(event.target.value)
  const handleDescriptionChange = event => setDescription(event.target.value)
  const handleAutoTrainingChange = event => setAutoTraining(event.target.checked)

  const handleSubmit = async e => {
    e.preventDefault() // Prevent default form submission

    const updatedProjectPayload = {
      id: project.id,
      organizationId: project.organizationId,
      name,
      description,
      autoTraining,
      projectAgent: project.projectAgent
    }

    dispatch(
      updateProject({
        organizationId: project.organizationId,
        projectId: project.id,
        updatedProjectPayload,
        token
      })
    )
      .unwrap()
      .then(() => {
        toast.success('Project updated successfully!')
        dispatch(fetchProject({ organizationId: project.organizationId, projectId: project.id, token }))
      })
      .catch(error => {
        toast.error(`Failed to update project. Error: ${getErrorMessage(error)}`)
      })
  }

  const handleTrainingClick = () => {
    documentService
      .triggerJobs(project.organizationId, project.id, token)
      .then(response => {
        toast.success('Training triggered successfully!')
      })
      .catch(error => {
        toast.error(`Failed to trigger trainint. Error: ${getErrorMessage(error)}`)
      })
  }

  const handleDeleteClickOpen = () => setOpenDeleteDialog(true)
  const handleDeleteClose = () => setOpenDeleteDialog(false)

  const handleDeleteProject = async () => {
    dispatch(
      deleteProject({
        organizationId: project.organizationId,
        projectId: project.id,
        token
      })
    )
      .unwrap()
      .then(() => {
        toast.success('Project deleted successfully!')

        // Update navigation based on the updated organization's projects list.
        const updatedOrganization = auth.user.organizations.find(org => org.id === project.organizationId)
        const updatedProjects = updatedOrganization?.projects.filter(proj => proj.id !== project.id)
        const firstActiveProject = updatedProjects && updatedProjects[0]
        if (firstActiveProject) {
          window.location.href = `/gendox/home/?organizationId=${project.organizationId}&projectId=${firstActiveProject.id}`
        } else {
          window.location.href = `/gendox/create-project/?organizationId=${project.organizationId}`
        }
      })
      .catch(error => {
        toast.error(`Project deletion failed. Error: ${getErrorMessage(error)}`)
        router.push('/gendox/home')
      })
  }

  return (
    <Card>
      <CardHeader />
      <Box sx={{ position: 'relative' }}>
        <Box
          sx={{
            filter: isDeletingProject || isUpdatingProject || isBlurring ? 'blur(3px)' : 'none',
            transition: 'filter 0.3s ease'
          }}
        >
          <form onSubmit={handleSubmit}>
            <CardContent>
              <Grid container spacing={5}>
                {/* First row: Name field */}
                <Grid item xs={12} md={12}>
                  <TextField
                    fullWidth
                    id='project-name'
                    label='Project Name'
                    value={name}
                    onChange={handleNameChange}
                    sx={{ width: { xs: '100%', md: '50%' } }}
                  />
                </Grid>

                {/* 2nd row:  Description field */}
                <Grid item xs={12} md={12}>
                  <TextField
                    fullWidth
                    rows={4}
                    multiline
                    label='Project Description'
                    id='project-description'
                    value={description}
                    onChange={handleDescriptionChange}
                    InputLabelProps={{
                      shrink: true
                    }}
                  />
                </Grid>

                {/* third row: auto-training checkbox */}
                <Grid item xs={12} md={12}>
                  <Tooltip
                    title='Enable auto-training for the project.
              If checked, uploaded files will be automatically processed without manual trigger. This may increase processing costs depending on usage.'
                    enterDelay={1000}
                    leaveDelay={300}
                  >
                    <FormControlLabel
                      label='auto-training'
                      control={
                        <Checkbox checked={autoTraining} onChange={handleAutoTrainingChange} name='autoTraining' />
                      }
                    />
                  </Tooltip>
                </Grid>

                {/* 4th row: buttons (Training first, then Go to Proven-Ai) */}
                <Grid item xs={12} container justifyContent='flex-start' alignItems='center' spacing={2}>
                  <Grid item>
                    <Tooltip
                      title='Start project training manually.
                Files that have been uploaded will be processed by the system.
                You may need to wait ~5 minutes, then go to chat and ask it a question!'
                    >
                      <Button size='large' variant='contained' onClick={handleTrainingClick}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Box component='span' sx={{ mr: 1 }}>
                            Training
                          </Box>
                          <Icon icon='mdi:brain' />
                        </Box>
                      </Button>
                    </Tooltip>
                  </Grid>
                  {provenAiEnabled && (
                    <Grid item>
                      <Button
                        size='large'
                        variant='outlined'
                        href={`${provenAiUrl}/provenAI/data-pods-control/?organizationId=${project.organizationId}&dataPodId=${project.id}`}
                        target='_blank'
                        rel='noopener noreferrer'
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Box component='span' sx={{ mr: 1 }}>
                            Go to Proven-Ai
                          </Box>
                          <Icon icon='mdi:arrow-right-thin' />
                        </Box>
                      </Button>
                    </Grid>
                  )}
                </Grid>
              </Grid>
            </CardContent>
            <Divider sx={{ m: '0' }} />

            <CardActions sx={{ display: 'flex', justifyContent: 'flex-end', py: '1.5rem' }}>
              <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
                <Button size='large' variant='outlined' color='error' onClick={handleDeleteClickOpen}>
                  Delete
                </Button>
                <Button size='large' type='submit' onClick={handleSubmit} variant='contained'>
                  Save Changes
                </Button>
              </Box>
            </CardActions>
          </form>
        </Box>
      </Box>

      <DeleteConfirmDialog
        open={openDeleteDialog}
        onClose={handleDeleteClose}
        onConfirm={handleDeleteProject}
        title='Delete Project'
        contentText={`Are you sure you want to delete ${project.name}? All member users will be removed and you will lose access to all related documents. This action cannot be undone.`}
        confirmButtonText='Delete'
        cancelButtonText='Cancel'
      />
    </Card>
  )
}

export default GeneralProjectSettings
