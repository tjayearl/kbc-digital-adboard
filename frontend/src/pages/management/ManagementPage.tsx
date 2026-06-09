import { Archive, Edit3, Plus } from 'lucide-react';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import { money, rateCard } from '../../data/mockData';

export function ManagementPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-ink">Management</h2>
          <p className="mt-1 text-sm text-slate-500">Admin rate card controls and visibility surfaces.</p>
        </div>
        <Button>
          <Plus size={18} />
          Add Rate Item
        </Button>
      </div>

      <Card>
        <CardHeader>
          <h3 className="text-lg font-bold text-ink">Rate card management</h3>
        </CardHeader>
        <div className="hidden overflow-x-auto lg:block">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-100 bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-5 py-3">Product Name</th>
                <th className="px-5 py-3">Category</th>
                <th className="px-5 py-3">Unit Price</th>
                <th className="px-5 py-3">Version</th>
                <th className="px-5 py-3">Updated</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rateCard.map((item) => (
                <tr key={item.id}>
                  <td className="px-5 py-4 font-bold text-ink">{item.name}</td>
                  <td className="px-5 py-4"><Badge tone="neutral">{item.category}</Badge></td>
                  <td className="px-5 py-4">{money.format(item.unitPrice)}</td>
                  <td className="px-5 py-4">{item.version}</td>
                  <td className="px-5 py-4">{item.updatedAt}</td>
                  <td className="px-5 py-4">
                    <div className="flex justify-end gap-2">
                      <Button variant="secondary" className="h-10 w-10 px-0" aria-label={`Edit ${item.name}`}><Edit3 size={17} /></Button>
                      <Button variant="secondary" className="h-10 w-10 px-0" aria-label={`Archive ${item.name}`}><Archive size={17} /></Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <CardBody className="grid gap-3 lg:hidden">
          {rateCard.map((item) => (
            <article key={item.id} className="rounded-lg border border-slate-200 p-4">
              <Badge tone="neutral">{item.category}</Badge>
              <h3 className="mt-3 font-bold text-ink">{item.name}</h3>
              <p className="mt-1 text-sm text-slate-500">{money.format(item.unitPrice)} per {item.unit} • v{item.version}</p>
              <div className="mt-4 flex gap-2">
                <Button variant="secondary" className="flex-1"><Edit3 size={17} /> Edit</Button>
                <Button variant="secondary" className="flex-1"><Archive size={17} /> Archive</Button>
              </div>
            </article>
          ))}
        </CardBody>
      </Card>
    </div>
  );
}
