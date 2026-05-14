'use client';

// mutations
import { usePurchaseDesignMutation } from '../purchase.mutate';
// components
import { Button } from '@/shared/ui/button';

export function PurchaseButton({ designId }: { designId: string }) {
  const { mutate, isPending } = usePurchaseDesignMutation();

  return (
    <Button size="lg" className="w-full" onClick={() => mutate(designId)} disabled={isPending}>
      {isPending ? '처리 중...' : '구매하기'}
    </Button>
  );
}
