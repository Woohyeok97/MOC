// PDF 설명서 업로드 섹션 (최대 2개, 유료일 때 필수)
'use client';

import { useEffect, useRef, useState } from 'react';
import { useController, useFormContext } from 'react-hook-form';
// types
import type { DesignCreateFormType } from '../design-create.schema';

const MAX = 2;

export function InstructionsSection() {
  const {
    control,
    watch,
    setError,
    clearErrors,
    formState: { errors, isSubmitted },
  } = useFormContext<DesignCreateFormType>();
  const { field } = useController({ control, name: 'instructions' });

  const value: File[] = field.value;
  const price = watch('price');
  const isPaid = price > 0;

  // 첫 제출 이후: 유료인데 instructions 없으면 에러 표시 / 해소 시 클리어
  useEffect(() => {
    if (!isSubmitted) return;
    if (isPaid && value.length === 0) {
      setError('instructions', { type: 'custom', message: 'Instructions PDF is required for paid designs.' });
    } else {
      clearErrors('instructions');
    }
  }, [isPaid, value.length, isSubmitted, setError, clearErrors]);

  const inputRef = useRef<HTMLInputElement>(null);
  const [activeSlot, setActiveSlot] = useState<number | null>(null);

  const handleClick = (i: number) => {
    setActiveSlot(i);
    inputRef.current?.click();
  };

  const handleFile = (file: File | undefined) => {
    if (!file || activeSlot === null) return;
    const next = [...value];
    next[activeSlot] = file;
    field.onChange(next);
    setActiveSlot(null);
  };

  const handleRemove = (i: number) => {
    field.onChange(value.filter((_, idx) => idx !== i));
  };

  // superRefine 배열 루트 에러는 .root.message, 필드 에러는 .message에 위치
  const error = (errors.instructions?.root?.message ?? errors.instructions?.message) as string | undefined;

  return (
    <div className="space-y-2">
      <input ref={inputRef} type="file" accept=".pdf" hidden onChange={e => handleFile(e.target.files?.[0])} />
      {Array.from({ length: MAX }).map((_, i) => {
        const file = value[i];
        return file ? (
          <div key={i} className="flex items-center gap-3 rounded-xl border border-border bg-muted p-3.5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-primary text-[11px] font-bold text-white">
              PDF
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="truncate text-[13px] font-semibold text-surface-dark">{file.name}</p>
              <p className="text-[11px] text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB · Instructions</p>
            </div>
            <button
              type="button"
              onClick={() => handleRemove(i)}
              className="text-[13px] font-semibold text-muted-foreground transition-colors hover:text-surface-dark">
              Remove
            </button>
          </div>
        ) : (
          <button
            key={i}
            type="button"
            onClick={() => handleClick(i)}
            className="flex w-full cursor-pointer items-center gap-3 rounded-xl border-[1.5px] border-dashed border-border bg-card p-3.5 transition-colors hover:border-primary">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] border border-border bg-secondary text-[11px] font-bold text-muted-foreground">
              PDF
            </div>
            <div className="min-w-0 flex-1 text-left">
              <p className="text-[13px] font-semibold text-surface-dark">
                Upload Instructions PDF ({value.length}/{MAX})
              </p>
              <p className="mt-0.5 text-[11px] text-muted-foreground">
                {isPaid ? 'Required for paid designs' : 'Optional · Up to 2 files'}
              </p>
            </div>
            <span className="shrink-0 text-[12px] font-bold text-primary">Select File</span>
          </button>
        );
      })}
      {error ? <p className="mt-1.5 text-[11px] text-red-500">{error}</p> : null}
    </div>
  );
}
