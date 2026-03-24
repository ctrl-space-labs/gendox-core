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