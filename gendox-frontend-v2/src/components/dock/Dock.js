import { createPortal } from 'react-dom'
import { createContext, forwardRef, useCallback, useContext, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react'
import { ArrowUpRight, CopyX, EllipsisVertical, Link2, Maximize2, Minimize2, Minus, Plus, Square, X } from 'lucide-react'
import toast from 'react-hot-toast'
import Menu from 'src/components/ui/Menu'

/**
 * Docking windows, like an IDE: tabs in windows (groups) inside resizable splits. Drag a tab onto a window's centre to
 * group it there, or onto an edge to split. Every tab is a URL; `route(url)` turns it into { title, icon, element, closable }.
 * Views are created once per URL and stay mounted while their tab is open, so a chat or a table keeps its state:
 * each renders through a portal into its own element, and that element is moved into whichever window shows the tab.
 * (An iframe inside a view still reloads when its window moves; browsers reload moved iframes.)
 *
 * Layout tree: { type: 'split', dir: 'row' | 'col', sizes: [...], children: [...] } | { type: 'group', id, tabs: [url], active, min }
 * It is saved per `storageKey` in the browser; at 760px or less every tab shows in one window (the saved layout is kept).
 *
 * This is the design for gendox-core#525 (multi-window chat workspace): a pane is a URL routed to a view rendered in
 * the page, never an iframe, so tabs keep the app's sign-in and can be linked and reopened.
 */

const DockTabContext = createContext(null)

/** Inside a tab: { url, active, setTitle(text), setCount(n), rename(url) } */
export const useDockTab = () => useContext(DockTabContext)

const clone = o => JSON.parse(JSON.stringify(o))
const nid = () => 'g' + Math.random().toString(36).slice(2, 8)
const walk = (n, f, p = null) => {
  f(n, p)
  if (n.type === 'split') n.children.forEach(c => walk(c, f, n))
}
const urlsOf = n => (n.type === 'group' ? n.tabs : n.children.flatMap(urlsOf))
const groupsOf = root => {
  const list = []
  walk(root, n => n.type === 'group' && list.push(n))

  return list
}
const parentOf = (root, node) => {
  let parent = null
  walk(root, (n, p) => {
    if (n === node) parent = p
  })

  return parent
}
// groups and splits keep ids, so React keeps their content mounted while the layout changes around them
const withIds = root => {
  walk(root, n => {
    n.id ||= nid()
  })

  return root
}
let viewSeq = 0

const read = key => {
  try {
    return JSON.parse(window.localStorage.getItem(key))
  } catch {
    return null
  }
}

const Dock = forwardRef(({ storageKey, layout, route, newTabs = [], blankUrl, onFocus, fullHref }, ref) => {
  const hostRef = useRef(null)
  const viewsRef = useRef(new Map()) // url → { title, icon, element, closable }
  const [meta, setMeta] = useState({}) // url → { title, count } set by the view itself
  const [mobile, setMobile] = useState(false)
  const [maxId, setMaxId] = useState(null)
  const [focusId, setFocusId] = useState(null)
  const [mobileActive, setMobileActive] = useState(null)

  const view = useCallback(
    url => {
      if (!viewsRef.current.has(url)) {
        const v = route(url)
        if (!v) return null
        const node = window.document.createElement('div')
        node.className = 'tab-node'
        viewsRef.current.set(url, { ...v, key: `v${++viewSeq}`, node })
      }

      return viewsRef.current.get(url)
    },
    [route]
  )

  const freshChat = useCallback(() => {
    const url = blankUrl()

    return { type: 'group', id: nid(), tabs: [url], active: url }
  }, [blankUrl])

  const [root, setRoot] = useState(null)
  const rootRef = useRef(null)
  rootRef.current = root

  // the saved layout, unless a tab in it can't be shown any more
  useEffect(() => {
    const saved = read(storageKey)?.root
    const valid = r => {
      try {
        const list = urlsOf(r)

        return list.length && new Set(list).size === list.length && list.every(u => view(u))
      } catch {
        return false
      }
    }
    setRoot(withIds(valid(saved) ? saved : clone(layout)))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey])

  useEffect(() => {
    const query = window.matchMedia('(max-width: 760px)')
    const sync = () => setMobile(query.matches)
    sync()
    query.addEventListener('change', sync)

    return () => query.removeEventListener('change', sync)
  }, [])

  useEffect(() => {
    if (!root || mobile) return
    try {
      window.localStorage.setItem(storageKey, JSON.stringify({ root }))
    } catch {}
  }, [root, mobile, storageKey])

  // ---------- changes to the tree (on a copy) ----------
  const update = useCallback(fn => {
    const next = clone(rootRef.current)
    const holder = { root: next }
    fn(holder)
    rootRef.current = holder.root
    setRoot(holder.root)
  }, [])

  const removeNode = (holder, node) => {
    const p = parentOf(holder.root, node)
    if (!p) {
      holder.root = freshChat() // the dock is never empty

      return
    }
    const i = p.children.indexOf(node)
    p.children.splice(i, 1)
    p.sizes.splice(i, 1)
    if (p.children.length === 1) {
      const only = p.children[0]
      const gp = parentOf(holder.root, p)
      if (!gp) holder.root = only
      else gp.children[gp.children.indexOf(p)] = only
    }
  }

  const insertBeside = (holder, dst, ng, zone) => {
    const dir = zone === 'left' || zone === 'right' ? 'row' : 'col'
    const after = zone === 'right' || zone === 'bottom'
    const p = parentOf(holder.root, dst)
    if (p && p.dir === dir) {
      const i = p.children.indexOf(dst)
      const s = p.sizes[i] / 2
      const at = after ? i + 1 : i
      p.sizes[i] = s
      p.children.splice(at, 0, ng)
      p.sizes.splice(at, 0, s)
    } else {
      const sp = { type: 'split', id: nid(), dir, children: after ? [dst, ng] : [ng, dst], sizes: [1, 1] }
      if (!p) holder.root = sp
      else p.children[p.children.indexOf(dst)] = sp
    }
  }

  const takeOut = (holder, url, g) => {
    g.tabs = g.tabs.filter(t => t !== url)
    if (g.active === url) g.active = g.tabs[g.tabs.length - 1]
    if (!g.tabs.length) removeNode(holder, g)
  }

  const groupIn = (r, id) => groupsOf(r).find(g => g.id === id)
  const groupWith = (r, url) => groupsOf(r).find(g => g.tabs.includes(url))
  const groupLike = (r, prefix) =>
    groupsOf(r).find(g => g.tabs.some(t => t === prefix || t.startsWith(prefix + '/') || t.startsWith(prefix + '?')))
  const focusedIn = r => groupIn(r, focusId) || groupLike(r, '/chat') || groupsOf(r)[0]

  const forget = urls => {
    urls.forEach(u => {
      viewsRef.current.get(u)?.onClose?.()
      viewsRef.current.delete(u)
    })
    setMeta(m => {
      const next = { ...m }
      urls.forEach(u => delete next[u])

      return next
    })
  }

  // ---------- the api the page uses ----------
  const api = useMemo(
    () => ({
      isOpen: url => !!(rootRef.current && groupWith(rootRef.current, url)),
      urls: () => (rootRef.current ? urlsOf(rootRef.current) : []),
      // focus a URL if open; else add it to a window holding one of the `near` prefixes, or beside the focused one
      open(url, { near = [] } = {}) {
        if (!rootRef.current || !view(url)) return false
        let id
        update(h => {
          let g = groupWith(h.root, url)
          if (!g) {
            g = near.map(prefix => groupLike(h.root, prefix)).find(Boolean)
            if (g) g.tabs.push(url)
            else insertBeside(h, focusedIn(h.root), (g = { type: 'group', id: nid(), tabs: [url] }), 'right')
          }
          g.active = url
          g.min = false
          id = g.id
        })
        setFocusId(id)
        setMobileActive(url)
        setMaxId(m => (m && m !== id ? null : m))

        return true
      },
      close(url) {
        if (!rootRef.current || view(url)?.closable === false) return
        update(h => {
          const g = groupWith(h.root, url)
          if (g) takeOut(h, url, g)
        })
        forget([url])
      },
      // a tab's URL changes, e.g. a new chat once its first message has made the thread; the view stays as it is
      rename(from, to) {
        if (from === to || !viewsRef.current.has(from)) return
        viewsRef.current.set(to, viewsRef.current.get(from))
        viewsRef.current.delete(from)
        setMeta(m => {
          const next = { ...m, [to]: m[from] }
          delete next[from]

          return next
        })
        update(h => {
          const g = groupWith(h.root, from)
          if (!g) return
          g.tabs = g.tabs.map(t => (t === from ? to : t))
          if (g.active === from) g.active = to
        })
        setMobileActive(a => (a === from ? to : a))
      },
      reset() {
        const keep = withIds(clone(layout))
        forget(urlsOf(rootRef.current).filter(u => !urlsOf(keep).includes(u)))
        update(h => {
          h.root = keep
        })
        setMaxId(null)
        setFocusId(null)
      }
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [view, update, layout, focusId]
  )
  useImperativeHandle(ref, () => api, [api])

  // the focused tab: the page shows its title and puts its URL in the address bar
  const activeUrl = root ? (mobile ? (urlsOf(root).includes(mobileActive) ? mobileActive : focusedIn(root).active) : focusedIn(root).active) : null
  useEffect(() => {
    if (activeUrl) onFocus?.(activeUrl, { ...view(activeUrl), ...meta[activeUrl] })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeUrl, meta[activeUrl]?.title])

  // a window's active tab stays in sight in its tab strip
  useEffect(() => {
    hostRef.current?.querySelectorAll('.group-h .strip').forEach(strip => {
      const tab = strip.querySelector('.tab.on')
      if (!tab) return
      if (tab.offsetLeft < strip.scrollLeft) strip.scrollLeft = tab.offsetLeft - 4
      else if (tab.offsetLeft + tab.offsetWidth > strip.scrollLeft + strip.clientWidth)
        strip.scrollLeft = tab.offsetLeft + tab.offsetWidth - strip.clientWidth + 4
    })
  })

  // ---------- drag a tab ----------
  const zoneAt = (x, y) => {
    const el = window.document.elementFromPoint(x, y)?.closest('.group')
    if (!el || !hostRef.current?.contains(el)) return null
    const r = el.getBoundingClientRect()
    const node = groupIn(rootRef.current, el.dataset.gid)
    if (!node) return null
    if (y < r.top + 40 || node.min) return { node, zone: 'center', rect: r }
    const d = { left: (x - r.left) / r.width, right: (r.right - x) / r.width, top: (y - r.top) / r.height, bottom: (r.bottom - y) / r.height }
    const [zone, v] = Object.entries(d).sort((p, q) => p[1] - q[1])[0]
    if (v > 0.3) return { node, zone: 'center', rect: r }
    const w = r.width / 2
    const hh = r.height / 2
    const box = {
      left: [r.left, r.top, w, r.height],
      right: [r.left + w, r.top, w, r.height],
      top: [r.left, r.top, r.width, hh],
      bottom: [r.left, r.top + hh, r.width, hh]
    }[zone]

    return { node, zone, rect: { left: box[0], top: box[1], width: box[2], height: box[3] } }
  }

  const moveTo = (url, srcId, dstId, zone) => {
    let focus = null
    update(h => {
      const src = groupIn(h.root, srcId)
      const dst = groupIn(h.root, dstId)
      if (!src || !dst || (src === dst && (zone === 'center' || src.tabs.length === 1))) return
      takeOut(h, url, src)
      if (zone === 'center') {
        dst.tabs.push(url)
        dst.active = url
        dst.min = false
        focus = dst.id
      } else {
        const ng = { type: 'group', id: nid(), tabs: [url], active: url }
        insertBeside(h, dst, ng, zone)
        focus = ng.id
      }
    })
    if (focus) setFocusId(focus)
    setMaxId(null)
  }

  const tabDown = (e, url, group) => {
    if (e.button !== 0 || e.target.closest('.x')) return
    const sx = e.clientX
    const sy = e.clientY
    let drag = false
    let ghost
    let hint
    let target
    const move = ev => {
      if (mobile || (!drag && Math.hypot(ev.clientX - sx, ev.clientY - sy) < 6)) return
      if (!drag) {
        drag = true
        ghost = Object.assign(window.document.createElement('div'), { className: 'drag-ghost' })
        ghost.textContent = meta[url]?.title ?? view(url)?.title ?? url
        hint = Object.assign(window.document.createElement('div'), { className: 'drop-hint' })
        window.document.body.append(ghost, hint)
        hostRef.current?.classList.add('dragging')
      }
      ghost.style.transform = `translate(${ev.clientX + 14}px, ${ev.clientY + 10}px)`
      target = zoneAt(ev.clientX, ev.clientY)
      hint.style.display = target ? 'block' : 'none'
      if (target) {
        Object.assign(hint.style, {
          left: `${target.rect.left}px`,
          top: `${target.rect.top}px`,
          width: `${target.rect.width}px`,
          height: `${target.rect.height}px`
        })
      }
    }
    const up = () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
      if (!drag) {
        if (group.id === 'm') setMobileActive(url)
        else {
          update(h => {
            const g = groupIn(h.root, group.id)
            if (g) {
              g.active = url
              g.min = false
            }
          })
          setFocusId(group.id)
        }

        return
      }
      ghost.remove()
      hint.remove()
      hostRef.current?.classList.remove('dragging')
      if (target) moveTo(url, group.id, target.node.id, target.zone)
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
  }

  // ---------- resize ----------
  const gutterDown = (e, path, i) => {
    const gutter = e.currentTarget
    const a = gutter.previousElementSibling
    const b = gutter.nextElementSibling
    if (a.classList.contains('min') || b.classList.contains('min')) return
    e.preventDefault()
    const node = path.reduce((n, k) => n.children[k], rootRef.current)
    const row = node.dir !== 'col'
    const size = el => (row ? el.offsetWidth : el.offsetHeight)
    const sa = size(a)
    const sb = size(b)
    const start = row ? e.clientX : e.clientY
    const pair = node.sizes[i - 1] + node.sizes[i]
    let first = node.sizes[i - 1]
    gutter.classList.add('drag')
    hostRef.current.classList.add(row ? 'resizing-row' : 'resizing-col')
    const move = ev => {
      const na = Math.min(Math.max(sa + (row ? ev.clientX : ev.clientY) - start, 160), sa + sb - 160)
      first = (pair * na) / (sa + sb)
      a.style.flexGrow = first
      b.style.flexGrow = pair - first
    }
    const up = () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
      gutter.classList.remove('drag')
      hostRef.current?.classList.remove('resizing-row', 'resizing-col')
      update(h => {
        const n = path.reduce((x, k) => x.children[k], h.root)
        n.sizes[i - 1] = first
        n.sizes[i] = pair - first
      })
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
  }

  if (!root) return <main className='dock' ref={hostRef} />

  const setGroup = (id, fn) =>
    update(h => {
      const g = groupIn(h.root, id)
      if (g) fn(g, h)
    })

  const tabContext = url => ({
    url,
    setTitle: title => setMeta(m => (m[url]?.title === title ? m : { ...m, [url]: { ...m[url], title } })),
    setCount: count => setMeta(m => (m[url]?.count === count ? m : { ...m, [url]: { ...m[url], count } })),
    rename: to => api.rename(url, to)
  })

  // every open view, mounted once, shown in its window when it is that window's active tab
  const groupEl = (n, flat = false, style) => {
    const isFocus = !flat && n === focusedIn(root)
    const isMax = maxId === n.id
    const fixed = n.tabs.some(u => view(u)?.closable === false)
    const page = fullHref?.(n.active)

    return (
      <div
        key={n.id}
        data-gid={n.id}
        style={style}
        className={`group ${n.min ? 'min' : ''} ${isMax ? 'max' : ''} ${isFocus ? 'focus' : ''}`}
        onPointerDown={() => !flat && focusId !== n.id && setFocusId(n.id)}
      >
        <div
          className='group-h'
          onDoubleClick={e => {
            if (flat || e.target.closest('button, a')) return
            setMaxId(isMax ? null : n.id)
            setGroup(n.id, g => (g.min = false))
          }}
        >
          <div className='strip'>
            {n.tabs.map(url => {
              const v = view(url)
              if (!v) return null
              const Icon = v.icon
              const title = meta[url]?.title ?? v.title
              const count = meta[url]?.count ?? v.count

              return (
                <div key={url} className={`tab ${url === n.active ? 'on' : ''}`} title={title} onPointerDown={e => tabDown(e, url, n)}>
                  {Icon && <Icon className='lucide' />}
                  <span className='tt'>{title}</span>
                  {count ? <span className='n'>{count}</span> : null}
                  {v.closable !== false && (
                    <button className='x' title='Close tab' onClick={() => api.close(url)}>
                      <X className='lucide' />
                    </button>
                  )}
                </div>
              )
            })}
            {newTabs.length > 0 && (
              <Menu
                width={220}
                trigger={({ onClick }) => (
                  <button className='add' title='New tab' onClick={onClick}>
                    <Plus className='lucide' />
                  </button>
                )}
              >
                <div className='h'>Open in this window</div>
                {newTabs.map(({ label, icon: Icon, url }) => (
                  <button
                    key={label}
                    className='mi'
                    data-close-menu
                    onClick={() => {
                      const target = typeof url === 'function' ? url() : url
                      if (!view(target)) return
                      update(h => {
                        const g = groupIn(h.root, n.id === 'm' ? focusedIn(h.root).id : n.id)
                        const already = groupWith(h.root, target)
                        if (already) {
                          already.active = target
                          return
                        }
                        g.tabs.push(target)
                        g.active = target
                        g.min = false
                      })
                      setMobileActive(target)
                    }}
                  >
                    <Icon className='lucide' />
                    {label}
                  </button>
                ))}
              </Menu>
            )}
          </div>
          {!flat && (
            <div className='acts'>
              {page && (
                <a href={page} title='Open as a full page'>
                  <ArrowUpRight className='lucide' />
                </a>
              )}
              <Menu
                align='right'
                width={230}
                trigger={({ onClick }) => (
                  <button title='More' onClick={onClick}>
                    <EllipsisVertical className='lucide' />
                  </button>
                )}
              >
                {page && (
                  <a className='mi' href={page}>
                    <ArrowUpRight className='lucide' />
                    Open as a full page
                  </a>
                )}
                <button
                  className='mi'
                  data-close-menu
                  onClick={() => {
                    const link = `${window.location.href.split('#')[0]}#${n.active}`
                    navigator.clipboard?.writeText(link).then(() => toast.success('Link copied'))
                  }}
                >
                  <Link2 className='lucide' />
                  Copy link to tab
                </button>
                <hr />
                <button
                  className='mi'
                  data-close-menu
                  disabled={n.tabs.length < 2}
                  onClick={() => {
                    const closing = n.tabs.filter(u => u !== n.active && view(u)?.closable !== false)
                    setGroup(n.id, g => (g.tabs = g.tabs.filter(u => !closing.includes(u))))
                    forget(closing)
                  }}
                >
                  <CopyX className='lucide' />
                  Close other tabs
                </button>
              </Menu>
              <button
                title={n.min ? 'Restore' : 'Minimize'}
                onClick={() => {
                  setGroup(n.id, g => (g.min = !g.min))
                  if (isMax) setMaxId(null)
                }}
              >
                {n.min ? <Square className='lucide' /> : <Minus className='lucide' />}
              </button>
              <button
                title={isMax ? 'Restore size' : 'Maximize'}
                onClick={() => {
                  setMaxId(isMax ? null : n.id)
                  setGroup(n.id, g => (g.min = false))
                }}
              >
                {isMax ? <Minimize2 className='lucide' /> : <Maximize2 className='lucide' />}
              </button>
              {!fixed && (
                <button
                  title='Close window'
                  onClick={() => {
                    const closing = [...n.tabs]
                    update(h => {
                      const g = groupIn(h.root, n.id)
                      if (g) removeNode(h, g)
                    })
                    if (isMax) setMaxId(null)
                    forget(closing)
                  }}
                >
                  <X className='lucide' />
                </button>
              )}
            </div>
          )}
        </div>
        <div className='group-b'>
          {n.tabs.map(url => {
            const v = view(url)
            if (!v) return null

            return (
              <div
                key={v.key}
                className='tab-b'
                hidden={n.min || url !== n.active}
                ref={el => {
                  if (el && v.node.parentNode !== el) el.appendChild(v.node)
                }}
              />
            )
          })}
        </div>
      </div>
    )
  }

  const build = (n, path = [], style) => {
    if (n.type === 'group') return groupEl(n, false, style)

    return (
      <div key={n.id} style={style} className={`split ${n.dir === 'col' ? 'col' : ''}`}>
        {n.children.flatMap((c, i) => {
          const child = build(c, [...path, i], { flex: `${n.sizes[i]} 1 0` })

          return i ? [<div key={`gut-${c.id}`} className='gutter' onPointerDown={e => gutterDown(e, path, i)} />, child] : [child]
        })}
      </div>
    )
  }

  return (
    <main className={`dock ${maxId && !mobile ? 'has-max' : ''}`} ref={hostRef}>
      {mobile ? groupEl({ type: 'group', id: 'm', tabs: urlsOf(root), active: activeUrl }, true) : build(root)}
      {[...viewsRef.current.entries()].map(([url, v]) =>
        createPortal(<DockTabContext.Provider value={tabContext(url)}>{v.element}</DockTabContext.Provider>, v.node, v.key)
      )}
    </main>
  )
})

export default Dock
