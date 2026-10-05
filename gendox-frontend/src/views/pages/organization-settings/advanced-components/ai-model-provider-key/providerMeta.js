// Display names and brand marks for the seeded providers.
// A provider we do not know still renders, with a letter avatar.
// `noKey` is the reason a provider takes no key from you. Those are left out of
// the list entirely — a row you can never act on is a row worth not drawing.
// A key stored against one anyway still shows, so it can be removed.
//
// The hex values here are other companies' brand marks, not ours: they are the
// one place in this screen that does not take a theme token, because a logo's
// colour is not ours to theme. Everything else uses tokens.
const META = {
  OPEN_AI: { label: 'OpenAI', icon: 'simple-icons:openai', color: '#10A37F' },
  ANTHROPIC_AI: { label: 'Anthropic', icon: 'simple-icons:anthropic', color: '#D97757' },
  GEMINI: { label: 'Gemini', icon: 'simple-icons:googlegemini', color: '#4285F4' },
  MISTRAL_AI: { label: 'Mistral', icon: 'simple-icons:mistralai', color: '#FA520F' },

  // the only Cohere mark on Iconify carries its own colours, so it sits on white
  COHERE: { label: 'Cohere', icon: 'thesvg-color:cohere', color: 'common.white', brandMark: true },
  GROQ: { label: 'Groq', icon: 'bxl:groq-ai', color: '#F55036' },
  VOYAGE_AI: { label: 'Voyage', icon: 'thesvg:voyage', color: '#5B5BD6' },
  NEBIUS: { label: 'Nebius', icon: 'thesvg:nebius', color: '#1D4ED8' },
  XAI: { label: 'xAI', icon: 'simple-icons:x', color: '#111111' },
  PRIVATE_OLLAMA: {
    label: 'Ollama',
    icon: 'simple-icons:ollama',
    color: 'secondary.main',
    noKey: 'You run Ollama yourself, so there is no key to give Gendox.'
  },
  MOCK_GEMINI: {
    label: 'Gemini (mock)',
    icon: null,
    color: 'secondary.main',
    noKey: 'A stand-in used for load testing. It answers instantly and ignores any key.'
  }
}

// OPEN_AI -> Open Ai, for anything seeded later that we have not named here
const prettify = (name = '') =>
  name
    .toLowerCase()
    .split('_')
    .filter(Boolean)
    .map(w => w[0].toUpperCase() + w.slice(1))
    .join(' ')

export const providerMeta = name => META[name] ?? { label: prettify(name), icon: null, color: 'secondary.main' }

// a key is only ever shown by its tail, enough to tell two keys apart
export const maskProviderKey = key => (key ? `••••••••${key.slice(-4)}` : '')