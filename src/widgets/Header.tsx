'use client';

// components
import { useState, useEffect, type FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Search, LogOut, User } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuItem
} from '@/shared/ui/dropdown';
// store & actions
import { useAuthStore } from '@/features/auth/auth.store';
import { signOut } from '@/features/auth/auth.actions';

// 상단 내비게이션 바 (로고 + 검색 + 아바타 드롭다운)
export function Header() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchValue, setSearchValue] = useState(searchParams.get('query') ?? '');
  const user = useAuthStore(state => state.user);

  // URL 변화(뒤로가기 등)에 따라 검색창 입력값을 동기화
  useEffect(() => {
    setSearchValue(searchParams.get('query') ?? '');
  }, [searchParams]);

  // 엔터(폼 submit) 시 현재 입력값을 URL 쿼리 파라미터에 반영 (빈 값이면 파라미터 제거)
  const handleSearch = (event: FormEvent) => {
    event.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    if (searchValue) {
      params.set('query', searchValue);
    } else {
      params.delete('query');
    }
    router.push(`/?${params.toString()}`);
  };

  return (
    <header className="flex h-13 shrink-0 items-center gap-3 border-b border-[#efefef] bg-white px-4">
      {/* 로고 */}
      <Link href="/" className="flex shrink-0 items-center gap-1">
        <span className="text-[20px] leading-none font-bold tracking-[-0.5px] text-[#211922]">MOC</span>
        <span className="bg-primary mb-1 inline-block h-1.5 w-1.5 rounded-full" />
      </Link>

      {/* 검색창 */}
      <form
        onSubmit={handleSearch}
        className="focus-within:border-primary flex flex-1 items-center gap-2 rounded-full border border-transparent bg-[#efefef] px-3.5 py-[7px] transition-all duration-150 focus-within:shadow-[0_0_0_3px_rgba(0,102,255,0.12)]">
        <Search size={15} className="shrink-0 text-[#767676]" />
        <input
          type="text"
          placeholder="검색"
          value={searchValue}
          onChange={event => setSearchValue(event.target.value)}
          className="w-full bg-transparent text-[13px] text-[#211922] outline-none placeholder:text-[#767676]"
        />
      </form>

      {/* 로그인 상태에 따라 아바타 드롭다운 또는 로그인 버튼 표시 */}
      {user ? (
        <DropdownMenu>
          <DropdownMenuTrigger className="h-8.5 w-8.5 cursor-pointer overflow-hidden rounded-full bg-[#e0e0d9] ring-offset-0 outline-none transition-shadow duration-200 hover:ring-2 hover:ring-surface-dark data-[state=open]:ring-2 data-[state=open]:ring-surface-dark">
            {user.avatarUrl ? (
              <Image
                src={user.avatarUrl}
                alt={user.name ?? ''}
                width={34}
                height={34}
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="flex h-full w-full items-center justify-center text-[11px] font-semibold text-[#62625b]">
                {user.name?.[0] ?? '?'}
              </span>
            )}
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" sideOffset={8}>
            <DropdownMenuLabel className="px-2.5 py-2 text-[13px] font-bold text-[#211922]">
              {user.name}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href={`/profile/${user.id}`} className="flex items-center gap-2.5">
                <User size={15} />내 프로필
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" asChild>
              <form action={signOut}>
                <button type="submit" className="flex w-full items-center gap-2.5">
                  <LogOut size={15} />
                  로그아웃
                </button>
              </form>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        <Button variant="default" size="sm" className="h-8.5" asChild>
          <Link href="/signin">로그인</Link>
        </Button>
      )}
    </header>
  );
}
