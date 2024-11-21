import { prisma } from './db.server'

// Achievement types
export const ACHIEVEMENT_TYPES = {
  STREAK: 'STREAK',
  LEVEL: 'LEVEL',
  PROBLEM_COUNT: 'PROBLEM_COUNT',
  LANGUAGE_MASTERY: 'LANGUAGE_MASTERY',
  SPEED_DEMON: 'SPEED_DEMON'
} as const

// Initial achievements
export const ACHIEVEMENTS = [
  // Streak achievements
  {
    name: 'Getting Started',
    description: 'Practice for 3 days in a row',
    icon: '🌱',
    type: ACHIEVEMENT_TYPES.STREAK,
    threshold: 3,
    xpReward: 100
  },
  {
    name: 'Dedicated Learner',
    description: 'Practice for 7 days in a row',
    icon: '🔥',
    type: ACHIEVEMENT_TYPES.STREAK,
    threshold: 7,
    xpReward: 300
  },
  {
    name: 'Code Warrior',
    description: 'Practice for 30 days in a row',
    icon: '⚔️',
    type: ACHIEVEMENT_TYPES.STREAK,
    threshold: 30,
    xpReward: 1000
  },
  // Level achievements
  {
    name: 'Level 5 Achieved',
    description: 'Reach level 5',
    icon: '🎯',
    type: ACHIEVEMENT_TYPES.LEVEL,
    threshold: 5,
    xpReward: 500
  },
  {
    name: 'Level 10 Master',
    description: 'Reach level 10',
    icon: '🏆',
    type: ACHIEVEMENT_TYPES.LEVEL,
    threshold: 10,
    xpReward: 1000
  },
  // Problem count achievements
  {
    name: 'Problem Solver',
    description: 'Solve 10 problems',
    icon: '🧩',
    type: ACHIEVEMENT_TYPES.PROBLEM_COUNT,
    threshold: 10,
    xpReward: 200
  },
  {
    name: 'Code Expert',
    description: 'Solve 50 problems',
    icon: '👨‍💻',
    type: ACHIEVEMENT_TYPES.PROBLEM_COUNT,
    threshold: 50,
    xpReward: 500
  },
  {
    name: 'Algorithm Master',
    description: 'Solve 100 problems',
    icon: '🎓',
    type: ACHIEVEMENT_TYPES.PROBLEM_COUNT,
    threshold: 100,
    xpReward: 1000
  }
]

// Function to initialize achievements in the database
export async function initializeAchievements() {
  for (const achievement of ACHIEVEMENTS) {
    await prisma.achievement.upsert({
      where: {
        name: achievement.name
      },
      update: achievement,
      create: achievement
    })
  }
}

// Function to check and award achievements
export async function checkAndAwardAchievements(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      achievements: {
        include: { achievement: true }
      }
    }
  })

  if (!user) return []

  const unlockedAchievements = []

  // Get all achievements
  const achievements = await prisma.achievement.findMany()

  for (const achievement of achievements) {
    // Skip if already unlocked
    if (user.achievements.some(ua => ua.achievementId === achievement.id)) {
      continue
    }

    // Check if achievement should be unlocked
    let shouldUnlock = false
    switch (achievement.type) {
      case ACHIEVEMENT_TYPES.STREAK:
        shouldUnlock = user.streak >= achievement.threshold
        break
      case ACHIEVEMENT_TYPES.LEVEL:
        shouldUnlock = user.level >= achievement.threshold
        break
      case ACHIEVEMENT_TYPES.PROBLEM_COUNT:
        const problemCount = await prisma.problemProgression.count({
          where: {
            userId: user.id,
            solved: true
          }
        })
        shouldUnlock = problemCount >= achievement.threshold
        break
    }

    if (shouldUnlock) {
      // Award the achievement
      await prisma.userAchievement.create({
        data: {
          userId: user.id,
          achievementId: achievement.id
        }
      })

      // Award XP bonus
      await prisma.user.update({
        where: { id: user.id },
        data: {
          xp: { increment: achievement.xpReward }
        }
      })

      unlockedAchievements.push(achievement)
    }
  }

  return unlockedAchievements
}

// Function to get user's achievement progress
export async function getAchievementProgress(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      achievements: {
        include: { achievement: true }
      }
    }
  })

  if (!user) return null

  const problemCount = await prisma.problemProgression.count({
    where: {
      userId: user.id,
      solved: true
    }
  })

  const achievements = await prisma.achievement.findMany()
  
  return achievements.map(achievement => {
    const unlocked = user.achievements.some(ua => ua.achievementId === achievement.id)
    let progress = 0

    switch (achievement.type) {
      case ACHIEVEMENT_TYPES.STREAK:
        progress = (user.streak / achievement.threshold) * 100
        break
      case ACHIEVEMENT_TYPES.LEVEL:
        progress = (user.level / achievement.threshold) * 100
        break
      case ACHIEVEMENT_TYPES.PROBLEM_COUNT:
        progress = (problemCount / achievement.threshold) * 100
        break
    }

    return {
      ...achievement,
      unlocked,
      progress: Math.min(progress, 100)
    }
  })
}
