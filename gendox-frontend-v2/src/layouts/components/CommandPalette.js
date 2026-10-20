import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { CornerDownLeft, FilePenLine, Library, Search, SquarePen, Upload } from 'lucide-react'
import navigation from 'src/navigation'
import useActiveScope from 'src/hooks/useActiveScope'
import searchService from 'src/gendox-sdk/searchService'
import { localStorageConstants } from 'src/utils/generalConstants'
import Avatar from 'src/components/ui/Avatar'
import FileTile from 'src/components/ui/FileTile'
import Spinner from 'src/components/ui/Spinner'
import { toPlainPreview } from 'src/components/chat/chatUtils'
import { fileNameOf, sectionTitleOf, tileTypeOf } from 'src/components/knowledge/documentUtils'

const DOCUMENTS_SIZE = 5

/**
 * ⌘K search: the organization's agents and the app's pages by name,
 * and passages in the current agent's documents by meaning (POST messages/search, after 3 characters).
 */
const CommandPalette = ({ open, onClose }) => {
  const router = useRouter()
  const { projects, project, projectId, href } = useActiveScope()
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const [passages, setPassages] = useState([])
  const [isSearching, setIsSearching] = useState(false)

  useEffect(() => {
    if (open) {
      setQuery('')
      setActive(0)
      setPassages([])
    }
  }, [open])

  const value = query.trim()

  useEffect(() => {
    setPassages([])
    if (!open || !projectId || value.length < 3) return setIsSearching(false)
    setIsSearching(true)
    let current = true
    const timer = setTimeout(async () => {
      try {
        const token = window.localStorage.getItem(localStorageConstants.accessTokenKey)
        const response = await searchService.postSearchMessage(value, projectId, DOCUMENTS_SIZE, 0, token)
        if (current) setPassages(Array.isArray(response.data) ? response.data : [])
      } catch {
        if (current) setPassages([])
      } finally {
        if (current) setIsSearching(false)
      }
    }, 500)

    return () => {
      current = false
      clearTimeout(timer)
    }
  }, [open, value, projectId])

  const { agents, documents, pages, actions, results } = useMemo(() => {
    const lower = value.toLowerCase()
    const matches = text => !lower || text.toLowerCase().includes(lower)

    const agents = projects
      .filter(p => matches(p.name))
      .map(p => ({ key: p.id, project: p, href: href('/gendox/agent-home', { projectId: p.id }) }))

    const documents = passages.map(passage => ({
      key: passage.id,
      passage,
      href: href('/gendox/document-instance', { documentId: passage.documentInstanceDTO?.id, sectionId: passage.id })
    }))

    const pages = navigation
      .flatMap(group => group.items)
      .filter(item => item.path && matches(item.title))
      .slice(0, lower ? 6 : 4)
      .map(item => ({ key: item.id, item, href: href(item.path) }))

    const actions = lower
      ? []
      : [
          { key: 'new-chat', icon: SquarePen, title: 'New chat', href: `${href('/gendox/agent-home')}#/chat/new` },
          ...(projectId
            ? [
                { key: 'upload', icon: Upload, title: 'Upload documents', href: href('/gendox/knowledge') + '#upload' },
                { key: 'write', icon: FilePenLine, title: 'Write a document', href: href('/gendox/create-document') }
              ]
            : [])
        ]

    return { agents, documents, pages, actions, results: [...agents, ...documents, ...pages, ...actions] }
  }, [value, projects, passages, projectId, href])

  const go = result => {
    onClose()
    router.push(result.href)
  }

  const onKeyDown = e => {
    if (e.key === 'Escape') return onClose()
    if (results.length === 0) return
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault()
      setActive(i => (i + (e.key === 'ArrowDown' ? 1 : -1) + results.length) % results.length)
    }
    if (e.key === 'Enter' && results[active]) go(results[active])
  }

  // a row's props: highlighted while the keyboard or the mouse is on it
  const rowProps = (result, position, className = 'mi') => ({
    href: result.href,
    className: `${className} ${position === active ? 'on' : ''}`,
    onMouseEnter: () => setActive(position),
    onClick: onClose
  })

  if (!open) return null

  return createPortal(
    <div className='modal-bg palette-bg' onMouseDown={e => e.target === e.currentTarget && onClose()}>
      <div className='modal palette' role='dialog' aria-label='Search'>
        <label className='pal-in'>
          <Search className='lucide' />
          <input
            autoFocus
            placeholder='Search agents, documents, pages…'
            value={query}
            onChange={e => {
              setQuery(e.target.value)
              setActive(0)
            }}
            onKeyDown={onKeyDown}
          />
          <span className='kbd'>esc</span>
        </label>
        {project && (
          <div className='pal-scope'>
            <Library className='lucide' />
            <span>
              Documents are searched by meaning in <b>{project.name}</b>’s knowledge
            </span>
          </div>
        )}
        <div className='pal-r'>
          {agents.length > 0 && <div className='h'>Agents</div>}
          {agents.map((result, index) => (
            <Link key={result.key} {...rowProps(result, index)}>
              <Avatar name={result.project.name} seed={result.project.id} size='s' />
              <span className='trunc' style={{ flex: 1 }}>
                {result.project.name}
              </span>
              {result.project.id === projectId && <span className='faint sm'>Current</span>}
            </Link>
          ))}

          {documents.length > 0 && <div className='h'>In {project?.name || 'this agent'}’s knowledge</div>}
          {documents.map((result, index) => {
            const document = result.passage.documentInstanceDTO || {}
            const title = sectionTitleOf(result.passage)

            return (
              <Link key={result.key} {...rowProps(result, agents.length + index, 'mi tall')}>
                <FileTile name={fileNameOf(document)} type={tileTypeOf(document)} />
                <span style={{ minWidth: 0, flex: 1 }}>
                  <span className='trunc' style={{ display: 'block' }}>
                    {document.title}
                    {title && <span className='faint'> · {title}</span>}
                  </span>
                  <span className='faint sm clamp2'>{toPlainPreview(result.passage.sectionValue).slice(0, 160)}</span>
                </span>
              </Link>
            )
          })}
          {projectId && value.length > 0 && value.length < 3 && (
            <div className='h'>Type 3 letters to search inside documents</div>
          )}
          {isSearching && documents.length === 0 && (
            <div className='h row'>
              <Spinner size={12} />
              Searching {project?.name || 'the agent'}’s knowledge…
            </div>
          )}

          {pages.length > 0 && <div className='h'>Go to</div>}
          {pages.map((result, index) => {
            const Icon = result.item.icon

            return (
              <Link key={result.key} {...rowProps(result, agents.length + documents.length + index)}>
                <Icon className='lucide' />
                <span style={{ flex: 1 }}>{result.item.title}</span>
                <CornerDownLeft className='lucide' />
              </Link>
            )
          })}

          {actions.length > 0 && <div className='h'>Actions</div>}
          {actions.map((result, index) => {
            const Icon = result.icon

            return (
              <Link
                key={result.key}
                {...rowProps(result, agents.length + documents.length + pages.length + index)}
              >
                <Icon className='lucide' />
                <span style={{ flex: 1 }}>{result.title}</span>
              </Link>
            )
          })}

          {results.length === 0 && !isSearching && <div className='h'>Nothing found for “{value}”</div>}
        </div>
      </div>
    </div>,
    document.body
  )
}

export default CommandPalette
