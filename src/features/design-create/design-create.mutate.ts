'use client';

import { useMutation, type UseMutationOptions } from '@tanstack/react-query';
import { createClient } from '@/shared/api/supabase/client';
import { useAuthStore } from '@/features/auth/auth.store';
import { uploadThumbnail, uploadGalleryImages, uploadInstructions } from '@/shared/api/supabase/storage';
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

      // 파일 병렬 업로드
      const [thumbnailUrl, imageUrls, instructionPaths] = await Promise.all([
        uploadThumbnail(supabase, data.thumbnail, basePath),
        uploadGalleryImages(supabase, data.images, basePath),
        uploadInstructions(supabase, data.instructions, basePath)
      ]);

      // 디자인 생성 서버 액션 실행
      return createDesign({
        title: data.title,
        description: data.description,
        category: data.category,
        price: data.price,
        thumbnailUrl,
        imageUrls,
        instructionPaths
      });
    },
    ...options
  });
}
