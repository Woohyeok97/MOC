'use server';

// 디자인 등록 서버 액션 — 파일 업로드는 클라이언트에서 처리 후 URL만 전달받음
import { prisma } from '@/shared/api/prisma';
import { getCurrentUser } from '@/features/auth/auth.api';
import type { DesignCategory } from '@/entities/design/design.type';

type CreateDesignItem = {
  title: string;
  description: string;
  category: DesignCategory;
  price: number;
  thumbnailUrl: string;
  imageUrls: string[];
  instructionPaths: string[];
};

export async function createDesign(input: CreateDesignItem): Promise<{ designId: string }> {
  // 로그인 확인
  const user = await getCurrentUser();
  if (!user) throw new Error('로그인이 필요합니다.');

  // 디자인 생성 -> DB 저장
  const design = await prisma.design.create({
    data: {
      title: input.title,
      description: input.description,
      category: input.category,
      price: input.price,
      thumbnail: input.thumbnailUrl,
      images: input.imageUrls,
      instructions: input.instructionPaths,
      authorId: user.id
    }
  });

  return { designId: design.id };
}
