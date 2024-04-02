// ** React Imports
import { useState } from 'react'

// ** MUI Imports
import Card from '@mui/material/Card'
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
import Select from '@mui/material/Select'
import InputAdornment from '@mui/material/InputAdornment'
import FormControlLabel from '@mui/material/FormControlLabel'
import Checkbox from '@mui/material/Checkbox'

// ** Demo Components Imports
import CustomRadioIcons from 'src/@core/components/custom-radio/icons'

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

const AgentPrivateIcons = [
  { icon: 'mdi:lock-open', iconProps: { fontSize: '2rem', style: { marginBottom: 8 } } },
  { icon: 'mdi:lock', iconProps: { fontSize: '2rem', style: { marginBottom: 8 } } }
]

const AiAgentProjectSettings = ({ project }) => {
  // AgentPrivate
  let initialSelected
  if (project.projectAgent.privateAgent === true) {
    initialSelected = 'private'
  } else if (project.projectAgent.privateAgent === false) {
    initialSelected = 'public'
  } else {
    initialSelected = '' // This could be privateAgent == null
  }

  // ** State
  const [selected, setSelected] = useState(initialSelected)

  const handleAccessChange = prop => {
    if (typeof prop === 'string') {
      setSelected(prop)
    } else {
      setSelected(prop.target.value)
    }
  }

  const handleSubmit = async e => {
    e.preventDefault() // Prevent default form submission

    // Construct the JSON project
    const updatedProjectPayload = {
      id: projectId,
      organizationId,
      description,
      autoTraining,
      projectAgent: project.projectAgent,
    }

    console.log("json------->", updatedProjectPayload)

    try {
      const response = await axios.put(apiRequests.updateProject(organizationId, projectId),updatedProjectPayload, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setOpenSnackbar(true)
      console.log('Update successful', response)
    } catch (error) {
      console.error('Failed to update project', error)
    }
  }

  return (
    <Card>
      <CardHeader title='Project s Agent settings' />
      <Divider sx={{ m: '0 !important' }} />
      <form onSubmit={handleSubmit}>
        <CardContent>
          <Grid container spacing={5}>
            {/*******************   1 AI Model ******************/}
            <Grid item xs={12}>
              <Typography variant='body2' sx={{ fontWeight: 600 }}>
                1. AI Model
              </Typography>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField fullWidth label='Agent Name' value={project.projectAgent.agentName} placeholder='Leonard' />
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel id='semantic-search-model'>Semantic Search Model</InputLabel>
                <Select
                  label='semantic-search-model'
                  value={project.projectAgent.semanticSearchModel.name}
                  id='semantic-search-model'
                  labelId='semantic-search-model'
                >
                  <MenuItem value='Ada2'>Ada 2</MenuItem>
                  <MenuItem value='COHERE_EMBED_MULTILINGUAL_V3.0'>Cohere embed multilingual V3.0</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel id='completion-model'>Completion Model</InputLabel>
                <Select
                  label='completion-model'
                  value={project.projectAgent.completionModel.name}
                  id='completion-model'
                  labelId='completion-model'
                >
                  <MenuItem value='GPT_3.5_TURBO'>GPT 3.5 TURBO</MenuItem>
                  <MenuItem value='GPT_4'>GPT 4</MenuItem>
                  <MenuItem value='COHERE_COMMAND'>Cohere Command</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel id='document-splitter-type'>Document Splitter </InputLabel>
                <Select
                  label='document-splitter-type'
                  value={project.projectAgent.documentSplitterType.name}
                  id='document-splitter-type'
                  labelId='document-splitter-type'
                >
                  <MenuItem value='STATIC_WORD_COUNT_SPLITTER'>Static word count splitter</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/*******************   2 Agent's Personality ******************/}
            <Grid item xs={12}>
              <Divider sx={{ mb: '0 !important' }} />
            </Grid>
            <Grid item xs={12}>
              <Typography variant='body2' sx={{ fontWeight: 600 }}>
                2. Agent's Personality
              </Typography>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                id='max-tokens'
                label='Max Tokens'
                defaultValue={project.projectAgent.maxToken}
                InputProps={{
                  startAdornment: <InputAdornment position='start'>Tokens</InputAdornment>
                }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                id='temperature'
                label='Temperature'
                defaultValue={project.projectAgent.temperature}
                InputProps={{
                  startAdornment: <InputAdornment position='start'>temps</InputAdornment>
                }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                id='top-p'
                label='Top p'
                defaultValue={project.projectAgent.topP}
                InputProps={{
                  startAdornment: <InputAdornment position='start'>top P's</InputAdornment>
                }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                rows={4}
                multiline
                label='Agent Behavior'
                id='agent-behavior'
                defaultValue={project.projectAgent.agentBehavior}
              />
            </Grid>

            <Grid item xs={12} sm={6} sx={{ mb: 15 }}>
              <FormControlLabel label='moderation-check' control={<Checkbox defaultChecked name='basic-checked' />} />
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel id='moderation'>Moderation</InputLabel>
                <Select label='moderation' value='openAI Moderation' id='moderation' labelId='moderation'>
                  <MenuItem value='openAI Moderation'>openAI Moderation</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/*******************   3 Access ******************/}
            <Grid item xs={12}>
              <Divider sx={{ mb: '0 !important' }} />
            </Grid>

            <Grid item xs={12}>
              <Typography variant='body2' sx={{ fontWeight: 600 }}>
                3. Access
              </Typography>
            </Grid>

            <Grid container spacing={4} item xs={12} sm={6}>
              {AgentPrivate.map((item, index) => (
                <CustomRadioIcons
                  key={index}
                  data={AgentPrivate[index]}
                  selected={selected}
                  icon={AgentPrivateIcons[index].icon}
                  name='custom-radios-icons'
                  handleChange={handleAccessChange}
                  gridProps={{ sm: 4, xs: 12 }}
                  iconProps={AgentPrivateIcons[index].iconProps}
                />
              ))}
            </Grid>
          </Grid>
        </CardContent>

        <Divider sx={{ m: '0 !important' }} />
        <CardActions>
          <Button size='large' type='submit' sx={{ mr: 2 }} onClick={handleSubmit} variant='contained'>
            Submit
          </Button>
          <Button type='reset' size='large' color='secondary' variant='outlined'>
            Reset
          </Button>
        </CardActions>
      </form>
    </Card>
  )
}

export default AiAgentProjectSettings
