'use client';

import { useFormContext, useWatch } from 'react-hook-form';
// types & schemas
import type { DesignEditFormType } from '../design-edit.schema';

// 가격 필드 (Free 체크박스 포함)
export function PriceField() {
  const { register, setValue, control, trigger, formState } = useFormContext<DesignEditFormType>();
  const { errors } = formState;
  const isFree = useWatch({ control, name: 'isFree' });

  // Free 체크박스 토글 핸들러 — 체크 시 price를 0으로 강제 설정
  const handleFreeToggle = (checked: boolean) => {
    setValue('isFree', checked);
    if (checked) setValue('price', 0);
    if (formState.isSubmitted) trigger(); // isFree 변경시 유효성 재검증 (onSubmit 클릭 이후에만)
  };

  return (
    <div>
      <div className="mb-2 flex items-center">
        <label className="flex cursor-pointer items-center gap-1.5 pl-1 select-none">
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
