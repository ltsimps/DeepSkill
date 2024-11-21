import * as cookie from 'cookie'

const cookieName = 'en_theme'
export type Theme = 'light' | 'dark'

export async function getTheme(request: Request) {
	const cookieHeader = request.headers.get('cookie')
	const parsed = cookieHeader ? cookie.parse(cookieHeader)[cookieName] : 'light'
	const theme = parsed === 'light' || parsed === 'dark' ? parsed : 'light'
	
	return {
		theme,
		headers: {
			'Set-Cookie': setTheme(theme),
		},
	}
}

export function setTheme(theme: Theme | 'system') {
	if (theme === 'system') {
		return cookie.serialize(cookieName, '', { path: '/', maxAge: -1 })
	} else {
		return cookie.serialize(cookieName, theme, { path: '/', maxAge: 31536000 })
	}
}
