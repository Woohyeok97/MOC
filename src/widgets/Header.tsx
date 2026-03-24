import { getCurrentUser, signOut } from '@/features/auth';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/shared/ui/button';
import { Search } from 'lucide-react';
import { ChevronDown } from 'lucide-react';

export async function Header() {
  const user = await getCurrentUser();

  return (
    <header className="sticky top-0 z-40 hidden items-center gap-4 bg-white px-4 py-3 md:flex">
      <div className="flex-1">
        <div className="group relative">
          <Search className="absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            placeholder="검색"
            className="w-full rounded-full border-none bg-[#E9E9E9] py-2.5 pr-4 pl-12 text-base font-normal transition-all outline-none placeholder:text-zinc-500 focus:bg-[#E1E1E1]"
          />
        </div>
      </div>

      <div className="flex items-center gap-1">
        {user ? (
          <div className="flex items-center gap-3">
            <Link href="#">
              <Image
                src={user.avatarUrl}
                alt={user.name ? `${user.name} avatar` : 'User avatar'}
                width={32}
                height={32}
                className="h-10 w-10 rounded-full object-cover"
              />
            </Link>
            <form action={signOut}>
              <Button
                variant="outline"
                type="submit"
                className="text-primary cursor-pointer text-sm font-semibold transition-colors hover:opacity-90">
                Sign Out
              </Button>
            </form>
            {/* <button className="rounded-full p-2 text-zinc-500 transition-colors hover:bg-zinc-100">
              <ChevronDown className="h-5 w-5" />
            </button> */}
          </div>
        ) : (
          <div className="h-full">
            <Link
              href="/signin"
              className="text-primary h-full text-sm font-semibold transition-colors hover:opacity-90">
              <Button variant="outline">Sign In</Button>
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
// import { getCurrentUser, signOut } from '@/features/auth';
// import Image from 'next/image';
// import Link from 'next/link';

// export async function Header() {
//   const user = await getCurrentUser();
//   return (
//     <header className="bg-background w-full">
//       <nav className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
//         <Link href="/" className="text-foreground text-xl font-extrabold tracking-tighter">
//           MOC
//         </Link>
//         {user ? (
//           <div className="flex items-center gap-3">
//             {user.avatarUrl ? (
//               <Image
//                 src={user.avatarUrl}
//                 alt={user.name ? `${user.name} avatar` : 'User avatar'}
//                 width={32}
//                 height={32}
//                 className="h-8 w-8 rounded-full object-cover"
//               />
//             ) : (
//               <div className="bg-muted h-8 w-8 rounded-full" aria-hidden="true" />
//             )}
//             <span className="text-foreground text-sm font-semibold">{user.name ?? 'Anonymous'}</span>
//             <form action={signOut}>
//               <button
//                 type="submit"
//                 className="text-primary cursor-pointer text-sm font-semibold transition-colors hover:opacity-90">
//                 Sign Out
//               </button>
//             </form>
//           </div>
//         ) : (
//           <Link href="/signin" className="text-primary text-sm font-semibold transition-colors hover:opacity-90">
//             Sign In
//           </Link>
//         )}
//       </nav>
//     </header>
//   );
// }
