import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/router'
import { useSelector, useDispatch } from 'react-redux'
import { useTheme } from '@mui/material/styles'
import { localStorageConstants } from 'src/utils/generalConstants'
import Grid from '@mui/material/Grid'
import TextField from '@mui/material/TextField'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Icon from 'src/views/custom-components/mui/icon/icon'
import Typography from '@mui/material/Typography'
import Tooltip from '@mui/material/Tooltip'
import IconButton from '@mui/material/IconButton'
import toast from 'react-hot-toast'
import aiModelService from 'src/gendox-sdk/aiModelService'
import KeyChangeDialog from 'src/views/pages/organization-settings/advanced-components/ai-model-provider-key/KeyChangeDialog'
import DeleteConfirmDialog from 'src/utils/dialogs/DeleteConfirmDialog'
import { fetchOrganizationAiModelKeys } from 'src/store/activeOrganization/activeOrganization'
import { getErrorMessage } from 'src/utils/errorHandler'

const AiModelProviderKey = () => {
  const theme = useTheme()
  const router = useRouter()
  const dispatch = useDispatch()
  const token = window.localStorage.getItem(localStorageConstants.accessTokenKey)

  const organizationId = router.query.organizationId
  const { aiModelProviders, aiModelKeys: initialAiModelKeys } = useSelector(state => state.activeOrganization)

  const [selectedKeyId, setSelectedKeyId] = useState(null)
  const [openKeyChangeDialog, setOpenKeyChangeDialog] = useState(false)
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false)
  const [selectedProviderDescription, setSelectedProviderDescription] = useState('')
  const [selectedProviderId, setSelectedProviderId] = useState(null)
  const [aiModelKeys, setAiModelKeys] = useState([])

  useEffect(() => {
    if (initialAiModelKeys) {
      setAiModelKeys(initialAiModelKeys)
    }
  }, [initialAiModelKeys])

  // Function to open the KeyChangeDialog and set the selected provider ID
  const handleEditToggle = (description, providerId) => {
    setSelectedProviderDescription(description)
    setSelectedProviderId(providerId)
    setOpenKeyChangeDialog(true)
  }

  // Function to handle saving the new key
  const handleSaveNewKey = async newKey => {
    // // create new ai model provider keys
    try {
      const provider = aiModelProviders.find(p => p.id === selectedProviderId)

      if (!provider) {
        console.error('Provider not found')
        return
      }

      const existingKey = aiModelKeys.find(key => key.aiModelProvider.id === provider.id)

      const payload = {
        organizationId,
        aiModelProvider: provider,
        key: newKey
      }

      if (!existingKey) {
        await aiModelService.createAiModelKey(organizationId, token, payload)
        toast.success('AI Model Key Created Successfully')
      } else {
        // Update the existing key
        await aiModelService.updateAiModelKey(organizationId, existingKey.id, token, payload)
        toast.success('AI Model Key Updated Successfully')
      }

      // Fetch the updated keys
      dispatch(
        fetchOrganizationAiModelKeys({
          organizationId,
          token
        })
      )
      setOpenKeyChangeDialog(false)
    } catch (error) {
      console.error('Failed to create AI Model Keys', error)
      toast.error(`Failed to create AI Model Keys. Error: ${getErrorMessage(error)}`)
      setOpenKeyChangeDialog(false)
    }
  }

  const handleDeleteProviderKey = async () => {
    try {
      await aiModelService.deleteAiModelKey(organizationId, selectedKeyId, token)
      dispatch(
        fetchOrganizationAiModelKeys({
          organizationId,
          token
        })
      )
      handleDeleteClose()
      toast.success('AI Model Key Deleted Successfully')
    } catch (error) {
      console.error('Failed to delete AI Model Key', error)
      toast.error(`Failed to delete AI Model Key. Error: ${getErrorMessage(error)}`)
      handleDeleteClose()
    }
  }

  const handleDeleteClickOpen = (description, keyId) => {
    setSelectedProviderDescription(description)
    setSelectedKeyId(keyId)
    setOpenDeleteDialog(true)
  }

  const handleDeleteClose = () => setOpenDeleteDialog(false)

  return (
    <>
      <CardHeader
        title={
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <span>AI Model Provider Key</span>
            <Tooltip title='Add or update API keys for AI services like OpenAI. Only the first and the last few characters of each key are shown for security.'>
              <IconButton color='primary' sx={{ ml: 1 }}>
                <Icon icon='mdi:information-outline' />
              </IconButton>
            </Tooltip>
          </Box>
        }
      />

      <CardContent>
        {aiModelProviders.map(item => (
          <Grid item xs={12} sm={12} md={6} sx={{ mt: 3, mb: 4 }} key={item.id}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <TextField
                fullWidth
                label={item.description}
                value={aiModelKeys.find(key => key.aiModelProvider.id === item.id)?.key || ''}
                disabled
              />
              <Box sx={{ display: 'flex', ml: 1 }}>
                <Tooltip title='Add New Key'>
                  <IconButton onClick={() => handleEditToggle(item.description, item.id)} color='primary'>
                    <Icon icon='mdi:pencil-outline' />
                  </IconButton>
                </Tooltip>
                <Tooltip title='Delete Key'>
                  <IconButton
                    onClick={() => {
                      const matchingKey = aiModelKeys.find(key => key.aiModelProvider.id === item.id)
                      handleDeleteClickOpen(item.description, matchingKey?.id)
                    }}
                    color='error'
                  >
                    <Icon icon='mdi:delete' />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>
          </Grid>
        ))}
      </CardContent>

      {/* Render the KeyChangeDialog */}
      <KeyChangeDialog
        open={openKeyChangeDialog}
        onClose={() => setOpenKeyChangeDialog(false)}
        onSave={handleSaveNewKey}
        description={selectedProviderDescription}
      />

      <DeleteConfirmDialog
        open={openDeleteDialog}
        onClose={handleDeleteClose}
        onConfirm={handleDeleteProviderKey}
        title='Delete AI Model Key'
        contentText={`Are you sure you want to delete the AI Model Key for ${selectedProviderDescription}?`}
        confirmButtonText='Delete'
        cancelButtonText='Cancel'
      />
    </>
  )
}

export default AiModelProviderKey
