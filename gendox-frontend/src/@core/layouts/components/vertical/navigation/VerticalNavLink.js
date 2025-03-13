// ** Next Imports
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useSettings } from 'src/@core/hooks/useSettings'

// ** MUI Imports
import Chip from '@mui/material/Chip'
import ListItem from '@mui/material/ListItem'
import { styled } from '@mui/material/styles'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemButton from '@mui/material/ListItemButton'
import IconButton from '@mui/material/IconButton'

// ** Icon Import (using Iconify)
import { Icon } from '@iconify/react'

// ** Configs Import
import themeConfig from 'src/configs/themeConfig'

// ** Custom Components Imports
import UserIcon from 'src/layouts/components/UserIcon'

// ** Utils
import { handleURLQueries } from 'src/@core/layouts/utils'

// ** Styled Components
const MenuNavLink = styled(ListItemButton)(({ theme }) => ({
  width: '100%',
  borderTopRightRadius: 5,
  borderBottomRightRadius: 5,
  borderTopLeftRadius: 5,
  borderBottomLeftRadius: 5,
  color: theme.palette.text.primary,
  padding: theme.spacing(2.25, 3.5),
  transition: 'opacity .25s ease-in-out',
  '&.active, &.active:hover': {
    boxShadow: theme.shadows[3],
    backgroundImage: `linear-gradient(98deg, ${theme.palette.customColors.primaryGradient}, ${theme.palette.primary.main} 94%)`
  },
  '&.active .MuiTypography-root, &.active .MuiSvgIcon-root': {
    color: `${theme.palette.common.white} !important`
  }
}))

const MenuItemTextMetaWrapper = styled(Box)({
  width: '100%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  transition: 'opacity .25s ease-in-out',
  ...(themeConfig.menuTextTruncate && { overflow: 'hidden' })
})

/**
 * VerticalNavLink now accepts an optional `onOpenMenu` prop.
 * If provided, an IconButton with the "mdi:dots-vertical" icon is rendered.
 *
 * The `item` object should have at least:
 * - path: string (URL destination)
 * - icon: component (icon to render in ListItemIcon)
 * - title: string (main text)
 *
 * Optionally, you can add:
 * - subtitle: string (secondary text, rendered below title)
 * - badgeContent: string|number (to show a Chip)
 * - badgeColor: string (color for the Chip)
 * - disabled: boolean
 * - openInNewTab: boolean
 */
const VerticalNavLink = ({ item, navVisible, toggleNavVisibility, onOpenMenu, isSelected }) => {
  const router = useRouter()
  const IconTag = item.icon
  const { settings } = useSettings()

  const isNavLinkActive = isSelected => {
    // if isSelected has value true or false
    if (isSelected !== undefined) {
      return isSelected
    }

    return router.pathname === item.itemId || handleURLQueries(router, item.path)
  }

  const isGendoxNavLinkActive = () => {
    if (!item.itemId) {
      return false
    }

    return Object.values(router.query).some(queryValue => queryValue === item.itemId)
  }

  return (
    <ListItem
      disablePadding
      className='nav-link'
      disabled={item.disabled || false}
      // Ensure the ListItem lays out its children horizontally
      sx={{ mt: 1.5, px: '0 !important', display: 'flex', alignItems: 'center' }}
    >
      <MenuNavLink
        component={Link}
        href={item.path === undefined ? '/' : `${item.path}`}
        className={
          settings.navBarContent === 'hidden'
            ? isNavLinkActive()
              ? 'active'
              : ''
            : isGendoxNavLinkActive()
            ? 'active'
            : ''
        }
        {...(item.openInNewTab ? { target: '_blank' } : null)}
        onClick={e => {
          if (item.path === undefined) {
            e.preventDefault()
            e.stopPropagation()
          }
          if (navVisible) {
            toggleNavVisibility()
          }
        }}
        // Let the link take available space so that the IconButton (if rendered) appears at the right edge
        sx={{
          pl: 5.5,
          flexGrow: 1,
          ...(item.disabled ? { pointerEvents: 'none' } : { cursor: 'pointer' })
        }}
      >
        <ListItemIcon
          sx={{
            mr: 2.5,
            color: 'text.primary',
            transition: 'margin .25s ease-in-out'
          }}
        >
          {IconTag ? <UserIcon icon={IconTag} /> : null}
        </ListItemIcon>

        <MenuItemTextMetaWrapper>
          {/* Left: Title and optional subtitle */}
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              overflow: themeConfig.menuTextTruncate ? 'hidden' : 'visible'
            }}
          >
            <Typography {...(themeConfig.menuTextTruncate && { noWrap: true })}>{item.title}</Typography>
            {item.subtitle && (
              <Typography
                variant='caption'
                color='text.secondary'
                sx={{
                  display: '-webkit-box',
                  WebkitLineClamp: 1, // Limit to 2 lines
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}
              >
                {item.subtitle}
              </Typography>
            )}
          </Box>

          {/* Right: Chip (if badgeContent exists) */}
          {item.badgeContent ? (
            <Chip
              label={item.badgeContent}
              color={item.badgeColor || 'primary'}
              sx={{
                height: 20,
                fontWeight: 500,
                marginLeft: 1.25,
                '& .MuiChip-label': { px: 1.5, textTransform: 'capitalize' }
              }}
            />
          ) : null}

          {/* Dots Menu Icon placed inside the wrapper */}
          {onOpenMenu && (
            <span
              style={{ display: 'inline-flex' }}
              onClick={e => {
                // Prevent the parent link's click logic from triggering navigation.
                e.stopPropagation()
                e.preventDefault()
                onOpenMenu(e, item)
              }}
            >
              <IconButton>
                <Icon icon='mdi:dots-vertical' />
              </IconButton>
            </span>
          )}
        </MenuItemTextMetaWrapper>
      </MenuNavLink>
    </ListItem>
  )
}

export default VerticalNavLink
