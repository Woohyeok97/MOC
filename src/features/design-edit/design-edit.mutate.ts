'use client';

import { useMutation, type UseMutationOptions } from '@tanstack/react-query';
import { createClient } from '@/shared/api/supabase/client';
import { useAuthStore } from '@/features/auth/auth.store';
import { uploadThumbnail, uploadGalleryImages, uploadInstructions } from '@/shared/api/supabase/storage';
import { removeUserFiles } from '@/shared/api/supabase/storage.actions';
import { updateDesign } from './design-edit.actions';
import type { DesignEditFormType } from './design-edit.schema';

type UpdateDesignResult = { designId: string };

// 뮤테이션 파라미터 — data 외에 designId와 기존 스토리지 path 정보 필요
type UpdateDesignMutationInput = {
  data: DesignEditFormType;
  designId: string;
  // 수정 전 기존 파일 경로 — 교체/제거된 파일을 판별해 스토리지에서 삭제하기 위해 사용
  originalPaths: {
    thumbnailPath: string;
    imagePaths: string[];
    instructionPaths: string[];
    instructionNames: string[]; // instructions와 동일 인덱스로 정렬된 원본 파일명
  };
};

// useMutation 옵션
type UpdateDesignMutationOptions = UseMutationOptions<UpdateDesignResult, Error, UpdateDesignMutationInput>;

// 디자인 수정 useMutation 훅 — 신규 파일만 업로드, 교체/제거된 파일은 스토리지에서 삭제
export function useUpdateDesignMutation(options?: UpdateDesignMutationOptions) {
  const user = useAuthStore(state => state.user);

  return useMutation<UpdateDesignResult, Error, UpdateDesignMutationInput>({
    mutationFn: async ({ data, designId, originalPaths }) => {
      // 로그인 확인
      if (!user) throw new Error('로그인이 필요합니다.');

      const supabase = createClient();
      const basePath = `${user.id}/${designId}`; // 수정 시에도 같은 디자인 폴더 아래에 신규 파일을 모음

      // 1. 파일 분류 (동기) — 유지/제거/신규를 병렬 업로드 (to supabse storage) 전에 먼저 계산
      // 폼 값이 File → 신규 업로드 대상, string → 기존 path 유지, originalPaths에 있었는데 없어진 것 → 삭제 대상

      // 썸네일이 File 타입이라면? -> 유저가 새로운 썸네일 업로드 -> string 타입이라면 기존 썸네일
      const isNewThumbnail = data.thumbnail instanceof File;

      // 이미지 필드 파일 분류
      const keptImagePaths = data.images.filter((item): item is string => typeof item === 'string'); // 유지할 이미지 경로들
      const removedImagePaths = originalPaths.imagePaths.filter(path => !keptImagePaths.includes(path)); // 삭제할 이미지 경로들
      const newImageFiles = data.images.filter((item): item is File => item instanceof File); // 새로운 이미지 파일

      // 설명서 필드 파일 분류
      const keptInstructionPaths = data.instructions.filter((item): item is string => typeof item === 'string'); // 유지할 설명서 경로들
      const removedInstructionPaths = originalPaths.instructionPaths.filter(
        path => !keptInstructionPaths.includes(path)
      ); // 삭제할 설명서 경로들
      const newInstructionFiles = data.instructions.filter((item): item is File => item instanceof File); // 새로운 설명서 파일

      // 2. 신규 파일 병렬 업로드 — 썸네일은 교체 시에만, 갤러리/설명서는 신규 파일만
      const [thumbnailResult, imageResult, instructionResult] = await Promise.allSettled([
        isNewThumbnail ? uploadThumbnail(supabase, data.thumbnail as File, basePath) : Promise.resolve(null), // 썸네일이 유지(string)인 경우 null로 슬롯을 채워 인덱스 순서를 맞춤
        uploadGalleryImages(supabase, newImageFiles, basePath),
        uploadInstructions(supabase, newInstructionFiles, basePath)
      ]);

      // 3. 업로드 실패 처리 — 하나라도 실패하면 Promise.allSettled로 업로드한 신규 파일만 골라서 롤백
      // 폴더 통째 삭제 금지 — 폴더 안에 유지해야 할 기존 파일이 섞여 있음
      const failed = [thumbnailResult, imageResult, instructionResult].find(result => result.status === 'rejected');

      if (failed) {
        // 업로드했던 신규 파일 경로들
        const uploadedThumbnailPaths =
          thumbnailResult.status === 'fulfilled' && thumbnailResult.value ? [thumbnailResult.value.path] : [];
        const uploadedImagePaths = imageResult.status === 'fulfilled' ? imageResult.value.map(img => img.path) : [];
        const uploadedInstructionPaths =
          instructionResult.status === 'fulfilled' ? instructionResult.value.map(instruction => instruction.path) : [];

        // 업로드했던 신규 파일들만 골라서 롤백
        await removeUserFiles({
          imagePaths: [...uploadedThumbnailPaths, ...uploadedImagePaths],
          instructionPaths: uploadedInstructionPaths
        });
        throw (failed as PromiseRejectedResult).reason;
      }

      // 이 시점에서 모두 fulfilled -> 정상적으로 업로드 모두 성공 시점
      const uploadedThumbnail = (thumbnailResult as PromiseFulfilledResult<{ url: string; path: string } | null>).value;
      const uploadedGallery = (imageResult as PromiseFulfilledResult<{ url: string; path: string }[]>).value;
      const uploadedInstructions = (instructionResult as PromiseFulfilledResult<{ path: string; name: string }[]>)
        .value;

      // 4. 최종 경로 — 유지된 기존 path + 방금 업로드된 신규 path
      const finalThumbnailPath = uploadedThumbnail ? uploadedThumbnail.path : (data.thumbnail as string);
      const finalImagePaths = [...keptImagePaths, ...uploadedGallery.map(img => img.path)];
      const finalInstructionPaths = [
        ...keptInstructionPaths,
        ...uploadedInstructions.map(instruction => instruction.path)
      ];

      // 유지된 path는 기존 PDF 파일명 조회 / 신규 PDF 파일명은 file.name — instructions와 동일 인덱스로 정렬
      const originalNameByPath = new Map(
        originalPaths.instructionPaths.map((path, idx) => [path, originalPaths.instructionNames[idx] ?? ''])
      );
      const finalInstructionNames = [
        ...keptInstructionPaths.map(path => originalNameByPath.get(path) ?? ''),
        ...uploadedInstructions.map(instruction => instruction.name)
      ];

      // 5. DB 저장 — 실패 시 방금 올린 신규 파일만 롤백 (구 파일은 아직 살아있으므로 건드리지 않음)
      let result: UpdateDesignResult;

      try {
        result = await updateDesign({
          designId,
          title: data.title,
          description: data.description,
          category: data.category,
          price: data.price,
          thumbnailPath: finalThumbnailPath,
          imagePaths: finalImagePaths,
          instructionPaths: finalInstructionPaths,
          instructionNames: finalInstructionNames
        });
      } catch (error) {
        // DB 업로드 실패시 - 파일 업로드 롤백
        await removeUserFiles({
          imagePaths: [...(uploadedThumbnail ? [uploadedThumbnail.path] : []), ...uploadedGallery.map(img => img.path)],
          instructionPaths: uploadedInstructions.map(instruction => instruction.path)
        });
        throw error;
      }

      // 6. DB 저장 성공 후 교체/제거된 구 파일 삭제
      const thumbnailToDelete = isNewThumbnail ? [originalPaths.thumbnailPath] : []; // 교체된 구 썸네일 패스

      await removeUserFiles({
        imagePaths: [...thumbnailToDelete, ...removedImagePaths],
        instructionPaths: removedInstructionPaths
      });

      return result;
    },
    ...options
  });
}
