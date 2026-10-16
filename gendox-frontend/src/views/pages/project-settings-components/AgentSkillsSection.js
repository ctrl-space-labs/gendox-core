import { useMemo, useState } from 'react'
import Grid from '@mui/material/Grid'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import Divider from '@mui/material/Divider'
import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import Stack from '@mui/material/Stack'
import Icon from 'src/views/custom-components/mui/icon/icon'
import SkillEditorDialog from 'src/views/custom-components/skills/SkillEditorDialog'
import SkillLibraryDialog from 'src/views/custom-components/skills/SkillLibraryDialog'
import { downloadSkill, NEW_SKILL_TEMPLATE, parseSkill, renameSkill } from 'src/utils/skillMarkdown'

/**
 * The agent's skills, edited like its tools: changes are kept in the form and saved with the
 * agent. A Gendox skill is a read-only copy that Gendox keeps up to date; "Edit a copy" turns it
 * into a skill of your own.
 */
const AgentSkillsSection = ({ sectionNumber, skills, onChange, library, libraryLoading, onOpenLibrary, knownTools }) => {
  const [libraryOpen, setLibraryOpen] = useState(false)
  const [editor, setEditor] = useState(null) // { index | null, content, readOnly }

  const list = skills || []
  const addedNames = useMemo(() => new Set(list.map(skill => skill.name)), [list])
  const librarySkillsById = useMemo(() => new Map((library || []).map(skill => [skill.id, skill])), [library])

  const openLibrary = () => {
    onOpenLibrary?.()
    setLibraryOpen(true)
  }

  const addFromLibrary = skill => {
    // the server copies the content from the catalog; it's here only to show it before saving
    onChange([...list, { skillId: skill.id, name: skill.name, description: skill.description, content: skill.content }])
  }

  const saveFromEditor = (content, parsed) => {
    const edited = { name: parsed.name, description: parsed.description, content }
    if (editor.index === null) {
      onChange([...list, edited])
    } else {
      onChange(list.map((skill, i) => (i === editor.index ? { ...skill, ...edited } : skill)))
    }
    setEditor(null)
  }

  const editACopy = content => {
    const source = list[editor.index]
    const copyName = `${source.name}-custom`
    setEditor({ index: null, content: renameSkill(content, copyName), readOnly: false })
  }

  const remove = index => onChange(list.filter((_, i) => i !== index))

  return (
    <>
      <Grid item xs={12}>
        <Divider sx={{ mt: 5, mb: '0 !important' }} />
      </Grid>

      <Grid item xs={12} sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
        <Typography variant='body2' sx={{ fontWeight: 600, color: 'primary.main' }}>
          {sectionNumber}. Skills
        </Typography>
        <Tooltip title='Instructions the agent reads when a question needs them. Each skill is one SKILL.md file, the same format Claude Code and Codex use.'>
          <IconButton color='primary' size='small'>
            <Icon icon='mdi:information-outline' />
          </IconButton>
        </Tooltip>
      </Grid>

      <Grid item xs={12}>
        <Stack direction='row' spacing={2} useFlexGap flexWrap='wrap'>
          {list.map((skill, index) => {
            const fromGendox = Boolean(skill.skillId)
            const librarySkill = fromGendox ? librarySkillsById.get(skill.skillId) : null
            const tools = parseSkill(skill.content).tools
            const details = [
              fromGendox ? `Gendox skill${librarySkill ? ` v${librarySkill.version}` : ''}, read-only` : 'Your own skill',
              tools.length > 0 ? `Tools: ${tools.join(', ')}` : null,
              skill.id ? null : 'Not saved yet'
            ]
              .filter(Boolean)
              .join('\n')

            return (
              <Tooltip
                key={skill.id || `new-${index}`}
                title={`${skill.description}\n\n${details}`}
                arrow
                placement='top'
                componentsProps={{ tooltip: { sx: { whiteSpace: 'pre-line', maxWidth: 360 } } }}
              >
                <Chip
                  variant='filled'
                  clickable
                  onClick={() => setEditor({ index, content: skill.content, readOnly: fromGendox })}
                  onDelete={() => remove(index)}
                  deleteIcon={<Icon icon='mdi:close' />}
                  icon={<Icon icon={fromGendox ? 'mdi:creation-outline' : 'mdi:book-open-variant'} />}
                  label={skill.name}
                  size='small'
                />
              </Tooltip>
            )
          })}
        </Stack>
      </Grid>

      <Grid item xs={12}>
        <Stack direction='row' spacing={2} flexWrap='wrap'>
          <Button variant='outlined' startIcon={<Icon icon='mdi:creation-outline' />} onClick={openLibrary}>
            Gendox skills
          </Button>
          <Button variant='outlined' startIcon={<Icon icon='mdi:plus' />} onClick={() => setEditor({ index: null, content: NEW_SKILL_TEMPLATE, readOnly: false })}>
            New skill
          </Button>
        </Stack>
      </Grid>

      <SkillLibraryDialog
        open={libraryOpen}
        library={library || []}
        loading={libraryLoading}
        addedNames={addedNames}
        onAdd={addFromLibrary}
        onClose={() => setLibraryOpen(false)}
      />

      <SkillEditorDialog
        open={Boolean(editor)}
        title={
          editor?.readOnly
            ? list[editor.index]?.name
            : editor?.index === null || editor?.index === undefined
            ? 'New skill'
            : `Edit ${list[editor.index]?.name}`
        }
        subtitle={
          editor?.readOnly
            ? "From Gendox, kept up to date by Gendox. Edit a copy to change it; your copy stops following Gendox's updates."
            : null
        }
        initialContent={editor?.content}
        knownTools={knownTools}
        readOnly={editor?.readOnly}
        footerNote={editor?.readOnly ? null : 'Save the agent settings to apply it.'}
        saveLabel={editor?.index === null ? 'Add' : 'Update'}
        onClose={() => setEditor(null)}
        onSave={saveFromEditor}
        onEditCopy={editACopy}
        onDownload={content => downloadSkill({ name: parseSkill(content).name || 'skill', content })}
      />
    </>
  )
}

export default AgentSkillsSection
