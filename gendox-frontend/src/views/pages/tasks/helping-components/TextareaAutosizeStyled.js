import { forwardRef } from 'react'
import { useTheme } from '@mui/material/styles'


const TextareaAutosizeStyled = forwardRef((props, ref) => {
  const theme = useTheme()
  return (
    <textarea
      ref={ref}
      {...props}
      style={{
        width: '100%',
        minHeight: 180,
        padding: '12px 16px',
        fontSize: '1rem',
        borderRadius: 8,
        border: `1px solid ${theme.palette.divider}`,
        backgroundColor: theme.palette.background.paper,
        color: theme.palette.text.primary,
        resize: 'vertical',
        marginBottom: 16,
        outline: 'none',
        ...props.style
      }}
    />
  )
})

export default TextareaAutosizeStyled