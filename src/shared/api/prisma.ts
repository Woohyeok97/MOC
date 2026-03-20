// Prisma 클라이언트 전역 싱글턴
// Next.js 개발 환경에서 핫 리로드 시마다 새 인스턴스가 생기는 것을 방지
import { PrismaClient } from '@/generated/prisma';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
