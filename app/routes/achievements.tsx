import { json } from '@remix-run/node'
import { useLoaderData } from '@remix-run/react'
import { requireUserId } from '../utils/auth.server'
import { getAchievementProgress } from '../utils/achievements.server'
import { motion } from 'framer-motion'

export async function loader({ request }: { request: Request }) {
  const userId = await requireUserId(request)
  const achievements = await getAchievementProgress(userId)
  return json({ achievements })
}

export default function Achievements() {
  const { achievements } = useLoaderData<typeof loader>()

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-center text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
          Achievements
        </h1>

        <div className="grid gap-6 md:grid-cols-2">
          {achievements.map((achievement, index) => (
            <motion.div
              key={achievement.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`p-6 rounded-lg border ${
                achievement.unlocked
                  ? 'bg-blue-500/20 border-blue-500/50'
                  : 'bg-gray-800/50 border-gray-700'
              }`}
            >
              <div className="flex items-center gap-4 mb-4">
                <span className="text-4xl">{achievement.icon}</span>
                <div>
                  <h3 className={`text-xl font-semibold ${
                    achievement.unlocked ? 'text-blue-300' : 'text-gray-300'
                  }`}>
                    {achievement.name}
                  </h3>
                  <p className="text-gray-400">{achievement.description}</p>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mt-4">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-400">Progress</span>
                  <span className={achievement.unlocked ? 'text-blue-300' : 'text-gray-400'}>
                    {Math.round(achievement.progress)}%
                  </span>
                </div>
                <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${achievement.progress}%` }}
                    transition={{ duration: 1, delay: index * 0.1 }}
                    className={`h-full ${
                      achievement.unlocked
                        ? 'bg-gradient-to-r from-blue-500 to-purple-500'
                        : 'bg-gray-600'
                    }`}
                  />
                </div>
              </div>

              {achievement.unlocked && (
                <div className="mt-4 flex items-center gap-2 text-yellow-400">
                  <span>⚡</span>
                  <span className="text-sm">+{achievement.xpReward} XP Awarded</span>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}
