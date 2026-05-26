'use client';

import { useMutation, type UseMutationOptions } from '@tanstack/react-query';
import { createClient } from '@/shared/api/supabase/client';
import { useAuthStore } from '@/features/auth/auth.store';
import {
  uploadThumbnail,
  uploadGalleryImages,
  uploadInstructions,
  rollbackUploads
} from '@/shared/api/supabase/storage';
import { updateDesign } from './design-edit.actions';
import type { DesignEditFormType } from './design-edit.schema';

type UpdateDesignResult = { designId: string };

// 뮤테이션 파라미터 — formData 외에 designId와 기존 스토리지 path 정보 필요
type UpdateDesignMutationInput = {
  formData: DesignEditFormType;
  designId: string;
  originalPaths: {
    thumbnailPath: string;
    imagePaths: string[];
    instructionPaths: string[];
  };
};

// useMutation 옵션
type UpdateDesignMutationOptions = UseMutationOptions<UpdateDesignResult, Error, UpdateDesignMutationInput>;

// 디자인 수정 useMutation 훅 — 신규 파일만 업로드, 교체/제거된 파일은 스토리지에서 삭제
export function useUpdateDesignMutation(options?: UpdateDesignMutationOptions) {
  const user = useAuthStore(state => state.user);

  return useMutation<UpdateDesignResult, Error, UpdateDesignMutationInput>({
    mutationFn: async ({ formData, designId, originalPaths }) => {
      // 로그인 확인
      if (!user) throw new Error('로그인이 필요합니다.');

      const supabase = createClient();
      const uploadId = crypto.randomUUID();
      const basePath = `${user.id}/${uploadId}`;

      // 1. thumbnail 처리 — File이면 신규 업로드, string이면 기존 path 유지
      let finalThumbnailPath: string;
      let thumbnailToDelete: string[] = [];

      if (formData.thumbnail instanceof File) {
        const uploaded = await uploadThumbnail(supabase, formData.thumbnail, basePath);
        finalThumbnailPath = uploaded.path;
        thumbnailToDelete = [originalPaths.thumbnailPath];
      } else {
        finalThumbnailPath = formData.thumbnail;
      }

      // 2. images 처리 — File은 업로드, string은 기존 path 유지, 제거된 path는 삭제 대상
      const newImageFiles = formData.images.filter((item): item is File => item instanceof File);
      const keptImagePaths = formData.images.filter((item): item is string => typeof item === 'string');
      const removedImagePaths = originalPaths.imagePaths.filter(path => !keptImagePaths.includes(path));

      const uploadedGallery = await uploadGalleryImages(supabase, newImageFiles, basePath);
      const finalImagePaths = [...keptImagePaths, ...uploadedGallery.map(img => img.path)];

      // 3. instructions 처리 — 동일 패턴
      const newInstructionFiles = formData.instructions.filter((item): item is File => item instanceof File);
      const keptInstructionPaths = formData.instructions.filter((item): item is string => typeof item === 'string');
      const removedInstructionPaths = originalPaths.instructionPaths.filter(
        path => !keptInstructionPaths.includes(path)
      );

      const uploadedInstructions = await uploadInstructions(supabase, newInstructionFiles, basePath);
      const finalInstructionPaths = [...keptInstructionPaths, ...uploadedInstructions];

      // 4. 디자인 수정 서버 액션 실행
      let result: UpdateDesignResult;
      try {
        result = await updateDesign({
          designId,
          title: formData.title,
          description: formData.description,
          category: formData.category,
          price: formData.price,
          thumbnailPath: finalThumbnailPath,
          imagePaths: finalImagePaths,
          instructionPaths: finalInstructionPaths
        });
      } catch (error) {
        // DB 저장 실패 시 신규 업로드 파일만 롤백
        const newlyUploadedImagePaths = [
          ...(formData.thumbnail instanceof File ? [finalThumbnailPath] : []),
          ...uploadedGallery.map(img => img.path)
        ];
        await rollbackUploads(supabase, newlyUploadedImagePaths, uploadedInstructions);
        throw error;
      }

      // 5. DB 저장 성공 후 교체/제거된 기존 파일 삭제
      const allRemovedImagePaths = [...thumbnailToDelete, ...removedImagePaths];
      await rollbackUploads(supabase, allRemovedImagePaths, removedInstructionPaths);

      return result;
    },
    ...options
  });
}
