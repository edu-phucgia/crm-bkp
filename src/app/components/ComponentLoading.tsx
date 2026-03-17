import { Building2 } from 'lucide-react';

interface ComponentLoadingProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'minimal' | 'overlay';
}

export function ComponentLoading({ 
  message = "Đang cập nhật dữ liệu...", 
  size = 'md',
  variant = 'default' 
}: ComponentLoadingProps) {
  
  const isMinimal = variant === 'minimal';
  const isOverlay = variant === 'overlay';
  
  const iconSize = size === 'sm' ? 20 : size === 'lg' ? 44 : 32;

  const containerClasses = isOverlay 
    ? "absolute inset-0 z-50 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm"
    : "flex flex-col items-center justify-center p-12 min-h-[300px] w-full";

  return (
    <div className={containerClasses}>
      {!isMinimal && (
        <div className="relative mb-6">
          <div className="absolute inset-0 rounded-full bg-primary/10 blur-xl animate-pulse" />
          <div className="relative bg-white rounded-xl shadow-lg p-4 border border-slate-50 animate-bounce">
            <Building2 size={iconSize} className="text-primary" />
          </div>
        </div>
      )}
      
      <div className="flex flex-col items-center gap-3">
        <div className="flex gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse [animation-delay:0s]" />
          <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse [animation-delay:0.2s]" />
          <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse [animation-delay:0.4s]" />
        </div>
        <p className="text-slate-500 text-[11px] font-black uppercase tracking-[0.2em] animate-pulse">
          {message}
        </p>
      </div>
    </div>
  );
}
