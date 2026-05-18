'use client';

import { useMutation, type UseMutationOptions } from '@tanstack/react-query';
import { purchaseDesign, getInstructionUrl } from './purchase.actions';

type PurchaseMutationOptions = UseMutationOptions<void, Error, string>;
type GetInstructionMutationOptions = UseMutationOptions<string, Error, { designId: string; index: number }>;

export function usePurchaseDesignMutation(options?: PurchaseMutationOptions) {
  return useMutation<void, Error, string>({
    mutationFn: (designId) => purchaseDesign(designId),
    ...options
  });
}

export function useGetInstructionMutation(options?: GetInstructionMutationOptions) {
  return useMutation<string, Error, { designId: string; index: number }>({
    mutationFn: ({ designId, index }) => getInstructionUrl(designId, index),
    ...options
  });
}
