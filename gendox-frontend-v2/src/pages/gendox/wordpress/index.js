import { useEffect, useState } from 'react'
import Link from 'next/link'
import { BookOpen, ChevronRight, Info, KeyRound } from 'lucide-react'
import useActiveScope from 'src/hooks/useActiveScope'
import commonConfig from 'src/configs/common.config'
import integrationService from 'src/gendox-sdk/integrationService'
import organizationWebSiteService from 'src/gendox-sdk/organizationWebSiteService'
import useAgent, { getToken } from 'src/components/agent/useAgent'
import { IntegrationTile, bareUrl, buildRows, formatWhen } from 'src/components/integrations/integrationUtils'
import AppLayout from 'src/layouts/AppLayout'

/**
 * WordPress: the sites connected through the plugin (an OrganizationWebSite with an API_INTEGRATION, created by the
 * plugin with its API key), and how to connect one. Gendox fetches the posts the plugin assigns to each agent.
 */
const WordPressPage = () => {
  const { organizationId, href } = useActiveScope()
  const { project } = useAgent()
  const [sites, setSites] = useState(null)

  useEffect(() => {
    if (!organizationId) return
    const token = getToken()
    Promise.all([
      integrationService.getIntegrationsByOrganizationId(organizationId, token).catch(() => null),
      organizationWebSiteService.getOrganizationWebSitesByOrganizationId(organizationId, token).catch(() => null)
    ]).then(([ints, webs]) =>
      setSites(
        buildRows(ints?.data?.content ?? ints?.data ?? [], webs?.data?.content ?? webs?.data ?? []).filter(
          r => r.type === 'API_INTEGRATION'
        )
      )
    )
  }, [organizationId])

  const isPublic = project ? !project.projectAgent?.privateAgent : null

  return (
    <main className='content'>
      <div className='page-h'>
        <div>
          <h1 className='row' style={{ gap: 12 }}>
            <IntegrationTile type='API_INTEGRATION' className='big' />
            WordPress
          </h1>
          <p>Show an agent on your WordPress site, and keep its posts and pages in the agent’s knowledge.</p>
        </div>
        <div className='actions'>
          <a className='btn' href={commonConfig.gendoxDocsUrl} target='_blank' rel='noopener noreferrer'>
            <BookOpen className='lucide' />
            Plugin guide
          </a>
        </div>
      </div>

      <div className='card'>
        <div className='card-h'>
          <h3>WordPress sites</h3>
          <span className='faint sm'>{sites?.length ?? ''}</span>
          <span className='sp' />
          <Link className='btn ghost s' href={href('/gendox/integrations')}>
            All integrations
          </Link>
        </div>
        {sites && sites.length === 0 && <div className='card-b faint sm'>No WordPress site is connected yet.</div>}
        {(sites ?? []).map(site => (
          <Link
            key={site.id}
            className='item'
            href={href('/gendox/integration', { integrationId: site.integration.id })}
            style={{ flexWrap: 'wrap' }}
          >
            <IntegrationTile type='API_INTEGRATION' />
            <div style={{ flex: 1, minWidth: 220 }}>
              <div className='row' style={{ gap: 8 }}>
                <b style={{ fontWeight: 550 }}>{bareUrl(site.url)}</b>
                <span className={`badge ${site.active ? 'dot ok' : ''}`}>{site.active ? 'Connected' : 'Not connected'}</span>
              </div>
              <div className='faint sm'>
                {site.integration.lastRunAt ? `Last checked ${formatWhen(site.integration.lastRunAt)}` : 'Never checked'}
              </div>
            </div>
            <ChevronRight className='lucide' />
          </Link>
        ))}
        <div className='card-f faint sm'>
          <Info className='lucide' style={{ width: 13, height: 13, verticalAlign: '-2px' }} /> To disconnect a site,
          deactivate the plugin in WordPress or revoke its API key.
        </div>
      </div>

      <section className='sect'>
        <header>
          <h2>Connect a site</h2>
          <p>About five minutes. You need to be an administrator of the WordPress site.</p>
        </header>
        <div className='card card-b'>
          <ol className='steps-v'>
            <li className={isPublic ? 'done' : ''}>
              <div>
                <b>Make the agent public</b>
                <p>
                  {isPublic === null
                    ? 'Visitors can’t chat with private agents.'
                    : isPublic
                    ? `${project.name} is public.`
                    : `${project.name} is private, and visitors can’t chat with private agents.`}{' '}
                  <Link className='link' href={href('/gendox/agent-deploy')}>
                    Deploy settings
                  </Link>
                </p>
              </div>
            </li>
            <li>
              <div>
                <b>Create an API key for the site</b>
                <p>Name it after the site, so you know what to revoke later.</p>
                <Link className='btn s' style={{ marginTop: 8 }} href={href('/gendox/api-keys')}>
                  <KeyRound className='lucide' />
                  Create key
                </Link>
              </div>
            </li>
            <li>
              <div>
                <b>Install the Gendox AI Agent plugin</b>
                <p>In WordPress: Plugins → Add New → search “Gendox”, or upload the zip.</p>
              </div>
            </li>
            <li>
              <div>
                <b>Paste the key and pick where the agent shows</b>
                <p>
                  In the plugin’s settings, choose post types or categories per agent. The site then appears above, and
                  its posts start syncing.
                </p>
              </div>
            </li>
          </ol>
        </div>
      </section>
    </main>
  )
}

WordPressPage.getLayout = page => (
  <AppLayout page='wordpress' title='WordPress'>
    {page}
  </AppLayout>
)

WordPressPage.pageConfig = {
  applyEffectiveOrgAndProjectIds: true
}

export default WordPressPage
