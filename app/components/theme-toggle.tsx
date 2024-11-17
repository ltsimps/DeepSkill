import { Moon, Sun, SunMoon } from "lucide-react"
import { useTheme } from "./theme-provider"
import { useSettings } from "./settings-provider"
import { Button } from "./ui/button"
import { AutoThemeSwitcher } from "./auto-theme-switcher"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const { settings, updateSettings } = useSettings()

  const toggleAutoTheme = () => {
    updateSettings({ autoTheme: !settings.autoTheme })
  }

  return (
    <div className="flex items-center gap-2">
      {settings.autoTheme && <AutoThemeSwitcher />}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => {
          if (settings.autoTheme) {
            toggleAutoTheme()
          } else {
            setTheme(theme === "light" ? "dark" : "light")
          }
        }}
        className="relative"
      >
        <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
        <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        <span className="sr-only">Toggle theme</span>
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleAutoTheme}
        className={settings.autoTheme ? "text-primary" : "text-muted-foreground"}
        title="Auto theme switching"
      >
        <SunMoon className="h-[1.2rem] w-[1.2rem]" />
        <span className="sr-only">Toggle auto theme</span>
      </Button>
    </div>
  )
}
