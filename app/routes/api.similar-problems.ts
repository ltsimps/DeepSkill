import { json, type LoaderArgs } from '@remix-run/node';
import { getUser } from '~/utils/session.server';
import { prisma } from '~/utils/db.server';
import { generateProblemEmbedding } from '~/utils/openai.server';

export async function loader({ request }: LoaderArgs) {
  const user = await getUser(request);
  if (!user) {
    throw new Response('Unauthorized', { status: 401 });
  }

  const url = new URL(request.url);
  const problemId = url.searchParams.get('problemId');
  
  if (!problemId) {
    throw new Response('Problem ID is required', { status: 400 });
  }

  const problem = await prisma.problem.findUnique({
    where: { id: problemId }
  });

  if (!problem) {
    throw new Response('Problem not found', { status: 404 });
  }

  const embedding = await generateProblemEmbedding(problem);
  const similarProblems = await prisma.$queryRaw`
    SELECT id, title, difficulty, embedding <-> ${embedding}::vector AS distance
    FROM "Problem"
    WHERE id != ${problemId}
    ORDER BY distance
    LIMIT 3
  `;

  return json({ similarProblems });
}
