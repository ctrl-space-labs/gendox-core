import { Check, ChevronsUpDown, KeyRound, TriangleAlert } from 'lucide-react'
import Link from 'next/link'
import Menu from 'src/components/ui/Menu'

// display names of the seeded providers; one we don't know is prettified (OPEN_AI → Open Ai)
const PROVIDERS = {
  OPEN_AI: 'OpenAI',
  ANTHROPIC_AI: 'Anthropic',
  GEMINI: 'Gemini',
  MISTRAL_AI: 'Mistral',
  COHERE: 'Cohere',
  GROQ: 'Groq',
  VOYAGE_AI: 'Voyage',
  NEBIUS: 'Nebius',
  XAI: 'xAI',
  PRIVATE_OLLAMA: 'Ollama',
  MOCK_GEMINI: 'Gemini (mock)'
}

// providers that take no key: you run Ollama yourself; the mock is for load tests
export const KEYLESS_PROVIDERS = ['PRIVATE_OLLAMA', 'MOCK_GEMINI']

export const providerLabel = name =>
  PROVIDERS[name] ??
  (name || '')
    .toLowerCase()
    .split('_')
    .filter(Boolean)
    .map(word => word[0].toUpperCase() + word.slice(1))
    .join(' ')

/**
 * Only FREE_MODEL models run on Gendox's own key (OrganizationModelKeyService); any other tier needs
 * the organization's key for that provider.
 * @param keys - GET organizations/{o}/model-keys → content
 */
export const needsKey = (model, keys = []) => {
  if (!model) return false
  const provider = model.aiModelProvider?.name
  if (model.modelTierType?.name === 'FREE_MODEL' || KEYLESS_PROVIDERS.includes(provider)) return false

  return !keys.some(key => key.aiModelProvider?.name === provider)
}

const TIERS = { FREE_MODEL: 'Included', STANDARD_MODEL: 'Standard', PREMIUM_MODEL: 'Premium' }

const ModelTag = ({ model, keys }) => {
  if (!model) return <span className='faint'>Choose a model</span>

  return (
    <span style={{ minWidth: 0, flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
      <span className='mono trunc'>{model.model || model.name}</span>
      <span className='faint sm row' style={{ gap: 6 }}>
        {providerLabel(model.aiModelProvider?.name)}
        {model.hostingRegion && ` · ${model.hostingRegion}`}
        {TIERS[model.modelTierType?.name] && ` · ${TIERS[model.modelTierType.name]}`}
        {needsKey(model, keys) && (
          <span className='row' style={{ gap: 4, color: 'var(--warn)' }}>
            · <KeyRound className='lucide' style={{ width: 12, height: 12 }} />
            Needs your key
          </span>
        )}
      </span>
    </span>
  )
}

/**
 * Pick one model of a type. The list is the project's models of that type (GET …/projects/{p}/ai-models).
 * @param value - the chosen model's name
 * @param keysHref - the Model providers page, offered at the end of the list
 */
const ModelPicker = ({ models = [], value, onChange, keys, disabled = false, title, keysHref }) => {
  const current = models.find(m => m.name === value)

  return (
    <Menu
      width={460}
      trigger={({ onClick }) => (
        <button type='button' className='modelpick' onClick={onClick} disabled={disabled}>
          <ModelTag model={current ?? (value ? { name: value } : null)} keys={keys} />
          <ChevronsUpDown className='lucide' />
        </button>
      )}
    >
      {title && <div className='h'>{title}</div>}
      <div style={{ maxHeight: 360, overflowY: 'auto' }}>
        {models.map(model => (
          <button
            key={model.id}
            type='button'
            className='mi tall'
            data-close-menu
            onClick={() => onChange(model.name)}
            style={{ height: 'auto', padding: '8px 10px', width: '100%', textAlign: 'left' }}
          >
            <ModelTag model={model} keys={keys} />
            {model.name === value && <Check className='lucide' />}
          </button>
        ))}
      </div>
      {keysHref && (
        <>
          <hr />
          <Link className='mi' href={keysHref}>
            <KeyRound className='lucide' />
            Add a provider key
          </Link>
        </>
      )}
    </Menu>
  )
}

export const ModelKeyWarning = ({ model, keys, keysHref }) =>
  needsKey(model, keys) ? (
    <span className='help' style={{ color: 'var(--warn)' }}>
      <TriangleAlert className='lucide' style={{ width: 13, height: 13, verticalAlign: '-2px' }} /> Add your{' '}
      {providerLabel(model.aiModelProvider?.name)} key in{' '}
      <Link className='link' href={keysHref}>
        Model providers
      </Link>
      , or the agent can’t use this model.
    </span>
  ) : null

export default ModelPicker
