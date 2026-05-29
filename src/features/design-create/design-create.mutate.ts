'use client';

import { useMutation, type UseMutationOptions } from '@tanstack/react-query';
import { createClient } from '@/shared/api/supabase/client';
import { useAuthStore } from '@/features/auth/auth.store';
import { uploadThumbnail, uploadGalleryImages, uploadInstructions } from '@/shared/api/supabase/storage';
import { removeUserPrefix } from '@/shared/api/supabase/storage.actions';
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
      // 디자인 ID를 먼저 생성해 스토리지 경로를 디자인별 폴더로 키잉 — 실패/삭제 시 폴더 통째 정리 가능
      const designId = crypto.randomUUID();
      const basePath = `${user.id}/${designId}`;

      // 파일 병렬 업로드 — 부분 실패도 처리하기 위해 allSettled 사용(전부 완료될 때까지 기다리고, 각각의 성공/실패 결과를 배열로 반환)
      const [thumbnailResult, imageResult, instructionResult] = await Promise.allSettled([
        uploadThumbnail(supabase, data.thumbnail, basePath),
        uploadGalleryImages(supabase, data.images, basePath),
        uploadInstructions(supabase, data.instructions, basePath)
      ]);

      // 하나라도 실패하면 디자인 폴더 통째로 롤백 후 에러 throw
      const failed = [thumbnailResult, imageResult, instructionResult].find(result => result.status === 'rejected');

      if (failed) {
        await removeUserPrefix(basePath);
        throw (failed as PromiseRejectedResult).reason;
      }

      // 이 시점에서 모두 fulfilled -> 정상적으로 업로드 모두 성공 시점
      const uploadedThumbnail = (thumbnailResult as PromiseFulfilledResult<{ url: string; path: string }>).value;
      const uploadedGallery = (imageResult as PromiseFulfilledResult<{ url: string; path: string }[]>).value;
      const uploadedInstructions = (instructionResult as PromiseFulfilledResult<{ path: string; name: string }[]>)
        .value;

      // 디자인 생성 서버 액션 실행 — 실패 시 업로드된 파일 폴더 통째 롤백
      try {
        return await createDesign({
          id: designId,
          title: data.title,
          description: data.description,
          category: data.category,
          price: data.price,
          thumbnailPath: uploadedThumbnail.path,
          imagePaths: uploadedGallery.map(img => img.path),
          instructionPaths: uploadedInstructions.map(instruction => instruction.path),
          instructionNames: uploadedInstructions.map(instruction => instruction.name)
        });
      } catch (error) {
        await removeUserPrefix(basePath);
        throw error;
      }
    },
    ...options
  });
}
