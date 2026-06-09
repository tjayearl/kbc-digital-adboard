import { BarChart3, Download } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import { campaigns } from '../../data/mockData';

export function ReportsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-ink">Reports</h2>
        <p className="mt-1 text-sm text-slate-500">Auto-filled campaign report scaffolds for management and clients.</p>
      </div>
      <Card>
        <CardHeader>
          <h3 className="text-lg font-bold text-ink">Report generator</h3>
        </CardHeader>
        <CardBody className="grid gap-4">
          {campaigns.map((campaign) => (
            <article key={campaign.id} className="grid gap-3 rounded-lg border border-slate-200 p-4 md:grid-cols-[1fr_auto] md:items-center">
              <div>
                <p className="font-bold text-ink">{campaign.name}</p>
                <p className="mt-1 text-sm text-slate-500">Planned deliverables, delivered deliverables, and performance summary.</p>
              </div>
              <Button variant="secondary">
                <Download size={18} />
                Export
              </Button>
            </article>
          ))}
        </CardBody>
      </Card>
      <Card>
        <CardBody className="flex items-center gap-3">
          <BarChart3 className="text-navy" size={24} />
          <p className="text-sm font-semibold text-slate-700">Performance metrics will connect here when backend reporting is available.</p>
        </CardBody>
      </Card>
    </div>
  );
}
