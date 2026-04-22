// src/lib/redis.js
import IORedis from 'ioredis';

const redisUrl = process.env.REDIS_URL;

let redis;

if (redisUrl) {
  redis = new IORedis(redisUrl, { maxRetriesPerRequest: null });
} else {
  redis = new IORedis({
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    maxRetriesPerRequest: null,
  });
}

redis.on('error', (err) => {
  console.error('[Redis] Connection error:', err.message);
});

redis.on('connect', () => {
  console.log('[Redis] Connected');
});

export default redis;
