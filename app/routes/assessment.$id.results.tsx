import { json, redirect } from '@remix-run/node';
import { useLoaderData, Link } from '@remix-run/react';
import { requireUserId } from '~/session.server';
import { Button } from '~/components/ui/button';
import { Card } from '~/components/ui/card';
import { CheckCircle, XCircle, Clock, BookOpen } from 'lucide-react';

export const loader = async ({ request, params }) => {
  const userId = await requireUserId(request);
  const { id } = params;

  const assessment = await prisma.assessment.findUnique({
    where: { id },
    include: {
      domain: true,
      learningPath: true
    }
  });

  if (!assessment) {
    throw new Error('Assessment not found');
  }

  if (assessment.userId !== userId) {
    throw new Error('Unauthorized');
  }

  if (assessment.status !== 'COMPLETED') {
    return redirect(`/assessment/${assessment.domainId}`);
  }

  return json({ assessment });
};

export default function AssessmentResultsRoute() {
  const { assessment } = useLoaderData<typeof loader>();
  const analysis = assessment.skillAnalysis as SkillAnalysis;
  const learningPath = assessment.learningPath.concepts;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8">
        Your {assessment.domain.name} Assessment Results
      </h1>

      {/* Skill Analysis */}
      <Card className="p-6 mb-8">
        <h2 className="text-2xl font-semibold mb-4">Skill Analysis</h2>
        
        <div className="grid grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-medium mb-2">Overall Level</h3>
            <div className="text-2xl font-bold text-primary">
              {analysis.overallLevel.charAt(0).toUpperCase() + 
               analysis.overallLevel.slice(1)}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium mb-2">Strengths</h3>
            <ul className="space-y-2">
              {analysis.strengths.map((strength, i) => (
                <li key={i} className="flex items-center gap-2">
                  <CheckCircle className="text-green-500" size={16} />
                  {strength}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-medium mb-2">Areas for Improvement</h3>
            <ul className="space-y-2">
              {analysis.weaknesses.map((weakness, i) => (
                <li key={i} className="flex items-center gap-2">
                  <XCircle className="text-red-500" size={16} />
                  {weakness}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-medium mb-2">Recommendations</h3>
            <ul className="space-y-2">
              {analysis.recommendations.map((rec, i) => (
                <li key={i} className="flex items-center gap-2">
                  <BookOpen className="text-blue-500" size={16} />
                  {rec}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Card>

      {/* Learning Path */}
      <Card className="p-6">
        <h2 className="text-2xl font-semibold mb-4">Your Learning Path</h2>
        
        <div className="space-y-6">
          {learningPath.concepts.map((concept, i) => (
            <div key={i} className="border-l-2 border-primary pl-4">
              <h3 className="text-lg font-medium mb-2">{concept.name}</h3>
              
              <div className="text-sm text-gray-500 flex items-center gap-4">
                <div className="flex items-center gap-1">
                  <Clock size={14} />
                  {concept.estimatedTime} hours
                </div>
                
                {concept.prerequisites.length > 0 && (
                  <div>
                    Prerequisites: {concept.prerequisites.join(', ')}
                  </div>
                )}
              </div>

              {concept.projects && (
                <div className="mt-2">
                  <h4 className="text-sm font-medium">Suggested Projects:</h4>
                  <ul className="list-disc list-inside text-sm text-gray-600">
                    {concept.projects.map((project, j) => (
                      <li key={j}>{project}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-8 flex justify-center">
          <Button asChild size="lg">
            <Link to={`/practice/${assessment.domainId}`}>
              Start Learning
            </Link>
          </Button>
        </div>
      </Card>
    </div>
  );
}
