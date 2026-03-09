import type { Metadata } from 'next';
import { Geist, Geist_Mono, Noto_Sans } from 'next/font/google';
import './globals.css';
import { cn } from '@/shared/lib/utils';

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

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn('font-sans', notoSans.variable)}>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>{children}</body>
    </html>
  );
}
