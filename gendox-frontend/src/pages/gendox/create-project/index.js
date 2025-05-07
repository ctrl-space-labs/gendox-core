import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { useSelector, useDispatch } from 'react-redux'
import { useAuth } from 'src/authentication/useAuth'
import { localStorageConstants } from 'src/utils/generalConstants'
import projectService from 'src/gendox-sdk/projectService'

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
import toast from 'react-hot-toast'
import CircularProgress from '@mui/material/CircularProgress'
import { getErrorMessage } from 'src/utils/errorHandler'
import { styled } from '@mui/material/styles'

const Form = styled('form')(({ theme }) => ({
  // maxWidth: 400,
  // padding: theme.spacing(12),
  // borderRadius: theme.shape.borderRadius,
  // border: `1px solid ${theme.palette.divider}`
}))
const ProjectCreate = () => {
  const auth = useAuth()
  const dispatch = useDispatch()
  const router = useRouter()
  const { organizationId } = router.query

  const token = window.localStorage.getItem(localStorageConstants.accessTokenKey)

  const [autoTraining, setAutoTraining] = useState(true)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)

  const handleNameChange = event => setName(event.target.value)
  const handleDescriptionChange = event => setDescription(event.target.value)
  const handleAutoTrainingChange = event => setAutoTraining(event.target.checked)

  const handleSubmit = async e => {
    e.preventDefault()

    setLoading(true)
    const newProjectPayload = {
      organizationId,
      name,
      description,
      autoTraining
    }

    try {
      const response = await projectService.createProject(organizationId, newProjectPayload, token)
      toast.success('Project created successfully')
      await auth.loadUserProfileFromAuthState(auth.oidcAuthState)
      router.push(`/gendox/home/?organizationId=${organizationId}&projectId=${response.data.id}`)
    } catch (error) {
      toast.error(`Project did not create. Error: ${getErrorMessage(error)}`)
      console.error('Failed to update project', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader title='Create New Project' />
      <Divider sx={{ m: '0' }} />
      <Form onSubmit={handleSubmit}>
        <CardContent>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <TextField required id='project-name' label='Name' value={name} onChange={handleNameChange} fullWidth />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControlLabel
                label='Auto-Training'
                control={<Checkbox checked={autoTraining} onChange={handleAutoTrainingChange} name='autoTraining' />}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                multiline
                rows={4}
                label='Description'
                id='project-description'
                value={description}
                onChange={handleDescriptionChange}
                fullWidth
              />
            </Grid>
          </Grid>
        </CardContent>
        <CardActions>
          {loading ? (
            <CircularProgress size={24} />
          ) : (
            <>
              <Button size='large' type='submit' sx={{ mr: 2 }} variant='contained'>
                Submit
              </Button>
              <Button size='large' type='reset' color='secondary' variant='outlined'>
                Reset
              </Button>
            </>
          )}
        </CardActions>
      </Form>
    </Card>
  )
}

export default ProjectCreate
