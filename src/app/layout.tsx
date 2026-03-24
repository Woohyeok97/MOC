import type { Metadata } from 'next';
import { Geist, Geist_Mono, Noto_Sans } from 'next/font/google';
import './globals.css';
import { cn } from '@/shared/lib/utils';
import { getCurrentUser } from '@/features/auth';
// components
import { AuthProvider } from '@/features/auth';
import { Footer } from '@/widgets/Footer';
import { Header } from '@/widgets/Header';

const notoSans = Noto_Sans({ variable: '--font-sans' });

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin']
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin']
});

export const metadata: Metadata = {
  title: 'MOC',
  description: 'A marketplace where LEGO creators share building instructions and anyone can download them for free.'
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const user = await getCurrentUser();

  return (
    <html lang="en" className={cn('font-sans', notoSans.variable)}>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <AuthProvider initialUser={user}>
          <div className="bg-background flex min-h-screen flex-col">
            <Header />
            <main className="flex min-h-0 flex-1">{children}</main>
            <Footer />
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
