import { redirect, type ActionArgs } from '@remix-run/node'
import { logout } from '~/utils/auth.server'

export async function loader() {
	return redirect('/login')
}

export async function action({ request }: ActionArgs) {
	return logout(request, '/login')
}
