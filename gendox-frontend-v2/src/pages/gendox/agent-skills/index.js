import { useEffect, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import toast from 'react-hot-toast'
import { BookMarked, Download, Ellipsis, Eye, LibraryBig, Pencil, Plus, Sparkles, Trash2 } from 'lucide-react'
import useHasOrgRole from 'src/authentication/hooks/useHasOrgRole'
import { fetchSkillLibrary, fetchSkillTools } from 'src/store/activeProjectAgent/activeProjectAgent'
import { getErrorMessage } from 'src/utils/errorHandler'
import { downloadSkill, frontMatterOf, NEW_SKILL_TEMPLATE, parseSkill, renameSkill } from 'src/utils/skillMarkdown'
import useAgent, { getToken } from 'src/components/agent/useAgent'
import useOrganizationUsers from 'src/hooks/useOrganizationUsers'
import { authorOf } from 'src/components/knowledge/documentUtils'
import AgentScope from 'src/components/agent/AgentScope'
import AgentPageSkeleton from 'src/components/agent/AgentPageSkeleton'
import AppLayout from 'src/layouts/AppLayout'
import ConfirmDialog from 'src/components/ui/ConfirmDialog'
import Empty from 'src/components/ui/Empty'
import Menu from 'src/components/ui/Menu'
import { SkeletonList } from 'src/components/ui/Skeleton'
import SkillEditorDialog from 'src/components/skills/SkillEditorDialog'
import SkillLibraryDialog from 'src/components/skills/SkillLibraryDialog'
import SkillTools from 'src/components/skills/SkillTools'
import Switch from 'src/components/ui/Switch'

// a skill switched off stays on the agent with its text, but the agent doesn't see it or its tools
const isOn = skill => skill.enabled !== false

/**
 * The agent's skills (projectAgent.agentSkills), saved with PUT …/projects/{p} like its tools.
 * A Gendox skill (one with a skillId) is a read-only copy Gendox keeps up to date; "Edit a copy" makes it the
 * agent's own.
 */
const AgentSkillsPage = () => {
  const dispatch = useDispatch()
  const { project, organizationId, save } = useAgent()
  const organizationUsers = useOrganizationUsers(organizationId)
  const { skillLibrary, isFetchingSkillLibrary, skillTools } = useSelector(state => state.activeProjectAgent)
  const canEdit = useHasOrgRole({ organizationId, roles: ['OP_UPDATE_PROJECT'] })

  const [libraryOpen, setLibraryOpen] = useState(false)
  const [editor, setEditor] = useState(null) // { index | null, content, readOnly }
  const [removing, setRemoving] = useState(null)
  // { index, on } while a switch is saved: it moves at once, and back if the save fails
  const [switching, setSwitching] = useState(null)
  const shownOn = (skill, index) => (switching?.index === index ? switching.on : isOn(skill))

  useEffect(() => {
    dispatch(fetchSkillLibrary({ token: getToken() }))
    dispatch(fetchSkillTools({ token: getToken() }))
  }, [dispatch])

  const skills = useMemo(() => project?.projectAgent?.agentSkills ?? [], [project])
  const addedNames = useMemo(() => new Set(skills.map(skill => skill.name)), [skills])
  const libraryById = useMemo(() => new Map((skillLibrary || []).map(skill => [skill.id, skill])), [skillLibrary])
  const knownTools = useMemo(() => (skillTools || []).map(tool => tool.name), [skillTools])
  const toolDescriptions = useMemo(() => new Map((skillTools || []).map(tool => [tool.name, tool.description])), [skillTools])

  const onSkills = useMemo(() => skills.filter(isOn), [skills])

  // what the backend appends to the agent's system prompt (SkillService.buildSkillsHeader): each skill's front matter
  const alwaysSees = useMemo(
    () =>
      [...onSkills]
        .sort((a, b) => a.name.localeCompare(b.name))
        .map(skill => frontMatterOf(skill.content) ?? `---\nname: ${skill.name}\ndescription: ${skill.description}\n---`)
        .join('\n\n'),
    [onSkills]
  )

  if (!project) return <AgentPageSkeleton tab='skills'>
      <div className='card'>
        <SkeletonList rows={2} />
      </div>
    </AgentPageSkeleton>

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

  const switchSkill = async (index, on) => {
    setSwitching({ index, on })
    await saveSkills(
      skills.map((skill, i) => (i === index ? { ...skill, enabled: on } : skill)),
      `${skills[index].name} switched ${on ? 'on' : 'off'}`
    )
    setSwitching(null)
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
            Instructions {project.name} reads when a question needs them. Each skill is one SKILL.md file, the same
            format Claude Code and Codex use.
          </p>
        </div>
        <span className='sp' />
        {canEdit && (
          <div className='row' style={{ gap: 8, flex: 'none' }}>
            <button className='btn' onClick={() => setLibraryOpen(true)}>
              <LibraryBig className='lucide' />
              Gendox skills
            </button>
            <button className='btn primary' onClick={newSkill}>
              <Plus className='lucide' />
              New skill
            </button>
          </div>
        )}
      </div>

      {skills.length > 0 ? (
        <div className='card'>
          {skills.map((skill, index) => {
            const fromGendox = Boolean(skill.skillId)
            const version = fromGendox ? libraryById.get(skill.skillId)?.version : null
            const from = fromGendox ? 'Gendox' : authorOf(skill, organizationUsers) || 'Your own'
            const readOnly = fromGendox || !canEdit
            const open = () => setEditor({ index, content: skill.content, readOnly })

            return (
              <div key={skill.id ?? `new-${index}`} className='item skill-row' onClick={open}>
                <span className='ftype' style={{ '--h': fromGendox ? 165 : 270, width: 28, height: 28 }}>
                  {fromGendox ? <Sparkles className='lucide' /> : <BookMarked className='lucide' />}
                </span>
                <div style={{ flex: 1, minWidth: 0, opacity: shownOn(skill, index) ? 1 : 0.6 }}>
                  <div className='row' style={{ gap: 8 }}>
                    <b className='trunc' style={{ fontWeight: 550 }}>
                      {skill.name}
                    </b>
                    <span className='faint sm'>
                      {from}
                      {version ? ` · v${version}` : ''}
                    </span>
                    {!shownOn(skill, index) && <span className='badge'>Off</span>}
                  </div>
                  <div className='faint sm trunc'>{skill.description}</div>
                  <SkillTools tools={parseSkill(skill.content).tools} descriptions={toolDescriptions} />
                </div>
                <div className='row' style={{ gap: 4, flex: 'none' }} onClick={e => e.stopPropagation()}>
                  <Switch
                    checked={shownOn(skill, index)}
                    onChange={on => switchSkill(index, on)}
                    disabled={!canEdit || (switching !== null && switching.index !== index)}
                    busy={switching?.index === index}
                    label={isOn(skill) ? `Switch ${skill.name} off` : `Switch ${skill.name} on`}
                  />
                  <Menu
                    align='right'
                    width={220}
                    trigger={({ onClick }) => (
                      <button className='btn ghost s icon' title='More' onClick={onClick}>
                        <Ellipsis className='lucide' />
                      </button>
                    )}
                  >
                    <button className='mi' data-close-menu onClick={open}>
                      {readOnly ? <Eye className='lucide' /> : <Pencil className='lucide' />}
                      {readOnly ? 'View' : 'Edit'}
                    </button>
                    <button className='mi' data-close-menu onClick={() => downloadSkill(skill)}>
                      <Download className='lucide' />
                      Download SKILL.md
                    </button>
                    {canEdit && (
                      <>
                        <hr />
                        <button className='mi' data-close-menu style={{ color: 'var(--err)' }} onClick={() => setRemoving(index)}>
                          <Trash2 className='lucide' />
                          Remove from {project.name}
                        </button>
                      </>
                    )}
                  </Menu>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className='card'>
          <Empty
            icon={<BookMarked className='lucide' />}
            title='No skills yet'
            text='Skills are instructions the agent reads only when it needs them. Start from one Gendox provides.'
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

      <details className='card'>
        <summary className='card-h' style={{ cursor: 'pointer' }}>
          <h3>What the agent always sees</h3>
          <span className='sp' />
          <span className='faint sm'>Each skill’s front matter</span>
        </summary>
        <pre className='code' style={{ border: 0, borderRadius: 0, whiteSpace: 'pre-wrap' }}>
          {onSkills.length
            ? `${alwaysSees}\n\nRead a skill with read_skill(name) before you follow it.`
            : skills.length
              ? 'No skill is switched on: nothing is added to the agent’s instructions.'
              : 'No skills yet: nothing is added to the agent’s instructions.'}
        </pre>
      </details>

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
            ? `From Gendox${libraryById.get(editing.skillId)?.version ? ` · version ${libraryById.get(editing.skillId).version}` : ''}. Edit a copy to change it; your copy stops following Gendox’s updates.`
            : editor?.readOnly
              ? null
              : 'Write or paste a SKILL.md, or upload one. The name and description come from its front matter.'
        }
        initialContent={editor?.content}
        knownTools={knownTools.length ? knownTools : undefined}
        readOnly={editor?.readOnly}
        footerNote={editor?.readOnly ? null : 'Saved with the agent.'}
        saveLabel='Save'
        onClose={() => setEditor(null)}
        onSave={saveFromEditor}
        onEditCopy={canEdit ? editACopy : null}
        onDownload={content => downloadSkill({ name: parseSkill(content).name || 'skill', content })}
      />

      <ConfirmDialog
        open={removing != null}
        onClose={() => setRemoving(null)}
        title={`Remove ${removing != null ? skills[removing]?.name : ''}?`}
        text={`${project.name} stops using it and the tools it brings. Past conversations keep their history.`}
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
