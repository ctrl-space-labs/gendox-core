import { ThemeProvider as NextThemesProvider } from "next-themes"
import type { ReactNode } from "react"
import type { Settings } from "src/@core/context/settingsContext"

interface ThemeComponentProps {
  settings: Settings
  children: ReactNode
}

const ThemeComponent = ({ settings, children }: ThemeComponentProps) => {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme={settings.mode}
      enableSystem={false}
      disableTransitionOnChange
    >
      {children}
    </NextThemesProvider>
  )
}

export default ThemeComponent
