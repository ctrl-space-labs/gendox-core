import SystemSkillsAdmin from 'src/views/pages/admin/SystemSkillsAdmin'
import RequireSuperAdmin from 'src/authentication/components/RequireSuperAdmin'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'

const NotAllowed = () => (
  <Card>
    <CardContent>
      <Typography variant='h6'>System skills</Typography>
      <Typography variant='body2' sx={{ color: 'text.secondary', mt: 2 }}>
        Only Gendox system administrators can open this page.
      </Typography>
    </CardContent>
  </Card>
)

const SystemSkillsPage = () => (
  <RequireSuperAdmin fallback={<NotAllowed />}>
    <SystemSkillsAdmin />
  </RequireSuperAdmin>
)

export default SystemSkillsPage
