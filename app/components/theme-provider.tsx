import { createContext, useContext, useEffect, useState } from "react"
import { defaultTheme, themes, type ThemeConfig } from "~/styles/theme"

type Theme = "dark" | "light" | "system" | "default" | "ocean" | "forest"

type ThemeProviderProps = {
  children: React.ReactNode
  defaultTheme?: Theme
  storageKey?: string
  attribute?: string
  enableSystem?: boolean
}

type ThemeProviderState = {
  theme: Theme
  setTheme: (theme: Theme) => void
  activeTheme: ThemeConfig
}

const initialState: ThemeProviderState = {
  theme: "system",
  setTheme: () => null,
  activeTheme: defaultTheme,
}

const ThemeProviderContext = createContext<ThemeProviderState>(initialState)

function getSystemTheme(): "dark" | "light" {
  if (typeof window === 'undefined') return "light"
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
}

export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "ui-theme",
  attribute = "data-theme",
  enableSystem = true,
  ...props
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(defaultTheme)
  const [activeTheme, setActiveTheme] = useState<ThemeConfig>(defaultTheme)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const savedTheme = typeof window !== 'undefined'
      ? localStorage.getItem(storageKey) as Theme
      : null
    if (savedTheme) {
      setTheme(savedTheme)
    }
  }, [storageKey])

  useEffect(() => {
    if (!mounted) return

    const root = window.document.documentElement
    const isDark = theme === "system" ? getSystemTheme() === "dark" : theme === "dark"

    root.classList.remove("light", "dark")
    root.classList.add(isDark ? "dark" : "light")

    if (attribute !== "class") {
      root.setAttribute(attribute, isDark ? "dark" : "light")
    }
  }, [theme, attribute, mounted])

  useEffect(() => {
    if (!mounted) return

    const root = window.document.documentElement
    const isDark = root.classList.contains("dark")
    const currentTheme = themes.find((t) => t.name.toLowerCase() === theme) || defaultTheme
    setActiveTheme(currentTheme)

    if (currentTheme.colors) {
      Object.entries(currentTheme.colors).forEach(([key, value]) => {
        root.style.setProperty(`--${key}`, value[isDark ? "dark" : "light"])
      })
    }
  }, [theme, mounted])

  const value = {
    theme,
    setTheme: (theme: Theme) => {
      if (typeof window !== 'undefined') {
        localStorage.setItem(storageKey, theme)
      }
      setTheme(theme)
    },
    activeTheme,
  }

  if (!mounted) {
    return <>{children}</>
  }

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext)

  if (context === undefined)
    throw new Error("useTheme must be used within a ThemeProvider")

  return context
}
