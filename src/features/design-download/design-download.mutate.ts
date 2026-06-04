'use client';

import { useMutation, type UseMutationOptions } from '@tanstack/react-query';
// actions
import { getInstructionUrl } from './design-download.actions';

type GetInstructionMutationOptions = UseMutationOptions<string, Error, { designId: string; index: number }>;

export function useGetInstructionMutation(options?: GetInstructionMutationOptions) {
  return useMutation<string, Error, { designId: string; index: number }>({
    mutationFn: ({ designId, index }) => getInstructionUrl(designId, index),
    ...options
  });
}
