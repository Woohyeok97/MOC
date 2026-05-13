// components
import { Sidebar } from '@/widgets/Sidebar';

// 홈 페이지 전용 레이아웃 — Sidebar 포함
// Sidebar를 sticky로 고정하여 콘텐츠 스크롤 시 함께 스크롤되지 않도록 함
export default function WithSidebarLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-full">
      <div className="sticky top-0 h-[calc(100vh-52px)] shrink-0">
        <Sidebar />
      </div>
      <div className="flex-1">{children}</div>
    </div>
  );
}
