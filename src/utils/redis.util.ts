import { AuthUrls } from '@/auth/utils/auth.enum';

export const getInsightRedisKey = (userId: string, ...args: string[]) => {
  const baseKey = `insight:${userId}`;

  const finalKey = args.reduce((keyVal, arg) => {
    return keyVal + `:${arg}`;
  }, baseKey);

  return {
    baseKey,
    finalKey,
  };
};

export const refreshRedisKey = (userId: string) => {
  return `${AuthUrls.REFRESHTOKEN}:${userId}`;
};

export const loginAttemptsRedisKey = (userId: string) => {
  return `login:attempts:${userId}`;
};

export const loginLockoutRedisKey = (userId: string) => {
  return `login:lockout:${userId}`;
};
