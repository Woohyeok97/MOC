import { z } from 'zod';

// 디자인 카테고리
export const DESIGN_CATEGORIES = ['architecture', 'castles', 'vehicles', 'robots', 'others'] as const;

// 디자인 생성 베이스 스키마
const baseSchema = z.object({
  title: z.string().trim().min(1, 'Title is required.').max(120, 'Max 120 characters.'),
  description: z.string().trim().min(1, 'Description is required.').max(2000, 'Max 2000 characters.'),
  isFree: z.boolean(),
  price: z.number().min(0, 'Price must be 0 or more.'),
  category: z.enum(DESIGN_CATEGORIES, { error: () => 'Please select a category.' }),

  thumbnail: z
    .custom<File>(file => file instanceof File, 'Thumbnail is required.')
    .refine(file => file.type.startsWith('image/'), 'Only image files are allowed.')
    .refine(file => file.size <= 10 * 1024 * 1024, 'Max file size is 10MB.'),

  images: z
    .array(
      z
        .custom<File>(file => file instanceof File)
        .refine(file => file.type.startsWith('image/'), 'Only image files are allowed.')
        .refine(file => file.size <= 10 * 1024 * 1024, 'Max file size is 10MB.')
    )
    .max(6, 'Up to 6 gallery images allowed.'),

  instructions: z
    .array(
      z
        .custom<File>(file => file instanceof File)
        .refine(file => file.type === 'application/pdf', 'Only PDF files are allowed.')
    )
    .max(2, 'Up to 2 PDF files allowed.')
});

// 디자인 생성 스키마
export const DesignCreateSchema = baseSchema
  // 유료일 때 price > 0 검증
  .refine(data => data.isFree || data.price > 0, {
    message: 'Please set a price for paid designs.',
    path: ['price'],
    // when: isFree, price 필드만 유효하면 실행 (다른 필드 에러와 무관하게)
    when: payload => baseSchema.pick({ isFree: true, price: true }).safeParse(payload.value).success
  })
  // 유료일 때 instructions 필수 검증
  .refine(data => data.isFree || data.instructions.length >= 1, {
    message: 'Please upload at least one instruction PDF for paid designs.',
    path: ['instructions'],
    // when: isFree, instructions 필드만 유효하면 실행 (다른 필드 에러와 무관하게)
    when: payload => baseSchema.pick({ isFree: true, instructions: true }).safeParse(payload.value).success
  });

// 디자인 등록 폼 타입
export type DesignCreateFormType = z.infer<typeof DesignCreateSchema>;
