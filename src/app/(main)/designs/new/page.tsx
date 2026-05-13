import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/features/auth/auth.api';
import { DesignCreateForm } from '@/features/design-create/ui/DesignCreateForm';

export default async function DesignCreatePage() {
  const user = await getCurrentUser(); // 로그인 유저 확인

  // 비로그인 유저는 로그인 페이지로 리다이렉트
  if (!user) {
    redirect('/signin');
  }

  return <DesignCreateForm />;
}
