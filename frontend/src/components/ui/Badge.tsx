import clsx from 'clsx';

type BadgeTone = 'neutral' | 'navy' | 'gold' | 'teal' | 'danger';

const tones: Record<BadgeTone, string> = {
  neutral: 'bg-slate-100 text-slate-700 ring-slate-200',
  navy: 'bg-navy/10 text-navy ring-navy/20',
  gold: 'bg-gold/15 text-[#73510f] ring-gold/25',
  teal: 'bg-teal/10 text-teal ring-teal/20',
  danger: 'bg-danger/10 text-danger ring-danger/20',
};

type BadgeProps = {
  children: React.ReactNode;
  tone?: BadgeTone;
  className?: string;
};

export function Badge({ children, tone = 'neutral', className }: BadgeProps) {
  return (
    <span className={clsx('inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ring-1', tones[tone], className)}>
      {children}
    </span>
  );
}
