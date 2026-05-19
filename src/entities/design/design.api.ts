import { cache } from 'react';
import { prisma } from '@/shared/api/prisma';
import { createClient } from '@/shared/api/supabase/server';
import { getPublicImageUrl } from '@/shared/api/supabase/storage';
import type { Design, DesignWithAuthor } from '@/entities/design/design.type';
import { MOCK_DESIGNS } from './design.mock';

// TODO: DB 연결 후 prisma.design.findMany로 교체
export async function getDesigns(): Promise<Design[]> {
  // return await prisma.design.findMany({
  //   orderBy: { createdAt: 'desc' }
  // });
  return MOCK_DESIGNS.slice(0, 6);
}

// TODO: DB 연결 후 prisma.design.findUnique로 교체 (완료)
// export async function getDesignById(id: string): Promise<Design | null> {
//   return MOCK_DESIGNS.find(d => d.id === id) ?? null;
// }

export const getDesignById = cache(async (id: string): Promise<DesignWithAuthor | null> => {
  const design = await prisma.design.findUnique({ where: { id }, include: { author: true } });
  if (!design) return null;

  // thumbnail, images는 스토리지 path로 저장되어 있어 공개 URL로 변환
  const supabase = await createClient();
  return {
    ...design,
    thumbnail: getPublicImageUrl(supabase, design.thumbnail),
    images: design.images.map(path => getPublicImageUrl(supabase, path))
  };
});

// TODO: DB 연결 후 prisma.purchase.findUnique({ where: { userId_designId: { userId, designId } } })로 교체
export async function getIsPurchased(_userId: string, _designId: string): Promise<boolean> {
  return false;
}

export const getUserDesignList = cache(async (userId: string): Promise<Design[]> => {
  return prisma.design.findMany({
    where: { authorId: userId },
    orderBy: { createdAt: 'desc' },
  });
});
