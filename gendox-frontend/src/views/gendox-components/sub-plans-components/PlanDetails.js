// ** MUI Imports
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Icon from 'src/@core/components/icon'
import { useTheme } from '@mui/material/styles'


const PlanDetails = ({ plan }) => {
    const theme = useTheme()


  return (
    <Box sx={{ mb: 12 }}>
     {/* Monthly Message Limit */}
     <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <Box
          component="span"
          sx={{
            display: 'inline-flex',
            color: theme.palette.primary.main,
            mr: 2,
          }}
        >
          <Icon icon="mdi:email-outline" fontSize="1.25rem" />
        </Box>
        <Typography variant="body2" sx={{ color: theme.palette.text.primary }}>
          Monthly Message Limit: <strong>{plan?.userMessageMonthlyLimitCount}</strong>
        </Typography>
      </Box>

      {/* File Upload Limit (Files) */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <Box
          component="span"
          sx={{
            display: 'inline-flex',
            color: theme.palette.success.main,
            mr: 2,
          }}
        >
          <Icon icon="mdi:file-outline" fontSize="1.25rem" />
        </Box>
        <Typography variant="body2" sx={{ color: theme.palette.text.primary }}>
          File Upload Limit (Files): <strong>{plan?.userUploadLimitFileCount}</strong>
        </Typography>
      </Box>

      {/* File Upload Limit (MB) */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <Box
          component="span"
          sx={{
            display: 'inline-flex',
            color: theme.palette.info.main,
            mr: 2,
          }}
        >
          <Icon icon="mdi:database-outline" fontSize="1.25rem" />
        </Box>
        <Typography variant="body2" sx={{ color: theme.palette.text.primary }}>
          File Upload Limit (MB): <strong>{plan?.userUploadLimitMb} MB</strong>
        </Typography>
      </Box>

      {/* MOQ */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <Box
          component="span"
          sx={{
            display: 'inline-flex',
            color: theme.palette.warning.main,
            mr: 2,
          }}
        >
          <Icon icon="mdi:numeric" fontSize="1.25rem" />
        </Box>
        <Typography variant="body2" sx={{ color: theme.palette.text.primary }}>
          Number of Seats: <strong>{plan?.moq}</strong>
        </Typography>
      </Box>
    </Box>
  )
}

export default PlanDetails
