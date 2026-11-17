import { useEffect, useRef, useState } from 'react'
import useActiveScope from 'src/hooks/useActiveScope'
import { getToken } from 'src/components/agent/useAgent'
import documentService from 'src/gendox-sdk/documentService'
import taskService from 'src/gendox-sdk/taskService'
import FileTile from 'src/components/ui/FileTile'
import { TaskTile, typeOfTask } from 'src/components/tasks/taskUtils'
import { fileNameOf, tileTypeOf } from 'src/components/knowledge/documentUtils'

/*
 * @-mentions of the agent's tasks and documents in the message box.
 * A picked item reads "@T12 b" while typing and is sent as a Markdown link to its page, e.g.
 *   [@T12 b](/gendox/tasks/document-insights?taskId=…)
 * so the agent gets the exact id for its tools (get_task, read_task_result, read_document) with no new API,
 * and the question shows the mention as a link that opens it. Editing a mention's text makes it plain text again.
 */

const SIZE = 6
// "@" at the start or after a space, then the name typed so far
const QUERY = /(?:^|\s)@([^@\n]{0,60})$/
// a sent mention: only links to the app's own pages
const LINK = /\[(@[^\]\n]+)\]\((\/gendox\/[^\s)]+)\)/g

const labelOf = title => `@${String(title || 'Untitled').replace(/[[\]\n]+/g, ' ').replace(/\s+/g, ' ').trim()}`
const escape = text => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

const search = async (organizationId, projectId, query) => {
  const token = getToken()
  const [tasks, documents] = await Promise.all([
    taskService.getTasks(organizationId, projectId, token, { size: SIZE, taskNameContains: query || undefined }),
    documentService.getDocuments(
      organizationId,
      projectId,
      { organizationId, projectId, ...(query ? { documentNameContains: query } : {}) },
      token,
      0,
      SIZE
    )
  ])

  return [
    ...(tasks.data?.content ?? []).map(task => ({
      key: `task:${task.id}`,
      label: labelOf(task.title),
      href: `${typeOfTask(task).path || '/gendox/tasks'}?taskId=${task.id}`,
      tile: <TaskTile task={task} />
    })),
    ...(documents.data?.content ?? []).map(document => ({
      key: `document:${document.id}`,
      label: labelOf(document.title || fileNameOf(document)),
      href: `/gendox/document-instance?documentId=${document.id}`,
      tile: <FileTile name={fileNameOf(document)} type={tileTypeOf(document)} />
    }))
  ]
}

/**
 * The mention picker of a message box. Returns what the box wires in:
 *   track()    after the text or the caret moved: opens, filters or closes the picker
 *   onKeyDown  ↑ ↓ Enter Tab Esc while the picker is open; returns true when it used the key
 *   start()    the @ button: types an @ at the caret
 *   toMessage(text)  the text to send, mentions as links
 *   popup      the picker, shown above the box
 */
export const useMentions = ({ enabled, inputRef, value, onChange }) => {
  const { organizationId, projectId } = useActiveScope()
  const [query, setQuery] = useState(null) // { start, end, text }
  const [found, setFound] = useState(null) // { text, items, error }
  const [active, setActive] = useState(0)
  const picked = useRef([])
  const dismissed = useRef(null)
  const items = query && found?.text === query.text ? found.items : []

  // a sent or cleared message forgets its mentions
  useEffect(() => {
    if (!value) {
      picked.current = []
      setQuery(null)
    }
  }, [value])

  useEffect(() => {
    if (!query || !projectId) return
    let current = true
    setActive(0)
    const timer = setTimeout(() => {
      search(organizationId, projectId, query.text)
        .then(items => current && setFound({ text: query.text, items }))
        .catch(() => current && setFound({ text: query.text, items: [], error: true }))
    }, 200)

    return () => {
      current = false
      clearTimeout(timer)
    }
  }, [query?.text, organizationId, projectId]) // eslint-disable-line react-hooks/exhaustive-deps

  const track = () => {
    const input = inputRef.current
    if (!enabled || !input || input.selectionStart !== input.selectionEnd || dismissed.current === input.value) {
      return setQuery(null)
    }
    const before = input.value.slice(0, input.selectionStart)
    const match = before.match(QUERY)
    const start = match ? before.length - match[1].length - 1 : -1
    // the caret is just after a mention already picked
    const done = match && picked.current.some(m => input.value.startsWith(m.label, start))
    setQuery(match && !done ? { start, end: before.length, text: match[1].trim() } : null)
  }

  const pick = item => {
    const label = item.label + ' '
    const next = value.slice(0, query.start) + label + value.slice(query.end)
    const caret = query.start + label.length
    picked.current = [...picked.current.filter(m => m.label !== item.label), item]
    setQuery(null)
    onChange(next)
    requestAnimationFrame(() => {
      inputRef.current?.focus()
      inputRef.current?.setSelectionRange(caret, caret)
    })
  }

  const onKeyDown = e => {
    if (!query || e.nativeEvent.isComposing) return false
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      if (items.length) setActive(i => (i + (e.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length)
    } else if (e.key === 'Escape') {
      dismissed.current = value
      setQuery(null)
    } else if ((e.key === 'Enter' || e.key === 'Tab') && !e.shiftKey && items[active]) {
      pick(items[active])
    } else {
      return false
    }
    e.preventDefault()

    return true
  }

  const start = () => {
    const input = inputRef.current
    const at = input.selectionStart
    const text = at && !/\s/.test(value[at - 1]) ? ' @' : '@'
    dismissed.current = null
    onChange(value.slice(0, at) + text + value.slice(input.selectionEnd))
    input.focus()
    requestAnimationFrame(() => {
      input.setSelectionRange(at + text.length, at + text.length)
      track()
    })
  }

  const toMessage = text => {
    // the mentions still in the text, longest first so "@T12 b" wins over "@T12"
    const mentions = picked.current.filter(m => text.includes(m.label)).sort((a, b) => b.label.length - a.label.length)
    if (!mentions.length) return text
    const href = Object.fromEntries(mentions.map(m => [m.label, m.href]))

    return text.replace(new RegExp(mentions.map(m => escape(m.label)).join('|'), 'g'), label => `[${label}](${href[label]})`)
  }

  const popup = query && (
    <div className='pop gc-mentions' role='listbox' aria-label='Tasks and documents'>
      <div className='h'>Mention a task or document</div>
      {items.map((item, index) => (
        <button
          key={item.key}
          type='button'
          role='option'
          aria-selected={index === active}
          className={`mi ${index === active ? 'on' : ''}`}
          onMouseEnter={() => setActive(index)}
          onMouseDown={e => e.preventDefault()} // keep the caret in the message box
          onClick={() => pick(item)}
        >
          {item.tile}
          <span className='trunc'>{item.label.slice(1)}</span>
        </button>
      ))}
      <div className='h' role='status'>
        {found?.text !== query.text
          ? 'Searching…'
          : found.error
          ? 'Couldn’t search tasks and documents.'
          : items.length
          ? '↑ ↓ to choose · Enter to insert · Esc to close'
          : 'No matching tasks or documents.'}
      </div>
    </div>
  )

  return { enabled, track, onKeyDown, start, toMessage, popup, close: () => setQuery(null) }
}

/** A sent question: its mentions as links, the rest as typed */
export const MentionText = ({ text }) => {
  const { href } = useActiveScope()
  const parts = []
  let last = 0
  for (const match of text.matchAll(LINK)) {
    const [path, query] = match[2].split('?')
    parts.push(text.slice(last, match.index))
    parts.push(
      <a key={match.index} className='gc-mention' href={href(path, Object.fromEntries(new URLSearchParams(query)))}>
        {match[1]}
      </a>
    )
    last = match.index + match[0].length
  }
  parts.push(text.slice(last))

  return <>{parts}</>
}
