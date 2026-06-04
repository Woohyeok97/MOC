import { test, expect, type Page } from '@playwright/test';
import path from 'path';

const IMAGE = path.join(__dirname, 'fixtures', 'test-image.png');
const PDF = path.join(__dirname, 'fixtures', 'test.pdf');

// 기본 정보 채우기 (create spec과 동일한 placeholder 사용)
async function fillBasicInfo(
  page: Page,
  opts?: { title?: string; description?: string; category?: string }
) {
  const {
    title = 'E2E 수정 테스트 디자인',
    description = '수정 테스트용 설명입니다.',
    category = 'architecture',
  } = opts ?? {};
  await page.getByPlaceholder('e.g. Black Falcon Fortress').fill(title);
  await page
    .getByPlaceholder('Describe your creation, techniques, and inspiration...')
    .fill(description);
  await page.getByRole('button', { name: category }).click();
}

// 무료 기본 디자인 생성 → designId 반환
async function createFreeDesign(page: Page): Promise<string> {
  await page.goto('/designs/new');
  await fillBasicInfo(page);
  await page
    .locator('input[type="file"][accept="image/*"]:not([multiple])')
    .setInputFiles(IMAGE);
  await page.getByRole('checkbox', { name: 'Free' }).check();
  await page.getByRole('button', { name: 'Publish' }).click();
  await page.waitForURL(/\/designs\/[0-9a-f-]{36}$/, { timeout: 30000 });
  const url = page.url();
  return url.split('/designs/')[1];
}

// 갤러리 이미지 n장을 포함한 무료 디자인 생성 → designId 반환
async function createDesignWithGallery(page: Page, count: number): Promise<string> {
  await page.goto('/designs/new');
  await fillBasicInfo(page);
  await page
    .locator('input[type="file"][accept="image/*"]:not([multiple])')
    .setInputFiles(IMAGE);
  const galleryInput = page.locator('input[type="file"][accept="image/*"][multiple]');
  await galleryInput.setInputFiles(Array(count).fill(IMAGE));
  await page.getByRole('checkbox', { name: 'Free' }).check();
  await page.getByRole('button', { name: 'Publish' }).click();
  await page.waitForURL(/\/designs\/[0-9a-f-]{36}$/, { timeout: 30000 });
  return page.url().split('/designs/')[1];
}

// 유료 디자인(썸네일 + PDF 1개) 생성 → designId 반환
async function createPaidDesign(page: Page): Promise<string> {
  await page.goto('/designs/new');
  await fillBasicInfo(page);
  await page
    .locator('input[type="file"][accept="image/*"]:not([multiple])')
    .setInputFiles(IMAGE);
  await page.locator('input[type="file"][accept=".pdf"]').setInputFiles(PDF);
  await page.getByPlaceholder('0').fill('15000');
  await page.getByRole('button', { name: 'Publish' }).click();
  await page.waitForURL(/\/designs\/[0-9a-f-]{36}$/, { timeout: 30000 });
  return page.url().split('/designs/')[1];
}

// ==================== 정상 경로 ====================

test.describe('정상 경로', () => {
  test('기본 정보를 수정하고 저장하면 상세 페이지로 이동한다', async ({ page }) => {
    const designId = await createFreeDesign(page);
    await page.goto(`/designs/${designId}/edit`);

    await page.getByPlaceholder('e.g. Black Falcon Fortress').clear();
    await page.getByPlaceholder('e.g. Black Falcon Fortress').fill('수정된 제목');
    await page
      .getByPlaceholder('Describe your creation, techniques, and inspiration...')
      .clear();
    await page
      .getByPlaceholder('Describe your creation, techniques, and inspiration...')
      .fill('수정된 설명입니다.');
    await page.getByRole('button', { name: 'castles' }).click();

    await page.getByRole('button', { name: 'Save' }).click();

    await expect(page).toHaveURL(`/designs/${designId}`, { timeout: 30000 });
  });

  test('썸네일을 제거하고 새 이미지로 교체 후 저장한다', async ({ page }) => {
    const designId = await createFreeDesign(page);
    await page.goto(`/designs/${designId}/edit`);

    // 기존 썸네일 제거
    await page.locator('[class*="aspect-square"] button[type="button"]').click();
    await expect(page.getByText('Upload thumbnail')).toBeVisible();

    // 새 썸네일 업로드
    await page
      .locator('input[type="file"][accept="image/*"]:not([multiple])')
      .setInputFiles(IMAGE);
    await expect(page.getByAltText('thumbnail')).toBeVisible();

    await page.getByRole('button', { name: 'Save' }).click();
    await expect(page).toHaveURL(`/designs/${designId}`, { timeout: 30000 });
  });

  test('갤러리 이미지 1장을 추가하고 저장하면 기존 이미지와 합산된다', async ({ page }) => {
    const designId = await createDesignWithGallery(page, 3);
    await page.goto(`/designs/${designId}/edit`);

    await expect(page.getByText('Gallery (3/6)')).toBeVisible();
    const galleryInput = page.locator('input[type="file"][accept="image/*"][multiple]');
    await galleryInput.setInputFiles(IMAGE);
    await expect(page.getByText('Gallery (4/6)')).toBeVisible();

    await page.getByRole('button', { name: 'Save' }).click();
    await expect(page).toHaveURL(`/designs/${designId}`, { timeout: 30000 });
  });

  test('갤러리 이미지 1장을 제거하고 저장하면 제거한 이미지가 제외된다', async ({ page }) => {
    const designId = await createDesignWithGallery(page, 4);
    await page.goto(`/designs/${designId}/edit`);

    await expect(page.getByText('Gallery (4/6)')).toBeVisible();
    // 갤러리 그리드(3×2) 안의 첫 번째 이미지 X 버튼 클릭
    await page
      .locator('div.grid-cols-3 div.relative button[type="button"]')
      .first()
      .click();
    await expect(page.getByText('Gallery (3/6)')).toBeVisible();

    await page.getByRole('button', { name: 'Save' }).click();
    await expect(page).toHaveURL(`/designs/${designId}`, { timeout: 30000 });
  });

  test('무료 디자인을 유료로 전환하고 저장한다', async ({ page }) => {
    const designId = await createFreeDesign(page);
    await page.goto(`/designs/${designId}/edit`);

    await page.getByRole('checkbox', { name: 'Free' }).click();
    await page.getByPlaceholder('0').fill('15000');
    await page.locator('input[type="file"][accept=".pdf"]').setInputFiles(PDF);

    await page.getByRole('button', { name: 'Save' }).click();
    await expect(page).toHaveURL(`/designs/${designId}`, { timeout: 30000 });
  });

  test('유료 디자인을 무료로 전환하고 저장한다', async ({ page }) => {
    const designId = await createPaidDesign(page);
    await page.goto(`/designs/${designId}/edit`);

    await page.getByRole('checkbox', { name: 'Free' }).click();

    await page.getByRole('button', { name: 'Save' }).click();
    await expect(page).toHaveURL(`/designs/${designId}`, { timeout: 30000 });
  });

  test('유료 디자인에 설명서 PDF를 추가하고 저장한다', async ({ page }) => {
    const designId = await createPaidDesign(page); // PDF 1개 포함
    await page.goto(`/designs/${designId}/edit`);

    // 두 번째 PDF 추가 (슬롯 1개 남아 있음)
    await page.locator('input[type="file"][accept=".pdf"]').setInputFiles(PDF);

    await page.getByRole('button', { name: 'Save' }).click();
    await expect(page).toHaveURL(`/designs/${designId}`, { timeout: 30000 });
  });

  test('Delete 버튼으로 디자인을 삭제하면 홈으로 이동한다', async ({ page }) => {
    const designId = await createFreeDesign(page);
    await page.goto(`/designs/${designId}/edit`);

    // window.confirm() 자동 수락
    page.on('dialog', dialog => dialog.accept());
    await page.getByRole('button', { name: 'Delete' }).click();

    await expect(page).toHaveURL('/', { timeout: 30000 });
  });
});

// ==================== 인증 상태 ====================

test.describe('인증 상태 - 비로그인', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('비로그인 사용자가 수정 페이지에 직접 접근하면 /signin으로 리다이렉트된다', async ({
    page,
  }) => {
    await page.goto('/designs/00000000-0000-0000-0000-000000000000/edit');
    await expect(page).toHaveURL(/signin/);
  });
});

// ==================== 유효성 오류 ====================

test.describe('유효성 오류', () => {
  let designId: string;

  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext({ storageState: 'e2e/.auth/user.json' });
    const page = await context.newPage();
    designId = await createFreeDesign(page);
    await context.close();
  });

  test.beforeEach(async ({ page }) => {
    await page.goto(`/designs/${designId}/edit`);
  });

  test('제목 필드를 비우고 Save 시 오류 메시지가 표시된다', async ({ page }) => {
    await page.getByPlaceholder('e.g. Black Falcon Fortress').clear();
    await page.getByRole('button', { name: 'Save' }).click();
    await expect(page.getByText('Title is required.')).toBeVisible();
  });

  test('제목 121자 입력 시 최대 글자 수 오류가 표시된다', async ({ page }) => {
    await page.getByPlaceholder('e.g. Black Falcon Fortress').fill('a'.repeat(121));
    await page.getByRole('button', { name: 'Save' }).click();
    await expect(page.getByText('Max 120 characters.')).toBeVisible();
  });

  test('설명 필드를 비우고 Save 시 오류 메시지가 표시된다', async ({ page }) => {
    await page
      .getByPlaceholder('Describe your creation, techniques, and inspiration...')
      .clear();
    await page.getByRole('button', { name: 'Save' }).click();
    await expect(page.getByText('Description is required.')).toBeVisible();
  });

  test('유료 전환 후 가격 미입력 상태로 Save 시 오류 메시지가 표시된다', async ({ page }) => {
    await page.getByRole('checkbox', { name: 'Free' }).click();
    // price는 0인 상태 유지
    await page.getByRole('button', { name: 'Save' }).click();
    await expect(
      page.getByText('Price must be greater than 0 for paid designs.')
    ).toBeVisible();
  });

  test('유료 전환 후 설명서 미첨부 상태로 Save 시 오류 메시지가 표시된다', async ({ page }) => {
    await page.getByRole('checkbox', { name: 'Free' }).click();
    await page.getByPlaceholder('0').fill('15000');
    await page.getByRole('button', { name: 'Save' }).click();
    await expect(
      page.getByText('Instructions PDF is required for paid designs.')
    ).toBeVisible();
  });

  test('PDF가 아닌 파일 업로드 시도 시 에러 메시지가 표시된다', async ({ page }) => {
    await page.getByRole('checkbox', { name: 'Free' }).click();
    // 유료 상태에서 PDF input이 나타남
    await page.locator('input[type="file"][accept=".pdf"]').setInputFiles({
      name: 'test.png',
      mimeType: 'image/png',
      buffer: Buffer.from('fake png content'),
    });
    await page.getByPlaceholder('0').fill('15000');
    await page.getByRole('button', { name: 'Save' }).click();
    await expect(page.getByText('Only PDF files are allowed.')).toBeVisible();
  });

  test('10MB 초과 이미지 업로드 시 에러 메시지가 표시된다', async ({ page }) => {
    const largeBuffer = Buffer.alloc(11 * 1024 * 1024); // 11MB
    await page
      .locator('input[type="file"][accept="image/*"]:not([multiple])')
      .setInputFiles({
        name: 'large.png',
        mimeType: 'image/png',
        buffer: largeBuffer,
      });
    await page.getByRole('button', { name: 'Save' }).click();
    await expect(page.getByText('Max file size is 10MB.')).toBeVisible();
  });
});

// ==================== 경계 케이스 ====================

test.describe('경계 케이스', () => {
  test('갤러리 이미지가 정확히 6장일 때 추가 슬롯이 표시되지 않는다', async ({ page }) => {
    const designId = await createDesignWithGallery(page, 6);
    await page.goto(`/designs/${designId}/edit`);

    await expect(page.getByText('Gallery (6/6)')).toBeVisible();
    const galleryInput = page.locator('input[type="file"][accept="image/*"][multiple]');
    await expect(galleryInput).not.toBeAttached();
  });

  test('설명서가 정확히 2개일 때 추가 슬롯이 표시되지 않는다', async ({ page }) => {
    // PDF 1개짜리 유료 디자인 생성 후 2번째 PDF 추가해서 저장
    const designId = await createPaidDesign(page);
    await page.goto(`/designs/${designId}/edit`);
    await page.locator('input[type="file"][accept=".pdf"]').setInputFiles(PDF);
    await page.getByRole('button', { name: 'Save' }).click();
    await page.waitForURL(`/designs/${designId}`, { timeout: 30000 });

    // PDF 2개 상태로 edit 재진입 — input은 hidden으로 남지만 업로드 슬롯 버튼은 표시되지 않아야 함
    await page.goto(`/designs/${designId}/edit`);
    await expect(page.getByText('Upload Instructions PDF (2/2)')).not.toBeVisible();
  });

  test('설명 정확히 2000자 입력 후 저장하면 에러 없이 저장된다', async ({ page }) => {
    const designId = await createFreeDesign(page);
    await page.goto(`/designs/${designId}/edit`);

    await page
      .getByPlaceholder('Describe your creation, techniques, and inspiration...')
      .fill('a'.repeat(2000));
    await page.getByRole('button', { name: 'Save' }).click();

    await expect(page.getByText('Max 2000 characters.')).not.toBeVisible();
    await expect(page).toHaveURL(`/designs/${designId}`, { timeout: 30000 });
  });

  test('기존 이미지 1장 제거 + 신규 이미지 1장 추가 후 저장하면 혼합 저장된다', async ({
    page,
  }) => {
    const designId = await createDesignWithGallery(page, 3);
    await page.goto(`/designs/${designId}/edit`);

    // 첫 번째 기존 이미지 제거
    await page.locator('div.grid-cols-3 div.relative button[type="button"]').first().click();
    await expect(page.getByText('Gallery (2/6)')).toBeVisible();

    // 새 이미지 1장 추가
    await page.locator('input[type="file"][accept="image/*"][multiple]').setInputFiles(IMAGE);
    await expect(page.getByText('Gallery (3/6)')).toBeVisible();

    await page.getByRole('button', { name: 'Save' }).click();
    await expect(page).toHaveURL(`/designs/${designId}`, { timeout: 30000 });
  });
});

// ==================== 서버·네트워크 오류 ====================

test.describe('서버·네트워크 오류', () => {
  test('파일 업로드 실패 시 에러 메시지가 표시되고 페이지 이동이 없다', async ({ page }) => {
    const designId = await createFreeDesign(page);
    await page.goto(`/designs/${designId}/edit`);

    // 새 이미지 추가
    await page.locator('input[type="file"][accept="image/*"][multiple]').setInputFiles(IMAGE);

    // Supabase Storage 업로드 차단
    await page.route('**/storage/v1/object/**', route => route.abort());

    await page.getByRole('button', { name: 'Save' }).click();

    await expect(page.getByRole('button', { name: 'Save' })).toBeEnabled({ timeout: 30000 });
    await expect(page).toHaveURL(`/designs/${designId}/edit`);
    await expect(page.locator('p.text-red-500')).toBeVisible();
  });

  test('DB 저장 실패 시 에러 메시지가 표시되고 페이지 이동이 없다', async ({ page }) => {
    const designId = await createFreeDesign(page);
    await page.goto(`/designs/${designId}/edit`);

    // Next.js 서버 액션 차단 (POST to current page URL)
    await page.route(`**/designs/${designId}/edit`, route =>
      route.fulfill({ status: 500, body: 'Internal Server Error' })
    );

    await page.getByRole('button', { name: 'Save' }).click();

    await expect(page.getByRole('button', { name: 'Save' })).toBeEnabled({ timeout: 30000 });
    await expect(page).toHaveURL(`/designs/${designId}/edit`);
    await expect(page.locator('p.text-red-500')).toBeVisible();
  });

  test('삭제 실패 시 에러 메시지가 표시되고 홈으로 이동하지 않는다', async ({ page }) => {
    const designId = await createFreeDesign(page);
    await page.goto(`/designs/${designId}/edit`);

    // 서버 액션 차단
    await page.route(`**/designs/${designId}/edit`, route =>
      route.fulfill({ status: 500, body: 'Internal Server Error' })
    );

    page.on('dialog', dialog => dialog.accept());
    await page.getByRole('button', { name: 'Delete' }).click();

    await expect(page.getByRole('button', { name: 'Delete' })).toBeEnabled({ timeout: 30000 });
    await expect(page).not.toHaveURL('/');
    await expect(page.locator('p.text-red-500')).toBeVisible();
  });
});
