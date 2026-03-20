import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/features/auth/api/getCurrentUser';

export default async function SignInPage() {
  const user = await getCurrentUser();

  if (user) {
    redirect('/');
  }

  return (
    <main>
      {/* LoginButton — step 11에서 추가 */}
    </main>
  );
}
