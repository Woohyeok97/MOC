// 갤러리 이미지 그리드 섹션 (3×2 고정, 최대 6장)
'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useController, useFormContext } from 'react-hook-form';
import Image from 'next/image';
// icons
import { Plus } from 'lucide-react';
// types
import type { DesignCreateFormType } from '../design-create.schema';

const MAX = 6;

export function ImageGridSection() {
  const { control } = useFormContext<DesignCreateFormType>();
  const { field } = useController({ control, name: 'images' });

  const images: File[] = field.value;
  const inputRef = useRef<HTMLInputElement>(null);

  // 이미지 미리보기용 임시 URL — images가 바뀔 때만 재생성
  const previews = useMemo(() => images.map(file => URL.createObjectURL(file)), [images]);

  // previews 교체 or 언마운트 시 blob URL 해제
  useEffect(() => {
    return () => previews.forEach(url => URL.revokeObjectURL(url));
  }, [previews]);

  const handleFiles = (fileList: FileList | null) => {
    if (!fileList) return;
    const selected = Array.from(fileList);
    const remainingSlots = MAX - images.length;
    field.onChange([...images, ...selected.slice(0, remainingSlots)]);
  };

  const handleRemove = (i: number) => {
    field.onChange(images.filter((_, idx) => idx !== i));
  };

  return (
    <div className="grid h-full grid-cols-3 grid-rows-2 gap-2">
      {Array.from({ length: MAX }).map((_, i) => {
        const preview = previews[i];
        const isNext = i === images.length;

        if (preview) {
          return (
            <div key={i} className="relative h-full overflow-hidden rounded-[10px] bg-secondary">
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

        if (isNext) {
          return (
            <button
              key={i}
              type="button"
              onClick={() => inputRef.current?.click()}
              className="flex h-full cursor-pointer items-center justify-center rounded-[10px] border-2 border-dashed border-border bg-muted text-muted-foreground transition-colors hover:border-primary hover:text-primary">
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

        return <div key={i} className="h-full rounded-[10px] border border-dashed border-secondary bg-muted" />;
      })}
    </div>
  );
}
