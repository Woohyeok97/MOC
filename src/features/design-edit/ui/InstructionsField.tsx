'use client';

import { useRef } from 'react';
import { useController, useFormContext, useWatch } from 'react-hook-form';
// types & schemas
import type { DesignEditFormType } from '../design-edit.schema';

const MAX = 2;

// PDF 설명서 업로드 필드 (최대 2개, 유료일 때 필수) — File(신규) | string(기존 path) 처리
export function InstructionsField() {
  const { control, formState } = useFormContext<DesignEditFormType>();
  const { errors } = formState;

  // instructions 필드 컨트롤러
  const { field: instructionsField } = useController({ control, name: 'instructions' });

  // instructions 필드 input Ref
  const inputRef = useRef<HTMLInputElement>(null);

  // 점진적 공개: 업로드된 파일 수 + 빈 슬롯 1개 (최대 MAX)
  const visibleCount = Math.min(instructionsField.value.length + 1, MAX);

  // useWatch로 isFree 구독 — price > 0 대신 사용자 의도를 단일 소스로 참조
  const isFree = useWatch({ control, name: 'isFree' });
  const isPaid = !isFree;

  // 파일 선택 핸들러 - 선택된 파일을 배열 끝에 추가
  const handleFile = (file: File | undefined) => {
    if (!file) return;
    instructionsField.onChange([...instructionsField.value, file]);
    if (inputRef.current) inputRef.current.value = '';
  };

  // 파일 제거 핸들러 - 해당 인덱스 PDF 제거
  const handleRemove = (i: number) => {
    instructionsField.onChange(instructionsField.value.filter((_, idx) => idx !== i));
  };

  return (
    <div className="space-y-2">
      <input ref={inputRef} type="file" accept=".pdf" hidden onChange={e => handleFile(e.target.files?.[0])} />

      {Array.from({ length: visibleCount }).map((_, i) => {
        const item = instructionsField.value[i];
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
            onClick={() => inputRef.current?.click()}
            className="border-border bg-card hover:border-primary flex w-full cursor-pointer items-center gap-3 rounded-xl border-[1.5px] border-dashed p-3.5 transition-colors">
            <div className="border-border bg-secondary text-muted-foreground flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] border text-[11px] font-bold">
              PDF
            </div>
            <div className="min-w-0 flex-1 text-left">
              <p className="text-surface-dark text-[13px] font-semibold">
                Upload Instructions PDF ({instructionsField.value.length}/{MAX})
              </p>
              <p className="text-muted-foreground mt-0.5 text-[11px]">
                {isPaid ? 'Required for paid designs' : 'Optional · Up to 2 files'}
              </p>
            </div>
            <span className="text-primary shrink-0 text-[12px] font-bold">Select File</span>
          </button>
        );
      })}

      {errors.instructions?.message ? (
        <p className="mt-1.5 text-[11px] text-red-500">{errors.instructions.message}</p>
      ) : errors.instructions?.[0]?.message ? (
        <p className="mt-1.5 text-[11px] text-red-500">{errors.instructions[0].message}</p>
      ) : null}
    </div>
  );
}
