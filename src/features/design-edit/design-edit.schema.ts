// 작품 수정 폼 Zod 스키마
import { z } from 'zod';

export const DESIGN_CATEGORIES = ['architecture', 'castles', 'vehicles', 'robots', 'others'] as const;

// 디자인 수정 베이스 스키마 — 파일 필드는 File(신규) | string(기존 path) 유니온
const baseSchema = z.object({
  title: z.string().trim().min(1, 'Title is required.').max(120, 'Max 120 characters.'),
  description: z.string().trim().min(1, 'Description is required.').max(2000, 'Max 2000 characters.'),
  isFree: z.boolean(),
  price: z.number().min(0, 'Price must be 0 or more.'),
  category: z.enum(DESIGN_CATEGORIES, { error: () => 'Please select a category.' }),

  thumbnail: z.union([
    z
      .custom<File>(file => file instanceof File, 'Thumbnail is required.')
      .refine(file => file.type.startsWith('image/'), 'Only image files are allowed.')
      .refine(file => file.size <= 10 * 1024 * 1024, 'Max file size is 10MB.'),
    z.string().min(1, 'Thumbnail is required.')
  ]),

  images: z
    .array(
      z.union([
        z
          .custom<File>(file => file instanceof File)
          .refine(file => file.type.startsWith('image/'), 'Only image files are allowed.')
          .refine(file => file.size <= 10 * 1024 * 1024, 'Max file size is 10MB.'),
        z.string().min(1)
      ])
    )
    .max(6, 'Up to 6 gallery images allowed.'),

  instructions: z
    .array(
      z.union([
        z
          .custom<File>(file => file instanceof File)
          .refine(file => file.type === 'application/pdf', 'Only PDF files are allowed.'),
        z.string().min(1)
      ])
    )
    .max(2, 'Up to 2 PDF files allowed.')
});

// 디자인 수정 폼 스키마
export const DesignEditSchema = baseSchema
  // 유료일 때 price > 0 검증
  .refine(data => data.isFree || data.price > 0, {
    message: 'Price must be greater than 0 for paid designs.',
    path: ['price'],
    // when: isFree, price 필드만 유효하면 실행 (다른 필드 에러와 무관하게)
    when: payload => baseSchema.pick({ isFree: true, price: true }).safeParse(payload.value).success
  })
  // 유료일 때 instructions 필수 검증
  .refine(data => data.isFree || data.instructions.length >= 1, {
    message: 'Instructions PDF is required for paid designs.',
    path: ['instructions'],
    // when: isFree, instructions 필드만 유효하면 실행 (다른 필드 에러와 무관하게)
    when: payload => baseSchema.pick({ isFree: true, instructions: true }).safeParse(payload.value).success
  });

// 디자인 수정 폼 타입
export type DesignEditFormType = z.infer<typeof DesignEditSchema>;
