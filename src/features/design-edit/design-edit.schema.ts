import { z } from 'zod';

export const DESIGN_CATEGORIES = ['architecture', 'castles', 'vehicles', 'robots', 'others'] as const;

// 디자인 수정 스키마 — 파일 필드는 File(신규) | string(기존 path) 유니온
export const DesignEditSchema = z.object({
  title: z.string().trim().min(1, 'Title is required.').max(120, 'Max 120 characters.'),
  description: z.string().trim().min(1, 'Description is required.').max(2000, 'Max 2000 characters.'),
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

// 디자인 수정 폼 타입
export type DesignEditFormType = z.infer<typeof DesignEditSchema>;
