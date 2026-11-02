import { useEffect, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import toast from 'react-hot-toast'
import { BookOpenText, Download, Plus, Sparkles, Trash2 } from 'lucide-react'
import useHasOrgRole from 'src/authentication/hooks/useHasOrgRole'
import { fetchSkillLibrary, fetchSkillTools } from 'src/store/activeProjectAgent/activeProjectAgent'
import { getErrorMessage } from 'src/utils/errorHandler'
import { downloadSkill, NEW_SKILL_TEMPLATE, parseSkill, renameSkill } from 'src/utils/skillMarkdown'
import useAgent, { getToken } from 'src/components/agent/useAgent'
import AgentScope from 'src/components/agent/AgentScope'
import AppLayout from 'src/layouts/AppLayout'
import ConfirmDialog from 'src/components/ui/ConfirmDialog'
import Empty from 'src/components/ui/Empty'
import Spinner from 'src/components/ui/Spinner'
import SkillEditorDialog from 'src/components/skills/SkillEditorDialog'
import SkillLibraryDialog from 'src/components/skills/SkillLibraryDialog'

/**
 * The agent's skills (projectAgent.agentSkills), saved with PUT …/projects/{p} like its tools.
 * A Gendox skill (one with a skillId) is a read-only copy Gendox keeps up to date; "Edit a copy" makes it the
 * agent's own.
 */
const AgentSkillsPage = () => {
  const dispatch = useDispatch()
  const { project, organizationId, save } = useAgent()
  const { skillLibrary, isFetchingSkillLibrary, skillTools } = useSelector(state => state.activeProjectAgent)
  const canEdit = useHasOrgRole({ organizationId, roles: ['OP_UPDATE_PROJECT'] })

  const [libraryOpen, setLibraryOpen] = useState(false)
  const [editor, setEditor] = useState(null) // { index | null, content, readOnly }
  const [removing, setRemoving] = useState(null)

  useEffect(() => {
    dispatch(fetchSkillLibrary({ token: getToken() }))
    dispatch(fetchSkillTools({ token: getToken() }))
  }, [dispatch])

  const skills = useMemo(() => project?.projectAgent?.agentSkills ?? [], [project])
  const addedNames = useMemo(() => new Set(skills.map(skill => skill.name)), [skills])
  const libraryById = useMemo(() => new Map((skillLibrary || []).map(skill => [skill.id, skill])), [skillLibrary])
  const knownTools = useMemo(() => (skillTools || []).map(tool => tool.name), [skillTools])

  if (!project) {
    return (
      <main className='content'>
        <div className='center' style={{ padding: 80 }}>
          <Spinner />
        </div>
      </main>
    )
  }

  const saveSkills = async (agentSkills, message) => {
    try {
      await save({ agent: { agentSkills } })
      toast.success(message)

      return true
    } catch (error) {
      toast.error(`Couldn’t save. ${getErrorMessage(error)}`)

      return false
    }
  }

  // the server copies a Gendox skill's content from the library
  const addFromLibrary = skill =>
    saveSkills(
      [...skills, { skillId: skill.id, name: skill.name, description: skill.description, content: skill.content }],
      `${skill.name} added`
    )

  const saveFromEditor = async (content, parsed) => {
    const edited = { name: parsed.name, description: parsed.description, content }
    const next =
      editor.index === null
        ? [...skills, edited]
        : skills.map((skill, i) => (i === editor.index ? { ...skill, ...edited } : skill))
    if (await saveSkills(next, editor.index === null ? `${parsed.name} added` : `${parsed.name} saved`)) setEditor(null)
  }

  const editACopy = content =>
    setEditor({ index: null, content: renameSkill(content, `${skills[editor.index].name}-custom`), readOnly: false })

  const newSkill = () => setEditor({ index: null, content: NEW_SKILL_TEMPLATE, readOnly: false })

  const editing = editor && editor.index !== null ? skills[editor.index] : null

  return (
    <main className='content'>
      <AgentScope project={project} tab='skills' />

      <div className='list-h'>
        <div>
          <h2>Skills</h2>
          <p className='muted' style={{ marginTop: 4 }}>
            Instructions the agent reads when a question needs them, e.g. how to handle a refund. Each skill is one
            SKILL.md file, the format Claude Code and Codex use, and can bring tools with it.
          </p>
        </div>
        <span className='sp' />
        {canEdit && (
          <>
            <button className='btn' onClick={() => setLibraryOpen(true)}>
              <Sparkles className='lucide' />
              Gendox skills
            </button>
            <button className='btn primary' onClick={newSkill}>
              <Plus className='lucide' />
              New skill
            </button>
          </>
        )}
      </div>

      {skills.length > 0 ? (
        <div className='card'>
          {skills.map((skill, index) => {
            const fromGendox = Boolean(skill.skillId)
            const version = fromGendox ? libraryById.get(skill.skillId)?.version : null
            const tools = parseSkill(skill.content).tools

            return (
              <div
                key={skill.id ?? `new-${index}`}
                className='item'
                style={{ cursor: 'pointer' }}
                onClick={() => setEditor({ index, content: skill.content, readOnly: fromGendox || !canEdit })}
              >
                <span className='ftype' style={{ '--h': fromGendox ? 265 : 210 }}>
                  {fromGendox ? <Sparkles className='lucide' /> : <BookOpenText className='lucide' />}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className='row'>
                    <b className='mono trunc'>{skill.name}</b>
                    <span className={`badge ${fromGendox ? 'accent' : ''}`}>
                      {fromGendox ? `Gendox${version ? ` · v${version}` : ''}` : 'Your own'}
                    </span>
                  </div>
                  <div className='muted sm clamp2'>{skill.description}</div>
                  {tools.length > 0 && <div className='faint sm trunc'>Brings {tools.join(', ')}</div>}
                </div>
                <button
                  className='btn ghost s icon'
                  title='Download SKILL.md'
                  onClick={e => {
                    e.stopPropagation()
                    downloadSkill(skill)
                  }}
                >
                  <Download className='lucide' />
                </button>
                {canEdit && (
                  <button
                    className='btn ghost s icon'
                    title='Remove'
                    onClick={e => {
                      e.stopPropagation()
                      setRemoving(index)
                    }}
                  >
                    <Trash2 className='lucide' />
                  </button>
                )}
              </div>
            )
          })}
        </div>
      ) : (
        <div className='card'>
          <Empty
            icon={<BookOpenText className='lucide' />}
            title='No skills yet'
            text='Add a ready-made skill from Gendox, or write your own.'
            action={
              canEdit && (
                <button className='btn primary' onClick={() => setLibraryOpen(true)}>
                  Gendox skills
                </button>
              )
            }
          />
        </div>
      )}

      <SkillLibraryDialog
        open={libraryOpen}
        library={skillLibrary || []}
        loading={isFetchingSkillLibrary}
        addedNames={addedNames}
        onAdd={addFromLibrary}
        onClose={() => setLibraryOpen(false)}
      />

      <SkillEditorDialog
        open={Boolean(editor)}
        title={editor?.readOnly ? editing?.name : editing ? `Edit ${editing.name}` : 'New skill'}
        subtitle={
          editor?.readOnly && editing?.skillId
            ? 'From Gendox, kept up to date by Gendox. Edit a copy to change it; your copy stops following Gendox’s updates.'
            : null
        }
        initialContent={editor?.content}
        knownTools={knownTools.length ? knownTools : undefined}
        readOnly={editor?.readOnly}
        footerNote={editor?.readOnly ? null : 'Saved with the agent.'}
        saveLabel={editing ? 'Save' : 'Add skill'}
        onClose={() => setEditor(null)}
        onSave={saveFromEditor}
        onEditCopy={canEdit ? editACopy : null}
        onDownload={content => downloadSkill({ name: parseSkill(content).name || 'skill', content })}
      />

      <ConfirmDialog
        open={removing != null}
        onClose={() => setRemoving(null)}
        title={`Remove ${removing != null ? skills[removing]?.name : ''}?`}
        text='The agent stops using this skill and the tools it brings.'
        confirmLabel='Remove'
        onConfirm={() => saveSkills(skills.filter((_, i) => i !== removing), 'Skill removed')}
      />
    </main>
  )
}

AgentSkillsPage.getLayout = page => (
  <AppLayout page='agents' title='Skills' crumb='Agents'>
    {page}
  </AppLayout>
)

AgentSkillsPage.pageConfig = {
  applyEffectiveOrgAndProjectIds: true
}

export default AgentSkillsPage
