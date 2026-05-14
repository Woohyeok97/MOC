'use client';

import { useMutation, type UseMutationOptions } from '@tanstack/react-query';
import { purchaseDesign, getInstructionUrls } from './purchase.actions';

type PurchaseMutationOptions = UseMutationOptions<void, Error, string>;
type GetInstructionsMutationOptions = UseMutationOptions<string[], Error, string>;

export function usePurchaseDesignMutation(options?: PurchaseMutationOptions) {
  return useMutation<void, Error, string>({
    mutationFn: (designId) => purchaseDesign(designId),
    ...options
  });
}

export function useGetInstructionsMutation(options?: GetInstructionsMutationOptions) {
  return useMutation<string[], Error, string>({
    mutationFn: (designId) => getInstructionUrls(designId),
    ...options
  });
}
