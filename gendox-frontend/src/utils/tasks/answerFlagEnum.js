import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline'
import HelpOutlineIcon from '@mui/icons-material/HelpOutline'
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline'

export const answerFlagEnum = (flag, theme) => {
  // Always expect theme as an argument!
  switch (flag) {
    case 'INFO':
      return <InfoOutlinedIcon fontSize='small' sx={{ color: theme.palette.info.main }} titleAccess='Info' />
    case 'OK':
      return <CheckCircleIcon fontSize='small' sx={{ color: theme.palette.success.main }} titleAccess='OK' />
    case 'WARNING':
      return <WarningAmberIcon fontSize='small' sx={{ color: theme.palette.warning.main }} titleAccess='Warning' />
    case 'MINOR_ISSUE':
      return <ErrorOutlineIcon fontSize='small' sx={{ color: theme.palette.warning.dark }} titleAccess='Minor Issue' />
    case 'CRITICAL_ISSUE':
      return <ErrorOutlineIcon fontSize='small' sx={{ color: theme.palette.error.main }} titleAccess='Critical Issue' />
    case 'NA':
      return <HelpOutlineIcon fontSize='small' sx={{ color: theme.palette.text.disabled }} titleAccess='N/A' />
    default:
      return (
        <PlayCircleOutlineIcon
          fontSize='small'
          sx={{ color: theme.palette.primary.light }}
          titleAccess='Click Generate'
        />
      )
  }
}

export const getAnswerFlagProps = flag => {
  switch (flag) {
    case 'INFO':
      return { label: 'Info', chipColor: 'info' }
    case 'OK':
      return { label: 'OK', chipColor: 'success' }
    case 'WARNING':
      return { label: 'Warning', chipColor: 'warning' }
    case 'MINOR_ISSUE':
      return { label: 'Minor', chipColor: 'warning' }
    case 'CRITICAL_ISSUE':
      return { label: 'Critical', chipColor: 'error' }
    case 'NA':
      return { label: 'N/A', chipColor: 'primary' } // or 'info', 'warning', etc.
    default:
      return { label: 'Not generated', chipColor: 'primary' }
  }
}