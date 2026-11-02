import { useCallback, useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { Download, Pencil, Plus, ShieldAlert, Sparkles, Trash2 } from 'lucide-react'
import skillService from 'src/gendox-sdk/skillService'
import RequireSuperAdmin from 'src/authentication/components/RequireSuperAdmin'
import { getErrorMessage } from 'src/utils/errorHandler'
import { downloadSkill, NEW_SKILL_TEMPLATE } from 'src/utils/skillMarkdown'
import { getToken } from 'src/components/agent/useAgent'
import AppLayout from 'src/layouts/AppLayout'
import ConfirmDialog from 'src/components/ui/ConfirmDialog'
import Empty from 'src/components/ui/Empty'
import { SkeletonList } from 'src/components/ui/Skeleton'
import SkillEditorDialog from 'src/components/skills/SkillEditorDialog'

/**
 * Gendox (system) skills, for super admins. Project admins add them to their agent from the library; publishing a
 * new version moves every agent that has the skill to it. gendox-assistant is not added to agents: a chat from a
 * Gendox page gets it from here. Skills shipped in the backend's classpath:skills/ are created on startup, and stop
 * following their file once edited here.
 */
const SystemSkills = () => {
  const [skills, setSkills] = useState(null) // null while loading
  const [knownTools, setKnownTools] = useState(undefined)
  const [editor, setEditor] = useState(null) // { skill | null, content }
  const [removing, setRemoving] = useState(null)

  const load = useCallback(() => {
    skillService
      .getSkillLibrary(getToken())
      .then(response => setSkills(response.data ?? []))
      .catch(error => {
        setSkills([])
        toast.error(`Couldn’t load the skills. ${getErrorMessage(error)}`)
      })
  }, [])

  useEffect(() => {
    load()
    skillService
      .getSkillTools(getToken())
      .then(response => setKnownTools(response.data.map(tool => tool.name)))
      .catch(() => setKnownTools(undefined))
  }, [load])

  const save = async content => {
    try {
      if (editor.skill) {
        const response = await skillService.publishSkillVersion(editor.skill.name, content, getToken())
        toast.success(`${response.data.name} is now version ${response.data.version}`)
      } else {
        const response = await skillService.createSkill(content, getToken())
        toast.success(`${response.data.name} created`)
      }
      setEditor(null)
      load()
    } catch (error) {
      toast.error(getErrorMessage(error))
    }
  }

  const remove = async skill => {
    try {
      await skillService.deleteSkill(skill.name, getToken())
      toast.success(`${skill.name} removed from the library`)
      load()
    } catch (error) {
      toast.error(getErrorMessage(error))
    }
  }

  return (
    <main className='content'>
      <div className='list-h'>
        <div>
          <h2>System skills</h2>
          <p className='muted' style={{ marginTop: 4 }}>
            Gendox skills a project admin can add to their agent. gendox-assistant is given to every chat from a Gendox
            page, without adding it.
          </p>
        </div>
        <span className='sp' />
        <button className='btn primary' onClick={() => setEditor({ skill: null, content: NEW_SKILL_TEMPLATE })}>
          <Plus className='lucide' />
          New skill
        </button>
      </div>

      <div className='card'>
        {skills === null ? (
          <SkeletonList rows={3} />
        ) : skills.length === 0 ? (
          <Empty icon={<Sparkles className='lucide' />} title='No system skills yet' text='Create the first one.' />
        ) : (
          skills.map(skill => (
            <div key={skill.id} className='item fade-in'>
              <span className='ftype' style={{ '--h': 265 }}>
                <Sparkles className='lucide' />
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className='row'>
                  <b className='mono trunc'>{skill.name}</b>
                  <span className='badge'>v{skill.version}</span>
                  {!skill.createdBy && (
                    <span
                      className='badge info'
                      title='Shipped with Gendox: updates to its file are published automatically until it is edited here.'
                    >
                      From file
                    </span>
                  )}
                </div>
                <div className='muted sm trunc'>{skill.description}</div>
              </div>
              <button
                className='btn ghost s icon'
                title='Publish a new version'
                onClick={() => setEditor({ skill, content: skill.content })}
              >
                <Pencil className='lucide' />
              </button>
              <button className='btn ghost s icon' title='Download SKILL.md' onClick={() => downloadSkill(skill)}>
                <Download className='lucide' />
              </button>
              <button className='btn ghost s icon' title='Remove from the library' onClick={() => setRemoving(skill)}>
                <Trash2 className='lucide' />
              </button>
            </div>
          ))
        )}
      </div>

      <SkillEditorDialog
        open={Boolean(editor)}
        title={editor?.skill ? `New version of ${editor.skill.name}` : 'New system skill'}
        subtitle={
          editor?.skill
            ? 'Every agent that has this skill moves to the new version. Agents that removed it don’t get it back. The name can’t change.'
            : 'Project admins can add it to their agent from the Gendox skills library.'
        }
        initialContent={editor?.content}
        knownTools={knownTools}
        footerNote={editor?.skill ? `Publishes version ${editor.skill.version + 1}.` : 'Saved as version 1.'}
        saveLabel={editor?.skill ? 'Publish' : 'Create'}
        onClose={() => setEditor(null)}
        onSave={save}
      />

      <ConfirmDialog
        open={Boolean(removing)}
        onClose={() => setRemoving(null)}
        title={`Remove ${removing?.name ?? ''}?`}
        text='It leaves the Gendox skills library, so no agent can add it any more. Agents that have it keep their copy until a project admin removes it.'
        confirmLabel='Remove'
        onConfirm={() => remove(removing)}
      />
    </main>
  )
}

const NotAllowed = () => (
  <main className='content'>
    <div className='card'>
      <Empty
        icon={<ShieldAlert className='lucide' />}
        title='System skills'
        text='Only Gendox system administrators can open this page.'
      />
    </div>
  </main>
)

const SystemSkillsPage = () => (
  <RequireSuperAdmin fallback={<NotAllowed />}>
    <SystemSkills />
  </RequireSuperAdmin>
)

SystemSkillsPage.getLayout = page => (
  <AppLayout page='admin-skills' title='System skills' crumb='Gendox'>
    {page}
  </AppLayout>
)

SystemSkillsPage.pageConfig = {
  applyEffectiveOrgAndProjectIds: true
}

export default SystemSkillsPage
