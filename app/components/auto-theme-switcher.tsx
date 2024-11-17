import { useEffect } from "react";
import { useTheme } from "./theme-provider";

export function AutoThemeSwitcher() {
  const { setTheme } = useTheme();

  useEffect(() => {
    const checkTime = () => {
      const hour = new Date().getHours();
      // Switch to dark mode between 6 PM (18:00) and 6 AM (6:00)
      if (hour >= 18 || hour < 6) {
        setTheme("dark");
      } else {
        setTheme("light");
      }
    };

    // Check time immediately
    checkTime();

    // Check every minute for time changes
    const interval = setInterval(checkTime, 60000);

    // Clean up interval on unmount
    return () => clearInterval(interval);
  }, [setTheme]);

  // This component doesn't render anything
  return null;
}
