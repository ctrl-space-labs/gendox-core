import React from 'react'
import { Box, Button, Chip, IconButton, TextField, Tooltip, Typography } from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import CleanCollapse from 'src/views/custom-components/mui/collapse'

const MAX_CHOICE_OPTIONS = 255
const MAX_RATING_LEVELS = 10

const nextOptionKey = options => {
  let index = options.length + 1
  while (options.some(option => option.key === `option_${index}`)) index += 1

  return `option_${index}`
}

const DecisionQuestionConfigFields = ({ kind, value, onChange, readOnly = false }) => {
  const options = value.options || []

  const updateOption = (index, field, fieldValue) => {
    onChange({
      ...value,
      options: options.map((option, optionIndex) =>
        optionIndex === index ? { ...option, [field]: fieldValue } : option
      )
    })
  }

  const removeOption = index => {
    onChange({ ...value, options: options.filter((_, optionIndex) => optionIndex !== index) })
  }

  const addOption = () => {
    const optionNumber = options.length + 1
    onChange({
      ...value,
      options: [
        ...options,
        {
          key: nextOptionKey(options),
          label: kind === 'SCORE' ? `Level ${optionNumber}` : `Option ${optionNumber}`
        }
      ]
    })
  }

  const optionLimit = kind === 'SCORE' ? MAX_RATING_LEVELS : MAX_CHOICE_OPTIONS

  return (
    <Box sx={{ mt: 2 }}>
      {kind === 'BOOLEAN' ? (
        <Box>
          <Typography variant='subtitle2' sx={{ mb: 1 }}>
            Answers
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Chip label='Yes' variant='outlined' />
            <Chip label='No' variant='outlined' />
          </Box>
        </Box>
      ) : (
        <Box>
          <Typography variant='subtitle2'>{kind === 'CHOICE' ? 'Answer choices' : 'Rating scale'}</Typography>
          <Typography variant='caption' color='text.secondary'>
            {kind === 'CHOICE'
              ? 'Add the answers shown in the insights board.'
              : 'Add two to ten levels, ordered from lowest to highest.'}
          </Typography>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, mt: 2 }}>
            {options.map((option, index) => (
              <Box key={`option-${index}`} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {kind === 'SCORE' && (
                  <Typography
                    variant='body2'
                    color='text.secondary'
                    sx={{ width: 24, textAlign: 'center', flexShrink: 0 }}
                  >
                    {index + 1}
                  </Typography>
                )}
                <TextField
                  fullWidth
                  size='small'
                  label={kind === 'CHOICE' ? `Choice ${index + 1}` : `Level ${index + 1}`}
                  value={option.label}
                  onChange={event => updateOption(index, 'label', event.target.value)}
                  InputProps={{ readOnly }}
                />
                {!readOnly && (
                  <Tooltip title={options.length <= 2 ? 'At least two options are required' : 'Remove'}>
                    <span>
                      <IconButton
                        size='small'
                        aria-label={`Remove ${kind === 'CHOICE' ? 'choice' : 'level'} ${index + 1}`}
                        onClick={() => removeOption(index)}
                        disabled={options.length <= 2}
                      >
                        <DeleteOutlineIcon fontSize='small' />
                      </IconButton>
                    </span>
                  </Tooltip>
                )}
              </Box>
            ))}
          </Box>

          {!readOnly && (
            <Button
              size='small'
              variant='outlined'
              startIcon={<AddIcon />}
              onClick={addOption}
              disabled={options.length >= optionLimit}
              sx={{ mt: 1.5, textTransform: 'none' }}
            >
              {kind === 'CHOICE' ? 'Add choice' : 'Add level'}
            </Button>
          )}
        </Box>
      )}

      <Box sx={{ mt: 2 }}>
        <CleanCollapse
          title='Advanced decision criteria'
          open={value.advancedOpen}
          onToggle={() => onChange({ ...value, advancedOpen: !value.advancedOpen })}
        >
          <TextField
            fullWidth
            multiline
            minRows={3}
            label='Evaluation instructions'
            value={value.instructions}
            onChange={event => onChange({ ...value, instructions: event.target.value })}
            InputProps={{ readOnly }}
            helperText={
              readOnly
                ? 'Instructions sent to Jev for this question.'
                : 'Define the evidence, inclusions and exclusions Jev should use. If empty, the question is used.'
            }
          />

          {kind === 'BOOLEAN' && (
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
                columnGap: 2,
                rowGap: 4,
                mt: 3
              }}
            >
              <TextField
                fullWidth
                label='Yes means'
                value={value.booleanCriteria.true}
                onChange={event =>
                  onChange({
                    ...value,
                    booleanCriteria: { ...value.booleanCriteria, true: event.target.value }
                  })
                }
                InputProps={{ readOnly }}
              />
              <TextField
                fullWidth
                label='No means'
                value={value.booleanCriteria.false}
                onChange={event =>
                  onChange({
                    ...value,
                    booleanCriteria: { ...value.booleanCriteria, false: event.target.value }
                  })
                }
                InputProps={{ readOnly }}
              />
              <Typography variant='caption' color='text.secondary' sx={{ gridColumn: { md: '1 / -1' } }}>
                If “Not enough information” must be different from No, use “Choose one” and add it as a separate choice.
              </Typography>
            </Box>
          )}

          {kind === 'CHOICE' && (
            <Box sx={{ mt: 3 }}>
              <Typography variant='subtitle2'>Stable option keys</Typography>
              <Typography variant='caption' color='text.secondary'>
                Keys are stored in the decision result. Change them only when integrating with another system.
              </Typography>
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
                  columnGap: 1.5,
                  rowGap: 4,
                  mt: 3
                }}
              >
                {options.map((option, index) => (
                  <TextField
                    key={`option-key-${index}`}
                    size='small'
                    label={`Key for “${option.label || `Choice ${index + 1}`}”`}
                    value={option.key}
                    onChange={event => updateOption(index, 'key', event.target.value)}
                    InputProps={{ readOnly }}
                  />
                ))}
              </Box>
            </Box>
          )}

          {kind === 'SCORE' && (
            <Typography component='p' variant='caption' color='text.secondary' sx={{ mt: 2 }}>
              Rating levels map to 1–{options.length}. Their order is significant. Use the evaluation instructions to
              explain how evidence maps to each level.
            </Typography>
          )}

          <Typography component='p' variant='caption' color='text.secondary' sx={{ mt: 2 }}>
            Task instructions and instructions attached to individual documents are applied separately.
          </Typography>
        </CleanCollapse>
      </Box>
    </Box>
  )
}

export default DecisionQuestionConfigFields
