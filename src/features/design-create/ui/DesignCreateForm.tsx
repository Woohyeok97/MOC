'use client';

import type { ChangeEvent } from 'react';
import { useController, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
// components
import Link from 'next/link';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { Textarea } from '@/shared/ui/textarea';
// types & schemas
import { DesignCreateFormType, DesignCreateSchema } from '../design-create.schema';
// icons
import { ArrowLeft, FileText, Image as ImageIcon, PlusSquare, Tag, Upload, X } from 'lucide-react';

const CATEGORIES = [
  { id: 'architecture', label: 'Architecture' },
  { id: 'castles', label: 'Castles' },
  { id: 'vehicles', label: 'Vehicles' },
  { id: 'robots', label: 'Robots' },
  { id: 'others', label: 'Others' }
] as const;

const MAX_ADDITIONAL_IMAGES = 6;

export function DesignCreateForm() {
  const { register, handleSubmit, control, formState, getValues } = useForm<DesignCreateFormType>({
    resolver: zodResolver(DesignCreateSchema),
    defaultValues: {
      category: 'architecture'
    }
  });

  // form state
  const { errors } = formState;

  // category field controller
  const { field: categoryField } = useController({
    control,
    name: 'category'
  });

  // thumbnail field controller
  const { field: thumbnailField } = useController({
    control,
    name: 'thumbnail'
  });

  // images field controller
  const { field: imagesField } = useController({
    control,
    name: 'images'
  });

  // 질문
  const thumbnailFiles = Array.isArray(thumbnailField.value) ? thumbnailField.value : [];
  const thumbnailFile = thumbnailFiles[0];
  const additionalImageFiles = Array.isArray(imagesField.value) ? imagesField.value : [];

  const handleThumbnailChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextThumbnail = event.target.files?.[0];
    thumbnailField.onChange(nextThumbnail ? [nextThumbnail] : []);
  };

  const handleAdditionalImagesChange = (event: ChangeEvent<HTMLInputElement>) => {
    const incoming = Array.from(event.target.files ?? []);
    const remainingSlots = Math.max(0, MAX_ADDITIONAL_IMAGES - additionalImageFiles.length);
    const nextImages = [...additionalImageFiles, ...incoming.slice(0, remainingSlots)];
    imagesField.onChange(nextImages);
  };

  // on submit handler
  const onSubmit = handleSubmit(data => {
    console.log(data);
  });

  return (
    <div className="min-h-screen w-full bg-zinc-50 pb-20 md:pb-10">
      {/* 상단 고정 헤더 */}
      <header className="sticky top-0 z-50 border-b border-zinc-100 bg-white/80 px-4 py-4 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-4xl items-center justify-between">
          <Link href="/" className="rounded-full p-2 text-zinc-600 transition-colors hover:bg-zinc-100">
            <ArrowLeft className="h-6 w-6" />
          </Link>
          <h1 className="text-lg font-bold text-zinc-900" onClick={() => console.log(getValues())}>
            새 디자인 등록
          </h1>

          <Button
            form="new-design-form"
            type="submit"
            className="h-auto rounded-full bg-[#0066FF] px-6 py-2 text-sm font-bold text-white shadow-md shadow-[#0066FF]/10 hover:bg-[#0052CC]">
            등록
          </Button>
        </div>
      </header>

      {/* 본문 폼 영역 */}
      <main className="mx-auto w-full max-w-4xl p-4 md:p-8">
        <form id="new-design-form" onSubmit={onSubmit} className="space-y-8">
          {/* 섹션 1: 기본 정보 */}
          <section className="space-y-6 rounded-3xl border border-zinc-100 bg-white p-6 shadow-sm md:p-8">
            <h2 className="flex items-center gap-2 text-xl font-bold text-zinc-900">
              <Tag className="h-5 w-5 text-[#0066FF]" />
              기본 정보
            </h2>

            <div className="space-y-4">
              <div>
                <label htmlFor="title" className="mb-1.5 block text-sm font-semibold text-zinc-700">
                  디자인 제목
                </label>
                <Input
                  id="title"
                  name="title"
                  type="text"
                  placeholder="예: 중세 성채 - 블랙 팔콘 요새"
                  className={`h-auto rounded-2xl bg-zinc-50 px-4 py-3 ${
                    errors.title
                      ? 'border-red-500 focus-visible:border-red-500 focus-visible:ring-red-500/20'
                      : 'border-zinc-200 focus-visible:border-[#0066FF] focus-visible:ring-[#0066FF]/20'
                  }`}
                  {...register('title')}
                />
                {errors.title && <p className="mt-1.5 text-xs font-medium text-red-500">{errors.title.message}</p>}
              </div>

              <div>
                <label htmlFor="description" className="mb-1.5 block text-sm font-semibold text-zinc-700">
                  상세 설명
                </label>
                <Textarea
                  id="description"
                  rows={4}
                  placeholder="디자인의 특징, 부품 수, 조립 난이도 등을 설명해주세요."
                  className={`min-h-28 resize-none rounded-2xl bg-zinc-50 px-4 py-3 ${
                    errors.description
                      ? 'border-red-500 focus-visible:border-red-500 focus-visible:ring-red-500/20'
                      : 'border-zinc-200 focus-visible:border-[#0066FF] focus-visible:ring-[#0066FF]/20'
                  }`}
                  {...register('description')}
                />
                {errors.description && (
                  <p className="mt-1.5 text-xs font-medium text-red-500">{errors.description.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="category" className="mb-1.5 block text-sm font-semibold text-zinc-700">
                  카테고리
                </label>
                <Select value={categoryField.value} onValueChange={categoryField.onChange}>
                  <SelectTrigger
                    id="category"
                    className={`h-auto w-full rounded-2xl bg-zinc-50 px-4 py-3 ${
                      errors.category
                        ? 'border-red-500 focus-visible:border-red-500 focus-visible:ring-red-500/20'
                        : 'border-zinc-200 focus-visible:border-[#0066FF] focus-visible:ring-[#0066FF]/20'
                    }`}>
                    <SelectValue placeholder="카테고리를 선택하세요" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(cat => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.category && (
                  <p className="mt-1.5 text-xs font-medium text-red-500">{errors.category.message}</p>
                )}
              </div>
            </div>
          </section>

          {/* 섹션 2: 이미지 등록 */}
          <section className="space-y-6 rounded-3xl border border-zinc-100 bg-white p-6 shadow-sm md:p-8">
            <h2 className="flex items-center gap-2 text-xl font-bold text-zinc-900">
              <ImageIcon className="h-5 w-5 text-[#0066FF]" />
              이미지 등록
            </h2>

            <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
              {/* 대표 썸네일 업로드 */}
              <div>
                <label className="mb-3 block text-sm font-semibold text-zinc-700">대표 썸네일</label>
                <div
                  className={`relative aspect-3/2 overflow-hidden rounded-2xl border-2 border-dashed bg-zinc-50 ${
                    errors.thumbnail ? 'border-red-300 bg-red-50' : 'border-zinc-200'
                  }`}>
                  <label className="absolute inset-0 flex cursor-pointer flex-col items-center justify-center transition-colors hover:bg-zinc-100">
                    <Upload className="mb-2 h-8 w-8 text-zinc-400" />
                    <span className="text-sm font-medium text-zinc-500">
                      {thumbnailFile ? thumbnailFile.name : '이미지 업로드'}
                    </span>
                    <input type="file" accept="image/*" className="hidden" onChange={handleThumbnailChange} />
                  </label>
                </div>
                {errors.thumbnail && (
                  <p className="mt-1.5 text-xs font-medium text-red-500">{errors.thumbnail.message}</p>
                )}
              </div>

              {/* 추가 이미지 업로드 */}
              <div>
                <label className="mb-3 block text-sm font-semibold text-zinc-700">
                  추가 이미지 ({additionalImageFiles.length} / {MAX_ADDITIONAL_IMAGES})
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <label
                    className={`group flex aspect-square cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed bg-zinc-50 transition-colors hover:bg-zinc-100 ${
                      errors.images ? 'border-red-300' : 'border-zinc-200'
                    }`}>
                    <PlusSquare className="h-6 w-6 text-zinc-400 transition-colors group-hover:text-[#0066FF]" />
                    <span className="mt-1 text-[10px] font-medium text-zinc-400">추가</span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={handleAdditionalImagesChange}
                    />
                  </label>

                  {Array.from({ length: Math.max(0, MAX_ADDITIONAL_IMAGES - additionalImageFiles.length - 1) }).map(
                    (_, i) => (
                      <div
                        key={i}
                        className="flex aspect-square items-center justify-center rounded-xl border border-zinc-100 bg-zinc-50/50">
                        <ImageIcon className="h-5 w-5 text-zinc-200" />
                      </div>
                    )
                  )}
                </div>
                {errors.images && <p className="mt-1.5 text-xs font-medium text-red-500">{errors.images.message}</p>}
              </div>
            </div>
          </section>

          {/* 섹션 3: PDF 설명서 등록 */}
          <section className="space-y-6 rounded-3xl border border-zinc-100 bg-white p-6 shadow-sm md:p-8">
            <h2 className="flex items-center gap-2 text-xl font-bold text-zinc-900">
              <FileText className="h-5 w-5 text-[#0066FF]" />
              조립 설명서 (PDF)
            </h2>

            <div className="space-y-4">
              {/* 업로드된 파일 목록 샘플 */}
              <div className="grid grid-cols-1 gap-2">
                <div className="flex items-center gap-4 rounded-2xl border border-zinc-100 bg-zinc-50 p-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-500">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div className="flex-1 overflow-hidden text-left">
                    <p className="truncate text-sm font-bold text-zinc-900">example-instruction.pdf</p>
                    <p className="text-xs text-zinc-500">0.00 MB</p>
                  </div>
                  <button type="button" className="p-2 text-zinc-400 transition-colors hover:text-zinc-600">
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* PDF 업로드 드롭존 */}
              <div className="group relative rounded-2xl border-2 border-dashed border-zinc-200 bg-zinc-50 p-8 transition-all hover:bg-zinc-100/50">
                <label className="flex cursor-pointer flex-col items-center justify-center text-center">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-[#0066FF] shadow-sm transition-transform group-hover:scale-110">
                    <Upload className="h-8 w-8" />
                  </div>
                  <p className="mb-1 text-base font-bold text-zinc-900">PDF 파일 업로드</p>
                  <p className="mb-1 text-sm text-zinc-500">
                    조립 설명서 파일을 드래그하거나 클릭하여 선택하세요. (여러 개 가능)
                  </p>
                  <input type="file" accept=".pdf" multiple className="hidden" />
                </label>
              </div>
            </div>
          </section>
        </form>
      </main>
    </div>
  );
}
