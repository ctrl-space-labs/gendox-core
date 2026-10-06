import { useEffect, useMemo, useState } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Button,
  Stack,
  Alert,
  Typography,
  Box,
  Collapse,
  IconButton,
  Tooltip,
  InputAdornment,
  Divider,
  RadioGroup,
  Radio,
  FormControlLabel,
  Switch
} from '@mui/material'
import Icon from 'src/views/custom-components/mui/icon/icon'
import useCopy from './useCopy'

/**
 * One dialog behind every plus, every pencil and every delete on the page.
 * `fields` describes what to ask, `onSave` returns a promise; the dialog stays
 * open and shows the error when it rejects, so a failed save never looks like a
 * successful one.
 *
 * Field kinds:
 *  - anything with a `type` TextField understands, plus `select` with `options`
 *  - `section`  a collapsed heading with an info tooltip, the same shape as the
 *               product's Advanced Settings. Every field after it lives inside
 *               it until the next section.
 *  - `readonly` a bordered box stating something the reader cannot change, the
 *               same shape the product uses for a task's type. With `secret` it
 *               shows `value` masked and keeps the real string behind a reveal
 *               and a copy button.
 *  - `toggle`   a switch, for a setting that is on or off rather than filled in.
 *               Its `description` may be a function of the values, so it can say
 *               what is true now rather than what would be true the other way.
 *  - `choice`   the cards the product offers when a task's type is being picked,
 *               each with a label and a line saying what it means.
 *
 * `hidden(values)` lets one dialog ask a question and then only the follow-ups
 * that answer implies. With no fields at all it is a confirmation, and
 * `destructive` turns the button red — deleting is the one action here nobody
 * can undo, so it is never a bare icon click.
 *
 * Explanations go in tooltips, not under the fields: a dialog that explains
 * every box in small print is longer than the thing it is asking for.
 */
const ActionDialog = ({
  open,
  title,
  titleTooltip,
  description,
  fields = [],
  saveLabel = 'Save',
  destructive = false,
  onClose,
  onSave
}) => {
  const [values, setValues] = useState({})
  const [openSections, setOpenSections] = useState({})
  const [revealed, setRevealed] = useState({})
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const { copied, copy } = useCopy()

  useEffect(() => {
    if (!open) return
    setError(null)
    setValues(Object.fromEntries(fields.map(f => [f.name, f.value ?? ''])))
    setOpenSections(Object.fromEntries(fields.filter(f => f.type === 'section').map(f => [f.name, !!f.defaultOpen])))
    setRevealed({})

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  // a hidden field is neither shown nor required; its value is simply not asked for
  const visible = useMemo(() => fields.filter(f => !f.hidden?.(values)), [fields, values])

  // everything after a section belongs to it, until the next one
  const blocks = useMemo(() => {
    const out = [{ section: null, fields: [] }]
    for (const f of visible) {
      if (f.type === 'section') out.push({ section: f, fields: [] })
      else out[out.length - 1].fields.push(f)
    }

    return out.filter(b => b.section || b.fields.length)
  }, [visible])

  // `inputs` is only about where the caret lands; a choice carries a value too
  const inputs = visible.filter(f => !['section', 'readonly', 'choice', 'toggle'].includes(f.type))

  const missing = visible
    .filter(f => !['section', 'readonly', 'toggle'].includes(f.type))
    .some(f => f.required && !String(values[f.name] ?? '').trim())

  // a field can also refuse what was typed in it. The message appears under the field and
  // the save stays shut until it clears — an empty field is `missing`, not wrong
  const errors = useMemo(
    () =>
      Object.fromEntries(
        visible
          .filter(f => f.validate && String(values[f.name] ?? '').trim())
          .map(f => [f.name, f.validate(String(values[f.name]).trim())])
          .filter(([, message]) => message)
      ),
    [visible, values]
  )

  const save = async () => {
    setSaving(true)
    setError(null)
    try {
      await onSave(values)
      onClose()
    } catch (e) {
      setError(e.response?.data?.errorMessage || e.message || 'Something went wrong')
    } finally {
      setSaving(false)
    }
  }

  const field = f => {
    if (f.type === 'choice') {
      const pick = value => setValues(v => ({ ...v, [f.name]: value }))

      return (
        <RadioGroup key={f.name} value={values[f.name] ?? ''} onChange={e => pick(e.target.value)}>
          {(f.options ?? []).map(o => {
            const selected = values[f.name] === o.value

            return (
              <Box
                key={o.value}
                onClick={() => pick(o.value)}
                sx={{
                  border: theme =>
                    selected ? `2px solid ${theme.palette.primary.main}` : `1px solid ${theme.palette.divider}`,
                  bgcolor: theme => (selected ? `${theme.palette.primary.main}10` : theme.palette.background.paper),
                  borderRadius: 2,
                  p: 2,
                  mb: 1,
                  cursor: 'pointer',
                  transition: 'border-color 0.3s ease',
                  '&:hover': { borderColor: 'primary.main' }
                }}
              >
                <FormControlLabel
                  value={o.value}
                  control={<Radio />}
                  sx={{ m: 0 }}
                  label={
                    <Box>
                      <Typography variant='subtitle1'>{o.label}</Typography>
                      <Typography variant='body2' color='text.secondary'>
                        {o.description}
                      </Typography>
                    </Box>
                  }
                />
              </Box>
            )
          })}
        </RadioGroup>
      )
    }

    if (f.type === 'toggle') {
      return (
        <FormControlLabel
          key={f.name}
          sx={{ m: 0, alignItems: 'flex-start' }}
          control={
            <Switch checked={!!values[f.name]} onChange={e => setValues(v => ({ ...v, [f.name]: e.target.checked }))} />
          }
          label={
            <Box sx={{ pt: 0.75 }}>
              <Typography variant='subtitle2'>{f.label}</Typography>
              {f.description && (
                <Typography variant='body2' color='text.secondary'>
                  {/* a switch describes the state it is in, not the one it is not */}
                  {typeof f.description === 'function' ? f.description(values) : f.description}
                </Typography>
              )}
            </Box>
          }
        />
      )
    }

    if (f.type === 'readonly') {
      const shown = f.secret && revealed[f.name] ? f.secret : f.value

      return (
        <Box
          key={f.name}
          sx={{
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 2,
            p: 2,
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            userSelect: f.secret ? 'text' : 'none'
          }}
        >
          <Box sx={{ minWidth: 0, flex: 1, cursor: f.secret ? 'text' : 'not-allowed' }}>
            {f.label && (
              <Typography variant='caption' color='text.disabled' sx={{ display: 'block' }}>
                {f.label}
              </Typography>
            )}
            <Typography
              variant='subtitle1'
              color='text.disabled'
              sx={{
                fontWeight: 'bold',
                ...(f.secret && { fontFamily: 'monospace', wordBreak: 'break-all' })
              }}
            >
              {shown}
            </Typography>
          </Box>

          {f.secret && (
            <>
              <Tooltip title={revealed[f.name] ? 'Hide' : 'Reveal'}>
                <IconButton
                  size='small'
                  onClick={() => setRevealed(r => ({ ...r, [f.name]: !r[f.name] }))}
                  sx={{ color: 'text.secondary', '&:hover': { color: 'primary.main' } }}
                >
                  <Icon icon={revealed[f.name] ? 'mdi:eye-off-outline' : 'mdi:eye-outline'} />
                </IconButton>
              </Tooltip>
              <Tooltip title={copied === f.name ? 'Copied' : 'Copy'}>
                <IconButton
                  size='small'
                  onClick={async () => {
                    // a refusal reveals it instead, so there is always a way to get it
                    if (!(await copy(f.name, f.secret))) {
                      setRevealed(r => ({ ...r, [f.name]: true }))
                    }
                  }}
                  sx={{
                    color: copied === f.name ? 'primary.main' : 'text.secondary',
                    '&:hover': { color: 'primary.main' }
                  }}
                >
                  <Icon icon={copied === f.name ? 'mdi:check' : 'mdi:content-copy'} />
                </IconButton>
              </Tooltip>
            </>
          )}
        </Box>
      )
    }

    const selectArrowSx =
      f.type === 'select' && f.tooltip ? { '& .MuiSelect-icon': { right: theme => theme.spacing(8) } } : undefined

    return (
      <TextField
        key={f.name}
        select={f.type === 'select'}
        label={f.label}
        type={f.type === 'select' ? undefined : f.type ?? 'text'}
        value={values[f.name] ?? ''}
        required={f.required}
        fullWidth
        autoFocus={f === inputs[0]}
        onChange={e => setValues(v => ({ ...v, [f.name]: e.target.value }))}
        sx={selectArrowSx}
        error={!!errors[f.name]}
        helperText={errors[f.name]}
        InputProps={
          f.tooltip
            ? {
                endAdornment: (
                  <InputAdornment position='end'>
                    <Tooltip title={f.tooltip} arrow>
                      <span>
                        <IconButton color='primary' edge='end'>
                          <Icon icon='mdi:information-outline' />
                        </IconButton>
                      </span>
                    </Tooltip>
                  </InputAdornment>
                )
              }
            : undefined
        }
      >
        {f.type === 'select' &&
          (f.options ?? []).map(o => (
            <MenuItem key={o.value} value={o.value}>
              {o.label}
            </MenuItem>
          ))}
      </TextField>
    )
  }

  return (
    <Dialog open={open} onClose={saving ? undefined : onClose} fullWidth maxWidth='sm'>
      <DialogTitle sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          {title}
          {titleTooltip && (
            <Tooltip title={titleTooltip} arrow>
              <span>
                <IconButton color='primary' sx={{ ml: 1 }}>
                  <Icon icon='mdi:information-outline' />
                </IconButton>
              </span>
            </Tooltip>
          )}
        </Box>
      </DialogTitle>
      <Divider />
      <DialogContent sx={{ pt: 2 }}>
        {description && (
          <Typography variant='body2' color='text.secondary' sx={{ mb: 2 }}>
            {description}
          </Typography>
        )}
        {error && (
          <Alert severity='error' sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Stack spacing={2} sx={{ mt: 1 }}>
          {blocks.map((block, i) =>
            block.section ? (
              <Box key={block.section.name}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Typography variant='subtitle1' sx={{ fontWeight: 600 }}>
                      {block.section.label}
                    </Typography>
                    {block.section.tooltip && (
                      <Tooltip title={block.section.tooltip} arrow>
                        <span>
                          <IconButton color='primary' sx={{ ml: 1 }}>
                            <Icon icon='mdi:information-outline' />
                          </IconButton>
                        </span>
                      </Tooltip>
                    )}
                  </Box>
                  <IconButton
                    onClick={() => setOpenSections(s => ({ ...s, [block.section.name]: !s[block.section.name] }))}
                  >
                    <Icon
                      icon='mdi:chevron-down'
                      style={{
                        transform: openSections[block.section.name] ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: '0.3s'
                      }}
                    />
                  </IconButton>
                </Box>

                <Collapse in={!!openSections[block.section.name]}>
                  <Stack spacing={2} sx={{ pt: 1 }}>
                    {block.fields.map(field)}
                  </Stack>
                </Collapse>
              </Box>
            ) : (
              <Stack key={`block-${i}`} spacing={2}>
                {block.fields.map(field)}
              </Stack>
            )
          )}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={saving} color='inherit'>
          Cancel
        </Button>
        <Button
          onClick={save}
          disabled={saving || missing || Object.keys(errors).length > 0}
          variant='contained'
          color={destructive ? 'error' : 'primary'}
          startIcon={saving ? <CircularProgress size={16} color='inherit' /> : null}
        >
          {saving ? 'Working…' : saveLabel}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default ActionDialog
