import * as React from 'react';

import { cn } from '@/shared/lib/utils';

function Input({ className, type, ...props }: React.ComponentProps<'input'>) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        'h-11 w-full min-w-0 rounded-[10px] border border-[#91918c] bg-white px-[15px] py-[11px] text-sm text-foreground placeholder:text-muted-foreground outline-none transition-colors file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium focus:border-ring focus:shadow-[0_0_0_2px_rgba(0,102,255,0.15)] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:shadow-[0_0_0_2px_rgba(158,10,10,0.15)]',
        className
      )}
      {...props}
    />
  );
}

export { Input };
