// ** MUI Imports
import Box from '@mui/material/Box'
import Link from '@mui/material/Link'
import Typography from '@mui/material/Typography'
import useMediaQuery from '@mui/material/useMediaQuery'

const GendoxFooterContent = () => {
  // ** Var
  const hidden = useMediaQuery(theme => theme.breakpoints.down('md'))

  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
      <Typography sx={{ mr: 2 }}>
        {`© ${new Date().getFullYear()}, Created by `}
        <Link target='_blank' href='https://www.ctrlspace.dev/'>
          Ctrl+Space Labs
        </Link>
      </Typography>
      {hidden ? null : (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', '& :not(:last-child)': { mr: 4 } }}>
          <Link
            target='_blank'
            href='https://ctrl-space-labs.github.io/gendox-core'
          >
            Documentation
          </Link>
          <Link target='_blank' href='https://www.ctrlspace.dev/'>
            Support
          </Link>
          <Link target='_blank' href='https://themeselection.com/'>
            ThemeSelection
          </Link>

        </Box>
      )}
    </Box>
  )
}

export default GendoxFooterContent
