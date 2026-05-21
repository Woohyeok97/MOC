import { notFound, redirect } from 'next/navigation';
import { getAuthSession } from '@/features/auth/auth.api';
import { getDesignByIdRaw } from '@/entities/design/design.api';
import { DesignEditForm } from '@/features/design-edit/ui/DesignEditForm';

type Params = { id: string };

export default async function DesignEditPage({ params }: { params: Promise<Params> }) {
  const { id } = await params;

  const [session, design] = await Promise.all([getAuthSession(), getDesignByIdRaw(id)]);

  if (!session) redirect('/signin');
  if (!design) notFound();

  // 본인 소유 디자인만 수정 가능 — 타인 접근 시 상세 페이지로 리다이렉트
  if (design.authorId !== session.id) redirect(`/designs/${id}`);

  return <DesignEditForm design={design} />;
}
