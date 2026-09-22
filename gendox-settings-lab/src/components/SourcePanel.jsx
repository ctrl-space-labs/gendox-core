import { useEffect, useRef, useState } from 'react'
import { Box, Button, Stack, Alert, Typography, CircularProgress } from '@mui/material'
import { crawl, deepCrawl, scrape } from '../api/webScrape'
import PagesTable from './PagesTable'

export default function SourcePanel({ orgId, integration }) {
  const [busy, setBusy] = useState(null)
  const [error, setError] = useState(null)
  const [reloadKey, setReloadKey] = useState(0)
  const [selectedCount, setSelectedCount] = useState(0)
  const timerRef = useRef(null)

  const config = (() => {
    try {
      return JSON.parse(integration.config || '{}')
    } catch {
      return {}
    }
  })()

  // stop polling if the row is collapsed while a job is still running
  useEffect(() => () => clearInterval(timerRef.current), [])

  // the endpoints answer 202 and work in another thread, so the only way
  // to show progress is to keep asking for the page list
  const run = async (label, fn) => {
    setError(null)
    setBusy(label)

    try {
      await fn(orgId, integration.id)

      let ticks = 0
      clearInterval(timerRef.current)
      timerRef.current = setInterval(() => {
        setReloadKey(k => k + 1)
        if (++ticks >= 12) {
          clearInterval(timerRef.current)
          setBusy(null)
        }
      }, 2500)
    } catch (e) {
      setError(`${e.code ?? e.status}: ${e.message}`)
      setBusy(null)
    }
  }

  return (
    <Box sx={{ px: 2, pb: 3, bgcolor: 'action.hover' }}>
      <Typography variant="caption" color="text.secondary">
        {config.provider ?? 'FIRECRAWL'}
        {' · every '}{integration.runIntervalMinutes ?? '—'}{' min'}
        {' · crawl limit '}{config.crawlPageLimit ?? 'not set'}
        {' · last run '}{integration.lastRunAt ?? 'never'}
      </Typography>

      {error && <Alert severity="error" sx={{ my: 2 }}>{error}</Alert>}

      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ my: 2 }}>
        <Button variant="outlined" disabled={!!busy} onClick={() => run('Crawling…', crawl)}>
          Crawl site
        </Button>
        <Button variant="text" disabled={!!busy} onClick={() => run('Searching deeper…', deepCrawl)}>
          Search deeper
        </Button>

        <Box sx={{ flex: 1 }} />

        {busy && (
          <Stack direction="row" spacing={1} alignItems="center">
            <CircularProgress size={16} />
            <Typography variant="caption">{busy}</Typography>
          </Stack>
        )}

        <Button
          variant="contained"
          disabled={!!busy || selectedCount === 0}
          onClick={() => run('Reading pages…', scrape)}
        >
          Read {selectedCount || ''} selected
        </Button>
      </Stack>

      <PagesTable
        orgId={orgId}
        integrationId={integration.id}
        reloadKey={reloadKey}
        onSelectedCount={setSelectedCount}
      />
    </Box>
  )
}