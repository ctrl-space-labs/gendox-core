import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import toast from 'react-hot-toast'
import { ArrowRight } from 'lucide-react'
import { useAuth } from 'src/authentication/useAuth'
import organizationService from 'src/gendox-sdk/organizationService'
import { getErrorMessage } from 'src/utils/errorHandler'
import { getToken, useRefreshProfile } from 'src/components/agent/useAgent'

/**
 * Create an organization: POST organizations { name, displayName, address, phone }, then the first agent.
 * The guard sends here a user who has no organization.
 */
const CreateOrganizationPage = () => {
  const router = useRouter()
  const { user } = useAuth()
  const refreshProfile = useRefreshProfile()
  const [fields, setFields] = useState({ name: '', displayName: '', address: '', phone: '' })
  const [nameError, setNameError] = useState(false)
  const [isCreating, setIsCreating] = useState(false)

  const set = (key, value) => setFields(f => ({ ...f, [key]: value }))
  const hasOrganizations = (user?.organizations?.length ?? 0) > 0
  const firstName = user?.firstName || user?.name?.split(' ')[0]

  const create = async () => {
    if (!fields.name.trim()) return setNameError(true)
    setIsCreating(true)
    try {
      const response = await organizationService.createOrganization({ ...fields, name: fields.name.trim() }, getToken())
      toast.success('Organization created')
      await refreshProfile()
      router.push(`/gendox/create-project/?organizationId=${response.data.id}`)
    } catch (error) {
      toast.error(`Couldn’t create the organization. ${getErrorMessage(error)}`)
      setIsCreating(false)
    }
  }

  return (
    <main className='center'>
      <div className='stack' style={{ width: '100%', maxWidth: 520 }}>
        <div className='row' style={{ gap: 10, fontWeight: 600 }}>
          <span className='mark' />
          Gendox
        </div>
        <div className='card card-b form' style={{ padding: 28 }}>
          <div>
            <h1 style={{ fontSize: 26 }}>{firstName ? `Welcome, ${firstName}` : 'Create an organization'}</h1>
            <p className='muted' style={{ marginTop: 8, lineHeight: 1.6 }}>
              {hasOrganizations
                ? 'A new home for another team. Agents, knowledge and members live in an organization.'
                : 'First, a home for your team. Agents, knowledge and members live in an organization. You can invite people later.'}
            </p>
          </div>
          <fieldset className='lock' disabled={isCreating}>
          <div className='field'>
            <label htmlFor='org-name'>Organization name</label>
            <input
              id='org-name'
              className='input'
              autoFocus
              placeholder='e.g. Acme Legal'
              value={fields.name}
              onChange={e => {
                set('name', e.target.value)
                setNameError(false)
              }}
              onKeyDown={e => e.key === 'Enter' && create()}
            />
            {nameError && <span className='err'>Give your organization a name.</span>}
          </div>
          <details>
            <summary className='muted sm' style={{ cursor: 'pointer' }}>
              Add invoice details (optional)
            </summary>
            <div className='form' style={{ marginTop: 12 }}>
              <div className='field'>
                <label>Legal name</label>
                <input className='input' value={fields.displayName} onChange={e => set('displayName', e.target.value)} />
              </div>
              <div className='form-grid'>
                <div className='field'>
                  <label>Address</label>
                  <input className='input' value={fields.address} onChange={e => set('address', e.target.value)} />
                </div>
                <div className='field'>
                  <label>Phone</label>
                  <input className='input' value={fields.phone} onChange={e => set('phone', e.target.value)} />
                </div>
              </div>
            </div>
          </details>
          </fieldset>
          <button aria-busy={isCreating} className='btn primary' style={{ height: 40 }} onClick={create} disabled={isCreating}>
            {isCreating ? 'Creating…' : 'Create organization'}
            <ArrowRight className='lucide' />
          </button>
          <p className='faint sm' style={{ textAlign: 'center' }}>
            Next: create your first agent.
          </p>
        </div>
        <p className='faint sm' style={{ textAlign: 'center' }}>
          {hasOrganizations ? (
            <Link className='link' href='/gendox/agent-home'>
              Back to Gendox
            </Link>
          ) : (
            'Were you invited? Open the link in the invitation email to join that team instead.'
          )}
        </p>
      </div>
    </main>
  )
}

CreateOrganizationPage.getLayout = page => page

export default CreateOrganizationPage
