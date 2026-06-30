import { useState } from 'react'
import Box from '@mui/material/Box'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import Link from '@mui/material/Link'
import InputAdornment from '@mui/material/InputAdornment'
import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'
import Icon from 'src/views/custom-components/mui/icon/icon'
import commonConfig from 'src/configs/common.config.js'
import { copyToClipboard } from 'src/utils/copyToClipboard'

const WIDGET_INSTALLATION_DOC_URL = `${commonConfig.gendoxDocsUrl}/website-widget/website-widget-installation`

const fieldSx = {
  '& .MuiInputBase-root': { bgcolor: 'action.hover', alignItems: 'flex-start', pt: 1.5, pr: 5 },
  '& .MuiInputBase-input': { fontFamily: 'Source Code Pro, monospace', whiteSpace: 'pre', fontSize: 13, color: 'text.primary' },
  '& .MuiOutlinedInput-notchedOutline': { borderColor: 'divider' }
}

const buildEmbedSnippet = (gendoxSrc, organizationId, projectId) => `<script
    id="gendox-chat-script"
    src="${gendoxSrc}/gendox-sdk/gendox-widget-plugin.js"
    data-gendox-src="${gendoxSrc}"
    data-organization-id="${organizationId}"
    data-project-id="${projectId}"
    data-gendox-chat-initial-state="closed"
    data-gendox-local-context-selected-text-enabled="true"
    data-gendox-open-web-page-tool-enabled="true"
    data-gendox-local-context-max-responses="1"
    data-gendox-local-context-max-wait-ms="500">
</script>`

const AgentEmbedSnippet = ({ organizationId, projectId }) => {
  const gendoxSrc = (commonConfig.gendoxUrl || 'https://app.gendox.dev').replace(/\/gendox\/api\/v1\/?$/, '')
  const embedSnippet = buildEmbedSnippet(gendoxSrc, organizationId, projectId)
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    copyToClipboard(embedSnippet)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Box sx={{ mt: 2 }}>
      <Typography variant='body2' sx={{ fontWeight: 600, mb: 1 }}>
        Import the chat in another website.{' '}
        <Link href={WIDGET_INSTALLATION_DOC_URL} target='_blank' rel='noopener noreferrer'>
          See how
        </Link>
        .
      </Typography>

      <TextField
        fullWidth
        multiline
        minRows={10}
        value={embedSnippet}
        inputProps={{ readOnly: true }}
        InputProps={{
          endAdornment: (
            <InputAdornment
              position='end'
              sx={{ position: 'absolute', top: 8, right: 4, height: 'auto', maxHeight: 'unset', alignSelf: 'flex-start', pointerEvents: 'auto', zIndex: 1 }}
            >
              <Tooltip title={copied ? 'Copied' : 'Copy snippet'}>
                <IconButton type='button' size='small' onClick={handleCopy} sx={{ color: copied ? 'success.main' : 'text.secondary' }}>
                  <Icon icon='mdi:content-copy' fontSize='small' />
                </IconButton>
              </Tooltip>
            </InputAdornment>
          )
        }}
        sx={fieldSx}
      />
    </Box>
  )
}

export default AgentEmbedSnippet
