'use server';

import { prisma } from '@/shared/api/prisma';
import { getAuthSession } from '@/features/auth/auth.api';
import type { DesignCategory } from '@/entities/design/design.type';

// DB 업로드용 디자인 타입
type CreateDesignItem = {
  id: string;
  title: string;
  description: string;
  category: DesignCategory;
  thumbnailPath: string;
  imagePaths: string[];
  instructionPaths: string[];
  instructionNames: string[];
};

// 디자인 등록 서버 액션 — 파일 업로드는 클라이언트에서 처리 후 path만 전달받음
export async function createDesign(input: CreateDesignItem): Promise<{ designId: string }> {
  // 로그인 확인
  const user = await getAuthSession();
  if (!user) throw new Error('로그인이 필요합니다.');

  // 디자인 생성 -> DB 업로드
  const design = await prisma.design.create({
    data: {
      id: input.id,
      title: input.title,
      description: input.description,
      category: input.category,
      thumbnail: input.thumbnailPath,
      images: input.imagePaths,
      instructions: input.instructionPaths,
      instructionNames: input.instructionNames,
      authorId: user.id
    }
  });

  return { designId: design.id };
}
