// components
import Link from 'next/link';

export function Header() {
  return (
    <header className="bg-background w-full">
      <nav className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="text-foreground text-xl font-extrabold tracking-tighter">
          Design Market
        </Link>
        <Link href="/signin" className="text-primary text-sm font-semibold transition-colors hover:opacity-90">
          Sign In
        </Link>
      </nav>
    </header>
  );
}
