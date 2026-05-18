import { cache } from 'react';
import { prisma } from '@/shared/api/prisma';

// 유저 프로필 + 디자인/구매 수 조회
export const getUserProfile = cache(async (userId: string) => {
  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      _count: { select: { designs: true, purchases: true } }
    }
  });
});

// TODO: DB 연결 후 실제 구매 데이터로 교체
const MOCK_PURCHASES = [
  {
    id: 'mock-purchase-1',
    purchasedAt: new Date('2024-03-18'),
    design: {
      id: '1',
      title: '중세 성채 - 블랙 팔콘 요새',
      thumbnail: 'https://picsum.photos/seed/lego-castle/600/800',
      price: 9900,
      author: { name: 'BrickMaster' }
    }
  },
  {
    id: 'mock-purchase-2',
    purchasedAt: new Date('2024-03-10'),
    design: {
      id: '4',
      title: 'UCS급 X-윙 스타파이터',
      thumbnail: 'https://picsum.photos/seed/lego-space/600/600',
      price: 14900,
      author: { name: 'StarDesigner' }
    }
  },
  {
    id: 'mock-purchase-3',
    purchasedAt: new Date('2024-02-28'),
    design: {
      id: '3',
      title: '모듈러 서점 & 카페',
      thumbnail: 'https://picsum.photos/seed/lego-modular/600/900',
      price: 7900,
      author: { name: 'CityBuilder' }
    }
  }
];

// 유저의 구매 내역 조회 (본인만 접근 가능, 호출부에서 인가 처리)
export const getUserPurchaseList = cache(async (_userId: string) => {
  // TODO: DB 연결 후 prisma.purchase.findMany로 교체
  // const purchases = await prisma.purchase.findMany({
  //   where: { userId: _userId },
  //   include: { design: { include: { author: { select: { name: true } } } } },
  //   orderBy: { purchasedAt: 'desc' }
  // });
  // const supabase = await createClient();
  // return purchases.map(p => ({ ... }));
  return MOCK_PURCHASES;
});
