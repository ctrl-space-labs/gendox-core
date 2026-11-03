import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { BookOpen, Earth, Flame, TriangleAlert } from 'lucide-react'
import useActiveScope from 'src/hooks/useActiveScope'
import commonConfig from 'src/configs/common.config'
import useHasOrgRole from 'src/authentication/hooks/useHasOrgRole'
import organizationConnectorService from 'src/gendox-sdk/organizationConnectorService'
import { getErrorMessage } from 'src/utils/errorHandler'
import { getToken } from 'src/components/agent/useAgent'
import OrgScope from 'src/components/organization/OrgScope'
import AppLayout from 'src/layouts/AppLayout'
import ConfirmDialog from 'src/components/ui/ConfirmDialog'
import Dialog from 'src/components/ui/Dialog'

// the services Gendox can hold settings for; `field` is the config key the backend reads.
// Earth Engine needs a project to run at full rate; a Firecrawl key is optional (Gendox reads with its own account).
const SERVICES = {
  GOOGLE_EARTH_ENGINE: {
    title: 'Google Earth Engine',
    icon: Earth,
    hue: 210,
    field: 'projectId',
    label: 'Cloud project ID',
    placeholder: 'e.g. my-gee-project-123',
    subtitle: org => `The Google Cloud project used when Earth Engine starts for ${org}.`,
    help: 'In Google Cloud Console, copy the ID shown next to the project name. Earth Engine must be enabled for it.',
    secret: false,
    about: 'Used by Earth observation tasks. Earth Engine usage is billed to your Google Cloud project.',
    missing: 'Without a project, tasks run on a shared, rate-limited tier.',
    warnWhenMissing: true,
    unset: 'Not set up',
    setUp: 'Set up',
    change: 'Change',
    guide: `${commonConfig.gendoxDocsUrl}/earth-observation/gee-project-setup`,
    saved: 'Saved. Open Earth observation tasks reconnect to Google.',
    removeText: 'Earth observation tasks will use the shared, rate-limited tier.'
  },
  WEB_SCRAPE_FIRECRAWL: {
    title: 'Firecrawl',
    dialogTitle: 'Firecrawl API key',
    icon: Flame,
    hue: 20,
    field: 'apiKey',
    label: 'API key',
    placeholder: 'fc-…',
    subtitle: org => `Used for every website ${org} reads.`,
    help: 'From firecrawl.dev → API keys. Only its last 4 characters are shown after saving.',
    secret: true,
    about: 'Reads the websites you add under Integrations.',
    aboutSet: 'Pages are read with your Firecrawl account. Your plan’s monthly page allowance still applies.',
    missing: 'Gendox uses its own account. Add your key to read with your own Firecrawl account instead.',
    unset: 'Gendox’s account',
    setUp: 'Use my key',
    change: 'Change key',
    removeTitle: 'Remove your Firecrawl key?',
    saved: 'Saved. Websites are now read with your Firecrawl account.',
    removeText: 'Websites are read with Gendox’s account again.'
  }
}

const shown = (service, value) => (service.secret ? `••••${String(value).slice(-4)}` : value)

const ConnectorDialog = ({ type, current, organizationName, onClose, onSave }) => {
  const service = SERVICES[type]
  const [value, setValue] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (type) setValue(service.secret ? '' : current || '')
  }, [type])

  if (!service) return null

  const save = async () => {
    if (!value.trim()) return
    setIsSaving(true)
    await onSave(value.trim())
    setIsSaving(false)
  }

  return (
    <Dialog
      busy={isSaving}
      open
      onClose={onClose}
      size='s'
      title={service.dialogTitle ?? service.title}
      subtitle={service.subtitle(organizationName)}
      footer={
        <>
          <button className='btn' onClick={onClose}>
            Cancel
          </button>
          <button aria-busy={isSaving} className='btn primary' onClick={save} disabled={!value.trim() || isSaving}>
            {isSaving ? 'Saving…' : 'Save'}
          </button>
        </>
      }
    >
      <div className='field'>
        <label>{service.label}</label>
        <input
          className='input mono'
          type={service.secret ? 'password' : 'text'}
          autoComplete='off'
          placeholder={service.placeholder}
          value={value}
          onChange={e => setValue(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && save()}
        />
        <span className='help'>{service.help}</span>
      </div>
    </Dialog>
  )
}

/**
 * Outside services the organization's agents and tasks use (OrganizationConnector):
 * GET organizations/{o}/connectors, PUT …/connectors/{type} { connectorType, isActive, config }, DELETE …/connectors/{type}.
 */
const ConnectorsPage = () => {
  const { organization, organizationId, href } = useActiveScope()
  const canEdit = useHasOrgRole({ organizationId, roles: ['OP_UPDATE_ORGANIZATION'] })
  const [connectors, setConnectors] = useState(null) // null while loading
  const [editing, setEditing] = useState(null)
  const [removing, setRemoving] = useState(null)

  const load = useCallback(() => {
    if (!organizationId) return
    organizationConnectorService
      .getOrganizationConnectors(organizationId, getToken())
      .then(r => setConnectors(r.data?.content ?? r.data ?? []))
      .catch(() => setConnectors([]))
  }, [organizationId])

  useEffect(() => {
    load()
  }, [load])

  const valueOf = type => {
    const connector = (connectors ?? []).find(c => (c.connectorType?.name ?? c.connectorType) === type)

    return connector?.config?.[SERVICES[type].field] || null
  }

  const save = async value => {
    const type = editing
    try {
      await organizationConnectorService.upsertOrganizationConnector(
        organizationId,
        type,
        { organizationId, connectorType: type, isActive: true, config: { [SERVICES[type].field]: value } },
        getToken()
      )
      toast.success(SERVICES[type].saved)
      setEditing(null)
      load()
    } catch (error) {
      toast.error(`Couldn’t save. ${getErrorMessage(error)}`)
    }
  }

  const remove = async type => {
    try {
      await organizationConnectorService.deleteOrganizationConnector(organizationId, type, getToken())
      toast.success(`${SERVICES[type].title} removed`)
      load()
    } catch (error) {
      toast.error(`Couldn’t remove it. ${getErrorMessage(error)}`)
    }
  }

  return (
    <main className='content'>
      <OrgScope tab='connectors' />
      <div>
        <h2>Connected services</h2>
        <p className='muted' style={{ marginTop: 4 }}>
          Outside services your agents and tasks can use. They apply to everyone in{' '}
          {organization?.name || 'the organization'}.
        </p>
      </div>

      {Object.entries(SERVICES).map(([type, service]) => {
        const loaded = connectors !== null
        const value = valueOf(type)
        const Icon = service.icon

        return (
          <div className='card' key={type}>
            <div className='item' style={{ flexWrap: 'wrap', alignItems: 'flex-start' }}>
              <span className='avatar' style={{ '--h': service.hue }}>
                <Icon className='lucide' />
              </span>
              <div style={{ flex: 1, minWidth: 240 }}>
                <div className='row' style={{ gap: 8 }}>
                  <b style={{ fontWeight: 550 }}>{service.title}</b>
                  {!loaded ? (
                    <span className='skel' style={{ width: 64, height: 22, borderRadius: 99 }} />
                  ) : value ? (
                    <span className='badge dot ok'>Active</span>
                  ) : (
                    <span className='badge'>{service.unset}</span>
                  )}
                </div>
                <p className='muted sm' style={{ marginTop: 2 }}>
                  {service.about}
                  {loaded && !service.warnWhenMissing && ` ${value ? service.aboutSet : service.missing}`}
                </p>
                {!loaded ? (
                  <span className='skel' style={{ width: 220, marginTop: 10 }} />
                ) : value ? (
                  <dl className='kv' style={{ marginTop: 10 }}>
                    <dt>{service.label}</dt>
                    <dd className='mono'>{shown(service, value)}</dd>
                  </dl>
                ) : (
                  service.warnWhenMissing && (
                    <p className='sm' style={{ marginTop: 8, color: 'var(--warn)' }}>
                      <TriangleAlert className='lucide' style={{ width: 13, height: 13, verticalAlign: '-2px' }} />{' '}
                      {service.missing}
                    </p>
                  )
                )}
              </div>
              {(service.guide || (canEdit && loaded)) && (
                <div className='row'>
                  {service.guide && (
                    <a className='btn ghost s' href={service.guide} target='_blank' rel='noopener noreferrer'>
                      <BookOpen className='lucide' />
                      Setup guide
                    </a>
                  )}
                  {canEdit && loaded && (
                    <button className='btn s' onClick={() => setEditing(type)}>
                      {value ? service.change : service.setUp}
                    </button>
                  )}
                  {canEdit && loaded && value && (
                    <button className='btn ghost s' onClick={() => setRemoving(type)}>
                      Remove
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        )
      })}

      <p className='faint sm'>
        Websites, WordPress, Git and S3 that keep knowledge in sync are under{' '}
        <Link className='link' href={href('/gendox/integrations')}>
          Integrations
        </Link>
        .
      </p>

      {editing && (
        <ConnectorDialog
          type={editing}
          current={valueOf(editing)}
          organizationName={organization?.name || 'the organization'}
          onClose={() => setEditing(null)}
          onSave={save}
        />
      )}
      <ConfirmDialog
        open={Boolean(removing)}
        onClose={() => setRemoving(null)}
        title={removing ? SERVICES[removing].removeTitle ?? `Remove ${SERVICES[removing].title}?` : ''}
        text={removing ? SERVICES[removing].removeText : ''}
        confirmLabel='Remove'
        onConfirm={() => remove(removing)}
      />
    </main>
  )
}

ConnectorsPage.getLayout = page => (
  <AppLayout page='organization' title='Connected services' crumb='Organization'>
    {page}
  </AppLayout>
)

ConnectorsPage.pageConfig = {
  applyEffectiveOrgAndProjectIds: true
}

export default ConnectorsPage
