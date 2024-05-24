export default () => ({
  env: process.env.NODE_ENV ?? 'development',
  port: process.env.PORT ?? 3000,
  databaseUrl: process.env.DATABASE_URL,
  authSecret: process.env.AUTH_SECRET,
  redisHost: process.env.REDIS_HOST ?? 'localhost',
  redisPort: process.env.REDIS_PORT ?? 6379,
});
