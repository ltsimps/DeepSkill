import { useTheme } from "./theme-provider";
import { themes } from "~/styles/theme";
import { Button } from "./ui/button";
import { Check, Palette } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { cn } from "~/lib/utils";

export function ThemeSelector() {
  const { theme, setTheme, activeTheme } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 w-9">
          <Palette className="h-4 w-4" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {themes.map((t) => {
          const themeName = t.name.toLowerCase();
          const isActive = theme === themeName;
          const primaryColor = t.colors?.primary?.light || "#000000";

          return (
            <DropdownMenuItem
              key={t.name}
              onClick={() => setTheme(themeName as any)}
              className={cn(
                "flex items-center justify-between",
                isActive && "bg-accent"
              )}
            >
              <div className="flex items-center gap-2">
                <div
                  className="h-4 w-4 rounded-full"
                  style={{
                    backgroundColor: `hsl(${primaryColor})`,
                  }}
                />
                {t.name}
              </div>
              {isActive && (
                <Check className="h-4 w-4" />
              )}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
