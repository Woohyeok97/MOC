export type { Design, DesignCategory } from '@/generated/prisma/client';

import type { Design } from '@/generated/prisma/client';

export type DesignWithAuthor = Design & { author: { name: string | null } };
