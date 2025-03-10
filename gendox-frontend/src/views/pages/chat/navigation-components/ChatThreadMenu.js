import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Menu, MenuItem } from '@mui/material'
import ChatThreadRenameDialog from 'src/utils/dialogs/ChatThreadRenameDialog'
import DeleteConfirmDialog from 'src/utils/dialogs/DeleteConfirmDialog'
import { fetchThreads } from 'src/store/chat/gendoxChat'
import { getErrorMessage } from 'src/utils/errorHandler'
import chatThreadService from 'src/gendox-sdk/chatThreadService'
import { localStorageConstants } from 'src/utils/generalConstants'
import toast from 'react-hot-toast'
import { useRouter } from 'next/router'

const ChatThreadMenu = ({ anchorEl, handleCloseMenu, selectedThread, setSelectedThreadForMenu }) => {
  const dispatch = useDispatch()
  const router = useRouter()

  const token = window.localStorage.getItem(localStorageConstants.accessTokenKey)
  const organizationId = router.query.organizationId
  const [renameDialogOpen, setRenameDialogOpen] = useState(false)
  const [newName, setNewName] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)

  const openRenameDialog = () => {
    setNewName('') // Reset input field
    setRenameDialogOpen(true)
    handleCloseMenu()
  }

  const closeRenameDialog = () => {
    setRenameDialogOpen(false)
    setSelectedThreadForMenu(null)
  }

  const handleRename = async () => {
    if (!newName.trim()) {
      toast.error('Name cannot be empty')
      closeRenameDialog()
      return
    }

    const updatedChatThreadPayload = {
      name: newName
    }  
   

    try {
      await chatThreadService.updateChatThread(organizationId, selectedThread.id, updatedChatThreadPayload, token)
      dispatch(fetchThreads({ organizationId, token }))
      toast.success('Chat Thread renamed successfully')
      setSelectedThreadForMenu(null)
    } catch (error) {
      toast.error(`Failed to rename Chat Thread. Error: ${getErrorMessage(error)}`)
      console.error('Error renaming chat thread', error)
      setSelectedThreadForMenu(null)
    }

    closeRenameDialog()
  }

  const handleDeleteConfirmOpen = () => {
    handleCloseMenu();
    setConfirmDelete(true);
  };

  const handleDeleteConfirmClose = () => {
    setConfirmDelete(false);
  };

  const handleDelete = async () => {
    try {
      await chatThreadService.deleteChatThread(
        organizationId,
        selectedThread.id,
        token
      );
      dispatch(fetchThreads({ organizationId, token }));
      toast.success("Chat Thread deleted successfully");
      setSelectedThreadForMenu(null)
    } catch (error) {
      toast.error(
        `Failed to Delete Chat Thread. Error: ${getErrorMessage(error)}`
      );
      console.error("Error deleting chat thread", error);
      setSelectedThreadForMenu(null)
    }
    setConfirmDelete(false);
  };

  return (
    <>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleCloseMenu}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'right'
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right'
        }}
      >
        <MenuItem onClick={openRenameDialog} >
          Rename
        </MenuItem>
        <MenuItem onClick={handleDeleteConfirmOpen} >
          Delete
        </MenuItem>
      </Menu>

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
        title='Confirm Deletion Chat'
        contentText={`Are you sure you want to delete the chat thread? This action cannot be undone.`}
        confirmButtonText='Remove Chat'
        cancelButtonText='Cancel'
      />
    </>
  )
}

export default ChatThreadMenu
