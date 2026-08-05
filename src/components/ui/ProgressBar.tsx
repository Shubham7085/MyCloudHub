import { HTMLAttributes, forwardRef } from 'react';
import { cn } from '../../lib/utils';
import { motion } from 'motion/react';

export interface ProgressBarProps extends HTMLAttributes<HTMLDivElement> {
  value: number;
  max?: number;
  indicatorColor?: string;
  showLabel?: boolean;
}

export const ProgressBar = forwardRef<HTMLDivElement, ProgressBarProps>(
  ({ className, value, max = 100, indicatorColor = 'bg-primary', showLabel = false, ...props }, ref) => {
    const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

    return (
      <div className={cn("w-full", className)} {...props} ref={ref}>
        <div className="relative h-2 w-full overflow-hidden rounded-full bg-muted">
          <motion.div
            className={cn("h-full w-full flex-1 rounded-full", indicatorColor)}
            initial={{ x: '-100%' }}
            animate={{ x: `-${100 - percentage}%` }}
            transition={{ type: 'spring', bounce: 0, duration: 0.8 }}
          />
        </div>
        {showLabel && (
          <div className="mt-1 flex justify-end text-xs text-muted-foreground font-medium">
            {Math.round(percentage)}%
          </div>
        )}
      </div>
    );
  }
);
ProgressBar.displayName = 'ProgressBar';
