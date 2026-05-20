// 썸네일 업로드 섹션 (드래그앤드롭 지원)
'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useController, useFormContext } from 'react-hook-form';
import Image from 'next/image';
// icons
import { ImageIcon } from 'lucide-react';
// types
import type { DesignCreateFormType } from '../design-create.schema';

export function ThumbnailSection() {
  const {
    control,
    formState: { errors },
  } = useFormContext<DesignCreateFormType>();
  const { field } = useController({ control, name: 'thumbnail' });

  const value = field.value as File | undefined;
  const inputRef = useRef<HTMLInputElement>(null);

  // 이미지 미리보기용 임시 URL — value가 바뀔 때만 재생성
  const previewUrl = useMemo(() => (value ? URL.createObjectURL(value) : null), [value]);

  // previewUrl 교체 or 언마운트 시 blob URL 해제
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const handleFile = (file: File | undefined) => {
    if (!file) return;
    field.onChange(file);
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    field.onChange(null);
  };

  const error = errors.thumbnail?.message as string | undefined;

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
          error
            ? 'border-red-400 bg-red-50'
            : value
              ? 'cursor-default border-primary bg-black'
              : 'cursor-pointer border-dashed border-border bg-muted hover:border-primary hover:bg-blue-50'
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
            <span className="absolute bottom-1.5 left-1.5 rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-white">
              Thumbnail
            </span>
          </>
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2 p-6 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-[16px] border-[1.5px] border-border bg-card">
              <ImageIcon className="h-[22px] w-[22px] text-primary" />
            </div>
            <p className="text-[14px] font-bold text-surface-dark">Upload thumbnail</p>
            <p className="text-[12px] text-muted-foreground">Click or drag · JPG, PNG · Max 10MB</p>
          </div>
        )}
      </div>
      {error ? <p className="mt-1.5 text-[11px] text-red-500">{error}</p> : null}
    </div>
  );
}
