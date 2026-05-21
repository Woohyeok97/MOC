'use client';

import { FormProvider, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
// hooks
import { useUpdateDesignMutation } from '../design-edit.mutate';
// components
import { Button } from '@/shared/ui/button';
import { BasicInfoField } from './BasicInfoField';
import { PriceField } from './PriceField';
import { ThumbnailField } from './ThumbnailField';
import { ImageGridField } from './ImageGridField';
import { InstructionsField } from './InstructionsField';
// icons
import { Check } from 'lucide-react';
// types & schemas
import { DesignEditSchema, type DesignEditFormType } from '../design-edit.schema';
import type { Design } from '@/entities/design/design.type';

type DesignEditFormProps = {
  design: Design;
};

// 디자인 수정 폼 컴포넌트 (클라이언트) — 기존 디자인 데이터로 초기화
export function DesignEditForm({ design }: DesignEditFormProps) {
  const methods = useForm<DesignEditFormType>({
    resolver: zodResolver(DesignEditSchema),
    defaultValues: {
      title: design.title,
      description: design.description,
      isFree: design.price === 0,
      price: design.price,
      category: design.category as DesignEditFormType['category'],
      thumbnail: design.thumbnail,       // raw 스토리지 path
      images: design.images,              // raw 스토리지 path[]
      instructions: design.instructions   // raw 스토리지 path[]
    }
  });

  // 폼 제출 후 상세 페이지로 이동
  const router = useRouter();

  // 디자인 수정 뮤테이션 — 성공 시 상세 페이지로 이동
  const { mutate, isPending, isError, error } = useUpdateDesignMutation({
    onSuccess: ({ designId }) => router.push(`/designs/${designId}`)
  });

  // 폼 액션 - 유효성 검사 후 뮤테이션 실행
  const onSubmit = methods.handleSubmit(formData =>
    mutate({
      formData,
      designId: design.id,
      originalPaths: {
        thumbnailPath: design.thumbnail,
        imagePaths: design.images,
        instructionPaths: design.instructions
      }
    })
  );

  return (
    <FormProvider {...methods}>
      {/* 히어로 배너 */}
      <div
        className="px-8 pt-10 pb-18 text-center max-[640px]:px-5 max-[640px]:pt-7 max-[640px]:pb-15"
        style={{ background: 'linear-gradient(135deg, #211922 0%, #2a2230 100%)' }}>
        <p className="text-primary mb-2.5 text-[11px] font-bold tracking-[1.8px]">EDIT DESIGN</p>
        <h1 className="mb-2.5 text-[30px] font-bold tracking-tight text-white max-[640px]:text-2xl">
          Edit your creation
        </h1>
        <p className="mx-auto max-w-130 text-[13px] leading-relaxed text-white/70">
          Update your design details, images, and instructions.
        </p>
      </div>

      {/* 폼 — 히어로 배너와 10px 겹침 */}
      <form
        onSubmit={onSubmit}
        className="relative z-1 mx-auto -mt-10 max-w-195 space-y-4 px-6 pt-7 pb-15 max-[640px]:px-4 max-[640px]:pt-5">
        {/* 기본 정보 */}
        <FormSection title="Basic Info">
          <BasicInfoField />
        </FormSection>

        {/* 이미지 */}
        <FormSection title="Images" desc="1 thumbnail + up to 6 gallery images">
          <div className="grid grid-cols-[240px_1fr] items-stretch gap-3.5 max-[640px]:grid-cols-1">
            <div className="flex flex-col max-[640px]:h-60">
              <p className="text-muted-foreground mb-1.5 text-[11px] font-bold tracking-[0.3px]">Thumbnail</p>
              <div className="flex-1">
                <ThumbnailField />
              </div>
            </div>
            <div className="flex min-w-0 flex-col">
              <GalleryLabel />
              <div className="min-h-0 flex-1 max-[640px]:aspect-3/2 max-[640px]:flex-none">
                <ImageGridField />
              </div>
            </div>
          </div>
        </FormSection>

        {/* 설명서 */}
        <FormSection title="Instructions" desc="Attach a PDF to reach more builders">
          <InstructionsField />
        </FormSection>

        {/* 가격 */}
        <FormSection title="Price" desc="Download price">
          <PriceField />
        </FormSection>

        {/* 뮤테이션 에러 메시지 */}
        {isError ? (
          <p className="text-center text-[13px] text-red-500">
            {error instanceof Error ? error.message : '수정 중 문제가 발생했어요. 다시 시도해주세요.'}
          </p>
        ) : null}

        {/* 제출 버튼 */}
        <div className="flex justify-end">
          <Button type="submit" size="lg" disabled={isPending} className="rounded-xl px-7 text-[14px] font-bold">
            <Check className="h-4 w-4" />
            {isPending ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </form>
    </FormProvider>
  );
}

// 폼 섹션 래퍼 — 제목/설명 + 콘텐츠 카드
function FormSection({ title, desc, children }: { title: string; desc?: string; children: React.ReactNode }) {
  return (
    <section className="border-secondary bg-card flex flex-col gap-4 rounded-[18px] border px-5.5 py-5">
      <div>
        <p className="text-surface-dark text-[15px] font-bold">{title}</p>
        {desc ? <p className="text-muted-foreground mt-0.5 text-[12px]">{desc}</p> : null}
      </div>
      {children}
    </section>
  );
}

// 갤러리 카운트 레이블 — useWatch로 images 구독 격리
function GalleryLabel() {
  const images: (File | string)[] = useWatch({ name: 'images' });
  return (
    <p className="text-muted-foreground mb-1.5 text-[11px] font-bold tracking-[0.3px]">Gallery ({images.length}/6)</p>
  );
}
