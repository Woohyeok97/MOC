import { test, expect, type Page } from '@playwright/test';

// 첫 디자인 카드의 제목(이미지 alt)에서 검색어로 쓸 단어를 추출
async function firstDesignTitle(page: Page): Promise<string> {
  const firstCardImage = page.locator('a[href^="/designs/"] img').first();
  return (await firstCardImage.getAttribute('alt')) ?? '';
}

test('제목 검색 시 URL이 갱신되고 결과가 필터링된다', async ({ page }) => {
  await page.goto('/');
  const title = await firstDesignTitle(page);
  const keyword = title.slice(0, 2); // 제목 앞부분 일부

  const searchBox = page.getByPlaceholder('검색');
  await searchBox.fill(keyword);
  await searchBox.press('Enter');

  await expect(page).toHaveURL(/query=/);
  // 매칭된 카드가 최소 1개 이상 표시됨
  await expect(page.locator('a[href^="/designs/"]').first()).toBeVisible();
});

test('엔터 전에는 검색이 실행되지 않는다', async ({ page }) => {
  await page.goto('/');
  const searchBox = page.getByPlaceholder('검색');
  await searchBox.fill('robot');
  // 타이핑만으로는 URL이 바뀌지 않음
  await expect(page).toHaveURL('/');
});

test('쿼리 URL로 직접 진입하면 검색창에 값이 채워지고, 비우면 전체로 복귀한다', async ({ page }) => {
  await page.goto('/?query=robot');
  const searchBox = page.getByPlaceholder('검색');
  await expect(searchBox).toHaveValue('robot');

  await searchBox.fill('');
  await searchBox.press('Enter');
  await expect(page).toHaveURL('/');
});

test('매칭 결과가 없으면 빈 상태 메시지를 보여준다', async ({ page }) => {
  await page.goto('/');
  const searchBox = page.getByPlaceholder('검색');
  await searchBox.fill('존재하지않는검색어zzz999');
  await searchBox.press('Enter');

  await expect(page.getByText('검색 결과가 없어요')).toBeVisible();
});
