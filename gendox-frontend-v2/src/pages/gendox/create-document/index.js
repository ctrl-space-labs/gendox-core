import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/router'
import toast from 'react-hot-toast'
import { ArrowLeft, Bold, Check, Heading2, Italic, List, ListOrdered, Table } from 'lucide-react'
import useActiveScope from 'src/hooks/useActiveScope'
import documentService from 'src/gendox-sdk/documentService'
import { getErrorMessage } from 'src/utils/errorHandler'
import { localStorageConstants } from 'src/utils/generalConstants'
import AppLayout from 'src/layouts/AppLayout'
import Markdown from 'src/components/chat/Markdown'
import ConfirmDialog from 'src/components/ui/ConfirmDialog'

// toolbar button → [icon, title, text to insert]; bold and italic wrap the selection
const TOOLS = [
  [Heading2, 'Heading', '## '],
  [Bold, 'Bold', '**'],
  [Italic, 'Italic', '_'],
  [List, 'List', '- '],
  [ListOrdered, 'Numbered list', '1. '],
  [Table, 'Table', '| Column | Column |\n|---|---|\n| | |']
]

// a file name the backend accepts: no path separators or reserved characters
const fileNameFor = title => `${title.trim().replace(/[\\/:*?"<>|]+/g, '-')}.md`

// Write a Markdown document by hand; it is saved into the agent's knowledge as <title>.md.
const CreateDocumentPage = () => {
  const router = useRouter()
  const { project, organizationId, projectId, href } = useActiveScope()
  const [title, setTitle] = useState('')
  const [text, setText] = useState('')
  const [dirty, setDirty] = useState(false)
  const [titleError, setTitleError] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [confirmLeave, setConfirmLeave] = useState(false)
  const textRef = useRef(null)
  const titleRef = useRef(null)

  const knowledgeHref = href('/gendox/knowledge')

  // closing the tab with unsaved text asks first
  useEffect(() => {
    if (!dirty) return
    const onBeforeUnload = e => e.preventDefault()
    window.addEventListener('beforeunload', onBeforeUnload)

    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [dirty])

  const insert = markup => {
    const input = textRef.current
    const { selectionStart: start, selectionEnd: end, value } = input
    const selected = value.slice(start, end)
    const wraps = markup === '**' || markup === '_'
    const inserted = wraps ? markup + (selected || 'text') + markup : markup + selected
    input.setRangeText(inserted, start, end, 'end')
    setText(input.value)
    setDirty(true)
    input.focus()
  }

  const save = async () => {
    if (!title.trim()) {
      setTitleError(true)
      titleRef.current?.focus()

      return
    }
    setIsSaving(true)
    try {
      const file = new File([text], fileNameFor(title), { type: 'text/markdown' })
      const formData = new FormData()
      formData.append('file', file)
      const token = window.localStorage.getItem(localStorageConstants.accessTokenKey)
      await documentService.uploadDocument(organizationId, projectId, formData, token)
      setDirty(false)
      toast.success('Saved. It can be cited once it has been processed.')
      router.push(knowledgeHref)
    } catch (error) {
      toast.error(`Couldn’t save the document. ${getErrorMessage(error)}`)
    } finally {
      setIsSaving(false)
    }
  }

  const back = () => (dirty ? setConfirmLeave(true) : router.push(knowledgeHref))

  return (
    <main className='content' style={{ maxWidth: 1100 }}>
      <div className='row'>
        <button className='btn ghost s' onClick={back}>
          <ArrowLeft className='lucide' />
          Knowledge
        </button>
        <span className='sp' />
        <span className='faint sm'>{dirty ? 'Unsaved changes' : 'Not saved yet'}</span>
        <button aria-busy={isSaving} className='btn primary' onClick={save} disabled={isSaving}>
          <Check className='lucide' />
          {isSaving ? 'Saving…' : 'Save to knowledge'}
        </button>
      </div>

      <fieldset className='lock' disabled={isSaving}>
      <div>
        <input
          ref={titleRef}
          className='doc-title'
          placeholder='Untitled document'
          aria-label='Document title'
          value={title}
          onChange={e => {
            setTitle(e.target.value)
            setDirty(true)
            setTitleError(false)
          }}
        />
        <p className='faint sm' style={{ marginTop: 6 }}>
          Added to <b>{project?.name || 'the agent'}</b>’s knowledge. Use headings to split it into sections the agent
          can cite.
        </p>
        {titleError && (
          <p className='sm' style={{ color: 'var(--err)', marginTop: 6 }}>
            Give the document a title.
          </p>
        )}
      </div>

      <div className='card' style={{ overflow: 'hidden' }}>
        <div className='md-tb'>
          {TOOLS.map(([Icon, label, markup]) => (
            <button key={label} className='btn ghost s icon' title={label} onClick={() => insert(markup)}>
              <Icon className='lucide' />
            </button>
          ))}
          <span className='sp' />
          <span className='faint sm' style={{ alignSelf: 'center', paddingRight: 6 }}>
            Markdown
          </span>
        </div>
        <div className='md-editor'>
          <textarea
            ref={textRef}
            placeholder='Write here…'
            value={text}
            onChange={e => {
              setText(e.target.value)
              setDirty(true)
            }}
          />
          <div className='prev'>
            {text.trim() ? <Markdown text={text} className='prose' /> : <p className='faint'>Preview</p>}
          </div>
        </div>
      </div>
      </fieldset>

      <ConfirmDialog
        open={confirmLeave}
        onClose={() => setConfirmLeave(false)}
        title='Leave without saving?'
        text='Your document hasn’t been saved.'
        confirmLabel='Leave'
        onConfirm={() => router.push(knowledgeHref)}
      />
    </main>
  )
}

CreateDocumentPage.getLayout = page => (
  <AppLayout page='knowledge' title='New document' crumb='Knowledge'>
    {page}
  </AppLayout>
)

CreateDocumentPage.pageConfig = {
  applyEffectiveOrgAndProjectIds: true
}

export default CreateDocumentPage
