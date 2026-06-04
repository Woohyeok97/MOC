import { test, expect, type Page } from '@playwright/test';
import path from 'path';

const IMAGE = path.join(__dirname, 'fixtures', 'test-image.png');
const PDF = path.join(__dirname, 'fixtures', 'test.pdf');

async function fillBasicInfo(page: Page) {
  await page.getByPlaceholder('e.g. Black Falcon Fortress').fill('E2E 다운로드 테스트 디자인');
  await page.getByPlaceholder('Describe your creation, techniques, and inspiration...').fill('다운로드 테스트용 설명입니다.');
  await page.getByRole('button', { name: 'architecture' }).click();
}

// PDF 1개를 포함한 디자인 생성 → designId 반환
async function createDesignWithPdf(page: Page): Promise<string> {
  await page.goto('/designs/new');
  await fillBasicInfo(page);
  await page.locator('input[type="file"][accept="image/*"]:not([multiple])').setInputFiles(IMAGE);
  await page.locator('input[type="file"][accept=".pdf"]').setInputFiles(PDF);
  await page.getByRole('button', { name: 'Publish' }).click();
  await page.waitForURL(/\/designs\/[0-9a-f-]{36}$/, { timeout: 30000 });
  return page.url().split('/designs/')[1];
}

// PDF 2개를 포함한 디자인 생성 → designId 반환 (edit에서 두 번째 추가)
async function createDesignWithTwoPdfs(page: Page): Promise<string> {
  const designId = await createDesignWithPdf(page);
  await page.goto(`/designs/${designId}/edit`);
  await page.locator('input[type="file"][accept=".pdf"]').setInputFiles(PDF);
  await page.getByRole('button', { name: 'Save' }).click();
  await page.waitForURL(`/designs/${designId}`, { timeout: 30000 });
  return designId;
}

// index 번째 설명서 항목 로케이터
function getInstructionItem(page: Page, index = 0) {
  return page.locator('.rounded-xl.border').filter({ has: page.locator('span:has-text("PDF")') }).nth(index);
}

// ==================== 정상 경로 ====================

test.describe('정상 경로', () => {
  test('소유자가 설명서를 다운로드하면 새 탭이 열린다', async ({ page }) => {
    const designId = await createDesignWithPdf(page);
    await page.goto(`/designs/${designId}`);

    const downloadButton = getInstructionItem(page).getByRole('button');
    await expect(downloadButton).toBeEnabled();

    const popupPromise = page.waitForEvent('popup');
    await downloadButton.click();
    const popup = await popupPromise;
    expect(popup.url()).toBeTruthy();
  });

  // NOTE: viewer(다른 로그인 사용자) 시나리오는 단일 테스트 계정 환경에서 검증이 어렵고,
  // 서버 액션(getInstructionUrl)이 소유 여부를 구분하지 않아 소유자 테스트와 동일한 경로를 탄다.

  test('설명서가 여러 개일 때 각각 별도 탭으로 다운로드된다', async ({ page }) => {
    const designId = await createDesignWithTwoPdfs(page);
    await page.goto(`/designs/${designId}`);

    const popup1Promise = page.waitForEvent('popup');
    await getInstructionItem(page, 0).getByRole('button').click();
    const popup1 = await popup1Promise;

    const popup2Promise = page.waitForEvent('popup');
    await getInstructionItem(page, 1).getByRole('button').click();
    const popup2 = await popup2Promise;

    // 두 파일에 대해 각각 별도 탭이 열렸음을 확인
    expect(popup1).not.toBe(popup2);
  });
});

// ==================== 인증 상태 ====================

test.describe('인증 상태 - 비로그인', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  let designId: string;

  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext({ storageState: 'e2e/.auth/user.json' });
    const page = await context.newPage();
    designId = await createDesignWithPdf(page);
    await context.close();
  });

  test('비로그인 사용자에게는 다운로드 버튼이 잠금 상태로 표시된다', async ({ page }) => {
    await page.goto(`/designs/${designId}`);
    const button = getInstructionItem(page).getByRole('button');
    await expect(button).toBeDisabled();
    await expect(button.locator('svg')).toHaveClass(/lucide-lock-keyhole/);
  });

  test('비로그인 사용자가 잠긴 버튼을 클릭해도 새 탭이 열리지 않는다', async ({ page }) => {
    await page.goto(`/designs/${designId}`);

    const popups: Page[] = [];
    page.on('popup', popup => popups.push(popup));

    await getInstructionItem(page).getByRole('button').click({ force: true });

    expect(popups).toHaveLength(0);
  });
});

// ==================== 경계 케이스 ====================

test.describe('경계 케이스', () => {
  test('다운로드 요청 중에는 버튼이 비활성화된다', async ({ page }) => {
    const designId = await createDesignWithPdf(page);
    await page.goto(`/designs/${designId}`);

    // 서버 액션 응답을 지연해 pending 상태를 유지
    await page.route(`**/designs/${designId}`, async route => {
      if (route.request().method() !== 'POST') return route.continue();
      await new Promise(resolve => setTimeout(resolve, 3000));
      await route.continue();
    });

    const downloadButton = getInstructionItem(page).getByRole('button');
    await downloadButton.click();
    await expect(downloadButton).toBeDisabled();
  });
});

// ==================== 서버·네트워크 오류 ====================

test.describe('서버·네트워크 오류', () => {
  test('서버 액션 실패 시 새 탭이 열리지 않고 버튼이 다시 활성화된다', async ({ page }) => {
    const designId = await createDesignWithPdf(page);
    await page.goto(`/designs/${designId}`);

    await page.route(`**/designs/${designId}`, route => {
      if (route.request().method() !== 'POST') return route.continue();
      return route.fulfill({ status: 500, body: 'Internal Server Error' });
    });

    const popups: Page[] = [];
    page.on('popup', popup => popups.push(popup));

    const downloadButton = getInstructionItem(page).getByRole('button');
    await downloadButton.click();

    await expect(downloadButton).toBeEnabled({ timeout: 10000 });
    expect(popups).toHaveLength(0);
  });
});
