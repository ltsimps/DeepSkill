import { json } from '@remix-run/node';
import type { LoaderArgs } from '@remix-run/node';
import { problemGenerationQueue } from '~/services/practice-queue.server';

export async function loader({ params }: LoaderArgs) {
  const jobId = params.jobId;
  if (!jobId) {
    throw new Response('Job ID is required', { status: 400 });
  }

  const status = problemGenerationQueue.getJobStatus(jobId);
  if (!status) {
    throw new Response('Job not found', { status: 404 });
  }

  return json({
    status: status.status,
    progress: status.progress,
    error: status.error
  });
}
