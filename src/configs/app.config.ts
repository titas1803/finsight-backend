export default () => ({
  jwtAccessSecret: process.env.JWT_ACCESS_SECRET ?? '',
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET,
  openApiKey: process.env.OPENAI_API_KEY,
  redisurl: process.env.REDIS_HOST,
});
