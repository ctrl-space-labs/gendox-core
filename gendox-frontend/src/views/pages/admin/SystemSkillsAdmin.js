import { useCallback, useEffect, useState } from 'react'
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import Divider from '@mui/material/Divider'
import IconButton from '@mui/material/IconButton'
import Stack from '@mui/material/Stack'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import CircularProgress from '@mui/material/CircularProgress'
import toast from 'react-hot-toast'
import Icon from 'src/views/custom-components/mui/icon/icon'
import SkillEditorDialog from 'src/views/custom-components/skills/SkillEditorDialog'
import skillService from 'src/gendox-sdk/skillService'
import { localStorageConstants } from 'src/utils/generalConstants'
import { getErrorMessage } from 'src/utils/errorHandler'
import { downloadSkill, NEW_SKILL_TEMPLATE } from 'src/utils/skillMarkdown'

/**
 * Gendox (system) skills, for super admins. Project admins add them to their agent from the library;
 * publishing a new version moves every agent that has the skill to it. gendox-assistant is not added
 * to agents: a chat from a Gendox page gets it from here. Skills shipped in the backend's
 * classpath:skills/ are created here on startup, and stop following their file once edited here.
 */
const SystemSkillsAdmin = () => {
  const token = window.localStorage.getItem(localStorageConstants.accessTokenKey)

  const [skills, setSkills] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editor, setEditor] = useState(null) // { skill | null, content }
  const [knownTools, setKnownTools] = useState(undefined)
  const [toDelete, setToDelete] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const response = await skillService.getSkillLibrary(token)
      setSkills(response.data)
    } catch (error) {
      toast.error(getErrorMessage(error))
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    load()
    skillService
      .getSkillTools(token)
      .then(response => setKnownTools(response.data.map(tool => tool.name)))
      .catch(() => setKnownTools(undefined))
  }, [load, token])

  const save = async content => {
    setSaving(true)
    try {
      if (editor.skill) {
        const response = await skillService.publishSkillVersion(editor.skill.name, content, token)
        toast.success(`${response.data.name} is now version ${response.data.version}`)
      } else {
        const response = await skillService.createSkill(content, token)
        toast.success(`${response.data.name} created`)
      }
      setEditor(null)
      load()
    } catch (error) {
      toast.error(getErrorMessage(error))
    } finally {
      setSaving(false)
    }
  }

  const confirmDelete = async () => {
    try {
      await skillService.deleteSkill(toDelete.name, token)
      toast.success(`${toDelete.name} removed from the library`)
      setToDelete(null)
      load()
    } catch (error) {
      toast.error(getErrorMessage(error))
    }
  }

  return (
    <Card>
      <CardHeader
        title='System skills'
        subheader='Gendox skills a project admin can add to their agent. gendox-assistant is given to every chat from a Gendox page, without adding it.'
        action={
          <Button
            variant='contained'
            startIcon={<Icon icon='mdi:plus' />}
            onClick={() => setEditor({ skill: null, content: NEW_SKILL_TEMPLATE })}
          >
            New skill
          </Button>
        }
      />
      <CardContent>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress size={28} />
          </Box>
        ) : skills.length === 0 ? (
          <Typography variant='body2' sx={{ color: 'text.secondary' }}>
            No system skills yet.
          </Typography>
        ) : (
          <Stack divider={<Divider flexItem />} sx={{ border: theme => `1px solid ${theme.palette.divider}`, borderRadius: 1 }}>
            {skills.map(skill => (
              <Box key={skill.id} sx={{ display: 'flex', alignItems: 'center', gap: 3, px: 4, py: 2.5 }}>
                <Icon icon='mdi:creation-outline' />
                <Box sx={{ minWidth: 0, flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                    <Typography variant='body1' sx={{ fontWeight: 600 }}>
                      {skill.name}
                    </Typography>
                    <Chip size='small' variant='outlined' label={`v${skill.version}`} />
                    {!skill.createdBy && (
                      <Tooltip title='Shipped with Gendox: updates to its file are published automatically until it is edited here.'>
                        <Chip size='small' variant='outlined' color='info' label='From file' />
                      </Tooltip>
                    )}
                  </Box>
                  <Typography variant='body2' noWrap sx={{ color: 'text.secondary' }}>
                    {skill.description}
                  </Typography>
                </Box>
                <Tooltip title='Publish a new version'>
                  <IconButton onClick={() => setEditor({ skill, content: skill.content })}>
                    <Icon icon='mdi:pencil-outline' />
                  </IconButton>
                </Tooltip>
                <Tooltip title='Download SKILL.md'>
                  <IconButton onClick={() => downloadSkill(skill)}>
                    <Icon icon='mdi:download-outline' />
                  </IconButton>
                </Tooltip>
                <Tooltip title='Remove from the library'>
                  <IconButton color='error' onClick={() => setToDelete(skill)}>
                    <Icon icon='mdi:delete-outline' />
                  </IconButton>
                </Tooltip>
              </Box>
            ))}
          </Stack>
        )}
      </CardContent>

      <SkillEditorDialog
        open={Boolean(editor)}
        title={editor?.skill ? `New version of ${editor.skill.name}` : 'New system skill'}
        subtitle={
          editor?.skill
            ? 'Every agent that has this skill moves to the new version. Agents that removed it do not get it back. The name cannot change.'
            : 'Project admins can add it to their agent from the Gendox skills library.'
        }
        initialContent={editor?.content}
        knownTools={knownTools}
        footerNote={editor?.skill ? `Publishes version ${editor.skill.version + 1}.` : 'Saved as version 1.'}
        saveLabel={editor?.skill ? 'Publish' : 'Create'}
        saving={saving}
        onClose={() => setEditor(null)}
        onSave={save}
      />

      <Dialog open={Boolean(toDelete)} onClose={() => setToDelete(null)}>
        <DialogTitle>Remove {toDelete?.name}?</DialogTitle>
        <DialogContent>
          <Typography variant='body2'>
            It leaves the Gendox skills library, so no agent can add it any more. Agents that have it keep their copy
            until a project admin removes it.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setToDelete(null)}>Cancel</Button>
          <Button color='error' variant='contained' onClick={confirmDelete}>
            Remove
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  )
}

export default SystemSkillsAdmin
