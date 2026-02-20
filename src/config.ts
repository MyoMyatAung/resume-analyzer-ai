import dotenv from 'dotenv';
dotenv.config();

export const config = {
  redis: {
    url: process.env.REDIS_PUBLIC_URL || process.env.REDIS_URL,
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD,
    username: process.env.REDIS_USERNAME,
    tls: process.env.REDIS_TLS === 'true',
  },
  google: {
    apiKey: process.env.GOOGLE_API_KEY || '',
  },
  groq: {
    apiKey: process.env.GROQ_API_KEY || '',
  },
  webhook: {
    baseUrl: process.env.WEBHOOK_BASE_URL || 'http://localhost:3000',
  },
  queue: {
    name: process.env.QUEUE_NAME || 'resume-analysis',
  },
};

/**
 * Returns connection configuration for BullMQ
 */
export const getRedisConnection = () => {
  if (config.redis.url) {
    return {
      url: config.redis.url,
      maxRetriesPerRequest: null,
    };
  }
  return {
    host: config.redis.host,
    port: config.redis.port,
    password: config.redis.password,
    username: config.redis.username,
    tls: config.redis.tls ? {} : undefined,
    maxRetriesPerRequest: null,
  };
};
