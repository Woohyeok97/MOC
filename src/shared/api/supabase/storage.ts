// Supabase Storage 업로드/삭제/URL 생성 유틸
import type { SupabaseClient } from '@supabase/supabase-js';

const IMAGES_BUCKET = 'Images';
const INSTRUCTIONS_BUCKET = 'Instructions';

// 썸네일 업로드 함수 -> { url, path } 반환
export async function uploadThumbnail(
  supabase: SupabaseClient,
  file: File,
  basePath: string
): Promise<{ url: string; path: string }> {
  const fileExtension = file.name.split('.').pop();
  const path = `${basePath}/thumbnail/${crypto.randomUUID()}.${fileExtension}`; // 비ASCII 파일명(한글 등) 업로드 오류 방지를 위해 UUID로 대체
  const { error } = await supabase.storage.from(IMAGES_BUCKET).upload(path, file);
  if (error) throw new Error(`썸네일 업로드 실패: ${error.message}`);

  const { data } = supabase.storage.from(IMAGES_BUCKET).getPublicUrl(path);
  return { url: data.publicUrl, path };
}

// 갤러리 이미지 업로드 함수 -> { url, path }[] 반환
export async function uploadGalleryImages(
  supabase: SupabaseClient,
  files: File[],
  basePath: string
): Promise<{ url: string; path: string }[]> {
  if (files.length === 0) return [];

  return Promise.all(
    files.map(async file => {
      const fileExtension = file.name.split('.').pop();
      const path = `${basePath}/gallery/${crypto.randomUUID()}.${fileExtension}`; // 비ASCII 파일명(한글 등) 업로드 오류 방지를 위해 UUID로 대체
      const { error } = await supabase.storage.from(IMAGES_BUCKET).upload(path, file);
      if (error) throw new Error(`갤러리 이미지 업로드 실패: ${error.message}`);

      const { data } = supabase.storage.from(IMAGES_BUCKET).getPublicUrl(path);
      return { url: data.publicUrl, path };
    })
  );
}

// 설명서 PDF 업로드 함수 -> 스토리지 path 배열 반환 (Instructions 버킷은 프라이빗)
export async function uploadInstructions(supabase: SupabaseClient, files: File[], basePath: string): Promise<string[]> {
  if (files.length === 0) return [];

  return Promise.all(
    files.map(async file => {
      const fileExtension = file.name.split('.').pop();
      const path = `${basePath}/${crypto.randomUUID()}.${fileExtension}`; // 비ASCII 파일명(한글 등) 업로드 오류 방지를 위해 UUID로 대체
      const { error } = await supabase.storage.from(INSTRUCTIONS_BUCKET).upload(path, file);
      if (error) throw new Error(`설명서 업로드 실패: ${error.message}`);
      return path;
    })
  );
}

// Images 버킷 path → public URL 변환 함수 (렌더링용, 네트워크 요청 없음)
export function getPublicImageUrl(supabase: SupabaseClient, path: string): string {
  return supabase.storage.from(IMAGES_BUCKET).getPublicUrl(path).data.publicUrl;
}

// 업로드 롤백 함수 -> DB 저장 실패 시 스토리지 파일 삭제
export async function rollbackUploads(
  supabase: SupabaseClient,
  imagePaths: string[],
  instructionPaths: string[]
): Promise<void> {
  try {
    await Promise.all([
      imagePaths.length > 0 ? supabase.storage.from(IMAGES_BUCKET).remove(imagePaths) : Promise.resolve(),
      instructionPaths.length > 0
        ? supabase.storage.from(INSTRUCTIONS_BUCKET).remove(instructionPaths)
        : Promise.resolve()
    ]);
  } catch (error) {
    // 롤백 실패는 사용자에게 노출하지 않음 — 추후 배치 정리로 대응
    console.error('스토리지 롤백 실패:', error);
  }
}
