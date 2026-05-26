'use client';

import { useFormContext, useWatch } from 'react-hook-form';
// components
import { Input } from '@/shared/ui/input';
import { Textarea } from '@/shared/ui/textarea';
// types & schemas
import { DESIGN_CATEGORIES, type DesignCreateFormType } from '../design-create.schema';

// 기본 정보 필드 (title, description, category)
export function BasicInfoField() {
  const { register, control, setValue, formState } = useFormContext<DesignCreateFormType>();

  const { errors } = formState;

  // useWatch로 선택된 카테고리 구독 — 이 컴포넌트에만 리렌더 격리하여 최적화 (watch()는 부모까지 전파)
  const selectedCategory = useWatch({ control, name: 'category' });

  return (
    <div className="space-y-4">
      {/* 타이틀 */}
      <div>
        <label className="text-surface-dark mb-2 block text-[13px] font-bold">
          Title <span className="text-red-500">*</span>
        </label>
        <Input placeholder="e.g. Black Falcon Fortress" {...register('title')} />
        {errors.title ? <p className="mt-1.5 text-[11px] text-red-500">{errors.title.message}</p> : null}
      </div>

      {/* 설명 */}
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

      {/* 카테고리 */}
      <div>
        <label className="text-surface-dark mb-2 block text-[13px] font-bold">
          Category <span className="text-red-500">*</span>
        </label>
        <div className="flex flex-wrap gap-2">
          {DESIGN_CATEGORIES.map(category => (
            <button
              key={category}
              type="button"
              onClick={() => setValue('category', category, { shouldValidate: true })}
              className={`rounded-full border-[1.5px] px-3.5 py-1.5 text-[12px] capitalize transition-all ${
                selectedCategory === category
                  ? 'border-primary bg-primary font-bold text-white'
                  : 'border-border bg-card text-surface-dark hover:border-primary font-medium'
              }`}>
              {category}
            </button>
          ))}
        </div>
        {errors.category ? <p className="mt-1.5 text-[11px] text-red-500">{errors.category.message}</p> : null}
      </div>
    </div>
  );
}
