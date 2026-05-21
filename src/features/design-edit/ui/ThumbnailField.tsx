'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useController, useFormContext } from 'react-hook-form';
import Image from 'next/image';
// api
import { createClient } from '@/shared/api/supabase/client';
import { getPublicImageUrl } from '@/shared/api/supabase/storage';
// icons
import { ImageIcon } from 'lucide-react';
// types & schemas
import type { DesignEditFormType } from '../design-edit.schema';

// 썸네일 업로드 필드 (드래그앤드롭 지원) — 기존 path(string) 또는 신규 File 처리
export function ThumbnailField() {
  const { control, formState } = useFormContext<DesignEditFormType>();
  const { errors } = formState;

  // thumbnail 필드 컨트롤러
  const { field: thumbnailField } = useController({ control, name: 'thumbnail' });

  const value = thumbnailField.value as File | string | undefined;
  const inputRef = useRef<HTMLInputElement>(null);

  // 이미지 미리보기용 URL — File이면 blob URL, string이면 supabase 공개 URL
  const previewUrl = useMemo(() => {
    if (!value) return null;

    // File이면 blob URL 변환 - 사용자가 새로운 이미지 업로드
    if (value instanceof File) return URL.createObjectURL(value);

    // string이면 스토리지 path로 공개 URL 계산 - 기존 spuabase storage에 업로드된 이미지 (네트워크 요청 없음)
    return getPublicImageUrl(createClient(), value);
  }, [value]);

  // previewUrl 교체 or 언마운트 시 blob URL 해제 — string에서 계산한 URL은 revoke 불필요
  useEffect(() => {
    return () => {
      if (previewUrl && value instanceof File) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl, value]);

  // 파일 선택 핸들러
  const handleFile = (file: File | undefined) => {
    if (!file) return;
    thumbnailField.onChange(file);
  };

  // 썸네일 제거 핸들러 — 이벤트 버블링 차단 후 필드 초기화
  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    thumbnailField.onChange(null);
  };

  return (
    <div className="flex h-full flex-col">
      <div
        onClick={() => !value && inputRef.current?.click()}
        onDragOver={e => e.preventDefault()}
        onDrop={e => {
          e.preventDefault();
          handleFile(e.dataTransfer.files[0]);
        }}
        className={`relative aspect-square w-full overflow-hidden rounded-[12px] border-2 transition-colors ${
          errors.thumbnail?.message
            ? 'border-red-400 bg-red-50'
            : value
              ? 'border-primary cursor-default bg-black'
              : 'border-border bg-muted hover:border-primary cursor-pointer border-dashed hover:bg-blue-50'
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
            <span className="bg-primary absolute bottom-1.5 left-1.5 rounded-full px-2 py-0.5 text-[10px] font-bold text-white">
              Thumbnail
            </span>
          </>
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2 p-6 text-center">
            <div className="border-border bg-card flex h-14 w-14 items-center justify-center rounded-[16px] border-[1.5px]">
              <ImageIcon className="text-primary h-5.5 w-5.5" />
            </div>
            <p className="text-surface-dark text-[14px] font-bold">Upload thumbnail</p>
            <p className="text-muted-foreground text-[12px]">Click or drag · JPG, PNG · Max 10MB</p>
          </div>
        )}
      </div>

      {errors.thumbnail?.message ? (
        <p className="mt-1.5 text-[11px] text-red-500">{errors.thumbnail?.message}</p>
      ) : null}
    </div>
  );
}
