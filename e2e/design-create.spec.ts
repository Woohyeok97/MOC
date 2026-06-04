import { test, expect, type Page } from '@playwright/test';
import path from 'path';

const IMAGE = path.join(__dirname, 'fixtures', 'test-image.png');
const PDF = path.join(__dirname, 'fixtures', 'test.pdf');

// 기본 정보 입력 헬퍼
async function fillBasicInfo(page: Page, opts?: { title?: string; description?: string; category?: string }) {
  const { title = 'E2E 테스트 디자인', description = '테스트용 설명입니다.', category = 'architecture' } = opts ?? {};
  await page.getByPlaceholder('e.g. Black Falcon Fortress').fill(title);
  await page.getByPlaceholder('Describe your creation, techniques, and inspiration...').fill(description);
  await page.getByRole('button', { name: category }).click();
}

// 썸네일 업로드 헬퍼
async function uploadThumbnail(page: Page) {
  await page.locator('input[type="file"][accept="image/*"]:not([multiple])').setInputFiles(IMAGE);
}

// ==================== 정상 경로 ====================

test.describe('정상 경로', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/designs/new');
  });

  test('디자인 등록 후 상세 페이지로 이동한다', async ({ page }) => {
    await fillBasicInfo(page);
    await uploadThumbnail(page);

    await page.getByRole('button', { name: 'Publish' }).click();

    await expect(page.getByRole('button', { name: 'Publishing...' })).toBeVisible();
    await expect(page).toHaveURL(/\/designs\/[^/]+$/, { timeout: 30000 });
  });

  test('업로드된 썸네일을 X 버튼으로 제거하면 빈 업로드 영역으로 돌아간다', async ({ page }) => {
    await uploadThumbnail(page);
    await expect(page.getByAltText('thumbnail')).toBeVisible();

    // aspect-square 컨테이너 내 X 버튼 클릭
    await page.locator('[class*="aspect-square"] button[type="button"]').click();

    await expect(page.getByText('Upload thumbnail')).toBeVisible();
    await expect(page.getByAltText('thumbnail')).not.toBeVisible();
  });

  test('업로드된 PDF를 Remove하면 업로드 슬롯이 다시 표시된다', async ({ page }) => {
    await page.locator('input[type="file"][accept=".pdf"]').setInputFiles(PDF);
    await expect(page.getByRole('button', { name: 'Remove' })).toBeVisible();

    await page.getByRole('button', { name: 'Remove' }).click();

    await expect(page.getByText(/Upload Instructions PDF/)).toBeVisible();
    await expect(page.getByRole('button', { name: 'Remove' })).not.toBeVisible();
  });
});

// ==================== 유효성 오류 ====================

test.describe('유효성 오류', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/designs/new');
  });

  test('Title 미입력 시 오류 메시지가 표시된다', async ({ page }) => {
    await page.getByRole('button', { name: 'Publish' }).click();
    await expect(page.getByText('Title is required.')).toBeVisible();
  });

  test('Title 121자 입력 시 최대 글자 수 오류가 표시된다', async ({ page }) => {
    await page.getByPlaceholder('e.g. Black Falcon Fortress').fill('a'.repeat(121));
    await page.getByRole('button', { name: 'Publish' }).click();
    await expect(page.getByText('Max 120 characters.')).toBeVisible();
  });

  test('Description 미입력 시 오류 메시지가 표시된다', async ({ page }) => {
    await page.getByRole('button', { name: 'Publish' }).click();
    await expect(page.getByText('Description is required.')).toBeVisible();
  });

  test('Category 미선택 시 오류 메시지가 표시된다', async ({ page }) => {
    await page.getByRole('button', { name: 'Publish' }).click();
    await expect(page.getByText('Please select a category.')).toBeVisible();
  });

  test('Thumbnail 미업로드 시 오류 메시지가 표시된다', async ({ page }) => {
    await page.getByRole('button', { name: 'Publish' }).click();
    await expect(page.getByText('Thumbnail is required.')).toBeVisible();
  });
});

// ==================== 경계 케이스 ====================

test.describe('경계 케이스', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/designs/new');
  });

  test('Title 정확히 120자 입력 시 Title 관련 오류가 없다', async ({ page }) => {
    await page.getByPlaceholder('e.g. Black Falcon Fortress').fill('a'.repeat(120));
    await page.getByRole('button', { name: 'Publish' }).click();

    await expect(page.getByText('Title is required.')).not.toBeVisible();
    await expect(page.getByText('Max 120 characters.')).not.toBeVisible();
  });

  test('갤러리 이미지 6장 업로드 후 추가 슬롯(+)이 사라진다', async ({ page }) => {
    const galleryInput = page.locator('input[type="file"][accept="image/*"][multiple]');
    await galleryInput.setInputFiles([IMAGE, IMAGE, IMAGE, IMAGE, IMAGE, IMAGE]);

    await expect(page.getByText('Gallery (6/6)')).toBeVisible();
    // 6장 가득 차면 isNext 슬롯이 사라지므로 갤러리 input이 DOM에서 제거됨
    await expect(galleryInput).not.toBeAttached();
  });

  test('PDF 2개 업로드 후 추가 업로드 슬롯이 사라진다', async ({ page }) => {
    const pdfInput = page.locator('input[type="file"][accept=".pdf"]');
    await pdfInput.setInputFiles(PDF);
    await pdfInput.setInputFiles(PDF);

    await expect(page.getByText(/Upload Instructions PDF/)).not.toBeVisible();
  });

  test('갤러리 이미지 없이 디자인을 등록할 수 있다', async ({ page }) => {
    await fillBasicInfo(page);
    await uploadThumbnail(page);

    await page.getByRole('button', { name: 'Publish' }).click();
    await expect(page).toHaveURL(/\/designs\/[^/]+$/, { timeout: 30000 });
  });
});

// ==================== 인증 상태 ====================

test.describe('인증 상태', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('비로그인 사용자가 등록 페이지에 접근하면 /signin으로 리다이렉트된다', async ({ page }) => {
    await page.goto('/designs/new');
    await expect(page).toHaveURL(/signin/);
  });
});

// ==================== 서버·네트워크 오류 ====================

test.describe('서버·네트워크 오류', () => {
  test('파일 업로드 실패 시 에러 메시지가 표시되고 페이지 이동이 없다', async ({ page }) => {
    await page.goto('/designs/new');
    await fillBasicInfo(page);
    await uploadThumbnail(page);

    // Supabase Storage 요청 차단
    await page.route('**/storage/v1/object/**', route => route.abort());

    await page.getByRole('button', { name: 'Publish' }).click();

    // Publish 버튼이 다시 활성화될 때까지 대기 (isPending=false)
    await expect(page.getByRole('button', { name: 'Publish' })).toBeEnabled({ timeout: 30000 });
    await expect(page).toHaveURL('/designs/new');
    await expect(page.locator('p.text-red-500').last()).toBeVisible();
  });
});
