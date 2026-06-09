'use server';

import { prisma } from '@/shared/api/prisma';
import { getAuthSession } from '@/features/auth/auth.api';
import { removeUserPrefix } from '@/shared/api/supabase/storage.actions';
import type { DesignCategory } from '@/entities/design/design.type';

// DB 업데이트용 디자인 타입
type UpdateDesignItem = {
  designId: string;
  title: string;
  description: string;
  category: DesignCategory;
  thumbnailPath: string;
  imagePaths: string[];
  instructionPaths: string[];
  instructionNames: string[];
};

// 디자인 수정 서버 액션 — 파일 업로드는 클라이언트에서 처리 후 path만 전달받음
export async function updateDesign(input: UpdateDesignItem): Promise<{ designId: string }> {
  // 로그인 확인
  const user = await getAuthSession();
  if (!user) throw new Error('로그인이 필요합니다.');

  // 소유권 확인
  const existing = await prisma.design.findUnique({ where: { id: input.designId } });
  if (!existing || existing.authorId !== user.id) throw new Error('수정 권한이 없습니다.');

  // 디자인 수정 -> DB 업데이트
  await prisma.design.update({
    where: { id: input.designId },
    data: {
      title: input.title,
      description: input.description,
      category: input.category,
      thumbnail: input.thumbnailPath,
      images: input.imagePaths,
      instructions: input.instructionPaths,
      instructionNames: input.instructionNames
    }
  });

  return { designId: input.designId };
}

// 디자인 삭제 서버 액션 — DB 먼저 삭제 후 스토리지 폴더 전체 정리
export async function deleteDesign(designId: string): Promise<void> {
  // 로그인 확인
  const user = await getAuthSession();
  if (!user) throw new Error('로그인이 필요합니다.');

  // 소유권 확인
  const existing = await prisma.design.findUnique({ where: { id: designId } });
  if (!existing || existing.authorId !== user.id) throw new Error('삭제 권한이 없습니다.');

  // 1. DB 삭제
  await prisma.design.delete({ where: { id: designId } });

  // 2. 스토리지 폴더 전체 삭제 (두 버킷 모두)
  await removeUserPrefix(`${user.id}/${designId}`);
}
