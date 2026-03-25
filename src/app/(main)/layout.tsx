// components
import { Footer } from '@/widgets/Footer';
import { Header } from '@/widgets/Header';
import { Sidebar } from '@/widgets/Sidebar';

export default function Layout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <Sidebar />
      <div className="bg-background mb-16 flex min-h-screen flex-col md:mb-0 md:ml-20">
        <Header />
        <main className="flex min-h-0 flex-1">{children}</main>
        <Footer />
      </div>
    </>
  );
}
