import { json, type LoaderFunctionArgs } from '@remix-run/node';
import { Form, Link, useLoaderData, useNavigate } from '@remix-run/react';
import { useState } from 'react';
import { requireUserId } from '../utils/auth.server';
import { prisma } from '../utils/db.server';
import { Button } from '../components/ui/button';
import { useUser } from '../utils/user';
import { ChatBot } from '../components/dashboard/ChatBot';

export async function loader({ request }: LoaderFunctionArgs) {
  const userId = await requireUserId(request);
  
  const metrics = await prisma.problemProgression.findMany({
    where: { userId },
    include: { problem: true },
    orderBy: { lastAttempt: 'desc' },
    take: 10
  });

  const stats = {
    totalAttempts: metrics.reduce((acc, m) => acc + m.attempts, 0),
    problemsSolved: metrics.filter(m => m.solved).length,
    averageTime: metrics.reduce((acc, m) => acc + m.timeSpent, 0) / metrics.length || 0,
    streaks: Math.max(...metrics.map(m => m.consecutiveCorrect), 0),
    recentLanguages: [...new Set(metrics.map(m => m.problem.language))].slice(0, 3)
  };

  return json({ stats });
}

export default function Dashboard() {
  const { stats } = useLoaderData<typeof loader>();
  const user = useUser();
  const navigate = useNavigate();
  const [selectedLanguage, setSelectedLanguage] = useState<string>('javascript');

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800">
      {/* Navigation Bar */}
      <nav className="bg-gray-800 border-b border-gray-700 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-8">
            <Link to="/" className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
              DeepSkill
            </Link>
            <div className="hidden md:flex space-x-6">
              <Link to="/dashboard" className="text-white hover:text-blue-400 transition">Dashboard</Link>
              <Link to="/practice" className="text-white hover:text-blue-400 transition">Practice</Link>
              <Link to={`/users/${user.username}`} className="text-white hover:text-blue-400 transition">Profile</Link>
            </div>
          </div>
          <Form action="/logout" method="post">
            <Button 
              type="submit"
              variant="ghost"
              className="text-white hover:text-red-400 transition"
            >
              Sign Out
            </Button>
          </Form>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Stats Section */}
          <div className="lg:col-span-2 space-y-6">
            <h2 className="text-2xl font-bold text-white mb-6">Your Progress</h2>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
                <h3 className="text-gray-400 mb-2">Problems Solved</h3>
                <p className="text-3xl font-bold text-white">{stats.problemsSolved}</p>
              </div>
              
              <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
                <h3 className="text-gray-400 mb-2">Current Streak</h3>
                <p className="text-3xl font-bold text-white">{stats.streaks} days</p>
              </div>
              
              <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
                <h3 className="text-gray-400 mb-2">Total Attempts</h3>
                <p className="text-3xl font-bold text-white">{stats.totalAttempts}</p>
              </div>
              
              <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
                <h3 className="text-gray-400 mb-2">Avg. Time per Problem</h3>
                <p className="text-3xl font-bold text-white">{Math.round(stats.averageTime)}s</p>
              </div>
            </div>

            <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
              <h3 className="text-xl font-semibold text-white mb-4">Quick Start</h3>
              <div className="flex flex-wrap gap-4">
                {['javascript', 'python', 'typescript'].map(lang => (
                  <Button
                    key={lang}
                    onClick={() => {
                      setSelectedLanguage(lang);
                      navigate(`/practice?language=${lang}`);
                    }}
                    className={`px-6 py-2 rounded-full capitalize ${
                      selectedLanguage === lang
                        ? 'bg-blue-500 hover:bg-blue-600'
                        : 'bg-gray-700 hover:bg-gray-600'
                    }`}
                  >
                    {lang}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          {/* Chat Bot Section */}
          <div className="lg:col-span-1">
            <ChatBot onLanguageSelect={setSelectedLanguage} />
          </div>
        </div>
      </main>
    </div>
  );
}
