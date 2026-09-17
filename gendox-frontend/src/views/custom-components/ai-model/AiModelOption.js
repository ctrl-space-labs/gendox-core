import React from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Tooltip from '@mui/material/Tooltip'
import CustomChip from 'src/views/custom-components/mui/chip'

/**
 * One row in an AI model picker; extracted from six duplicated copies.
 *
 * Origin (where it was trained) and hosting (where inference runs) are shown separately:
 * a Qwen model served from Finland is "trained CN, hosted EU". GLOBAL is a warning
 * because it means the provider gives no residency commitment at all.
 */

const ORIGIN_LABELS = {
  US: 'Trained: US',
  EU: 'Trained: EU',
  CN: 'Trained: CN'
}

const HOSTING = {
  EU: { label: 'Hosted: EU', color: 'success', tooltip: 'Inference runs in the EU' },
  US: { label: 'Hosted: US', color: 'info', tooltip: 'Inference runs in the US' },
  GLOBAL: {
    label: 'Hosted: Global',
    color: 'warning',
    tooltip: 'No region guarantee — the provider may process requests in any region, and may change it without notice'
  }
}

const AiModelOption = ({ props, option }) => {
  const origin = ORIGIN_LABELS[option.modelOrigin]
  const hosting = HOSTING[option.aiModelProvider?.hostingRegion]
  const isFree = option.modelTierType?.name === 'FREE_MODEL'

  return (
    <Box {...props} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start !important' }}>
      <Typography variant='body1'>{option.name}</Typography>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexWrap: 'wrap', mt: 0.25 }}>
        <Typography variant='body2' sx={{ fontStyle: 'italic', color: 'text.secondary' }}>
          {option.aiModelProvider?.name}
        </Typography>

        {isFree && <CustomChip rounded size='small' skin='light' color='success' label='Free' />}

        {origin && <CustomChip rounded size='small' skin='light' color='secondary' label={origin} />}

        {hosting && (
          <Tooltip title={hosting.tooltip}>
            <span>
              <CustomChip rounded size='small' skin='light' color={hosting.color} label={hosting.label} />
            </span>
          </Tooltip>
        )}
      </Box>
    </Box>
  )
}

export default AiModelOption
