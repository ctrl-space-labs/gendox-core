import { useEffect, useState } from 'react'
import { ArrowUpRight, Sparkles } from 'lucide-react'
import useActiveScope from 'src/hooks/useActiveScope'
import subscriptionPlanService from 'src/gendox-sdk/subscriptionPlanService'
import organizationService from 'src/gendox-sdk/organizationService'
import organizationWebSiteService from 'src/gendox-sdk/organizationWebSiteService'
import webScrapeService from 'src/gendox-sdk/webScrapeService'
import integrationService from 'src/gendox-sdk/integrationService'
import { getToken } from 'src/components/agent/useAgent'
import { formatDate } from 'src/components/knowledge/documentUtils'
import OrgScope from 'src/components/organization/OrgScope'
import AppLayout from 'src/layouts/AppLayout'

const MANAGE_URL = 'https://gendox.dev/my-account'
const PRICING_URL = 'https://gendox.dev/pricing'
const UNLIMITED = 9999

const price = plan => (plan.price ? `€${plan.price} / month` : 'Free')
const limit = value => (value == null ? '—' : value >= UNLIMITED ? 'Unlimited' : value.toLocaleString())
// a plan's limits are per seat: the organization gets each one times its seats (SubscriptionValidationService.effectiveLimit)
const forSeats = (value, seats) => (value == null || value >= UNLIMITED ? value : value * (seats || 1))

const Meter = ({ label, used, max, note }) => {
  const unlimited = max >= UNLIMITED
  const share = !max || unlimited ? 0 : Math.min(100, (used / max) * 100)

  return (
    <div className='card card-b meter'>
      <div className='row'>
        <span className='muted'>{label}</span>
        <span className='sp' />
        <span className='num'>
          <b>{(used ?? 0).toLocaleString()}</b> <span className='faint'>of {limit(max)}</span>
        </span>
      </div>
      {!unlimited && (
        <div className='progress'>
          <i style={{ width: `${share}%`, ...(share > 85 ? { background: 'var(--warn)' } : {}) }} />
        </div>
      )}
      {note && <span className='faint sm'>{note}</span>}
    </div>
  )
}

/**
 * The organization's plan and what it uses of it: GET organizations/{o}/organization-plans, …/subscription-plans,
 * and the counts the app can read today (members, agents, websites, website pages read).
 * Usage statistics (messages, tokens, by agent and model) are gendox-core#531.
 */
const PlanPage = () => {
  const { organization, organizationId, projects } = useActiveScope()
  const [plan, setPlan] = useState(null)
  const [plans, setPlans] = useState([])
  const [members, setMembers] = useState(null)
  const [websites, setWebsites] = useState(null)
  const [budget, setBudget] = useState(null)
  const [integrationsOn, setIntegrationsOn] = useState(null)

  useEffect(() => {
    if (!organizationId) return
    const token = getToken()
    subscriptionPlanService
      .getOrganizationPlans(organizationId, token)
      .then(r => setPlan(r.data))
      .catch(() => setPlan({}))
    subscriptionPlanService
      .getActiveSubscriptionPlans(organizationId, token)
      .then(r => setPlans((r.data?.content ?? r.data ?? []).slice().sort((a, b) => (a.price ?? 0) - (b.price ?? 0))))
      .catch(() => setPlans([]))
    organizationService
      .getUsersInOrganizationByOrgId(organizationId, token)
      .then(r => setMembers((r.data ?? []).filter(m => m.user?.userType?.name !== 'GENDOX_AGENT' && m.user?.email).length))
      .catch(() => setMembers(null))
    organizationWebSiteService
      .getOrganizationWebSitesByOrganizationId(organizationId, token)
      .then(r => setWebsites((r.data?.content ?? r.data ?? []).length))
      .catch(() => setWebsites(null))
    integrationService
      .getIntegrationsByOrganizationId(organizationId, token)
      .then(r => setIntegrationsOn((r.data?.content ?? r.data ?? []).filter(i => i.active).length))
      .catch(() => setIntegrationsOn(null))
    webScrapeService
      .getBudget(organizationId, token)
      .then(r => setBudget(r.data))
      .catch(() => setBudget(null))
  }, [organizationId])

  if (!plan) {
    return (
      <main className='content'>
        <OrgScope tab='plan' />
        <div aria-busy='true' aria-label='Loading' className='stack'>
          <section className='hero'>
            <span className='skel' style={{ width: 110, height: 22, borderRadius: 99 }} />
            <span className='skel' style={{ width: 220, height: 24, marginTop: 12 }} />
            <span className='skel' style={{ width: '50%', marginTop: 10 }} />
          </section>
          <div className='grid' style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))' }}>
            {[0, 1, 2, 3].map(i => (
              <div key={i} className='card card-b meter'>
                <span className='skel' style={{ width: '60%' }} />
                <span className='skel' style={{ width: '100%', height: 6 }} />
              </div>
            ))}
          </div>
        </div>
      </main>
    )
  }

  const sub = plan.subscriptionPlan || {}
  const rate = sub.apiRateLimit || {}
  const seats = plan.numberOfSeats

  const rows = [
    ['Price', p => price(p)],
    // moq: the fewest seats the plan is sold with
    ['Seats', p => (p.moq > 1 ? `From ${p.moq}` : p.moq === 1 ? 'From 1' : '—')],
    ['Agents', p => limit(p.projectLimit)],
    ['Messages / month', p => limit(p.userMessageMonthlyLimitCount)],
    ['Websites · integrations on', p => limit(p.organizationWebSites)],
    ['Website pages read / month', p => limit(p.webScrapePagesMonthlyLimit)],
    ['Document pages', p => limit(p.documentPagesLimit)],
    ['Upload size', p => (p.userUploadLimitMb ? `${limit(p.userUploadLimitMb)} MB` : '—')]
  ]

  return (
    <main className='content'>
      <OrgScope tab='plan' />

      <section className='hero'>
        <div className='hero-top'>
          <div>
            <span className='badge accent'>
              <Sparkles className='lucide' />
              Current plan
            </span>
            <h2 style={{ fontSize: 24 }}>
              {sub.name || 'No plan'}{' '}
              {sub.name && (
                <span className='muted' style={{ fontSize: 16, fontWeight: 500 }}>
                  {price(sub)}
                </span>
              )}
            </h2>
            <p className='muted'>
              {[
                sub.description?.replace(/\.?\s*$/, '.'),
                plan.endDate ? `${plan.status === 'ACTIVE' ? 'Renews' : 'Ends'} on ${formatDate(plan.endDate)}.` : null
              ]
                .filter(Boolean)
                .join(' ')}
            </p>
          </div>
          <span className='sp' />
          <div className='row'>
            {plan.status && (
              <span className={`badge dot ${plan.status === 'ACTIVE' ? 'ok' : 'err'}`}>
                {plan.status === 'ACTIVE' ? 'Active' : 'Cancelled'}
              </span>
            )}
            <a className='btn primary' href={MANAGE_URL} target='_blank' rel='noopener noreferrer'>
              Manage subscription
              <ArrowUpRight className='lucide' />
            </a>
          </div>
        </div>
      </section>

      <div className='grid' style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))' }}>
        {members != null && (
          <Meter
            label='Seats'
            used={members}
            max={plan.numberOfSeats}
            note={`People in ${organization?.name || 'the organization'}`}
          />
        )}
        <Meter
          label='Agents'
          used={projects.length}
          max={forSeats(sub.projectLimit, seats)}
          note='The agents you belong to'
        />
        {websites != null && (
          <Meter
            label='Websites'
            used={websites}
            max={forSeats(sub.organizationWebSites, seats)}
            note='Sites where the widget can run'
          />
        )}
        {integrationsOn != null && (
          <Meter
            label='Integrations switched on'
            used={integrationsOn}
            max={forSeats(sub.organizationWebSites, seats)}
            note='The same plan number as websites.'
          />
        )}
        {budget && (
          <Meter
            label='Website pages read'
            used={budget.usedPages}
            max={budget.maxPages}
            note={budget.period?.to ? `This period · resets ${formatDate(budget.period.to)}` : ''}
          />
        )}
        <div className='card card-b meter'>
          <span className='muted'>Limits</span>
          <dl className='kv' style={{ marginTop: 4 }}>
            {sub.userUploadLimitMb != null && (
              <>
                <dt>Upload size</dt>
                <dd>{limit(forSeats(sub.userUploadLimitMb, seats))} MB per file</dd>
              </>
            )}
            {sub.userMessageMonthlyLimitCount != null && (
              <>
                <dt>Messages</dt>
                <dd>{limit(forSeats(sub.userMessageMonthlyLimitCount, seats))} a month</dd>
              </>
            )}
            {rate.completionsPerMinute != null && (
              <>
                <dt>Answers per minute</dt>
                <dd>
                  {rate.completionsPerMinute} for members · {rate.publicCompletionsPerMinute} for public visitors
                </dd>
              </>
            )}
          </dl>
        </div>
      </div>

      {plans.length > 0 && (
        <div className='card'>
          <div className='card-h'>
            <h3>Compare plans</h3>
            <span className='faint sm'>Per seat</span>
            <span className='sp' />
            <a className='btn ghost s' href={PRICING_URL} target='_blank' rel='noopener noreferrer'>
              Full comparison
              <ArrowUpRight className='lucide' />
            </a>
          </div>
          <div className='scroll'>
            <table className='table'>
              <thead>
                <tr>
                  <th />
                  {plans.map(p => (
                    <th key={p.id}>
                      {p.name}
                      {p.id === sub.id && <span className='badge accent'> Current</span>}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map(([label, value]) => (
                  <tr key={label} style={{ cursor: 'default' }}>
                    <td className='muted'>{label}</td>
                    {plans.map(p => (
                      <td key={p.id} className='num' style={p.id === sub.id ? { fontWeight: 600 } : undefined}>
                        {value(p)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <p className='faint sm'>Billing, invoices and payment methods are managed on gendox.dev.</p>
    </main>
  )
}

PlanPage.getLayout = page => (
  <AppLayout page='organization' title='Plan & usage' crumb='Organization'>
    {page}
  </AppLayout>
)

PlanPage.pageConfig = {
  applyEffectiveOrgAndProjectIds: true
}

export default PlanPage
