import React from 'react';
import { cn } from '@/lib/utils';
import { VariantProps, cva } from 'class-variance-authority';
import { Loader2 } from 'lucide-react';

const spinnerVariants = cva('flex items-center gap-3', {
  variants: {
    show: {
      true: 'flex',
      false: 'hidden',
    },
  },
  defaultVariants: {
    show: true,
  },
});

const loaderVariants = cva('animate-spin', {
  variants: {
    variant: {
      default: 'text-white',
      custom: 'text-red-400',
    },
    size: {
      small: 'h-4 w-4',
      medium: 'h-6 w-6',
      large: 'h-8 w-8',
    },
  },
  defaultVariants: {
    size: 'medium',
    variant: 'default',
  },
});

interface SpinnerContentProps
  extends VariantProps<typeof spinnerVariants>,
    VariantProps<typeof loaderVariants> {
  className?: string;
  children?: React.ReactNode;
  variant?: 'default' | 'custom';
}

export function Spinner({ size, show, variant, children, className }: SpinnerContentProps) {
  return (
    <span className={spinnerVariants({ show })}>
      <Loader2 className={cn(loaderVariants({ size, variant }), className)} />
      <span className={cn(
        'text-sm font-medium',
        variant === 'custom' ? 'text-red-400' : 'text-white'
      )}>
        {children}
      </span>
    </span>
  );
}
