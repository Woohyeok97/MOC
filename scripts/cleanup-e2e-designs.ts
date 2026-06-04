import { createClient } from '@supabase/supabase-js';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

const IMAGES_BUCKET = 'Images';
const INSTRUCTIONS_BUCKET = 'Instructions';

async function listAllPaths(
  supabase: ReturnType<typeof createClient>,
  bucket: string,
  prefix: string
): Promise<string[]> {
  const { data, error } = await supabase.storage.from(bucket).list(prefix);
  if (error) throw new Error(`${bucket} 폴더 조회 실패: ${error.message}`);
  if (!data) return [];

  const paths: string[] = [];
  for (const entry of data) {
    const entryPath = `${prefix}/${entry.name}`;
    if (entry.id === null) {
      paths.push(...(await listAllPaths(supabase, bucket, entryPath)));
    } else {
      paths.push(entryPath);
    }
  }
  return paths;
}

async function removeBucketPrefix(
  supabase: ReturnType<typeof createClient>,
  bucket: string,
  prefix: string
): Promise<void> {
  const paths = await listAllPaths(supabase, bucket, prefix);
  if (paths.length === 0) return;
  const { error } = await supabase.storage.from(bucket).remove(paths);
  if (error) throw new Error(`${bucket} 폴더 삭제 실패: ${error.message}`);
}

async function cleanupE2EDesigns(): Promise<void> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const testUserEmail = process.env.TEST_USER_EMAIL!;

  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
  const prisma = new PrismaClient({ adapter });
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  try {
    // Supabase Auth에서 테스트 유저 ID 조회 (User 모델에 email 필드 없음)
    const {
      data: { users: authUsers },
    } = await supabase.auth.admin.listUsers();
    const authUser = authUsers.find(u => u.email === testUserEmail);
    if (!authUser) {
      console.log('테스트 유저를 찾을 수 없습니다.');
      return;
    }

    const designs = await prisma.design.findMany({ where: { authorId: authUser.id } });
    if (designs.length === 0) {
      console.log('정리할 테스트 디자인이 없습니다.');
      return;
    }

    console.log(`테스트 디자인 ${designs.length}개 정리 중...`);

    for (const design of designs) {
      const prefix = `${authUser.id}/${design.id}`;
      await Promise.all([
        removeBucketPrefix(supabase, IMAGES_BUCKET, prefix),
        removeBucketPrefix(supabase, INSTRUCTIONS_BUCKET, prefix),
      ]);
    }

    await prisma.design.deleteMany({ where: { authorId: authUser.id } });
    console.log(`테스트 디자인 ${designs.length}개 삭제 완료`);
  } finally {
    await prisma.$disconnect();
  }
}

cleanupE2EDesigns().catch(err => {
  console.error('정리 실패:', err);
  process.exit(1);
});
