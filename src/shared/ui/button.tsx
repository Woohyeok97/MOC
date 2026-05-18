import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { Slot } from 'radix-ui';

import { cn } from '@/shared/lib/utils';

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-[8px] border border-transparent bg-clip-padding text-xs font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-ring active:translate-y-px disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-[#0052cc]',
        outline: 'border-border bg-background text-foreground hover:bg-secondary',
        secondary: 'bg-secondary text-foreground hover:bg-[#d4ccc4]',
        ghost: 'bg-transparent text-foreground hover:bg-muted',
        destructive: 'bg-destructive text-white hover:bg-destructive/80',
        link: 'text-primary underline-offset-4 hover:underline'
      },
      size: {
        default: 'h-8 gap-1.5 px-3.5',
        xs: 'h-6 gap-1 px-2 text-xs',
        sm: 'h-7 gap-1 px-2.5',
        lg: 'h-9 gap-1.5 p-3',
        icon: 'size-8',
        'icon-xs': 'size-6',
        'icon-sm': 'size-7',
        'icon-lg': 'size-9'
      }
    },
    defaultVariants: {
      variant: 'default',
      size: 'default'
    }
  }
);

function Button({
  className,
  variant = 'default',
  size = 'default',
  asChild = false,
  ...props
}: React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot.Root : 'button';

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };

// import * as React from 'react';
// import { cva, type VariantProps } from 'class-variance-authority';
// import { Slot } from 'radix-ui';

// import { cn } from '@/shared/lib/utils';

// const buttonVariants = cva(
//   "group/button inline-flex shrink-0 items-center justify-center rounded-[8px] border border-transparent bg-clip-padding text-xs font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-ring active:translate-y-px disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
//   {
//     variants: {
//       variant: {
//         default: 'bg-primary text-primary-foreground hover:bg-[#0052cc]',
//         outline:
//           'border-border bg-background text-foreground hover:bg-secondary',
//         secondary:
//           'bg-secondary text-foreground hover:bg-[#d4ccc4]',
//         ghost:
//           'bg-transparent text-foreground hover:bg-muted',
//         destructive:
//           'bg-destructive text-white hover:bg-destructive/80',
//         link: 'text-primary underline-offset-4 hover:underline'
//       },
//       size: {
//         default: 'h-8 gap-1.5 px-3.5',
//         xs: 'h-6 gap-1 px-2 text-xs',
//         sm: 'h-7 gap-1 px-2.5',
//         lg: 'h-9 gap-1.5 px-4',
//         icon: 'size-8',
//         'icon-xs': 'size-6',
//         'icon-sm': 'size-7',
//         'icon-lg': 'size-9'
//       }
//     },
//     defaultVariants: {
//       variant: 'default',
//       size: 'default'
//     }
//   }
// );

// function Button({
//   className,
//   variant = 'default',
//   size = 'default',
//   asChild = false,
//   ...props
// }: React.ComponentProps<'button'> &
//   VariantProps<typeof buttonVariants> & {
//     asChild?: boolean;
//   }) {
//   const Comp = asChild ? Slot.Root : 'button';

//   return (
//     <Comp
//       data-slot="button"
//       data-variant={variant}
//       data-size={size}
//       className={cn(buttonVariants({ variant, size, className }))}
//       {...props}
//     />
//   );
// }

// export { Button, buttonVariants };
