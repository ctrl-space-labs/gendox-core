import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useDispatch, useSelector } from 'react-redux'
import toast from 'react-hot-toast'
import {
  ArrowLeft,
  ChevronsDownUp,
  CloudAlert,
  Cloud,
  Ellipsis,
  FileX,
  GripVertical,
  LoaderCircle,
  MessageSquareText,
  Pencil,
  Plus,
  Quote,
  Trash2
} from 'lucide-react'
import { useAuth } from 'src/authentication/useAuth'
import useActiveScope from 'src/hooks/useActiveScope'
import useOrganizationUsers from 'src/hooks/useOrganizationUsers'
import { fetchProject } from 'src/store/activeProject/activeProject'
import documentService from 'src/gendox-sdk/documentService'
import { getErrorMessage } from 'src/utils/errorHandler'
import { localStorageConstants } from 'src/utils/generalConstants'
import { isValidOrganizationAndProject } from 'src/utils/validators'
import { ViewMain, scrollWithin, useScreenTitle, useView } from 'src/views/ViewContext'
import Chat from 'src/components/chat/Chat'
import useChat from 'src/components/chat/useChat'
import Markdown from 'src/components/chat/Markdown'
import {
  authorOf,
  createdAtOf,
  fileNameOf,
  formatDate,
  plural,
  sectionTitleOf,
  sortSections,
  tileTypeOf,
  typeNameOf
} from 'src/components/knowledge/documentUtils'
import ConfirmDialog from 'src/components/ui/ConfirmDialog'
import Empty from 'src/components/ui/Empty'
import FileTile from 'src/components/ui/FileTile'
import Menu from 'src/components/ui/Menu'
import Spinner from 'src/components/ui/Spinner'

const AUTOSAVE_MS = 900
const CITED_MS = 10000

const getToken = () => window.localStorage.getItem(localStorageConstants.accessTokenKey)

const sectionAnchor = section => `sec-${section.id}`

// The chat beside the document. It keeps its thread in the URL, like the chat page.
const DocumentAskPanel = ({ title, onClose }) => {
  const { token, newThread, openThread } = useChat()
  const { href } = useActiveScope()

  const documentHref = source =>
    href('/gendox/document-instance', { documentId: source.documentId, sectionId: source.sectionId })

  return (
    <Chat
      token={token}
      variant='panel'
      header
      threadsDrawer
      greeting={false}
      footnote=''
      placeholder={`Ask about ${title}…`}
      prefill={`In “${title}”, `}
      documentHref={documentHref}
      onNewThread={newThread}
      onOpenThread={openThread}
      onClose={onClose}
    />
  )
}

// One section in edit mode: title, Markdown with a preview, collapse and delete
const EditSection = ({ draft, index, onChange, onDelete, onDragStart, onDrop, isDragging }) => {
  const [preview, setPreview] = useState(false)
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div
      className={`edit-sec ${collapsed ? 'min' : ''} ${isDragging ? 'dragging' : ''}`}
      id={`edit-${draft.id}`}
      draggable
      onDragStart={e => {
        if (e.target.matches('input, textarea')) return e.preventDefault()
        onDragStart(index)
      }}
      onDragOver={e => e.preventDefault()}
      onDrop={e => {
        e.preventDefault()
        onDrop(index)
      }}
    >
      <div className='h'>
        <span className='grip' title='Drag to reorder'>
          <GripVertical className='lucide' />
        </span>
        <input
          className='title'
          value={draft.title}
          placeholder='Untitled section'
          aria-label='Section title'
          onChange={e => onChange(draft.id, { title: e.target.value })}
        />
        <div className='pill-tabs' style={{ padding: 2 }}>
          <button className={preview ? '' : 'on'} style={{ height: 24 }} onClick={() => setPreview(false)}>
            Write
          </button>
          <button className={preview ? 'on' : ''} style={{ height: 24 }} onClick={() => setPreview(true)}>
            Preview
          </button>
        </div>
        <button
          className='btn ghost s icon'
          title={collapsed ? 'Expand' : 'Collapse'}
          onClick={() => setCollapsed(c => !c)}
        >
          <ChevronsDownUp className='lucide' />
        </button>
        <button className='btn ghost s icon' title='Delete section' onClick={() => onDelete(draft)}>
          <Trash2 className='lucide' />
        </button>
      </div>
      {preview ? (
        <div className='prev'>
          <Markdown text={draft.value} className='prose' />
        </div>
      ) : (
        <textarea
          value={draft.value}
          rows={Math.min(14, draft.value.split('\n').length + 2)}
          onChange={e => onChange(draft.id, { value: e.target.value })}
        />
      )}
    </div>
  )
}

// A knowledge document, read by its sections; ?sectionId= highlights a cited one.
/**
 * One document by its sections (?documentId, ?sectionId for a cited passage), with edit mode.
 * Shown as a page and as a dock tab, so it keeps the document in its own state, not the store:
 * two tabs can show two documents. "Ask about it" is a panel beside it on a page, and a new chat tab in the dock.
 */
const DocumentView = () => {
  const dispatch = useDispatch()
  const view = useView()
  const { user } = useAuth()
  const { organizationId, projectId, href } = useActiveScope()
  const organizationUsers = useOrganizationUsers(organizationId)
  const { documentId, sectionId, ask } = view.query

  const [loaded, setLoaded] = useState({ document: null, sections: [], error: null })
  const { document: storedDocument, sections: storedSections, error } = loaded
  const { projectMembers } = useSelector(state => state.activeProject)

  const [mode, setMode] = useState('view')
  const [asking, setAsking] = useState(false)
  const [drafts, setDrafts] = useState([])
  const [saveState, setSaveState] = useState('saved')
  const [dragIndex, setDragIndex] = useState(null)
  const [confirm, setConfirm] = useState(null)
  const [citedId, setCitedId] = useState(null)
  const [isLoaded, setIsLoaded] = useState(false)

  const timers = useRef({})
  const draftsRef = useRef([])
  const pending = useRef(new Set())
  const failed = useRef(new Set())

  const document = storedDocument?.id === documentId ? storedDocument : null
  const sections = useMemo(() => (document ? sortSections(storedSections) : []), [document, storedSections])
  const title = document?.title || 'Document'
  useScreenTitle(document?.title)
  const knowledgeHref = href('/gendox/knowledge')
  draftsRef.current = drafts

  const load = useCallback(() => {
    if (!documentId) return Promise.resolve()

    return documentService
      .getDocumentById(documentId, getToken())
      .then(response => setLoaded({ document: response.data, sections: response.data.documentInstanceSections ?? [], error: null }))
      .catch(e => setLoaded({ document: null, sections: [], error: e.response?.data ?? e.message ?? true }))
      .finally(() => setIsLoaded(true))
  }, [documentId])

  useEffect(() => {
    setIsLoaded(false)
    setMode('view')
    load()
  }, [load])

  useEffect(() => {
    if (isValidOrganizationAndProject(organizationId, projectId, user)) {
      dispatch(fetchProject({ organizationId, projectId, token: getToken() }))
    }
  }, [dispatch, organizationId, projectId, user])

  useEffect(() => {
    if (ask && document) setAsking(true)
  }, [ask, document])

  // a cited section is scrolled to and highlighted for a while; #3 scrolls to the third section
  useEffect(() => {
    if (!document || sections.length === 0 || mode !== 'view') return
    const order = parseInt(window.location.hash.slice(1), 10)
    const target =
      sections.find(s => s.id === sectionId) ||
      (!isNaN(order) ? sections.find(s => Number(s.documentSectionMetadata?.sectionOrder) === order) : null)
    if (!target) return
    if (target.id === sectionId) setCitedId(target.id)
    setTimeout(() => scrollWithin(window.document.getElementById(sectionAnchor(target))), 50)
    const timer = setTimeout(() => setCitedId(null), CITED_MS)

    return () => clearTimeout(timer)
  }, [document?.id, sections.length, sectionId, mode])

  // ---------- edit ----------
  const updateSaveState = () =>
    setSaveState(
      pending.current.size > 0 || Object.keys(timers.current).length > 0
        ? 'saving'
        : failed.current.size > 0
        ? 'failed'
        : 'saved'
    )

  const save = async draft => {
    pending.current.add(draft.id)
    updateSaveState()
    try {
      await documentService.updateDocumentSection(
        document.id,
        draft.id,
        {
          ...draft.section,
          sectionValue: draft.value,
          documentInstanceDTO: document,
          // an untitled section keeps the splitter's "Default Title", which is never shown
          documentSectionMetadata: {
            ...draft.section.documentSectionMetadata,
            title: draft.title.trim() || 'Default Title'
          }
        },
        getToken()
      )
      failed.current.delete(draft.id)
    } catch (error) {
      failed.current.add(draft.id)
      toast.error(`Couldn’t save the section. ${getErrorMessage(error)}`, { id: 'section-save' })
    } finally {
      pending.current.delete(draft.id)
      updateSaveState()
    }
  }

  const saveLater = id => {
    clearTimeout(timers.current[id])
    timers.current[id] = setTimeout(() => {
      delete timers.current[id]
      const draft = draftsRef.current.find(d => d.id === id)
      if (draft) save(draft)
    }, AUTOSAVE_MS)
  }

  const changeDraft = (id, changes) => {
    setDrafts(list => list.map(d => (d.id === id ? { ...d, ...changes } : d)))
    setSaveState('saving')
    saveLater(id)
  }

  const startEditing = () => {
    setAsking(false)
    setDrafts(
      sections.map(section => ({
        id: section.id,
        section,
        title: section.documentSectionMetadata?.title === 'Default Title' ? '' : section.documentSectionMetadata?.title || '',
        value: section.sectionValue || ''
      }))
    )
    setSaveState('saved')
    setMode('edit')
  }

  const flushSaves = () => {
    Object.entries(timers.current).forEach(([id, timer]) => {
      clearTimeout(timer)
      const draft = draftsRef.current.find(d => d.id === id)
      if (draft) save(draft)
    })
    timers.current = {}
  }

  const finishEditing = async () => {
    flushSaves()
    while (pending.current.size > 0) await new Promise(resolve => setTimeout(resolve, 100))
    await load()
    setMode('view')
  }

  useEffect(() => {
    return () => Object.values(timers.current).forEach(clearTimeout)
  }, [])

  const addSection = async () => {
    try {
      const response = await documentService.createDocumentSection(document.id, getToken())
      const section = response.data
      setDrafts(list => [...list, { id: section.id, section, title: '', value: '' }])
      setTimeout(() => {
        const box = window.document.getElementById(`edit-${section.id}`)
        scrollWithin(box)
        box?.querySelector('textarea')?.focus()
      }, 50)
    } catch (error) {
      toast.error(`Couldn’t add a section. ${getErrorMessage(error)}`)
    }
  }

  const deleteSection = async draft => {
    try {
      clearTimeout(timers.current[draft.id])
      delete timers.current[draft.id]
      await documentService.deleteDocumentSection(document.id, draft.id, getToken())
      setDrafts(list => list.filter(d => d.id !== draft.id))
      toast.success('Section deleted')
    } catch (error) {
      toast.error(`Couldn’t delete the section. ${getErrorMessage(error)}`)
    }
  }

  const dropAt = async index => {
    if (dragIndex == null || dragIndex === index) return setDragIndex(null)
    const next = [...drafts]
    const [moved] = next.splice(dragIndex, 1)
    next.splice(index, 0, moved)
    setDrafts(next)
    setDragIndex(null)
    const payload = next.map((draft, i) => ({
      sectionId: draft.id,
      documentSectionMetadataId: draft.section.documentSectionMetadata?.id,
      sectionOrder: i + 1
    }))
    try {
      await documentService.updateSectionsOrder(document.id, payload, getToken())
      toast.success('Order saved')
    } catch (error) {
      toast.error(`Couldn’t save the order. ${getErrorMessage(error)}`)
    }
  }

  const deleteDocument = async () => {
    try {
      await documentService.deleteDocument(organizationId, projectId, document.id, getToken())
      toast.success('Document deleted')
      view.open(knowledgeHref)
    } catch (error) {
      toast.error(`Couldn’t delete the document. ${getErrorMessage(error)}`)
    }
  }

  // ---------- render ----------
  if (!isLoaded && !document) {
    return (
      <ViewMain>
        <div className='center' style={{ padding: 80 }}>
          <Spinner />
        </div>
      </ViewMain>
    )
  }

  if (!document) {
    return (
      <ViewMain>
        <div className='card'>
          <Empty
            icon={<FileX className='lucide' />}
            title='This document isn’t available'
            text={
              error
                ? 'It may have been deleted, or it belongs to an agent you can’t see.'
                : 'Open a document from Knowledge.'
            }
            action={
              <Link className='btn' href={knowledgeHref}>
                <ArrowLeft className='lucide' />
                Knowledge
              </Link>
            }
          />
        </div>
      </ViewMain>
    )
  }

  const author = authorOf(document, projectMembers, organizationUsers)
  const titled = sections.filter(sectionTitleOf)

  return (
    <ViewMain>
      {view.mode === 'page' && (
        <Head>
          <title>{`${title} · Gendox`}</title>
        </Head>
      )}
        <div className='doc-h'>
          <Link className='btn ghost s icon' href={knowledgeHref} title='Back to Knowledge'>
            <ArrowLeft className='lucide' />
          </Link>
          <FileTile name={fileNameOf(document)} type={tileTypeOf(document)} className='big' />
          <div style={{ flex: 1, minWidth: 200 }}>
            <h1 className='doc-t'>{title}</h1>
            <div className='faint sm'>
              {[
                typeNameOf(document),
                document.numberOfPages > 0 ? plural(document.numberOfPages, 'page') : null,
                plural(sections.length, 'section'),
                `added ${author ? `by ${author} ` : ''}on ${formatDate(createdAtOf(document))}`
              ]
                .filter(Boolean)
                .join(' · ')}
              {document.externalUrl && (
                <>
                  {' · '}
                  <a className='link' href={document.externalUrl} target='_blank' rel='noopener noreferrer'>
                    {document.externalUrl.replace(/^https?:\/\//, '')}
                  </a>
                </>
              )}
            </div>
          </div>
          {mode === 'view' ? (
            <div className='row'>
              {sections.length > 0 && (
                <button className='btn s' onClick={() => (view.ask ? view.ask(`In “${title}”, `) : setAsking(a => !a))}>
                  <MessageSquareText className='lucide' />
                  Ask about it
                </button>
              )}
              <button className='btn s' onClick={startEditing}>
                <Pencil className='lucide' />
                Edit sections
              </button>
              <Menu
                align='right'
                width={220}
                trigger={({ onClick }) => (
                  <button className='btn ghost s icon' title='More' onClick={onClick}>
                    <Ellipsis className='lucide' />
                  </button>
                )}
              >
                <button
                  className='mi'
                  data-close-menu
                  style={{ color: 'var(--err)' }}
                  onClick={() =>
                    setConfirm({
                      title: 'Delete this document?',
                      text: `“${title}” will be removed from the agent’s knowledge. Answers will no longer cite it.`,
                      onConfirm: deleteDocument
                    })
                  }
                >
                  <Trash2 className='lucide' />
                  Delete document
                </button>
              </Menu>
            </div>
          ) : (
            <div className='row'>
              <span className='faint sm row'>
                {saveState === 'saving' ? (
                  <>
                    <LoaderCircle className='lucide' />
                    Saving…
                  </>
                ) : saveState === 'failed' ? (
                  <span className='row' style={{ color: 'var(--err)' }}>
                    <CloudAlert className='lucide' />
                    Not saved
                  </span>
                ) : (
                  <>
                    <Cloud className='lucide' />
                    All changes saved
                  </>
                )}
              </span>
              <button className='btn s' onClick={addSection}>
                <Plus className='lucide' />
                Add section
              </button>
              <button className='btn s primary' onClick={finishEditing}>
                Done
              </button>
            </div>
          )}
        </div>

        <div className={`docpage ${mode === 'edit' ? 'editing' : asking ? 'asking' : ''}`}>
          {mode === 'view' && (
            <nav className='outline'>
              {titled.length > 0 && (
                <span className='label' style={{ paddingLeft: 12 }}>
                  On this page
                </span>
              )}
              {titled.map(section => (
                <a
                  key={section.id}
                  href={`#${sectionAnchor(section)}`}
                  onClick={e => {
                    e.preventDefault()
                    scrollWithin(window.document.getElementById(sectionAnchor(section)), 0.05)
                  }}
                >
                  {sectionTitleOf(section)}
                </a>
              ))}
            </nav>
          )}

          <article>
            {mode === 'view' ? (
              sections.length > 0 ? (
                sections.map(section => (
                  <section
                    key={section.id}
                    id={sectionAnchor(section)}
                    className={`sec ${citedId === section.id ? 'cited' : ''}`}
                  >
                    {section.id === sectionId && citedId === section.id && (
                      <div className='label' style={{ color: 'var(--accent-text)' }}>
                        <Quote className='lucide' />
                        Cited in an answer
                      </div>
                    )}
                    {sectionTitleOf(section) && <h2>{sectionTitleOf(section)}</h2>}
                    <Markdown text={section.sectionValue || ''} className='prose' />
                  </section>
                ))
              ) : (
                <div className='card'>
                  <Empty
                    icon={<LoaderCircle className='lucide' />}
                    title='No sections yet'
                    text='The document hasn’t been processed, so it has no sections to read or cite yet.'
                  />
                </div>
              )
            ) : (
              <>
                <div className='stack'>
                  {drafts.map((draft, index) => (
                    <EditSection
                      key={draft.id}
                      draft={draft}
                      index={index}
                      isDragging={dragIndex === index}
                      onChange={changeDraft}
                      onDelete={d =>
                        setConfirm({
                          title: 'Delete this section?',
                          text: `${d.title ? `“${d.title}”` : 'This section'} will be removed and no longer cited. This can’t be undone.`,
                          onConfirm: () => deleteSection(d)
                        })
                      }
                      onDragStart={setDragIndex}
                      onDrop={dropAt}
                    />
                  ))}
                </div>
                <p className='faint sm' style={{ marginTop: 12 }}>
                  Sections are what the agent searches and cites. Keep each one about a single topic. Changes save
                  automatically.
                </p>
              </>
            )}
          </article>

          {asking && mode === 'view' && (
            <aside className='card askpanel'>
              <DocumentAskPanel title={title} onClose={() => setAsking(false)} />
            </aside>
          )}
        </div>

      <ConfirmDialog
        open={Boolean(confirm)}
        onClose={() => setConfirm(null)}
        title={confirm?.title}
        text={confirm?.text}
        onConfirm={() => confirm.onConfirm()}
      />
    </ViewMain>
  )
}

export default DocumentView
