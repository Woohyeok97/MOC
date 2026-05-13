import type { Metadata } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
import { cn } from '@/shared/lib/utils';
import { getCurrentUser } from '@/features/auth/auth.api';
import { AuthProvider } from '@/features/auth/ui/AuthProvider';
import { QueryProvider } from './query-provider';

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: '--font-sans',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700']
});

export const metadata: Metadata = {
  title: 'MOC',
  description: 'A marketplace where LEGO creators share building instructions and anyone can download them for free.'
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const user = await getCurrentUser();

  return (
    <html lang="en" className={cn('font-sans', plusJakartaSans.variable)}>
      <body className="antialiased">
        <QueryProvider>
          <AuthProvider initialUser={user}>
            <div className="flex min-h-screen flex-col">{children}</div>
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
