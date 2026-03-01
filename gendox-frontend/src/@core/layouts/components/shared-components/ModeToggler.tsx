import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import type { Settings } from "src/@core/context/settingsContext"

interface ModeTogglerProps {
  settings: Settings
  saveSettings: (settings: Settings) => void
}

const ModeToggler = ({ settings, saveSettings }: ModeTogglerProps) => {
  const { setTheme } = useTheme()

  const handleModeToggle = () => {
    const newMode = settings.mode === "light" ? "dark" : "light"
    saveSettings({ ...settings, mode: newMode })
    setTheme(newMode)
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleModeToggle}
      aria-haspopup="true"
    >
      {settings.mode === "dark" ? (
        <Sun className="h-5 w-5" />
      ) : (
        <Moon className="h-5 w-5" />
      )}
    </Button>
  )
}

export default ModeToggler
