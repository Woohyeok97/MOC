import { GoogleSignInButton } from '@/features/auth/ui/GoogleSignInButton';

export default function SignInPage() {
  return (
    <section className="flex flex-1 items-center justify-center overflow-hidden px-4">
      <div className="border-border bg-card w-full max-w-sm rounded-xl border p-7 shadow-sm md:p-8">
        <div className="mb-7 flex flex-col items-center text-center">
          <div className="bg-primary mb-4 flex h-14 w-14 items-center justify-center rounded-xl">
            <div className="h-7 w-7 rounded-full bg-white" />
          </div>
          <h1 className="mb-2 text-xl font-extrabold tracking-tight md:text-2xl">MOC</h1>
          <p className="text-muted-foreground max-w-[260px] text-sm leading-relaxed">
            Discover and collect the world&apos;s most exceptional digital assets.
          </p>
        </div>

        <div className="space-y-4">
          <GoogleSignInButton />
        </div>

        <div className="border-border mt-8 border-t pt-6">
          <p className="text-muted-foreground text-center text-xs leading-relaxed">
            <span className="block">By continuing, you agree to our</span>
            <span>
              <a href="#" className="text-primary font-medium transition-colors hover:underline">
                Terms of Service
              </a>{' '}
              and{' '}
              <a href="#" className="text-primary font-medium transition-colors hover:underline">
                Privacy Policy
              </a>
              .
            </span>
          </p>
        </div>
      </div>
    </section>
  );
}

// // components
// import { Footer } from '@/widgets/Footer';
// import { GoogleSignInButton } from '@/features/auth';
// import { Header } from '@/widgets/Header';

// export default function SignInPage() {
//   return (
//     <div className="bg-background flex min-h-screen flex-col">
//       {/* <Header /> */}

//       <main className="flex flex-1 items-center justify-center px-4 pt-20 pb-12">
//         <section className="border-border bg-card w-full max-w-sm rounded-xl border p-7 shadow-sm md:p-8">
//           <div className="mb-7 flex flex-col items-center text-center">
//             <div className="bg-primary mb-4 flex h-14 w-14 items-center justify-center rounded-xl">
//               <div className="h-7 w-7 rounded-full bg-white" />
//             </div>
//             <h1 className="mb-2 text-xl font-extrabold tracking-tight md:text-2xl">Design Market</h1>
//             <p className="text-muted-foreground max-w-[260px] text-sm leading-relaxed">
//               Discover and collect the world&apos;s most exceptional digital assets.
//             </p>
//           </div>

//           <div className="space-y-4">
//             <GoogleSignInButton />
//           </div>

//           <div className="border-border mt-8 border-t pt-6">
//             <p className="text-muted-foreground text-center text-xs leading-relaxed">
//               <span className="block">By continuing, you agree to our</span>
//               <span>
//                 <a href="#" className="text-primary font-medium transition-colors hover:underline">
//                   Terms of Service
//                 </a>{' '}
//                 and{' '}
//                 <a href="#" className="text-primary font-medium transition-colors hover:underline">
//                   Privacy Policy
//                 </a>
//                 .
//               </span>
//             </p>
//           </div>
//         </section>
//       </main>

//       {/* <Footer /> */}
//     </div>
//   );
// }
