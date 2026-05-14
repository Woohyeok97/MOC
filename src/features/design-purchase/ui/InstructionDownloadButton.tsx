'use client';

// mutations
import { useGetInstructionMutation } from '../purchase.mutate';
// components
import { Button } from '@/shared/ui/button';

interface Props {
  designId: string;
  index: number;
  total: number;
}

export function InstructionDownloadButton({ designId, index, total }: Props) {
  const { mutate, isPending } = useGetInstructionMutation({
    onSuccess: (url) => window.open(url, '_blank'),
  });

  const label = total > 1 ? `Instructions ${index + 1}` : 'Get Instructions';

  return (
    <Button size="lg" className="w-full" onClick={() => mutate({ designId, index })} disabled={isPending}>
      {isPending ? '준비 중...' : label}
    </Button>
  );
}
