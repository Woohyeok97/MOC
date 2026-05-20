// 디자인 등록 폼 컴포넌트 (클라이언트)
'use client';

import { useState } from 'react';
import { FormProvider, useForm, useFormContext } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useCreateDesignMutation } from '../design-create.mutate';
// components
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Textarea } from '@/shared/ui/textarea';
import { ThumbnailSection } from './ThumbnailSection';
import { ImageGridSection } from './ImageGridSection';
import { InstructionsSection } from './InstructionsSection';
// icons
import { Check } from 'lucide-react';
// types & schemas
import { DESIGN_CATEGORIES, DesignCreateSchema, type DesignCreateFormType } from '../design-create.schema';

// ── DesignCreateForm ──────────────────────────────────────────────────────────

export function DesignCreateForm() {
  const methods = useForm<DesignCreateFormType>({
    resolver: zodResolver(DesignCreateSchema),
    defaultValues: {
      title: '',
      description: '',
      price: 0,
      category: undefined,
      images: [],
      instructions: []
    }
  });

  const router = useRouter();

  const { mutate, isPending, isError, error } = useCreateDesignMutation({
    onSuccess: ({ designId }) => router.push(`/designs/${designId}`)
  });

  const onSubmit = methods.handleSubmit(data => mutate(data));

  return (
    <FormProvider {...methods}>
      {/* 히어로 배너 */}
      <div
        className="px-8 pt-10 pb-[72px] text-center max-[640px]:px-5 max-[640px]:pt-7 max-[640px]:pb-[60px]"
        style={{ background: 'linear-gradient(135deg, #211922 0%, #2a2230 100%)' }}>
        <p className="text-primary mb-2.5 text-[11px] font-bold tracking-[1.8px]">NEW CREATION</p>
        <h1 className="mb-2.5 text-[30px] font-bold tracking-tight text-white max-[640px]:text-2xl">
          Share your creation
        </h1>
        <p className="mx-auto max-w-[520px] text-[13px] leading-relaxed text-white/70">
          Share your work with the MOC community. Add photos and instructions to reach more builders.
        </p>
      </div>

      {/* 폼 — 히어로 배너와 10px 겹침 */}
      <form
        onSubmit={onSubmit}
        className="relative z-1 mx-auto -mt-10 max-w-[780px] space-y-4 px-6 pt-7 pb-[60px] max-[640px]:px-4 max-[640px]:pt-5">
        {/* 기본 정보 */}
        <FormSection title="Basic Info">
          <BasicInfoFields />
        </FormSection>

        {/* 이미지 */}
        <FormSection title="Images" desc="1 thumbnail + up to 6 gallery images">
          <div className="grid grid-cols-[240px_1fr] items-stretch gap-3.5 max-[640px]:grid-cols-1">
            <div className="flex flex-col max-[640px]:h-[240px]">
              <p className="text-muted-foreground mb-1.5 text-[11px] font-bold tracking-[0.3px]">Thumbnail</p>
              <div className="flex-1">
                <ThumbnailSection />
              </div>
            </div>
            <div className="flex min-w-0 flex-col">
              <GalleryLabel />
              <div className="min-h-0 flex-1 max-[640px]:aspect-[3/2] max-[640px]:flex-none">
                <ImageGridSection />
              </div>
            </div>
          </div>
        </FormSection>

        {/* 설명서 */}
        <FormSection title="Instructions" desc="Attach a PDF to reach more builders">
          <InstructionsSection />
        </FormSection>

        {/* 가격 */}
        <FormSection title="Price" desc="Download price">
          <PriceField />
        </FormSection>

        {/* 에러 메시지 */}
        {isError ? (
          <p className="text-center text-[13px] text-red-500">
            {error instanceof Error ? error.message : '등록 중 문제가 발생했어요. 다시 시도해주세요.'}
          </p>
        ) : null}

        {/* 제출 버튼 */}
        <div className="flex justify-end">
          <Button type="submit" size="lg" disabled={isPending} className="rounded-xl px-7 text-[14px] font-bold">
            <Check className="h-4 w-4" />
            {isPending ? 'Publishing...' : 'Publish'}
          </Button>
        </div>
      </form>
    </FormProvider>
  );
}

// 폼 섹션 래퍼
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

// 기본 정보 필드 (title, description, category)
function BasicInfoFields() {
  const {
    register,
    watch,
    setValue,
    formState: { errors }
  } = useFormContext<DesignCreateFormType>();

  const category = watch('category');

  return (
    <div className="space-y-4">
      <div>
        <label className="text-surface-dark mb-2 block text-[13px] font-bold">
          Title <span className="text-red-500">*</span>
        </label>
        <Input placeholder="e.g. Black Falcon Fortress" {...register('title')} />
        {errors.title ? <p className="mt-1.5 text-[11px] text-red-500">{errors.title.message}</p> : null}
      </div>

      <div>
        <label className="text-surface-dark mb-2 block text-[13px] font-bold">
          Description <span className="text-red-500">*</span>
        </label>
        <Textarea
          rows={5}
          placeholder="Describe your creation, techniques, and inspiration..."
          {...register('description')}
        />
        {errors.description ? <p className="mt-1.5 text-[11px] text-red-500">{errors.description.message}</p> : null}
      </div>

      <div>
        <label className="text-surface-dark mb-2 block text-[13px] font-bold">
          Category <span className="text-red-500">*</span>
        </label>
        <div className="flex flex-wrap gap-2">
          {DESIGN_CATEGORIES.map(cat => (
            <button
              key={cat}
              type="button"
              onClick={() => setValue('category', cat, { shouldValidate: true })}
              className={`rounded-full border-[1.5px] px-3.5 py-1.5 text-[12px] capitalize transition-all ${
                category === cat
                  ? 'border-primary bg-primary font-bold text-white'
                  : 'border-border bg-card text-surface-dark hover:border-primary font-medium'
              }`}>
              {cat}
            </button>
          ))}
        </div>
        {errors.category ? <p className="mt-1.5 text-[11px] text-red-500">{errors.category.message}</p> : null}
      </div>
    </div>
  );
}

// 갤러리 카운트 레이블
function GalleryLabel() {
  const { watch } = useFormContext<DesignCreateFormType>();
  const images: File[] = watch('images');
  return (
    <p className="text-muted-foreground mb-1.5 text-[11px] font-bold tracking-[0.3px]">Gallery ({images.length}/6)</p>
  );
}

// 가격 필드 (Free 체크박스 포함)
function PriceField() {
  const {
    register,
    setValue,
    formState: { errors }
  } = useFormContext<DesignCreateFormType>();

  const [isFree, setIsFree] = useState(true);

  const handleFreeToggle = (checked: boolean) => {
    setIsFree(checked);
    if (checked) setValue('price', 0, { shouldValidate: true });
  };

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <label className="text-surface-dark text-[13px] font-bold">Price</label>
        <label className="flex cursor-pointer items-center gap-1.5 select-none">
          <input
            type="checkbox"
            checked={isFree}
            onChange={e => handleFreeToggle(e.target.checked)}
            className="accent-primary h-3.5 w-3.5"
          />
          <span className="text-muted-foreground text-[12px] font-medium">Free</span>
        </label>
      </div>
      <div
        className={`bg-card flex items-center gap-2 rounded-xl border px-3.5 transition-[border-color,box-shadow] ${
          errors.price
            ? 'border-red-400'
            : 'border-border focus-within:border-primary focus-within:shadow-[0_0_0_3px_rgba(0,102,255,0.12)]'
        }`}>
        <span className="text-muted-foreground text-[14px] font-semibold">₩</span>
        <input
          type="text"
          inputMode="numeric"
          placeholder="0"
          disabled={isFree}
          {...register('price', { setValueAs: (v: string) => (v === '' ? 0 : Number(v) || 0) })}
          className="text-surface-dark flex-1 py-3 text-[14px] outline-none disabled:cursor-not-allowed disabled:opacity-50"
        />
      </div>
      {errors.price ? <p className="mt-1.5 text-[11px] text-red-500">{errors.price.message}</p> : null}
    </div>
  );
}
