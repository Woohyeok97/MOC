import { z } from 'zod';

export const DESIGN_CATEGORIES = ['architecture', 'castles', 'vehicles', 'robots', 'others'] as const;

const MAX_IMAGE_COUNT = 10;
const MAX_IMAGE_SIZE_MB = 10;
const MAX_IMAGE_SIZE_BYTES = MAX_IMAGE_SIZE_MB * 1024 * 1024;
const IMAGE_MIME_PREFIX = 'image/';

const MAX_PDF_COUNT = 10;
const MAX_PDF_SIZE_MB = 50;
const MAX_PDF_SIZE_BYTES = MAX_PDF_SIZE_MB * 1024 * 1024;
const PDF_MIME_TYPE = 'application/pdf';

function toFileArray(value: unknown): File[] {
  if (value instanceof FileList) return Array.from(value);
  if (Array.isArray(value)) return value.filter(file => file instanceof File);
  return [];
}

export const DesignCreateSchema = z.object({
  title: z.string().trim().min(1, '제목을 입력해주세요.').max(120, '제목은 120자 이하로 입력해주세요.'),
  description: z.string().trim().min(1, '설명을 입력해주세요.').max(2000, '설명은 2000자 이하로 입력해주세요.'),
  category: z.enum(DESIGN_CATEGORIES, {
    error: () => '올바른 카테고리를 선택해주세요.'
  }),
  thumbnail: z
    .custom<File[] | FileList>(value => value instanceof FileList || Array.isArray(value), {
      message: '대표 썸네일 이미지를 선택해주세요.'
    })
    .transform(toFileArray)
    .refine(files => files.length > 0, '대표 썸네일 이미지를 선택해주세요.')
    .refine(files => files.length === 1, '대표 썸네일은 1장만 업로드할 수 있습니다.')
    .refine(
      files => files.every(file => file.type.startsWith(IMAGE_MIME_PREFIX)),
      '대표 썸네일은 이미지 파일만 업로드할 수 있습니다.'
    )
    .refine(
      files => files.every(file => file.size <= MAX_IMAGE_SIZE_BYTES),
      `대표 썸네일은 ${MAX_IMAGE_SIZE_MB}MB 이하여야 합니다.`
    ),
  images: z
    .preprocess(value => (value == null ? [] : value), z.custom<File[] | FileList>(value => value instanceof FileList || Array.isArray(value)))
    .transform(toFileArray)
    .refine(files => files.length <= MAX_IMAGE_COUNT, `이미지는 최대 ${MAX_IMAGE_COUNT}장까지 업로드할 수 있습니다.`)
    .refine(
      files => files.every(file => file.type.startsWith(IMAGE_MIME_PREFIX)),
      '이미지 파일만 업로드할 수 있습니다.'
    )
    .refine(
      files => files.every(file => file.size <= MAX_IMAGE_SIZE_BYTES),
      `이미지 파일은 각각 ${MAX_IMAGE_SIZE_MB}MB 이하여야 합니다.`
    ),
  instructions: z
    .custom<File[] | FileList>(value => value instanceof FileList || Array.isArray(value), {
      message: 'PDF 파일을 선택해주세요.'
    })
    .transform(toFileArray)
    .refine(files => files.length > 0, 'PDF를 1개 이상 업로드해주세요.')
    .refine(files => files.length <= MAX_PDF_COUNT, `PDF는 최대 ${MAX_PDF_COUNT}개까지 업로드할 수 있습니다.`)
    .refine(files => files.every(file => file.type === PDF_MIME_TYPE), 'PDF 파일만 업로드할 수 있습니다.')
    .refine(
      files => files.every(file => file.size <= MAX_PDF_SIZE_BYTES),
      `PDF 파일은 각각 ${MAX_PDF_SIZE_MB}MB 이하여야 합니다.`
    )
});

export type DesignCreateFormType = z.infer<typeof DesignCreateSchema>;
