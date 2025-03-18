import { useState, useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { useSettings } from 'src/@core/hooks/useSettings'
import Card from '@mui/material/Card'
import Box from '@mui/material/Box'
import Grid from '@mui/material/Grid'
import Button from '@mui/material/Button'
import Divider from '@mui/material/Divider'
import MenuItem from '@mui/material/MenuItem'
import TextField from '@mui/material/TextField'
import CardHeader from '@mui/material/CardHeader'
import InputLabel from '@mui/material/InputLabel'
import Typography from '@mui/material/Typography'
import CardContent from '@mui/material/CardContent'
import CardActions from '@mui/material/CardActions'
import FormControl from '@mui/material/FormControl'
import Icon from 'src/views/custom-components/mui/icon/icon'
import Select from '@mui/material/Select'
import InputAdornment from '@mui/material/InputAdornment'
import FormControlLabel from '@mui/material/FormControlLabel'
import Checkbox from '@mui/material/Checkbox'
import toast from 'react-hot-toast'
import { useSelector, useDispatch } from 'react-redux'
import { getErrorMessage } from 'src/utils/errorHandler'
import { ButtonBase } from '@mui/material'
import Radio from '@mui/material/Radio'
import { localStorageConstants } from 'src/utils/generalConstants'
import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'
import { fetchAiModels, updateProjectAgent } from 'src/store/activeProjectAgent/activeProjectAgent'
import { fetchProject } from 'src/store/activeProject/activeProject'
import commonConfig from 'src/configs/common.config.js'

const AiAgentProjectSettings = () => {
  const { settings } = useSettings()
  const dispatch = useDispatch()
  const token = window.localStorage.getItem(localStorageConstants.accessTokenKey)
  const provenAiEnabled = settings.provenAiEnabled

  const { projectDetails: project, isBlurring: isUpdatingProject } = useSelector(state => state.activeProject)

  const { isFetchingAiModels, isUpdatingProjectAgent, aiModels } = useSelector(state => state.activeProjectAgent)
  const { semanticModels, completionModels, moderationModels } = aiModels
  const isLoading = isUpdatingProjectAgent || isFetchingAiModels || isUpdatingProject

  const { id: projectId, organizationId } = project

  const defaultValues = {
    semanticSearchModel: project.projectAgent.semanticSearchModel?.name || '',
    completionModel: project.projectAgent.completionModel?.name || '',
    moderationModel: project.projectAgent.moderation ? project.projectAgent.moderation.name : 'OPENAI_MODERATION',
    documentSplitterType: project.projectAgent.documentSplitterType?.name || '',
    maxToken: project.projectAgent.maxToken,
    temperature: project.projectAgent.temperature,
    maxSearchLimit: project.projectAgent.maxSearchLimit,
    maxCompletionLimit: project.projectAgent.maxCompletionLimit,
    topP: project.projectAgent.topP,
    agentBehavior: project.projectAgent.agentBehavior,
    moderationCheck: project.projectAgent.moderationCheck,
    selected: project.projectAgent.privateAgent ? 'private' : 'public'
  }

  const {
    control,
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors }
  } = useForm({ defaultValues })

  const AgentPrivate = [
    {
      value: 'public',
      title: 'Public',
      isSelected: true,
      content: 'Anyone can use'
    },
    {
      value: 'private',
      title: 'Private',
      content: 'Only within team'
    }
  ]

  // Synchronize semanticSearchModel with available options
  useEffect(() => {
    if (semanticModels.length > 0) {
      const current = watch('semanticSearchModel')
      const exists = semanticModels.some(model => model.name === current)
      if (!exists) {
        setValue('semanticSearchModel', semanticModels[0].name)
      }
    }
  }, [semanticModels, watch('semanticSearchModel'), setValue])

  // Synchronize completionModel with available options
  useEffect(() => {
    if (completionModels.length > 0) {
      const current = watch('completionModel')
      const exists = completionModels.some(model => model.name === current)
      if (!exists) {
        setValue('completionModel', completionModels[0].name)
      }
    }
  }, [completionModels, watch('completionModel'), setValue])

  // Synchronize moderationModel with available options
  useEffect(() => {
    if (moderationModels.length > 0) {
      const current = watch('moderationModel')
      const exists = moderationModels.some(model => model.name === current)
      if (!exists) {
        setValue('moderationModel', moderationModels[0].name)
      }
    }
  }, [moderationModels, watch('moderationModel'), setValue])

  // Fetch AI models on mount
  useEffect(() => {
    if (organizationId && projectId && token) {
      dispatch(fetchAiModels({ organizationId, projectId, token }))
    }
  }, [organizationId, projectId, token, dispatch])

  // onSubmit callback for the form
  const onSubmit = data => {
    const updatedProjectPayload = {
      ...project,
      projectAgent: {
        ...project.projectAgent,
        semanticSearchModel: { name: data.semanticSearchModel },
        completionModel: { name: data.completionModel },
        moderation: { name: data.moderationModel },
        privateAgent: data.selected === 'private',
        maxToken: data.maxToken,
        temperature: data.temperature,
        topP: data.topP,
        maxSearchLimit: data.maxSearchLimit,
        maxCompletionLimit: data.maxCompletionLimit,
        agentBehavior: data.agentBehavior,
        moderationCheck: data.moderationCheck
      }
    }
    dispatch(updateProjectAgent({ organizationId, projectId, payload: updatedProjectPayload, token }))
      .unwrap()
      .then(() => {
        toast.success('Project updated successfully!')
        dispatch(fetchProject({ organizationId, projectId, token }))
      })
      .catch(error => {
        toast.error(`Failed to update project. Error: ${getErrorMessage(error)}`)
        console.error('Failed to update project', error)
      })
  }

  return (
    <Card>
      <CardHeader />
      <Box sx={{ position: 'relative' }}>
        <Box sx={{ filter: isLoading ? 'blur(3px)' : 'none', transition: 'filter 0.3s ease' }}>
          <form onSubmit={handleSubmit(onSubmit)}>
            <CardContent>
              <Grid container spacing={5}>
                {/* 1. AI Model Section */}
                <Grid item xs={12} sx={{ display: 'flex', alignItems: 'center' }}>
                  <Typography variant='body2' sx={{ fontWeight: 600, color: 'primary.main' }}>
                    1. AI Model
                  </Typography>
                  <Tooltip title='Give name to the Agent and decide what models you want to use. Advanced models are available only if you set your API key (e.g. for OpenAI)'>
                    <IconButton color='primary' sx={{ ml: 1 }}>
                      <Icon icon='mdi:information-outline' />
                    </IconButton>
                  </Tooltip>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label='Agent Name'
                    value={project.projectAgent.agentName}
                    placeholder='Leonard'
                    disabled
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel id='search-model'>Semantic Search Model</InputLabel>
                    <Controller
                      name='semanticSearchModel'
                      control={control}
                      render={({ field }) => (
                        <Select
                          {...field}
                          labelId='search-model'
                          label='Semantic Search Model'
                          disabled={semanticModels.length === 0}
                        >
                          {semanticModels.map(model => (
                            <MenuItem key={model.id} value={model.name}>
                              {model.name}
                            </MenuItem>
                          ))}
                        </Select>
                      )}
                    />
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel id='completion-model'>Completion Model</InputLabel>
                    <Controller
                      name='completionModel'
                      control={control}
                      render={({ field }) => (
                        <Select
                          {...field}
                          labelId='completion-model'
                          label='Completion Model'
                          disabled={completionModels.length === 0}
                        >
                          {completionModels.map(model => (
                            <MenuItem key={model.id} value={model.name}>
                              {model.name}
                            </MenuItem>
                          ))}
                        </Select>
                      )}
                    />
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel id='document-splitter-type'>Document Splitter</InputLabel>
                    <Controller
                      name='documentSplitterType'
                      control={control}
                      render={({ field }) => (
                        <Select {...field} labelId='document-splitter-type' label='Document Splitter'>
                          <MenuItem value='STATIC_WORD_COUNT_SPLITTER'>STATIC_WORD_COUNT_SPLITTER</MenuItem>
                        </Select>
                      )}
                    />
                  </FormControl>
                </Grid>
                {/* 2. Agent's Personality */}
                <Grid item xs={12}>
                  <Divider sx={{ mt: 5, mb: '0 !important' }} />
                </Grid>
                <Grid item xs={12} sx={{ display: 'flex', alignItems: 'center' }}>
                  <Typography variant='body2' sx={{ fontWeight: 600, color: 'primary.main' }}>
                    2. Agent's Personality
                  </Typography>
                  <Tooltip title="Configure the agent's personality settings. Adjust the parameters to fine-tune the agent's responses.">
                    <IconButton color='primary' sx={{ ml: 1 }}>
                      <Icon icon='mdi:information-outline' />
                    </IconButton>
                  </Tooltip>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Grid container spacing={4}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label='Max Tokens'
                        type='number'
                        {...register('maxToken', { valueAsNumber: true })}
                        InputProps={{
                          startAdornment: <InputAdornment position='start'>Tokens</InputAdornment>
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label='Temperature'
                        type='number'
                        {...register('temperature', { valueAsNumber: true })}
                        InputProps={{
                          startAdornment: <InputAdornment position='start'>temp:</InputAdornment>
                        }}
                        inputProps={{ max: 1, min: 0, step: 0.01 }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label='Top p'
                        type='number'
                        {...register('topP', { valueAsNumber: true })}
                        InputProps={{
                          startAdornment: <InputAdornment position='start'>top P</InputAdornment>
                        }}
                        inputProps={{ max: 1, min: 0, step: 0.01 }}
                      />
                    </Grid>

                    <Grid item xs={12} sm={6}></Grid>

                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label='Max Search Limit'
                        type='number'
                        {...register('maxSearchLimit', { valueAsNumber: true })}
                        InputProps={{
                          startAdornment: <InputAdornment position='start'>sections:</InputAdornment>
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label='Max Completion Limit'
                        type='number'
                        error={!!errors.maxCompletionLimit}
                        helperText={errors.maxCompletionLimit?.message}
                        {...register('maxCompletionLimit', {
                          valueAsNumber: true,
                          validate: value =>
                            value <= watch('maxSearchLimit') ||
                            'Max Completion Limit must be less than or equal to Max Search Limit'
                        })}
                        {...register('maxCompletionLimit', { valueAsNumber: true })}
                        InputProps={{
                          startAdornment: <InputAdornment position='start'>sections:</InputAdornment>
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6} sx={{ mb: 15 }}>
                      <FormControlLabel
                        label='Moderation Check'
                        control={<Checkbox {...register('moderationCheck')} />}
                      />
                    </Grid>
                    {watch('moderationCheck') && (
                      <Grid item xs={12} sm={6}>
                        <FormControl fullWidth>
                          <InputLabel id='moderation'>Moderation</InputLabel>
                          <Controller
                            name='moderationModel'
                            control={control}
                            render={({ field }) => (
                              <Select
                                {...field}
                                labelId='moderation'
                                label='Moderation'
                                disabled={moderationModels.length === 0}
                              >
                                {moderationModels.map(model => (
                                  <MenuItem key={model.id} value={model.name}>
                                    {model.name}
                                  </MenuItem>
                                ))}
                              </Select>
                            )}
                          />
                        </FormControl>
                      </Grid>
                    )}
                  </Grid>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth multiline rows={10} label='Agent Behavior' {...register('agentBehavior')} />
                </Grid>
                {/* 3. Access */}
                <Grid item xs={12}>
                  <Divider sx={{ mt: 5, mb: '0 !important' }} />
                </Grid>
                <Grid item xs={12} sx={{ display: 'flex', alignItems: 'center' }}>
                  <Typography variant='body2' sx={{ fontWeight: 600, color: 'primary.main' }}>
                    3. Access
                  </Typography>
                  <Tooltip title='With a public Agent you can use the API without any authentication, use with caution.'>
                    <IconButton color='primary' sx={{ ml: 1 }}>
                      <Icon icon='mdi:information-outline' />
                    </IconButton>
                  </Tooltip>
                </Grid>
                <Grid container spacing={4} item xs={12} sm={6}>
                  {AgentPrivate.map(item => (
                    <ButtonBase key={item.value} onClick={() => setValue('selected', item.value)}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mr: 2 }}>
                        <Radio checked={watch('selected') === item.value} value={item.value} />
                        <Box sx={{ ml: 1 }}>
                          <Typography variant='body1'>{item.title}</Typography>
                          <Typography variant='body2'>{item.content}</Typography>
                        </Box>
                      </Box>
                    </ButtonBase>
                  ))}
                </Grid>

                {provenAiEnabled && (
                <Grid item xs={12} sm={6} sx={{ display: 'flex', alignItems: 'flex-end' }}>
                  <Button
                    size='large'
                    variant='outlined'
                    href={`${commonConfig.provenAiUrl}/provenAI/agent-control/?organizationId=${organizationId}&agentId=${project.projectAgent.id}`}
                    target='_blank'
                    rel='noopener noreferrer'
                  >
                    <Box component='span' sx={{ mr: 5 }}>
                      Go to Proven-Ai
                    </Box>
                    <Icon icon='mdi:arrow-right-thin' />
                  </Button>
                </Grid>
                )}
              </Grid>
            </CardContent>
            <Divider sx={{ mt: 5, mb: '0 !important' }} />
            <CardActions sx={{ justifyContent: 'flex-end', py: '1.5rem' }}>
              <Button size='large' type='submit' variant='contained' sx={{ px: 22, py: 3 }}>
                Save Changes
              </Button>
            </CardActions>
          </form>
        </Box>
      </Box>
    </Card>
  )
}
export default AiAgentProjectSettings
