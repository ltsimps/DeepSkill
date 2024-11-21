import {
	json,
	redirect,
	type LoaderFunctionArgs,
	type HeadersFunction,
	type LinksFunction,
	type MetaFunction,
} from '@remix-run/node'
import {
	Form,
	Link,
	Links,
	Meta,
	Outlet,
	Scripts,
	ScrollRestoration,
	useLoaderData,
	useMatches,
	useSubmit,
} from '@remix-run/react'
import { withSentry } from '@sentry/remix'
import { useEffect, useRef } from 'react'
import { HoneypotProvider } from 'remix-utils/honeypot/react'
import appleTouchIconAssetUrl from './assets/favicons/apple-touch-icon.png'
import faviconAssetUrl from './assets/favicons/favicon.svg'
import fontsStylesheetUrl from './styles/fonts.css?url'
import { GeneralErrorBoundary } from './components/error-boundary.tsx'
import { EpicProgress } from './components/progress-bar.tsx'
import { useToast, ToastProvider } from './components/toaster.tsx'
import { Button } from './components/ui/button.tsx'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuPortal,
	DropdownMenuTrigger,
} from './components/ui/dropdown-menu.tsx'
import { Icon, href as iconsHref } from './components/ui/icon.tsx'
import { EpicToaster } from './components/ui/sonner.tsx'
import tailwindStyleSheetUrl from './styles/tailwind.css?url'
import { getUserId, logout } from './utils/auth.server.ts'
import { ClientHintCheck, getHints } from './utils/client-hints.tsx'
import { prisma } from './utils/db.server.ts'
import { getEnv } from './utils/env.server.ts'
import { honeypot } from './utils/honeypot.server.ts'
import { combineHeaders, getDomainUrl, getUserImgSrc } from './utils/misc.tsx'
import { useNonce } from './utils/nonce-provider.ts'
import { type Theme, getTheme } from './utils/theme.server.ts'
import { makeTimings, time } from './utils/timing.server.ts'
import { getToast } from './utils/toast.server.ts'
import { useOptionalUser, useUser } from './utils/user.ts'
import { ThemeSwitch, useTheme } from './routes/resources+/theme-switch.tsx'
import { useOptionalRequestInfo } from './utils/request-info.ts'
import { initializeServices } from './services/init.server'

export const links: LinksFunction = () => {
	return [
		// Prefetch svg sprite instead of preloading to avoid warnings
		{ rel: 'prefetch', href: iconsHref, type: 'image/svg+xml' },
		{
			rel: 'icon',
			href: '/favicon.ico',
			sizes: '48x48',
		},
		{ rel: 'icon', type: 'image/svg+xml', href: faviconAssetUrl },
		{ rel: 'apple-touch-icon', href: appleTouchIconAssetUrl },
		{
			rel: 'manifest',
			href: '/site.webmanifest',
			crossOrigin: 'use-credentials',
		} as const, // necessary to make typescript happy
		{ rel: 'stylesheet', href: tailwindStyleSheetUrl },
		{ rel: 'stylesheet', href: fontsStylesheetUrl },
	].filter(Boolean)
}

export const meta: MetaFunction<typeof loader> = ({ data }) => {
	return [
		{ title: data ? 'Epic Notes' : 'Error | Epic Notes' },
		{ name: 'description', content: `Your own captain's log` },
	]
}

export async function loader({ request }: LoaderFunctionArgs) {
	await initializeServices()
	const timings = makeTimings('root loader')
	const userId = await time(() => getUserId(request), {
		timings,
		type: 'getUserId',
		desc: 'getUserId in root',
	})

	// Handle authentication redirects
	const url = new URL(request.url)
	const publicRoutes = ['/', '/login', '/signup']
	const protectedRoutes = ['/dashboard', '/profile', '/settings']
  
	if (userId) {
		// If user is logged in and trying to access public routes, redirect to dashboard
		if (publicRoutes.includes(url.pathname)) {
			return redirect('/dashboard')
		}
	} else {
		// If user is not logged in and trying to access protected routes or practice, redirect to login
		if (protectedRoutes.some(route => url.pathname.startsWith(route)) || url.pathname.startsWith('/practice')) {
			return redirect('/login')
		}
	}

	const user = userId
		? await time(
				() =>
					prisma.user.findUnique({
						where: { id: userId },
						select: {
							id: true,
							name: true,
							username: true,
							email: true,
							image: { select: { id: true } },
							roles: true,
						},
					}),
				{ timings, type: 'find user', desc: 'find user in root' },
		  )
		: null

	if (userId && !user) {
		console.info('user not found', { userId })
		await logout({ request, redirectTo: '/' })
		return redirect('/')
	}

	const toast = await getToast(request)
	const honeyProps = honeypot.getInputProps()
	const { theme } = await getTheme(request)
	const env = getEnv()

	return json(
		{
			user,
			requestInfo: {
				hints: getHints(request),
				origin: getDomainUrl(request),
				path: new URL(request.url).pathname,
				userPrefs: {
					theme,
				},
			},
			ENV: env,
			theme,
			toast,
			honeyProps,
		},
		{
			headers: combineHeaders(
				toast?.headers,
				{
					'Server-Timing': timings.toString(),
				},
			),
		},
	)
}

export const headers: HeadersFunction = ({ loaderHeaders }) => {
	const headers = {
		'Content-Security-Policy': 
			"default-src 'self'; " +
			"script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net; " +
			"style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; " +
			"img-src 'self' data: https:; " +
			"font-src 'self' data: https:; " +
			"connect-src 'self' https://api.openai.com https://cdn.jsdelivr.net",
		'X-Frame-Options': 'SAMEORIGIN',
		'X-XSS-Protection': '1; mode=block',
		'X-Content-Type-Options': 'nosniff',
	}

	return headers
}

function Document({
	children,
	nonce,
	theme = 'light',
	env = {},
}: {
	children: React.ReactNode
	nonce: string
	theme?: Theme
	env?: Record<string, string>
}) {
	const allowIndexing = env.ALLOW_INDEXING !== 'false'
	return (
		<html lang="en" className={`${theme} h-full overflow-x-hidden`}>
			<head>
				<ClientHintCheck nonce={nonce} />
				<Meta />
				<meta charSet="utf-8" />
				<meta name="viewport" content="width=device-width,initial-scale=1" />
				{allowIndexing ? null : (
					<meta name="robots" content="noindex,nofollow" />
				)}
				<Links />
			</head>
			<body className="bg-background text-foreground">
				{children}
				<script
					nonce={nonce}
					dangerouslySetInnerHTML={{
						__html: `window.ENV = ${JSON.stringify(env)}`,
					}}
				/>
				<ScrollRestoration nonce={nonce} />
				<Scripts nonce={nonce} />
			</body>
		</html>
	)
}

function Layout({ children }: { children: React.ReactNode }) {
	const data = useLoaderData<typeof loader>()
	const theme = useTheme()
	const user = useOptionalUser()
	return (
		<div className="flex h-full flex-col justify-between">
			<header className="container py-6">
				<nav className="flex items-center justify-between">
					<Logo />
					<div className="flex items-center gap-10">
						{user ? (
							<UserDropdown />
						) : (
							<Button asChild variant="default">
								<Link to="/login">Log In</Link>
							</Button>
						)}
						<ThemeSwitch />
					</div>
				</nav>
			</header>

			<div className="flex-1">
				<Outlet />
			</div>

			<div className="container flex justify-between pb-5">
				<Link to="/">
					<div className="flex flex-row gap-2">
						<Icon name="brain-circuit" />
						<p className="text-sm">DeepSkill</p>
					</div>
				</Link>
			</div>
		</div>
	)
}

function App() {
	const data = useLoaderData<typeof loader>()
	const nonce = useNonce()
	const user = useOptionalUser()
	const theme = useTheme()
	const matches = useMatches()
	const isOnSearchPage = matches.find(m => m.id === 'routes/users+/index')
	const searchInputRef = useRef<HTMLInputElement>(null)
	const submit = useSubmit()

	useToast(data.toast)

	useEffect(() => {
		const keyboardShortcuts = (event: KeyboardEvent) => {
			if (event.key === 'k' && (event.metaKey || event.ctrlKey)) {
				event.preventDefault()
				if (isOnSearchPage) {
					searchInputRef.current?.focus()
				} else {
					submit(null, { action: '/users', method: 'GET' })
				}
			}
		}
		document.addEventListener('keydown', keyboardShortcuts)
		return () => {
			document.removeEventListener('keydown', keyboardShortcuts)
		}
	}, [isOnSearchPage, submit])

	return (
		<Document nonce={nonce} theme={theme} env={data.ENV}>
			<ToastProvider>
				<div className="flex h-screen flex-col">
					<div className="flex-1">
						<Layout>
							<Outlet />
						</Layout>
					</div>
					<EpicToaster closeButton position="top-center" theme={theme} />
					<EpicProgress />
				</div>
			</ToastProvider>
		</Document>
	)
}

function AppWithProviders() {
	const data = useLoaderData<typeof loader>()
	return (
		<HoneypotProvider {...data.honeyProps}>
			<App />
		</HoneypotProvider>
	)
}

export default withSentry(AppWithProviders)

export function ErrorBoundary() {
	const nonce = useNonce()
	const maybeRequestInfo = useOptionalRequestInfo()
	const theme = maybeRequestInfo?.userPrefs.theme ?? 'light'

	return (
		<Document nonce={nonce} theme={theme}>
			<div className="flex-1">
				<GeneralErrorBoundary />
			</div>
		</Document>
	)
}

function Logo() {
	return (
		<Link to="/" className="group grid leading-snug">
			<span className="font-light transition group-hover:-translate-x-1">
				epic
			</span>
			<span className="font-bold transition group-hover:translate-x-1">
				notes
			</span>
		</Link>
	)
}

function UserDropdown() {
	const user = useUser()
	const submit = useSubmit()
	const formRef = useRef<HTMLFormElement>(null)
	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button asChild variant="secondary">
					<Link
						to={`/users/${user.username}`}
						// this is for progressive enhancement
						onClick={(e) => e.preventDefault()}
						className="flex items-center gap-2"
					>
						<img
							className="h-8 w-8 rounded-full object-cover"
							alt={user.name ?? user.username}
							src={getUserImgSrc(user.image?.id)}
						/>
						<span className="text-body-sm font-bold">
							{user.name ?? user.username}
						</span>
					</Link>
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuPortal>
				<DropdownMenuContent sideOffset={8} align="start">
					<DropdownMenuItem asChild>
						<Link prefetch="intent" to={`/users/${user.username}`}>
							<Icon className="text-body-md" name="avatar">
								Profile
							</Icon>
						</Link>
					</DropdownMenuItem>
					<DropdownMenuItem asChild>
						<Link prefetch="intent" to={`/users/${user.username}/notes`}>
							<Icon className="text-body-md" name="pencil-2">
								Notes
							</Icon>
						</Link>
					</DropdownMenuItem>
					<DropdownMenuItem
						asChild
						// this prevents the menu from closing before the form submission is completed
						onSelect={(event) => {
							event.preventDefault()
							submit(formRef.current)
						}}
					>
						<Form action="/logout" method="POST" ref={formRef}>
							<Icon className="text-body-md" name="exit">
								<button type="submit">Logout</button>
							</Icon>
						</Form>
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenuPortal>
		</DropdownMenu>
	)
}
