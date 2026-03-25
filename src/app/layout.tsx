import type { Metadata } from 'next';
import { Geist, Geist_Mono, Noto_Sans } from 'next/font/google';
import './globals.css';
import { cn } from '@/shared/lib/utils';
import { getCurrentUser } from '@/features/auth/auth.api';
import { AuthProvider } from '@/features/auth/ui/AuthProvider';

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
          <div className="flex min-h-screen flex-col">{children}</div>
        </AuthProvider>
      </body>
    </html>
  );
}
