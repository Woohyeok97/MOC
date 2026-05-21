'use client';

import { useEffect, useRef, useState } from 'react';
import { useController, useFormContext, useWatch } from 'react-hook-form';
// types & schemas
import type { DesignEditFormType } from '../design-edit.schema';

const MAX = 2;

// PDF 설명서 업로드 필드 (최대 2개, 유료일 때 필수) — File(신규) | string(기존 path) 처리
export function InstructionsField() {
  const { control, setError, clearErrors, formState } = useFormContext<DesignEditFormType>();
  const { errors, isSubmitted } = formState;

  // instructions 필드 컨트롤러
  const { field: instructionsField } = useController({ control, name: 'instructions' });

  const value: (File | string)[] = instructionsField.value;

  // useWatch로 isFree 구독 — price > 0 대신 사용자 의도를 단일 소스로 참조
  const isFree = useWatch({ control, name: 'isFree' });
  const isPaid = !isFree;

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

  // 활성화된 슬롯
  const [activeSlot, setActiveSlot] = useState<number | null>(null);

  // 슬롯 클릭 시 파일 선택 input 트리거
  const handleClick = (i: number) => {
    setActiveSlot(i);
    inputRef.current?.click();
  };

  // 파일 선택 핸들러 - 선택된 파일을 해당 슬롯에 삽입
  const handleFile = (file: File | undefined) => {
    if (!file || activeSlot === null) return;
    const next = [...value];
    next[activeSlot] = file;
    instructionsField.onChange(next);
    setActiveSlot(null);
  };

  // 파일 제거 핸들러 - 해당 인덱스 PDF 제거
  const handleRemove = (i: number) => {
    instructionsField.onChange(value.filter((_, idx) => idx !== i));
  };

  // superRefine 배열 루트 에러는 .root.message, 필드 에러는 .message에 위치
  const error = (errors.instructions?.root?.message ?? errors.instructions?.message) as string | undefined;

  return (
    <div className="space-y-2">
      <input ref={inputRef} type="file" accept=".pdf" hidden onChange={e => handleFile(e.target.files?.[0])} />
      {Array.from({ length: MAX }).map((_, i) => {
        const item = value[i];
        return item ? (
          <div key={i} className="border-border bg-muted flex items-center gap-3 rounded-xl border p-3.5">
            <div className="bg-primary flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] text-[11px] font-bold text-white">
              PDF
            </div>
            <div className="flex-1 overflow-hidden">
              {/* string이면 "Uploaded PDF" 고정 레이블, File이면 실제 파일명 */}
              <p className="text-surface-dark truncate text-[13px] font-semibold">
                {item instanceof File ? item.name : 'Uploaded PDF'}
              </p>
              <p className="text-muted-foreground text-[11px]">
                {item instanceof File
                  ? `${(item.size / 1024 / 1024).toFixed(2)} MB · Instructions`
                  : 'Previously uploaded · Instructions'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleRemove(i)}
              className="text-muted-foreground hover:text-surface-dark text-[13px] font-semibold transition-colors">
              Remove
            </button>
          </div>
        ) : (
          <button
            key={i}
            type="button"
            onClick={() => handleClick(i)}
            className="border-border bg-card hover:border-primary flex w-full cursor-pointer items-center gap-3 rounded-xl border-[1.5px] border-dashed p-3.5 transition-colors">
            <div className="border-border bg-secondary text-muted-foreground flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] border text-[11px] font-bold">
              PDF
            </div>
            <div className="min-w-0 flex-1 text-left">
              <p className="text-surface-dark text-[13px] font-semibold">
                Upload Instructions PDF ({value.length}/{MAX})
              </p>
              <p className="text-muted-foreground mt-0.5 text-[11px]">
                {isPaid ? 'Required for paid designs' : 'Optional · Up to 2 files'}
              </p>
            </div>
            <span className="text-primary shrink-0 text-[12px] font-bold">Select File</span>
          </button>
        );
      })}
      {error ? <p className="mt-1.5 text-[11px] text-red-500">{error}</p> : null}
    </div>
  );
}
