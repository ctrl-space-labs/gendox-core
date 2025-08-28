import { useState, useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
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
import Autocomplete from '@mui/material/Autocomplete'
import Link from 'next/link'
import Icon from 'src/views/custom-components/mui/icon/icon'
import Select from '@mui/material/Select'
import InputAdornment from '@mui/material/InputAdornment'
import FormControlLabel from '@mui/material/FormControlLabel'
import Checkbox from '@mui/material/Checkbox'
import toast from 'react-hot-toast'
import { useSelector, useDispatch } from 'react-redux'
import { sortModels } from 'src/utils/sortModels'
import { getErrorMessage } from 'src/utils/errorHandler'
import {ButtonBase, DialogActions, DialogTitle, Stack} from '@mui/material'
import Radio from '@mui/material/Radio'
import { localStorageConstants } from 'src/utils/generalConstants'
import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'
import {fetchAiModels, fetchExampleTools, updateProjectAgent} from 'src/store/activeProjectAgent/activeProjectAgent'
import { fetchProject } from 'src/store/activeProject/activeProject'
import commonConfig from 'src/configs/common.config.js'
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import Chip from "@mui/material/Chip";


const AiAgentProjectSettings = () => {
  const dispatch = useDispatch()
  const token = window.localStorage.getItem(localStorageConstants.accessTokenKey)
  const { provenAiEnabled, provenAiUrl } = commonConfig

  const { projectDetails: project, isBlurring: isUpdatingProject } = useSelector(state => state.activeProject)

  const { isFetchingAiModels, isUpdatingProjectAgent, aiModels, exampleTools, isFetchingExampleTools } = useSelector(state => state.activeProjectAgent)
  const { semanticModels, completionModels, moderationModels, rerankModels } = aiModels
  const isLoading = isUpdatingProjectAgent || isFetchingAiModels || isUpdatingProject || isFetchingExampleTools

  /* ----------  Add these state hooks (place near the other hooks, before the return)  ---------- */
  const [toolModalOpen, setToolModalOpen] = useState(false)                     // add / edit modal
  const [editingIndex, setEditingIndex] = useState(null)         // index of tool under edit
  const [toolSchema, setToolSchema] = useState('')                              // JSON string in modal textarea

  const { id: projectId, organizationId } = project

  console.log('AI Models', aiModels)

  const defaultValues = {
    semanticSearchModel: project.projectAgent.semanticSearchModel?.name || '',
    completionModel: project.projectAgent.completionModel?.name || '',
    moderationModel: project.projectAgent.moderationModel?.name || '',
    rerankModel: project.projectAgent.rerankModel?.name || '',
    advancedSearchModel: project.projectAgent.advancedSearchModel?.name || '',
    moderationCheck: project.projectAgent.moderationCheck,
    rerankEnable: project.projectAgent.rerankEnable,
    advancedSearchEnable: project.projectAgent.advancedSearchEnable,
    documentSplitterType: project.projectAgent.documentSplitterType?.name || '',
    maxToken: project.projectAgent.maxToken,
    temperature: project.projectAgent.temperature,
    maxSearchLimit: project.projectAgent.maxSearchLimit,
    maxCompletionLimit: project.projectAgent.maxCompletionLimit,
    topP: project.projectAgent.topP,
    agentBehavior: project.projectAgent.agentBehavior,
    aiTools: project.projectAgent.aiTools,
    selected: project.projectAgent.privateAgent ? 'private' : 'public'
  }

  const {
    control,
    register,
    handleSubmit,
    watch,
    setValue,
    getValues,
    formState: { errors }
  } = useForm({ defaultValues })

  const aiTools = watch('aiTools');

  const handleAddTool = () => {
    setEditingIndex(null)
    setToolSchema('')
    setToolModalOpen(true)
  }

  const handleEditTool = (idx) => {
    setEditingIndex(idx)
    setToolSchema(JSON.stringify(JSON.parse(aiTools[idx].jsonSchema), null, 2))
    setToolModalOpen(true)
  }


  const handleDeleteTool = idx => {
    setValue('aiTools', aiTools.filter((_, i) => i !== idx))
  }

  const handleCloseToolModal = () => setToolModalOpen(false)

  const handleSaveTool = () => {
    try {
      const parsed = JSON.parse(toolSchema)
      const toolSchemaStr = JSON.stringify(parsed, null, 2)
      let updatedTools;
      const newTool = {
        type: "function",
        jsonSchema: toolSchemaStr,
      };

      if (editingIndex === null) {
        updatedTools = [...aiTools, newTool];
      } else {
        // Update an existing tool with fields of the 'new tool', the id will remain the same if exists
        updatedTools = aiTools.map((tool, index) =>
          index === editingIndex ? { ...tool, ...newTool } : tool
        );
      }

      setValue('aiTools', updatedTools)
      setToolModalOpen(false)
    } catch (err) {
      toast.error('Invalid JSON')
    }
  }

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

  // Synchronize models with available options
  useEffect(() => {
    if (semanticModels.length > 0) {
      const current = watch('semanticSearchModel')
      const exists = semanticModels.some(model => model.name === current)
      if (!exists) {
        setValue('semanticSearchModel', semanticModels[0].name)
      }
    }
  }, [semanticModels, watch('semanticSearchModel'), setValue])

  useEffect(() => {
    if (completionModels.length > 0) {
      const current = watch('completionModel')
      const exists = completionModels.some(model => model.name === current)
      if (!exists) {
        setValue('completionModel', completionModels[0].name)
      }
    }
  }, [completionModels, watch('completionModel'), setValue])

  useEffect(() => {
    if (moderationModels.length > 0) {
      const current = watch('moderationModel')
      const exists = moderationModels.some(model => model.name === current)
      if (!exists) {
        setValue('moderationModel', moderationModels[0].name)
      }
    }
  }, [moderationModels, watch('moderationModel'), setValue])

  useEffect(() => {
    if (rerankModels.length > 0) {
      const current = watch('rerankModel')
      const exists = rerankModels.some(model => model.name === current)
      if (!exists) {
        setValue('rerankModel', rerankModels[0].name)
      }
    }
  }, [rerankModels, watch('rerankModel'), setValue])

  // Fetch AI models on mount
  useEffect(() => {
    if (organizationId && projectId && token) {
      dispatch(fetchAiModels({ organizationId, projectId, token }))
    }
    if (token) {
      dispatch(fetchExampleTools({ token }))
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
        moderationModel: { name: data.moderationModel },
        rerankModel: { name: data.rerankModel },
        advancedSearchModel: { name: data.advancedSearchModel },
        privateAgent: data.selected === 'private',
        maxToken: data.maxToken,
        temperature: data.temperature,
        topP: data.topP,
        maxSearchLimit: data.maxSearchLimit,
        maxCompletionLimit: data.maxCompletionLimit,
        agentBehavior: data.agentBehavior,
        moderationCheck: data.moderationCheck,
        advancedSearchEnable: data.advancedSearchEnable,
        rerankEnable: data.rerankEnable,
        aiTools: data.aiTools
      }
    }
    dispatch(updateProjectAgent({ organizationId, projectId, payload: updatedProjectPayload, token }))
      .unwrap()
      .then(() => {
        toast.success('Project updated successfully!')
        dispatch(fetchProject({ organizationId, projectId, token }))
      })
      .catch(error => {
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
                    <InputLabel id='search-model'></InputLabel>
                    <Controller
                      name='semanticSearchModel'
                      control={control}
                      render={({ field }) => (
                        <Autocomplete
                          {...field}
                          options={sortModels(semanticModels)}
                          getOptionLabel={option => option.name} // Label for autocomplete
                          onChange={(_, value) => setValue('semanticSearchModel', value?.name)} // Update form state
                          value={semanticModels.find(model => model.name === watch('semanticSearchModel')) || null} // Set selected value
                          disableClearable
                          renderInput={params => <TextField {...params} label='Semantic Search Model' />}
                          renderOption={(props, option) => (
                            <Box {...props} sx={{ display: 'flex', flexDirection: 'column' }}>
                              <Typography variant='body1'>{option.name}</Typography>
                              <Typography variant='body2' sx={{ fontStyle: 'italic', color: 'gray' }}>
                                {option.aiModelProvider?.name + '   '}
                                {option.modelTierType?.name === 'FREE_MODEL' && (
                                  <Box
                                    component='span'
                                    sx={{
                                      ml: 1,
                                      px: 1.5,
                                      py: 0.3,
                                      backgroundColor: '#e0f2f1',
                                      color: '#00695c',
                                      fontWeight: 600,
                                      fontSize: '0.75rem',
                                      borderRadius: '6px'
                                    }}
                                  >
                                    Free
                                  </Box>
                                )}
                              </Typography>
                            </Box>
                          )}
                        />
                      )}
                    />
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel id='completion-model'></InputLabel>
                    <Controller
                      name='completionModel'
                      control={control}
                      render={({ field }) => (
                        <Autocomplete
                          {...field}
                          options={sortModels(completionModels)}
                          getOptionLabel={option => option.name} // Label for autocomplete
                          onChange={(_, value) => setValue('completionModel', value?.name)} // Update form state
                          value={completionModels.find(model => model.name === watch('completionModel')) || null} // Set selected value
                          disableClearable
                          renderInput={params => <TextField {...params} label='Completion Model' />}
                          renderOption={(props, option) => (
                            <Box {...props} sx={{ display: 'flex', flexDirection: 'column' }}>
                              <Typography variant='body1'>{option.name}</Typography>
                              <Typography variant='body2' sx={{ fontStyle: 'italic', color: 'gray' }}>
                                {option.aiModelProvider?.name + '   '}
                                {option.modelTierType?.name === 'FREE_MODEL' && (
                                  <Box
                                    component='span'
                                    sx={{
                                      ml: 1,
                                      px: 1.5,
                                      py: 0.3,
                                      backgroundColor: '#e0f2f1',
                                      color: '#00695c',
                                      fontWeight: 600,
                                      fontSize: '0.75rem',
                                      borderRadius: '6px'
                                    }}
                                  >
                                    Free
                                  </Box>
                                )}
                              </Typography>
                            </Box>
                          )}
                        />
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
                <Grid item xs={12} sx={{ mb: 2 }}>
                  <Typography variant='body2'>
                    Basic and Pro models require an API key for their
                    providers.{' '}
                    <Link
                      href={`/gendox/organization-settings/?organizationId=${organizationId}&tab=advancedSettings`}
                      style={{ color: '#1976d2', textDecoration: 'underline', fontWeight: 500 }}
                    >
                      Go to Advanced Settings
                    </Link>
                  </Typography>
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
                    {/* Moderation Check */}
                    <Grid item xs={12} sm={6} sx={{ mb: 2 }}>
                      <FormControlLabel
                        label='Moderation Check'
                        control={<Checkbox {...register('moderationCheck')} checked={watch('moderationCheck')} />}
                      />
                    </Grid>

                    <Grid item xs={12} sm={6} sx={{ mb: 2 }}>
                      {watch('moderationCheck') && (
                        <FormControl fullWidth>
                          <InputLabel id='moderation-model-label'></InputLabel>
                          <Controller
                            name='moderationModel'
                            control={control}
                            render={({ field }) => (
                              <Autocomplete
                                {...field}
                                options={sortModels(moderationModels)}
                                getOptionLabel={option => option.name} // Label for autocomplete
                                onChange={(_, value) => setValue('moderationModel', value?.name)} // Update form state
                                value={moderationModels.find(model => model.name === watch('moderationModel')) || null} // Set selected value
                                disableClearable
                                renderInput={params => <TextField {...params} label='Moderation Model' />}
                                renderOption={(props, option) => (
                                  <Box {...props} sx={{ display: 'flex', flexDirection: 'column' }}>
                                    <Typography variant='body1'>{option.name}</Typography>
                                    <Typography variant='body2' sx={{ fontStyle: 'italic', color: 'gray' }}>
                                      {option.aiModelProvider?.name + '   '}
                                      {option.modelTierType?.name === 'FREE_MODEL' && (
                                        <Box
                                          component='span'
                                          sx={{
                                            ml: 1,
                                            px: 1.5,
                                            py: 0.3,
                                            backgroundColor: '#e0f2f1',
                                            color: '#00695c',
                                            fontWeight: 600,
                                            fontSize: '0.75rem',
                                            borderRadius: '6px'
                                          }}
                                        >
                                          Free
                                        </Box>
                                      )}
                                    </Typography>
                                  </Box>
                                )}
                              />
                            )}
                          />
                        </FormControl>
                      )}
                    </Grid>

                    {/* Advanced Search */}
                    <Grid item xs={12} sm={6} sx={{ mb: 2 }}>
                      <FormControlLabel
                        label="Advanced Search"
                        control={
                          <Checkbox
                            {...register('advancedSearchEnable')}
                            checked={watch('advancedSearchEnable')}
                          />
                        }
                      />
                    </Grid>

                    <Grid item xs={12} sm={6} sx={{ mb: 2 }}>
                      {watch('advancedSearchEnable') && (
                        <FormControl fullWidth>
                          <InputLabel id="advanced-search-model-label" />
                          <Controller
                            name="advancedSearchModel"
                            control={control}
                            render={({ field }) => (
                              <Autocomplete
                                {...field}
                                options={sortModels(completionModels)}
                                getOptionLabel={option => option.name}
                                onChange={(_, value) =>
                                  setValue('advancedSearchModel', value?.name)
                              }
                                value={
                                completionModels.find(
                                  model => model.name === watch('advancedSearchModel')
                                ) || null
                              }
                                disableClearable
                                renderInput={params => (
                                  <TextField
                                    {...params}
                                    label="Advanced Search Model"
                                    id="advanced-search-model-label"
                                  />
                                )}
                                renderOption={(props, option) => (
                                  <Box
                                    {...props}
                                    sx={{ display: 'flex', flexDirection: 'column' }}
                                  >
                                    <Typography variant="body1">{option.name}</Typography>
                                    <Typography
                                      variant="body2"
                                      sx={{ fontStyle: 'italic', color: 'gray' }}
                                    >
                                      {option.aiModelProvider?.name}{' '}
                                      {option.modelTierType?.name === 'FREE_MODEL' && (
                                        <Box
                                          component="span"
                                          sx={{
                                            ml: 1,
                                            px: 1.5,
                                            py: 0.3,
                                            backgroundColor: '#e0f2f1',
                                            color: '#00695c',
                                            fontWeight: 600,
                                            fontSize: '0.75rem',
                                            borderRadius: '6px',
                                          }}
                                        >
                                          Free
                                        </Box>
                                      )}
                                    </Typography>
                                  </Box>
                                )}
                              />
                            )}
                          />
                        </FormControl>
                      )}
                    </Grid>



                    {/* Rerank Search Results */}
                    <Grid item xs={12} sm={6} sx={{ mb: 2 }}>
                      <FormControlLabel
                        label='Rerank Search Results'
                        control={<Checkbox {...register('rerankEnable')} checked={watch('rerankEnable')} />}
                      />
                    </Grid>
                    {watch('rerankEnable') && (
                      <Grid item xs={12} sm={6} sx={{ mb: 2 }}>
                        <FormControl fullWidth>
                          <InputLabel id='rerank-model-label'></InputLabel>
                          <Controller
                            name='rerankModel'
                            control={control}
                            render={({ field }) => (
                              <Autocomplete
                                {...field}
                                options={sortModels(rerankModels)}
                                getOptionLabel={option => option.name} // Label for autocomplete
                                onChange={(_, value) => setValue('rerankModel', value?.name)} // Update form state
                                value={rerankModels.find(model => model.name === watch('rerankModel')) || null} // Set selected value
                                disableClearable
                                renderInput={params => <TextField {...params} label='Rerank Model' />}
                                renderOption={(props, option) => (
                                  <Box {...props} sx={{ display: 'flex', flexDirection: 'column' }}>
                                    <Typography variant='body1'>{option.name}</Typography>
                                    <Typography variant='body2' sx={{ fontStyle: 'italic', color: 'gray' }}>
                                      {option.aiModelProvider?.name + '   '}
                                      {option.modelTierType?.name === 'FREE_MODEL' && (
                                        <Box
                                          component='span'
                                          sx={{
                                            ml: 1,
                                            px: 1.5,
                                            py: 0.3,
                                            backgroundColor: '#e0f2f1',
                                            color: '#00695c',
                                            fontWeight: 600,
                                            fontSize: '0.75rem',
                                            borderRadius: '6px'
                                          }}
                                        >
                                          Free
                                        </Box>
                                      )}
                                    </Typography>
                                  </Box>
                                )}
                              />
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

                {/* 3. Tools */}
                <>
                  <Grid item xs={12}>
                    <Divider sx={{ mt: 5, mb: '0 !important' }} />
                  </Grid>

                  {/* header + description */}
                  <Grid item xs={12} sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
                    <Typography variant='body2' sx={{ fontWeight: 600, color: 'primary.main', mr: 1 }}>
                      3. Tools
                    </Typography>
                    <Tooltip title='Tools are described by a JSON schema. You can start from one of the examples below or write your own.'>
                      <IconButton color='primary' size='small'>
                        <Icon icon='mdi:information-outline' />
                      </IconButton>
                    </Tooltip>
                  </Grid>

                  {/* list of existing tools */}
                  <Grid item xs={12}>
                    <Stack direction='row' spacing={2} flexWrap='wrap'>
                      {aiTools.map((tool, idx) => {
                        console.log(`Tool #${idx + 1} :`, tool);
                        const toolSchemaObj = JSON.parse(tool.jsonSchema)
                        return (

                          <Tooltip
                            key={idx}
                            title={toolSchemaObj.description}
                            arrow
                            placement='top'
                            componentsProps={{
                              tooltip: {
                                sx: {whiteSpace: 'pre-line', maxWidth: 300}
                              }
                            }}
                          >
                            <Chip
                              variant='filled'
                              clickable
                              onClick={() => handleEditTool(idx)}
                              onDelete={() => handleDeleteTool(idx)}
                              deleteIcon={<Icon icon='mdi:close'/>}
                              icon={<Icon icon='mdi:curly-braces'/>}
                              label={toolSchemaObj.name}
                              sx={{mb: 1}}
                            />
                          </Tooltip>
                        )
                        }
                      )}

                    </Stack>
                  </Grid>
                  {/* add tool button */}
                  <Grid item xs={12}>
                    <Button variant='outlined' startIcon={<Icon icon='mdi:plus' />} onClick={handleAddTool}>
                      Add Tool
                    </Button>
                  </Grid>

                  {/* add / edit modal (merged with examples) */}
                  <Dialog
                    open={toolModalOpen}
                    onClose={handleCloseToolModal}
                    maxWidth="md"
                    fullWidth
                    PaperProps={{
                      sx: {overflowX: 'hidden'}
                    }}
                    scroll="paper"                           // vertical scroll only, no x-bar
                  >
                    {/* ----------  title + close button  ---------- */}
                    <DialogTitle sx={{ pr: 8 /* leave room for the X */ }}>
                      {editingIndex === null ? 'Add Tool' : 'Edit Tool'}

                      <IconButton
                        onClick={handleCloseToolModal}
                        sx={{ position: 'absolute', right: 16, top: 16 }}
                      >
                        <Icon icon="mdi:close" />
                      </IconButton>
                    </DialogTitle>

                    {/* ----------  content  ---------- */}
                    <DialogContent
                      dividers
                      sx={{ overflowX: 'hidden', pt: 2, pb: 4, px: 6 }}
                    >
                      {/* helper blurb */}
                      <Typography
                        variant="body2"
                        sx={{ mb: 3 }}
                      >
                        Tools are described using a&nbsp;JSON schema. You can start with an
                        example or paste your own definition below.
                      </Typography>

                      {/* minimal “Examples” dropdown */}
                      <FormControl
                        variant="standard"
                        sx={{ mb: 3, minWidth: 120 }}
                      >
                        <Select
                          value=""                             // always shows placeholder
                          displayEmpty
                          renderValue={() => 'Examples'}       // label on the chip
                          onChange={e => {
                            const val = e.target.value
                            const ex = exampleTools.find(t => t.name === val)
                            if (ex) setToolSchema(ex.description)
                            // reset immediately so the placeholder re-appears
                            e.target.value = ''
                          }}
                        >
                          {exampleTools.map(ex => (
                            <MenuItem key={ex.name} value={ex.name}>
                              {ex.name}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>

                      {/* JSON editor */}
                      <TextField
                        fullWidth
                        multiline
                        minRows={20}
                        value={toolSchema}
                        placeholder={exampleTools[0]?.description ?? 'Paste or write the JSON Schema of the tool…'}
                        onChange={e => setToolSchema(e.target.value)}
                        InputProps={{
                          sx: {
                            fontFamily: 'Source Code Pro, monospace',
                            whiteSpace: 'pre',
                            fontSize: 14
                          }
                        }}
                      />
                    </DialogContent>

                    {/* ----------  actions  ---------- */}
                    <DialogActions sx={{ px: 6, py: 3, mt: 4 }}>
                      <Button onClick={handleCloseToolModal}>Cancel</Button>
                      <Button variant="contained" onClick={handleSaveTool}>
                        {editingIndex === null ? 'Add' : 'Update'}
                      </Button>
                    </DialogActions>
                  </Dialog>
                </>

                {/* 4. Access */}
                <>
                  <Grid item xs={12}>
                    <Divider sx={{ mt: 5, mb: '0 !important' }} />
                  </Grid>
                  <Grid item xs={12} sx={{ display: 'flex', alignItems: 'center' }}>
                    <Typography variant='body2' sx={{ fontWeight: 600, color: 'primary.main' }}>
                      4. Access
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
                        href={`${provenAiUrl}/provenAI/agent-control/?organizationId=${organizationId}&agentId=${project.projectAgent.id}`}
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
                </>
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
