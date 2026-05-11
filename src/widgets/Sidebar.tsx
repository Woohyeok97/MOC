import Link from 'next/link';
import { Home, Filter, PlusSquare, Bell, Settings, Search, User } from 'lucide-react';

export function Sidebar() {
  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="fixed top-0 left-0 z-50 hidden h-full w-20 flex-col items-center border-r border-zinc-100 bg-white py-4 md:flex">
        <Link href="/" className="mb-2 rounded-full p-3 transition-colors hover:bg-zinc-100">
          <svg viewBox="0 0 24 24" className="h-8 w-8 fill-[#E60023]">
            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.08 3.16 9.41 7.63 11.17-.1-.95-.19-2.41.04-3.45.21-.94 1.35-5.71 1.35-5.71s-.34-.69-.34-1.71c0-1.61.93-2.81 2.09-2.81 1 0 1.48.75 1.48 1.64 0 1-.64 2.5-.96 3.89-.27 1.17.59 2.12 1.74 2.12 2.09 0 3.7-2.21 3.7-5.39 0-2.82-2.03-4.79-4.92-4.79-3.35 0-5.32 2.51-5.32 5.11 0 1.01.39 2.1.88 2.7.1.12.11.22.08.33-.09.37-.28 1.13-.32 1.29-.05.21-.16.26-.37.16-1.38-.64-2.24-2.65-2.24-4.27 0-3.47 2.52-6.66 7.27-6.66 3.82 0 6.78 2.72 6.78 6.35 0 3.79-2.39 6.85-5.71 6.85-1.12 0-2.17-.58-2.53-1.27l-.69 2.63c-.25.96-.92 2.16-1.37 2.9C10.07 23.83 11.01 24 12 24c6.63 0 12-5.37 12-12S18.63 0 12 0z" />
          </svg>
        </Link>

        <div className="flex flex-col space-y-2">
          <button className="rounded-full bg-zinc-100 p-3 text-zinc-900 transition-colors">
            <Home className="h-6 w-6 fill-current" />
          </button>
          <button className="rounded-full p-3 text-zinc-500 transition-colors hover:bg-zinc-100">
            <Filter className="h-6 w-6" />
          </button>
          <Link href="/designs/new" className="rounded-full p-3 text-zinc-500 transition-colors hover:bg-zinc-100">
            <PlusSquare className="h-6 w-6" />
          </Link>
        </div>

        <div className="mt-auto flex flex-col space-y-2">
          <button className="relative rounded-full p-3 text-zinc-500 transition-colors hover:bg-zinc-100">
            <Bell className="h-6 w-6" />
            <div className="absolute top-3 right-3 h-2 w-2 rounded-full border-2 border-white bg-[#E60023]" />
          </button>
          <button className="rounded-full p-3 text-zinc-500 transition-colors hover:bg-zinc-100">
            <Settings className="h-6 w-6" />
          </button>
        </div>
      </aside>

      {/* 모바일 화면 바텀 네비게이션 */}
      <nav className="fixed right-0 bottom-0 left-0 z-50 flex h-16 items-center justify-around border-t border-zinc-100 bg-white px-4 md:hidden">
        <button className="p-2 text-zinc-900">
          <Home className="h-6 w-6 fill-current" />
        </button>
        <button className="p-2 text-zinc-500">
          <Search className="h-6 w-6" />
        </button>
        <button className="p-2 text-zinc-500">
          <Filter className="h-6 w-6" />
        </button>
        <Link href="/designs/new" className="p-2 text-zinc-500">
          <PlusSquare className="h-6 w-6" />
        </Link>
        <button className="p-2 text-zinc-500">
          <User className="h-6 w-6" />
        </button>
      </nav>
    </>
  );
}
