import { useCallback, useEffect, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import { ArrowUpRight, ChevronLeft, ChevronRight, Download, Radar, Search, Telescope, X } from 'lucide-react'
import integrationService from 'src/gendox-sdk/integrationService'
import webScrapeService from 'src/gendox-sdk/webScrapeService'
import { getErrorMessage } from 'src/utils/errorHandler'
import { getToken } from 'src/components/agent/useAgent'
import { formatDate } from 'src/components/knowledge/documentUtils'
import { configOf, formatWhen } from 'src/components/integrations/integrationUtils'
import ConfirmDialog from 'src/components/ui/ConfirmDialog'
import Empty from 'src/components/ui/Empty'
import Spinner from 'src/components/ui/Spinner'

const PAGE_SIZE = 25
const POLL_MS = 2000
const SLOW_AFTER = 90 // polls
const GIVE_UP_AFTER = 300

// what the list shows; a status view filters by the page's status, the others by whether Gendox kept its text
const VIEWS = [
  ['', 'All pages'],
  ['read', 'Read'],
  ['unread', 'Not read yet'],
  ['FAILED', 'Failed last time'],
  ['REMOVED', 'Gone from the site']
]

const bareHost = host => host.replace(/^www\./, '')

// every page is on the same site, so the path is what tells them apart
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

/**
 * A crawled website's pages, and what is read into the knowledge.
 * Find pages (free) and Search deeper (every visited page is billed) list them; ticks choose them;
 * Read makes the knowledge match the ticks (POST …/web-scrape/scrape). The three answer 202 and run in the
 * background: a run has finished when the integration's lastRunAt moves.
 */
const WebPagesPicker = ({ organizationId, integration, agentName, onRunFinished }) => {
  const [data, setData] = useState({ content: [], totalElements: 0 })
  const [ticked, setTicked] = useState(0)
  const [budget, setBudget] = useState(null)
  const [view, setView] = useState('')
  const [typed, setTyped] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)
  const [busy, setBusy] = useState(null) // { label, at }
  const [slow, setSlow] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [fetchingId, setFetchingId] = useState(null)
  const [confirmDeep, setConfirmDeep] = useState(false)
  const [forgetting, setForgetting] = useState(null)
  const timer = useRef(null)

  const status = ['FAILED', 'REMOVED'].includes(view) ? view : ''
  const hasContent = view === 'read' ? true : view === 'unread' ? false : undefined
  const filtering = Boolean(view || search)
  const limit = configOf(integration).crawlPageLimit

  useEffect(() => {
    const id = setTimeout(() => {
      setSearch(typed.trim())
      setPage(0)
    }, 350)

    return () => clearTimeout(id)
  }, [typed])

  const loadBudget = useCallback(async () => {
    try {
      const r = await webScrapeService.getBudget(organizationId, getToken())
      setBudget(r.data)

      return r.data
    } catch {
      return null
    }
  }, [organizationId])

  // the tick count comes from the server, so it stays right when the ticks span several pages of the list
  const load = useCallback(async () => {
    const token = getToken()
    try {
      const [rows, picked] = await Promise.all([
        webScrapeService.getPages(organizationId, integration.id, page, PAGE_SIZE, status, undefined, hasContent, search, token),
        webScrapeService.getPages(organizationId, integration.id, 0, 1, '', true, undefined, '', token)
      ])
      setData(rows.data)
      setTicked(picked.data.totalElements)
    } catch (error) {
      toast.error(`Couldn’t load the pages. ${getErrorMessage(error)}`, { id: 'pages' })
    }
  }, [organizationId, integration.id, page, status, hasContent, search])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    loadBudget()
  }, [loadBudget])

  useEffect(() => () => clearInterval(timer.current), [])

  const run = async (label, action) => {
    setSlow(false)
    const startedAt = integration.lastRunAt ?? null
    try {
      await action(organizationId, integration.id, getToken())
    } catch (error) {
      return toast.error(getErrorMessage(error))
    }
    const at = Date.now()
    setBusy({ label, at })
    let ticks = 0
    clearInterval(timer.current)
    timer.current = setInterval(async () => {
      ticks += 1
      setElapsed(Math.floor((Date.now() - at) / 1000))
      load()
      const fresh = await loadBudget()
      let finished = false
      try {
        const r = await integrationService.getIntegration(organizationId, integration.id, getToken())
        finished = String(r.data?.lastRunAt ?? '') !== String(startedAt ?? '')
      } catch {
        finished = false
      }
      if (finished) {
        clearInterval(timer.current)
        setBusy(null)
        if (label === 'Reading pages' && fresh?.remainingPages === 0) {
          toast('The allowance ran out before every ticked page was read. The ticks stay, so Read carries on when it renews.')
        } else {
          toast.success(label === 'Reading pages' ? `Done. ${agentName || 'The agent'}’s knowledge matches the ticks.` : 'Done looking for pages.')
        }
        onRunFinished?.()
      } else if (ticks === SLOW_AFTER) {
        setSlow(true)
      } else if (ticks >= GIVE_UP_AFTER) {
        clearInterval(timer.current)
        setBusy(null)
      }
    }, POLL_MS)
  }

  // the box answers the click first; a refusal puts the truth back
  const pick = async (id, selected) => {
    setData(d => ({ ...d, content: d.content.map(p => (p.id === id ? { ...p, isSelected: selected } : p)) }))
    setTicked(n => n + (selected ? 1 : -1))
    try {
      await webScrapeService.updateSelection(organizationId, integration.id, { pageIds: [id], selected }, getToken())
    } catch (error) {
      toast.error(getErrorMessage(error))
      load()
    }
  }

  // "all" means every page of the site, except while filtering: then the box acts on the pages listed
  const shown = data.content
  const shownTicked = shown.filter(p => p.isSelected).length
  const allTicked = filtering ? shown.length > 0 && shownTicked === shown.length : data.totalElements > 0 && ticked === data.totalElements

  const pickAll = async selected => {
    try {
      const payload = filtering
        ? { pageIds: shown.filter(p => p.status !== 'REMOVED').map(p => p.id), selected }
        : { selectAll: true, selected }
      await webScrapeService.updateSelection(organizationId, integration.id, payload, getToken())
      load()
    } catch (error) {
      toast.error(getErrorMessage(error))
    }
  }

  const readOne = async id => {
    setFetchingId(id)
    try {
      await webScrapeService.fetchPageContent(organizationId, integration.id, id, getToken())
      await load()
      loadBudget()
    } catch (error) {
      toast.error(getErrorMessage(error))
    } finally {
      setFetchingId(null)
    }
  }

  const forget = async p => {
    try {
      await webScrapeService.removePageContent(organizationId, integration.id, p.id, getToken())
      toast.success('Page taken out of the knowledge')
      load()
    } catch (error) {
      toast.error(getErrorMessage(error))
    }
  }

  const left = budget?.remainingPages ?? null
  const overBudget = left != null && ticked > left
  const totalPages = Math.ceil((data.totalElements || 0) / PAGE_SIZE)

  return (
    <>
      <div className='card' style={{ minWidth: 0 }}>
        <div className='card-h' style={{ flexWrap: 'wrap', gap: 8 }}>
          <h3 style={{ flex: 1 }}>Pages</h3>
          <button
            className='btn s'
            disabled={Boolean(busy)}
            title={`Lists the pages the site exposes${limit ? `, up to ${limit}` : ''}. Free: nothing is downloaded.`}
            onClick={() => run('Looking for pages', webScrapeService.crawl)}
          >
            <Radar className='lucide' />
            Find pages
          </button>
          <button
            className='btn ghost s'
            disabled={Boolean(busy)}
            title='Follows the links page by page to find what Find pages missed. Every page it visits is billed.'
            onClick={() => setConfirmDeep(true)}
          >
            <Telescope className='lucide' />
            Search deeper
          </button>
        </div>

        {busy && (
          <div className='card-b' style={{ borderBottom: '1px solid var(--border)' }}>
            <div className='row sm'>
              <Spinner size={14} />
              <span style={{ flex: 1 }}>
                {busy.label}
                {busy.label === 'Reading pages' ? ` — ${ticked} ticked` : ` — ${data.totalElements} found`}
              </span>
              <span className='faint num'>{elapsed < 60 ? `${elapsed}s` : `${Math.floor(elapsed / 60)}m ${elapsed % 60}s`}</span>
            </div>
            {slow && <p className='faint sm' style={{ marginTop: 6 }}>Taking longer than usual. Pages appear below as they arrive.</p>}
          </div>
        )}

        <div className='toolbar'>
          <select className='input' style={{ width: 'auto' }} value={view} onChange={e => { setView(e.target.value); setPage(0) }} aria-label='Show'>
            {VIEWS.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <label className='search' style={{ flex: 1, minWidth: 180 }}>
            <Search className='lucide' />
            <input placeholder='Search pages…' value={typed} onChange={e => setTyped(e.target.value)} />
          </label>
          {left != null && (
            <span
              className='faint sm'
              style={left === 0 || overBudget ? { color: 'var(--warn)' } : undefined}
              title={`${left} of ${budget.maxPages} pages left this period${budget.period?.to ? `, renews ${formatDate(budget.period.to)}` : ''}.`}
            >
              {left.toLocaleString()} left
            </span>
          )}
          <button
            className='btn primary s'
            disabled={Boolean(busy) || left === 0}
            title={
              left === 0
                ? 'The allowance for this period is spent.'
                : overBudget
                ? `Only ${left} of the ${ticked} ticked pages fit in the allowance. The rest keep their tick for later.`
                : ticked
                ? `Reads the ${ticked} ticked pages and takes out anything no longer ticked`
                : 'Nothing is ticked, so this takes every page Gendox has read back out of the knowledge'
            }
            onClick={() => run('Reading pages', webScrapeService.scrape)}
          >
            <Download className='lucide' />
            {ticked ? `Read ${ticked}` : 'Read'}
          </button>
        </div>

        {shown.length === 0 ? (
          <Empty
            icon={<Radar className='lucide' />}
            title={filtering ? 'No pages match' : 'No pages yet'}
            text={filtering ? 'Try another view or search.' : 'Press Find pages: Gendox lists the site’s pages, and you tick the ones to read.'}
          />
        ) : (
          <>
            <div className='scroll'>
              <table className='table'>
                <thead>
                  <tr>
                    <th className='chk'>
                      <input
                        type='checkbox'
                        checked={allTicked}
                        onChange={e => pickAll(e.target.checked)}
                        title={filtering ? `Tick the ${shown.length} pages listed` : 'Tick every page of the site'}
                        aria-label='Tick all'
                      />
                    </th>
                    <th>Page</th>
                    <th style={{ textAlign: 'right' }}>Last read</th>
                  </tr>
                </thead>
                <tbody>
                  {shown.map(p => {
                    const gone = p.status === 'REMOVED'
                    const stored = Boolean(p.documentInstanceId)
                    const read = formatWhen(p.lastScrapedAt)

                    return (
                      <tr key={p.id} className={p.isSelected ? 'sel' : ''} style={{ cursor: gone ? 'default' : 'pointer' }} onClick={() => !gone && pick(p.id, !p.isSelected)}>
                        <td className='chk' onClick={e => e.stopPropagation()}>
                          <input type='checkbox' checked={Boolean(p.isSelected)} disabled={gone} onChange={e => pick(p.id, e.target.checked)} aria-label='Read this page' />
                        </td>
                        <td style={{ minWidth: 0 }}>
                          <div className='row' style={{ gap: 6, alignItems: 'flex-start' }}>
                            <span style={{ overflowWrap: 'anywhere' }}>{p.title || pathOf(p.url, integration.url)}</span>
                            <a href={p.url} target='_blank' rel='noreferrer' onClick={e => e.stopPropagation()} title='Open the page' className='faint'>
                              <ArrowUpRight className='lucide' style={{ width: 13, height: 13 }} />
                            </a>
                          </div>
                          {p.title && <div className='faint sm'>{pathOf(p.url, integration.url)}</div>}
                        </td>
                        <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }} onClick={e => e.stopPropagation()}>
                          <div className='row' style={{ gap: 6, justifyContent: 'flex-end' }}>
                            {gone && <span className='badge'>Gone from the site</span>}
                            {p.status === 'FAILED' && <span className='badge dot err'>Couldn’t read</span>}
                            {!gone && p.isSelected && !stored && <span className='badge dot info'>Will be read</span>}
                            {!gone && !p.isSelected && stored && <span className='badge dot warn'>Will be taken out</span>}
                            {stored && <span className='faint sm'>{read ?? 'Read'}</span>}
                            {!gone && !stored && (
                              <button className='btn ghost s icon' title='Read this page now' disabled={fetchingId === p.id} onClick={() => readOne(p.id)}>
                                {fetchingId === p.id ? <Spinner size={13} /> : <Download className='lucide' />}
                              </button>
                            )}
                            {stored && (
                              <button className='btn ghost s icon' title='Take it out of the knowledge' onClick={() => setForgetting(p)}>
                                <X className='lucide' />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            <div className='pager'>
              <span className='faint sm num'>
                {page * PAGE_SIZE + 1}–{page * PAGE_SIZE + shown.length} of {data.totalElements} · {ticked} ticked
              </span>
              <span className='sp' />
              <button className='btn ghost s icon' disabled={page === 0} onClick={() => setPage(n => n - 1)} aria-label='Previous page'>
                <ChevronLeft className='lucide' />
              </button>
              <button className='btn ghost s icon' disabled={page + 1 >= totalPages} onClick={() => setPage(n => n + 1)} aria-label='Next page'>
                <ChevronRight className='lucide' />
              </button>
            </div>
          </>
        )}
      </div>

      <p className='faint sm'>
        Tick pages and press Read. Ticked pages stay in {agentName ? `${agentName}’s` : 'the agent’s'} knowledge and are read
        again on the schedule; untick a page and the next Read takes it out.
      </p>

      <ConfirmDialog
        open={confirmDeep}
        onClose={() => setConfirmDeep(false)}
        title='Search deeper?'
        text={`Gendox follows the links on the site page by page${limit ? `, up to ${limit} pages` : ''}, to find what Find pages missed. It takes a few minutes, and every page it visits is billed. It doesn’t read anything into the knowledge: you still pick the pages.`}
        confirmLabel='Search deeper'
        danger={false}
        onConfirm={() => run('Searching deeper', webScrapeService.deepCrawl)}
      />
      <ConfirmDialog
        open={Boolean(forgetting)}
        onClose={() => setForgetting(null)}
        title='Take this page out?'
        text={`The text Gendox kept from ${forgetting ? pathOf(forgetting.url, integration.url) : 'this page'} is removed from the knowledge. The page stays on this list and isn’t read again unless you tick it.`}
        confirmLabel='Take it out'
        onConfirm={() => forget(forgetting)}
      />
    </>
  )
}

export default WebPagesPicker
