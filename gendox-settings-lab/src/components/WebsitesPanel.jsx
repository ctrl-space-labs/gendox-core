import { useEffect, useState } from 'react'
import {
  Card, CardHeader, List, ListItem, ListItemButton, ListItemText,
  Chip, Stack, Collapse, Alert
} from '@mui/material'
import { listWebsites, listIntegrations } from '../api/webScrape'
import SourcePanel from './SourcePanel'

const WEB_SCRAPE = 'WEB_SCRAPE_INTEGRATION'

export default function WebsitesPanel({ orgId }) {
  const [sites, setSites] = useState([])
  const [integrations, setIntegrations] = useState([])
  const [openId, setOpenId] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false

    ;(async () => {
      setError(null)
      try {
        const [w, i] = await Promise.all([listWebsites(orgId), listIntegrations(orgId)])
        if (cancelled) return
        setSites(w ?? [])
        setIntegrations(i?.content ?? [])
      } catch (e) {
        if (!cancelled) setError(e.message)
      }
    })()

    return () => { cancelled = true }
  }, [orgId])

  // a web scrape integration that no website points at is still worth showing
  const orphans = integrations.filter(
    i => i.integrationType?.name === WEB_SCRAPE &&
         !sites.some(s => s.integrationId === i.id)
  )

  const rows = [
    ...sites.map(s => ({
      key: s.id,
      name: s.name,
      url: s.url,
      integration: integrations.find(i => i.id === s.integrationId) ?? null
    })),
    ...orphans.map(i => ({
      key: i.id,
      name: '(no website row)',
      url: i.url,
      integration: i
    }))
  ]

  return (
    <Card>
      <CardHeader
        title="Websites"
        subheader="Domains where the widget may run, and websites Gendox reads as a source."
      />

      {error && <Alert severity="error" sx={{ mx: 2, mb: 2 }}>{error}</Alert>}

      <List disablePadding>
        {rows.map(r => {
          const scrape = r.integration?.integrationType?.name === WEB_SCRAPE

          const content = (
            <>
              <ListItemText primary={r.name} secondary={r.url} />
              <Stack direction="row" spacing={1}>
                <Chip size="small" label="Embed" variant="outlined" />
                {r.integration && <Chip size="small" color="primary" label="Content" />}
              </Stack>
            </>
          )

          return (
            <div key={r.key}>
              {scrape ? (
                <ListItemButton onClick={() => setOpenId(openId === r.key ? null : r.key)}>
                  {content}
                </ListItemButton>
              ) : (
                <ListItem>{content}</ListItem>
              )}

              <Collapse in={openId === r.key} unmountOnExit>
                {scrape && <SourcePanel orgId={orgId} integration={r.integration} />}
              </Collapse>
            </div>
          )
        })}
      </List>
    </Card>
  )
}