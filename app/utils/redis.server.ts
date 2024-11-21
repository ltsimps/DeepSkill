import { Redis } from '@upstash/redis'

declare global {
  var __redis: Redis | undefined
}

let redis: Redis

if (process.env.NODE_ENV === 'production') {
  redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
  })
} else {
  if (!global.__redis) {
    global.__redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    })
  }
  redis = global.__redis
}

export { redis }
