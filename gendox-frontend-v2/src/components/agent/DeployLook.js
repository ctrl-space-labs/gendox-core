import { Monitor, Moon, Sun } from 'lucide-react'
import Spinner from 'src/components/ui/Spinner'

const MAX_SUGGESTED_QUESTIONS = 6

const THEMES = [
  ['LIGHT', 'Light', Sun],
  ['DARK', 'Dark', Moon],
  ['AUTO', 'Visitor’s device', Monitor]
]

const BRANDINGS = [
  ['STANDARD', 'Powered by Gendox', 'The standard line under the chat.'],
  ['SMALL', 'Small', 'The same line, in small print.'],
  ['NONE', 'No branding', 'Exclusive plans only. Gendox turns it on for your websites.']
]

/** The form's values from the agent's projectAgent.chatSettings */
export const lookOf = projectAgent => {
  const settings = projectAgent?.chatSettings || {}

  return {
    theme: settings.theme || 'AUTO',
    accentColor: settings.accentColor || '',
    backgroundColor: settings.backgroundColor || '',
    welcomeMessage: settings.welcomeMessage || '',
    suggestedQuestions: (settings.suggestedQuestions || []).join('\n'),
    showDisclaimer: Boolean(settings.disclaimer),
    disclaimer: settings.disclaimer || '',
    bubbleText: settings.bubbleText || null,
    branding: settings.branding || 'STANDARD'
  }
}

/** The form's values as the agent's chatSettings, as PUT …/projects/{p} saves them */
export const chatSettingsOf = look => ({
  theme: look.theme,
  accentColor: look.accentColor || null,
  backgroundColor: look.backgroundColor || null,
  welcomeMessage: look.welcomeMessage.trim() || null,
  suggestedQuestions: look.suggestedQuestions
    .split('\n')
    .map(question => question.trim())
    .filter(Boolean)
    .slice(0, MAX_SUGGESTED_QUESTIONS),
  bubbleText: look.bubbleText,
  disclaimer: look.showDisclaimer ? look.disclaimer.trim() || null : null,
  branding: look.branding
})

const ColorField = ({ label, value, onChange, disabled }) => (
  <div className='field'>
    <label>{label}</label>
    <div className='row' style={{ gap: 8 }}>
      <input
        type='color'
        className='look-color'
        value={value || '#08b68d'}
        disabled={disabled}
        aria-label={label}
        onChange={e => onChange(e.target.value)}
      />
      <span className='mono sm'>{value || 'Theme default'}</span>
      {value && !disabled && (
        <button type='button' className='btn ghost s' onClick={() => onChange('')}>
          Reset
        </button>
      )}
    </div>
  </div>
)

/**
 * Deploy → Look and branding (#527): how the agent's chat looks in the widget, and the welcome message,
 * suggested questions and disclaimer every chat with the agent shows. Removing the branding is a plan
 * entitlement that Gendox sets, so only a super admin can choose it.
 */
const DeployLook = ({ look, onChange, onSave, onReset, isDirty, isSaving, canEdit, canRemoveBranding }) => {
  const set = (key, value) => onChange({ ...look, [key]: value })
  const questionCount = look.suggestedQuestions.split('\n').filter(line => line.trim()).length

  return (
    <section className='sect'>
      <header>
        <h2>Look and branding</h2>
        <p>
          Make the chat look like your site. The theme and colours apply to the widget; the hello message, suggested
          questions and disclaimer show in every chat with this agent.
        </p>
      </header>
      <fieldset className='card card-b form lock' style={{ gap: 16 }} disabled={!canEdit || isSaving}>
        <div className='field'>
          <label>Theme</label>
          <div className='choice sm'>
            {THEMES.map(([value, label, Icon]) => (
              <label key={value}>
                <input
                  type='radio'
                  name='look-theme'
                  checked={look.theme === value}
                  onChange={() => set('theme', value)}
                />
                <Icon className='lucide' />
                <b>{label}</b>
              </label>
            ))}
          </div>
        </div>

        <div className='row' style={{ gap: 24, flexWrap: 'wrap' }}>
          <ColorField label='Accent' value={look.accentColor} onChange={value => set('accentColor', value)} />
          <ColorField
            label='Background'
            value={look.backgroundColor}
            onChange={value => set('backgroundColor', value)}
          />
        </div>

        <div className='field'>
          <label>Hello message</label>
          <input
            className='input'
            maxLength={500}
            placeholder='Hi, I’m the agent'
            value={look.welcomeMessage}
            onChange={e => set('welcomeMessage', e.target.value)}
          />
          <span className='help'>The first thing visitors read.</span>
        </div>

        <div className='field'>
          <label>Suggested questions</label>
          <textarea
            className='input'
            rows={3}
            placeholder={'Can I return an opened item after 30 days?\nWhere is my order?'}
            value={look.suggestedQuestions}
            onChange={e => set('suggestedQuestions', e.target.value)}
          />
          <span className='help'>
            One per line, up to {MAX_SUGGESTED_QUESTIONS}. Shown before the first message.
            {questionCount > MAX_SUGGESTED_QUESTIONS && ` Only the first ${MAX_SUGGESTED_QUESTIONS} are kept.`}
          </span>
        </div>

        <label className='check'>
          <input
            type='checkbox'
            checked={look.showDisclaimer}
            onChange={e => set('showDisclaimer', e.target.checked)}
          />
          <div>
            <b>Show a disclaimer</b>
            <span>Under the message box, instead of the usual note.</span>
          </div>
        </label>
        {look.showDisclaimer && (
          <textarea
            className='input'
            rows={2}
            maxLength={500}
            placeholder='Answers are written by AI and can be wrong.'
            value={look.disclaimer}
            onChange={e => set('disclaimer', e.target.value)}
          />
        )}

        <div className='field'>
          <label>Branding</label>
          <div className='choice sm'>
            {BRANDINGS.map(([value, label, help]) => (
              <label key={value}>
                <input
                  type='radio'
                  name='look-branding'
                  checked={look.branding === value}
                  disabled={value === 'NONE' && !canRemoveBranding && look.branding !== 'NONE'}
                  onChange={() => set('branding', value)}
                />
                <b>{label}</b>
                <span>{help}</span>
              </label>
            ))}
          </div>
        </div>

        <div className='row'>
          <button type='button' className='btn primary' disabled={!isDirty} onClick={onSave}>
            {isSaving && <Spinner size={14} />}
            Save
          </button>
          {isDirty && (
            <button type='button' className='btn ghost' onClick={onReset}>
              Discard changes
            </button>
          )}
        </div>
      </fieldset>
    </section>
  )
}

export default DeployLook
