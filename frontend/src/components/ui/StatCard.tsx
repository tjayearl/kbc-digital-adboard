import type { LucideIcon } from 'lucide-react';
import { Card, CardBody } from './Card';

type StatCardProps = {
  label: string;
  value: string;
  detail: string;
  icon: LucideIcon;
};

export function StatCard({ label, value, detail, icon: Icon }: StatCardProps) {
  return (
    <Card>
      <CardBody className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-slate-500">{label}</p>
          <p className="mt-2 text-2xl font-bold text-ink">{value}</p>
          <p className="mt-1 text-sm text-slate-500">{detail}</p>
        </div>
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-navy/10 text-navy">
          <Icon size={22} aria-hidden="true" />
        </span>
      </CardBody>
    </Card>
  );
}
