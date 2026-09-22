import { useCallback, useEffect, useState } from 'react'
import {
  Table, TableBody, TableCell, TableHead, TableRow, Checkbox,
  Chip, Stack, Select, MenuItem, TablePagination, Alert, Link
} from '@mui/material'
import { getPages, updateSelection } from '../api/webScrape'

const COLOR = { SCRAPED: 'success', FAILED: 'error', REMOVED: 'default', DISCOVERED: 'default' }

export default function PagesTable({ orgId, integrationId, reloadKey, onSelectedCount }) {
  const [data, setData] = useState({ content: [], totalElements: 0 })
  const [selectedTotal, setSelectedTotal] = useState(0)
  const [page, setPage] = useState(0)
  const [size, setSize] = useState(20)
  const [status, setStatus] = useState('')
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    setError(null)
    try {
      setData(await getPages(orgId, integrationId, { page, size, status }))

      // asking the server for the count is cheaper than downloading every row to count it,
      // and stays right when the selection spans several pages
      const picked = await getPages(orgId, integrationId, { page: 0, size: 1, isSelected: true })
      setSelectedTotal(picked.totalElements)
      onSelectedCount?.(picked.totalElements)
    } catch (e) {
      setError(`${e.code ?? e.status}: ${e.message}`)
    }
  }, [orgId, integrationId, page, size, status, onSelectedCount])

  useEffect(() => { load() }, [load, reloadKey])

  const pick = async (id, selected) => {
    try {
      await updateSelection(orgId, integrationId, { pageIds: [id], selected })
      await load()
    } catch (e) {
      setError(`${e.code ?? e.status}: ${e.message}`)
    }
  }

  const pickAll = async selected => {
    try {
      await updateSelection(orgId, integrationId, { selectAll: true, selected })
      await load()
    } catch (e) {
      setError(`${e.code ?? e.status}: ${e.message}`)
    }
  }

  const allSelected = data.totalElements > 0 && selectedTotal === data.totalElements
  const someSelected = selectedTotal > 0 && !allSelected

  return (
    <>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
        <Select
          size="small"
          value={status}
          displayEmpty
          onChange={e => { setStatus(e.target.value); setPage(0) }}
        >
          <MenuItem value="">All statuses</MenuItem>
          {['DISCOVERED', 'SCRAPED', 'FAILED', 'REMOVED'].map(s => (
            <MenuItem key={s} value={s}>{s}</MenuItem>
          ))}
        </Select>
      </Stack>

      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell padding="checkbox">
              <Checkbox
                checked={allSelected}
                indeterminate={someSelected}
                onChange={e => pickAll(e.target.checked)}
              />
            </TableCell>
            <TableCell>Page</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Last read</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {data.content.map(p => (
            <TableRow key={p.id} hover>
              <TableCell padding="checkbox">
                <Checkbox
                  checked={!!p.isSelected}
                  disabled={p.status === 'REMOVED'}
                  onChange={e => pick(p.id, e.target.checked)}
                />
              </TableCell>
              <TableCell>
                {p.title}
                <br />
                <Link href={p.url} target="_blank" rel="noreferrer" variant="caption">
                  {p.url}
                </Link>
                {p.errorMessage && (
                  <Chip size="small" color="error" variant="outlined"
                        label={p.errorMessage} sx={{ mt: 0.5, maxWidth: '100%' }} />
                )}
              </TableCell>
              <TableCell>
                <Chip size="small" label={p.status} color={COLOR[p.status]} />
              </TableCell>
              <TableCell>
                {p.lastScrapedAt?.replace('T', ' ').slice(0, 16) ?? '—'}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <TablePagination
        component="div"
        count={data.totalElements}
        page={page}
        rowsPerPage={size}
        rowsPerPageOptions={[10, 20, 50, 100]}
        onPageChange={(_, p) => setPage(p)}
        onRowsPerPageChange={e => { setSize(+e.target.value); setPage(0) }}
      />
    </>
  )
}