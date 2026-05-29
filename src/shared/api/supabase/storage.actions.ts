'use server';

import { createServiceRoleClient } from '@/shared/api/supabase/server';
import { getAuthSession } from '@/features/auth/auth.api';

const IMAGES_BUCKET = 'Images';
const INSTRUCTIONS_BUCKET = 'Instructions';

// 본인 소유 파일만 통과 — service-role은 RLS를 우회하므로 코드에서 직접 검증
function filterOwnedPaths(paths: string[], userId: string): string[] {
  return paths.filter(path => path.startsWith(`${userId}/`));
}

// 스토리지 파일 삭제 서버 액션 — service-role로 실행(RLS 우회), 소유권은 코드에서 검증
export async function removeUserFiles(input: { imagePaths: string[]; instructionPaths: string[] }): Promise<void> {
  const user = await getAuthSession();
  if (!user) throw new Error('로그인이 필요합니다.');

  const imagePaths = filterOwnedPaths(input.imagePaths, user.id);
  const instructionPaths = filterOwnedPaths(input.instructionPaths, user.id);

  const supabase = createServiceRoleClient();
  const [imageResult, instructionResult] = await Promise.all([
    imagePaths.length > 0 ? supabase.storage.from(IMAGES_BUCKET).remove(imagePaths) : Promise.resolve({ error: null }),
    instructionPaths.length > 0
      ? supabase.storage.from(INSTRUCTIONS_BUCKET).remove(instructionPaths)
      : Promise.resolve({ error: null })
  ]);

  if (imageResult.error) throw new Error(`이미지 삭제 실패: ${imageResult.error.message}`);
  if (instructionResult.error) throw new Error(`설명서 삭제 실패: ${instructionResult.error.message}`);
}

// 디자인 폴더 전체 삭제 서버 액션 — `${userId}/${designId}` 프리픽스 하위 파일을 통째로 제거
export async function removeUserPrefix(prefix: string): Promise<void> {
  const user = await getAuthSession();
  if (!user) throw new Error('로그인이 필요합니다.');

  // 본인 폴더가 아니면 거부
  if (!prefix.startsWith(`${user.id}/`)) throw new Error('삭제 권한이 없습니다.');

  const supabase = createServiceRoleClient();

  // 두 버킷 각각 프리픽스 하위 파일 목록 조회 후 삭제
  await Promise.all([removeBucketPrefix(supabase, IMAGES_BUCKET, prefix), removeBucketPrefix(supabase, INSTRUCTIONS_BUCKET, prefix)]);
}

// 버킷 하위 폴더의 모든 파일 경로를 수집해 삭제
async function removeBucketPrefix(
  supabase: ReturnType<typeof createServiceRoleClient>,
  bucket: string,
  prefix: string
): Promise<void> {
  const paths = await listAllPaths(supabase, bucket, prefix);
  if (paths.length === 0) return;

  const { error } = await supabase.storage.from(bucket).remove(paths);
  if (error) throw new Error(`${bucket} 폴더 삭제 실패: ${error.message}`);
}

// 폴더 하위 파일 경로 재귀 수집 — 디자인 폴더는 thumbnail/gallery 등 하위 폴더를 가짐
async function listAllPaths(
  supabase: ReturnType<typeof createServiceRoleClient>,
  bucket: string,
  prefix: string
): Promise<string[]> {
  const { data, error } = await supabase.storage.from(bucket).list(prefix);
  if (error) throw new Error(`${bucket} 폴더 조회 실패: ${error.message}`);
  if (!data) return [];

  const paths: string[] = [];
  for (const entry of data) {
    const entryPath = `${prefix}/${entry.name}`;
    // id가 없으면 폴더 — 재귀로 하위 파일 수집
    if (entry.id === null) {
      paths.push(...(await listAllPaths(supabase, bucket, entryPath)));
    } else {
      paths.push(entryPath);
    }
  }
  return paths;
}
