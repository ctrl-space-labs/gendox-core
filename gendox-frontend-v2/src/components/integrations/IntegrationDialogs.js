import { useEffect, useState } from 'react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { ArrowLeft, Info } from 'lucide-react'
import useActiveScope from 'src/hooks/useActiveScope'
import integrationService from 'src/gendox-sdk/integrationService'
import organizationWebSiteService from 'src/gendox-sdk/organizationWebSiteService'
import webScrapeService from 'src/gendox-sdk/webScrapeService'
import { getErrorMessage } from 'src/utils/errorHandler'
import { isValidWebsiteUrl } from 'src/utils/validators'
import { getToken } from 'src/components/agent/useAgent'
import ConfirmDialog from 'src/components/ui/ConfirmDialog'
import Dialog from 'src/components/ui/Dialog'
import { IntegrationTile, bareUrl, configOf, everyOptions, everyText, typeOf } from 'src/components/integrations/integrationUtils'

// the kinds that can be added here; WordPress is set up from the plugin, so it leads to a guide
const ADDABLE = ['WEB_SCRAPE_INTEGRATION', 'API_INTEGRATION']

/**
 * Add an integration. A crawled website: POST organizations/{o}/websites/web-scrape
 * { name, url, projectId, runIntervalMinutes, crawlPageLimit } creates the website and its integration together.
 * @param onAdded - (url) => …, with the website's address once it is added
 * @param initialType - opens on this kind's form (e.g. 'WEB_SCRAPE_INTEGRATION') instead of the choice of kinds
 */
export const AddIntegrationDialog = ({ open, onClose, onAdded, budget, initialType = null }) => {
  const { organizationId, projects, projectId, href } = useActiveScope()
  const [type, setType] = useState(null)
  const [fields, setFields] = useState({})
  const [urlError, setUrlError] = useState(false)
  const [isAdding, setIsAdding] = useState(false)

  useEffect(() => {
    if (!open) return
    setType(initialType)
    setUrlError(false)
    setFields({ name: '', url: '', projectId: projectId || projects[0]?.id || '', every: '10080', limit: '100' })
  }, [open])

  const set = (key, value) => setFields(f => ({ ...f, [key]: value }))

  const add = async () => {
    if (!fields.name.trim()) return toast.error('Give the website a name.')
    if (!isValidWebsiteUrl(fields.url.trim())) return setUrlError(true)
    setIsAdding(true)
    try {
      await organizationWebSiteService.createWebScrapeWebSite(
        organizationId,
        {
          name: fields.name.trim(),
          url: fields.url.trim(),
          projectId: fields.projectId,
          crawlPageLimit: Number(fields.limit),
          runIntervalMinutes: Number(fields.every)
        },
        getToken()
      )
      toast.success('Website added. Now find its pages.')
      await onAdded?.(fields.url.trim())
      onClose()
    } catch (error) {
      toast.error(`Couldn’t add the website. ${getErrorMessage(error)}`)
    } finally {
      setIsAdding(false)
    }
  }

  return (
    <Dialog
      busy={isAdding}
      open={open}
      onClose={onClose}
      title='Add an integration'
      subtitle='Keep an agent’s knowledge in sync with another place. Gendox checks it on a schedule.'
      footer={
        <>
          {type && (
            <button className='btn ghost' onClick={() => setType(null)}>
              <ArrowLeft className='lucide' />
              Back
            </button>
          )}
          <span className='sp' />
          <button className='btn' onClick={onClose}>
            Cancel
          </button>
          {type === 'WEB_SCRAPE_INTEGRATION' && (
            <button aria-busy={isAdding} className='btn primary' onClick={add} disabled={isAdding || !projects.length}>
              {isAdding ? 'Adding…' : 'Add and find pages'}
            </button>
          )}
        </>
      }
    >
      {!type && (
        <div className='choice'>
          {ADDABLE.map(key => {
            const t = typeOf(key)
            const Icon = t.icon

            return (
              <label key={key}>
                <input type='radio' name='integration-type' onChange={() => setType(key)} />
                <Icon className='lucide' />
                <b>{t.title}</b>
                <span>{t.how}</span>
              </label>
            )
          })}
        </div>
      )}

      {type === 'WEB_SCRAPE_INTEGRATION' && (
        <div className='form'>
          <div className='row'>
            <IntegrationTile type={type} />
            <b style={{ fontWeight: 550 }}>Crawled website</b>
            <span className='faint sm'>· {typeOf(type).how}</span>
          </div>
          <div className='form-grid'>
            <div className='field'>
              <label>Name</label>
              <input className='input' placeholder='Acme store' value={fields.name} onChange={e => set('name', e.target.value)} />
            </div>
            <div className='field'>
              <label>Website address</label>
              <input
                className='input'
                placeholder='https://acme.com'
                value={fields.url}
                onChange={e => {
                  set('url', e.target.value)
                  setUrlError(false)
                }}
              />
              {urlError && <span className='err'>Start with http:// or https://, for example https://acme.com</span>}
            </div>
          </div>
          <div className='field'>
            <label>Adds to the knowledge of</label>
            <select className='input' value={fields.projectId} onChange={e => set('projectId', e.target.value)}>
              {projects.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <div className='form-grid'>
            <div className='field'>
              <label>Read the pages again</label>
              <select className='input' value={fields.every} onChange={e => set('every', e.target.value)}>
                {everyOptions(type).map(m => (
                  <option key={m} value={m}>
                    {everyText(m)}
                  </option>
                ))}
              </select>
            </div>
            <div className='field'>
              <label>A deep search visits at most</label>
              <div className='affix'>
                <input className='input' type='number' min={1} value={fields.limit} onChange={e => set('limit', e.target.value)} />
                <span>pages</span>
              </div>
            </div>
          </div>
          <p className='faint sm'>
            <Info className='lucide' style={{ width: 13, height: 13, verticalAlign: '-2px' }} /> Next, Gendox lists the
            site’s pages and you pick which ones to read. Each page read counts against your allowance
            {budget?.remainingPages != null ? `: ${budget.remainingPages.toLocaleString()} of ${budget.maxPages.toLocaleString()} left this period.` : '.'}
          </p>
        </div>
      )}

      {type === 'API_INTEGRATION' && (
        <ol className='steps-v'>
          <li>
            <div>
              <b>Create an API key for the site</b>
              <p>
                In{' '}
                <Link className='link' href={href('/gendox/api-keys')}>
                  API keys
                </Link>
                . Name it after the site, so you know what to revoke later.
              </p>
            </div>
          </li>
          <li>
            <div>
              <b>Install the Gendox AI Agent plugin and paste the key</b>
              <p>In the plugin’s settings, choose which posts go to which agent.</p>
            </div>
          </li>
          <li>
            <div>
              <b>The site appears here by itself</b>
              <p>Gendox then fetches the posts the plugin assigns, each time it checks.</p>
            </div>
          </li>
        </ol>
      )}
    </Dialog>
  )
}

/**
 * Edit: the website's name (PUT …/websites/{w}), the schedule (PUT …/integrations/{id}/schedule) and, for a crawled
 * website, the deep-search limit (PUT …/web-scrape/settings). A website with nothing connected: its name and address.
 */
export const EditIntegrationDialog = ({ row, onClose, onSaved }) => {
  const { organizationId } = useActiveScope()
  const [fields, setFields] = useState({})
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (!row) return
    setFields({
      name: row.website?.name ?? '',
      url: row.website?.url ?? '',
      every: row.integration?.runIntervalMinutes ?? '',
      limit: configOf(row.integration).crawlPageLimit ?? ''
    })
  }, [row])

  if (!row) return null
  const set = (key, value) => setFields(f => ({ ...f, [key]: value }))
  const scrape = row.type === 'WEB_SCRAPE_INTEGRATION'

  const save = async () => {
    setIsSaving(true)
    const token = getToken()
    try {
      if (row.website && (fields.name.trim() !== row.website.name || (row.type === 'WEBSITE' && fields.url.trim() !== row.website.url))) {
        // the endpoint writes both columns, so the address travels with the name
        await organizationWebSiteService.updateOrganizationWebSite(
          organizationId,
          row.website.id,
          { organizationId, name: fields.name.trim() || row.website.name, url: fields.url.trim() || row.website.url },
          token
        )
      }
      if (row.integration) {
        await integrationService.setIntegrationSchedule(
          organizationId,
          row.integration.id,
          { runIntervalMinutes: fields.every === '' ? null : Number(fields.every) },
          token
        )
      }
      if (scrape && fields.limit !== '') {
        await webScrapeService.updateSettings(organizationId, row.integration.id, { crawlPageLimit: Number(fields.limit) }, token)
      }
      toast.success('Saved')
      await onSaved?.()
      onClose()
    } catch (error) {
      toast.error(`Couldn’t save. ${getErrorMessage(error)}`)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog
      busy={isSaving}
      open
      onClose={onClose}
      size='s'
      title={`Edit ${row.title}`}
      footer={
        <>
          <button className='btn' onClick={onClose}>
            Cancel
          </button>
          <button aria-busy={isSaving} className='btn primary' onClick={save} disabled={isSaving}>
            {isSaving ? 'Saving…' : 'Save'}
          </button>
        </>
      }
    >
      <div className='form'>
        {row.website && (
          <div className='field'>
            <label>Name</label>
            <input className='input' value={fields.name} onChange={e => set('name', e.target.value)} />
          </div>
        )}
        {row.type === 'WEBSITE' ? (
          <div className='field'>
            <label>Website address</label>
            <input className='input' value={fields.url} onChange={e => set('url', e.target.value)} />
          </div>
        ) : (
          <>
            <dl className='kv'>
              <dt>{typeOf(row.type).title}</dt>
              <dd className='trunc'>{bareUrl(row.url)}</dd>
            </dl>
            <div className='field'>
              <label>{scrape ? 'Read the pages again' : 'Check for changes'}</label>
              <select className='input' value={fields.every ?? ''} onChange={e => set('every', e.target.value)}>
                {everyOptions(row.type, row.integration?.runIntervalMinutes ?? null).map(m => (
                  <option key={m ?? 'none'} value={m ?? ''}>
                    {everyText(m)}
                  </option>
                ))}
              </select>
              <span className='help'>
                {scrape ? 'At most once a day for websites, since every read is counted.' : 'To stop it running on its own, switch it off.'}
              </span>
            </div>
            {scrape && (
              <div className='field'>
                <label>A deep search visits at most</label>
                <div className='affix'>
                  <input className='input' type='number' min={1} value={fields.limit} onChange={e => set('limit', e.target.value)} />
                  <span>pages</span>
                </div>
              </div>
            )}
            <p className='faint sm'>
              {row.type === 'API_INTEGRATION'
                ? 'The address can’t change: it’s how Gendox recognises the plugin.'
                : 'To read another address, add a new integration.'}
            </p>
          </>
        )}
      </div>
    </Dialog>
  )
}

/**
 * Remove: DELETE organizations/{o}/integrations/{id} (documents stay; a linked website stays, with nothing connected),
 * or, for a website with nothing connected, DELETE organizations/{o}/websites/{w}.
 */
export const RemoveIntegrationDialog = ({ row, onClose, onRemoved }) => {
  const { organizationId } = useActiveScope()
  if (!row) return null

  const text =
    row.type === 'WEBSITE'
      ? `Nothing is connected to ${bareUrl(row.url)}, so nothing else changes.`
      : [
          'Content stops arriving and Gendox forgets this source.',
          'The documents it already added stay in the agent’s knowledge; delete them there if you no longer need them.',
          row.website && `${bareUrl(row.website.url)} stays in the list as a website with nothing connected.`,
          row.type === 'API_INTEGRATION' &&
            'The plugin adds it again the next time it connects; deactivate the plugin or revoke its key to stop it for good.'
        ]
          .filter(Boolean)
          .join(' ')

  const remove = async () => {
    try {
      if (row.type === 'WEBSITE') await organizationWebSiteService.deleteOrganizationWebSite(organizationId, row.website.id, getToken())
      else await integrationService.deleteIntegration(organizationId, row.integration.id, getToken())
      toast.success(row.type === 'WEBSITE' ? 'Website removed' : 'Removed. Its documents stay.')
      await onRemoved?.()
    } catch (error) {
      toast.error(`Couldn’t remove it. ${getErrorMessage(error)}`)
    }
  }

  return <ConfirmDialog open onClose={onClose} title={`Remove ${row.title}?`} text={text} confirmLabel='Remove' onConfirm={remove} />
}
