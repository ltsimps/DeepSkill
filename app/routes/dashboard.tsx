import { json, type LoaderFunctionArgs, ActionFunctionArgs, redirect } from '@remix-run/node';
import { Form, Link, useLoaderData, useNavigate } from '@remix-run/react';
import { useState, useEffect } from 'react';
import { requireUserId } from '../utils/auth.server';
import { prisma } from '../utils/db.server';
import { Button } from '../components/ui/button';
import { useUser } from '../utils/user';
import { ChatBot } from '../components/dashboard/ChatBot';
import { SidePanel } from '../components/dashboard/SidePanel';
import type { ProgrammingLanguage } from '../utils/language';
import { updateUserPreferredLanguage } from '../utils/language.server';
import { ClientOnly } from '../components/common/ClientOnly';

export async function loader({ request }: LoaderFunctionArgs) {
  const userId = await requireUserId(request);
  
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      preferredLanguage: true,
    },
  });

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

  return json({ stats, preferredLanguage: user?.preferredLanguage || 'python' });
}

export async function action({ request }: ActionFunctionArgs) {
  const userId = await requireUserId(request);
  const formData = await request.formData();
  const intent = formData.get('intent');
  const language = formData.get('language');

  if (intent === 'updateLanguage' && typeof language === 'string') {
    await updateUserPreferredLanguage(userId, language as ProgrammingLanguage);
    return json({ success: true });
  }

  return redirect('/dashboard');
}

export default function Dashboard() {
  const { stats, preferredLanguage } = useLoaderData<typeof loader>();
  const user = useUser();
  const navigate = useNavigate();

  const handleStartPractice = () => {
    navigate('/practice?language=python');
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-b from-gray-900 to-gray-800">
      <div className="flex-1">
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

        <main className="max-w-6xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 gap-8">
            {/* Epic Call to Action */}
            <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-purple-600 to-violet-600 rounded-2xl p-8 border border-purple-500/20 shadow-2xl">
              <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,transparent,black)]" />
              <div className="relative z-10">
                <h2 className="text-4xl font-bold text-white mb-4 animate-fade-in">Ready to Level Up?</h2>
                <p className="text-xl text-white/80 mb-8">Your next coding challenge awaits. Dive in and start mastering Python!</p>
                <button
                  onClick={handleStartPractice}
                  className="w-full bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white text-xl font-bold py-6 px-8 rounded-xl transition-all duration-300 ease-in-out transform hover:scale-105 hover:shadow-lg border border-white/20 group"
                >
                  <span className="flex items-center justify-center gap-3">
                    Start Practicing
                    <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">→</span>
                  </span>
                </button>
              </div>
              
              {/* Animated Background Elements */}
              <div className="absolute top-0 left-0 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob" />
              <div className="absolute top-0 right-0 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000" />
              <div className="absolute bottom-0 left-1/2 w-72 h-72 bg-violet-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000" />
            </div>

            {/* Stats Grid - Now below the CTA */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-gray-700">
                <h3 className="text-gray-400 mb-2">Problems Solved</h3>
                <p className="text-3xl font-bold text-white">{stats.problemsSolved}</p>
              </div>
              
              <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-gray-700">
                <h3 className="text-gray-400 mb-2">Current Streak</h3>
                <p className="text-3xl font-bold text-white">{stats.streaks} days</p>
              </div>
              
              <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-gray-700">
                <h3 className="text-gray-400 mb-2">Total Attempts</h3>
                <p className="text-3xl font-bold text-white">{stats.totalAttempts}</p>
              </div>
              
              <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-gray-700">
                <h3 className="text-gray-400 mb-2">Avg. Time per Problem</h3>
                <p className="text-3xl font-bold text-white">{Math.round(stats.averageTime)}s</p>
              </div>
            </div>
          </div>

          {/* Chat Bot Section */}
          <div className="lg:col-span-1">
            <ClientOnly fallback={<div className="h-[500px] bg-gray-800/50 rounded-lg border border-gray-700" />}>
              <ChatBot />
            </ClientOnly>
          </div>
        </main>
      </div>
    </div>
  );
}
