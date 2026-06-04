import { execSync } from 'child_process';
import path from 'path';

// Playwright globalTeardown 진입점
// Prisma 생성 클라이언트가 import.meta.url을 사용해 esbuild(CJS) 환경과 충돌하므로
// tsx를 통해 별도 프로세스로 실행
export default async function teardown(): Promise<void> {
  const scriptPath = path.join(__dirname, '..', 'scripts', 'cleanup-e2e-designs.ts');
  const rootDir = path.join(__dirname, '..');
  execSync(
    `npx tsx --tsconfig tsconfig.json "${scriptPath}"`,
    { stdio: 'inherit', cwd: rootDir }
  );
}
