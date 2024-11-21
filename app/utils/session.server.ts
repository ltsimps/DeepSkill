import { createCookieSessionStorage } from '@remix-run/node'
import { prisma } from './db.server'

export const authSessionStorage = createCookieSessionStorage({
	cookie: {
		name: 'ds_session',
		sameSite: 'lax',
		path: '/',
		httpOnly: true,
		secrets: process.env.SESSION_SECRET ? process.env.SESSION_SECRET.split(',') : ['default-secret'],
		secure: process.env.NODE_ENV === 'production',
		maxAge: 60 * 60 * 24 * 30, // 30 days
	},
})

// we have to do this because every time you commit the session you overwrite it
// so we store the expiration time in the cookie and reset it every time we commit
const originalCommitSession = authSessionStorage.commitSession

Object.defineProperty(authSessionStorage, 'commitSession', {
	value: async function commitSession(
		...args: Parameters<typeof originalCommitSession>
	) {
		const [session, options] = args
		if (options?.expires) {
			session.set('expires', options.expires)
		}
		if (options?.maxAge) {
			session.set('expires', new Date(Date.now() + options.maxAge * 1000))
		}
		const expires = session.has('expires')
			? new Date(session.get('expires'))
			: undefined
		const setCookieHeader = await originalCommitSession(session, {
			...options,
			expires,
		})
		return setCookieHeader
	},
})

export async function getUser(request: Request) {
  const session = await authSessionStorage.getSession(request.headers.get('Cookie'))
  const userId = session.get('userId')
  if (!userId) return null
  
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      username: true,
      name: true,
      imageId: true,
    },
  })
  return user
}
