import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import Button from '@mui/material/Button'
import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardActions from '@mui/material/CardActions'
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
import Icon from 'src/views/custom-components/mui/icon/icon'

/** "Skills from Gendox": the library an agent adds skills from. */
const SkillLibraryDialog = ({ open, library, addedNames, loading, onAdd, onClose }) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth='md' fullWidth scroll='paper'>
      <DialogTitle sx={{ pr: 8 }}>
        Skills from Gendox
        <Typography variant='body2' sx={{ color: 'text.secondary', mt: 1 }}>
          Ready-made skills, kept up to date by Gendox. Add the ones this agent needs.
        </Typography>
        <IconButton onClick={onClose} sx={{ position: 'absolute', right: 16, top: 16 }}>
          <Icon icon='mdi:close' />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers sx={{ px: 6, py: 4 }}>
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress size={28} />
          </Box>
        )}
        {!loading && library.length === 0 && (
          <Typography variant='body2' sx={{ color: 'text.secondary' }}>
            No Gendox skills yet.
          </Typography>
        )}
        <Grid container spacing={4}>
          {library.map(skill => {
            const added = addedNames.has(skill.name)

            return (
              <Grid item xs={12} sm={6} key={skill.id}>
                <Card variant='outlined' sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                      <Icon icon='mdi:creation-outline' />
                      <Typography variant='subtitle1' sx={{ fontWeight: 600 }}>
                        {skill.name}
                      </Typography>
                      <Typography variant='caption' sx={{ color: 'text.secondary' }}>
                        v{skill.version}
                      </Typography>
                    </Box>
                    <Typography variant='body2' sx={{ color: 'text.secondary' }}>
                      {skill.description}
                    </Typography>
                  </CardContent>
                  <CardActions sx={{ justifyContent: 'flex-end', px: 4, pb: 3 }}>
                    <Button size='small' variant={added ? 'text' : 'outlined'} disabled={added} onClick={() => onAdd(skill)}>
                      {added ? 'Added' : 'Add'}
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            )
          })}
        </Grid>
      </DialogContent>
    </Dialog>
  )
}

export default SkillLibraryDialog
