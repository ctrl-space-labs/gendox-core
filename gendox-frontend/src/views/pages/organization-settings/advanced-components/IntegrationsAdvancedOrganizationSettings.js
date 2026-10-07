import { useMemo, useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useRouter } from 'next/router'
import { useAuth } from 'src/authentication/useAuth'
import {
  CardContent,
  Box,
  Button,
  Chip,
  IconButton,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography
} from '@mui/material'
import { isValid, parseISO, format } from 'date-fns'
import Icon from 'src/views/custom-components/mui/icon/icon'
import { localStorageConstants } from 'src/utils/generalConstants'
import { fetchIntegrations, fetchOrganizationWebSites } from 'src/store/activeOrganization/activeOrganization'
import {
  labelOf,
  rankOf,
  WEB_SCRAPE_INTEGRATION,
  API_INTEGRATION,
  AWS_S3_INTEGRATION
} from './integrations/integrationMeta'
import { shortName } from './organization-websites/websiteMeta'
import { configOf } from './organization-websites/sourceText'
import SectionHeader from './shared/SectionHeader'
import WebScrapeSourcePanel from './organization-websites/WebScrapeSourcePanel'
import toast from 'react-hot-toast'
import organizationWebSiteService from 'src/gendox-sdk/organizationWebSiteService'
import ActionDialog from './shared/ActionDialog'
import { isValidWebsiteUrl } from 'src/utils/validators'
import { getErrorMessage } from 'src/utils/errorHandler'
import integrationService from 'src/gendox-sdk/integrationService'
import webScrapeService from 'src/gendox-sdk/webScrapeService'

const when = at => (at && isValid(parseISO(at)) ? format(parseISO(at), 'dd/MM/yyyy - HH:mm') : 'Never')

const IntegrationsAdvancedOrganizationSettings = () => {
  const router = useRouter()
  const dispatch = useDispatch()
  const { user } = useAuth()
  const token = window.localStorage.getItem(localStorageConstants.accessTokenKey)
  const organizationId = router.query.organizationId
  const { integrations, organizationWebSites, isBlurring } = useSelector(state => state.activeOrganization)

  // the junk of years sits in the stopped half, so the running ones are what opens
  const [showing, setShowing] = useState('active')
  const [openId, setOpenId] = useState(null)
  const [adding, setAdding] = useState(false)
  const [togglingId, setTogglingId] = useState(null)
  const [editing, setEditing] = useState(null)

  // the organization the api returns carries no projects; the ones the user can
  // see come with the user, which is where the navigation reads them from too
  const projects = user?.organizations?.find(organization => organization.id === organizationId)?.projects ?? []
  // the project the rest of the app has selected, but only when it is one of this
  // organization's — localStorage outlives a switch from one organization to another
  const selectedProjectId = window.localStorage.getItem(localStorageConstants.selectedProjectId)
  const defaultProjectId = projects.some(project => project.id === selectedProjectId) ? selectedProjectId : ''

  const refresh = async () => {
    await Promise.all([
      dispatch(fetchIntegrations({ organizationId, token })),
      dispatch(fetchOrganizationWebSites({ organizationId, token }))
    ])
  }

  // only the integrations change, so the websites are left alone — the table blurs
  // for as long as the refetch takes, the way every other list in the product does
  const toggleActive = async (row, active) => {
    setTogglingId(row.integration.id)
    try {
      await integrationService.setIntegrationActive(organizationId, row.integration.id, { active }, token)
      await dispatch(fetchIntegrations({ organizationId, token }))
      toast.success(active ? 'Integration switched on' : 'Integration switched off')
    } catch (error) {
      toast.error(getErrorMessage(error))
    } finally {
      setTogglingId(null)
    }
  }

  const rows = useMemo(() => {
    // the website holds the foreign key, so the lookup goes that way round
    const websiteOf = new Map((organizationWebSites ?? []).filter(w => w.integrationId).map(w => [w.integrationId, w]))

    return (
      (integrations ?? [])
        .map(integration => {
          const type = integration.integrationType?.name
          const website = websiteOf.get(integration.id) ?? null

          const title = website
            ? shortName(website)
            : type === AWS_S3_INTEGRATION
            ? integration.queueName || 'Unnamed queue'
            : integration.url || 'Unnamed'

          return {
            integration,
            type,
            website,
            title,
            // the url is worth repeating only when it is not already the title
            caption: website?.url && website.url !== title ? website.url : null
          }
        })
        // an api integration with no website has no name to show and nothing to act on
        .filter(row => !(row.type === API_INTEGRATION && !row.website))
        .sort((a, b) => rankOf(a.type) - rankOf(b.type) || a.title.localeCompare(b.title))
    )
  }, [integrations, organizationWebSites])

  const activeCount = rows.filter(r => r.integration.active).length

  const visible = rows.filter(row => showing === 'all' || (showing === 'active') === !!row.integration.active)

  const openRow = rows.find(row => row.integration.id === openId) ?? null

  // an api integration feeds whichever projects the website assigns its content to,
  // so there is no single project to name here
  const projectCell = row =>
    row.type === API_INTEGRATION
      ? 'Chosen on the site'
      : projects.find(p => p.id === row.integration.projectId)?.name ?? '—'

  return (
    <>
      <SectionHeader
        title='Integrations'
        tooltip='Everything that brings content into Gendox: websites it reads, websites that send their own content in, repositories and buckets.'
        addLabel={openRow ? undefined : 'Add integration'}
        onAdd={() => setAdding(true)}
      />

      <CardContent sx={{ pt: 0 }}>
        <Box sx={{ filter: isBlurring ? 'blur(6px)' : 'none', transition: 'filter 0.3s ease' }} aria-busy={isBlurring}>
          {openRow ? (
            <>
              <Button
                size='small'
                color='inherit'
                onClick={() => setOpenId(null)}
                startIcon={<Icon icon='mdi:chevron-left' />}
                sx={{ px: 0.5, mb: 1, color: 'text.secondary' }}
              >
                All integrations
              </Button>

              <Typography variant='subtitle2'>{openRow.title}</Typography>

              <WebScrapeSourcePanel
                organizationId={organizationId}
                integration={openRow.integration}
                onRefresh={refresh}
              />
            </>
          ) : (
            <>
              <Stack direction='row' alignItems='center' spacing={1.5} sx={{ mb: 2 }}>
                <Typography variant='body2' color='text.secondary' sx={{ flexGrow: 1 }}>
                  {rows.length
                    ? `${rows.length} integrations, ${activeCount} of them running.`
                    : 'Nothing brings content into Gendox yet.'}
                </Typography>

                {rows.length > 0 && (
                  <ToggleButtonGroup
                    size='small'
                    exclusive
                    value={showing}
                    onChange={(event, next) => next && setShowing(next)}
                  >
                    <ToggleButton value='active'>Active</ToggleButton>
                    <ToggleButton value='inactive'>Inactive</ToggleButton>
                    <ToggleButton value='all'>All</ToggleButton>
                  </ToggleButtonGroup>
                )}
              </Stack>

              {visible.length > 0 ? (
                <Table size='small'>
                  <TableHead>
                    <TableRow>
                      <TableCell>Integration</TableCell>
                      <TableCell>Type</TableCell>
                      <TableCell>Project</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell align='right'>Last run</TableCell>
                      <TableCell align='right' sx={{ width: 48 }} />
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {visible.map(row => {
                      // only a crawl source has anything behind it to open
                      const opens = row.type === WEB_SCRAPE_INTEGRATION

                      return (
                        <TableRow
                          key={row.integration.id}
                          hover
                          onClick={opens ? () => setOpenId(row.integration.id) : undefined}
                          sx={{ cursor: opens ? 'pointer' : 'default' }}
                        >
                          <TableCell sx={{ maxWidth: 0 }}>
                            <Stack direction='row' alignItems='center' spacing={0.5} sx={{ minWidth: 0 }}>
                              <Typography variant='body2' sx={{ wordBreak: 'break-word' }}>
                                {row.title}
                              </Typography>
                              {opens && (
                                <Icon
                                  icon='mdi:chevron-right'
                                  style={{ fontSize: '1rem', opacity: 0.6, flexShrink: 0 }}
                                />
                              )}
                            </Stack>
                            {row.caption && (
                              <Typography
                                variant='caption'
                                color='text.secondary'
                                display='block'
                                sx={{ wordBreak: 'break-all' }}
                              >
                                {row.caption}
                              </Typography>
                            )}
                          </TableCell>

                          <TableCell sx={{ whiteSpace: 'nowrap' }}>
                            <Typography variant='body2' color='text.secondary'>
                              {labelOf(row.type)}
                            </Typography>
                          </TableCell>

                          <TableCell>
                            <Typography variant='body2' color='text.secondary'>
                              {projectCell(row)}
                            </Typography>
                          </TableCell>

                          <TableCell>
                            <Stack direction='row' alignItems='center' spacing={1}>
                              {/* an empty title renders no tooltip, so only the rows that
                                  cannot be switched here explain why */}
                              <Tooltip
                                title={
                                  row.type === API_INTEGRATION
                                    ? 'The plugin on the site decides this, and sets it again every time it connects.'
                                    : ''
                                }
                              >
                                <span>
                                  <Switch
                                    size='small'
                                    checked={!!row.integration.active}
                                    disabled={row.type === API_INTEGRATION || togglingId === row.integration.id}
                                    onClick={event => event.stopPropagation()}
                                    onChange={(event, checked) => toggleActive(row, checked)}
                                  />
                                </span>
                              </Tooltip>

                              <Chip
                                size='small'
                                variant={row.integration.active ? 'filled' : 'outlined'}
                                color={row.integration.active ? 'primary' : 'default'}
                                label={
                                  row.integration.active
                                    ? 'Active'
                                    : row.type === API_INTEGRATION
                                    ? 'Not connected'
                                    : 'Inactive'
                                }
                              />
                            </Stack>
                          </TableCell>

                          <TableCell align='right' sx={{ whiteSpace: 'nowrap' }}>
                            <Typography
                              variant='caption'
                              color='text.secondary'
                              sx={{ fontVariantNumeric: 'tabular-nums' }}
                            >
                              {when(row.integration.lastRunAt)}
                            </Typography>
                          </TableCell>
                          <TableCell align='right' sx={{ py: 0 }}>
                            <Tooltip title='Edit'>
                              <IconButton
                                size='small'
                                onClick={event => {
                                  event.stopPropagation()
                                  setEditing(row)
                                }}
                                sx={{ color: 'text.secondary', '&:hover': { color: 'primary.main' } }}
                              >
                                <Icon icon='mdi:pencil-outline' />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              ) : (
                <Typography variant='body2' color='text.secondary'>
                  {showing === 'active' ? 'Nothing is running right now.' : 'Nothing here.'}
                </Typography>
              )}
            </>
          )}
        </Box>
      </CardContent>

      <ActionDialog
        open={adding}
        title='Add integration'
        titleTooltip='Gendox reads this website on a schedule and keeps its pages as documents. Only the pages you pick afterwards are fetched.'
        saveLabel='Add'
        description={
          projects.length
            ? undefined
            : 'This organization has no projects yet, and the pages need one to become documents in.'
        }
        fields={[
          { name: 'name', label: 'Name', required: true },
          {
            name: 'url',
            label: 'URL',
            required: true,
            validate: value =>
              isValidWebsiteUrl(value) ? null : 'Start with http:// or https://, for example https://example.com',
            tooltip: 'The domain Gendox matches this website by, for example https://example.com'
          },
          {
            name: 'projectId',
            label: 'Project',
            type: 'select',
            value: defaultProjectId,
            required: true,
            options: projects.map(project => ({ value: project.id, label: project.name }))
          },
          {
            name: 'crawlPageLimit',
            label: 'Pages to look for',
            type: 'number',
            value: '30',
            required: true
          },
          {
            name: 'runIntervalMinutes',
            label: 'Check every (minutes)',
            type: 'number',
            value: '1440',
            required: true
          }
        ]}
        onClose={() => setAdding(false)}
        onSave={async v => {
          await organizationWebSiteService.createWebScrapeWebSite(
            organizationId,
            {
              name: v.name.trim(),
              url: v.url.trim(),
              projectId: v.projectId,
              crawlPageLimit: Number(v.crawlPageLimit),
              runIntervalMinutes: Number(v.runIntervalMinutes)
            },
            token
          )

          await refresh()
          toast.success('Integration added')
        }}
      />
      <ActionDialog
        open={!!editing}
        title='Edit integration'
        description={editing?.title}
        fields={[
          {
            name: 'runIntervalMinutes',
            label: 'Check every (minutes)',
            type: 'number',
            value: editing?.integration.runIntervalMinutes ?? '',
            tooltip:
              'Leave it empty and Gendox looks every time its scheduler comes round. ' +
              'A crawled site cannot be set below one day. To stop it running on its own, switch it off.'
          },
          {
            name: 'crawlPageLimit',
            label: 'Pages to look for',
            type: 'number',
            value: configOf(editing?.integration).crawlPageLimit ?? '',
            hidden: () => editing?.type !== WEB_SCRAPE_INTEGRATION
          }
        ]}
        onClose={() => setEditing(null)}
        onSave={async v => {
          // the interval is replaced, so an emptied field clears it on purpose
          await integrationService.setIntegrationSchedule(
            organizationId,
            editing.integration.id,
            { runIntervalMinutes: v.runIntervalMinutes === '' ? null : Number(v.runIntervalMinutes) },
            token
          )

          if (editing.type === WEB_SCRAPE_INTEGRATION && v.crawlPageLimit !== '') {
            await webScrapeService.updateSchedule(
              organizationId,
              editing.integration.id,
              { crawlPageLimit: Number(v.crawlPageLimit) },
              token
            )
          }

          await dispatch(fetchIntegrations({ organizationId, token }))
          toast.success('Integration updated')
        }}
      />
    </>
  )
}

export default IntegrationsAdvancedOrganizationSettings
