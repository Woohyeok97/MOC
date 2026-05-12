// (main) 그룹 레이아웃 — Header + Sidebar + 콘텐츠 영역

// components
import { Header } from '@/widgets/Header';
import { Sidebar } from '@/widgets/Sidebar';

export default function Layout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="flex h-screen flex-col">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
