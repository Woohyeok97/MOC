import type { Design } from '@/entities/design/design.type';
// import { prisma } from '@/shared/api/prisma';
import { MOCK_DESIGNS } from './design.mock';

// TODO: DB 연결 후 prisma.design.findMany로 교체
export async function getDesigns(): Promise<Design[]> {
  // return await prisma.design.findMany({
  //   orderBy: { createdAt: 'desc' }
  // });
  return MOCK_DESIGNS.slice(0, 6);
}
