import { Button } from '../../components/ui/button';
import { IntroAnimation } from './IntroAnimation';
import { useState } from 'react';

interface PracticeDashboardProps {
  onStart: () => void;
  onLanguageChange: (language: string) => void;
  selectedLanguage: string;
  stats?: {
    totalAttempts: number;
    problemsSolved: number;
    averageTime: number;
    streaks: number;
  };
}

const languageInfo = {
  javascript: {
    icon: '⚡',
    name: 'JavaScript',
    description: 'Perfect for web development',
    difficulty: 'Beginner Friendly'
  },
  python: {
    icon: '🐍',
    name: 'Python',
    description: 'Great for data science & automation',
    difficulty: 'Beginner Friendly'
  },
  java: {
    icon: '☕',
    name: 'Java',
    description: 'Ideal for enterprise applications',
    difficulty: 'Intermediate'
  }
};

export function PracticeDashboard({ onStart, onLanguageChange, selectedLanguage, stats }: PracticeDashboardProps) {
  const [mode, setMode] = useState<'casual' | 'timed' | 'challenge'>('casual');
  const [difficulty, setDifficulty] = useState<'beginner' | 'intermediate' | 'advanced'>('beginner');

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10 animate-pulse" />
      </div>

      <IntroAnimation />

      <div className="relative z-10 w-full max-w-4xl px-4">
        {/* Welcome Section */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-purple-400 text-transparent bg-clip-text">
            Ready to Code?
          </h1>
          <p className="text-gray-400 mb-4">Challenge yourself and improve your coding skills</p>
          
          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {[
                { label: 'Problems Solved', value: stats.problemsSolved },
                { label: 'Current Streak', value: stats.streaks },
                { label: 'Total Attempts', value: stats.totalAttempts },
                { label: 'Avg. Time', value: `${Math.round(stats.averageTime / 60)}min` }
              ].map((stat, i) => (
                <div key={i} className="bg-gray-800/50 rounded-lg p-4 backdrop-blur-sm border border-gray-700">
                  <div className="text-2xl font-bold text-white">{stat.value}</div>
                  <div className="text-sm text-gray-400">{stat.label}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Settings Section */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Language Selection */}
          <div className="bg-gray-800/50 rounded-lg p-6 backdrop-blur-sm border border-gray-700">
            <h3 className="text-lg font-semibold mb-4 text-white">Choose Language</h3>
            <div className="space-y-3">
              {Object.entries(languageInfo).map(([key, info]) => (
                <button
                  key={key}
                  onClick={() => onLanguageChange(key)}
                  className={`w-full text-left p-3 rounded-lg transition-all ${
                    selectedLanguage === key
                      ? 'bg-blue-500/20 border border-blue-500/40'
                      : 'bg-gray-700/30 border border-gray-700 hover:bg-gray-700/50'
                  }`}
                >
                  <div className="flex items-center">
                    <span className="text-2xl mr-3">{info.icon}</span>
                    <div>
                      <div className="font-medium text-white">{info.name}</div>
                      <div className="text-sm text-gray-400">{info.description}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Practice Settings */}
          <div className="bg-gray-800/50 rounded-lg p-6 backdrop-blur-sm border border-gray-700">
            <h3 className="text-lg font-semibold mb-4 text-white">Practice Settings</h3>
            
            {/* Mode Selection */}
            <div className="mb-4">
              <label className="text-sm text-gray-400 mb-2 block">Mode</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'casual', label: '🎯 Casual' },
                  { id: 'timed', label: '⏱️ Timed' },
                  { id: 'challenge', label: '🏆 Challenge' }
                ].map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setMode(m.id as any)}
                    className={`p-2 rounded-md text-sm ${
                      mode === m.id
                        ? 'bg-blue-500/20 border border-blue-500/40'
                        : 'bg-gray-700/30 border border-gray-700 hover:bg-gray-700/50'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Difficulty Selection */}
            <div>
              <label className="text-sm text-gray-400 mb-2 block">Difficulty</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'beginner', label: '🌱 Beginner' },
                  { id: 'intermediate', label: '🌿 Intermediate' },
                  { id: 'advanced', label: '🌳 Advanced' }
                ].map((d) => (
                  <button
                    key={d.id}
                    onClick={() => setDifficulty(d.id as any)}
                    className={`p-2 rounded-md text-sm ${
                      difficulty === d.id
                        ? 'bg-blue-500/20 border border-blue-500/40'
                        : 'bg-gray-700/30 border border-gray-700 hover:bg-gray-700/50'
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Start Button */}
        <div className="text-center">
          <Button
            onClick={onStart}
            size="lg"
            className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-12 py-6 text-xl font-semibold hover:opacity-90 transition-all hover:scale-105 animate-pulse"
          >
            Begin Practice
          </Button>
          <p className="mt-3 text-sm text-gray-400">
            Estimated completion time: 15-20 minutes
          </p>
        </div>
      </div>
    </div>
  );
}
