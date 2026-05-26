export type { Design, DesignCategory } from '@/generated/prisma/client';

import type { Design } from '@/generated/prisma/client';

export type DesignWithAuthor = Design & { author: { id: string; name: string | null; avatarUrl: string | null } };
