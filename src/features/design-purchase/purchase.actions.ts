'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/shared/api/prisma';
import { createServiceRoleClient } from '@/shared/api/supabase/server';
import { getSignedInstructionUrls } from '@/shared/api/supabase/storage';
import { getCurrentUser } from '@/features/auth/auth.api';
import { getDesignById, getIsPurchased } from '@/entities/design/design.api';

// TODO: 결제 플로우 완성 후 이 앞에 결제 검증 로직 추가
export async function purchaseDesign(designId: string): Promise<void> {
  const user = await getCurrentUser();
  if (!user) throw new Error('로그인이 필요합니다.');

  await prisma.purchase.create({
    data: { userId: user.id, designId, amount: 0 }
  });

  revalidatePath(`/designs/${designId}`);
}

export async function getInstructionUrls(designId: string): Promise<string[]> {
  // 1. 로그인 + 디자인 조회 병렬 실행 (독립적)
  const [user, design] = await Promise.all([getCurrentUser(), getDesignById(designId)]);
  if (!user) throw new Error('로그인이 필요합니다.');
  if (!design) throw new Error('존재하지 않는 디자인입니다.');

  // 2. 본인 또는 구매자인지 재검증 (클라이언트 상태 신뢰 안 함)
  const isPurchased = await getIsPurchased(user.id, designId);
  if (user.id !== design.authorId && !isPurchased) throw new Error('다운로드 권한이 없습니다.');

  // 3. signed URL 생성 후 반환
  const supabase = createServiceRoleClient();
  return getSignedInstructionUrls(supabase, design.instructions);
}
