'use client';

import { useState, createContext, useContext } from 'react';
import { cn } from '@/shared/lib/utils';

// Tabs context
const TabsContext = createContext<{
  activeValue: string;
  onChange: (value: string) => void;
} | null>(null);

function useTabsContext() {
  const context = useContext(TabsContext);
  if (!context) throw new Error('Tabs 컴포넌트 내부에서만 사용할 수 있어요.');
  return context;
}

interface TabsProps {
  defaultValue: string;
  className?: string;
  children: React.ReactNode;
}

function Tabs({ defaultValue, className, children }: TabsProps) {
  const [activeValue, setActiveValue] = useState(defaultValue);

  return (
    <TabsContext.Provider value={{ activeValue, onChange: setActiveValue }}>
      <div className={cn('flex flex-col', className)}>{children}</div>
    </TabsContext.Provider>
  );
}

function TabsList({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div role="tablist" className={cn('flex w-full items-center border-b', className)}>
      {children}
    </div>
  );
}

function TabsTrigger({ value, className, children }: { value: string; className?: string; children: React.ReactNode }) {
  const { activeValue, onChange } = useTabsContext();
  const isActive = activeValue === value;

  return (
    <button
      role="tab"
      aria-selected={isActive}
      onClick={() => onChange(value)}
      className={cn(
        'group relative flex cursor-pointer items-center gap-1.5 px-0 py-4 text-sm font-medium transition-colors',
        // 활성 표시기 (하단 underline)
        'after:bg-foreground after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:opacity-0 after:transition-opacity',
        isActive ? 'text-foreground after:opacity-100' : 'text-muted-foreground hover:text-foreground',
        className
      )}>
      {children}
    </button>
  );
}

function TabsContent({ value, className, children }: { value: string; className?: string; children: React.ReactNode }) {
  const { activeValue } = useTabsContext();
  if (activeValue !== value) return null;

  return <div className={cn('outline-none', className)}>{children}</div>;
}

export { Tabs, TabsList, TabsTrigger, TabsContent };
