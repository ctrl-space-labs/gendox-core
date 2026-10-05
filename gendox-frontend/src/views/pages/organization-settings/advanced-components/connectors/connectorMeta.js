// The external services Gendox can hold credentials for.
// `purpose` is what the user actually wants to know: what breaks without it.
// `fields` is the connector's config payload, as the migration that registered
// the type documents it — getting a name wrong here stores a config the backend
// will not read.
//
// The hex values are the services' own brand marks, not ours to theme.
const META = {
  GOOGLE_EARTH_ENGINE: {
    label: 'Google Earth Engine',
    icon: 'simple-icons:googleearth',
    color: '#4285F4',
    purpose: 'Satellite imagery for Earth Observation',
    fields: [
      {
        name: 'projectId',
        label: 'Google Cloud project id',
        required: true,
        tooltip: 'The Google Cloud project Earth Engine runs under'
      }
    ]
  },
  WEB_SCRAPE_FIRECRAWL: {
    label: 'Firecrawl',
    icon: 'mdi:fire',
    color: '#FF6B35',
    purpose: 'Reads websites added as content sources',
    fields: [
      {
        name: 'apiKey',
        label: 'Firecrawl API key',
        type: 'password',
        required: true,
        tooltip: 'Stored for this organization and used instead of the key Gendox provides'
      }
    ]
  }
}

const prettify = (type = '') =>
  type
    .toLowerCase()
    .split('_')
    .filter(Boolean)
    .map(w => w[0].toUpperCase() + w.slice(1))
    .join(' ')

export const connectorMeta = type =>
  META[type] ?? { label: prettify(type), icon: null, color: 'secondary.main', purpose: '' }

export const KNOWN_CONNECTORS = Object.keys(META)