import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { ChevronRight, CircleCheck, Info, RotateCcw } from 'lucide-react'
import useHasOrgRole from 'src/authentication/hooks/useHasOrgRole'
import { getErrorMessage } from 'src/utils/errorHandler'
import useAgent from 'src/components/agent/useAgent'
import useModels from 'src/components/agent/useModels'
import AgentScope from 'src/components/agent/AgentScope'
import ModelPicker, { ModelKeyWarning, needsKey, providerLabel } from 'src/components/agent/ModelPicker'
import Chat from 'src/components/chat/Chat'
import useChat from 'src/components/chat/useChat'
import AppLayout from 'src/layouts/AppLayout'
import ConfirmDialog from 'src/components/ui/ConfirmDialog'
import SaveBar from 'src/components/ui/SaveBar'
import Spinner from 'src/components/ui/Spinner'
import Switch from 'src/components/ui/Switch'

// one-click rules added to the instructions
const RULES = [
  ['Only answer from knowledge', 'Answer only from the knowledge you are given. If you don’t know, say so.'],
  ['Match the user’s language', 'Reply in the language the user writes in.'],
  ['Keep it short', 'Keep answers under 120 words unless asked for detail.']
]

const EFFORTS = [
  ['', 'Model default'],
  ['low', 'Low'],
  ['medium', 'Medium'],
  ['high', 'High']
]

// the agent's fields this page edits; models are kept by name
const draftOf = agent => ({
  agentBehavior: agent.agentBehavior || '',
  completionModel: agent.completionModel?.name || '',
  semanticSearchModel: agent.semanticSearchModel?.name || '',
  decisionModel: agent.decisionModel?.name || '',
  moderationModel: agent.moderationModel?.name || '',
  rerankModel: agent.rerankModel?.name || '',
  reasoningEffort: agent.reasoningEffort || '',
  maxSearchLimit: agent.maxSearchLimit ?? 5,
  maxCompletionLimit: agent.maxCompletionLimit ?? 5,
  rerankEnable: Boolean(agent.rerankEnable),
  advancedSearchEnable: Boolean(agent.advancedSearchEnable),
  moderationCheck: Boolean(agent.moderationCheck),
  maxToken: agent.maxToken ?? '',
  temperature: agent.temperature ?? 0.2,
  topP: agent.topP ?? 1
})

const temperatureLabel = t => (t < 0.35 ? 'precise, repeatable answers' : t < 0.7 ? 'balanced' : 'more varied wording')

// The chat beside the settings, with the saved settings; Clear starts a new conversation
const TryIt = ({ dirty }) => {
  const { token, newThread, openThread } = useChat()

  return (
    <aside className='card try'>
      <div className='card-h' style={{ minHeight: 48, padding: '10px 12px 10px 16px' }}>
        <h3 style={{ flex: 1 }}>Try it</h3>
        <button className='btn ghost s' onClick={newThread}>
          <RotateCcw className='lucide' />
          Clear
        </button>
      </div>
      <div className='row faint sm' style={{ padding: '8px 16px', borderBottom: '1px solid var(--border)' }}>
        {dirty ? <Info className='lucide' /> : <CircleCheck className='lucide' />}
        {dirty ? 'Uses the saved settings. Save to try your changes.' : 'Chatting with the saved settings'}
      </div>
      <div style={{ flex: 1, minHeight: 0 }}>
        <Chat
          token={token}
          variant='panel'
          greeting={false}
          footnote=''
          placeholder='Ask a test question…'
          onNewThread={newThread}
          onOpenThread={openThread}
        />
      </div>
    </aside>
  )
}

/**
 * How the agent answers: instructions, models, search and safety.
 * Saved with PUT organizations/{o}/projects/{p} (the projectAgent part).
 */
const AgentBehaviorPage = () => {
  const { project, organizationId, projectId, href, save } = useAgent()
  const models = useModels(organizationId, projectId)
  const canEdit = useHasOrgRole({ organizationId, roles: ['OP_UPDATE_PROJECT'] })

  const saved = useMemo(() => (project ? draftOf(project.projectAgent || {}) : null), [project])
  const [draft, setDraft] = useState(null)
  const [isSaving, setIsSaving] = useState(false)
  const [pendingSearchModel, setPendingSearchModel] = useState(null)

  useEffect(() => {
    if (saved) setDraft(saved)
  }, [saved])

  if (!project || !draft) {
    return (
      <main className='content'>
        <div className='center' style={{ padding: 80 }}>
          <Spinner />
        </div>
      </main>
    )
  }

  const set = changes => setDraft(d => ({ ...d, ...changes }))
  const dirty = JSON.stringify(draft) !== JSON.stringify(saved)
  const completion = models.completion.find(m => m.name === draft.completionModel)
  const supportsSampling = completion?.supportsSamplingParams !== false
  const supportsReasoning = completion?.supportsReasoning === true
  const limitsInvalid = Number(draft.maxCompletionLimit) > Number(draft.maxSearchLimit)
  const keysHref = href('/gendox/model-providers')

  const submit = async () => {
    if (limitsInvalid) return toast.error('Passages to use can’t be more than passages to look at.')
    setIsSaving(true)
    try {
      await save({
        agent: {
          agentBehavior: draft.agentBehavior,
          completionModel: { name: draft.completionModel },
          semanticSearchModel: { name: draft.semanticSearchModel },
          decisionModel: { name: draft.decisionModel },
          moderationModel: { name: draft.moderationModel },
          rerankModel: { name: draft.rerankModel },
          // null rather than '' so the backend falls back to the model's default
          reasoningEffort: draft.reasoningEffort || null,
          maxSearchLimit: Number(draft.maxSearchLimit),
          maxCompletionLimit: Number(draft.maxCompletionLimit),
          rerankEnable: draft.rerankEnable,
          advancedSearchEnable: draft.advancedSearchEnable,
          moderationCheck: draft.moderationCheck,
          maxToken: draft.maxToken === '' ? null : Number(draft.maxToken),
          temperature: Number(draft.temperature),
          topP: Number(draft.topP)
        }
      })
      toast.success('Behavior saved')
    } catch (error) {
      toast.error(`Couldn’t save. ${getErrorMessage(error)}`)
    } finally {
      setIsSaving(false)
    }
  }

  const modelField = (label, list, key, help) => (
    <div className='field'>
      <label>{label}</label>
      <ModelPicker
        models={list}
        value={draft[key]}
        onChange={value => set({ [key]: value })}
        keys={models.keys}
        disabled={!canEdit}
        title={label}
        keysHref={keysHref}
      />
      {help && <span className='help'>{help}</span>}
    </div>
  )

  return (
    <main className='content'>
      <AgentScope project={project} tab='behavior' />
      <div className='behav'>
        <div>
          <section className='sect' style={{ paddingTop: 8, gridTemplateColumns: 'minmax(0, 1fr)' }}>
            <header>
              <h2>Instructions</h2>
              <p>
                Tell the agent who it is, who it talks to and what it must never do. Write it like a brief to a new
                colleague.
              </p>
            </header>
            <div className='stack'>
              <textarea
                className='input instr'
                spellCheck
                value={draft.agentBehavior}
                disabled={!canEdit}
                onChange={e => set({ agentBehavior: e.target.value })}
              />
              <div className='row' style={{ flexWrap: 'wrap', gap: 6 }}>
                {canEdit && <span className='faint sm'>Add a rule:</span>}
                {canEdit &&
                  RULES.map(([label, rule]) => (
                    <button
                      key={label}
                      className='chip'
                      onClick={() => set({ agentBehavior: `${draft.agentBehavior.trimEnd()}\n- ${rule}`.trimStart() })}
                    >
                      {label}
                    </button>
                  ))}
                <span className='sp' />
                <span className='faint sm num'>{draft.agentBehavior.length} characters</span>
              </div>
            </div>
          </section>

          <section className='sect'>
            <header>
              <h2>Model</h2>
              <p>The AI model that writes the answers. Models marked “Needs your key” use your own account with the provider.</p>
            </header>
            <div className='form'>
              <div className='field'>
                <label>Answer model</label>
                <ModelPicker
                  models={models.completion}
                  value={draft.completionModel}
                  onChange={value => set({ completionModel: value })}
                  keys={models.keys}
                  disabled={!canEdit}
                  title='Answer models'
                  keysHref={keysHref}
                />
                {completion &&
                  (needsKey(completion, models.keys) ? (
                    <ModelKeyWarning model={completion} keys={models.keys} keysHref={keysHref} />
                  ) : (
                    <span className='help'>
                      {providerLabel(completion.aiModelProvider?.name)}
                      {completion.hostingRegion ? ` · runs in ${completion.hostingRegion}` : ''}
                    </span>
                  ))}
              </div>
              {supportsReasoning && (
                <div className='field'>
                  <label>Thinking effort</label>
                  <div className='pill-tabs'>
                    {EFFORTS.map(([value, label]) => (
                      <button
                        key={label}
                        className={draft.reasoningEffort === value ? 'on' : ''}
                        disabled={!canEdit}
                        onClick={() => set({ reasoningEffort: value })}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                  <span className='help'>More effort gives better answers to hard questions, but is slower.</span>
                </div>
              )}
            </div>
          </section>

          <section className='sect'>
            <header>
              <h2>Finding answers</h2>
              <p>How the agent searches its knowledge before it answers.</p>
            </header>
            <div className='card card-b'>
              <div className='toggle-row'>
                <div>
                  <b>Passages to look at</b>
                  <p>How many matching passages the search returns.</p>
                </div>
                <input
                  className='input'
                  type='number'
                  min={1}
                  max={50}
                  style={{ width: 84 }}
                  value={draft.maxSearchLimit}
                  disabled={!canEdit}
                  onChange={e => set({ maxSearchLimit: e.target.value })}
                />
              </div>
              <div className='toggle-row'>
                <div>
                  <b>Passages to use in an answer</b>
                  <p>The best of those passages are given to the model. More gives fuller answers but costs more.</p>
                  {limitsInvalid && <span className='err sm'>Can’t be more than the passages it looks at.</span>}
                </div>
                <input
                  className='input'
                  type='number'
                  min={1}
                  max={50}
                  style={{ width: 84 }}
                  value={draft.maxCompletionLimit}
                  disabled={!canEdit}
                  onChange={e => set({ maxCompletionLimit: e.target.value })}
                />
              </div>
              <div className='toggle-row'>
                <div>
                  <b>Re-rank results</b>
                  <p>A second model re-orders the passages so the most relevant come first.</p>
                  {draft.rerankEnable && (
                    <div style={{ marginTop: 8 }}>
                      <ModelPicker
                        models={models.rerank}
                        value={draft.rerankModel}
                        onChange={value => set({ rerankModel: value })}
                        keys={models.keys}
                        disabled={!canEdit}
                        title='Re-rank models'
                        keysHref={keysHref}
                      />
                    </div>
                  )}
                </div>
                <Switch
                  label='Re-rank results'
                  checked={draft.rerankEnable}
                  disabled={!canEdit}
                  onChange={value => set({ rerankEnable: value })}
                />
              </div>
              <div className='toggle-row'>
                <div>
                  <b>Smarter search</b>
                  <p>Rewrites vague questions before searching. Helps with short or follow-up questions.</p>
                </div>
                <Switch
                  label='Smarter search'
                  checked={draft.advancedSearchEnable}
                  disabled={!canEdit}
                  onChange={value => set({ advancedSearchEnable: value })}
                />
              </div>
            </div>
          </section>

          <section className='sect'>
            <header>
              <h2>Safety</h2>
              <p>Check every question before answering, and refuse harmful requests.</p>
            </header>
            <div className='card card-b'>
              <div className='toggle-row'>
                <div>
                  <b>Moderation check</b>
                  <p>Questions flagged as harmful get a polite refusal instead of an answer.</p>
                  {draft.moderationCheck && (
                    <div style={{ marginTop: 8 }}>
                      <ModelPicker
                        models={models.moderation}
                        value={draft.moderationModel}
                        onChange={value => set({ moderationModel: value })}
                        keys={models.keys}
                        disabled={!canEdit}
                        title='Moderation models'
                        keysHref={keysHref}
                      />
                    </div>
                  )}
                </div>
                <Switch
                  label='Moderation check'
                  checked={draft.moderationCheck}
                  disabled={!canEdit}
                  onChange={value => set({ moderationCheck: value })}
                />
              </div>
            </div>
          </section>

          <details className='adv'>
            <summary>
              <ChevronRight className='lucide' />
              Advanced settings
              <span className='faint sm' style={{ fontWeight: 400 }}>
                · answer length, creativity, search model
              </span>
            </summary>
            <div className='sect' style={{ paddingTop: 8 }}>
              <header>
                <h2>Answer style</h2>
                <p>Raw model parameters. The defaults suit most agents.</p>
              </header>
              <div className='form'>
                <div className='field'>
                  <label>Longest answer</label>
                  <div className='affix' style={{ maxWidth: 220 }}>
                    <input
                      className='input'
                      type='number'
                      value={draft.maxToken}
                      disabled={!canEdit}
                      onChange={e => set({ maxToken: e.target.value })}
                    />
                    <span>tokens</span>
                  </div>
                  <span className='help'>About ¾ of a word per token. 1,200 tokens ≈ 900 words.</span>
                </div>
                {supportsSampling ? (
                  <div className='form-grid'>
                    <div className='field'>
                      <label>Creativity (temperature)</label>
                      <input
                        type='range'
                        min={0}
                        max={1}
                        step={0.05}
                        style={{ accentColor: 'var(--accent)' }}
                        value={draft.temperature}
                        disabled={!canEdit}
                        onChange={e => set({ temperature: Number(e.target.value) })}
                      />
                      <span className='help'>
                        {draft.temperature} — {temperatureLabel(draft.temperature)}
                      </span>
                    </div>
                    <div className='field'>
                      <label>Top P</label>
                      <input
                        className='input'
                        type='number'
                        step={0.01}
                        min={0}
                        max={1}
                        value={draft.topP}
                        disabled={!canEdit}
                        onChange={e => set({ topP: e.target.value })}
                      />
                    </div>
                  </div>
                ) : (
                  <p className='faint sm'>This model sets its own creativity, so temperature and Top P don’t apply.</p>
                )}
              </div>
            </div>
            <div className='sect'>
              <header>
                <h2>Search &amp; decisions</h2>
                <p>Changing the search model processes every document of this agent again.</p>
              </header>
              <div className='form'>
                <div className='field'>
                  <label>Search model</label>
                  <ModelPicker
                    models={models.semantic}
                    value={draft.semanticSearchModel}
                    onChange={value => value !== draft.semanticSearchModel && setPendingSearchModel(value)}
                    keys={models.keys}
                    disabled={!canEdit}
                    title='Search models'
                    keysHref={keysHref}
                  />
                </div>
                {modelField(
                  'Decision model',
                  models.decision,
                  'decisionModel',
                  'Answers yes/no, choice and rating questions in Document insights tasks.'
                )}
                <div className='field'>
                  <label>How documents are split</label>
                  <input
                    className='input'
                    readOnly
                    value={
                      project.projectAgent?.documentSplitterType?.name === 'STATIC_WORD_COUNT_SPLITTER'
                        ? 'By word count'
                        : project.projectAgent?.documentSplitterType?.name || ''
                    }
                  />
                </div>
              </div>
            </div>
          </details>

          <SaveBar
            visible={dirty && canEdit}
            isSaving={isSaving}
            onDiscard={() => setDraft(saved)}
            onSave={submit}
          />
        </div>

        <TryIt dirty={dirty} />
      </div>

      <ConfirmDialog
        open={Boolean(pendingSearchModel)}
        onClose={() => setPendingSearchModel(null)}
        title='Change the search model?'
        text={`Every document of this agent will be processed again with ${pendingSearchModel}. Answers may be incomplete until it finishes. The change applies when you save.`}
        confirmLabel='Change'
        danger={false}
        onConfirm={() => set({ semanticSearchModel: pendingSearchModel })}
      />
    </main>
  )
}

AgentBehaviorPage.getLayout = page => (
  <AppLayout page='agents' title='Behavior' crumb='Agents'>
    {page}
  </AppLayout>
)

AgentBehaviorPage.pageConfig = {
  applyEffectiveOrgAndProjectIds: true
}

export default AgentBehaviorPage
