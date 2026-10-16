import { Cloud, Database, GitBranch, Globe, Package } from 'lucide-react'
import WordPressIcon from 'src/components/ui/WordPressIcon'

/**
 * Integration types as IntegrationTypesConstants names them. The type is named plainly; `how` says how content travels.
 * API_INTEGRATION is named WordPress: the WordPress plugin is the only thing that speaks it today.
 * WEBSITE is not a backend type: a website with nothing connected, shown in the same list.
 * `floor` is the shortest schedule allowed (a crawled website can't run more than once a day).
 */
export const TYPES = {
  WEB_SCRAPE_INTEGRATION: { title: 'Crawled website', how: 'Gendox reads the pages you pick', icon: Globe, hue: 190, floor: 1440 },
  API_INTEGRATION: { title: 'WordPress', how: 'The plugin chooses posts and agents', icon: WordPressIcon, hue: 205 },
  GIT_INTEGRATION: { title: 'Git repository', how: 'Gendox reads new commits', icon: GitBranch, hue: 10 },
  AWS_S3_INTEGRATION: { title: 'Amazon S3', how: 'New files arrive through a queue', icon: Database, hue: 25 },
  GOOGLE_DRIVE_INTEGRATION: { title: 'Google Drive', how: '', icon: Cloud, hue: 48 },
  DROPBOX_INTEGRATIONS: { title: 'Dropbox', how: '', icon: Package, hue: 215 },
  WEBSITE: { title: 'Website', how: 'Nothing connected: Gendox doesn’t read it', icon: Globe, hue: 150, still: true }
}

const RANK = Object.keys(TYPES)

export const typeOf = type => TYPES[type] ?? { title: type, how: '', icon: Globe, hue: 0 }

export const IntegrationTile = ({ type, className = '' }) => {
  const { icon: Icon, hue } = typeOf(type)

  return (
    <span className={`ftype ${className}`} style={{ '--h': hue }}>
      <Icon className='lucide' />
    </span>
  )
}

export const configOf = integration => {
  try {
    return JSON.parse(integration?.config || '{}')
  } catch {
    return {}
  }
}

// runIntervalMinutes as a person says it; no interval means every pass of the scheduler
export const everyText = minutes => {
  if (!minutes) return 'Whenever Gendox checks'
  if (minutes % 10080 === 0) return minutes === 10080 ? 'Once a week' : `Every ${minutes / 10080} weeks`
  if (minutes % 1440 === 0) return minutes === 1440 ? 'Once a day' : `Every ${minutes / 1440} days`
  if (minutes % 60 === 0) return minutes === 60 ? 'Every hour' : `Every ${minutes / 60} hours`

  return `Every ${minutes} minutes`
}

// the schedules offered; the current one is kept even when it isn't one of them
export const everyOptions = (type, current) => {
  const options = typeOf(type).floor ? [1440, 2880, 10080, 20160, 43200] : [null, 15, 60, 360, 1440]
  if (current !== undefined && !options.includes(current)) options.push(current)

  return options
}

export const bareUrl = url => (url || '').replace(/^https?:\/\//, '').replace(/\/$/, '')

/**
 * One list: the integrations, named from the website that links to them, and the websites with nothing connected.
 * @param integrations - GET integrations?organizationId
 * @param websites - GET organizations/{o}/websites
 */
export const buildRows = (integrations = [], websites = []) => {
  const websiteOf = new Map(websites.filter(w => w.integrationId).map(w => [w.integrationId, w]))

  const rows = integrations.map(integration => {
    const type = integration.integrationType?.name ?? integration.integrationType
    const website = websiteOf.get(integration.id) ?? null
    const url = website?.url || integration.url || integration.queueName || ''

    return {
      id: integration.id,
      type,
      integration,
      website,
      title: website?.name || bareUrl(url).replace(/^github\.com\//, '').replace(/\.git$/, '') || integration.id.slice(0, 8),
      url,
      active: Boolean(integration.active)
    }
  })

  const loose = websites
    .filter(w => !w.integrationId)
    .map(website => ({
      id: `website-${website.id}`,
      type: 'WEBSITE',
      integration: null,
      website,
      title: website.name || bareUrl(website.url),
      url: website.url,
      active: false
    }))

  return [...rows, ...loose].sort((a, b) => RANK.indexOf(a.type) - RANK.indexOf(b.type) || a.title.localeCompare(b.title))
}

export const formatWhen = value =>
  value
    ? new Date(value).toLocaleString([], { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    : null
