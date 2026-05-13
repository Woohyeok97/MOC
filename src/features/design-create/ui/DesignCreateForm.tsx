// 디자인 등록 폼 컴포넌트 (클라이언트)
'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useController, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useCreateDesignMutation } from '../design-create.mutate';
// components
import Image from 'next/image';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Textarea } from '@/shared/ui/textarea';
// icons
import { Check, ImageIcon, Plus } from 'lucide-react';
// types & schemas
import { DESIGN_CATEGORIES, DesignCreateSchema, type DesignCreateFormType } from '../design-create.schema';

// ── DesignCreateForm ──────────────────────────────────────────────────────────

export function DesignCreateForm() {
  const { register, handleSubmit, control, formState } = useForm<DesignCreateFormType>({
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

  // form state
  const { errors } = formState;

  // useController — 파일/열거형 필드
  const { field: categoryField } = useController({ control, name: 'category' });
  const { field: thumbnailField } = useController({ control, name: 'thumbnail' });
  const { field: imagesField } = useController({ control, name: 'images' });
  const { field: instructionsField } = useController({ control, name: 'instructions' });

  const router = useRouter();

  // 디자인 생성 뮤테이션
  const { mutate, isPending, isError, error } = useCreateDesignMutation({
    onSuccess: ({ designId }) => router.push(`/designs/${designId}`)
  });

  // 디자인 생성 핸들러
  const onSubmit = handleSubmit(data => mutate(data));

  return (
    <>
      {/* 히어로 배너 */}
      <div
        className="px-8 pt-10 pb-[72px] text-center max-[640px]:px-5 max-[640px]:pt-7 max-[640px]:pb-[60px]"
        style={{ background: 'linear-gradient(135deg, #211922 0%, #2a2230 100%)' }}>
        <p className="mb-2.5 text-[11px] font-bold tracking-[1.8px] text-[#0066ff]">NEW CREATION</p>
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
          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-[13px] font-bold text-[#211922]">
                Title <span className="text-red-500">*</span>
              </label>
              <Input placeholder="e.g. Black Falcon Fortress" {...register('title')} />
              {errors.title ? <p className="mt-1.5 text-[11px] text-red-500">{errors.title.message}</p> : null}
            </div>

            <div>
              <label className="mb-2 block text-[13px] font-bold text-[#211922]">
                Description <span className="text-red-500">*</span>
              </label>
              <Textarea
                rows={5}
                placeholder="Describe your creation, techniques, and inspiration..."
                {...register('description')}
              />
              {errors.description ? (
                <p className="mt-1.5 text-[11px] text-red-500">{errors.description.message}</p>
              ) : null}
            </div>

            <div>
              <label className="mb-2 block text-[13px] font-bold text-[#211922]">
                Category <span className="text-red-500">*</span>
              </label>
              <div>
                <div className="flex flex-wrap gap-2">
                  {DESIGN_CATEGORIES.map(category => (
                    <button
                      key={category}
                      type="button"
                      onClick={() => categoryField.onChange(category)}
                      className={`rounded-full border-[1.5px] px-3.5 py-1.5 text-[12px] capitalize transition-all ${
                        categoryField.value === category
                          ? 'border-[#0066ff] bg-[#0066ff] font-bold text-white'
                          : 'border-[#e5e5e0] bg-white font-medium text-[#211922] hover:border-[#0066ff]'
                      }`}>
                      {category}
                    </button>
                  ))}
                </div>
                {errors.category ? <p className="mt-1.5 text-[11px] text-red-500">{errors.category.message}</p> : null}
              </div>
            </div>
          </div>
        </FormSection>

        {/* 이미지 (썸네일 좌 + 갤러리 우) */}
        <FormSection title="Images" desc="1 thumbnail + up to 6 gallery images">
          <div className="grid grid-cols-[240px_1fr] items-stretch gap-3.5 max-[640px]:grid-cols-1">
            {/* 썸네일 */}
            <div className="flex flex-col max-[640px]:h-[240px]">
              <p className="mb-1.5 text-[11px] font-bold tracking-[0.3px] text-[#767676]">Thumbnail</p>
              <div className="flex-1">
                <ThumbnailDrop
                  value={thumbnailField.value as File | undefined}
                  onChange={thumbnailField.onChange}
                  error={errors.thumbnail?.message}
                />
              </div>
            </div>

            {/* 추가 이미지 */}
            <div className="flex min-w-0 flex-col">
              <p className="mb-1.5 text-[11px] font-bold tracking-[0.3px] text-[#767676]">
                Gallery ({imagesField.value.length}/6)
              </p>
              <div className="min-h-0 flex-1 max-[640px]:aspect-[3/2] max-[640px]:flex-none">
                <GalleryGrid images={imagesField.value} onChange={imagesField.onChange} />
              </div>
            </div>
          </div>
        </FormSection>

        {/* 설명서 */}
        <FormSection title="Instructions" desc="Attach a PDF to reach more builders">
          <InstructionsSection
            value={instructionsField.value}
            onChange={instructionsField.onChange}
            error={errors.instructions?.message}
          />
        </FormSection>

        {/* 가격 */}
        <FormSection title="Price" desc="Download price (optional)">
          <div
            className={`flex items-center gap-2 rounded-xl border bg-white px-3.5 transition-[border-color,box-shadow] ${
              errors.price
                ? 'border-red-400'
                : 'border-[#e5e5e0] focus-within:border-[#0066ff] focus-within:shadow-[0_0_0_3px_rgba(0,102,255,0.12)]'
            }`}>
            <span className="text-[14px] font-semibold text-[#767676]">₩</span>
            <input
              type="text"
              inputMode="numeric"
              placeholder="0"
              {...register('price', { setValueAs: (v: string) => (v === '' ? 0 : Number(v) || 0) })}
              className="flex-1 py-3 text-[14px] text-[#211922] outline-none"
            />
            <span className="shrink-0 text-[12px] text-[#767676]">Leave blank for free</span>
          </div>
          {errors.price ? <p className="mt-1.5 text-[11px] text-red-500">{errors.price.message}</p> : null}
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
    </>
  );
}

// 폼 섹션
function FormSection({ title, desc, children }: { title: string; desc?: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-4 rounded-[18px] border border-[#efefef] bg-white px-[22px] py-5">
      <div>
        <p className="text-[15px] font-bold text-[#211922]">{title}</p>
        {desc ? <p className="mt-0.5 text-[12px] text-[#767676]">{desc}</p> : null}
      </div>
      {children}
    </section>
  );
}

// 썸네일 드롭
function ThumbnailDrop({
  value,
  onChange,
  error
}: {
  value: File | null | undefined;
  onChange: (file: File | null) => void;
  error?: string;
}) {
  // 이미지 미리보기용 임시 URL -> useMemo를 사용하여 부모(RHF) value가 바뀔 때만 재생성되어 동기화
  const previewUrl = useMemo(() => (value ? URL.createObjectURL(value) : null), [value]);
  const inputRef = useRef<HTMLInputElement>(null); // hidden input을 직접 클릭하기 위한 참조

  // previewUrl이 교체되거나 언마운트 시 이전 blob URL을 메모리에서 해제
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  // 파일 선택 핸들러
  const handleFile = (file: File | undefined) => {
    if (!file) return;
    onChange(file);
  };

  // 파일 제거 핸들러
  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation(); // 드롭존 onClick으로 이벤트 버블링 방지
    onChange(null);
  };

  return (
    <div className="flex h-full flex-col">
      <div
        onClick={() => !value && inputRef.current?.click()} // 파일 없을 때만 선택창 열기
        onDragOver={e => e.preventDefault()} // 브라우저는 기본적으로 드롭을 거부하기 때문에 e.preventDefault()으로 허용
        onDrop={e => {
          e.preventDefault();
          handleFile(e.dataTransfer.files[0]); // 드롭된 파일을 직접 꺼냄 (input 불필요)
        }}
        className={`relative aspect-square w-full overflow-hidden rounded-[12px] border-2 transition-colors ${
          error
            ? 'border-red-400 bg-red-50'
            : value
              ? 'cursor-default border-[#0066ff] bg-black'
              : 'cursor-pointer border-dashed border-[#e5e5e0] bg-[#f6f6f3] hover:border-[#0066ff] hover:bg-blue-50'
        }`}>
        <input ref={inputRef} type="file" accept="image/*" hidden onChange={e => handleFile(e.target.files?.[0])} />
        {previewUrl ? (
          <>
            <Image src={previewUrl} alt="thumbnail" fill unoptimized className="object-cover" />
            <button
              type="button"
              onClick={handleRemove}
              className="absolute top-1.5 right-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-[13px] text-white">
              ×
            </button>
            <span className="absolute bottom-1.5 left-1.5 rounded-full bg-[#0066ff] px-2 py-0.5 text-[10px] font-bold text-white">
              Thumbnail
            </span>
          </>
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2 p-6 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-[16px] border-[1.5px] border-[#e5e5e0] bg-white">
              <ImageIcon className="h-[22px] w-[22px] text-[#0066ff]" />
            </div>
            <p className="text-[14px] font-bold text-[#211922]">Upload thumbnail</p>
            <p className="text-[12px] text-[#767676]">Click or drag · JPG, PNG · Max 10MB</p>
          </div>
        )}
      </div>
      {error ? <p className="mt-1.5 text-[11px] text-red-500">{error}</p> : null}
    </div>
  );
}

// 추가 이미지 6칸 고정 그리드 (3×2)
function GalleryGrid({ images, onChange }: { images: File[]; onChange: (files: File[]) => void }) {
  const MAX = 6;
  const inputRef = useRef<HTMLInputElement>(null);

  // 이미지 미리보기용 임시 URL -> useMemo를 사용하여 부모(RHF) value가 바뀔 때만 재생성되어 동기화
  const previews = useMemo(() => images.map(file => URL.createObjectURL(file)), [images]);

  // previews가 교체되거나 언마운트 시 이전 blob URL을 메모리에서 해제
  useEffect(() => {
    return () => previews.forEach(url => URL.revokeObjectURL(url));
  }, [previews]);

  // 파일 선택 핸들러
  const handleFiles = (fileList: FileList | null) => {
    if (!fileList) return;
    const selectedFiles = Array.from(fileList);
    const remainingSlots = MAX - images.length; // 현재 업로드된 수를 뺀 남은 슬롯 수
    const filesToAdd = selectedFiles.slice(0, remainingSlots); // 슬롯 초과분 제거
    onChange([...images, ...filesToAdd]);
  };

  // 파일 제거 핸들러
  const handleRemove = (i: number) => {
    onChange(images.filter((_, idx) => idx !== i));
  };

  return (
    <div className="grid h-full grid-cols-3 grid-rows-2 gap-2">
      {Array.from({ length: MAX }).map((_, i) => {
        const preview = previews[i];
        const isNext = i === images.length;

        // 이미지가 있는 슬로
        if (preview) {
          return (
            <div key={i} className="relative h-full overflow-hidden rounded-[10px] bg-[#efefef]">
              <Image src={preview} alt="" fill unoptimized className="object-cover" />
              <button
                type="button"
                onClick={() => handleRemove(i)}
                className="absolute top-1 right-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-[11px] text-white">
                ×
              </button>
            </div>
          );
        }

        // 이미지 업로드 슬롯
        if (isNext) {
          return (
            <button
              key={i}
              type="button"
              onClick={() => inputRef.current?.click()}
              className="flex h-full cursor-pointer items-center justify-center rounded-[10px] border-2 border-dashed border-[#e5e5e0] bg-[#f6f6f3] text-[#767676] transition-colors hover:border-[#0066ff] hover:text-[#0066ff]">
              <input
                ref={inputRef}
                type="file"
                accept="image/*"
                multiple
                hidden
                onChange={e => handleFiles(e.target.files)}
              />
              <Plus className="h-[18px] w-[18px]" />
            </button>
          );
        }

        // 빈 슬롯
        return <div key={i} className="h-full rounded-[10px] border border-dashed border-[#efefef] bg-[#f6f6f3]" />;
      })}
    </div>
  );
}

// 설명서 섹션
function InstructionsSection({
  value,
  onChange,
  error
}: {
  value: File[];
  onChange: (files: File[]) => void;
  error?: string;
}) {
  const MAX = 2;
  const inputRef = useRef<HTMLInputElement>(null);
  const [activeSlot, setActiveSlot] = useState<number | null>(null);

  const handleClick = (i: number) => {
    setActiveSlot(i);
    inputRef.current?.click();
  };

  // 파일 선택 핸들러
  const handleFile = (file: File | undefined) => {
    if (!file || activeSlot === null) return;
    const next = [...value];
    next[activeSlot] = file;
    onChange(next);
    setActiveSlot(null);
  };

  // 파일 제거 핸들러
  const handleRemove = (i: number) => {
    onChange(value.filter((_, idx) => idx !== i));
  };

  return (
    <div className="space-y-2">
      <input ref={inputRef} type="file" accept=".pdf" hidden onChange={e => handleFile(e.target.files?.[0])} />
      {Array.from({ length: MAX }).map((_, i) => {
        const file = value[i];
        return file ? (
          // 업로드된 파일
          <div key={i} className="flex items-center gap-3 rounded-xl border border-[#e5e5e0] bg-[#f6f6f3] p-3.5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-[#0066ff] text-[11px] font-bold text-white">
              PDF
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="truncate text-[13px] font-semibold text-[#211922]">{file.name}</p>
              <p className="text-[11px] text-[#767676]">{(file.size / 1024 / 1024).toFixed(2)} MB · Instructions</p>
            </div>
            <button
              type="button"
              onClick={() => handleRemove(i)}
              className="text-[13px] font-semibold text-[#767676] transition-colors hover:text-[#211922]">
              Remove
            </button>
          </div>
        ) : (
          // 업로드 슬롯
          <button
            key={i}
            type="button"
            onClick={() => handleClick(i)}
            className="flex w-full cursor-pointer items-center gap-3 rounded-xl border-[1.5px] border-dashed border-[#e5e5e0] bg-white p-3.5 transition-colors hover:border-[#0066ff]">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] border border-[#e5e5e0] bg-[#efefef] text-[11px] font-bold text-[#767676]">
              PDF
            </div>
            <div className="min-w-0 flex-1 text-left">
              <p className="text-[13px] font-semibold text-[#211922]">
                Upload Instructions PDF ({value.length}/{MAX})
              </p>
              <p className="mt-0.5 text-[11px] text-[#767676]">Optional · Up to 2 files</p>
            </div>
            <span className="shrink-0 text-[12px] font-bold text-[#0066ff]">Select File</span>
          </button>
        );
      })}
      {error ? <p className="mt-1.5 text-[11px] text-red-500">{error}</p> : null}
    </div>
  );
}
