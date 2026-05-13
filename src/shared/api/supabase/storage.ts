// Supabase Storage 업로드 유틸 (서버 액션 전용)
import type { SupabaseClient } from '@supabase/supabase-js';

const IMAGES_BUCKET = 'Images';
const INSTRUCTIONS_BUCKET = 'Instructions';

// 썸네일 업로드 → public URL 반환
export async function uploadThumbnail(supabase: SupabaseClient, file: File, basePath: string): Promise<string> {
  const path = `${basePath}/thumbnail/${file.name}`;
  const { error } = await supabase.storage.from(IMAGES_BUCKET).upload(path, file);
  if (error) throw new Error(`썸네일 업로드 실패: ${error.message}`);

  const { data } = supabase.storage.from(IMAGES_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

// 갤러리 이미지 업로드 → public URL 배열 반환
export async function uploadGalleryImages(supabase: SupabaseClient, files: File[], basePath: string): Promise<string[]> {
  if (files.length === 0) return [];

  const results = await Promise.all(
    files.map(async file => {
      const path = `${basePath}/gallery/${file.name}`;
      const { error } = await supabase.storage.from(IMAGES_BUCKET).upload(path, file);
      if (error) throw new Error(`갤러리 이미지 업로드 실패: ${error.message}`);

      const { data } = supabase.storage.from(IMAGES_BUCKET).getPublicUrl(path);
      return data.publicUrl;
    })
  );

  return results;
}

// 설명서 PDF 업로드 → 스토리지 경로 배열 반환 (Instructions 버킷은 프라이빗 → URL 대신 path 저장)
export async function uploadInstructions(supabase: SupabaseClient, files: File[], basePath: string): Promise<string[]> {
  if (files.length === 0) return [];

  const paths = await Promise.all(
    files.map(async file => {
      const path = `${basePath}/${file.name}`;
      const { error } = await supabase.storage.from(INSTRUCTIONS_BUCKET).upload(path, file);
      if (error) throw new Error(`설명서 업로드 실패: ${error.message}`);
      return path;
    })
  );

  return paths;
}
