// 유저 엔티티 데이터 페칭

import { cache } from 'react';
import { prisma } from '@/shared/api/prisma';
import type { UserProfileType, PurchaseItemType } from '@/entities/user/user.type';

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

// TODO: DB 연결 후 prisma.purchase.findMany로 교체
export const getUserPurchaseList = cache(async (_userId: string): Promise<PurchaseItemType[]> => {
  return [
    {
      id: 'p1',
      amount: 38000,
      purchasedAt: new Date('2025-12-15'),
      design: {
        id: '2',
        title: '사이버펑크 레이서 V2',
        thumbnail: 'https://picsum.photos/seed/lego-mech/600/400',
        author: { name: 'NeoBricks', avatarUrl: null }
      }
    },
    {
      id: 'p2',
      amount: 72000,
      purchasedAt: new Date('2025-11-28'),
      design: {
        id: '4',
        title: 'UCS급 X-윙 스타파이터',
        thumbnail: 'https://picsum.photos/seed/lego-space/600/600',
        author: { name: 'StarDesigner', avatarUrl: null }
      }
    },
    {
      id: 'p3',
      amount: 25000,
      purchasedAt: new Date('2025-11-10'),
      design: {
        id: '6',
        title: '심해 탐사 잠수함',
        thumbnail: 'https://picsum.photos/seed/lego-sub/600/500',
        author: { name: 'OceanBrick', avatarUrl: null }
      }
    },
    {
      id: 'p4',
      amount: 55000,
      purchasedAt: new Date('2025-10-22'),
      design: {
        id: '1',
        title: '중세 성채 - 블랙 팔콘 요새',
        thumbnail: 'https://picsum.photos/seed/lego-castle/600/800',
        author: { name: 'BrickMaster', avatarUrl: null }
      }
    }
  ];
});
