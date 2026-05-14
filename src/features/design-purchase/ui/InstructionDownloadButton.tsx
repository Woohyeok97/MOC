'use client';

// mutations
import { useGetInstructionsMutation } from '../purchase.mutate';
// components
import { Button } from '@/shared/ui/button';

export function InstructionDownloadButton({ designId }: { designId: string }) {
  const { mutate, isPending } = useGetInstructionsMutation({
    onSuccess: (urls) => urls.forEach((url) => window.open(url, '_blank'))
  });

  return (
    <Button size="lg" className="w-full" onClick={() => mutate(designId)} disabled={isPending}>
      {isPending ? '준비 중...' : 'Get Instructions'}
    </Button>
  );
}
