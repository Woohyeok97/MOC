import { describe, it, expect, vi, beforeEach } from 'vitest';
// testing
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
// component
import { Header } from './Header';

// next/navigation 모킹: router.push 호출과 searchParams를 제어
const push = vi.fn();
let currentParams = new URLSearchParams();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push }),
  useSearchParams: () => currentParams,
}));

// auth 모킹: user를 null로 두어 로그인 버튼만 렌더 (next/image 분기 회피)
vi.mock('@/features/auth/auth.store', () => ({
  useAuthStore: (selector: (s: { user: null }) => unknown) => selector({ user: null }),
}));

vi.mock('@/features/auth/auth.actions', () => ({
  signOut: vi.fn(),
}));

describe('Header 검색창', () => {
  beforeEach(() => {
    // 각 테스트 전 호출 기록과 쿼리 파라미터 초기화
    push.mockClear();
    currentParams = new URLSearchParams();
  });

  it('검색어 입력 후 Enter를 누르면 query 파라미터가 URL에 반영된다', async () => {
    render(<Header />);
    const input = screen.getByPlaceholderText('검색');

    await userEvent.type(input, 'robot{Enter}');

    expect(push).toHaveBeenCalledTimes(1);
    expect(push).toHaveBeenCalledWith('/?query=robot');
  });

  it('검색어를 입력만 하고 Enter를 누르지 않으면 검색이 실행되지 않는다', async () => {
    render(<Header />);
    const input = screen.getByPlaceholderText('검색');

    await userEvent.type(input, 'robot');

    expect(push).not.toHaveBeenCalled();
  });

  it('기존 검색어를 비우고 Enter를 누르면 query 파라미터가 제거된다', async () => {
    // 초기 검색어가 존재하는 상태로 시작
    currentParams = new URLSearchParams('query=robot');
    render(<Header />);
    const input = screen.getByPlaceholderText('검색');

    // 입력값을 모두 지운 뒤 submit
    await userEvent.clear(input);
    await userEvent.type(input, '{Enter}');

    expect(push).toHaveBeenCalledTimes(1);
    expect(push).toHaveBeenCalledWith('/?');
  });
});
