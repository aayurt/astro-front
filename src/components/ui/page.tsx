import { cn } from '../../lib/utils';

interface PageProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function Page({ className, children, ...props }: PageProps) {
  return (
    <div
      className={cn(
        'flex flex-col min-h-full bg-white',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
