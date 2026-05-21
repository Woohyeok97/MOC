'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useController, useFormContext } from 'react-hook-form';
import Image from 'next/image';
// api
import { createClient } from '@/shared/api/supabase/client';
import { getPublicImageUrl } from '@/shared/api/supabase/storage';
// icons
import { Plus } from 'lucide-react';
// types & schemas
import type { DesignEditFormType } from '../design-edit.schema';

const MAX = 6;

// 갤러리 이미지 그리드 필드 (3×2 고정, 최대 6장) — File(신규) | string(기존 path) 혼합 처리
export function ImageGridField() {
  const { control } = useFormContext<DesignEditFormType>();

  // images 필드 컨트롤러
  const { field: imagesField } = useController({ control, name: 'images' });

  const images: (File | string)[] = imagesField.value;
  const inputRef = useRef<HTMLInputElement>(null);

  // 이미지 미리보기용 URL — File이면 blob URL, string이면 supabase 공개 URL
  const previews = useMemo(
    () =>
      images.map(image =>
        image instanceof File ? URL.createObjectURL(image) : getPublicImageUrl(createClient(), image)
      ),
    [images]
  );

  // blob URL만(사용자가 새롭게 업로드한 File 타입) revoke — string에서 계산한 URL은 revoke 불필요
  useEffect(() => {
    return () => {
      images.forEach((item, i) => {
        if (item instanceof File) URL.revokeObjectURL(previews[i]);
      });
    };
  }, [previews, images]);

  // 파일 선택 핸들러 -> 선택된 파일 목록을 남은 슬롯 수만큼 잘라서 추가
  const handleFiles = (fileList: FileList | null) => {
    if (!fileList) return;
    const selected = Array.from(fileList);
    const remainingSlots = MAX - images.length;
    imagesField.onChange([...images, ...selected.slice(0, remainingSlots)]);
  };

  // 파일 제거 핸들러 -> 해당 인덱스 이미지 제거
  const handleRemove = (i: number) => {
    imagesField.onChange(images.filter((_, idx) => idx !== i));
  };

  return (
    <div className="grid h-full grid-cols-3 grid-rows-2 gap-2">
      {Array.from({ length: MAX }).map((_, i) => {
        const preview = previews[i];
        const isNext = i === images.length;

        if (preview) {
          return (
            <div key={i} className="bg-secondary relative h-full overflow-hidden rounded-[10px]">
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
              className="border-border bg-muted text-muted-foreground hover:border-primary hover:text-primary flex h-full cursor-pointer items-center justify-center rounded-[10px] border-2 border-dashed transition-colors">
              <input
                ref={inputRef}
                type="file"
                accept="image/*"
                multiple
                hidden
                onChange={e => handleFiles(e.target.files)}
              />
              <Plus className="h-4.5 w-4.5" />
            </button>
          );
        }

        return <div key={i} className="border-secondary bg-muted h-full rounded-[10px] border border-dashed" />;
      })}
    </div>
  );
}
