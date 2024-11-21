import { PrismaClient } from '@prisma/client'
import { initializeAchievements } from '../achievements.server'

const prisma = new PrismaClient()

async function seed() {
  console.log('🌱 Seeding achievements...')
  await initializeAchievements()
  console.log('✅ Achievements seeded successfully!')
}

seed()
  .catch((e) => {
    console.error('Error seeding achievements:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
