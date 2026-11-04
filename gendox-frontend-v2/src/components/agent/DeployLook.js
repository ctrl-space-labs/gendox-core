import { useEffect, useState } from 'react'
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

// #RRGGBB, or #RRGGBBAA with transparency
const HEX_COLOR = /^#[0-9a-f]{6}([0-9a-f]{2})?$/i

// The theme's own colours (themes.css), shown until one is picked
const THEME_DEFAULTS = {
  LIGHT: { accentColor: '#08b68d', backgroundColor: '#f7f7f9' },
  DARK: { accentColor: '#08b68d', backgroundColor: '#1f2136' }
}

const pageTheme = () =>
  typeof document !== 'undefined' && document.documentElement.dataset.theme === 'light' ? 'LIGHT' : 'DARK'

const alphaOf = hex => (hex.length === 9 ? Math.round((parseInt(hex.slice(7), 16) / 255) * 100) : 100)

const withAlpha = (rgb, percent) =>
  percent >= 100 ? rgb : `${rgb}${Math.round((percent / 100) * 255).toString(16).padStart(2, '0')}`

/** A colour as a swatch, a hex field and an opacity slider; empty means the theme's own colour. */
const ColorField = ({ label, value, fallback, onChange, disabled }) => {
  const [text, setText] = useState(value)
  useEffect(() => setText(value), [value])

  const shown = value || fallback
  const rgb = shown.slice(0, 7)
  const alpha = alphaOf(shown)

  const typed = input => {
    setText(input)
    const hex = input.trim().startsWith('#') ? input.trim() : `#${input.trim()}`
    if (input.trim() === '') onChange('')
    else if (HEX_COLOR.test(hex)) onChange(hex.toLowerCase())
  }

  return (
    <div className='field'>
      <label>{label}</label>
      <div className='row' style={{ gap: 8, flexWrap: 'wrap' }}>
        <input
          type='color'
          className='look-color'
          value={rgb}
          disabled={disabled}
          aria-label={`${label} colour`}
          onChange={e => onChange(withAlpha(e.target.value, alpha))}
        />
        <input
          className='input mono sm look-hex'
          value={text}
          placeholder={`${fallback} (theme)`}
          disabled={disabled}
          aria-label={`${label} hex`}
          onChange={e => typed(e.target.value)}
          onBlur={() => setText(value)}
        />
        <input
          type='range'
          className='look-alpha'
          min='0'
          max='100'
          value={alpha}
          disabled={disabled}
          aria-label={`${label} opacity`}
          title={`Opacity ${alpha}%`}
          onChange={e => onChange(withAlpha(rgb, Number(e.target.value)))}
        />
        {value && !disabled && (
          <button type='button' className='btn ghost s' onClick={() => onChange('')}>
            Reset
          </button>
        )}
      </div>
    </div>
  )
}

/**
 * Deploy → Look and branding (#527): how the agent's chat looks in the widget, and the welcome message,
 * suggested questions and disclaimer every chat with the agent shows. Removing the branding is a plan
 * entitlement that Gendox sets, so only a super admin can choose it.
 */
const DeployLook = ({ look, onChange, onSave, onReset, isDirty, isSaving, canEdit, canRemoveBranding }) => {
  const set = (key, value) => onChange({ ...look, [key]: value })
  const defaults = THEME_DEFAULTS[look.theme === 'AUTO' || !look.theme ? pageTheme() : look.theme]
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
          <ColorField
            label='Accent'
            value={look.accentColor}
            fallback={defaults.accentColor}
            onChange={value => set('accentColor', value)}
          />
          <ColorField
            label='Background'
            value={look.backgroundColor}
            fallback={defaults.backgroundColor}
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
