import { getCurrentUser, signOut } from '@/features/auth';
// components
import Image from 'next/image';
import Link from 'next/link';

export async function Header() {
  const user = await getCurrentUser();

  return (
    <header className="bg-background w-full">
      <nav className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="text-foreground text-xl font-extrabold tracking-tighter">
          MOC
        </Link>
        {user ? (
          <div className="flex items-center gap-3">
            {user.avatarUrl ? (
              <Image
                src={user.avatarUrl}
                alt={user.name ? `${user.name} avatar` : 'User avatar'}
                width={32}
                height={32}
                className="h-8 w-8 rounded-full object-cover"
              />
            ) : (
              <div className="bg-muted h-8 w-8 rounded-full" aria-hidden="true" />
            )}
            <span className="text-foreground text-sm font-semibold">{user.name ?? 'Anonymous'}</span>
            <form action={signOut}>
              <button
                type="submit"
                className="text-primary cursor-pointer text-sm font-semibold transition-colors hover:opacity-90">
                Sign Out
              </button>
            </form>
          </div>
        ) : (
          <Link href="/signin" className="text-primary text-sm font-semibold transition-colors hover:opacity-90">
            Sign In
          </Link>
        )}
      </nav>
    </header>
  );
}
