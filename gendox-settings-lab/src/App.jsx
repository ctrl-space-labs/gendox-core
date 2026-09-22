import { useEffect, useState } from 'react'
import {
  Container, Stack, Select, MenuItem,
  FormControl, InputLabel, Switch, FormControlLabel, Alert
} from '@mui/material'
import ThemeComponent from './@core/theme/ThemeComponent'
import TokenBar from './components/TokenBar'
import WebsitesPanel from './components/WebsitesPanel'
import { getProfile } from './api/webScrape'

export default function App() {
  const [mode, setMode] = useState('light')
  const [orgs, setOrgs] = useState([])
  const [orgId, setOrgId] = useState('')
  const [error, setError] = useState(null)

  const loadProfile = async () => {
    setError(null)
    try {
      const profile = await getProfile()
      const list = profile?.organizations ?? []
      setOrgs(list)
      if (list.length && !orgId) setOrgId(list[0].id)
    } catch (e) {
      setError(e.message)
    }
  }

  useEffect(() => { loadProfile() }, [])

  return (
    <ThemeComponent settings={{ mode, themeColor: 'primary', embeddedLayout: false }}>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <TokenBar onChange={loadProfile} />

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 3 }}>
          <FormControl size="small" sx={{ minWidth: 280 }}>
            <InputLabel>Organization</InputLabel>
            <Select label="Organization" value={orgId} onChange={e => setOrgId(e.target.value)}>
              {orgs.map(o => <MenuItem key={o.id} value={o.id}>{o.name}</MenuItem>)}
            </Select>
          </FormControl>
          <FormControlLabel
            control={
              <Switch
                checked={mode === 'dark'}
                onChange={e => setMode(e.target.checked ? 'dark' : 'light')}
              />
            }
            label="Dark"
          />
        </Stack>

                {orgId && <WebsitesPanel orgId={orgId} />}
      </Container>
    </ThemeComponent>
  )
}