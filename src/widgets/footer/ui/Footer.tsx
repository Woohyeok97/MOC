// components
import Link from 'next/link';

export function Footer() {
  return (
    <footer className="border-border border-t bg-[#f4f4f2] py-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-center gap-6 px-4 md:flex-row">
        <p className="text-muted-foreground text-sm">© 2026 Design Market. Crafted for curators.</p>
        <div className="flex items-center gap-6">
          <Link href="#" className="text-muted-foreground hover:text-primary text-sm transition-colors">
            Terms of Service
          </Link>
          <Link href="#" className="text-muted-foreground hover:text-primary text-sm transition-colors">
            Privacy Policy
          </Link>
          <Link href="#" className="text-muted-foreground hover:text-primary text-sm transition-colors">
            Cookie Settings
          </Link>
        </div>
      </div>
    </footer>
  );
}
