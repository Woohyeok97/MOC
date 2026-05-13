'use client';

// components
import Link from 'next/link';
import { SlidersHorizontal, Plus, Bell, MessageSquare } from 'lucide-react';
import { Button } from '@/shared/ui/button';

// 좌측 아이콘 사이드바
export function Sidebar() {
  return (
    <aside className="flex w-14 shrink-0 flex-col items-center border-r border-[#efefef] bg-white py-2.5">
      <Button variant="ghost" size="icon-lg" className="hover:bg-secondary rounded-[12px] text-[#767676]">
        <SlidersHorizontal size={20} strokeWidth={2.5} />
      </Button>

      <Button variant="ghost" size="icon-lg" className="hover:bg-secondary rounded-[12px] text-[#767676]" asChild>
        <Link href="/designs/new">
          <Plus size={20} strokeWidth={2.5} />
        </Link>
      </Button>

      <div className="flex-1" />

      <Button variant="ghost" size="icon-lg" className="hover:bg-secondary rounded-[12px] text-[#767676]">
        <Bell size={20} strokeWidth={2.5} />
      </Button>

      <Button variant="ghost" size="icon-lg" className="hover:bg-secondary rounded-[12px] text-[#767676]">
        <MessageSquare size={20} strokeWidth={2.5} />
      </Button>
    </aside>
  );
}
