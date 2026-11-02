export const shimmerSx = {
  position: 'relative',
  overflow: 'hidden',
  '&::after': {
    content: '""',
    position: 'absolute',
    inset: 0,
    transform: 'translateX(-120%)',
    background:
      'linear-gradient(90deg, transparent, rgba(255,255,255,0.18), transparent)',
    animation: 'shimmer 1.25s infinite'
  },
  '@keyframes shimmer': {
    '100%': { transform: 'translateX(120%)' }
  }
}

// Text with a highlight sweeping across it, for content that is still being generated
export const textShimmerSx = theme => ({
  color: 'transparent',
  backgroundImage: `linear-gradient(90deg, ${theme.palette.text.disabled} 35%, ${theme.palette.text.primary} 50%, ${theme.palette.text.disabled} 65%)`,
  backgroundSize: '200% 100%',
  backgroundClip: 'text',
  WebkitBackgroundClip: 'text',
  animation: 'textShimmer 1.8s linear infinite',
  '@keyframes textShimmer': {
    '0%': { backgroundPosition: '100% 0' },
    '100%': { backgroundPosition: '-100% 0' }
  }
})