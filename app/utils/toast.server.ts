import { createCookieSessionStorage, redirect } from '@remix-run/node'
import { combineHeaders } from './misc.tsx'
import { createId as cuid } from '@paralleldrive/cuid2'
import { type Toast, type ToastInput, ToastSchema } from '#app/types/toast'

export { Toast, ToastInput, ToastSchema }

// Validate environment variables
if (!process.env.SESSION_SECRET) {
  throw new Error('SESSION_SECRET environment variable is required');
}

export const toastKey = 'toast'

const isSecureEnvironment = process.env.NODE_ENV === 'production' || process.env.ENABLE_HTTPS === 'true'

export const toastSessionStorage = createCookieSessionStorage({
  cookie: {
    name: 'en_toast',
    sameSite: 'lax',
    path: '/',
    httpOnly: true,
    secrets: process.env.SESSION_SECRET.split(','),
    secure: isSecureEnvironment,
    maxAge: 60 * 60 * 24, // 24 hours
  },
})

export async function redirectWithToast(
  url: string,
  toast: ToastInput,
  init?: ResponseInit,
) {
  try {
    return redirect(url, {
      ...init,
      headers: combineHeaders(init?.headers, await createToastHeaders(toast)),
    })
  } catch (error) {
    console.error('Error in redirectWithToast:', error);
    // Fallback redirect without toast
    return redirect(url, init);
  }
}

export async function createToastHeaders(toastInput: ToastInput) {
  try {
    const session = await toastSessionStorage.getSession()
    const toast = ToastSchema.parse({
      ...toastInput,
      id: toastInput.id ?? cuid()
    })
    session.flash(toastKey, toast)
    const cookie = await toastSessionStorage.commitSession(session)
    return new Headers({ 'set-cookie': cookie })
  } catch (error) {
    console.error('Error in createToastHeaders:', error);
    return new Headers();
  }
}

export async function getToast(request: Request) {
  try {
    const session = await toastSessionStorage.getSession(
      request.headers.get('cookie'),
    )
    const result = ToastSchema.safeParse(session.get(toastKey))
    const toast = result.success ? result.data : null
    
    if (!toast) {
      return { toast: null, headers: null };
    }

    try {
      const headers = new Headers({
        'set-cookie': await toastSessionStorage.destroySession(session),
      });
      return { toast, headers };
    } catch (error) {
      console.error('Error destroying toast session:', error);
      return { toast, headers: null };
    }
  } catch (error) {
    console.error('Error in getToast:', error);
    return { toast: null, headers: null };
  }
}
