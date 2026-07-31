import React from 'react';

interface PageTransitionProps {
  children: React.ReactNode;
}

export const PageTransition = ({ children }: PageTransitionProps) => {
  return <div className="w-full h-full">{children}</div>;
};

export default PageTransition;