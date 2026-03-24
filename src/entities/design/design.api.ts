import type { Design } from '@/entities/design/design.type';
import { prisma } from '@/shared/api/prisma';

export async function getDesigns(): Promise<Design[]> {
  return prisma.design.findMany({
    orderBy: { createdAt: 'desc' }
  });
}
