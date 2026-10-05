import { useCallback, useEffect, useState } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Checkbox,
  Box,
  Divider,
  Chip,
  Stack,
  Select,
  MenuItem,
  TablePagination,
  Alert,
  Link,
  Typography,
  Tooltip,
  TextField,
  InputAdornment,
  IconButton
} from '@mui/material'
import { isValid, parseISO, format } from 'date-fns'
import Icon from 'src/views/custom-components/mui/icon/icon'
import webScrapeService from 'src/gendox-sdk/webScrapeService'
import { localStorageConstants } from 'src/utils/generalConstants'
import { getErrorMessage } from 'src/utils/errorHandler'
import ActionDialog from '../shared/ActionDialog'

// Every url on this list starts with the same site, so showing it whole thirty
// times buries the part that differs. The site is already named above the table.
// A site can be registered as www.example.com while its pages answer on
// example.com, which is the same site to everyone except a string comparison.
const bareHost = host => host.replace(/^www\./, '')

const pathOf = (url, base) => {
  try {
    const page = new URL(url)
    const site = base ? new URL(base) : null
    const path = (page.pathname + page.search).replace(/\/$/, '') || '/'

    return site && bareHost(page.host) === bareHost(site.host) ? path : `${bareHost(page.host)}${path}`
  } catch {
    return url
  }
}

// One question — what am I looking at. A tick lasts a single run, so the durable
// question is whether Gendox has read the page, and the document it kept is what
// answers it.
const READ = 'read'
const UNREAD = 'unread'

const VIEWS = [
  { value: '', label: 'All pages' },
  { value: READ, label: 'Read' },
  { value: UNREAD, label: 'Not read yet' },
  { divider: true },
  { value: 'FAILED', label: 'Failed last time' },
  { value: 'REMOVED', label: 'Gone from the site' }
]

const STATUS_VIEWS = ['DISCOVERED', 'SCRAPED', 'FAILED', 'REMOVED']

// A date alone cannot tell two reads of the same day apart, which is most of them
const when = at => (at && isValid(parseISO(at)) ? format(parseISO(at), 'dd/MM/yyyy - HH:mm') : null)

const WebScrapePagesTable = ({ organizationId, integrationId, baseUrl, reloadKey, onCounts, toolbarEnd }) => {
  const token = window.localStorage.getItem(localStorageConstants.accessTokenKey)

  const [data, setData] = useState({ content: [], totalElements: 0 })
  const [selectedTotal, setSelectedTotal] = useState(0)
  const [removing, setRemoving] = useState(null)
  const [page, setPage] = useState(0)
  const [size, setSize] = useState(20)
  const [view, setView] = useState('')
  const [typed, setTyped] = useState('')
  const [search, setSearch] = useState('')
  const [error, setError] = useState(null)

  const status = STATUS_VIEWS.includes(view) ? view : ''
  const hasContent = view === READ ? true : view === UNREAD ? false : undefined
  const filtering = !!(view || search)

  // one request when the typing stops, not one per keystroke
  useEffect(() => {
    const id = setTimeout(() => {
      setSearch(typed.trim())
      setPage(0)
    }, 350)

    return () => clearTimeout(id)
  }, [typed])

  const load = useCallback(async () => {
    setError(null)
    try {
      // the tick count comes from the server rather than from the rows on screen,
      // so it stays right when a selection spans several pages of the table
      const [rows, picked] = await Promise.all([
        webScrapeService.getPages(
          organizationId,
          integrationId,
          page,
          size,
          status,
          undefined,
          hasContent,
          search,
          token
        ),
        webScrapeService.getPages(organizationId, integrationId, 0, 1, '', true, undefined, '', token)
      ])

      setData(rows.data)
      setSelectedTotal(picked.data.totalElements)

      // the panel above draws its progress from these, so they travel together
      onCounts?.({ selected: picked.data.totalElements, listed: rows.data.totalElements, filtering })
    } catch (e) {
      setError(getErrorMessage(e))
    }
  }, [organizationId, integrationId, page, size, status, search, hasContent, filtering, onCounts, token])

  useEffect(() => {
    load()
  }, [load, reloadKey])

  // The tick answers the click, then the request goes. Reloading first meant a
  // PUT and two GETs before the box changed, which read as the click not landing.
  // A refusal puts the truth back.
  const pick = async (id, selected) => {
    setData(d => ({
      ...d,
      content: d.content.map(p => (p.id === id ? { ...p, isSelected: selected } : p))
    }))

    const total = selectedTotal + (selected ? 1 : -1)
    setSelectedTotal(total)
    onCounts?.({ selected: total, listed: data.totalElements, filtering })

    try {
      await webScrapeService.updateSelection(organizationId, integrationId, { pageIds: [id], selected }, token)
    } catch (e) {
      setError(getErrorMessage(e))
      await load()
    }
  }

  const pickAll = async selected => {
    try {
      await webScrapeService.updateSelection(organizationId, integrationId, { selectAll: true, selected }, token)
      await load()
    } catch (e) {
      setError(getErrorMessage(e))
    }
  }

  // `selectAll` on the endpoint means every page of the site, which is the wrong
  // thing once a filter is on: the box above a list of three search results must
  // act on those three. So while filtering it sends the listed ids instead.
  const shown = data.content
  const shownPicked = shown.filter(p => p.isSelected).length

  const allSelected = filtering
    ? shown.length > 0 && shownPicked === shown.length
    : data.totalElements > 0 && selectedTotal === data.totalElements

  const someSelected = filtering ? shownPicked > 0 && shownPicked < shown.length : selectedTotal > 0 && !allSelected

  const pickShown = async selected => {
    try {
      await webScrapeService.updateSelection(
        organizationId,
        integrationId,
        { pageIds: shown.filter(p => p.status !== 'REMOVED').map(p => p.id), selected },
        token
      )
      await load()
    } catch (e) {
      setError(getErrorMessage(e))
    }
  }

  return (
    <>
      {error && (
        <Alert severity='error' sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Stack direction='row' spacing={1.5} alignItems='center' sx={{ mb: 2 }}>
        <Select
          size='small'
          value={view}
          displayEmpty
          onChange={e => {
            setView(e.target.value)
            setPage(0)
          }}
          sx={{ minWidth: 180 }}
        >
          {VIEWS.map((v, i) =>
            v.divider ? (
              <Divider key={`divider-${i}`} />
            ) : (
              <MenuItem key={v.value} value={v.value}>
                {v.label}
              </MenuItem>
            )
          )}
        </Select>

        <TextField
          size='small'
          placeholder='Search pages'
          value={typed}
          onChange={e => setTyped(e.target.value)}
          sx={{ flex: 1, maxWidth: 360 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position='start'>
                <Icon icon='mdi:magnify' style={{ fontSize: '1.15rem', opacity: 0.55 }} />
              </InputAdornment>
            ),
            endAdornment: typed && (
              <InputAdornment position='end'>
                <IconButton size='small' onClick={() => setTyped('')}>
                  <Icon icon='mdi:close' style={{ fontSize: '1rem' }} />
                </IconButton>
              </InputAdornment>
            )
          }}
        />

        {/* grows to the right edge the table itself ends at */}
        {toolbarEnd && <Box sx={{ flexGrow: 1, display: 'flex', justifyContent: 'flex-end' }}>{toolbarEnd}</Box>}
      </Stack>

      <Table size='small'>
        <TableHead>
          <TableRow>
            <TableCell padding='checkbox'>
              <Tooltip
                title={
                  filtering
                    ? `${allSelected ? 'Unpick' : 'Pick'} the ${shown.length} listed here`
                    : `${allSelected ? 'Unpick' : 'Pick'} every page of the site`
                }
              >
                <Checkbox
                  checked={allSelected}
                  indeterminate={someSelected}
                  onChange={e => (filtering ? pickShown(e.target.checked) : pickAll(e.target.checked))}
                />
              </Tooltip>
            </TableCell>
            <TableCell>Page</TableCell>
            <TableCell align='right'>Last read</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {data.content.map(p => {
            const gone = p.status === 'REMOVED'
            const read = when(p.lastScrapedAt)
            const stored = !!p.documentInstanceId

            return (
              <TableRow
                key={p.id}
                hover
                selected={!!p.isSelected}
                sx={{ cursor: gone ? 'default' : 'pointer' }}
                onClick={gone ? undefined : () => pick(p.id, !p.isSelected)}
              >
                <TableCell padding='checkbox'>
                  <Checkbox
                    checked={!!p.isSelected}
                    disabled={gone}
                    onClick={e => e.stopPropagation()}
                    onChange={e => pick(p.id, e.target.checked)}
                  />
                </TableCell>

                <TableCell sx={{ maxWidth: 0 }}>
                  <Stack direction='row' alignItems='flex-start' spacing={0.75} sx={{ minWidth: 0 }}>
                    {/* wraps rather than truncates: a page you cannot read the end of
                        is a page you cannot tell apart from its neighbour */}
                    <Typography
                      variant='body2'
                      sx={{ color: gone ? 'text.disabled' : 'text.primary', wordBreak: 'break-word' }}
                    >
                      {p.title || pathOf(p.url, baseUrl)}
                    </Typography>

                    <Tooltip title={p.url}>
                      <Link
                        href={p.url}
                        target='_blank'
                        rel='noreferrer'
                        onClick={e => e.stopPropagation()}
                        sx={{
                          display: 'flex',
                          mt: '3px',
                          flexShrink: 0,
                          color: 'text.secondary',
                          '&:hover': { color: 'primary.main' }
                        }}
                      >
                        <Icon icon='mdi:open-in-new' style={{ fontSize: '.9rem' }} />
                      </Link>
                    </Tooltip>
                  </Stack>

                  {p.title && (
                    <Typography variant='caption' color='text.secondary' display='block' sx={{ wordBreak: 'break-word' }}>
                      {pathOf(p.url, baseUrl)}
                    </Typography>
                  )}

                  {p.errorMessage && (
                    <Chip
                      size='small'
                      color='error'
                      variant='outlined'
                      label={p.errorMessage}
                      sx={{ mt: 0.5, maxWidth: '100%' }}
                    />
                  )}
                </TableCell>

                {/* whether Gendox has read the page, and the only way to undo that */}
                <TableCell align='right' sx={{ whiteSpace: 'nowrap' }}>
                  <Stack direction='row' spacing={0.5} alignItems='center' justifyContent='flex-end'>
                    {gone && <Chip size='small' variant='outlined' label='Gone from the site' />}
                    {p.status === 'FAILED' && <Chip size='small' color='error' label='Failed' />}

                    {stored ? (
                      <Typography variant='caption' color='text.secondary' sx={{ fontVariantNumeric: 'tabular-nums' }}>
                        {read ?? 'Read'}
                      </Typography>
                    ) : (
                      <Typography variant='caption' color='text.disabled'>
                        Not read yet
                      </Typography>
                    )}

                    {stored && (
                      <Tooltip title='Forget what Gendox read here'>
                        <IconButton
                          size='small'
                          onClick={e => {
                            e.stopPropagation()
                            setRemoving(p)
                          }}
                          sx={{
                            p: 0.25,
                            color: 'text.secondary',
                            '&:hover': { color: 'error.main', bgcolor: 'action.hover' }
                          }}
                        >
                          <Icon icon='mdi:close-circle-outline' style={{ fontSize: '1rem' }} />
                        </IconButton>
                      </Tooltip>
                    )}
                  </Stack>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>

      <ActionDialog
        open={!!removing}
        title='Forget this page'
        saveLabel='Forget it'
        destructive
        fields={[]}
        description={
          removing &&
          `The text Gendox kept from ${pathOf(
            removing.url,
            baseUrl
          )} is deleted, and answers can no longer draw on it. The page stays on this list, so it can be read again later without searching the site afresh.`
        }
        onClose={() => setRemoving(null)}
        onSave={async () => {
          await webScrapeService.removePageContent(organizationId, integrationId, removing.id, token)
          await load()
        }}
      />

      <TablePagination
        component='div'
        count={data.totalElements}
        page={page}
        rowsPerPage={size}
        rowsPerPageOptions={[10, 20, 50, 100]}
        onPageChange={(_, p) => setPage(p)}
        onRowsPerPageChange={e => {
          setSize(+e.target.value)
          setPage(0)
        }}
      />
    </>
  )
}

export default WebScrapePagesTable