import { getCurrentUser } from '@/features/auth/auth.api';
import { DesignCreateForm } from '@/features/design-create/ui/DesignCreateForm';
import { redirect } from 'next/navigation';

export default async function DesignCreatePage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/signin');
  }

  return <DesignCreateForm />;
}
