'use server';

// features
import { getAuthSession } from '@/features/auth/auth.api';
// entities
import { getDesignById } from '@/entities/design/design.api';
// shared
import { createServiceRoleClient } from '@/shared/api/supabase/server';

export async function getInstructionUrl(designId: string, index: number): Promise<string> {
  // 1. 로그인 + 디자인 조회 병렬 실행
  const [user, design] = await Promise.all([getAuthSession(), getDesignById(designId)]);
  if (!user) throw new Error('로그인이 필요합니다.');
  if (!design) throw new Error('존재하지 않는 디자인입니다.');

  // 2. 인덱스 유효성 확인
  const path = design.instructions[index];
  if (!path) throw new Error('존재하지 않는 파일입니다.');

  // 3. signed URL 생성 — 60초 유효, 다운로드 시 원본 파일명으로 저장
  const downloadName = design.instructionNames[index] || `Instruction_${index + 1}.pdf`;
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase.storage.from('Instructions').createSignedUrl(path, 60, {
    download: downloadName
  });
  if (error || !data) throw new Error(`서명 URL 생성 실패: ${error?.message}`);
  return data.signedUrl;
}
