import React, { useEffect, useState } from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import Link from '@mui/material/Link'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import Icon from 'src/views/custom-components/mui/icon/icon'

const ConnectorEditDialog = ({ open, onClose, onSave, definition, currentConfig }) => {
  const [values, setValues] = useState({})
  const [saving, setSaving] = useState(false)

  // Reset form whenever the dialog reopens with a different connector.
  useEffect(() => {
    if (!open || !definition) return
    const initial = {}
    definition.fields.forEach(field => {
      initial[field.key] = currentConfig?.[field.key] || ''
    })
    setValues(initial)
    setSaving(false)
  }, [open, definition, currentConfig])

  if (!definition) return null

  const handleChange = key => event => {
    setValues(prev => ({ ...prev, [key]: event.target.value }))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await onSave(values)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog fullWidth maxWidth='sm' open={open} onClose={onClose}>
      <DialogTitle>{`Configure ${definition.label}`}</DialogTitle>
      <DialogContent>
        <Typography variant='body2' color='text.secondary' sx={{ mb: definition.docHref ? 1 : 3 }}>
          {definition.description}
        </Typography>

        {definition.docHref && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 3 }}>
            <Icon icon='mdi:book-open-variant' fontSize={16} />
            <Link
              href={definition.docHref}
              target='_blank'
              rel='noopener noreferrer'
              underline='hover'
              variant='body2'
              sx={{ fontWeight: 500 }}
            >
              {definition.docLabel || 'Read the setup guide'}
            </Link>
          </Box>
        )}

        {definition.fields.map((field, idx) => (
          <TextField
            key={field.key}
            autoFocus={idx === 0}
            margin='dense'
            fullWidth
            label={field.label}
            placeholder={field.placeholder}
            value={values[field.key] || ''}
            onChange={handleChange(field.key)}
            helperText={field.helperText || definition.helpText}
            sx={{ mb: 2 }}
            InputLabelProps={{ shrink: true }}
          />
        ))}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color='primary' disabled={saving}>
          Cancel
        </Button>
        <Button onClick={handleSave} color='primary' variant='contained' disabled={saving}>
          {saving ? 'Saving…' : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default ConnectorEditDialog
