import { WEB_SCRAPE_INTEGRATION } from '../integrations/integrationMeta'

export const maskKey = key => (key ? `••••${key.slice(-4)}` : '')

// these lists are full of rows whose name was never set to anything but the url
export const shortName = website =>
  website.name === website.url ? website.url.replace(/^https?:\/\//, '') : website.name

/**
 * How content reaches Gendox from a website — the only thing that differs
 * between these rows. Every website may run the widget, so that is said once in
 * the summary instead of repeated on every row.
 *
 * Deliberately says nothing about WordPress or Firecrawl: today a pushing site
 * is the WordPress plugin and a read site is crawled by Firecrawl, but the row
 * describes the direction, which does not change when the tool does.
 */
export const deliveryOf = (website, integrations, apiKeys) => {
  const integration = website.integrationId ? integrations.find(i => i.id === website.integrationId) ?? null : null

  if (integration?.integrationType?.name === WEB_SCRAPE_INTEGRATION) {
    return {
      kind: 'crawled',
      integration,
      label: 'Read by Gendox',
      detail: 'Pages you pick are fetched on a schedule',
      icon: 'mdi:cloud-download-outline',
      color: 'primary.main'
    }
  }

  const apiKey = website.apiKeyId ? apiKeys.find(k => k.id === website.apiKeyId) ?? null : null

  if (integration || apiKey) {
    return {
      kind: 'pushed',
      integration,
      apiKey,
      label: 'Sends content',
      detail: apiKey ? `Pushed in with key ${maskKey(apiKey.apiKey)}` : 'Pushed in with an API key',
      icon: 'mdi:cloud-upload-outline',
      color: 'info.main'
    }
  }

  return {
    kind: 'widget',
    integration: null,
    apiKey: null,
    label: 'Widget only',
    detail: 'Nothing is read from this site',
    icon: 'mdi:web',
    color: 'secondary.main'
  }
}

export const isCrawled = delivery => delivery.kind === 'crawled'
