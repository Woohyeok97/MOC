// 작품 수정 폼 Zod 스키마
import { z } from 'zod';

export const DESIGN_CATEGORIES = ['architecture', 'castles', 'vehicles', 'robots', 'others'] as const;

// 디자인 수정 폼 스키마 — 파일 필드는 File(신규) | string(기존 path) 유니온
export const DesignEditSchema = z
  .object({
    title: z.string().trim().min(1, 'Title is required.').max(120, 'Max 120 characters.'),
    description: z.string().trim().min(1, 'Description is required.').max(2000, 'Max 2000 characters.'),

    // 클라이언트 전용 — 유료/무료 전환 의도를 표현. superRefine에서 price/instructions 검증 기준으로 사용
    isFree: z.boolean(),

    // register('price', { setValueAs }) 와 짝 — 빈 입력은 0으로 변환 후 검증
    price: z.number().min(0, 'Price must be 0 or more.'),

    // useController
    category: z.enum(DESIGN_CATEGORIES, { error: () => 'Please select a category.' }),

    // useController — File(신규 업로드) 또는 string(기존 스토리지 path)
    thumbnail: z.union([
      z
        .custom<File>(file => file instanceof File, 'Thumbnail is required.')
        .refine(file => file.type.startsWith('image/'), 'Only image files are allowed.')
        .refine(file => file.size <= 10 * 1024 * 1024, 'Max file size is 10MB.'),
      z.string().min(1, 'Thumbnail is required.')
    ]),

    // useController — File 또는 기존 path 혼합 배열 (최대 6)
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

    // useController — File 또는 기존 path 혼합 배열 (최대 2), 유료일 때 필수
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
  })
  .superRefine((data, ctx) => {
    // 유료(!isFree)일 때 가격 및 instructions 검증 — price > 0 대신 isFree를 단일 소스로 사용
    if (!data.isFree) {
      if (data.price === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['price'],
          message: 'Price must be greater than 0 for paid designs.'
        });
      }
      if (data.instructions.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['instructions'],
          message: 'Instructions PDF is required for paid designs.'
        });
      }
    }
  });

// 디자인 수정 폼 타입
export type DesignEditFormType = z.infer<typeof DesignEditSchema>;
