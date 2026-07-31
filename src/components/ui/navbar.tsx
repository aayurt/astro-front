import { cn } from '../../lib/utils';

interface NavbarProps {
  title: string;
  left?: React.ReactNode;
  right?: React.ReactNode;
  className?: string;
}

export function Navbar({ title, left, right, className }: NavbarProps) {
  return (
    <div
      className={cn(
        'flex items-center justify-between px-4 h-12 border-b border-gray-100 bg-white shrink-0',
        className,
      )}
    >
      <div className="flex items-center gap-2 min-w-[80px]">
        {left}
      </div>
      <h1 className="text-base font-semibold text-gray-900 text-center truncate">
        {title}
      </h1>
      <div className="flex items-center gap-2 min-w-[80px] justify-end">
        {right}
      </div>
    </div>
  );
}
