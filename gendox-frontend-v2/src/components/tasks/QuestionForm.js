import { Plus, X } from 'lucide-react'
import FileTile from 'src/components/ui/FileTile'
import { KIND, nextOptionKey, withKind } from 'src/components/tasks/insightUtils'

/** The documents read together with a document or a question, each with a remove button */
export const SupportingList = ({ ids, names, onRemove, onAdd, openHref }) => (
  <>
    {ids.map(id => (
      <div key={id} className='item' style={{ padding: '8px 10px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)' }}>
        <FileTile name={names[id] ?? ''} />
        <span className='trunc' style={{ flex: 1 }}>
          {names[id] ?? 'Loading…'}
        </span>
        {openHref && (
          <a className='btn ghost s' href={openHref(id)}>
            Open
          </a>
        )}
        {onRemove && (
          <button className='btn ghost s icon' title='Remove' onClick={() => onRemove(id)}>
            <X className='lucide' />
          </button>
        )}
      </div>
    ))}
    {onAdd && (
      <button className='btn ghost s' style={{ alignSelf: 'flex-start' }} onClick={onAdd}>
        <Plus className='lucide' />
        Add supporting documents
      </button>
    )}
  </>
)

/**
 * A question's setup (QUESTION node: questionTitle, message, insightConfig, documentMetadata.supportingDocumentIds).
 * @param form - from questionForm(); onChange gets the next form
 * @param onPickSupport - opens the document picker; null hides supporting documents (new questions have none yet)
 */
const QuestionForm = ({ form, onChange, names = {}, onPickSupport, idPrefix = 'q' }) => {
  const set = changes => onChange({ ...form, ...changes })
  const setOption = (index, changes) => set({ options: form.options.map((o, i) => (i === index ? { ...o, ...changes } : o)) })
  const limit = form.kind === 'SCORE' ? 10 : 255

  return (
    <div className='form'>
      <div className='form-grid'>
        <div className='field'>
          <label htmlFor={`${idPrefix}-title`}>Column name</label>
          <input
            id={`${idPrefix}-title`}
            className='input'
            value={form.title}
            placeholder='e.g. Liability cap'
            onChange={e => set({ title: e.target.value })}
          />
          <span className='help'>Shown as the column header.</span>
        </div>
        <div className='field'>
          <label htmlFor={`${idPrefix}-mode`}>Answer as</label>
          <select id={`${idPrefix}-mode`} className='input' value={form.mode} onChange={e => set({ mode: e.target.value })}>
            <option value='AUTO'>Let the AI decide</option>
            <option value='GENERATED_TEXT'>Written answer</option>
            <option value='DECISION'>A decision</option>
          </select>
          <span className='help'>A decision gives one of fixed options, so the column can be compared and exported.</span>
        </div>
      </div>
      <div className='field'>
        <label htmlFor={`${idPrefix}-text`}>{form.mode === 'AUTO' ? 'Request' : 'Question'}</label>
        <textarea
          id={`${idPrefix}-text`}
          className='input'
          rows={4}
          value={form.text}
          placeholder='Ask one clear question about each document.'
          onChange={e => set({ text: e.target.value })}
        />
      </div>

      {form.mode === 'DECISION' && (
        <div className='form'>
          <div className='field'>
            <span className='lab'>Decision</span>
            <div className='pill-tabs' style={{ alignSelf: 'flex-start' }}>
              {['BOOLEAN', 'CHOICE', 'SCORE'].map(kind => (
                <button key={kind} className={form.kind === kind ? 'on' : ''} onClick={() => onChange(withKind(form, kind))}>
                  {KIND[kind]}
                </button>
              ))}
            </div>
          </div>
          <div className='field'>
            <span className='lab'>
              {form.kind === 'BOOLEAN' ? 'What each answer means' : form.kind === 'SCORE' ? 'Levels, lowest first' : 'Choices'}
            </span>
            {form.kind === 'BOOLEAN' ? (
              <div className='form-grid'>
                <div className='affix'>
                  <span>Yes</span>
                  <input
                    className='input'
                    aria-label='What Yes means'
                    value={form.booleanCriteria.true}
                    onChange={e => set({ booleanCriteria: { ...form.booleanCriteria, true: e.target.value } })}
                  />
                </div>
                <div className='affix'>
                  <span>No</span>
                  <input
                    className='input'
                    aria-label='What No means'
                    value={form.booleanCriteria.false}
                    onChange={e => set({ booleanCriteria: { ...form.booleanCriteria, false: e.target.value } })}
                  />
                </div>
              </div>
            ) : (
              <div className='stack' style={{ gap: 6 }}>
                {form.options.map((option, index) => (
                  <div key={index} className='opt-row'>
                    <span className='faint num sm'>{index + 1}</span>
                    <input
                      className='input'
                      value={option.label}
                      placeholder={`${form.kind === 'SCORE' ? 'Level' : 'Choice'} ${index + 1}`}
                      aria-label='Label'
                      onChange={e => setOption(index, { label: e.target.value })}
                    />
                    {form.kind === 'CHOICE' && (
                      <input
                        className='input mono'
                        value={option.key}
                        aria-label='Key'
                        title='The key stored for this choice'
                        onChange={e => setOption(index, { key: e.target.value })}
                      />
                    )}
                    <button
                      className='btn ghost s icon'
                      title={form.options.length <= 2 ? 'At least two are needed' : 'Remove'}
                      disabled={form.options.length <= 2}
                      onClick={() => set({ options: form.options.filter((_, i) => i !== index) })}
                    >
                      <X className='lucide' />
                    </button>
                  </div>
                ))}
                <button
                  className='btn ghost s'
                  style={{ alignSelf: 'flex-start' }}
                  disabled={form.options.length >= limit}
                  onClick={() =>
                    set({
                      options: [
                        ...form.options,
                        {
                          key: nextOptionKey(form.options),
                          label: `${form.kind === 'SCORE' ? 'Level' : 'Option'} ${form.options.length + 1}`
                        }
                      ]
                    })
                  }
                >
                  <Plus className='lucide' />
                  Add {form.kind === 'SCORE' ? 'level' : 'choice'}
                </button>
                {form.kind === 'CHOICE' && (
                  <span className='help'>
                    The label is what people read; the key is what the answer stores. Keep the key when you rename a label,
                    so exports stay the same.
                  </span>
                )}
              </div>
            )}
          </div>
          <div className='field'>
            <label htmlFor={`${idPrefix}-how`}>How to decide</label>
            <textarea
              id={`${idPrefix}-how`}
              className='input'
              rows={3}
              value={form.instructions}
              placeholder='The evidence to look for, and what to exclude. If empty, the question is used.'
              onChange={e => set({ instructions: e.target.value })}
            />
          </div>
        </div>
      )}

      {onPickSupport && (
        <div className='field'>
          <span className='lab'>Supporting documents</span>
          <span className='help' style={{ margin: '0 0 6px' }}>
            Read together with every document for this question, e.g. your standard terms to compare against.
          </span>
          <SupportingList
            ids={form.supportingDocumentIds}
            names={names}
            onRemove={id => set({ supportingDocumentIds: form.supportingDocumentIds.filter(x => x !== id) })}
            onAdd={onPickSupport}
          />
        </div>
      )}
    </div>
  )
}

export default QuestionForm
