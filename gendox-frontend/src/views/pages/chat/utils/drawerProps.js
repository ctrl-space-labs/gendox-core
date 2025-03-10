export const getDrawerProps = ({ hidden, mobileOpen, onClose, theme, drawerWidth }) => {
    if (hidden) {
      return {
        variant: 'temporary',
        open: mobileOpen,
        onClose,
        ModalProps: {
          disablePortal: true,
          keepMounted: true
        },
        sx: {
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            backgroundColor: theme.palette.background.paper
          }
        }
      };
    } else {
      return {
        variant: 'permanent',
        open: true,
        sx: {
          width: drawerWidth,
          flexShrink: 0,
          [`& .MuiDrawer-paper`]: {
            width: drawerWidth,
            backgroundColor: theme.palette.background.paper,
            position: 'static',
            boxSizing: 'border-box',
            borderRight: `1px solid ${theme.palette.divider}`,
            borderTopLeftRadius: theme.shape.borderRadius,
            borderBottomLeftRadius: theme.shape.borderRadius
          }
        }
      };
    }
  };
  