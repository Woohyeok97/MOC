// 유저 엔티티 데이터 페칭

import { cache } from 'react';
import { prisma } from '@/shared/api/prisma';
import type { UserProfileType } from '@/entities/user/user.type';

// 유저 프로필 조회 — 현재 로그인 유저 / 다른 유저 공통으로 사용
export const getUserProfile = cache(async (userId: string): Promise<UserProfileType | null> => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      avatarUrl: true
    }
  });
  if (!user) return null;

  return user;
});

