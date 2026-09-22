import { useState } from 'react'
import { Box, TextField, Chip, Stack } from '@mui/material'
import { getBaseUrl, setBaseUrl, getToken, setToken, tokenExpiry } from '../api/client'

export default function TokenBar({ onChange }) {
  const [base, setBase] = useState(getBaseUrl())
  const [token, setTok] = useState(getToken())

  const exp = tokenExpiry()
  const expired = exp && exp < new Date()

  return (
    <Box sx={{ p: 2, mb: 3, border: '1px dashed', borderColor: 'divider', borderRadius: 2 }}>
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="center">
        <TextField
          label="API base url"
          size="small"
          value={base}
          sx={{ minWidth: 300 }}
          onChange={e => {
            setBase(e.target.value)
            setBaseUrl(e.target.value)
          }}
        />
        <TextField
          label="Access token"
          size="small"
          fullWidth
          value={token}
          onChange={e => {
            const v = e.target.value.trim()
            setTok(v)
            setToken(v)
            onChange?.()
          }}
        />
        {exp && (
          <Chip
            size="small"
            color={expired ? 'error' : 'default'}
            label={expired ? 'expired' : `valid until ${exp.toLocaleTimeString()}`}
          />
        )}
      </Stack>
    </Box>
  )
}