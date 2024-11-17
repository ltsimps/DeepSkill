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

export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "ui-theme",
  attribute = "data-theme",
  enableSystem = true,
  ...props
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(
    () => (localStorage.getItem(storageKey) as Theme) || defaultTheme
  )

  const [activeTheme, setActiveTheme] = useState<ThemeConfig>(defaultTheme)

  useEffect(() => {
    const root = window.document.documentElement

    if (attribute === "class") {
      root.classList.remove("light", "dark")

      if (theme === "system") {
        const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
          .matches
          ? "dark"
          : "light"

        root.classList.add(systemTheme)
        return
      }

      root.classList.add(theme)
    } else {
      if (theme === "system") {
        const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
          .matches
          ? "dark"
          : "light"

        root.setAttribute(attribute, systemTheme)
        return
      }

      root.setAttribute(attribute, theme)
    }
  }, [theme, attribute])

  useEffect(() => {
    const newTheme = themes.find((t) => t.name.toLowerCase() === theme) || defaultTheme
    setActiveTheme(newTheme)

    // Apply theme colors to CSS variables
    const root = window.document.documentElement
    const mode = root.classList.contains("dark") ? "dark" : "light"

    Object.entries(newTheme.colors).forEach(([key, value]) => {
      root.style.setProperty(`--${key}`, value[mode])
    })
  }, [theme])

  const value = {
    theme,
    setTheme: (theme: Theme) => {
      localStorage.setItem(storageKey, theme)
      setTheme(theme)
    },
    activeTheme,
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
