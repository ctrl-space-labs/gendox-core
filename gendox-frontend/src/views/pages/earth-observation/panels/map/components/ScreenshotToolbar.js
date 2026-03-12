import { useDispatch } from 'react-redux'
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
import Divider from '@mui/material/Divider'
import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'
import CameraAltIcon from '@mui/icons-material/CameraAlt'
import CloseIcon from '@mui/icons-material/Close'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import FileDownloadIcon from '@mui/icons-material/FileDownload'

import { setMapThumbnail } from 'src/store/earthObservation'
import { downloadFile, copyImageToClipboard } from '../utils/mapPanelHelpers'

export default function ScreenshotToolbar({ mapThumbnailUrl, mapLayersCount, isCapturing, onScreenshot }) {
  const dispatch = useDispatch()

  return (
    <>
      {mapThumbnailUrl && (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 0.5,
            bgcolor: 'background.paper',
            border: 1,
            borderColor: 'divider',
            borderRadius: 1,
            px: 1,
            py: 0.5,
            boxShadow: 2
          }}
        >
          <img
            src={mapThumbnailUrl}
            alt='GEE snapshot'
            style={{ width: 44, height: 30, objectFit: 'cover', borderRadius: 2, display: 'block' }}
          />
          <Divider orientation='vertical' flexItem sx={{ mx: 0.25 }} />
          <Tooltip title='Download'>
            <IconButton
              size='small'
              onClick={() => downloadFile(mapThumbnailUrl, 'gee-thumbnail.png')}
              sx={{ width: 30, height: 30, p: 0 }}
            >
              <FileDownloadIcon sx={{ fontSize: 15 }} />
            </IconButton>
          </Tooltip>
          <Tooltip title='Copy image'>
            <IconButton
              size='small'
              onClick={() => copyImageToClipboard(mapThumbnailUrl)}
              sx={{ width: 30, height: 30, p: 0 }}
            >
              <ContentCopyIcon sx={{ fontSize: 15 }} />
            </IconButton>
          </Tooltip>
          <Tooltip title='Dismiss'>
            <IconButton
              size='small'
              onClick={() => dispatch(setMapThumbnail(null))}
              sx={{ width: 30, height: 30, p: 0 }}
            >
              <CloseIcon sx={{ fontSize: 15 }} />
            </IconButton>
          </Tooltip>
        </Box>
      )}

      {mapLayersCount > 0 && (
        <Tooltip title={isCapturing ? 'Capturing…' : 'Screenshot current view'}>
          <span>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                bgcolor: 'background.paper',
                border: 1,
                borderColor: 'divider',
                borderRadius: 1,
                px: 0.75,
                py: 0.5,
                boxShadow: 2
              }}
            >
              <IconButton
                size='small'
                onClick={onScreenshot}
                disabled={isCapturing}
                sx={{ width: 30, height: 30, p: 0 }}
              >
                {isCapturing ? <CircularProgress size={14} /> : <CameraAltIcon sx={{ fontSize: 15 }} />}
              </IconButton>
            </Box>
          </span>
        </Tooltip>
      )}
    </>
  )
}
