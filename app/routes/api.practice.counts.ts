import { json, type LoaderArgs } from '@remix-run/node';
import { requireUserId } from '~/utils/auth.server';
import { practiceScheduler } from '~/services/practice.server';

export async function loader({ request }: LoaderArgs) {
  const userId = await requireUserId(request);
  
  // Get the preferred language from the URL
  const url = new URL(request.url);
  const language = url.searchParams.get('language');
  
  const counts = await practiceScheduler.getAvailableProblemsCount(userId, language);
  
  return json(counts);
}
