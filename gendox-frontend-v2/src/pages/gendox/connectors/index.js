import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { Earth, Flame, TriangleAlert } from 'lucide-react'
import useActiveScope from 'src/hooks/useActiveScope'
import useHasOrgRole from 'src/authentication/hooks/useHasOrgRole'
import organizationConnectorService from 'src/gendox-sdk/organizationConnectorService'
import { getErrorMessage } from 'src/utils/errorHandler'
import { getToken } from 'src/components/agent/useAgent'
import OrgScope from 'src/components/organization/OrgScope'
import AppLayout from 'src/layouts/AppLayout'
import ConfirmDialog from 'src/components/ui/ConfirmDialog'
import Dialog from 'src/components/ui/Dialog'

// the services Gendox can hold settings for; `field` is the config key the backend reads
const SERVICES = {
  GOOGLE_EARTH_ENGINE: {
    title: 'Google Earth Engine',
    icon: Earth,
    hue: 210,
    field: 'projectId',
    label: 'Cloud project ID',
    placeholder: 'e.g. my-gee-project-123',
    help: 'In Google Cloud Console, the ID of the project Earth Engine is registered under.',
    secret: false,
    about: 'Used by Earth observation tasks. Earth Engine usage is billed to your Google Cloud project.',
    missing: 'Without a project, Earth observation tasks can’t start Earth Engine for your organization.',
    unset: 'Not set up'
  },
  WEB_SCRAPE_FIRECRAWL: {
    title: 'Firecrawl',
    icon: Flame,
    hue: 20,
    field: 'apiKey',
    label: 'API key',
    placeholder: 'fc-…',
    help: 'From firecrawl.dev → API keys. Only its last 4 characters are shown after saving.',
    secret: true,
    about: 'Reads the websites you add under Integrations.',
    missing: 'Gendox reads websites with its own account. Add your key to read them with your own Firecrawl account.',
    unset: 'Gendox’s account'
  }
}

const shown = (service, value) => (service.secret ? `••••${String(value).slice(-4)}` : value)

const ConnectorDialog = ({ type, current, onClose, onSave }) => {
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
      title={service.title}
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
      toast.success(`${SERVICES[type].title} saved`)
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
                </p>
                {!loaded ? (
                  <span className='skel' style={{ width: 220, marginTop: 10 }} />
                ) : value ? (
                  <dl className='kv' style={{ marginTop: 10 }}>
                    <dt>{service.label}</dt>
                    <dd className='mono'>{shown(service, value)}</dd>
                  </dl>
                ) : (
                  <p className='sm' style={{ marginTop: 8, color: 'var(--text-2)' }}>
                    <TriangleAlert className='lucide' style={{ width: 13, height: 13, verticalAlign: '-2px' }} />{' '}
                    {service.missing}
                  </p>
                )}
              </div>
              {canEdit && loaded && (
                <div className='row'>
                  <button className='btn s' onClick={() => setEditing(type)}>
                    {value ? 'Change' : 'Set up'}
                  </button>
                  {value && (
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
        <ConnectorDialog type={editing} current={valueOf(editing)} onClose={() => setEditing(null)} onSave={save} />
      )}
      <ConfirmDialog
        open={Boolean(removing)}
        onClose={() => setRemoving(null)}
        title={`Remove ${removing ? SERVICES[removing].title : ''}?`}
        text={removing ? SERVICES[removing].missing : ''}
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
