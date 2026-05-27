const Redis = require('ioredis');
require('dotenv').config();

const redisUrl = process.env.REDIS_URL;

if (!redisUrl) {
  console.warn('REDIS_URL is not defined in environment variables. Local Redis or fallback might be needed.');
}

const redis = new Redis(redisUrl, {
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  maxRetriesPerRequest: null,
});

redis.on('connect', () => {
  console.log('🚀 Redis Connected');
});

redis.on('error', (err) => {
  console.error('❌ Redis Error:', err);
});

redis.on('reconnecting', () => {
  console.log('🔄 Redis Reconnecting');
});

module.exports = redis;
