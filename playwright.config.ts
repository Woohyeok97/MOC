import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';

// 테스트 환경변수(.env.local) 로드 — auth.setup.ts에서 Supabase 로그인에 사용
dotenv.config({ path: '.env.local' });

export default defineConfig({
  testDir: './e2e',
  globalTeardown: './e2e/global-teardown.ts',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    // 본 테스트 전에 1회 실행되어 로그인 상태를 e2e/.auth/user.json에 저장
    { name: 'setup', testMatch: /auth\.setup\.ts/ },
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        // setup이 만든 로그인 상태를 모든 테스트가 재사용
        storageState: 'e2e/.auth/user.json',
      },
      dependencies: ['setup'],
    },
  ],
  webServer: {
    command: 'yarn dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
