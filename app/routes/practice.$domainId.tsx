import { json } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react';
import { useCallback, useState } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { python } from '@codemirror/lang-python';
import { Card } from '~/components/ui/card';
import { Button } from '~/components/ui/button';
import { requireUserId } from '~/session.server';
import { practiceScheduler } from '~/services/practice.server';
import { toast } from 'react-hot-toast';
import ReactPlayer from 'react-player';

export const loader = async ({ request, params }) => {
  const userId = await requireUserId(request);
  const { domainId } = params;

  const nextProblem = await practiceScheduler.getNextProblem({
    userId,
    domainId,
    preferredLanguages: ['javascript', 'python']
  });

  if (nextProblem.type === 'DAILY_LIMIT_REACHED') {
    return json({ type: 'DAILY_LIMIT_REACHED' });
  }

  return json({ problem: nextProblem });
};

export default function PracticeRoute() {
  const { problem } = useLoaderData<typeof loader>();
  const [code, setCode] = useState('');
  const [showHint, setShowHint] = useState(false);
  const [showVideo, setShowVideo] = useState(false);

  const handleCodeChange = useCallback((value: string) => {
    setCode(value);
  }, []);

  const handleSubmit = async () => {
    try {
      const response = await fetch('/api/evaluate-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, problemId: problem.id })
      });
      
      const result = await response.json();
      
      if (result.success) {
        toast.success('Great job! Moving to next problem...');
        // Redirect to next problem
      } else {
        toast.error(result.message || 'Something went wrong. Try again!');
      }
    } catch (error) {
      toast.error('Failed to evaluate code. Please try again.');
    }
  };

  const languageExtension = problem.content.language === 'python' ? python() : javascript();

  if (problem.type === 'DAILY_LIMIT_REACHED') {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Card className="p-6 text-center">
          <h2 className="text-2xl font-bold mb-4">Daily Limit Reached</h2>
          <p className="text-gray-600 mb-4">
            You've reached your daily practice limit. Come back tomorrow for more problems!
          </p>
          <div className="flex justify-center space-x-4">
            <Button variant="outline" onClick={() => window.location.href = '/dashboard'}>
              Return to Dashboard
            </Button>
            <Button variant="outline" onClick={() => window.location.href = '/learning-path'}>
              View Learning Path
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Problem Description */}
        <Card className="p-6">
          <h2 className="text-2xl font-bold mb-4">{problem.title}</h2>
          <div className="prose dark:prose-invert">
            <div dangerouslySetInnerHTML={{ __html: problem.content.description }} />
          </div>
          
          <div className="mt-6 space-y-4">
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => setShowHint(!showHint)}
            >
              {showHint ? 'Hide Hint' : 'Show Hint'}
            </Button>
            
            {showHint && (
              <div className="p-4 bg-muted rounded-lg">
                {problem.content.hint}
              </div>
            )}
            
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setShowVideo(!showVideo)}
            >
              {showVideo ? 'Hide Video Help' : 'Show Video Help'}
            </Button>
            
            {showVideo && problem.content.videoUrl && (
              <div className="aspect-video">
                <ReactPlayer
                  url={problem.content.videoUrl}
                  width="100%"
                  height="100%"
                  controls
                />
              </div>
            )}
          </div>
        </Card>

        {/* Code Editor */}
        <Card className="p-6">
          <div className="mb-4">
            <h3 className="text-lg font-semibold mb-2">Your Solution</h3>
            <div className="text-sm text-gray-500 mb-4">
              Language: {problem.content.language}
            </div>
          </div>
          
          <CodeMirror
            value={code}
            height="400px"
            theme="dark"
            extensions={[languageExtension]}
            onChange={handleCodeChange}
            className="border rounded-lg overflow-hidden"
          />
          
          <div className="mt-4 flex justify-end space-x-4">
            <Button variant="outline" onClick={() => setCode('')}>
              Reset
            </Button>
            <Button onClick={handleSubmit}>
              Submit Solution
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
