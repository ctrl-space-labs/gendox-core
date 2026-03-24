import Box from '@mui/material/Box'

export default function WorkspaceShell({ children }) {
  return (
  <Box sx={{ height: '100%', minHeight: 0, overflow: 'hidden' }}>{
    children}
    </Box>
    );
}
