import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useDispatch } from 'react-redux'
import toast from 'react-hot-toast'
import { Ellipsis, MessageSquareText, Pencil, Trash2 } from 'lucide-react'
import chatThreadService from 'src/gendox-sdk/chatThreadService'
import { fetchThreads } from 'src/store/chat/gendoxChat'
import { getErrorMessage } from 'src/utils/errorHandler'
import { localStorageConstants } from 'src/utils/generalConstants'
import Menu from 'src/components/ui/Menu'
import Dialog from 'src/components/ui/Dialog'
import ConfirmDialog from 'src/components/ui/ConfirmDialog'

/**
 * The ⋯ menu of one conversation: rename and delete.
 * @param openHref - when given, the menu starts with "Open"
 * @param onDeleted - called after the conversation is deleted
 */
const ThreadMenu = ({ thread, openHref, onDeleted, className = 'menu-x' }) => {
  const dispatch = useDispatch()
  const router = useRouter()
  const { organizationId } = router.query

  const [renameOpen, setRenameOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [name, setName] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  const getToken = () => window.localStorage.getItem(localStorageConstants.accessTokenKey)

  const handleRename = async e => {
    e?.preventDefault()
    if (!name.trim()) {
      toast.error('Name cannot be empty')

      return
    }
    setIsSaving(true)
    try {
      const token = getToken()
      await chatThreadService.updateChatThread(organizationId, thread.id, { name }, token)
      dispatch(fetchThreads({ organizationId, token }))
      toast.success('Conversation renamed')
      setRenameOpen(false)
    } catch (error) {
      toast.error(`Failed to rename the conversation. Error: ${getErrorMessage(error)}`)
      console.error('Error renaming chat thread', error)
    }
    setIsSaving(false)
  }

  const handleDelete = async () => {
    try {
      const token = getToken()
      await chatThreadService.deleteChatThread(organizationId, thread.id, token)
      dispatch(fetchThreads({ organizationId, token }))
      toast.success('Conversation deleted')
      onDeleted?.(thread)
    } catch (error) {
      toast.error(`Failed to delete the conversation. Error: ${getErrorMessage(error)}`)
      console.error('Error deleting chat thread', error)
    }
  }

  return (
    <>
      <Menu
        align='right'
        width={180}
        trigger={({ onClick }) => (
          <button
            className={`btn ghost s icon ${className}`}
            title='Rename or delete'
            onClick={e => {
              e.preventDefault()
              e.stopPropagation()
              onClick()
            }}
          >
            <Ellipsis className='lucide' />
          </button>
        )}
      >
        {openHref && (
          <Link className='mi' href={openHref}>
            <MessageSquareText className='lucide' />
            Open
          </Link>
        )}
        <button
          className='mi'
          data-close-menu
          onClick={() => {
            setName(thread.threadName || '')
            setRenameOpen(true)
          }}
        >
          <Pencil className='lucide' />
          Rename
        </button>
        <button className='mi' data-close-menu style={{ color: 'var(--err)' }} onClick={() => setDeleteOpen(true)}>
          <Trash2 className='lucide' style={{ color: 'inherit' }} />
          Delete
        </button>
      </Menu>

      <Dialog
        open={renameOpen}
        onClose={() => setRenameOpen(false)}
        title='Rename conversation'
        size='s'
        footer={
          <>
            <button className='btn' onClick={() => setRenameOpen(false)}>
              Cancel
            </button>
            <button className='btn primary' onClick={handleRename} disabled={isSaving}>
              Save
            </button>
          </>
        }
      >
        <form className='field' onSubmit={handleRename}>
          <label htmlFor='thread-name'>Name</label>
          <input id='thread-name' className='input' value={name} onChange={e => setName(e.target.value)} />
        </form>
      </Dialog>

      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        title='Delete this conversation?'
        text={`“${thread.threadName || 'This conversation'}” and its messages will be deleted for you. This can’t be undone.`}
      />
    </>
  )
}

export default ThreadMenu
