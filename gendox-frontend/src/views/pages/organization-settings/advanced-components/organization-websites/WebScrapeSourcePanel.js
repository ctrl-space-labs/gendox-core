import { useCallback, useEffect, useRef, useState } from 'react'
import { Box, Button, Stack, Alert, Typography, LinearProgress, CircularProgress, Tooltip } from '@mui/material'
import { isValid, parseISO, format } from 'date-fns'
import webScrapeService from 'src/gendox-sdk/webScrapeService'
import { localStorageConstants } from 'src/utils/generalConstants'
import { getErrorMessage } from 'src/utils/errorHandler'
import WebScrapePagesTable from './WebScrapePagesTable'
import integrationService from 'src/gendox-sdk/integrationService'
import { configOf } from './sourceText'

// the product spells an elapsed wait this way in GlobalGenerationStatus
const formatTime = seconds => (seconds < 60 ? `${seconds}s` : `${Math.floor(seconds / 60)}m ${seconds % 60}s`)

// the label doubles as the id of the action in flight, so the spinner knows
// which of the three buttons to sit on
const FIND = 'Looking for pages'
const DEEPER = 'Searching deeper'
const READING = 'Reading pages'

const POLL_MS = 2000
const SLOW_AFTER = 90
const GIVE_UP_AFTER = 300

const WebScrapeSourcePanel = ({ organizationId, integration, onRefresh }) => {
  const token = window.localStorage.getItem(localStorageConstants.accessTokenKey)

  const [busy, setBusy] = useState(null)
  const [slow, setSlow] = useState(false)
  const [error, setError] = useState(null)
  const [notice, setNotice] = useState(null)
  const [reloadKey, setReloadKey] = useState(0)
  const [counts, setCounts] = useState({ selected: 0, listed: 0, filtering: false })
  const [budget, setBudget] = useState(null)
  const timerRef = useRef(null)
  const countsRef = useRef(counts)

  // the interval reads the counts, so they need a ref; the identity must stay
  // stable or the table's load would be rebuilt on every render and loop
  const noteCounts = useCallback(next => {
    countsRef.current = next
    setCounts(next)
  }, [])

  // The number is a courtesy on the way to the click, not the control — the
  // backend re-checks the allowance for every single page — so a budget that
  // cannot be read is simply not shown.
  const loadBudget = useCallback(async () => {
    try {
      const response = await webScrapeService.getBudget(organizationId, token)
      setBudget(response.data)

      return response.data
    } catch {
      return null
    }
  }, [organizationId, token])

  useEffect(() => {
    loadBudget()
  }, [loadBudget])

  // stop polling if the row is collapsed while a job is still running
  useEffect(() => () => clearInterval(timerRef.current), [])

  const config = configOf(integration)
  const limit = config.crawlPageLimit

  // The endpoints answer 202 and work in another thread, so finishing is
  // something we observe rather than something we are told. Each action leaves a
  // different mark: reading clears the tick of every page it finishes, so the
  // count falling to zero is the run ending; crawling writes lastRunAt once it
  // has stored what it found. Both are exact — no timer decides we are done.
  const run = async (label, fn, waitFor) => {
    setError(null)
    setNotice(null)
    setSlow(false)
    setBusy({ label, kind: waitFor, startedWith: countsRef.current.selected, at: Date.now() })

    const startedAt = integration.lastRunAt ?? null

    try {
      await fn(organizationId, integration.id, token)
    } catch (e) {
      setError(getErrorMessage(e))
      setBusy(null)

      return
    }

    const crawlFinished = async () => {
      try {
        const fresh = await integrationService.getIntegration(integration.id, token)
        return String(fresh.data?.lastRunAt ?? '') !== String(startedAt ?? '')
      } catch {
        return false
      }
    }

    let ticks = 0
    clearInterval(timerRef.current)
    timerRef.current = setInterval(async () => {
      setReloadKey(k => k + 1)
      ticks += 1

      // A run that exhausts the allowance stops before it clears the tick of the
      // pages it never reached, so the count alone would never reach zero.
      // Running out is itself the end of the run, and an exact one.
      const fresh = await loadBudget()
      const exhausted = fresh?.remainingPages === 0
      const left = countsRef.current.selected

      const finished = waitFor === 'pages' ? left === 0 || exhausted : await crawlFinished()

      if (finished) {
        clearInterval(timerRef.current)
        setBusy(null)
        setSlow(false)

        if (waitFor === 'pages' && exhausted && left > 0) {
          setNotice(
            `This month's allowance ran out with ${left} picked ${
              left === 1 ? 'page' : 'pages'
            } still waiting. They keep their tick, so Read carries on where it stopped once the allowance renews.`
          )
        }

        // only here, never on every tick: the card blurs while the store refetches
        await onRefresh?.()

        return
      }

      if (ticks === SLOW_AFTER) setSlow(true)

      if (ticks >= GIVE_UP_AFTER) {
        clearInterval(timerRef.current)
        setBusy(null)
      }
    }, POLL_MS)
  }

  const picked = counts.selected

  // The allowance is spent by the click, so it sits over the button that spends
  // it — two words there, the rest in the tooltip. A pick larger than what is
  // left is not refused; it reads as far as it can and the rest keep their tick.
  const left = budget?.remainingPages ?? null

  const renews =
    budget?.period?.to && isValid(parseISO(budget.period.to)) ? format(parseISO(budget.period.to), 'dd/MM/yyyy') : null

  const allowance = left != null ? `${left} left` : budget?.usedPages != null ? `${budget.usedPages} read` : null

  const allowanceDetail =
    left != null
      ? `${left} of ${budget.maxPages} pages left in this billing period` +
        (renews ? `, which renews on ${renews}.` : '.')
      : `${budget?.usedPages} pages read in this billing period. No limit is being enforced.`

  const overBudget = left != null && picked > left

  // Reading clears each page's tick as it finishes, so the count falling is
  // literal progress and the bar can be honest about how far along it is. A
  // crawl has no denominator — it is looking for pages nobody has counted yet —
  // so it counts upwards instead and the bar stays indeterminate.
  const readSoFar = busy?.kind === 'pages' ? Math.max(0, busy.startedWith - picked) : 0

  const progress = busy?.kind === 'pages' && busy.startedWith ? (readSoFar / busy.startedWith) * 100 : null

  const elapsed = busy ? Math.floor((Date.now() - busy.at) / 1000) : 0

  const statusText = !busy
    ? null
    : busy.kind === 'pages'
    ? `Read ${readSoFar} of ${busy.startedWith} ${busy.startedWith === 1 ? 'page' : 'pages'}`
    : counts.filtering
    ? busy.label
    : `${busy.label} — ${counts.listed} found`

  const allowanceChip = allowance && (
    <Tooltip title={allowanceDetail}>
      <Typography
        variant='caption'
        color={left === 0 || overBudget ? 'warning.main' : 'text.secondary'}
        sx={{ whiteSpace: 'nowrap' }}
      >
        {allowance}
      </Typography>
    </Tooltip>
  )

  // The action sits at the end of the table's own toolbar, so it shares the right
  // edge the table already has and lines up with the column headings underneath.
  // Default size, not small, so it matches the height of the filter controls.
  const readAction = (
    <Tooltip
      title={
        left === 0
          ? 'The allowance for this billing period is spent.'
          : overBudget
          ? `Only ${left} of the ${picked} pages you picked fit in the allowance. The rest keep their tick for later.`
          : picked
          ? `Read ${picked} ${picked === 1 ? 'page' : 'pages'} and keep each one as a document`
          : 'Tick the pages you want read'
      }
    >
      <span>
        <Button
          variant='contained'
          disableElevation
          disabled={!!busy || picked === 0 || left === 0}
          startIcon={busy?.label === READING ? <CircularProgress size={16} color='inherit' /> : null}
          onClick={() => run(READING, webScrapeService.scrape, 'pages')}
          sx={{ minWidth: 112 }}
        >
          {picked ? `Read ${picked}` : 'Read'}
        </Button>
      </span>
    </Tooltip>
  )

  return (
    <Box sx={{ px: 2, pt: 2.5, pb: 3, bgcolor: 'action.hover' }}>
      {error && (
        <Alert severity='error' sx={{ my: 2 }}>
          {error}
        </Alert>
      )}

      {notice && (
        <Alert severity='info' sx={{ my: 2 }} onClose={() => setNotice(null)}>
          {notice}
        </Alert>
      )}

      <Stack direction='row' spacing={1} alignItems='center' useFlexGap sx={{ mb: 1.5, flexWrap: 'wrap' }}>
        <Tooltip
          title={`Lists the pages the site exposes${limit ? `, up to ${limit}` : ''}. Free — nothing is downloaded.`}
        >
          <span>
            <Button
              size='small'
              variant='outlined'
              disabled={!!busy}
              startIcon={busy?.label === FIND ? <CircularProgress size={16} color='inherit' /> : null}
              onClick={() => run(FIND, webScrapeService.crawl, 'run')}
            >
              Find pages
            </Button>
          </span>
        </Tooltip>

        <Tooltip title='Follow the links page by page to find what the first pass missed. Every page it visits is billed.'>
          <span>
            <Button
              size='small'
              variant='text'
              color='inherit'
              disabled={!!busy}
              startIcon={busy?.label === DEEPER ? <CircularProgress size={16} color='inherit' /> : null}
              onClick={() => run(DEEPER, webScrapeService.deepCrawl, 'run')}
            >
              Search deeper
            </Button>
          </span>
        </Tooltip>

        <Box sx={{ flexGrow: 1 }} />
        {allowanceChip}
      </Stack>

      {/* the count and the bar sit directly above the list they describe, as the
          product does over its file queue in UploaderDocument */}
      {busy && (
        <Box sx={{ width: '100%', mb: 2 }}>
          <Stack direction='row' alignItems='baseline' sx={{ mb: 0.5 }}>
            <Typography variant='body2'>{statusText}</Typography>
            <Box sx={{ flex: 1 }} />
            <Typography variant='caption' color='text.secondary' sx={{ fontVariantNumeric: 'tabular-nums' }}>
              {formatTime(elapsed)}
            </Typography>
          </Stack>

          <LinearProgress variant={progress === null ? 'indeterminate' : 'determinate'} value={progress ?? undefined} />

          {slow && (
            <Typography variant='caption' color='warning.main' sx={{ display: 'block', mt: 0.5 }}>
              Taking longer than usual. Pages appear below as they arrive.
            </Typography>
          )}
        </Box>
      )}

      <WebScrapePagesTable
        organizationId={organizationId}
        integrationId={integration.id}
        baseUrl={integration.url}
        reloadKey={reloadKey}
        onCounts={noteCounts}
        toolbarEnd={readAction}
      />
    </Box>
  )
}

export default WebScrapeSourcePanel
