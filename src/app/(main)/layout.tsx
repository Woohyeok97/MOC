// components
import { Header } from '@/widgets/Header';

// (main) 그룹 레이아웃 — Header + 콘텐츠 영역 (Sidebar는 홈 페이지 전용)
export default function Layout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="flex h-screen flex-col">
      <Header />
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
