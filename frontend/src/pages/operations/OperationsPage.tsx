import { AlertTriangle, CalendarDays, CheckSquare, Clock3, UploadCloud } from 'lucide-react';
import { Badge } from '../../components/ui/Badge';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import { StatCard } from '../../components/ui/StatCard';
import { materialSpecs } from '../../data/mockData';

export function OperationsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-ink">Digital operations</h2>
        <p className="mt-1 text-sm text-slate-500">Phase 1 placeholder for approved briefs moving into execution.</p>
      </div>
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Ready for Execution" value="4" detail="Approved briefs" icon={CheckSquare} />
        <StatCard label="Scheduled" value="3" detail="Calendar entries" icon={CalendarDays} />
        <StatCard label="Live" value="2" detail="Campaigns in market" icon={Clock3} />
        <StatCard label="Delivered" value="7" detail="Proof uploaded" icon={UploadCloud} />
      </section>
      <Card>
        <CardHeader>
          <h3 className="text-lg font-bold text-ink">Material validation checklist</h3>
          <p className="mt-1 text-sm text-slate-500">Digital Ops validates specs only after the brief unlocks.</p>
        </CardHeader>
        <CardBody className="grid gap-3 md:grid-cols-3">
          {['Artwork', 'Video Assets', 'Social Assets'].map((item) => (
            <label key={item} className="flex min-h-14 items-center gap-3 rounded-lg border border-slate-200 px-4">
              <input type="checkbox" className="h-5 w-5 rounded border-slate-300 text-navy focus:ring-gold" />
              <span className="font-semibold text-slate-700">{item}</span>
            </label>
          ))}
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <h3 className="text-lg font-bold text-ink">Material specifications and deadlines</h3>
          <p className="mt-1 text-sm text-slate-500">Pulled from the DAB UI prototype reference.</p>
        </CardHeader>
        <CardBody className="grid gap-4 xl:grid-cols-2">
          {materialSpecs.map((spec) => (
            <article key={spec.id} className="rounded-lg border border-slate-200 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <Badge tone="navy">{spec.category}</Badge>
                  <h4 className="mt-3 font-bold text-ink">{spec.title}</h4>
                  <p className="mt-1 text-sm font-semibold text-[#73510f]">Due: {spec.deadline}</p>
                </div>
              </div>
              <ul className="mt-4 space-y-2">
                {spec.requirements.map((item) => (
                  <li key={item} className="flex gap-2 text-sm text-slate-600">
                    <CheckSquare className="mt-0.5 shrink-0 text-teal" size={16} />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              {spec.warning ? (
                <div className="mt-4 flex gap-2 rounded-lg border border-danger/20 bg-danger/10 p-3 text-sm font-semibold text-danger">
                  <AlertTriangle className="mt-0.5 shrink-0" size={16} />
                  <span>{spec.warning}</span>
                </div>
              ) : null}
            </article>
          ))}
        </CardBody>
      </Card>
    </div>
  );
}
