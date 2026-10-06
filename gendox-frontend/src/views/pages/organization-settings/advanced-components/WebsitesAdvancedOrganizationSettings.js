import { useMemo, useState } from 'react'
import { useRouter } from 'next/router'
import { useSelector, useDispatch } from 'react-redux'
import { CardContent, Box, Stack, Typography, Button, Collapse, IconButton, Tooltip } from '@mui/material'
import toast from 'react-hot-toast'
import Icon from 'src/views/custom-components/mui/icon/icon'
import { localStorageConstants } from 'src/utils/generalConstants'
import { getErrorMessage } from 'src/utils/errorHandler'
import organizationWebSiteService from 'src/gendox-sdk/organizationWebSiteService'
import webScrapeService from 'src/gendox-sdk/webScrapeService'
import { fetchOrganizationWebSites, fetchIntegrations } from 'src/store/activeOrganization/activeOrganization'
import SectionHeader from './shared/SectionHeader'
import ServiceAvatar from './shared/ServiceAvatar'
import ActionDialog from './shared/ActionDialog'
import RowActions from './shared/RowActions'
import useCopy from './shared/useCopy'
import WebScrapeSourcePanel from './organization-websites/WebScrapeSourcePanel'
import { arrangementOf } from './organization-websites/sourceText'
import { deliveryOf, isCrawled, maskKey, shortName } from './organization-websites/websiteMeta'

// the row says when the site was last read, because that is the thing that goes
// wrong silently; the panel below keeps the exact timestamp
const lastRead = at => {
  const then = at ? new Date(at) : null
  if (!then || Number.isNaN(then.getTime())) return 'Never read yet'

  const mins = Math.round((Date.now() - then.getTime()) / 60000)
  if (mins < 1) return 'Read just now'
  if (mins < 60) return `Read ${mins} min ago`

  const hours = Math.round(mins / 60)
  if (hours < 48) return `Read ${hours} h ago`

  return `Read ${Math.round(hours / 24)} days ago`
}

const WebsitesAdvancedOrganizationSettings = () => {
  const router = useRouter()
  const dispatch = useDispatch()
  const token = window.localStorage.getItem(localStorageConstants.accessTokenKey)
  const projectId = window.localStorage.getItem(localStorageConstants.selectedProjectId)

  const organizationId = router.query.organizationId
  const { organizationWebSites, integrations, apiKeys, isBlurring } = useSelector(state => state.activeOrganization)

  const [openId, setOpenId] = useState(null)

  // the sources are the only group with anything to do, so it starts open
  const [openGroups, setOpenGroups] = useState(() => new Set(['sources']))
  const [editing, setEditing] = useState(null)
  const [adding, setAdding] = useState(false)
  const [deleting, setDeleting] = useState(null)
  const [revealed, setRevealed] = useState({})
  const { copied, copy } = useCopy()

  const refresh = async () => {
    await Promise.all([
      dispatch(fetchOrganizationWebSites({ organizationId, token })),
      dispatch(fetchIntegrations({ organizationId, token }))
    ])
  }

  const rows = useMemo(
    () =>
      (organizationWebSites ?? []).map(w => ({
        website: w,
        key: w.id,
        name: w.name,
        url: w.url,
        delivery: deliveryOf(w, integrations ?? [], apiKeys ?? [])
      })),
    [organizationWebSites, integrations, apiKeys]
  )

  // Three kinds of website, and nothing useful comes from reading them mixed
  // together: what you want is one of the three at a time. So each is a heading
  // with its own count, closed until you ask for it — and then whole, because a
  // list you opened on purpose should not be abbreviated.
  const groups = [
    { id: 'sources', label: 'read by Gendox', rows: rows.filter(r => isCrawled(r.delivery)) },
    { id: 'pushing', label: 'send content in', rows: rows.filter(r => r.delivery.kind === 'pushed') },
    { id: 'widget', label: 'only host the widget', rows: rows.filter(r => r.delivery.kind === 'widget') }
  ].filter(g => g.rows.length)

  const toggleGroup = id =>
    setOpenGroups(current => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)

      return next
    })

  const sourceCount = groups.find(g => g.id === 'sources')?.rows.length ?? 0

  const summary = () =>
    !rows.length
      ? 'No websites yet.'
      : sourceCount
      ? `Gendox reads ${sourceCount} of ${rows.length} websites. The widget may run on all of them.`
      : `${rows.length} websites. The widget may run on them; none is read by Gendox yet.`

  // The same two words the edit dialog states back as a fact, so adding a website
  // and opening it later read as one idea. Reading a site needs a project to put
  // its documents in, so without one that choice is not offered.
  const deliveryOptions = [
    {
      value: 'widget',
      label: 'Widget only',
      description: 'The widget may run there. Gendox reads nothing from it.'
    },
    ...(projectId
      ? [
          {
            value: 'crawled',
            label: 'Read by Gendox',
            description: 'Gendox fetches its pages with Firecrawl on a schedule and keeps them as documents.'
          }
        ]
      : [])
  ]

  // what the pencil is editing: a plain website has a name and a url, a crawl
  // source also has the schedule that used to hide behind a second pencil
  const editCrawl = editing && isCrawled(editing.delivery) ? editing.delivery.integration : null
  const editKey = editing && editing.delivery.kind === 'pushed' ? editing.delivery.apiKey : null

  const editConfig = (() => {
    try {
      return JSON.parse(editCrawl?.config || '{}')
    } catch {
      return {}
    }
  })()

  const websiteRow = r => {
    const { delivery } = r
    const expandable = isCrawled(delivery)
    const open = openId === r.key
    const apiKey = delivery.apiKey ?? null

    // the key is the one thing on a pushed row worth having in hand, so it is
    // readable and copyable from the row instead of only from the dialog
    const detail = apiKey
      ? `Pushed in with key ${revealed[r.key] ? apiKey.apiKey : maskKey(apiKey.apiKey)}`
      : expandable
      ? lastRead(delivery.integration?.lastRunAt)
      : delivery.detail

    return (
      <Box
        key={r.key}
        sx={{
          mb: 1.5,
          borderRadius: 1,
          border: '1px solid',
          borderColor: delivery.kind === 'widget' ? 'divider' : 'primary.main',
          bgcolor: delivery.kind === 'widget' ? 'transparent' : 'action.hover'
        }}
      >
        <Stack
          direction='row'
          alignItems='center'
          spacing={2}
          sx={{ p: 1.5, cursor: expandable ? 'pointer' : 'default' }}
          onClick={expandable ? () => setOpenId(open ? null : r.key) : undefined}
        >
          <ServiceAvatar
            meta={{ label: r.name, icon: delivery.icon, color: delivery.color }}
            dim={delivery.kind === 'widget'}
          />

          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography variant='subtitle2' sx={{ lineHeight: 1.35, wordBreak: 'break-word' }}>
              {shortName(r)}
            </Typography>
            <Typography variant='caption' color='text.secondary' sx={{ display: 'block', wordBreak: 'break-all' }}>
              {r.url}
            </Typography>
            <Stack direction='row' alignItems='center' spacing={0.5} sx={{ minWidth: 0 }}>
              {/* an empty title renders no tooltip, so only a crawl source gets one */}
              <Tooltip title={expandable ? arrangementOf(delivery.integration) : ''}>
                <Typography
                  variant='caption'
                  color='text.secondary'
                  sx={revealed[r.key] ? { fontFamily: 'monospace', wordBreak: 'break-all' } : undefined}
                >
                  {detail}
                </Typography>
              </Tooltip>

              {/* beside the key itself, because that is what they act on */}
              {apiKey && (
                <>
                  <Tooltip title={revealed[r.key] ? 'Hide key' : 'Reveal key'}>
                    <IconButton
                      size='small'
                      onClick={e => {
                        e.stopPropagation()
                        setRevealed(v => ({ ...v, [r.key]: !v[r.key] }))
                      }}
                      sx={{
                        p: 0.25,
                        color: 'text.secondary',
                        '&:hover': { color: 'primary.main', bgcolor: 'action.hover' }
                      }}
                    >
                      <Icon
                        icon={revealed[r.key] ? 'mdi:eye-off-outline' : 'mdi:eye-outline'}
                        style={{ fontSize: '1rem' }}
                      />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title={copied === r.key ? 'Copied' : 'Copy key'}>
                    <IconButton
                      size='small'
                      onClick={async e => {
                        e.stopPropagation()
                        if (!(await copy(r.key, apiKey.apiKey))) {
                          setRevealed(v => ({ ...v, [r.key]: true }))
                        }
                      }}
                      sx={{
                        p: 0.25,
                        color: copied === r.key ? 'primary.main' : 'text.secondary',
                        '&:hover': { color: 'primary.main', bgcolor: 'action.hover' }
                      }}
                    >
                      <Icon icon={copied === r.key ? 'mdi:check' : 'mdi:content-copy'} style={{ fontSize: '1rem' }} />
                    </IconButton>
                  </Tooltip>
                </>
              )}
            </Stack>
          </Box>

          {expandable && (
            <Icon icon={open ? 'mdi:chevron-up' : 'mdi:chevron-down'} style={{ fontSize: '1.25rem', opacity: 0.6 }} />
          )}
          <RowActions
            onEdit={() => setEditing(r)}
            onDelete={() => setDeleting(r)}
            deleteLabel='Remove from this list'
          />
        </Stack>

        {expandable && (
          <Collapse in={open} unmountOnExit>
            <WebScrapeSourcePanel
              organizationId={organizationId}
              integration={delivery.integration}
              onRefresh={refresh}
            />
          </Collapse>
        )}
      </Box>
    )
  }

  return (
    <>
      <SectionHeader
        title='Websites'
        tooltip='Websites the widget may run on, and websites that send content to Gendox.'
        addLabel='Add website'
        onAdd={() => setAdding(true)}
      />

      <CardContent sx={{ pt: 0 }}>
        {/* the product blurs while the store refetches rather than replacing the
            list, so an open source panel keeps its place */}
        <Box sx={{ filter: isBlurring ? 'blur(6px)' : 'none', transition: 'filter 0.3s ease' }} aria-busy={isBlurring}>
          <Typography variant='body2' color='text.secondary' sx={{ mb: 1.5 }}>
            {summary()}
          </Typography>

          {groups.map(g => (
            <Box key={g.id} sx={{ mb: 0.5 }}>
              <Button
                size='small'
                color='inherit'
                onClick={() => toggleGroup(g.id)}
                sx={{ px: 0.5, color: 'text.secondary' }}
                startIcon={<Icon icon={openGroups.has(g.id) ? 'mdi:chevron-down' : 'mdi:chevron-right'} />}
              >
                {g.rows.length} {g.label}
              </Button>

              <Collapse in={openGroups.has(g.id)} unmountOnExit>
                <Box sx={{ mt: 1.5 }}>{g.rows.map(websiteRow)}</Box>
              </Collapse>
            </Box>
          ))}
        </Box>
      </CardContent>

      <ActionDialog
        open={adding}
        title='Add website'
        titleTooltip='Every website here may run the chat widget. A website can also be a source: Gendox reads it, or it sends its content in through the plugin. That third kind appears by itself the first time the plugin connects.'
        saveLabel='Add'
        description={projectId ? undefined : 'Pick a project above to also let Gendox read a website.'}
        fields={[
          { name: 'delivery', type: 'choice', value: 'widget', required: true, options: deliveryOptions },
          { name: 'name', label: 'Name', required: true },
          {
            name: 'url',
            label: 'URL',
            required: true,
            tooltip: 'The domain Gendox matches this website by, for example https://example.com'
          },
          {
            name: 'crawlPageLimit',
            label: 'Pages to look for',
            type: 'number',
            value: '30',
            required: true,
            hidden: v => v.delivery !== 'crawled',
            tooltip:
              'How far discovery looks. Only the pages you then select are fetched, and those count against your monthly page budget.'
          },
          {
            name: 'runIntervalMinutes',
            label: 'Check every (minutes)',
            type: 'number',
            value: '1440',
            required: true,
            hidden: v => v.delivery !== 'crawled',
            tooltip: '1440 is once a day. Anything shorter is refused unless you are a super admin.'
          }
        ]}
        onClose={() => setAdding(false)}
        onSave={async v => {
          if (v.delivery === 'crawled') {
            await organizationWebSiteService.createWebScrapeWebSite(
              organizationId,
              {
                name: v.name.trim(),
                url: v.url.trim(),
                projectId,
                crawlPageLimit: Number(v.crawlPageLimit),
                runIntervalMinutes: Number(v.runIntervalMinutes)
              },
              token
            )
          } else {
            await organizationWebSiteService.createOrganizationWebSite(
              organizationId,
              { organizationId, name: v.name.trim(), url: v.url.trim() },
              token
            )
          }

          await refresh()
          toast.success('Website added')
        }}
      />

      <ActionDialog
        open={!!deleting}
        title='Remove website'
        saveLabel='Remove'
        destructive
        fields={[]}
        description={
          deleting &&
          (isCrawled(deleting.delivery)
            ? `Everything Gendox read from ${shortName(
                deleting
              )} goes with it: the pages it discovered and the text it kept from them. Answers that drew on this site stop being possible, and none of it can be brought back.`
            : deleting.delivery.kind === 'pushed'
            ? `${shortName(
                deleting
              )} stops being recognised and stops sending content in. The API key issued to it stays and has to be deleted separately.`
            : `${shortName(deleting)} stops being listed here. Nothing else is stored for it.`)
        }
        onClose={() => setDeleting(null)}
        onSave={async () => {
          await organizationWebSiteService.deleteOrganizationWebSite(organizationId, deleting.website.id, token)
          await refresh()
          toast.success('Website removed')
        }}
      />

      <ActionDialog
        open={!!editing}
        title='Edit website'
        titleTooltip={
          editKey
            ? 'A website that sends its own content in. Its url is how the plugin is recognised, so only the name can change here — edit the url and the next thing it sends would arrive as a second website.'
            : 'The name and the url are yours. What sits behind the website — the schedule it is read on, or the key it sends with — is under Advanced Settings.'
        }
        fields={[
          // what this website is, stated the way the product states a task's type
          { name: 'kind', type: 'readonly', value: editing?.delivery.label },
          { name: 'name', label: 'Name', value: editing?.name, required: true },
          { name: 'urlFixed', type: 'readonly', label: 'URL', value: editing?.url, hidden: () => !editKey },
          {
            name: 'url',
            label: 'URL',
            value: editing?.url,
            required: true,
            tooltip: 'The domain Gendox matches this website by. Change it and a different site is recognised.',
            hidden: () => !!editKey
          },
          {
            name: 'advanced',
            type: 'section',
            label: 'Advanced Settings',
            tooltip: editCrawl
              ? 'How often Gendox looks at this site and how far it looks. Leave a field empty to keep what it has now. Only the pages you select are fetched, and those count against your monthly page budget.'
              : 'The key this website sends its content with. It is issued once and shown here by its last characters only.',
            hidden: () => !editCrawl && !editKey
          },
          {
            name: 'provider',
            type: 'readonly',
            label: 'Read by',
            value: editConfig.provider ?? 'FIRECRAWL',
            hidden: () => !editCrawl
          },
          {
            name: 'autoCheck',
            type: 'toggle',
            label: 'Check automatically',
            description: v =>
              v.autoCheck
                ? 'On. Gendox reads this site by itself, on the interval below. Every run re-fetches every page it has already read and is billed, whether or not anything changed.'
                : 'Off. The site is read only when you press Read. Nothing is fetched, and nothing is billed, until you do.',
            value: !!editCrawl?.runIntervalMinutes,
            hidden: () => !editCrawl
          },
          {
            name: 'runIntervalMinutes',
            label: 'Check every (minutes)',
            type: 'number',
            value: editCrawl?.runIntervalMinutes ?? '1440',
            hidden: v => !editCrawl || !v.autoCheck
          },
          {
            name: 'crawlPageLimit',
            label: 'Pages to look for',
            type: 'number',
            value: editConfig.crawlPageLimit ?? '',
            hidden: () => !editCrawl
          },
          {
            name: 'apiKey',
            type: 'readonly',
            label: 'API key',
            value: editKey ? maskKey(editKey.apiKey) : '',
            secret: editKey?.apiKey,
            hidden: () => !editKey
          }
        ]}
        onClose={() => setEditing(null)}
        onSave={async v => {
          await organizationWebSiteService.updateOrganizationWebSite(
            organizationId,
            editing.website.id,
            {
              organizationId,

              name: v.name.trim(),

              // a pushed website keeps the url it is recognised by
              url: editKey ? editing.url : v.url.trim()
            },
            token
          )

          if (editCrawl) {
            // a missing field means "keep it", so switching the schedule off has to
            // be said outright; the interval only travels while it is on
            const schedule = { autoCheck: !!v.autoCheck }
            if (v.autoCheck && v.runIntervalMinutes !== '') schedule.runIntervalMinutes = Number(v.runIntervalMinutes)
            if (v.crawlPageLimit !== '') schedule.crawlPageLimit = Number(v.crawlPageLimit)

            await webScrapeService.updateSchedule(organizationId, editCrawl.id, schedule, token)
          }

          await refresh()
          toast.success('Website updated')
        }}
      />
    </>
  )
}

export default WebsitesAdvancedOrganizationSettings
