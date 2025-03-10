// This is theme options for Gendox
// If a different styling is required, a new theme options file should be created and used in the ThemeOptions.js file
import { useSettings } from 'src/@core/hooks/useSettings'

const GendoxThemeOptions = (mode, themeColor, embeddedLayout) => {


  // ** Vars
  const lightColor = '75, 77, 99'
  const darkColor = '237, 237, 255'
  const mainColor = mode === 'light' ? lightColor : darkColor

  const defaultBackground = () => {
    if (embeddedLayout) {
      return 'rgba(255,255,255,0)';
    }
    return mode === 'light' ? '#F5F5F7' : '#24263D';
  };

  const primaryGradient = () => {
    if (themeColor === 'primary') {
      return '#16EAB8'
    } else if (themeColor === 'secondary') {
      return '#9C9FA4'
    } else if (themeColor === 'success') {
      return '#93DD5C'
    } else if (themeColor === 'error') {
      return '#FF8C90'
    } else if (themeColor === 'warning') {
      return '#FFCF5C'
    } else {
      return '#6ACDFF'
    }
  }

  return {
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          '.layout-content-wrapper': {
            backgroundImage: mode === 'light' ? `url('/images/gendox-back-light.webp')` : `url('/images/gendox-back-dark.webp')`,
            backgroundRepeat: 'no-repeat',
            backgroundSize: 'cover',
            backgroundPosition: 'right top',
            backgroundAttachment: 'fixed',
          },
        },
      },
    },
    palette: {
      customColors: {
        main: mainColor,
        primaryGradient: primaryGradient(),
        tableHeaderBg: mode === 'light' ? '#F5F5F7' : '#3A3E5B'
      },
      primary: {
        light: '#0CD4A5',
        main: '#08B68D',
        dark: '#15A784'
      },

      text: {
        primary: `rgba(${mainColor}, 0.87)`,
        secondary: `rgba(${mainColor}, 0.68)`,
        disabled: `rgba(${mainColor}, 0.38)`
      },
      divider: `rgba(${mainColor}, 0.12)`,
      background: {
        paper: mode === 'light' ? '#FCFCFC' : '#343752',
        default: defaultBackground()
      },
      action: {
        active: `rgba(${mainColor}, 0.54)`,
        hover: `rgba(${mainColor}, 0.04)`,
        selected: `rgba(${mainColor}, 0.08)`,
        disabled: `rgba(${mainColor}, 0.3)`,
        disabledBackground: `rgba(${mainColor}, 0.18)`,
        focus: `rgba(${mainColor}, 0.12)`
      }
    }
  }
}

export default GendoxThemeOptions
