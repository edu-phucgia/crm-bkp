import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon: LucideIcon;
  iconBg?: string;
}

export function StatCard({ title, value, change, changeType = 'neutral', icon: Icon, iconBg }: StatCardProps) {
  const getChangeColor = () => {
    if (changeType === 'positive') return 'var(--accent)';
    if (changeType === 'negative') return 'var(--destructive)';
    return 'var(--muted-foreground)';
  };

  return (
    <div 
      className="p-6 rounded-lg"
      style={{
        backgroundColor: 'var(--card)',
        boxShadow: 'var(--shadow-card)',
      }}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
            {title}
          </p>
          <p className="mt-2 text-2xl font-semibold" style={{ color: 'var(--foreground)' }}>
            {value}
          </p>
          {change && (
            <p className="mt-2 text-sm" style={{ color: getChangeColor() }}>
              {change}
            </p>
          )}
        </div>
        <div 
          className="w-12 h-12 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: iconBg || 'var(--primary)' }}
        >
          <Icon size={24} strokeWidth={1.5} className="text-white" />
        </div>
      </div>
    </div>
  );
}
