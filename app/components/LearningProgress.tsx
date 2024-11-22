import React from 'react';
import { Line, Radar, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  RadialLinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  RadialLinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface LearningMetrics {
  skillLevel: number;
  conceptMastery: Record<string, number>;
  recentPerformance: number[];
  explorationRate: number;
  timeSpent: number;
  problemsSolved: number;
  streakDays: number;
}

interface Props {
  metrics: LearningMetrics;
  domain: string;
}

export function LearningProgress({ metrics, domain }: Props) {
  // Prepare data for skill progression line chart
  const skillProgressData = {
    labels: Array.from({ length: metrics.recentPerformance.length }, (_, i) => `Day ${i + 1}`),
    datasets: [
      {
        label: 'Skill Level',
        data: metrics.recentPerformance,
        borderColor: 'rgb(75, 192, 192)',
        tension: 0.4,
        fill: true,
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
      },
    ],
  };

  // Prepare data for concept mastery radar chart
  const conceptMasteryData = {
    labels: Object.keys(metrics.conceptMastery),
    datasets: [
      {
        label: 'Concept Mastery',
        data: Object.values(metrics.conceptMastery),
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
        borderColor: 'rgb(255, 99, 132)',
        pointBackgroundColor: 'rgb(255, 99, 132)',
      },
    ],
  };

  // Prepare data for learning stats bar chart
  const learningStatsData = {
    labels: ['Problems Solved', 'Streak Days', 'Hours Spent'],
    datasets: [
      {
        label: 'Learning Stats',
        data: [
          metrics.problemsSolved,
          metrics.streakDays,
          Math.round(metrics.timeSpent / 60), // Convert to hours
        ],
        backgroundColor: [
          'rgba(54, 162, 235, 0.5)',
          'rgba(255, 206, 86, 0.5)',
          'rgba(75, 192, 192, 0.5)',
        ],
      },
    ],
  };

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Skill Progression */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-4">Skill Progression</h3>
          <Line
            data={skillProgressData}
            options={{
              responsive: true,
              scales: {
                y: {
                  beginAtZero: true,
                  max: 1,
                },
              },
              plugins: {
                title: {
                  display: true,
                  text: `${domain} Progress`,
                },
              },
            }}
          />
        </div>

        {/* Concept Mastery */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-4">Concept Mastery</h3>
          <Radar
            data={conceptMasteryData}
            options={{
              responsive: true,
              scales: {
                r: {
                  beginAtZero: true,
                  max: 1,
                },
              },
            }}
          />
        </div>

        {/* Learning Stats */}
        <div className="bg-white p-6 rounded-lg shadow-md md:col-span-2">
          <h3 className="text-lg font-semibold mb-4">Learning Statistics</h3>
          <Bar
            data={learningStatsData}
            options={{
              responsive: true,
              plugins: {
                legend: {
                  display: false,
                },
              },
            }}
          />
        </div>
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-md text-center">
          <h4 className="text-sm text-gray-500">Current Level</h4>
          <p className="text-2xl font-bold text-primary">{metrics.skillLevel}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-md text-center">
          <h4 className="text-sm text-gray-500">Problems Solved</h4>
          <p className="text-2xl font-bold text-primary">{metrics.problemsSolved}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-md text-center">
          <h4 className="text-sm text-gray-500">Day Streak</h4>
          <p className="text-2xl font-bold text-primary">{metrics.streakDays}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-md text-center">
          <h4 className="text-sm text-gray-500">Hours Spent</h4>
          <p className="text-2xl font-bold text-primary">
            {Math.round(metrics.timeSpent / 60)}
          </p>
        </div>
      </div>
    </div>
  );
}
