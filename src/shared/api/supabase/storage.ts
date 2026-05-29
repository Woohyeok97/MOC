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

// 설명서 PDF 업로드 함수 -> { path, name }[] 반환 (Instructions 버킷은 프라이빗, name은 다운로드 시 사용할 원본 파일명)
export async function uploadInstructions(
  supabase: SupabaseClient,
  files: File[],
  basePath: string
): Promise<{ path: string; name: string }[]> {
  if (files.length === 0) return [];

  return Promise.all(
    files.map(async file => {
      const fileExtension = file.name.split('.').pop();
      const path = `${basePath}/${crypto.randomUUID()}.${fileExtension}`; // 비ASCII 파일명(한글 등) 업로드 오류 방지를 위해 UUID로 대체
      const { error } = await supabase.storage.from(INSTRUCTIONS_BUCKET).upload(path, file);
      if (error) throw new Error(`설명서 업로드 실패: ${error.message}`);
      return { path, name: file.name };
    })
  );
}

// Instructions 버킷 시그니처 Url 반환 함수 (TTL 60초, private 버킷)
export async function getSignedInstructionUrls(supabase: SupabaseClient, paths: string[]): Promise<string[]> {
  const results = await Promise.all(
    paths.map(path => supabase.storage.from(INSTRUCTIONS_BUCKET).createSignedUrl(path, 60))
  );
  return results.map(r => {
    if (r.error || !r.data) throw new Error(`서명 URL 생성 실패: ${r.error?.message}`);
    return r.data.signedUrl;
  });
}

// Images 버킷 퍼블릭 이미지 Url 반환 함수 (렌더링용, 네트워크 요청 없음)
export function getPublicImageUrl(supabase: SupabaseClient, path: string): string {
  return supabase.storage.from(IMAGES_BUCKET).getPublicUrl(path).data.publicUrl;
}
