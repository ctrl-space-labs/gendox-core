import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import useActiveScope from 'src/hooks/useActiveScope'
import useHasOrgRole from 'src/authentication/hooks/useHasOrgRole'
import organizationService from 'src/gendox-sdk/organizationService'
import { getErrorMessage } from 'src/utils/errorHandler'
import { getToken, useRefreshProfile } from 'src/components/agent/useAgent'
import OrgScope from 'src/components/organization/OrgScope'
import AppLayout from 'src/layouts/AppLayout'
import Dialog from 'src/components/ui/Dialog'
import Spinner from 'src/components/ui/Spinner'

const fieldsOf = organization => ({
  name: organization?.name || '',
  displayName: organization?.displayName || '',
  address: organization?.address || '',
  phone: organization?.phone || ''
})

/**
 * The organization's details: GET/PUT organizations/{o} { name, displayName, address, phone }.
 * Delete: PUT organizations/{o}/deactivate.
 */
const OrganizationSettingsPage = () => {
  const { organization, organizations, organizationId } = useActiveScope()
  const refreshProfile = useRefreshProfile()
  const canEdit = useHasOrgRole({ organizationId, roles: ['OP_UPDATE_ORGANIZATION'] })
  const canDelete = useHasOrgRole({ organizationId, roles: ['OP_DELETE_ORGANIZATION'] })

  const [saved, setSaved] = useState(null)
  const [fields, setFields] = useState(null)
  const [isSaving, setIsSaving] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [typed, setTyped] = useState('')

  useEffect(() => {
    if (!organizationId) return
    organizationService
      .getOrganizationById(organizationId, getToken())
      .then(response => {
        setSaved(fieldsOf(response.data))
        setFields(fieldsOf(response.data))
      })
      .catch(() => {
        setSaved(fieldsOf(organization))
        setFields(fieldsOf(organization))
      })
  }, [organizationId])

  if (!fields) {
    return (
      <main className='content'>
        <OrgScope tab='general' />
        <div className='center' style={{ padding: 60 }}>
          <Spinner />
        </div>
      </main>
    )
  }

  const set = (key, value) => setFields(f => ({ ...f, [key]: value }))
  const dirty = JSON.stringify(fields) !== JSON.stringify(saved)

  const save = async () => {
    if (!fields.name.trim()) return toast.error('The organization needs a name.')
    setIsSaving(true)
    try {
      const payload = { id: organizationId, ...fields, name: fields.name.trim() }
      await organizationService.updateOrganization(organizationId, payload, getToken())
      setSaved(fieldsOf(payload))
      setFields(fieldsOf(payload))
      await refreshProfile()
      toast.success('Organization saved')
    } catch (error) {
      toast.error(`Couldn’t save. ${getErrorMessage(error)}`)
    } finally {
      setIsSaving(false)
    }
  }

  const deleteOrganization = async () => {
    try {
      await organizationService.deactivateOrganizationById(organizationId, getToken())
      toast.success(`${saved.name} deleted`)
      const next = organizations.find(o => o.id !== organizationId)
      // a full load: the guard picks the next organization, or sends to create one
      window.location.href = next ? `/gendox/home/?organizationId=${next.id}` : '/gendox/create-organization/'
    } catch (error) {
      toast.error(`Couldn’t delete the organization. ${getErrorMessage(error)}`)
    }
  }

  const input = (key, props = {}) => (
    <input className='input' value={fields[key]} disabled={!canEdit} onChange={e => set(key, e.target.value)} {...props} />
  )

  return (
    <main className='content'>
      <OrgScope tab='general' />
      <div>
        <section className='sect' style={{ paddingTop: 8 }}>
          <header>
            <h2>Organization</h2>
            <p>Your team’s workspace. Agents, knowledge, members and billing all belong to it.</p>
          </header>
          <div className='card card-b form'>
            <div className='field'>
              <label>Name</label>
              {input('name')}
              <span className='help'>Shown in the app and in invitations.</span>
            </div>
          </div>
        </section>
        <section className='sect'>
          <header>
            <h2>Invoice details</h2>
            <p>Printed on your invoices. Use your company’s registered details.</p>
          </header>
          <div className='card card-b form'>
            <div className='field'>
              <label>Legal name</label>
              {input('displayName', { placeholder: 'Acme Legal Services S.A.' })}
            </div>
            <div className='form-grid'>
              <div className='field'>
                <label>Address</label>
                {input('address', { placeholder: 'Street, number, postcode, city, country' })}
              </div>
              <div className='field'>
                <label>Phone</label>
                {input('phone')}
              </div>
            </div>
            {canEdit && (
              <div className='row'>
                <span className='sp' />
                <button className='btn ghost' disabled={!dirty || isSaving} onClick={() => setFields(saved)}>
                  Discard
                </button>
                <button className='btn primary' disabled={!dirty || isSaving} onClick={save}>
                  {isSaving ? 'Saving…' : 'Save'}
                </button>
              </div>
            )}
          </div>
        </section>
        {canDelete && (
          <section className='sect'>
            <header>
              <h2>Danger zone</h2>
            </header>
            <div className='card danger-zone'>
              <div className='item'>
                <div style={{ flex: 1 }}>
                  <b>Delete {saved.name}</b>
                  <div className='muted sm'>
                    All agents, knowledge, conversations and tasks are deleted, and every member loses access.
                  </div>
                </div>
                <button
                  className='btn danger'
                  onClick={() => {
                    setTyped('')
                    setDeleteOpen(true)
                  }}
                >
                  Delete organization
                </button>
              </div>
            </div>
          </section>
        )}
      </div>

      <Dialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        size='s'
        title={`Delete ${saved.name}?`}
        footer={
          <>
            <button className='btn' onClick={() => setDeleteOpen(false)}>
              Cancel
            </button>
            <button className='btn danger-solid' disabled={typed !== saved.name} onClick={deleteOrganization}>
              Delete organization
            </button>
          </>
        }
      >
        <p className='muted' style={{ lineHeight: 1.6 }}>
          Its agents, their knowledge and all conversations will be deleted, and every member loses access. Your
          subscription is not cancelled automatically.
        </p>
        <div className='field' style={{ marginTop: 16 }}>
          <label>
            Type <b>{saved.name}</b> to confirm
          </label>
          <input className='input' value={typed} onChange={e => setTyped(e.target.value)} />
        </div>
      </Dialog>
    </main>
  )
}

OrganizationSettingsPage.getLayout = page => (
  <AppLayout page='organization' title='General' crumb='Organization'>
    {page}
  </AppLayout>
)

OrganizationSettingsPage.pageConfig = {
  applyEffectiveOrgAndProjectIds: true
}

export default OrganizationSettingsPage
