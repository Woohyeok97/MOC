'use client';

import { ShoppingCart } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { usePurchaseDesignMutation } from '@/features/design-purchase/purchase.mutate';

interface PurchaseButtonProps {
  designId: string;
}

export function PurchaseButton({ designId }: PurchaseButtonProps) {
  const { mutate, isPending } = usePurchaseDesignMutation();

  return (
    <Button size="lg" className="h-auto w-full text-sm" disabled={isPending} onClick={() => mutate(designId)}>
      <ShoppingCart /> {isPending ? '처리 중...' : '구매하기'}
    </Button>
  );
}
