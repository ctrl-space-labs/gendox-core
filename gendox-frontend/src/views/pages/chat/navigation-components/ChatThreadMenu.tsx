import { useState } from "react"
import { useDispatch } from "react-redux"
import { useRouter } from "next/router"
import { toast } from "sonner"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import ChatThreadRenameDialog from "src/utils/dialogs/ChatThreadRenameDialog"
import DeleteConfirmDialog from "src/utils/dialogs/DeleteConfirmDialog"
import { fetchThreads } from "src/store/chat/gendoxChat"
import { getErrorMessage } from "src/utils/errorHandler"
import chatThreadService from "src/gendox-sdk/chatThreadService"
import { localStorageConstants } from "src/utils/generalConstants"

interface ChatThreadMenuProps {
  anchorEl: HTMLElement | null
  handleCloseMenu: () => void
  selectedThread: any
  setSelectedThreadForMenu: (thread: any) => void
}

const ChatThreadMenu = ({
  anchorEl,
  handleCloseMenu,
  selectedThread,
  setSelectedThreadForMenu,
}: ChatThreadMenuProps) => {
  const dispatch = useDispatch()
  const router = useRouter()

  const token = window.localStorage.getItem(
    localStorageConstants.accessTokenKey
  )
  const organizationId = router.query.organizationId as string
  const [renameDialogOpen, setRenameDialogOpen] = useState(false)
  const [newName, setNewName] = useState("")
  const [confirmDelete, setConfirmDelete] = useState(false)

  const openRenameDialog = () => {
    setNewName("")
    setRenameDialogOpen(true)
    handleCloseMenu()
  }

  const closeRenameDialog = () => {
    setRenameDialogOpen(false)
    setSelectedThreadForMenu(null)
  }

  const handleRename = async () => {
    if (!newName.trim()) {
      toast.error("Name cannot be empty")
      closeRenameDialog()
      return
    }

    const updatedChatThreadPayload = {
      name: newName,
    }

    try {
      await chatThreadService.updateChatThread(
        organizationId,
        selectedThread.id,
        updatedChatThreadPayload,
        token
      )
      ;(dispatch as any)(
        (fetchThreads as any)({ organizationId, token })
      )
      toast.success("Chat Thread renamed successfully")
      setSelectedThreadForMenu(null)
    } catch (error) {
      toast.error(
        `Failed to rename Chat Thread. Error: ${getErrorMessage(
          error
        )}`
      )
      console.error("Error renaming chat thread", error)
      setSelectedThreadForMenu(null)
    }

    closeRenameDialog()
  }

  const handleDeleteConfirmOpen = () => {
    handleCloseMenu()
    setConfirmDelete(true)
  }

  const handleDeleteConfirmClose = () => {
    setConfirmDelete(false)
  }

  const handleDelete = async () => {
    try {
      await chatThreadService.deleteChatThread(
        organizationId,
        selectedThread.id,
        token
      )
      ;(dispatch as any)(
        (fetchThreads as any)({ organizationId, token })
      )
      toast.success("Chat Thread deleted successfully")
      setSelectedThreadForMenu(null)
    } catch (error) {
      toast.error(
        `Failed to Delete Chat Thread. Error: ${getErrorMessage(
          error
        )}`
      )
      console.error("Error deleting chat thread", error)
      setSelectedThreadForMenu(null)
    }
    setConfirmDelete(false)
  }

  return (
    <>
      <DropdownMenu
        open={Boolean(anchorEl)}
        onOpenChange={(isOpen) => !isOpen && handleCloseMenu()}
      >
        <DropdownMenuTrigger asChild>
          <span />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={openRenameDialog}>
            Rename
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleDeleteConfirmOpen}>
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ChatThreadRenameDialog
        open={renameDialogOpen}
        onClose={closeRenameDialog}
        onRename={handleRename}
        newName={newName}
        setNewName={setNewName}
      />

      <DeleteConfirmDialog
        open={confirmDelete}
        onClose={handleDeleteConfirmClose}
        onConfirm={handleDelete}
        title="Confirm Deletion Chat"
        contentText="Are you sure you want to delete the chat thread? This action cannot be undone."
        confirmButtonText="Remove Chat"
        cancelButtonText="Cancel"
      />
    </>
  )
}

export default ChatThreadMenu
