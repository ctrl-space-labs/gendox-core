// ** Next Import
import Link from 'next/link'

// ** MUI Imports
import Box from '@mui/material/Box'
import { styled } from '@mui/material/styles'
import Typography from '@mui/material/Typography'
import useMediaQuery from '@mui/material/useMediaQuery'

const LinkStyled = styled(Link)(({ theme }) => ({
  textDecoration: 'none',
  color: theme.palette.primary.main
}))

const FooterContent = () => {
  // ** Var
  const hidden = useMediaQuery(theme => theme.breakpoints.down('md'))

  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
      <Typography sx={{ mr: 2 }}>
        {`© ${new Date().getFullYear()}, Created`}
        {/* <Box component='span' sx={{ color: 'error.main' }}>
          ❤️
        </Box> */}
        {` by `}
        <LinkStyled target='_blank' href='https://www.ctrlspace.dev/'>
        Ctrl+Space Labs
        </LinkStyled>
      </Typography>
      {hidden ? null : (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', '& :not(:last-child)': { mr: 4 } }}>
          {/* <LinkStyled target='_blank' href='https://themeforest.net/licenses/standard'>
            License
          </LinkStyled> */}
          
          <LinkStyled
            target='_blank'
            href='https://github.com/ctrl-space-labs/gendox-core/wiki/01.-Introduction'
          >
            Documentation
          </LinkStyled>
          <LinkStyled target='_blank' href='https://www.ctrlspace.dev/'>
            Support
          </LinkStyled>
        </Box>
      )}
    </Box>
  )
}

export default FooterContent
