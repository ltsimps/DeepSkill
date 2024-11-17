import type { LinksFunction } from "@remix-run/node";
import {
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "@remix-run/react";
import { ThemeProvider } from "~/components/theme-provider";
import { SettingsProvider } from "~/components/settings-provider";
import { ThemeSelector } from "~/components/theme-selector";

// Import CSS
import "~/styles/globals.css";

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: "https://rsms.me/inter/inter.css" },
];

export default function App() {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body className="min-h-screen bg-background font-sans antialiased">
        <SettingsProvider>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            <div className="relative flex min-h-screen flex-col">
              <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="container flex h-14 items-center">
                  <div className="mr-4 flex">
                    <a className="mr-6 flex items-center space-x-2" href="/">
                      <span className="hidden font-bold sm:inline-block">
                        DeepSkill
                      </span>
                    </a>
                  </div>
                  <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
                    <div className="w-full flex-1 md:w-auto md:flex-none">
                      <ThemeSelector />
                    </div>
                  </div>
                </div>
              </header>
              <div className="flex-1">
                <Outlet />
              </div>
            </div>
          </ThemeProvider>
        </SettingsProvider>
        <ScrollRestoration />
        <Scripts />
        <LiveReload />
      </body>
    </html>
  );
}
