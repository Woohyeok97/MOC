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
import { createDesign } from './design-create.actions';
import type { DesignCreateFormType } from './design-create.schema';

type CreateDesignResult = { designId: string };

// useMutation 옵션
type CreateDesignMutationOptions = UseMutationOptions<
  CreateDesignResult, // mutation 결과 타입
  Error, // error 타입
  DesignCreateFormType // mutation 파라미터 타입
>;

// 디자인 등록 useMutation 훅 — 파일 업로드(클라이언트) + DB 저장(서버 액션) 조합
export function useCreateDesignMutation(options?: CreateDesignMutationOptions) {
  const user = useAuthStore(state => state.user);

  return useMutation<CreateDesignResult, Error, DesignCreateFormType>({
    mutationFn: async (data: DesignCreateFormType) => {
      // 로그인 확인
      if (!user) throw new Error('로그인이 필요합니다.');

      const supabase = createClient();
      const uploadId = crypto.randomUUID();
      const basePath = `${user.id}/${uploadId}`;

      // 파일 병렬 업로드 — 부분 실패도 처리하기 위해 allSettled 사용(전부 완료될 때까지 기다리고, 각각의 성공/실패 결과를 배열로 반환)
      const [thumbnailResult, galleryResult, instructionResult] = await Promise.allSettled([
        uploadThumbnail(supabase, data.thumbnail, basePath),
        uploadGalleryImages(supabase, data.images, basePath),
        uploadInstructions(supabase, data.instructions, basePath)
      ]);

      // 성공한 것들의 path 수집 (부분 실패 시 롤백 대상)
      const uploadedInstructionPaths = instructionResult.status === 'fulfilled' ? instructionResult.value : [];
      const uploadedImagePaths: string[] = [];
      if (thumbnailResult.status === 'fulfilled') uploadedImagePaths.push(thumbnailResult.value.path);
      if (galleryResult.status === 'fulfilled') uploadedImagePaths.push(...galleryResult.value.map(img => img.path));

      // 하나라도 실패하면 성공한 파일 롤백 후 에러 throw
      const failed = [thumbnailResult, galleryResult, instructionResult].find(result => result.status === 'rejected');
      if (failed) {
        await rollbackUploads(supabase, uploadedImagePaths, uploadedInstructionPaths);
        throw (failed as PromiseRejectedResult).reason;
      }

      // 이 시점에서 모두 fulfilled -> 모두 업로드 성공 확정
      const thumbnail = (thumbnailResult as PromiseFulfilledResult<{ url: string; path: string }>).value;
      const galleryImages = (galleryResult as PromiseFulfilledResult<{ url: string; path: string }[]>).value;
      const instructionPaths = (instructionResult as PromiseFulfilledResult<string[]>).value;

      const allImagePaths = [thumbnail.path, ...galleryImages.map(img => img.path)];

      // 디자인 생성 서버 액션 실행 — 실패 시 업로드된 파일 롤백
      try {
        return await createDesign({
          title: data.title,
          description: data.description,
          category: data.category,
          price: data.price,
          thumbnailPath: thumbnail.path,
          imagePaths: galleryImages.map(img => img.path),
          instructionPaths
        });
      } catch (error) {
        await rollbackUploads(supabase, allImagePaths, instructionPaths);
        throw error;
      }
    },
    ...options
  });
}
