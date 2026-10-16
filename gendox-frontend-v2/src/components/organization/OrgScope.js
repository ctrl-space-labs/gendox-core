import { useEffect, useState } from 'react'
import Link from 'next/link'
import useActiveScope from 'src/hooks/useActiveScope'
import subscriptionPlanService from 'src/gendox-sdk/subscriptionPlanService'
import { getToken } from 'src/components/agent/useAgent'
import Avatar from 'src/components/ui/Avatar'

// the organization's settings, one page each
export const ORG_TABS = [
  { id: 'general', title: 'General', path: '/gendox/organization-settings' },
  { id: 'members', title: 'Members', path: '/gendox/organization-members' },
  { id: 'plan', title: 'Plan & usage', path: '/gendox/plan' },
  { id: 'api', title: 'API keys', path: '/gendox/api-keys' },
  { id: 'providers', title: 'Model providers', path: '/gendox/model-providers' },
  { id: 'connectors', title: 'Connected services', path: '/gendox/connectors' }
]

/**
 * The header of the organization's settings pages, with their tabs.
 * @param tab - the tab to highlight
 */
const OrgScope = ({ tab }) => {
  const { organization, organizationId, href } = useActiveScope()
  const [planName, setPlanName] = useState('')

  useEffect(() => {
    if (!organizationId) return
    subscriptionPlanService
      .getOrganizationPlans(organizationId, getToken())
      .then(response => setPlanName(response.data?.subscriptionPlan?.name || ''))
      .catch(() => setPlanName(''))
  }, [organizationId])

  if (!organization) return null

  return (
    <div className='scope'>
      <div className='scope-top'>
        <Avatar name={organization.name} seed={organization.id} size='l' />
        <div style={{ minWidth: 0 }}>
          <h1>{organization.name}</h1>
          <p className='muted sm'>Organization settings{planName ? ` · ${planName}` : ''}</p>
        </div>
      </div>
      <nav className='subnav'>
        {ORG_TABS.map(t => (
          <Link key={t.id} href={href(t.path)} className={t.id === tab ? 'on' : ''}>
            {t.title}
          </Link>
        ))}
      </nav>
    </div>
  )
}

export default OrgScope
